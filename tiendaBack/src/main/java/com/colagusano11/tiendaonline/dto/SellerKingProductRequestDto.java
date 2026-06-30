package com.colagusano11.tiendaonline.dto;

import java.math.BigDecimal;

/**
 * DTO para recibir un producto publicado desde SellerKing.
 * El precio de coste (precio) lo gestiona ErosyAfrodita internamente;
 * SellerKing envía precioPVP como precio de venta sugerido.
 * El slug lo genera automáticamente la entidad Producto (@PrePersist).
 */
public class SellerKingProductRequestDto {

    private String ean;
    private String sku;
    private String skuProveedor;
    private String nombre;
    private String descripcion;
    private String categoria;
    private String manufacturer;
    private String gender;

    /** Precio de venta sugerido (PVP). Obligatorio. */
    private BigDecimal precioPVP;

    /** Stock actual del producto en el proveedor. */
    private Integer stock;

    private String imagen;
    private String imagen2;
    private String imagen3;
    private String imagen4;

    /** true = marcar como producto nuevo en la web */
    private boolean nuevo = false;

    // ─── Getters & Setters ────────────────────────────────────────────
    public String getEan()                              { return ean; }
    public void setEan(String ean)                      { this.ean = ean; }
    public String getSku()                              { return sku; }
    public void setSku(String sku)                      { this.sku = sku; }
    public String getSkuProveedor()                     { return skuProveedor; }
    public void setSkuProveedor(String s)               { this.skuProveedor = s; }
    public String getNombre()                           { return nombre; }
    public void setNombre(String nombre)                { this.nombre = nombre; }
    public String getDescripcion()                      { return descripcion; }
    public void setDescripcion(String descripcion)      { this.descripcion = descripcion; }
    public String getCategoria()                        { return categoria; }
    public void setCategoria(String categoria)          { this.categoria = categoria; }
    public String getManufacturer()                     { return manufacturer; }
    public void setManufacturer(String m)               { this.manufacturer = m; }
    public String getGender()                           { return gender; }
    public void setGender(String gender)                { this.gender = gender; }
    public BigDecimal getPrecioPVP()                    { return precioPVP; }
    public void setPrecioPVP(BigDecimal precioPVP)      { this.precioPVP = precioPVP; }
    public Integer getStock()                           { return stock; }
    public void setStock(Integer stock)                 { this.stock = stock; }
    public String getImagen()                           { return imagen; }
    public void setImagen(String imagen)                { this.imagen = imagen; }
    public String getImagen2()                          { return imagen2; }
    public void setImagen2(String imagen2)              { this.imagen2 = imagen2; }
    public String getImagen3()                          { return imagen3; }
    public void setImagen3(String imagen3)              { this.imagen3 = imagen3; }
    public String getImagen4()                          { return imagen4; }
    public void setImagen4(String imagen4)              { this.imagen4 = imagen4; }
    public boolean isNuevo()                            { return nuevo; }
    public void setNuevo(boolean nuevo)                 { this.nuevo = nuevo; }
}
