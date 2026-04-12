package com.colagusano11.tiendaonline.payments;


import com.colagusano11.tiendaonline.models.Pedido;
import com.colagusano11.tiendaonline.payments.dto.PaymentInitResponse;

public interface PaymentGateway {

PaymentInitResponse crearPago(Pedido pedido);


}
