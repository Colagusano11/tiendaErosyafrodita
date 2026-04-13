package com.colagusano11.tiendaonline.models;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;


import java.math.BigDecimal;

@Entity
@Table(name = "productos")
public class Producto {
    @Id
    @GeneratedValue (strategy = GenerationType.IDENTITY)
    private Long id;

    private String ean;

    private String sku;
    private String skuProveedor;

    private String categoria;
    private String idCategoria;

    @NotBlank(message = "El nombre del producto es obligaotio")
    private String nombre;

    private String descripcion;

    @NotNull(message = "El precio es obligatorio")
    @Positive(message = "El precio debe ser mayor a cero")
    private BigDecimal precio;

    @NotNull(message = "El stock es obligatorio")
    @Min(value = 0, message = "El stock debe ser mayor que cero")
    private Integer stock;

    private String imagen;
    private String manufacturer;

    private String gender;

    private BigDecimal precioPVP;
    private String imagen2;
    private String imagen3;
    private String imagen4;


   
    @Enumerated(EnumType.STRING)
    private Distribuidor distribuidor ;

    private boolean activo = true;
    private boolean enOferta = false;
    private boolean nuevo = false;
    private BigDecimal descuentoOferta = BigDecimal.ZERO;
    private BigDecimal precioOferta;

    private boolean alertaMargen = false;

    @PrePersist
    @PreUpdate
    public void validarMargen() {
        if (precio != null) {
            // Determinar el precio efectivo en la web
            BigDecimal precioWeb = (enOferta && precioOferta != null) ? precioOferta : precioPVP;

            if (precioWeb != null) {
                // Formula: (base + 5) * 1.21
                BigDecimal baseMasCinco = precio.add(new BigDecimal("5"));
                BigDecimal precioMinimo = baseMasCinco.multiply(new BigDecimal("1.21"));
                
                // Si el precio de la web es menor al mínimo, alerta !
                if (precioWeb.compareTo(precioMinimo) < 0) {
                    this.alertaMargen = true;
                    this.activo = false; // Ocultar de la web
                } else {
                    this.alertaMargen = false;
                }
            }
        }
    }

    public Producto() {

    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public BigDecimal getPrecio() {
        return precio;
    }

    public void setPrecio(BigDecimal precio) {
        this.precio = precio;
    }

    public Integer getStock() {
        return stock;
    }

    public void setStock(Integer stock) {
        this.stock = stock;
    }

    public String getDescripcion() {
        return descripcion;
    }

    public void setDescripcion(String descripcion) {
        this.descripcion = descripcion;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getEan() {
        return ean;
    }

    public void setEan(String ean) {
        this.ean = ean;
    }

    public String getImagen() {
        return imagen;
    }

    public void setImagen(String imagen) {
        this.imagen = imagen;
    }

    public String getManufacturer() {
        return manufacturer;
    }

    public void setManufacturer(String manufacturer) {
        this.manufacturer = manufacturer;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getCategoria() {
        return categoria;
    }

    public void setCategoria(String categoria) {
        this.categoria = categoria;
    }

    public String getIdCategoria() {
        return idCategoria;
    }

    public void setIdCategoria(String idCategoria) {
        this.idCategoria = idCategoria;
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


    public Distribuidor getDistribuidor() {
        return distribuidor;
    }

    public void setDistribuidor(Distribuidor distribuidor) {
        this.distribuidor = distribuidor;
    }
    public BigDecimal getPrecioPVP() {
        return precioPVP;
    }
    //Este el precio que queremos en la tienda, con IVA + Gastos de envio.
    public void setPrecioPVP(BigDecimal precioPVP) {
        this.precioPVP = precioPVP;
    }

    public boolean isActivo() {
        return activo;
    }

    public void setActivo(boolean activo) {
        this.activo = activo;
    }

    public String getImagen2() {
        return imagen2;
    }

    public void setImagen2(String imagen2) {
        this.imagen2 = imagen2;
    }

    public String getImagen3() {
        return imagen3;
    }

    public void setImagen3(String imagen3) {
        this.imagen3 = imagen3;
    }

    public String getImagen4() {
        return imagen4;
    }

    public void setImagen4(String imagen4) {
        this.imagen4 = imagen4;
    }

    public boolean isEnOferta() {
        return enOferta;
    }

    public void setEnOferta(boolean enOferta) {
        this.enOferta = enOferta;
    }

    public BigDecimal getDescuentoOferta() {
        return descuentoOferta;
    }

    public void setDescuentoOferta(BigDecimal descuentoOferta) {
        this.descuentoOferta = descuentoOferta;
    }

    public BigDecimal getPrecioOferta() {
        return precioOferta;
    }

    public void setPrecioOferta(BigDecimal precioOferta) {
        this.precioOferta = precioOferta;
    }

    public boolean isNuevo() {
        return nuevo;
    }

    public void setNuevo(boolean nuevo) {
        this.nuevo = nuevo;
    }

    public boolean isAlertaMargen() {
        return alertaMargen;
    }

    public void setAlertaMargen(boolean alertaMargen) {
        this.alertaMargen = alertaMargen;
    }
}
