package com.colagusano11.tiendaonline.controllers;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.ResourceAccessException;

import java.util.Base64;
import java.util.Map;

@RestController
@RequestMapping("/api/idealo")
@CrossOrigin(origins = "*")
public class IdealoController {

    @Value("${IDEALO_CLIENT_ID:}")
    private String clientId;

    @Value("${IDEALO_CLIENT_SECRET:}")
    private String clientSecret;

    @Value("${IDEALO_SHOP_ID:}")
    private String shopId;

    private static final String AUTH_URL = "https://api.idealo.com/mer/businessaccount/api/v1/oauth/token";
    private static final String API_BASE_URL = "https://import.idealo.com";

    private String accessToken;
    private long tokenExpiry = 0;

    private final RestTemplate restTemplate = new RestTemplate();

    @GetMapping("/status")
    public ResponseEntity<?> getStatus() {
        try {
            boolean connected = getAccessToken() != null;
            return ResponseEntity.ok(Map.of(
                "status", connected ? "connected" : "disconnected",
                "shopId", shopId,
                "timestamp", System.currentTimeMillis()
            ));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of(
                "status", "error",
                "message", e.getMessage()
            ));
        }
    }

    @GetMapping("/offer/{sku}")
    public ResponseEntity<?> getOffer(@PathVariable String sku) {
        try {
            String token = getAccessToken();
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(token);
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<String> entity = new HttpEntity<>(headers);
            String url = API_BASE_URL + "/shop/" + shopId + "/offer/" + sku;

            ResponseEntity<String> response = restTemplate.exchange(
                url, HttpMethod.GET, entity, String.class
            );
            return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
        } catch (HttpClientErrorException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getResponseBodyAsString());
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/offer/{sku}")
    public ResponseEntity<?> putOffer(@PathVariable String sku, @RequestBody String offerData) {
        try {
            String token = getAccessToken();
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(token);
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<String> entity = new HttpEntity<>(offerData, headers);
            String url = API_BASE_URL + "/shop/" + shopId + "/offer/" + sku;

            ResponseEntity<String> response = restTemplate.exchange(
                url, HttpMethod.PUT, entity, String.class
            );
            return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
        } catch (HttpClientErrorException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getResponseBodyAsString());
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/offer/{sku}")
    public ResponseEntity<?> patchOffer(@PathVariable String sku, @RequestBody String offerData) {
        try {
            String token = getAccessToken();
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(token);
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<String> entity = new HttpEntity<>(offerData, headers);
            String url = API_BASE_URL + "/shop/" + shopId + "/offer/" + sku;

            ResponseEntity<String> response = restTemplate.exchange(
                url, HttpMethod.PATCH, entity, String.class
            );
            return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
        } catch (HttpClientErrorException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getResponseBodyAsString());
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/offer/{sku}")
    public ResponseEntity<?> deleteOffer(@PathVariable String sku) {
        try {
            String token = getAccessToken();
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(token);
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<String> entity = new HttpEntity<>(headers);
            String url = API_BASE_URL + "/shop/" + shopId + "/offer/" + sku;

            ResponseEntity<String> response = restTemplate.exchange(
                url, HttpMethod.DELETE, entity, String.class
            );
            return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
        } catch (HttpClientErrorException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getResponseBodyAsString());
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/offer")
    public ResponseEntity<?> deleteAllOffers() {
        try {
            String token = getAccessToken();
            HttpHeaders headers = new HttpHeaders();
            headers.setBearerAuth(token);
            headers.setContentType(MediaType.APPLICATION_JSON);

            HttpEntity<String> entity = new HttpEntity<>(headers);
            String url = API_BASE_URL + "/shop/" + shopId + "/offer";

            ResponseEntity<String> response = restTemplate.exchange(
                url, HttpMethod.DELETE, entity, String.class
            );
            return ResponseEntity.status(response.getStatusCode()).body(response.getBody());
        } catch (HttpClientErrorException e) {
            return ResponseEntity.status(e.getStatusCode()).body(e.getResponseBodyAsString());
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    private synchronized String getAccessToken() {
        if (accessToken != null && System.currentTimeMillis() < tokenExpiry) {
            return accessToken;
        }

        try {
            HttpHeaders headers = new HttpHeaders();
            String auth = clientId + ":" + clientSecret;
            String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes());
            headers.set("Authorization", "Basic " + encodedAuth);
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

            HttpEntity<String> entity = new HttpEntity<>("grant_type=client_credentials", headers);

            ResponseEntity<Map> response = restTemplate.exchange(
                AUTH_URL, HttpMethod.POST, entity, Map.class
            );

            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                accessToken = (String) body.get("access_token");
                Integer expiresIn = (Integer) body.get("expires_in");
                // Guardamos el token con 60 segundos de margen
                tokenExpiry = System.currentTimeMillis() + ((expiresIn != null ? expiresIn : 3600) - 60) * 1000;
                return accessToken;
            }
            throw new RuntimeException("No se pudo obtener el token de acceso");
        } catch (Exception e) {
            System.err.println("❌ Error al obtener token de Idealo: " + e.getMessage());
            throw new RuntimeException("Error de autenticación con Idealo", e);
        }
    }
}