package com.colagusano11.tiendaonline.models;

import java.math.BigDecimal;

public class PedidoProductoSalida {
    private Long idProducto;
    private String nombreProducto;
    private String imagen;
    private String sku;
    private String ean;
    private BigDecimal precioUnitario;
    private Integer cantidad;
    private BigDecimal precioTotalLinea;
    private BigDecimal precioPVP;
    private Distribuidor distribuidor;


    public PedidoProductoSalida(){}

    public Long getIdProducto() {
        return idProducto;
    }

    public void setIdProducto(Long idProducto) {
        this.idProducto = idProducto;
    }

    public String getNombreProducto() {
        return nombreProducto;
    }

    public void setNombreProducto(String nombreProducto) {
        this.nombreProducto = nombreProducto;
    }

    public String getImagen() {
        return imagen;
    }

    public void setImagen(String imagen) {
        this.imagen = imagen;
    }

    public String getSku() {
        return sku;
    }

    public void setSku(String sku) {
        this.sku = sku;
    }

    public String getEan() {
        return ean;
    }

    public void setEan(String ean) {
        this.ean = ean;
    }

    public BigDecimal getPrecioUnitario() {
        return precioUnitario;
    }

    public void setPrecioUnitario(BigDecimal precioUnitario) {
        this.precioUnitario = precioUnitario;
    }

    public Integer getCantidad() {
        return cantidad;
    }

    public void setCantidad(Integer cantidad) {
        this.cantidad = cantidad;
    }

    public BigDecimal getPrecioTotalLinea() {
        return precioTotalLinea;
    }

    public void setPrecioTotalLinea(BigDecimal precioTotalLinea) {
        this.precioTotalLinea = precioTotalLinea;
    }

    public Distribuidor getDistribuidor() {
        return distribuidor;
    }

    public void setDistribuidor(Distribuidor distribuidor) {
        this.distribuidor = distribuidor;
    }

    public BigDecimal getPrecioPVP() {
        return precioPVP;
    }

    public void setPrecioPVP(BigDecimal precioPVP) {
        this.precioPVP = precioPVP;
    }
}
