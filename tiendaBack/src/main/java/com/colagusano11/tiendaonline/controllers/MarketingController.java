package com.colagusano11.tiendaonline.controllers;

import com.colagusano11.tiendaonline.services.GeminiMarketingService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/marketing")
public class MarketingController {

    private final GeminiMarketingService geminiService;

    public MarketingController(GeminiMarketingService geminiService) {
        this.geminiService = geminiService;
    }

    /**
     * POST /api/admin/marketing/generate
     * Body: { "nombre": "...", "marca": "...", "categoria": "...", "precio": 49.99 }
     * Devuelve: { titulo_seo, descripcion_seo, descripcion_producto, copy_instagram_1/2/3, hashtags }
     */
    @PostMapping("/generate")
    public Mono<ResponseEntity<Map<String, String>>> generateContent(@RequestBody Map<String, Object> body) {
        String nombre = (String) body.getOrDefault("nombre", "");
        String marca = (String) body.getOrDefault("marca", "Sin marca");
        String categoria = (String) body.getOrDefault("categoria", "Perfumes");
        Double precio = body.get("precio") instanceof Number
            ? ((Number) body.get("precio")).doubleValue()
            : 0.0;

        if (nombre.isBlank()) {
            return Mono.just(ResponseEntity.badRequest()
                .body(Map.of("error", "El campo 'nombre' es obligatorio")));
        }

        return geminiService.generarContenidoMarketing(nombre, marca, categoria, precio)
            .map(ResponseEntity::ok)
            .onErrorReturn(ResponseEntity.internalServerError()
                .body(Map.of("error", "Error al llamar a Gemini API")));
    }
}
