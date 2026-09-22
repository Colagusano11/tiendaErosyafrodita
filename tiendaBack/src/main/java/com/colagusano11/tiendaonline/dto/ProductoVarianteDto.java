package com.colagusano11.tiendaonline.dto;

import java.math.BigDecimal;

/** Una talla/concentración de la misma fragancia (selector "Capacidad" en la ficha). */
public class ProductoVarianteDto {

    private String slug;
    private String etiqueta;
    private BigDecimal precioPVP;
    private boolean disponible;
    private boolean actual;

    public ProductoVarianteDto() {}

    public ProductoVarianteDto(String slug, String etiqueta, BigDecimal precioPVP, boolean disponible, boolean actual) {
        this.slug = slug;
        this.etiqueta = etiqueta;
        this.precioPVP = precioPVP;
        this.disponible = disponible;
        this.actual = actual;
    }

    public String getSlug()               { return slug; }
    public void setSlug(String v)         { this.slug = v; }

    public String getEtiqueta()           { return etiqueta; }
    public void setEtiqueta(String v)     { this.etiqueta = v; }

    public BigDecimal getPrecioPVP()      { return precioPVP; }
    public void setPrecioPVP(BigDecimal v){ this.precioPVP = v; }

    public boolean isDisponible()         { return disponible; }
    public void setDisponible(boolean v)  { this.disponible = v; }

    public boolean isActual()             { return actual; }
    public void setActual(boolean v)      { this.actual = v; }
}
