package com.colagusano11.tiendaonline.services;

import com.colagusano11.tiendaonline.models.InstagramToken;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDateTime;
import java.util.Map;

/**
 * Renueva el token de larga duraciOn de Meta Graph API cada 45 días.
 *
 * Flujo:
 *  1. Lee el token actual desde BD (tabla instagram_token, id=1).
 *  2. Llama a GET /oauth/access_token?grant_type=fb_exchange_token.
 *  3. Guarda el nuevo token en BD y actualiza InstagramService en memoria.
 *  4. Si falla 3 veces seguidas, envía alerta por email al admin.
 *
 * Configurar en application.properties:
 *   instagram.app.id        = ID de la app de Meta (Facebook for Developers)
 *   instagram.app.secret    = Secret de la app de Meta
 *   instagram.admin.email   = email del administrador para alertas
 *
 * El cron corre a las 03:00 del primer día de cada mes y además
 * comprueba si quedan menos de 15 días para caducar (por si el servidor
 * estuvo apagado y saltó un ciclo mensual).
 */
@Service
public class InstagramTokenScheduler {

    private static final Logger log = LoggerFactory.getLogger(InstagramTokenScheduler.class);
    private static final int MAX_FALLOS = 3;
    private static final int DIAS_RENOVACION_ANTICIPADA = 15;

    @Value("${instagram.app.id}")
    private String appId;

    @Value("${instagram.app.secret}")
    private String appSecret;

    @Value("${instagram.admin.email:admin@erosyafrodita.com}")
    private String adminEmail;

    @PersistenceContext
    private EntityManager em;

    private final WebClient webClient;
    private final InstagramService instagramService;
    private final EmailService emailService;

    public InstagramTokenScheduler(
            WebClient.Builder builder,
            InstagramService instagramService,
            EmailService emailService) {
        this.webClient       = builder.baseUrl("https://graph.facebook.com/v19.0").build();
        this.instagramService = instagramService;
        this.emailService    = emailService;
    }

    /**
     * Cron: primer día de cada mes a las 03:00.
     * También cubre el caso de servidor recién arrancado: si el token
     * en BD va a caducar en menos de DIAS_RENOVACION_ANTICIPADA días,
     * renueva aunque no sea día 1.
     */
    @Scheduled(cron = "0 0 3 1 * *")
    @Transactional
    public void renovarTokenMensual() {
        log.info("[InstagramToken] Comprobando si el token necesita renovación...");
        InstagramToken registro = em.find(InstagramToken.class, 1L);

        if (registro == null) {
            log.warn("[InstagramToken] No existe registro en BD. Inserta el token inicial via /api/admin/instagram/token/seed");
            return;
        }

        // Comprobar si queda poco tiempo antes de caducar
        boolean proximaCaducidad = registro.getExpiresAt() != null &&
            registro.getExpiresAt().isBefore(LocalDateTime.now().plusDays(DIAS_RENOVACION_ANTICIPADA));

        if (!proximaCaducidad) {
            log.info("[InstagramToken] Token válido hasta {}. Sin acción necesaria.", registro.getExpiresAt());
            return;
        }

        renovar(registro);
    }

    /**
     * Comprobación de seguridad: cada 6 horas verifica si el token está
     * a punto de caducar (por si el servidor estuvo caido el día 1 del mes).
     */
    @Scheduled(cron = "0 0 */6 * * *")
    @Transactional
    public void renovarTokenGuardia() {
        InstagramToken registro = em.find(InstagramToken.class, 1L);
        if (registro == null) return;

        boolean urgente = registro.getExpiresAt() != null &&
            registro.getExpiresAt().isBefore(LocalDateTime.now().plusDays(DIAS_RENOVACION_ANTICIPADA));

        if (urgente) {
            log.warn("[InstagramToken] ¡Guardia! Token caduca en menos de {} días. Renovando ahora...", DIAS_RENOVACION_ANTICIPADA);
            renovar(registro);
        }
    }

    // ─── Lógica de renovación ─────────────────────────────────────────────────

    private void renovar(InstagramToken registro) {
        String tokenActual = registro.getAccessToken();

        try {
            Map<?, ?> respuesta = webClient.get()
                .uri(uriBuilder -> uriBuilder
                    .path("/oauth/access_token")
                    .queryParam("grant_type",        "fb_exchange_token")
                    .queryParam("client_id",          appId)
                    .queryParam("client_secret",      appSecret)
                    .queryParam("fb_exchange_token", tokenActual)
                    .build())
                .retrieve()
                .bodyToMono(Map.class)
                .block();

            if (respuesta == null || !respuesta.containsKey("access_token")) {
                manejarFallo(registro, "Respuesta vacía o sin access_token: " + respuesta);
                return;
            }

            String nuevoToken = (String) respuesta.get("access_token");

            // Calcular nueva fecha de caducidad (Meta devuelve expires_in en segundos, normalmente 5183944 ≈60d)
            long expiresInSeg = respuesta.containsKey("expires_in")
                ? Long.parseLong(respuesta.get("expires_in").toString())
                : 5_183_944L;
            LocalDateTime nuevaCaducidad = LocalDateTime.now().plusSeconds(expiresInSeg);

            // Persistir en BD
            registro.setAccessToken(nuevoToken);
            registro.setExpiresAt(nuevaCaducidad);
            registro.setRenovadoAt(LocalDateTime.now());
            registro.setIntentosFallo(0);
            em.merge(registro);

            // Actualizar InstagramService en memoria para que los posts usen el nuevo token inmediatamente
            instagramService.actualizarToken(nuevoToken);

            log.info("[InstagramToken] ✅ Token renovado correctamente. Caduca el {}", nuevaCaducidad);

        } catch (Exception e) {
            manejarFallo(registro, e.getMessage());
        }
    }

    private void manejarFallo(InstagramToken registro, String motivo) {
        int fallos = registro.getIntentosFallo() + 1;
        registro.setIntentosFallo(fallos);
        em.merge(registro);

        log.error("[InstagramToken] ❌ Fallo #{} renovando token: {}", fallos, motivo);

        if (fallos >= MAX_FALLOS) {
            log.error("[InstagramToken] ⚠️ {} fallos consecutivos. Enviando alerta a {}", fallos, adminEmail);
            try {
                emailService.enviarEmailSimple(
                    adminEmail,
                    "⚠️ [Eros y Afrodita] Token Instagram a punto de caducar",
                    "El cron de renovación del token de Instagram ha fallado " + fallos + " veces seguidas.\n" +
                    "El token caducará el: " + registro.getExpiresAt() + "\n\n" +
                    "Accede a Facebook for Developers y genera un nuevo token manualmente, " +
                    "luego actualiza la BD:\n" +
                    "  POST /api/admin/instagram/token/seed  { \"token\": \"nuevo_token\" }\n\n" +
                    "Motivo último fallo: " + motivo
                );
            } catch (Exception emailEx) {
                log.error("[InstagramToken] No se pudo enviar el email de alerta: {}", emailEx.getMessage());
            }
        }
    }
}
