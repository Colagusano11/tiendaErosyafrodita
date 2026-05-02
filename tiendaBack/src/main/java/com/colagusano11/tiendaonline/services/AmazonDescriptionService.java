package com.colagusano11.tiendaonline.services;

import com.colagusano11.tiendaonline.models.Producto;
import com.colagusano11.tiendaonline.repositories.ProductoRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class AmazonDescriptionService {

    @Value("${amazon.spapi.clientId}")
    private String clientId;

    @Value("${amazon.spapi.clientSecret}")
    private String clientSecret;

    @Value("${amazon.spapi.refreshToken}")
    private String refreshToken;

    @Value("${amazon.spapi.marketplaceId}")
    private String marketplaceId;

    @Autowired
    private ProductoRepository productoRepository;

    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper mapper = new ObjectMapper();

    private String currentToken = null;
    private LocalDateTime tokenExpiry = null;

    private String getValidToken() {
        if (currentToken == null || tokenExpiry == null || LocalDateTime.now().isAfter(tokenExpiry)) {
            currentToken = getAccessToken();
            tokenExpiry = LocalDateTime.now().plusMinutes(50);
        }
        return currentToken;
    }

    private String getAccessToken() {
        try {
            String url = "https://api.amazon.com/auth/o2/token";
            MultiValueMap<String, String> body = new LinkedMultiValueMap<>();
            body.add("grant_type", "refresh_token");
            body.add("refresh_token", refreshToken);
            body.add("client_id", clientId);
            body.add("client_secret", clientSecret);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            HttpEntity<MultiValueMap<String, String>> request = new HttpEntity<>(body, headers);
            ResponseEntity<JsonNode> response = restTemplate.postForEntity(url, request, JsonNode.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                return response.getBody().get("access_token").asText();
            }
        } catch (Exception e) {
            System.err.println("Error Amazon Token: " + e.getMessage());
        }
        return null;
    }

    @Async
    public void syncDescriptionsAsync() {
        syncDescriptions();
    }

    public int syncDescriptions() {
        List<Producto> productos = productoRepository.findAll();
        AtomicInteger updatedCount = new AtomicInteger(0);

        for (Producto p : productos) {
            // Saltamos si ya tiene una descripción muy larga (asumimos que ya está trabajada)
            if (p.getDescripcion() != null && p.getDescripcion().length() > 500) continue;
            if (p.getEan() == null || p.getEan().isEmpty()) continue;

            String token = getValidToken();
            if (token == null) break;

            try {
                String description = fetchDescriptionFromAmazon(p.getEan(), token);
                if (description != null && !description.isEmpty()) {
                    p.setDescripcion(description);
                    productoRepository.save(p);
                    updatedCount.incrementAndGet();
                }
                Thread.sleep(1000); // Respetar rate limits
            } catch (Exception e) {
                System.err.println("Error descripción EAN " + p.getEan() + ": " + e.getMessage());
            }
        }
        return updatedCount.get();
    }

    private String fetchDescriptionFromAmazon(String ean, String token) {
        try {
            String host = "https://sellingpartnerapi-eu.amazon.com";
            String url = String.format("%s/catalog/2022-04-01/items?marketplaceIds=%s&identifiers=%s&identifiersType=EAN&includedData=summaries,attributes", 
                         host, marketplaceId, ean);

            HttpHeaders headers = new HttpHeaders();
            headers.set("x-amz-access-token", token);
            HttpEntity<String> entity = new HttpEntity<>(headers);
            
            ResponseEntity<JsonNode> response = restTemplate.exchange(url, HttpMethod.GET, entity, JsonNode.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                JsonNode items = response.getBody().get("items");
                if (items != null && items.isArray() && !items.isEmpty()) {
                    JsonNode item = items.get(0);
                    
                    StringBuilder sb = new StringBuilder();
                    
                    // 1. Título / Resumen
                    if (item.has("summaries")) {
                        JsonNode summary = item.get("summaries").get(0);
                        if (summary.has("itemName")) {
                            sb.append("<h2>").append(summary.get("itemName").asText()).append("</h2>\n");
                        }
                    }

                    // 2. Viñetas de características (Bullet Points)
                    if (item.has("attributes")) {
                        JsonNode attrs = item.get("attributes");
                        if (attrs.has("bullet_point")) {
                            sb.append("<div class='premium-features'>\n<ul>\n");
                            for (JsonNode bp : attrs.get("bullet_point")) {
                                sb.append("  <li>").append(bp.get("value").asText()).append("</li>\n");
                            }
                            sb.append("</ul>\n</div>\n");
                        }
                        
                        // 3. Descripción del Producto
                        if (attrs.has("product_description")) {
                             sb.append("<div class='premium-description'>\n")
                               .append("<p>").append(attrs.get("product_description").get(0).get("value").asText()).append("</p>\n")
                               .append("</div>");
                        }
                    }
                    
                    return sb.toString();
                }
            }
        } catch (Exception e) {
            return null;
        }
        return null;
    }
}
