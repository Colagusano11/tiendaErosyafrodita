package com.colagusano11.tiendaonline.dto;

/**
 * Respuesta que SellerKing guarda como external_id en product_store_listings.
 */
public class SellerKingProductResponseDto {

    private Long webProductId;
    private String slug;
    private String accion; // "CREADO" | "ACTUALIZADO"

    public SellerKingProductResponseDto() {}

    public SellerKingProductResponseDto(Long webProductId, String slug, String accion) {
        this.webProductId = webProductId;
        this.slug = slug;
        this.accion = accion;
    }

    public Long getWebProductId()           { return webProductId; }
    public void setWebProductId(Long id)    { this.webProductId = id; }
    public String getSlug()                 { return slug; }
    public void setSlug(String slug)        { this.slug = slug; }
    public String getAccion()               { return accion; }
    public void setAccion(String accion)    { this.accion = accion; }
}
