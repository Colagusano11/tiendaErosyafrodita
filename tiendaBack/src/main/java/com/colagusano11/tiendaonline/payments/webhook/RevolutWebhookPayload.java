package com.colagusano11.tiendaonline.payments.webhook;

import lombok.Data;
import com.fasterxml.jackson.annotation.JsonProperty;

@Data
public class RevolutWebhookPayload {

    private String event;
    private OrderData data;

    @Data
    public static class OrderData {
        private String id; // Revolut envía el id de la orden en este campo
        
        @JsonProperty("order_id")
        private String orderId;
        
        @JsonProperty("payment_id")
        private String paymentId;
        
        private String status;
    }
}
