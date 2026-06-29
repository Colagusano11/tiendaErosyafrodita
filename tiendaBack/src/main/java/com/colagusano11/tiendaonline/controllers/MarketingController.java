package com.colagusano11.tiendaonline.controllers;

import com.colagusano11.tiendaonline.models.InstagramToken;
import com.colagusano11.tiendaonline.services.GeminiMarketingService;
import com.colagusano11.tiendaonline.services.InstagramService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Mono;

import java.time.LocalDateTime;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/marketing")
public class MarketingController {

    private final GeminiMarketingService geminiService;
    private final InstagramService instagramService;

    @PersistenceContext
    private EntityManager em;

    public MarketingController(GeminiMarketingService geminiService, InstagramService instagramService) {
        this.geminiService    = geminiService;
        this.instagramService = instagramService;
    }

    // ─── Generación IA ──────────────────────────────────────────────────

    /**
     * POST /api/admin/marketing/generate
     * Body: { "nombre": "...", "marca": "...", "categoria": "...", "precio": 49.99 }
     */
    @PostMapping("/generate")
    public Mono<ResponseEntity<Map<String, String>>> generateContent(@RequestBody Map<String, Object> body) {
        String nombre    = (String) body.getOrDefault("nombre", "");
        String marca     = (String) body.getOrDefault("marca", "Sin marca");
        String categoria = (String) body.getOrDefault("categoria", "Perfumes");
        double precio    = body.get("precio") instanceof Number
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

    // ─── Instagram: publicar ───────────────────────────────────────────

    /**
     * POST /api/admin/marketing/instagram/publish
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
            .map(result -> result.containsKey("error")
                ? ResponseEntity.internalServerError().body(result)
                : ResponseEntity.ok(result));
    }

    // ─── Instagram: seed inicial del token ──────────────────────────────

    /**
     * POST /api/admin/marketing/instagram/token/seed
     * Carga el primer token (o reemplaza el existente) en BD.
     * Solo debe llamarse una vez en el arranque inicial, o cuando
     * el cron ha fallado y hay que introducir el token manualmente.
     *
     * Body: { "token": "EAAB...", "expiresInDias": 60 }
     */
    @PostMapping("/instagram/token/seed")
    @Transactional
    public ResponseEntity<Map<String, String>> seedToken(@RequestBody Map<String, Object> body) {
        String token = (String) body.getOrDefault("token", "");
        if (token.isBlank()) {
            return ResponseEntity.badRequest()
                .body(Map.of("error", "El campo 'token' es obligatorio"));
        }

        int diasExpiracion = body.get("expiresInDias") instanceof Number
            ? ((Number) body.get("expiresInDias")).intValue() : 60;

        InstagramToken registro = em.find(InstagramToken.class, 1L);
        if (registro == null) {
            registro = new InstagramToken();
        }

        registro.setAccessToken(token);
        registro.setExpiresAt(LocalDateTime.now().plusDays(diasExpiracion));
        registro.setRenovadoAt(LocalDateTime.now());
        registro.setIntentosFallo(0);
        em.merge(registro);

        // Actualizar en memoria inmediatamente
        instagramService.actualizarToken(token);

        return ResponseEntity.ok(Map.of(
            "ok",        "Token guardado correctamente",
            "expira",    LocalDateTime.now().plusDays(diasExpiracion).toString(),
            "diasHasta", String.valueOf(diasExpiracion)
        ));
    }

    // ─── Instagram: estado del token ───────────────────────────────────

    /**
     * GET /api/admin/marketing/instagram/token/status
     * Devuelve el estado del token activo: fecha de caducidad, días restantes,
     * última renovación y número de fallos.
     * Útil para monitorizar desde el panel de admin.
     */
    @GetMapping("/instagram/token/status")
    public ResponseEntity<Map<String, Object>> tokenStatus() {
        InstagramToken registro = em.find(InstagramToken.class, 1L);
        if (registro == null) {
            return ResponseEntity.ok(Map.of(
                "estado",   "SIN_TOKEN",
                "mensaje",  "No hay token en BD. Llama a POST /instagram/token/seed"
            ));
        }

        long diasRestantes = registro.getExpiresAt() != null
            ? java.time.temporal.ChronoUnit.DAYS.between(LocalDateTime.now(), registro.getExpiresAt())
            : -1;

        String estado = diasRestantes > 15 ? "OK"
            : diasRestantes > 0             ? "PROXIMO_A_CADUCAR"
            :                                 "CADUCADO";

        return ResponseEntity.ok(Map.of(
            "estado",          estado,
            "expira",          registro.getExpiresAt() != null ? registro.getExpiresAt().toString() : "desconocido",
            "diasRestantes",   diasRestantes,
            "ultimaRenovacion",registro.getRenovadoAt() != null ? registro.getRenovadoAt().toString() : "nunca",
            "fallosConsecutivos", registro.getIntentosFallo()
        ));
    }
}
