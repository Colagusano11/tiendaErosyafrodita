package com.colagusano11.tiendaonline.controllers;

import com.colagusano11.tiendaonline.models.Producto;
import com.colagusano11.tiendaonline.repositories.ProductoRepository;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.util.List;

/**
 * Feeds de productos para comparadores de precio.
 *
 * Endpoints:
 *   GET /api/feed/google-shopping  → XML RSS 2.0 (Google Merchant Center)
 *   GET /api/feed/idealo            → CSV UTF-8  (Idealo ES)
 *   GET /api/feed/kelkoo            → XML        (Kelkoo ES)
 *
 * Solo se incluyen productos con activo=true y enShopping=true.
 * El precio de venta es precioOferta si enOferta, sino precioPVP.
 */
@RestController
@RequestMapping("/api/feed")
public class FeedController {

    private static final String TIENDA_URL  = "https://www.erosyafrodita.com";
    private static final String TIENDA_NAME = "Eros y Afrodita";

    private final ProductoRepository productoRepository;

    public FeedController(ProductoRepository productoRepository) {
        this.productoRepository = productoRepository;
    }

    // ─── Utilidades ──────────────────────────────────────────────────────────

    private List<Producto> productosParaFeed() {
        return productoRepository.findAll().stream()
                .filter(p -> p.isActivo() && p.isEnShopping())
                .toList();
    }

    private BigDecimal precioVenta(Producto p) {
        if (p.isEnOferta() && p.getPrecioOferta() != null) return p.getPrecioOferta();
        return p.getPrecioPVP() != null ? p.getPrecioPVP() : p.getPrecio();
    }

    private String disponibilidad(Producto p) {
        return (p.getStock() != null && p.getStock() > 0) ? "in stock" : "out of stock";
    }

    private String urlProducto(Producto p) {
        String slug = p.getSlug() != null ? p.getSlug() : String.valueOf(p.getId());
        return TIENDA_URL + "/perfumes/" + slug;
    }

    private String escaparXml(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }

    // ─── Google Shopping ─────────────────────────────────────────────────────

    /**
     * Feed Google Merchant Center — RSS 2.0 con namespace g:
     * Documentacion: https://support.google.com/merchants/answer/7052112
     */
    @GetMapping(value = "/google-shopping", produces = MediaType.APPLICATION_XML_VALUE)
    public String googleShoppingFeed() {
        List<Producto> productos = productosParaFeed();

        StringBuilder sb = new StringBuilder();
        sb.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        sb.append("<rss version=\"2.0\" xmlns:g=\"http://base.google.com/ns/1.0\">\n");
        sb.append("  <channel>\n");
        sb.append("    <title>").append(escaparXml(TIENDA_NAME)).append("</title>\n");
        sb.append("    <link>").append(TIENDA_URL).append("</link>\n");
        sb.append("    <description>Perfumes y fragancias originales</description>\n");

        for (Producto p : productos) {
            BigDecimal precio = precioVenta(p);
            String id = p.getSku() != null ? p.getSku() : String.valueOf(p.getId());

            sb.append("    <item>\n");
            sb.append("      <g:id>").append(escaparXml(id)).append("</g:id>\n");
            sb.append("      <g:title>").append(escaparXml(p.getNombre())).append("</g:title>\n");
            sb.append("      <g:description>").append(escaparXml(p.getDescripcion())).append("</g:description>\n");
            sb.append("      <g:link>").append(urlProducto(p)).append("</g:link>\n");
            if (p.getImagen() != null) {
                sb.append("      <g:image_link>").append(escaparXml(p.getImagen())).append("</g:image_link>\n");
            }
            if (p.getImagen2() != null) {
                sb.append("      <g:additional_image_link>").append(escaparXml(p.getImagen2())).append("</g:additional_image_link>\n");
            }
            sb.append("      <g:availability>").append(disponibilidad(p)).append("</g:availability>\n");
            sb.append("      <g:price>").append(precio.toPlainString()).append(" EUR</g:price>\n");
            // Precio tachado (precio de oferta activo)
            if (p.isEnOferta() && p.getPrecioPVP() != null) {
                sb.append("      <g:sale_price>").append(p.getPrecioOferta().toPlainString()).append(" EUR</g:sale_price>\n");
            }
            if (p.getEan() != null && !p.getEan().isBlank()) {
                sb.append("      <g:gtin>").append(escaparXml(p.getEan())).append("</g:gtin>\n");
            }
            if (p.getManufacturer() != null) {
                sb.append("      <g:brand>").append(escaparXml(p.getManufacturer())).append("</g:brand>\n");
            }
            sb.append("      <g:condition>new</g:condition>\n");
            sb.append("      <g:google_product_category>Health &amp; Beauty &gt; Fragrances</g:google_product_category>\n");
            if (p.getGender() != null) {
                String genero = p.getGender().equalsIgnoreCase("mujer") || p.getGender().equalsIgnoreCase("female") ? "female"
                        : p.getGender().equalsIgnoreCase("hombre") || p.getGender().equalsIgnoreCase("male") ? "male"
                        : "unisex";
                sb.append("      <g:gender>").append(genero).append("</g:gender>\n");
            }
            sb.append("      <g:shipping>\n");
            sb.append("        <g:country>ES</g:country>\n");
            sb.append("        <g:service>Envio Estandar</g:service>\n");
            sb.append("        <g:price>3.99 EUR</g:price>\n");
            sb.append("      </g:shipping>\n");
            sb.append("    </item>\n");
        }

        sb.append("  </channel>\n");
        sb.append("</rss>");
        return sb.toString();
    }

    // ─── Idealo ──────────────────────────────────────────────────────────────

    /**
     * Feed Idealo ES — CSV separado por punto y coma, UTF-8 con BOM.
     * Documentacion: https://www.idealo.es/ayuda/vendedores/feed
     * Cabecera requerida: SKU | EAN | Nombre | Precio | URL | URL imagen | Stock | Marca | Descripcion
     */
    @GetMapping(value = "/idealo", produces = "text/csv;charset=UTF-8")
    public String idealoFeed() {
        List<Producto> productos = productosParaFeed();

        StringBuilder sb = new StringBuilder();
        // BOM UTF-8 para que Idealo reconozca la codificacion
        sb.append("\uFEFF");
        sb.append("sku;ean;name;price;url;image_url;delivery_cost;stock;brand;description\n");

        for (Producto p : productos) {
            BigDecimal precio = precioVenta(p);
            String id = p.getSku() != null ? p.getSku() : String.valueOf(p.getId());

            sb.append(csvField(id)).append(";");
            sb.append(csvField(p.getEan())).append(";");
            sb.append(csvField(p.getNombre())).append(";");
            sb.append(precio.toPlainString()).append(";");
            sb.append(urlProducto(p)).append(";");
            sb.append(csvField(p.getImagen())).append(";");
            sb.append("3.99;"); // coste de envio
            sb.append(p.getStock() != null && p.getStock() > 0 ? p.getStock() : 0).append(";");
            sb.append(csvField(p.getManufacturer())).append(";");
            sb.append(csvField(p.getDescripcion())).append("\n");
        }

        return sb.toString();
    }

    private String csvField(String value) {
        if (value == null) return "";
        // Encerrar en comillas si contiene punto y coma, comillas o saltos de linea
        String escaped = value.replace("\"", "\"\"");
        if (escaped.contains(";") || escaped.contains("\"") || escaped.contains("\n")) {
            return "\"" + escaped + "\"";
        }
        return escaped;
    }

    // ─── Kelkoo ──────────────────────────────────────────────────────────────

    /**
     * Feed Kelkoo ES — XML.
     * Documentacion: https://developers.kelkoo.com/feed-specification
     */
    @GetMapping(value = "/kelkoo", produces = MediaType.APPLICATION_XML_VALUE)
    public String kelkooFeed() {
        List<Producto> productos = productosParaFeed();

        StringBuilder sb = new StringBuilder();
        sb.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        sb.append("<catalog>\n");

        for (Producto p : productos) {
            BigDecimal precio = precioVenta(p);
            String id = p.getSku() != null ? p.getSku() : String.valueOf(p.getId());
            boolean inStock = p.getStock() != null && p.getStock() > 0;

            sb.append("  <offer>\n");
            sb.append("    <offerId>").append(escaparXml(id)).append("</offerId>\n");
            sb.append("    <title>").append(escaparXml(p.getNombre())).append("</title>\n");
            sb.append("    <productUrl>").append(urlProducto(p)).append("</productUrl>\n");
            if (p.getImagen() != null) {
                sb.append("    <imageUrl>").append(escaparXml(p.getImagen())).append("</imageUrl>\n");
            }
            sb.append("    <price>").append(precio.toPlainString()).append("</price>\n");
            sb.append("    <shippingCost>3.99</shippingCost>\n");
            sb.append("    <description>").append(escaparXml(p.getDescripcion())).append("</description>\n");
            if (p.getEan() != null && !p.getEan().isBlank()) {
                sb.append("    <ean>").append(escaparXml(p.getEan())).append("</ean>\n");
            }
            if (p.getManufacturer() != null) {
                sb.append("    <brand>").append(escaparXml(p.getManufacturer())).append("</brand>\n");
            }
            sb.append("    <inStock>").append(inStock ? "true" : "false").append("</inStock>\n");
            sb.append("    <condition>new</condition>\n");
            sb.append("    <categoryName>Perfumes y Fragancias</categoryName>\n");
            if (p.getSku() != null) {
                sb.append("    <merchantProductId>").append(escaparXml(p.getSku())).append("</merchantProductId>\n");
            }
            sb.append("  </offer>\n");
        }

        sb.append("</catalog>");
        return sb.toString();
    }
}
