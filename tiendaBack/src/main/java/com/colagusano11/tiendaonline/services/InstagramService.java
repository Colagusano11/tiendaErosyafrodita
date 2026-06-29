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
 * Requisitos en application.properties:
 *   instagram.access.token   = token de larga duración (60 días, renovar cada 50)
 *   instagram.account.id     = Instagram Business Account ID (ej: 17841400000000000)
 *   app.base.url             = URL pública del backend (ej: https://api.erosyafrodita.com)
 */
@Service
public class InstagramService {

    @Value("${instagram.access.token}")
    private String accessToken;

    @Value("${instagram.account.id}")
    private String accountId;

    @Value("${app.base.url}")
    private String baseUrl;

    private final WebClient webClient;

    public InstagramService(WebClient.Builder builder) {
        this.webClient = builder
            .baseUrl("https://graph.facebook.com/v19.0")
            .build();
    }

    /**
     * Publica una imagen en Instagram con el caption dado.
     *
     * @param imagenUrl  URL de la imagen tal como está en BD (puede ser de Amazon)
     * @param caption    Texto del post (copy + hashtags)
     * @return           ID del media publicado o mensaje de error
     */
    public Mono<Map<String, String>> publicar(String imagenUrl, String caption) {
        // Construir URL del proxy para evitar bloqueo de Amazon
        String imagenProxied = baseUrl + "/api/proxy/imagen?url=" +
            java.net.URLEncoder.encode(imagenUrl, java.nio.charset.StandardCharsets.UTF_8);

        // Paso 1: Crear container
        return webClient.post()
            .uri(uriBuilder -> uriBuilder
                .path("/" + accountId + "/media")
                .queryParam("image_url", imagenProxied)
                .queryParam("caption", caption)
                .queryParam("access_token", accessToken)
                .build())
            .retrieve()
            .bodyToMono(Map.class)
            .flatMap(containerResponse -> {
                Object containerId = containerResponse.get("id");
                if (containerId == null) {
                    return Mono.just(Map.of("error", "No se pudo crear el container: " + containerResponse));
                }

                // Paso 2: Publicar el container
                return webClient.post()
                    .uri(uriBuilder -> uriBuilder
                        .path("/" + accountId + "/media_publish")
                        .queryParam("creation_id", containerId.toString())
                        .queryParam("access_token", accessToken)
                        .build())
                    .retrieve()
                    .bodyToMono(Map.class)
                    .map(publishResponse -> {
                        Object mediaId = publishResponse.get("id");
                        if (mediaId != null) {
                            return Map.of(
                                "success", "true",
                                "mediaId", mediaId.toString(),
                                "url", "https://www.instagram.com/p/" + mediaId
                            );
                        }
                        return Map.of("error", "Error en media_publish: " + publishResponse);
                    });
            })
            .onErrorResume(e -> Mono.just(Map.of("error", "Error Meta API: " + e.getMessage())));
    }
}
