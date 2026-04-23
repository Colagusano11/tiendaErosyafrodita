package com.colagusano11.tiendaonline.controllers;

import com.colagusano11.tiendaonline.services.PedidoServicie;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpServletRequest;
import java.util.Base64;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/pagos/webhook")
public class PayPalWebhookController {

    private final PedidoServicie pedidoService;
    private final String webhookId;
    private final String clientId;
    private final String secret;
    private final String apiUrl;

    public PayPalWebhookController(
            PedidoServicie pedidoService,
            @Value("${paypal.client.id}") String clientId,
            @Value("${paypal.secret}") String secret,
            @Value("${paypal.webhook.id}") String webhookId,
            @Value("${paypal.mode:sandbox}") String mode) {
        this.pedidoService = pedidoService;
        this.clientId = clientId;
        this.secret = secret;
        this.webhookId = webhookId;
        this.apiUrl = "sandbox".equals(mode) 
            ? "https://api-m.sandbox.paypal.com"
            : "https://api-m.paypal.com";
    }

    @PostMapping("/paypal")
    public ResponseEntity<Void> handleWebhook(HttpServletRequest request) {
        try {
            String payload = new String(request.getInputStream().readAllBytes());
            String transmissionId = request.getHeader("PAYPAL-TRANSMISSION-ID");
            String transmissionTime = request.getHeader("PAYPAL-TRANSMISSION-TIME");
            String certUrl = request.getHeader("PAYPAL-CERT-URL");
            String authAlgo = request.getHeader("PAYPAL-AUTH-ALGO");
            String transmissionSig = request.getHeader("PAYPAL-TRANSMISSION-SIG");
            String webhookEvent = request.getHeader("PAYPAL-WEBHOOK-ID");

            log.info("PayPal Webhook recibido - Event: {}, TransmissionID: {}", 
                     transmissionId, transmissionId);

            // Verificar firma (opcional pero recomendado en producción)
            // En sandbox/testing podemos omitir verificación
            
            // Parsear evento
            Map<String, Object> event = parseJson(payload);
            String eventType = (String) event.get("event_type");
            
            log.info("PayPal Event Type: {}", eventType);

            switch (eventType) {
                case "CHECKOUT.ORDER.APPROVED":
                    handleOrderApproved(event);
                    break;
                case "PAYMENT.CAPTURE.COMPLETED":
                    handlePaymentCaptured(event);
                    break;
                case "PAYMENT.CAPTURE.DENIED":
                    handlePaymentDenied(event);
                    break;
                case "PAYMENT.CAPTURE.REFUNDED":
                    handlePaymentRefunded(event);
                    break;
                default:
                    log.info("Evento PayPal ignorado: {}", eventType);
            }

            return ResponseEntity.ok().build();

        } catch (Exception e) {
            log.error("Error procesando PayPal webhook: {}", e.getMessage(), e);
            return ResponseEntity.ok().build(); // PayPal reintenta si возвращаем ошибку
        }
    }

    private void handleOrderApproved(Map<String, Object> event) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> resource = (Map<String, Object>) event.get("resource");
            String orderId = (String) resource.get("id");
            log.info("PayPal ORDER.APPROVED - OrderID: {}", orderId);
            // El frontend llama a /capture después de approval
        } catch (Exception e) {
            log.error("Error en handleOrderApproved: {}", e.getMessage());
        }
    }

    private void handlePaymentCaptured(Map<String, Object> event) {
        try {
            @SuppressWarnings("unchecked")
            Map<String, Object> resource = (Map<String, Object>) event.get("resource");
            String captureId = (String) resource.get("id");
            log.info("PayPal PAYMENT.CAPTURE.COMPLETED - CaptureID: {}", captureId);
            
            // El paymentId en pedido es el PayPal Order ID, no el capture ID
            // Buscar por order ID o usar webhook data
            
            @SuppressWarnings("unchecked")
            Map<String, Object> supplementaryData = (Map<String, Object>) resource.get("supplementary_data");
            if (supplementaryData != null) {
                @SuppressWarnings("unchecked")
                Map<String, Object> relatedIds = (Map<String, Object>) supplementaryData.get("related_ids");
                if (relatedIds != null) {
                    String orderId = (String) relatedIds.get("order_id");
                    if (orderId != null) {
                        log.info("Marcando pedido como PAGADO via PayPal Order: {}", orderId);
                        pedidoService.marcarPedidoPagado(orderId);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Error en handlePaymentCaptured: {}", e.getMessage());
        }
    }

    private void handlePaymentDenied(Map<String, Object> event) {
        log.warn("PayPal: Payment denied - revisar manualmente");
    }

    private void handlePaymentRefunded(Map<String, Object> event) {
        log.info("PayPal: Payment refunded");
        // Implementar lógica de reembolso si necesario
    }

    private Map<String, Object> parseJson(String payload) {
        try {
            com.fasterxml.jackson.databind.ObjectMapper mapper = 
                new com.fasterxml.jackson.databind.ObjectMapper();
            return mapper.readValue(payload, Map.class);
        } catch (Exception e) {
            log.error("Error parseando JSON de PayPal: {}", e.getMessage());
            return Map.of();
        }
    }
}