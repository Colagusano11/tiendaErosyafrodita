package com.colagusano11.tiendaonline.controllers;

import com.colagusano11.tiendaonline.payments.webhook.RevolutWebhookPayload;
import com.colagusano11.tiendaonline.services.PedidoServicie;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@Slf4j
@RestController
@RequestMapping("/pagos/revolut")
public class RevolutWebhookController {

    private final PedidoServicie pedidoService;

    public RevolutWebhookController(PedidoServicie pedidoService) {
        this.pedidoService = pedidoService;
    }

    @PostMapping("/webhook")
    public ResponseEntity<Void> handleWebhook(@RequestBody RevolutWebhookPayload payload) {
        log.info("Recibido Webhook de Revolut: Evento={}, Status={}", 
                 payload.getEvent(), 
                 (payload.getData() != null ? payload.getData().getStatus() : "null"));

        // Revolut envía 'order_completed' cuando el pago es exitoso
        if ("ORDER_COMPLETED".equalsIgnoreCase(payload.getEvent()) || 
            ("OFFER_COMPLETED".equalsIgnoreCase(payload.getEvent()))) {
            
            if (payload.getData() != null) {
                // El ID que guardamos al iniciar el pago es el data.id de Revolut
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
}
