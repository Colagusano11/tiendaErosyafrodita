package com.colagusano11.tiendaonline.controllers;

import com.colagusano11.tiendaonline.services.GeminiMarketingService;
import com.colagusano11.tiendaonline.services.InstagramService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/marketing")
public class MarketingController {

    private final GeminiMarketingService geminiService;
    private final InstagramService instagramService;

    public MarketingController(GeminiMarketingService geminiService, InstagramService instagramService) {
        this.geminiService = geminiService;
        this.instagramService = instagramService;
    }

    /**
     * POST /api/admin/marketing/generate
     * Body: { "nombre": "...", "marca": "...", "categoria": "...", "precio": 49.99 }
     */
    @PostMapping("/generate")
    public Mono<ResponseEntity<Map<String, String>>> generateContent(@RequestBody Map<String, Object> body) {
        String nombre    = (String) body.getOrDefault("nombre", "");
        String marca     = (String) body.getOrDefault("marca", "Sin marca");
        String categoria = (String) body.getOrDefault("categoria", "Perfumes");
        Double precio    = body.get("precio") instanceof Number
            ? ((Number) body.get("precio")).doubleValue() : 0.0;

        if (nombre.isBlank()) {
            return Mono.just(ResponseEntity.badRequest()
                .body(Map.of("error", "El campo 'nombre' es obligatorio")));
        }

        return geminiService.generarContenidoMarketing(nombre, marca, categoria, precio)
            .map(ResponseEntity::ok)
            .onErrorReturn(ResponseEntity.internalServerError()
                .body(Map.of("error", "Error al llamar a Gemini API")));
    }

    /**
     * POST /api/admin/instagram/publish
     * Body: { "imagenUrl": "...", "caption": "...", "hashtags": "..." }
     */
    @PostMapping("/instagram/publish")
    public Mono<ResponseEntity<Map<String, String>>> publishToInstagram(@RequestBody Map<String, Object> body) {
        String imagenUrl = (String) body.getOrDefault("imagenUrl", "");
        String caption   = (String) body.getOrDefault("caption", "");
        String hashtags  = (String) body.getOrDefault("hashtags", "");

        if (imagenUrl.isBlank() || caption.isBlank()) {
            return Mono.just(ResponseEntity.badRequest()
                .body(Map.of("error", "imagenUrl y caption son obligatorios")));
        }

        String captionCompleto = caption + "\n\n" + hashtags;

        return instagramService.publicar(imagenUrl, captionCompleto)
            .map(result -> {
                if (result.containsKey("error")) {
                    return ResponseEntity.internalServerError().body(result);
                }
                return ResponseEntity.ok(result);
            });
    }
}
