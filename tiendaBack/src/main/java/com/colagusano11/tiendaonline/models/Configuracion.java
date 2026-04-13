package com.colagusano11.tiendaonline.models;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "configuracion")
public class Configuracion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private BigDecimal iva;      // en % (ej: 21)
    private BigDecimal margen;   // en % (ej: 25)
    private BigDecimal envio;    // fijo (ej: 5)
    private BigDecimal comisionTarjeta; // fijo (ej: 1.20)

    @Column(columnDefinition = "TEXT")
    private String novedadesBrands;

    @Column(columnDefinition = "TEXT")
    private String recomendadosBrands;

    public Configuracion() {}

    public Configuracion(BigDecimal iva, BigDecimal margen, BigDecimal envio, BigDecimal comisionTarjeta) {
        this.iva = iva;
        this.margen = margen;
        this.envio = envio;
        this.comisionTarjeta = comisionTarjeta;
    }

    // Getters and Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public BigDecimal getIva() { return iva; }
    public void setIva(BigDecimal iva) { this.iva = iva; }

    public BigDecimal getMargen() { return margen; }
    public void setMargen(BigDecimal margen) { this.margen = margen; }

    public BigDecimal getEnvio() { return envio; }
    public void setEnvio(BigDecimal envio) { this.envio = envio; }

    public BigDecimal getComisionTarjeta() { return comisionTarjeta; }
    public void setComisionTarjeta(BigDecimal comisionTarjeta) { this.comisionTarjeta = comisionTarjeta; }

    public String getNovedadesBrands() { return novedadesBrands; }
    public void setNovedadesBrands(String novedadesBrands) { this.novedadesBrands = novedadesBrands; }

    public String getRecomendadosBrands() { return recomendadosBrands; }
    public void setRecomendadosBrands(String recomendadosBrands) { this.recomendadosBrands = recomendadosBrands; }
}
