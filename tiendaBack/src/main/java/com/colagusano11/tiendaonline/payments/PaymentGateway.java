package com.colagusano11.tiendaonline.payments;


import com.colagusano11.tiendaonline.models.Pedido;
import com.colagusano11.tiendaonline.payments.dto.PaymentInitResponse;

public interface PaymentGateway {

    PaymentInitResponse crearPago(Pedido pedido);

    // Métodos adicionales para PayPal (default: no-op para backward compatibility)
    default boolean capturarPago(String orderId) { return false; }
    default boolean verificarPago(String orderId) { return false; }
}
