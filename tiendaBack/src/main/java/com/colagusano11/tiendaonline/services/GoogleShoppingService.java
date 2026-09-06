package com.colagusano11.tiendaonline.services;

import com.colagusano11.tiendaonline.models.Producto;
import com.colagusano11.tiendaonline.repositories.ProductoRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Genera el feed XML RSS 2.0 compatible con Google Merchant Center.
 * Documentación: https://support.google.com/merchants/answer/7052112
 *
 * Campos obligatorios Google Shopping:
 *   g:id, g:title, g:description, g:link, g:image_link, g:price,
 *   g:availability, g:condition, g:brand, g:gtin (EAN)
 *
 * Campos opcionales incluidos:
 *   g:sale_price, g:mpn, g:product_type, g:google_product_category,
 *   g:shipping (España), g:identifier_exists
 */
@Service
public class GoogleShoppingService {

    private final ProductoRepository productoRepository;

    @Value("${app.base-url:https://www.erosyafrodita.com}")
    private String baseUrl;

    @Value("${app.image-proxy-url:https://api.erosyafrodita.com/proxy/image}")
    private String imageProxyUrl;

    // Categoría Google para perfumes: 2915 = "Health & Beauty > Fragrances"
    private static final String GOOGLE_PRODUCT_CATEGORY = "2915";
    // Tiempo de envío estándar España (en días laborables)
    private static final String SHIPPING_DAYS = "3";

    public GoogleShoppingService(ProductoRepository productoRepository) {
        this.productoRepository = productoRepository;
    }

    /**
     * Genera el XML completo del feed de Google Shopping.
     * Se llama desde GoogleShoppingController, que aplica cache de 6 horas.
     */
    public String generarFeedXml() {
        List<Producto> productos = productoRepository.findByActivoTrue();

        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<rss version=\"2.0\" xmlns:g=\"http://base.google.com/ns/1.0\">\n");
        xml.append("  <channel>\n");
        xml.append("    <title>Eros y Afrodita - Perfumes y Fragancias</title>\n");
        xml.append("    <link>").append(baseUrl).append("</link>\n");
        xml.append("    <description>Perfumes originales al mejor precio con envío gratis</description>\n");
        xml.append("    <language>es</language>\n");
        xml.append("    <pubDate>").append(DateTimeFormatter.RFC_1123_DATE_TIME.format(ZonedDateTime.now())).append("</pubDate>\n");

        for (Producto p : productos) {
            if (p.getPrecio() == null || p.getPrecio().compareTo(BigDecimal.ZERO) <= 0) continue;
            if (p.getStock() != null && p.getStock() <= 0) continue;

            xml.append("    <item>\n");

            // --- Campos obligatorios ---
            xml.append("      <g:id>").append(escaparXml(String.valueOf(p.getId()))).append("</g:id>\n");

            // Título: usa copy SEO si existe, si no el nombre del producto
            String titulo = (p.getTituloSeo() != null && !p.getTituloSeo().isBlank())
                    ? p.getTituloSeo()
                    : p.getNombre();
            xml.append("      <g:title>").append(escaparXml(truncar(titulo, 150))).append("</g:title>\n");

            // Descripción: usa copy SEO si existe, si no construye una básica
            String descripcion = (p.getDescripcionSeo() != null && !p.getDescripcionSeo().isBlank())
                    ? p.getDescripcionSeo()
                    : generarDescripcionBasica(p);
            xml.append("      <g:description>").append(escaparXml(truncar(descripcion, 5000))).append("</g:description>\n");

            // URL del producto
            String slug = generarSlug(p.getNombre());
            String linkProducto = baseUrl + "/perfumes/" + p.getId() + "-" + slug;
            xml.append("      <g:link>").append(escaparXml(linkProducto)).append("</g:link>\n");

            // Imagen principal
            if (p.getImagenUrl() != null && !p.getImagenUrl().isBlank()) {
                String imagenUrl = p.getImagenUrl().startsWith("http")
                        ? p.getImagenUrl()
                        : imageProxyUrl + "?url=" + p.getImagenUrl();
                xml.append("      <g:image_link>").append(escaparXml(imagenUrl)).append("</g:image_link>\n");
            }

            // Precio (formato Google: "19.99 EUR")
            xml.append("      <g:price>").append(String.format("%.2f", p.getPrecio())).append(" EUR</g:price>\n");

            // Precio de oferta si existe
            if (p.getPrecioOferta() != null
                    && p.getPrecioOferta().compareTo(BigDecimal.ZERO) > 0
                    && p.getPrecioOferta().compareTo(p.getPrecio()) < 0) {
                xml.append("      <g:sale_price>").append(String.format("%.2f", p.getPrecioOferta())).append(" EUR</g:sale_price>\n");
            }

            // Disponibilidad
            boolean enStock = p.getStock() == null || p.getStock() > 0;
            xml.append("      <g:availability>").append(enStock ? "in_stock" : "out_of_stock").append("</g:availability>\n");

            // Condición (perfumes siempre nuevos)
            xml.append("      <g:condition>new</g:condition>\n");

            // --- Campos de identificación ---
            // GTIN/EAN si lo tenemos
            if (p.getEan() != null && !p.getEan().isBlank()) {
                xml.append("      <g:gtin>").append(escaparXml(p.getEan())).append("</g:gtin>\n");
                xml.append("      <g:identifier_exists>yes</g:identifier_exists>\n");
            } else {
                xml.append("      <g:identifier_exists>no</g:identifier_exists>\n");
            }

            // MPN (referencia interna)
            if (p.getReferencia() != null && !p.getReferencia().isBlank()) {
                xml.append("      <g:mpn>").append(escaparXml(p.getReferencia())).append("</g:mpn>\n");
            }

            // Marca
            if (p.getMarca() != null && !p.getMarca().isBlank()) {
                xml.append("      <g:brand>").append(escaparXml(p.getMarca())).append("</g:brand>\n");
            }

            // --- Categorización ---
            xml.append("      <g:google_product_category>").append(GOOGLE_PRODUCT_CATEGORY).append("</g:google_product_category>\n");

            // Tipo de producto personalizado (para segmentación de campañas)
            if (p.getCategoria() != null && !p.getCategoria().isBlank()) {
                xml.append("      <g:product_type>Perfumes > ").append(escaparXml(p.getCategoria())).append("</g:product_type>\n");
            } else {
                xml.append("      <g:product_type>Perfumes y Fragancias</g:product_type>\n");
            }

            // --- Envío (España) ---
            xml.append("      <g:shipping>\n");
            xml.append("        <g:country>ES</g:country>\n");
            xml.append("        <g:service>Envío estándar</g:service>\n");
            // Envío gratis si el pedido supera X€ (ajustar según tu política)
            double precioFinal = (p.getPrecioOferta() != null
                    && p.getPrecioOferta().compareTo(BigDecimal.ZERO) > 0)
                    ? p.getPrecioOferta().doubleValue()
                    : p.getPrecio().doubleValue();
            String costeEnvio = precioFinal >= 30.0 ? "0.00 EUR" : "3.99 EUR";
            xml.append("        <g:price>").append(costeEnvio).append("</g:price>\n");
            xml.append("        <g:min_handling_time>0</g:min_handling_time>\n");
            xml.append("        <g:max_handling_time>1</g:max_handling_time>\n");
            xml.append("        <g:min_transit_time>1</g:min_transit_time>\n");
            xml.append("        <g:max_transit_time>").append(SHIPPING_DAYS).append("</g:max_transit_time>\n");
            xml.append("      </g:shipping>\n");

            xml.append("    </item>\n");
        }

        xml.append("  </channel>\n");
        xml.append("</rss>");

        return xml.toString();
    }

    // ────────────────────────────────────────────────────────────────────────
    // Helpers
    // ────────────────────────────────────────────────────────────────────────

    private String generarDescripcionBasica(Producto p) {
        StringBuilder sb = new StringBuilder();
        sb.append(p.getNombre());
        if (p.getMarca() != null) sb.append(" de ").append(p.getMarca());
        sb.append(". Perfume original con envío rápido a toda España.");
        if (p.getPrecio() != null) {
            sb.append(" Desde ").append(String.format("%.2f", p.getPrecio())).append("€.");
        }
        sb.append(" Compra online en Eros y Afrodita.");
        return sb.toString();
    }

    private String generarSlug(String nombre) {
        if (nombre == null) return "perfume";
        return nombre.toLowerCase()
                .replaceAll("[áàä]", "a")
                .replaceAll("[éèë]", "e")
                .replaceAll("[íìï]", "i")
                .replaceAll("[óòö]", "o")
                .replaceAll("[úùü]", "u")
                .replaceAll("ñ", "n")
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-|-$", "");
    }

    private String escaparXml(String texto) {
        if (texto == null) return "";
        return texto
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&apos;");
    }

    private String truncar(String texto, int maxLen) {
        if (texto == null) return "";
        return texto.length() > maxLen ? texto.substring(0, maxLen - 3) + "..." : texto;
    }
}
