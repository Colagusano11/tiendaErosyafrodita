package com.colagusano11.tiendaonline.payments;

import com.colagusano11.tiendaonline.models.Pedido;
import com.colagusano11.tiendaonline.payments.dto.PaymentInitResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Base64;

@Service
public class PayPalPaymentGateway implements PaymentGateway {

    private final WebClient webClient;
    private final String clientId;
    private final String secret;
    private final String mode;
    private final String apiUrl;
    private final String frontendUrl;
    private String accessToken;

    public PayPalPaymentGateway(
            @Value("${paypal.client.id}") String clientId,
            @Value("${paypal.secret}") String secret,
            @Value("${paypal.mode:sandbox}") String mode,
            @Value("${app.frontend.url}") String frontendUrl) {
        this.clientId = clientId;
        this.secret = secret;
        this.mode = mode;
        this.frontendUrl = frontendUrl.endsWith("/") ? frontendUrl.substring(0, frontendUrl.length() - 1) : frontendUrl;
        
        // URL base de API PayPal según modo
        this.apiUrl = "sandbox".equals(mode) 
            ? "https://api-m.sandbox.paypal.com"
            : "https://api-m.paypal.com";
        
        this.webClient = WebClient.builder()
                .baseUrl(apiUrl)
                .build();
    }

    @Override
    public PaymentInitResponse crearPago(Pedido pedido) {
        try {
            // 1. Obtener access token
            String token = obtenerAccessToken();
            
            // 2. Crear orden PayPal
            String orderId = crearOrdenPayPal(pedido, token);
            
            // 3. Obtener approval URL
            String approvalUrl = obtenerApprovalUrl(orderId, token);
            
            return new PaymentInitResponse(approvalUrl, orderId);
            
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Error al conectar con PayPal: " + e.getMessage());
        }
    }

    private String obtenerAccessToken() {
        if (accessToken != null) {
            return accessToken;
        }
        
        String credentials = clientId + ":" + secret;
        String encoded = Base64.getEncoder().encodeToString(credentials.getBytes());
        
        Map<String, String> response = webClient.post()
                .uri("/v1/oauth2/token")
                .header("Authorization", "Basic " + encoded)
                .header("Content-Type", "application/x-www-form-urlencoded")
                .bodyValue("grant_type=client_credentials")
                .retrieve()
                .bodyToMono(Map.class)
                .block();
        
        if (response == null || !response.containsKey("access_token")) {
            throw new RuntimeException("No se pudo obtener access token de PayPal");
        }
        
        accessToken = (String) response.get("access_token");
        return accessToken;
    }

    private String crearOrdenPayPal(Pedido pedido, String token) {
        // PayPal espera el monto en string con 2 decimales
        String amount = pedido.getTotal().setScale(2, java.math.RoundingMode.HALF_UP).toString();
        
        Map<String, Object> purchaseUnit = new HashMap<>();
        purchaseUnit.put("reference_id", "pedido_" + pedido.getId());
        purchaseUnit.put("amount", Map.of(
            "currency_code", "EUR",
            "value", amount
        ));
        
        Map<String, Object> body = new HashMap<>();
        body.put("intent", "CAPTURE");
        body.put("purchase_units", List.of(purchaseUnit));
        
        @SuppressWarnings("unchecked")
        Map<String, Object> response = webClient.post()
                .uri("/v2/checkout/orders")
                .header("Authorization", "Bearer " + token)
                .header("Content-Type", "application/json")
                .bodyValue(body)
                .retrieve()
                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {})
                .block();
        
        if (response == null || !response.containsKey("id")) {
            throw new RuntimeException("Respuesta inválida de PayPal al crear orden");
        }
        
        return (String) response.get("id");
    }

    private String obtenerApprovalUrl(String orderId, String token) {
        @SuppressWarnings("unchecked")
        Map<String, Object> response = webClient.get()
                .uri("/v2/checkout/orders/" + orderId)
                .header("Authorization", "Bearer " + token)
                .retrieve()
                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {})
                .block();
        
        if (response == null) {
            throw new RuntimeException("No se pudo obtener detalles de la orden PayPal");
        }
        
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> links = (List<Map<String, Object>>) response.get("links");
        
        for (Map<String, Object> link : links) {
            if ("approve".equals(link.get("rel"))) {
                return (String) link.get("href");
            }
        }
        
        throw new RuntimeException("No se encontró URL de aprobación en respuesta PayPal");
    }

    /**
     * Capturar un pago PayPal (llamar después de que usuario aprueba en PayPal)
     */
    public boolean capturarPago(String paypalOrderId) {
        try {
            String token = obtenerAccessToken();
            
            @SuppressWarnings("unchecked")
            Map<String, Object> response = webClient.post()
                    .uri("/v2/checkout/orders/" + paypalOrderId + "/capture")
                    .header("Authorization", "Bearer " + token)
                    .header("Content-Type", "application/json")
                    .retrieve()
                    .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {})
                    .block();
            
            if (response == null) {
                return false;
            }
            
            String status = (String) response.get("status");
            return "COMPLETED".equals(status);
            
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    /**
     * Verificar si un pago está completado
     */
    public boolean verificarPago(String paypalOrderId) {
        try {
            String token = obtenerAccessToken();
            
            @SuppressWarnings("unchecked")
            Map<String, Object> response = webClient.get()
                    .uri("/v2/checkout/orders/" + paypalOrderId)
                    .header("Authorization", "Bearer " + token)
                    .retrieve()
                    .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {})
                    .block();
            
            if (response == null) {
                return false;
            }
            
            String status = (String) response.get("status");
            return "COMPLETED".equals(status) || "CAPTURE".equals(status);
            
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }
}
