package com.colagusano11.tiendaonline.services;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@Service
public class GeminiMarketingService {

    @Value("${gemini.api.key}")
    private String apiKey;

    private final WebClient webClient;

    public GeminiMarketingService(WebClient.Builder builder) {
        this.webClient = builder
            .baseUrl("https://generativelanguage.googleapis.com")
            .build();
    }

    public Mono<Map<String, String>> generarContenidoMarketing(String nombreProducto, String marca, String categoria, Double precio) {
        String prompt = String.format("""
            Eres un experto en marketing de perfumes y lujo. Genera contenido de marketing para el siguiente producto:

            Producto: %s
            Marca: %s
            Categoria: %s
            Precio: %.2f€

            Devuelve EXACTAMENTE este JSON (sin markdown, sin explicaciones, solo el JSON):
            {
              "titulo_seo": "titulo optimizado para SEO de 50-60 caracteres",
              "descripcion_seo": "meta descripcion de 150-160 caracteres para Google",
              "descripcion_producto": "descripcion rica del producto de 100-150 palabras evocadora y sensorial",
              "copy_instagram_1": "copy corto para Instagram con emojis, max 150 caracteres",
              "copy_instagram_2": "copy con storytelling para Instagram, max 200 caracteres",
              "copy_instagram_3": "copy enfocado en oferta/precio para Instagram, max 150 caracteres",
              "hashtags": "10 hashtags relevantes separados por espacio"
            }
            """,
            nombreProducto, marca, categoria, precio
        );

        Map<String, Object> requestBody = Map.of(
            "contents", List.of(
                Map.of("parts", List.of(Map.of("text", prompt)))
            ),
            "generationConfig", Map.of(
                "temperature", 0.8,
                "maxOutputTokens", 1024
            )
        );

        return webClient.post()
            .uri("/v1beta/models/gemini-pro:generateContent?key=" + apiKey)
            .bodyValue(requestBody)
            .retrieve()
            .bodyToMono(Map.class)
            .map(response -> {
                try {
                    var candidates = (List<?>) response.get("candidates");
                    var content = (Map<?, ?>) ((Map<?, ?>) candidates.get(0)).get("content");
                    var parts = (List<?>) content.get("parts");
                    var text = (String) ((Map<?, ?>) parts.get(0)).get("text");

                    // Limpiar posible markdown ```json ... ```
                    text = text.replaceAll("```json\\s*", "").replaceAll("```\\s*", "").trim();

                    // Parse manual del JSON devuelto por Gemini
                    com.fasterxml.jackson.databind.ObjectMapper mapper = new com.fasterxml.jackson.databind.ObjectMapper();
                    return (Map<String, String>) mapper.readValue(text, Map.class);
                } catch (Exception e) {
                    return Map.of("error", "Error parseando respuesta de Gemini: " + e.getMessage());
                }
            });
    }
}
