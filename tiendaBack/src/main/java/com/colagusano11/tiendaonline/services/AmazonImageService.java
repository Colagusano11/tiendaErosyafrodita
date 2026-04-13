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
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;

@Service
public class AmazonImageService {

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

    /**
     * Obtiene el token de acceso temporal de Amazon LWA
     */
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
            System.err.println("Error obteniendo Amazon Token: " + e.getMessage());
        }
        return null;
    }

    @Async
    public void syncImagesAsync(boolean forceOverwrite) {
        syncImages(forceOverwrite);
    }

    private String currentToken = null;
    private LocalDateTime tokenExpiry = null;

    private String getValidToken() {
        if (currentToken == null || tokenExpiry == null || LocalDateTime.now().isAfter(tokenExpiry)) {
            System.out.println("Solicitando nuevo token de Amazon LWA...");
            currentToken = getAccessToken();
            // Los tokens de Amazon duran 3600s, renovamos a los 50 mins por seguridad
            tokenExpiry = LocalDateTime.now().plusMinutes(50);
        }
        return currentToken;
    }

    public int syncImages(boolean forceOverwrite) {
        List<Producto> productos = productoRepository.findAll();
        AtomicInteger updatedCount = new AtomicInteger(0);

        System.out.println("Iniciando Sincronización Amazon para " + productos.size() + " productos...");

        for (Producto p : productos) {
            // Refrescar token si ha caducado
            String token = getValidToken();
            if (token == null) {
                System.err.println("No se pudo obtener el token, abortando...");
                return updatedCount.get();
            }

            // 1. BLINDAJE: Si ya es de Amazon, no se toca NUNCA.
            boolean isOfficialAmazonImage = p.getImagen() != null && p.getImagen().toLowerCase().contains("amazon");
            if (isOfficialAmazonImage) {
                System.out.println("[AMAZON-SYNC] SKIP: " + p.getSku() + " ya tiene imagen oficial de Amazon.");
                continue;
            }

            // 2. MODO "SOLO HUECOS": Si NO estamos saneando y el producto ya tiene alguna foto, saltamos.
            if (!forceOverwrite && p.getImagen() != null && !p.getImagen().trim().isEmpty()) {
                System.out.println("[AMAZON-SYNC] SKIP: " + p.getSku() + " ya tiene imagen (Modo Solo Huecos).");
                continue;
            }

            // 3. Proceso de Sincronización
            if (p.getEan() == null || p.getEan().isEmpty()) {
                System.out.println("[AMAZON-SYNC] ERROR: " + p.getSku() + " no tiene EAN.");
                continue;
            }

            try {
                System.out.println("[AMAZON-SYNC] BUSCANDO: " + p.getSku() + " (" + p.getNombre() + ")...");
                List<String> imgUrls = fetchImagesFromAmazon(p.getEan(), token);
                // Filtramos para asegurar que solo guardamos enlaces que contengan "amazon"
                List<String> validAmazonUrls = imgUrls.stream()
                        .filter(url -> url.toLowerCase().contains("amazon"))
                        .toList();

                if (!validAmazonUrls.isEmpty()) {
                    p.setImagen(validAmazonUrls.get(0));
                    if (validAmazonUrls.size() > 1) p.setImagen2(validAmazonUrls.get(1));
                    if (validAmazonUrls.size() > 2) p.setImagen3(validAmazonUrls.get(2));
                    if (validAmazonUrls.size() > 3) p.setImagen4(validAmazonUrls.get(3));
                    
                    productoRepository.save(p);
                    updatedCount.getAndIncrement();
                    System.out.println("[AMAZON-SYNC] OK: " + validAmazonUrls.size() + " imágenes actualizadas para " + p.getSku());
                } else {
                    System.out.println("[AMAZON-SYNC] INFO: No se encontraron fotos en Amazon para " + p.getSku());
                }
                Thread.sleep(1000);
            } catch (Exception e) {
                if (e.getMessage() != null && e.getMessage().contains("403")) {
                    System.out.println("Token caducado detectado en ejecución. Forzando renovación...");
                    tokenExpiry = LocalDateTime.now().minusMinutes(1); // Forzar renovación en la siguiente vuelta
                }
                System.err.println("Error procesando " + p.getEan() + ": " + e.getMessage());
                if (e.getMessage() != null && e.getMessage().contains("429")) {
                    System.err.println("Amazon 429 detectado. Esperando 5 segundos para reintentar...");
                    try { Thread.sleep(5000); } catch (InterruptedException ignored) {}
                }
            }
        }
        return updatedCount.get();
    }

    /**
     * Consulta la API de Amazon por EAN y extrae todas las imágenes disponibles
     */
    private List<String> fetchImagesFromAmazon(String ean, String token) {
        List<String> links = new java.util.ArrayList<>();
        try {
            String host = "https://sellingpartnerapi-eu.amazon.com";
            String path = "/catalog/2022-04-01/items";
            String url = String.format("%s%s?marketplaceIds=%s&identifiers=%s&identifiersType=EAN&includedData=images", 
                         host, path, marketplaceId, ean);

            HttpHeaders headers = new HttpHeaders();
            headers.set("x-amz-access-token", token);
            headers.set("x-amz-date", LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd'T'HHmmss'Z'")));
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<String> entity = new HttpEntity<>(headers);
            ResponseEntity<JsonNode> response = restTemplate.exchange(url, HttpMethod.GET, entity, JsonNode.class);

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                JsonNode body = response.getBody();
                if (body.has("items") && body.get("items").isArray() && !body.get("items").isEmpty()) {
                    JsonNode item = body.get("items").get(0);
                    if (item.has("images") && item.get("images").isArray()) {
                        for (JsonNode imgSet : item.get("images")) {
                            if (imgSet.get("marketplaceId").asText().equals(marketplaceId)) {
                                for (JsonNode img : imgSet.get("images")) {
                                    links.add(img.get("link").asText());
                                }
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            if (e.getMessage() == null || !e.getMessage().contains("404")) {
                System.err.println("Amazon API Error (" + ean + "): " + e.getMessage());
            }
        }
        return links;
    }
}
