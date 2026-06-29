package com.colagusano11.tiendaonline.controllers;

import com.colagusano11.tiendaonline.payments.webhook.RevolutWebhookPayload;
import com.colagusano11.tiendaonline.services.PedidoServicie;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.HexFormat;

/**
 * Webhook de Revolut.
 *
 * Revolut firma cada llamada con HMAC-SHA256 usando el "Webhook Signing Secret"
 * que se genera en el panel de Revolut (Business > Developers > Webhooks).
 *
 * Cabecera enviada por Revolut: "Revolut-Signature: v1=<hex_hmac>"
 *
 * Pasos para activar la verificación:
 *   1. Entra en Revolut Business → Developers → Webhooks.
 *   2. Copia el Signing Secret del webhook.
 *   3. Añádelo a tu .env / docker-compose como: REVOLUT_WEBHOOK_SECRET=xxxxxxxx
 *   4. Reinicia el backend.
 *
 * Mientras REVOLUT_WEBHOOK_SECRET esté vacío la verificación se omite y se
 * registra un WARNING para que no pase desapercibido en los logs.
 */
@Slf4j
@RestController
@RequestMapping("/pagos/revolut")
public class RevolutWebhookController {

    private final PedidoServicie pedidoService;

    @Value("${REVOLUT_WEBHOOK_SECRET:}")
    private String webhookSecret;

    public RevolutWebhookController(PedidoServicie pedidoService) {
        this.pedidoService = pedidoService;
    }

    @PostMapping("/webhook")
    public ResponseEntity<Void> handleWebhook(
            @RequestHeader(value = "Revolut-Signature", required = false) String revolutSignature,
            @RequestBody String rawBody) {

        // --- Verificación de firma HMAC-SHA256 ---
        if (webhookSecret != null && !webhookSecret.isBlank()) {
            if (revolutSignature == null || revolutSignature.isBlank()) {
                log.warn("Webhook Revolut rechazado: cabecera Revolut-Signature ausente.");
                return ResponseEntity.status(401).build();
            }
            if (!isSignatureValid(rawBody, revolutSignature)) {
                log.warn("Webhook Revolut rechazado: firma inválida. Posible intento de fraude.");
                return ResponseEntity.status(401).build();
            }
        } else {
            log.warn("ADVERTENCIA DE SEGURIDAD: REVOLUT_WEBHOOK_SECRET no configurado. "
                   + "La firma del webhook NO está siendo verificada. "
                   + "Configura la variable de entorno para activar la protección.");
        }

        // --- Parseo manual del payload ---
        RevolutWebhookPayload payload;
        try {
            payload = new com.fasterxml.jackson.databind.ObjectMapper()
                    .readValue(rawBody, RevolutWebhookPayload.class);
        } catch (Exception e) {
            log.error("Error al parsear webhook de Revolut: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }

        log.info("Webhook Revolut verificado: Evento={}, Status={}",
                payload.getEvent(),
                (payload.getData() != null ? payload.getData().getStatus() : "null"));

        if ("ORDER_COMPLETED".equalsIgnoreCase(payload.getEvent()) ||
            "OFFER_COMPLETED".equalsIgnoreCase(payload.getEvent())) {

            if (payload.getData() != null) {
                String revolutId = payload.getData().getId();
                log.info("Procesando confirmación de pago para Revolut ID: {}", revolutId);
                try {
                    pedidoService.marcarPedidoPagado(revolutId);
                    log.info("Pedido actualizado correctamente a PAGADO.");
                } catch (Exception e) {
                    log.error("Error al marcar pedido como pagado: {}", e.getMessage());
                }
            }
        }

        return ResponseEntity.ok().build();
    }

    /**
     * Verifica que la firma HMAC-SHA256 del cuerpo coincide con la cabecera de Revolut.
     * Formato de cabecera: "v1=<hex>" (puede contener múltiples versiones separadas por coma).
     */
    private boolean isSignatureValid(String rawBody, String signatureHeader) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(webhookSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] computed = mac.doFinal(rawBody.getBytes(StandardCharsets.UTF_8));
            String computedHex = HexFormat.of().formatHex(computed);
            String expectedHeader = "v1=" + computedHex;

            // La cabecera puede contener varias firmas separadas por coma: "v1=abc,v2=xyz"
            for (String part : signatureHeader.split(",")) {
                if (part.trim().equals(expectedHeader)) {
                    return true;
                }
            }
            return false;
        } catch (Exception e) {
            log.error("Error al verificar firma Revolut: {}", e.getMessage());
            return false;
        }
    }
}
