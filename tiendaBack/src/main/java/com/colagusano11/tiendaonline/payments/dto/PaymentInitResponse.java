package com.colagusano11.tiendaonline.payments.dto;

public class PaymentInitResponse {

  private String paymentUrl;
  private String paymentId;


  public PaymentInitResponse(String paymentUrl, String paymentId) {
    this.paymentUrl = paymentUrl;
    this.paymentId = paymentId;
  }

  public String getPaymentUrl() {
    return paymentUrl;
  }
  public String getPaymentId() {
    return paymentId;
  } 
  

















}
