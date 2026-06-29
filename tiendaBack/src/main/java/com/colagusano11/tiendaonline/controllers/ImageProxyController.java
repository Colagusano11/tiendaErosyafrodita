package com.colagusano11.tiendaonline.controllers;

import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

/**
 * Proxy público de imágenes.
 *
 * GET /api/proxy/imagen?url=https://images-amazon.com/...
 *
 * Descarga la imagen del origen (Amazon u otro CDN) y la reenvía
 * con cabeceras correctas, permitiendo que Meta Graph API la descargue
 * desde el dominio propio (erosyafrodita.com) sin bloqueos CORS/hotlink.
 *
 * SEGURIDAD: solo permite dominios de imagen conocidos.
 */
@RestController
@RequestMapping("/api/proxy")
public class ImageProxyController {

    private final WebClient webClient;

    private static final java.util.List<String> ALLOWED_DOMAINS = java.util.List.of(
        "images-amazon.com",
        "m.media-amazon.com",
        "images-na.ssl-images-amazon.com",
        "ws-eu.amazon-adsystem.com",
        "cloudfront.net",
        "erosyafrodita.com"
    );

    public ImageProxyController(WebClient.Builder builder) {
        this.webClient = builder.build();
    }

    @GetMapping("/imagen")
    public Mono<ResponseEntity<byte[]>> proxyImagen(@RequestParam String url) {
        // Validar dominio permitido
        boolean allowed = ALLOWED_DOMAINS.stream().anyMatch(url::contains);
        if (!allowed) {
            return Mono.just(ResponseEntity.badRequest().<byte[]>build());
        }

        return webClient.get()
            .uri(url)
            .header(HttpHeaders.USER_AGENT,
                "Mozilla/5.0 (compatible; ErosyAfroditaBot/1.0; +https://erosyafrodita.com)")
            .retrieve()
            .toEntityFlux(byte[].class)
            .flatMap(response -> {
                // Acumular todos los chunks en un solo byte[]
                return response.getBody()
                    .reduce(new byte[0], (acc, chunk) -> {
                        byte[] combined = new byte[acc.length + chunk.length];
                        System.arraycopy(acc, 0, combined, 0, acc.length);
                        System.arraycopy(chunk, 0, combined, acc.length, chunk.length);
                        return combined;
                    })
                    .map(bytes -> ResponseEntity.ok()
                        .contentType(MediaType.IMAGE_JPEG)
                        .header(HttpHeaders.CACHE_CONTROL, "public, max-age=86400")
                        .header(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "*")
                        .body(bytes));
            })
            .onErrorReturn(ResponseEntity.notFound().<byte[]>build());
    }
}
