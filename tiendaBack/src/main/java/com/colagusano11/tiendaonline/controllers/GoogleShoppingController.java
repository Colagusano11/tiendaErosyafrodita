package com.colagusano11.tiendaonline.controllers;

import com.colagusano11.tiendaonline.services.GoogleShoppingService;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.concurrent.TimeUnit;

/**
 * Expone el feed de Google Merchant Center (Google Shopping).
 *
 * Endpoint público:
 *   GET /api/feed/google-shopping
 *     → RSS 2.0 XML con namespace g: de Google Base
 *     → Cache HTTP de 6 horas (Google refresca como máximo cada 24h)
 *
 * Cómo registrarlo en Google Merchant Center:
 *   1. Merchant Center → Productos → Fuentes de datos → Añadir fuente
 *   2. Tipo: "Feed programado"
 *   3. URL: https://api.erosyafrodita.com/api/feed/google-shopping
 *   4. Frecuencia de actualización: diaria
 *   5. País de destino: España | Idioma: Español | Divisa: EUR
 */
@RestController
@RequestMapping("/api/feed")
@CrossOrigin(origins = "*")
public class GoogleShoppingController {

    private final GoogleShoppingService googleShoppingService;

    // Cache en memoria del XML generado (evita regenerar en cada petición)
    private volatile String cachedXml = null;
    private volatile long cacheTimestamp = 0;
    private static final long CACHE_DURATION_MS = 6 * 60 * 60 * 1000L; // 6 horas

    public GoogleShoppingController(GoogleShoppingService googleShoppingService) {
        this.googleShoppingService = googleShoppingService;
    }

    /**
     * Feed principal de Google Merchant Center.
     * Registra esta URL en: https://merchants.google.com
     */
    @GetMapping(value = "/google-shopping", produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<String> getFeedGoogleShopping() {
        try {
            String xml = obtenerXmlConCache();
            return ResponseEntity.ok()
                    .contentType(MediaType.APPLICATION_XML)
                    .cacheControl(CacheControl.maxAge(6, TimeUnit.HOURS).cachePublic())
                    .body(xml);
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body("<!-- Error generando feed: " + e.getMessage() + " -->");
        }
    }

    /**
     * Fuerza la regeneración del feed (útil después de actualizar precios/stock).
     * Llamar desde el admin o desde un webhook de actualización de productos.
     */
    @PostMapping("/google-shopping/refresh")
    public ResponseEntity<?> refrescarFeed() {
        try {
            cachedXml = null;
            cacheTimestamp = 0;
            String xml = obtenerXmlConCache();
            int numProductos = xml.split("<item>").length - 1;
            return ResponseEntity.ok(java.util.Map.of(
                    "status", "ok",
                    "message", "Feed regenerado correctamente",
                    "productos", numProductos,
                    "url", "/api/feed/google-shopping"
            ));
        } catch (Exception e) {
            return ResponseEntity.internalServerError()
                    .body(java.util.Map.of("error", e.getMessage()));
        }
    }

    // ────────────────────────────────────────────────────────────────────────
    // Cache en memoria
    // ────────────────────────────────────────────────────────────────────────

    private synchronized String obtenerXmlConCache() {
        long ahora = System.currentTimeMillis();
        if (cachedXml == null || (ahora - cacheTimestamp) > CACHE_DURATION_MS) {
            cachedXml = googleShoppingService.generarFeedXml();
            cacheTimestamp = ahora;
        }
        return cachedXml;
    }
}
