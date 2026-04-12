package com.colagusano11.tiendaonline.client.dto;

public class MetodoPagoDto {

    private Long id;
    private String nombreTitular;
    private String numeroEnmascarado;
    private String tipoTarjeta;
    private String mesExp;
    private String anioExp;
    private boolean isPrincipal;

    public MetodoPagoDto() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNombreTitular() { return nombreTitular; }
    public void setNombreTitular(String nombreTitular) { this.nombreTitular = nombreTitular; }

    public String getNumeroEnmascarado() { return numeroEnmascarado; }
    public void setNumeroEnmascarado(String numeroEnmascarado) { this.numeroEnmascarado = numeroEnmascarado; }

    public String getTipoTarjeta() { return tipoTarjeta; }
    public void setTipoTarjeta(String tipoTarjeta) { this.tipoTarjeta = tipoTarjeta; }

    public String getMesExp() { return mesExp; }
    public void setMesExp(String mesExp) { this.mesExp = mesExp; }

    public String getAnioExp() { return anioExp; }
    public void setAnioExp(String anioExp) { this.anioExp = anioExp; }

    public boolean isPrincipal() { return isPrincipal; }
    public void setPrincipal(boolean isPrincipal) { this.isPrincipal = isPrincipal; }
}
