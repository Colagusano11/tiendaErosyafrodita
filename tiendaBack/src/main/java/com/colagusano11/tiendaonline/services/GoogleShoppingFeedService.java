package com.colagusano11.tiendaonline.services;

import com.colagusano11.tiendaonline.models.Producto;
import com.colagusano11.tiendaonline.repositories.ProductoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Genera el feed XML de Google Shopping (formato RSS 2.0 con namespace g:).
 * Compatible también con Kelkoo, Shopmania y otros comparadores europeos
 * que consumen el estándar de Google Merchant Center.
 *
 * El feed se regenera cada 6 horas (cron) y se cachea en memoria.
 * Google Merchant Center descarga el feed desde:
 *   GET https://api.erosyafrodita.com/api/feeds/google-shopping.xml
 *
 * Requisitos en application.properties:
 *   app.base.url      = https://erosyafrodita.com        (tienda)
 *   app.api.base.url  = https://api.erosyafrodita.com    (backend/api)
 *   app.shop.name     = Eros y Afrodita
 *   app.shop.currency = EUR
 */
@Service
public class GoogleShoppingFeedService {

    private static final Logger log = LoggerFactory.getLogger(GoogleShoppingFeedService.class);

    @Value("${app.base.url}")
    private String baseUrl;

    @Value("${app.shop.name:Eros y Afrodita}")
    private String shopName;

    @Value("${app.shop.currency:EUR}")
    private String currency;

    private final ProductoRepository productoRepository;

    // Feed cacheado en memoria — se regenera cada 6h o bajo demanda
    private volatile String feedCache = "";
    private volatile LocalDateTime ultimaGeneracion = null;

    public GoogleShoppingFeedService(ProductoRepository productoRepository) {
        this.productoRepository = productoRepository;
    }

    /** Devuelve el feed cacheado. Si está vacío, genera uno sincrono. */
    public String getFeed() {
        if (feedCache.isBlank()) {
            generarFeed();
        }
        return feedCache;
    }

    public LocalDateTime getUltimaGeneracion() {
        return ultimaGeneracion;
    }

    /** Regenera el feed cada 6 horas: 00:00, 06:00, 12:00, 18:00 */
    @Scheduled(cron = "0 0 0/6 * * *")
    public void generarFeedScheduled() {
        generarFeed();
    }

    /** Regenera el feed de forma síncrona y actualiza la caché. */
    public synchronized void generarFeed() {
        log.info("[GoogleShopping] Generando feed...");
        List<Producto> productos = productoRepository.findByActivoTrueAndEnShoppingTrue();

        int incluidos  = 0;
        int excluidos  = 0;
        StringBuilder items = new StringBuilder();

        for (Producto p : productos) {
            // Validaciones mínimas requeridas por Google
            if (p.getEan() == null || p.getEan().isBlank())     { excluidos++; continue; }
            if (p.getImagen() == null || p.getImagen().isBlank()){ excluidos++; continue; }
            if (p.getSlug() == null || p.getSlug().isBlank())   { excluidos++; continue; }

            BigDecimal precioFinal = (p.isEnOferta() && p.getPrecioOferta() != null)
                ? p.getPrecioOferta() : p.getPrecioPVP();
            if (precioFinal == null || precioFinal.compareTo(BigDecimal.ZERO) <= 0) { excluidos++; continue; }

            // Precio tachado para productos en oferta (google: sale_price)
            String precioBase = p.getPrecioPVP() != null
                ? p.getPrecioPVP().toPlainString() + " " + currency : null;
            String precioVenta = precioFinal.toPlainString() + " " + currency;

            String categoria = mapearCategoria(p.getCategoria());
            String genero    = mapearGenero(p.getGender());
            String marca     = p.getManufacturer() != null ? escape(p.getManufacturer()) : "Sin marca";
            String titulo    = escape(p.getNombre());
            String slug      = p.getSlug();
            String imagenUrl = p.getImagen();

            // Imágenes adicionales (hasta 3 extra)
            StringBuilder imgsAdicionales = new StringBuilder();
            if (p.getImagen2() != null && !p.getImagen2().isBlank())
                imgsAdicionales.append("      <g:additional_image_link>").append(escape(p.getImagen2())).append("</g:additional_image_link>\n");
            if (p.getImagen3() != null && !p.getImagen3().isBlank())
                imgsAdicionales.append("      <g:additional_image_link>").append(escape(p.getImagen3())).append("</g:additional_image_link>\n");
            if (p.getImagen4() != null && !p.getImagen4().isBlank())
                imgsAdicionales.append("      <g:additional_image_link>").append(escape(p.getImagen4())).append("</g:additional_image_link>\n");

            items.append("    <item>\n")
                 // — Identificadores —
                 .append("      <g:id>").append(escape(p.getSku() != null ? p.getSku() : p.getEan())).append("</g:id>\n")
                 .append("      <g:gtin>").append(escape(p.getEan())).append("</g:gtin>\n")
                 .append("      <g:mpn>").append(escape(p.getSku() != null ? p.getSku() : p.getEan())).append("</g:mpn>\n")
                 // — Datos básicos —
                 .append("      <title>").append(titulo).append("</title>\n")
                 .append("      <link>").append(baseUrl).append("/perfume/").append(slug).append("</link>\n")
                 .append("      <g:image_link>").append(escape(imagenUrl)).append("</g:image_link>\n")
                 .append(imgsAdicionales)
                 .append("      <g:price>").append(precioVenta).append("</g:price>\n");

            // Precio tachado solo si hay oferta activa
            if (p.isEnOferta() && precioBase != null && !precioBase.equals(precioVenta)) {
                items.append("      <g:sale_price>").append(precioVenta).append("</g:sale_price>\n")
                     .append("      <g:price>").append(precioBase).append("</g:price>\n");
            }

            items
                 // — Disponibilidad —
                 .append("      <g:availability>").append(p.getStock() > 0 ? "in stock" : "out of stock").append("</g:availability>\n")
                 // — Marca y categoría —
                 .append("      <g:brand>").append(marca).append("</g:brand>\n")
                 .append("      <g:google_product_category>").append(categoria).append("</g:google_product_category>\n")
                 // — Condición —
                 .append("      <g:condition>new</g:condition>\n")
                 // — Género (si aplica) —
                 .append(genero.isBlank() ? "" : "      <g:gender>" + genero + "</g:gender>\n")
                 // — Envío (gratuito para España) —
                 .append("      <g:shipping>\n")
                 .append("        <g:country>ES</g:country>\n")
                 .append("        <g:service>Envio Gratis</g:service>\n")
                 .append("        <g:price>0.00 EUR</g:price>\n")
                 .append("      </g:shipping>\n")
                 .append("    </item>\n");

            incluidos++;
        }

        String ahora = DateTimeFormatter.RFC_1123_DATE_TIME
            .format(java.time.ZonedDateTime.now(java.time.ZoneId.of("Europe/Madrid")));

        String xml = "<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n" +
            "<rss version=\"2.0\" xmlns:g=\"http://base.google.com/ns/1.0\">\n" +
            "  <channel>\n" +
            "    <title>" + escape(shopName) + "</title>\n" +
            "    <link>" + baseUrl + "</link>\n" +
            "    <description>Catálogo de perfumes de " + escape(shopName) + "</description>\n" +
            "    <lastBuildDate>" + ahora + "</lastBuildDate>\n" +
            items +
            "  </channel>\n" +
            "</rss>";

        this.feedCache        = xml;
        this.ultimaGeneracion = LocalDateTime.now();

        log.info("[GoogleShopping] Feed generado: {} productos incluidos, {} excluidos.", incluidos, excluidos);
    }

    // ─── Helpers ─────────────────────────────────────────────────────────────────

    /**
     * Mapea la categoría interna al ID de Google Product Taxonomy.
     * Ref: https://www.google.com/basepages/producttype/taxonomy-with-ids.es-ES.txt
     */
    private String mapearCategoria(String categoria) {
        if (categoria == null) return "Health & Beauty > Fragrances";
        return switch (categoria.toLowerCase()) {
            case "perfumes hombre", "hombre"   -> "Health & Beauty > Fragrances > Men's Fragrances";
            case "perfumes mujer", "mujer"     -> "Health & Beauty > Fragrances > Women's Fragrances";
            case "perfumes nino", "nino",
                 "niño", "niños"             -> "Health & Beauty > Fragrances > Children's Fragrances";
            case "unisex"                      -> "Health & Beauty > Fragrances";
            case "body splash", "body mist"    -> "Health & Beauty > Personal Care > Cosmetics > Perfume & Cologne";
            case "sets", "pack"               -> "Health & Beauty > Fragrances > Fragrance Gift Sets";
            default                           -> "Health & Beauty > Fragrances";
        };
    }

    /** Mapea el género de la BD al valor esperado por Google (male/female/unisex). */
    private String mapearGenero(String gender) {
        if (gender == null) return "";
        return switch (gender.toLowerCase()) {
            case "hombre", "male", "man", "men", "masculino" -> "male";
            case "mujer", "female", "woman", "women", "femenino" -> "female";
            case "unisex", "mixto" -> "unisex";
            default -> "";
        };
    }

    /** Escapa caracteres especiales XML. */
    private String escape(String s) {
        if (s == null) return "";
        return s.replace("&",  "&amp;")
                .replace("<",  "&lt;")
                .replace(">",  "&gt;")
                .replace("\"", "&quot;")
                .replace("'",  "&apos;");
    }
}
