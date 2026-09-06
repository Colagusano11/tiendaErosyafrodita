package com.colagusano11.tiendaonline.models;

import jakarta.persistence.*;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "productos")
public class Producto {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String ean;
    private String sku;
    private String skuProveedor;

    private String categoria;
    private String idCategoria;

    @NotBlank(message = "El nombre del producto es obligatorio")
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
    private Distribuidor distribuidor;

    private boolean activo             = true;
    private boolean enOferta           = false;
    private boolean nuevo              = false;
    private BigDecimal descuentoOferta = BigDecimal.ZERO;
    private BigDecimal precioOferta;
    private boolean alertaMargen       = false;

    @Column(unique = true)
    private String slug;

    /**
     * Controla si el producto aparece en feeds externos
     * (Google Shopping, Idealo, comparadores).
     */
    @Column(name = "en_shopping", nullable = false)
    private boolean enShopping = true;

    // ─── Timestamps ───────────────────────────────────────────────────
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    public void onUpdate() {
        this.updatedAt = LocalDateTime.now();
        validarMargen();
        generarSlug();
    }

    // ─── Copy SEO / IA ─────────────────────────────────────────────────
    /** Título SEO generado por IA — max 60 chars, optimizado para Google. */
    @Column(name = "titulo_seo", length = 100)
    private String tituloSeo;

    /** Meta description + intro ficha de producto — max 160 chars. */
    @Column(name = "descripcion_seo", length = 320)
    private String descripcionSeo;

    /** Texto del post de Instagram con emojis y hashtags. */
    @Column(name = "copy_instagram", columnDefinition = "TEXT")
    private String copyInstagram;

    /** Cuándo se generó el copy por última vez. Null = nunca generado. */
    @Column(name = "copy_generado_en")
    private LocalDateTime copyGeneradoEn;

    // ─── Lifecycle ────────────────────────────────────────────────────

    private void validarMargen() {
        if (precio != null) {
            BigDecimal precioWeb = (enOferta && precioOferta != null) ? precioOferta : precioPVP;
            if (precioWeb != null) {
                BigDecimal precioMinimo = precio.add(new BigDecimal("5"))
                                                .multiply(new BigDecimal("1.21"));
                if (precioWeb.compareTo(precioMinimo) < 0) {
                    this.alertaMargen = true;
                    this.activo       = false;
                    this.enShopping   = false;
                } else {
                    this.alertaMargen = false;
                }
            }
        }
    }

    private void generarSlug() {
        // Solo auto-genera si no se ha asignado ya un slug explícito (ej: desde SellerKing)
        if (this.nombre != null && (this.slug == null || this.slug.isBlank())) {
            String baseSlug = this.nombre.toLowerCase()
                .replaceAll("[^a-z0-9\\s]", "")
                .replaceAll("\\s+", "-");
            String suffix = (this.ean != null && !this.ean.isEmpty())
                    ? this.ean
                    : (this.sku != null ? this.sku : "");
            this.slug = suffix.isEmpty() ? baseSlug : baseSlug + "-" + suffix;
        }
    }

    // ─── Constructors ─────────────────────────────────────────────────
    public Producto() {}

    // ─── Getters & Setters ──────────────────────────────────────────────
    public Long getId()                                   { return id; }
    public void setId(Long id)                            { this.id = id; }
    public BigDecimal getPrecio()                         { return precio; }
    public void setPrecio(BigDecimal precio)              { this.precio = precio; }
    public Integer getStock()                             { return stock; }
    public void setStock(Integer stock)                   { this.stock = stock; }
    public String getDescripcion()                        { return descripcion; }
    public void setDescripcion(String descripcion)        { this.descripcion = descripcion; }
    public String getNombre()                             { return nombre; }
    public void setNombre(String nombre)                  { this.nombre = nombre; }
    public String getEan()                                { return ean; }
    public void setEan(String ean)                        { this.ean = ean; }
    public String getImagen()                             { return imagen; }
    public void setImagen(String imagen)                  { this.imagen = imagen; }
    public String getManufacturer()                       { return manufacturer; }
    public void setManufacturer(String manufacturer)      { this.manufacturer = manufacturer; }
    public String getGender()                             { return gender; }
    public void setGender(String gender)                  { this.gender = gender; }
    public String getCategoria()                          { return categoria; }
    public void setCategoria(String categoria)            { this.categoria = categoria; }
    public String getIdCategoria()                        { return idCategoria; }
    public void setIdCategoria(String idCategoria)        { this.idCategoria = idCategoria; }
    public String getSku()                                { return sku; }
    public void setSku(String sku)                        { this.sku = sku; }
    public String getSkuProveedor()                       { return skuProveedor; }
    public void setSkuProveedor(String skuProveedor)      { this.skuProveedor = skuProveedor; }
    public Distribuidor getDistribuidor()                 { return distribuidor; }
    public void setDistribuidor(Distribuidor distribuidor){ this.distribuidor = distribuidor; }
    public BigDecimal getPrecioPVP()                      { return precioPVP; }
    public void setPrecioPVP(BigDecimal precioPVP)        { this.precioPVP = precioPVP; }
    public boolean isActivo()                             { return activo; }
    public void setActivo(boolean activo)                 { this.activo = activo; }
    public String getImagen2()                            { return imagen2; }
    public void setImagen2(String imagen2)                { this.imagen2 = imagen2; }
    public String getImagen3()                            { return imagen3; }
    public void setImagen3(String imagen3)                { this.imagen3 = imagen3; }
    public String getImagen4()                            { return imagen4; }
    public void setImagen4(String imagen4)                { this.imagen4 = imagen4; }
    public boolean isEnOferta()                           { return enOferta; }
    public void setEnOferta(boolean enOferta)             { this.enOferta = enOferta; }
    public BigDecimal getDescuentoOferta()                { return descuentoOferta; }
    public void setDescuentoOferta(BigDecimal d)          { this.descuentoOferta = d; }
    public BigDecimal getPrecioOferta()                   { return precioOferta; }
    public void setPrecioOferta(BigDecimal precioOferta)  { this.precioOferta = precioOferta; }
    public boolean isNuevo()                              { return nuevo; }
    public void setNuevo(boolean nuevo)                   { this.nuevo = nuevo; }
    public boolean isAlertaMargen()                       { return alertaMargen; }
    public void setAlertaMargen(boolean a)                { this.alertaMargen = a; }
    public String getSlug()                               { return slug; }
    public void setSlug(String slug)                      { this.slug = slug; }
    public boolean isEnShopping()                         { return enShopping; }
    public void setEnShopping(boolean enShopping)         { this.enShopping = enShopping; }
    public LocalDateTime getUpdatedAt()                   { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt)     { this.updatedAt = updatedAt; }
    // Copy IA
    public String getTituloSeo()                          { return tituloSeo; }
    public void setTituloSeo(String tituloSeo)            { this.tituloSeo = tituloSeo; }
    public String getDescripcionSeo()                     { return descripcionSeo; }
    public void setDescripcionSeo(String descripcionSeo)  { this.descripcionSeo = descripcionSeo; }
    public String getCopyInstagram()                      { return copyInstagram; }
    public void setCopyInstagram(String copyInstagram)    { this.copyInstagram = copyInstagram; }
    public LocalDateTime getCopyGeneradoEn()              { return copyGeneradoEn; }
    public void setCopyGeneradoEn(LocalDateTime t)        { this.copyGeneradoEn = t; }

    // ─── Alias para compatibilidad con servicios de feed ─────────────────────
    /** Alias de {@link #getManufacturer()} usado en feeds externos. */
    public String getMarca()      { return manufacturer; }
    /** Alias de {@link #getImagen()} usado en feeds externos. */
    public String getImagenUrl()  { return imagen; }
    /** Alias de {@link #getSku()} usado como MPN en feeds externos. */
    public String getReferencia() { return sku; }
}
