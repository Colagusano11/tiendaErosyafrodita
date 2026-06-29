package com.colagusano11.tiendaonline.controllers;

import com.colagusano11.tiendaonline.services.GoogleShoppingFeedService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Endpoints públicos de feeds para comparadores de precio.
 *
 * GET /api/feeds/google-shopping.xml
 *   — Feed RSS 2.0 con namespace g: compatible con:
 *       Google Merchant Center, Kelkoo, Shopmania, Pricero, Twenga
 *   — Sin autenticación (público por diseño — los comparadores descargan sin token)
 *   — Regenerado automáticamente cada 6h por cron
 *
 * GET /api/feeds/google-shopping/refresh   (solo admin, fuerza regeneración)
 * GET /api/feeds/google-shopping/status    (estado del feed: nº productos, última generación)
 */
@RestController
@RequestMapping("/api/feeds")
public class FeedController {

    private final GoogleShoppingFeedService feedService;

    public FeedController(GoogleShoppingFeedService feedService) {
        this.feedService = feedService;
    }

    /**
     * Feed público que descargan Google Merchant Center, Kelkoo y otros comparadores.
     * La URL que configuras en Google Merchant Center es exactamente esta.
     */
    @GetMapping(value = "/google-shopping.xml", produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<String> googleShoppingFeed() {
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_XML)
            .header("Content-Disposition", "inline; filename=\"google-shopping.xml\"")
            .header("Cache-Control", "public, max-age=21600") // caché 6h en proxies
            .body(feedService.getFeed());
    }

    /**
     * Fuerza una regeneración inmediata del feed.
     * Útil justo después de una importación masiva de productos.
     * Proteger con autenticación de admin en SecurityConfig.
     */
    @PostMapping("/google-shopping/refresh")
    public ResponseEntity<Map<String, Object>> refreshFeed() {
        feedService.generarFeed();
        LocalDateTime generado = feedService.getUltimaGeneracion();
        return ResponseEntity.ok(Map.of(
            "ok",          true,
            "generadoEn",  generado != null ? generado.toString() : "ahora",
            "bytes",       feedService.getFeed().length()
        ));
    }

    /**
     * Estado del feed: última generación y tamaño en bytes.
     */
    @GetMapping("/google-shopping/status")
    public ResponseEntity<Map<String, Object>> feedStatus() {
        LocalDateTime gen = feedService.getUltimaGeneracion();
        int bytes = feedService.getFeed().length();
        return ResponseEntity.ok(Map.of(
            "ultimaGeneracion", gen != null ? gen.toString() : "nunca",
            "bytes",            bytes,
            "kb",              Math.round(bytes / 1024.0),
            "feedUrl",         "/api/feeds/google-shopping.xml"
        ));
    }
}
