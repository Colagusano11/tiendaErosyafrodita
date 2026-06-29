package com.colagusano11.tiendaonline.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.Map;

/**
 * Publica posts en Instagram Business via Meta Graph API v19.
 *
 * Flujo de 2 pasos:
 *   1. Crear un media container  → POST /{ig-user-id}/media
 *   2. Publicar el container     → POST /{ig-user-id}/media_publish
 *
 * El token se carga inicialmente desde application.properties pero puede
 * ser actualizado en caliente por InstagramTokenScheduler#renovar() sin
 * necesidad de reiniciar el servidor. Se usa volatile para visibilidad
 * entre hilos (el scheduler corre en un hilo distinto al de las peticiones).
 *
 * Requisitos en application.properties:
 *   instagram.access.token   = token inicial (se sobreescribe desde BD al renovar)
 *   instagram.account.id     = Instagram Business Account ID
 *   app.base.url             = URL pública del backend (sin slash final)
 */
@Service
public class InstagramService {

    // volatile: el scheduler puede actualizar este campo desde otro hilo
    // y todos los hilos que llamen a publicar() verán el valor nuevo
    private volatile String accessToken;

    @Value("${instagram.account.id}")
    private String accountId;

    @Value("${app.base.url}")
    private String baseUrl;

    private final WebClient webClient;

    public InstagramService(
            WebClient.Builder builder,
            @Value("${instagram.access.token}") String initialToken) {
        this.webClient   = builder.baseUrl("https://graph.facebook.com/v19.0").build();
        this.accessToken = initialToken;
    }

    /**
     * Actualiza el token en memoria.
     * Llamado por InstagramTokenScheduler tras una renovación exitosa.
     * No requiere reinicio del servidor.
     */
    public void actualizarToken(String nuevoToken) {
        if (nuevoToken != null && !nuevoToken.isBlank()) {
            this.accessToken = nuevoToken;
        }
    }

    /** Devuelve el token activo (usado por el scheduler para saber cuál renovar). */
    public String getAccessToken() {
        return accessToken;
    }

    /**
     * Publica una imagen en Instagram con el caption dado.
     *
     * @param imagenUrl  URL de la imagen tal como está en BD (puede ser de Amazon)
     * @param caption    Texto del post (copy generado por Gemini + hashtags)
     * @return           Map con 'success'+'mediaId'+'url' o 'error'
     */
    public Mono<Map<String, String>> publicar(String imagenUrl, String caption) {
        String imagenProxied = baseUrl + "/api/proxy/imagen?url=" +
            java.net.URLEncoder.encode(imagenUrl, java.nio.charset.StandardCharsets.UTF_8);

        // Capturar token en variable local para que sea efectivamente final
        final String tokenActual = this.accessToken;

        return webClient.post()
            .uri(uriBuilder -> uriBuilder
                .path("/" + accountId + "/media")
                .queryParam("image_url", imagenProxied)
                .queryParam("caption", caption)
                .queryParam("access_token", tokenActual)
                .build())
            .retrieve()
            .bodyToMono(Map.class)
            .flatMap(containerResponse -> {
                Object containerId = containerResponse.get("id");
                if (containerId == null) {
                    return Mono.just(Map.of("error", "No se pudo crear el container: " + containerResponse));
                }

                return webClient.post()
                    .uri(uriBuilder -> uriBuilder
                        .path("/" + accountId + "/media_publish")
                        .queryParam("creation_id", containerId.toString())
                        .queryParam("access_token", tokenActual)
                        .build())
                    .retrieve()
                    .bodyToMono(Map.class)
                    .map(publishResponse -> {
                        Object mediaId = publishResponse.get("id");
                        if (mediaId != null) {
                            return Map.of(
                                "success",  "true",
                                "mediaId",  mediaId.toString(),
                                "url",      "https://www.instagram.com/p/" + mediaId
                            );
                        }
                        return Map.of("error", "Error en media_publish: " + publishResponse);
                    });
            })
            .onErrorResume(e -> Mono.just(Map.of("error", "Error Meta API: " + e.getMessage())));
    }
}
