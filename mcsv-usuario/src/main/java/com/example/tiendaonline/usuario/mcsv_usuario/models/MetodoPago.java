package com.example.tiendaonline.usuario.mcsv_usuario.models;

import jakarta.persistence.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

@Entity
@Table(name = "metodos_pago")
public class MetodoPago {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombreTitular;
    private String numeroEnmascarado; // Ej: **** 1234
    private String tipoTarjeta; // Ej: VISA, MASTERCARD
    private String mesExp;
    private String anioExp;
    private boolean isPrincipal;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "usuario_id")
    @JsonIgnore
    private Usuario usuario;

    public MetodoPago() {}

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

    public Usuario getUsuario() { return usuario; }
    public void setUsuario(Usuario usuario) { this.usuario = usuario; }
}
