package com.colagusano11.tiendaonline.payments;

import com.colagusano11.tiendaonline.models.Pedido;
import com.colagusano11.tiendaonline.payments.dto.PaymentInitResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.http.MediaType;
import java.util.*;

@Service("paypalGateway")
public class PayPalPaymentGateway implements PaymentGateway {

    private final String clientId;
    private final String clientSecret;
    private final String mode;
    private final String frontendUrl;
    private final WebClient webClient;

    public PayPalPaymentGateway(@Value("${paypal.client.id}") String clientId,
                                @Value("${paypal.client.secret}") String clientSecret,
                                @Value("${paypal.mode:sandbox}") String mode,
                                @Value("${app.frontend.url}") String frontendUrl) {
        this.clientId = clientId;
        this.clientSecret = clientSecret;
        this.mode = mode;
        this.frontendUrl = frontendUrl.endsWith("/") ? frontendUrl.substring(0, frontendUrl.length() - 1) : frontendUrl;
        this.webClient = WebClient.builder().build();
    }

    private String getBaseUrl() {
        return "sandbox".equalsIgnoreCase(mode) ? "https://api-m.sandbox.paypal.com" : "https://api-m.paypal.com";
    }

    private String getAccessToken() {
        String auth = Base64.getEncoder().encodeToString((clientId + ":" + clientSecret).getBytes());

        Map<String, Object> response = webClient.post()
                .uri(getBaseUrl() + "/v1/oauth2/token")
                .header("Authorization", "Basic " + auth)
                .contentType(MediaType.APPLICATION_FORM_URLENCODED)
                .body(BodyInserters.fromFormData("grant_type", "client_credentials"))
                .retrieve()
                .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {})
                .block();

        if (response == null || !response.containsKey("access_token")) {
            throw new RuntimeException("Error obteniendo token de PayPal");
        }

        return (String) response.get("access_token");
    }

    @Override
    public PaymentInitResponse crearPago(Pedido pedido) {
        String accessToken = getAccessToken();

        Map<String, Object> body = new HashMap<>();
        body.put("intent", "CAPTURE");

        Map<String, Object> purchaseUnit = new HashMap<>();
        purchaseUnit.put("reference_id", pedido.getId().toString());
        purchaseUnit.put("description", "Pedido #" + pedido.getId() + " en Eros & Afrodita");

        Map<String, Object> amount = new HashMap<>();
        amount.put("currency_code", "EUR");
        amount.put("value", pedido.getTotal().toString());
        purchaseUnit.put("amount", amount);

        body.put("purchase_units", Collections.singletonList(purchaseUnit));

        Map<String, Object> applicationContext = new HashMap<>();
        applicationContext.put("brand_name", "Eros & Afrodita");
        applicationContext.put("landing_page", "BILLING");
        applicationContext.put("user_action", "PAY_NOW");
        applicationContext.put("return_url", frontendUrl + "/success?pedidoId=" + pedido.getId());
        applicationContext.put("cancel_url", frontendUrl + "/checkout?error=cancelled");
        body.put("application_context", applicationContext);

        try {
            Map<String, Object> response = webClient.post()
                    .uri(getBaseUrl() + "/v2/checkout/orders")
                    .header("Authorization", "Bearer " + accessToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(body)
                    .retrieve()
                    .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {})
                    .block();

            if (response == null || !response.containsKey("id")) {
                throw new RuntimeException("Respuesta inválida de PayPal");
            }

            String orderId = (String) response.get("id");
            List<Map<String, String>> links = (List<Map<String, String>>) response.get("links");
            String approveUrl = links.stream()
                    .filter(l -> "approve".equals(l.get("rel")))
                    .findFirst()
                    .map(l -> l.get("href"))
                    .orElse(null);

            // Guardamos el Order ID de PayPal en el pedido
            pedido.setPaymentId(orderId);

            return new PaymentInitResponse(
                    approveUrl,
                    orderId
            );
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Error al crear orden en PayPal: " + e.getMessage());
        }
    }

    @Override
    public void capturePago(String orderId) {
        String accessToken = getAccessToken();

        try {
            webClient.post()
                    .uri(getBaseUrl() + "/v2/checkout/orders/" + orderId + "/capture")
                    .header("Authorization", "Bearer " + accessToken)
                    .contentType(MediaType.APPLICATION_JSON)
                    .retrieve()
                    .bodyToMono(Map.class)
                    .block();
        } catch (Exception e) {
            e.printStackTrace();
            throw new RuntimeException("Error al capturar pago en PayPal: " + e.getMessage());
        }
    }
}
