package com.colagusano11.tiendaonline.payments;

import com.colagusano11.tiendaonline.models.Pedido;
import com.colagusano11.tiendaonline.payments.dto.PaymentInitResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.context.annotation.Primary;
import org.springframework.web.reactive.function.client.WebClient;

@Service
@Primary  // Revolut es el gateway primario por defecto
public class RevolutPaymentGateway implements PaymentGateway {

  private final WebClient webClient;
  private final String apiKey;
  private final String apiUrl;
  private final String frontendUrl;

  public RevolutPaymentGateway(@Value("${revolut.api.key}") String apiKey,
                               @Value("${revolut.api.url}") String apiUrl,
                               @Value("${app.frontend.url}") String frontendUrl) {
    this.apiKey = apiKey;
    this.apiUrl = apiUrl.endsWith("/") ? apiUrl.substring(0, apiUrl.length() - 1) : apiUrl;
    this.frontendUrl = frontendUrl.endsWith("/") ? frontendUrl.substring(0, frontendUrl.length() - 1) : frontendUrl;
    this.webClient = WebClient.builder()
        .defaultHeader("Authorization", "Bearer " + apiKey)
        .build();
  }

  @Override
  public PaymentInitResponse crearPago(Pedido pedido) {
    // Revolut espera el monto en la unidad menor (céntimos para EUR)
    int amountInCents = pedido.getTotal().multiply(new java.math.BigDecimal("100")).intValue();

    java.util.Map<String, Object> body = new java.util.HashMap<>();
    body.put("amount", amountInCents);
    body.put("currency", "EUR");
    body.put("description", "Pedido #" + pedido.getId() + " en Eros & Afrodita");
    body.put("merchant_order_ext_id", pedido.getId().toString());
    if (pedido.getEmail() != null && !pedido.getEmail().isBlank()) {
        body.put("customer_email", pedido.getEmail());
    }
    
    // Redirección tras el pago (Revolut v1.0 suele usar 'completed_url', v2 usa 'redirect_url')
    String returnUrl = this.frontendUrl + "/#/success?pedidoId=" + pedido.getId();
    body.put("completed_url", returnUrl);
    body.put("redirect_url", returnUrl);
    body.put("cancelled_url", this.frontendUrl + "/#/checkout?error=cancelled");

    try {
      java.util.Map<String, Object> response = webClient.post()
          .uri(this.apiUrl + "/orders")
          .bodyValue(body)
          .retrieve()
          .bodyToMono(new org.springframework.core.ParameterizedTypeReference<java.util.Map<String, Object>>() {})
          .block();

      if (response == null || !response.containsKey("public_id")) {
        throw new RuntimeException("Respuesta inválida de Revolut");
      }

      String publicId = (String) response.get("public_id");
      String checkoutUrl = (String) response.get("checkout_url");
      
      // Guardamos el ID de pago de Revolut en el pedido
      pedido.setPaymentId((String) response.get("id"));

      return new PaymentInitResponse(
          checkoutUrl,
          publicId
      );
    } catch (Exception e) {
      e.printStackTrace();
      throw new RuntimeException("Error al conectar con la pasarela de Revolut: " + e.getMessage());
    }
  }
}
