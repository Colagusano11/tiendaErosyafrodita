package com.colagusano11.tiendaonline.models;

import jakarta.persistence.*;

import java.math.BigDecimal;

@Entity
public class PedidoProducto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "pedido_id")
    private Pedido pedido;

    private Integer cantidad;

    @ManyToOne
    @JoinColumn(name = "producto_id")
    private Producto producto;

    private java.math.BigDecimal precioUnitario;
    private java.math.BigDecimal precioTotalLinea;
    private java.math.BigDecimal precioPVP;

    private String sku;
    private String skuProveedor;
    private String ean;
    private String nombreProducto;

    @Enumerated(EnumType.STRING)
    private Distribuidor distribuidor;

    public PedidoProducto(){

    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Integer getCantidad() {
        return cantidad;
    }

    public void setCantidad(Integer cantidad) {
        this.cantidad = cantidad;
    }

    public Pedido getPedido() {
        return pedido;
    }

    public void setPedido(Pedido pedido) {
        this.pedido = pedido;
    }

    public Producto getProducto() {
        return producto;
    }

    public void setProducto(Producto producto) {
        this.producto = producto;
    }

    public java.math.BigDecimal getPrecioUnitario() {
        return precioUnitario;
    }

    public void setPrecioUnitario(java.math.BigDecimal precioUnitario) {
        this.precioUnitario = precioUnitario;
    }

    public String getNombreProducto() {
        return nombreProducto;
    }

    public void setNombreProducto(String nombreProducto) {
        this.nombreProducto = nombreProducto;
    }

    public String getEan() {
        return ean;
    }

    public void setEan(String ean) {
        this.ean = ean;
    }

    public String getSku() {
        return sku;
    }

    public void setSku(String sku) {
        this.sku = sku;
    }

    public String getSkuProveedor() {
        return skuProveedor;
    }

    public void setSkuProveedor(String skuProveedor) {
        this.skuProveedor = skuProveedor;
    }

    public BigDecimal getPrecioTotalLinea() {
        return precioTotalLinea;
    }

    public void setPrecioTotalLinea(BigDecimal precioTotalLinea) {
        this.precioTotalLinea = precioTotalLinea;
    }

    public BigDecimal getPrecioPVP() {
        return precioPVP;
    }

    public void setPrecioPVP(BigDecimal precioPVP) {
        this.precioPVP = precioPVP;
    }

    public Distribuidor getDistribuidor() {
        return distribuidor;
    }

    public void setDistribuidor(Distribuidor distribuidor) {
        this.distribuidor = distribuidor;
    }
}
