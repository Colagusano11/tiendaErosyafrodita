package com.colagusano11.tiendaonline.controllers;

import com.colagusano11.tiendaonline.models.Producto;
import com.colagusano11.tiendaonline.services.ProductoService;
import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVPrinter;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.io.StringWriter;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/feeds")
public class FeedController {

    @Autowired
    private ProductoService productoService;

    @Value("${FRONTEND_URL:https://erosyafrodita.com}")
    private String baseUrl;

    // ─── Caché en memoria (5 min) para no machacar la BD en cada crawl ────────
    private String cachedGoogleFeed;
    private LocalDateTime feedCachedAt;
    private static final int CACHE_MINUTES = 5;

    // ─────────────────────────────────────────────────────────────────────────
    // FEED IDEALO — filtra por enShopping=true además de activo
    // ─────────────────────────────────────────────────────────────────────────
    @GetMapping(value = "/idealo.csv", produces = "text/csv")
    public ResponseEntity<byte[]> getIdealoFeed() throws IOException {
        List<Producto> productos = productoService.getAllProductos().stream()
                .filter(p -> p.isActivo() && p.isEnShopping() && p.getPrecioPVP() != null)
                .collect(Collectors.toList());

        StringWriter sw = new StringWriter();
        CSVFormat format = CSVFormat.DEFAULT.builder()
                .setHeader("sku", "ean", "brand", "title", "description",
                           "price", "url", "image_url", "category", "delivery_status")
                .build();

        try (CSVPrinter printer = new CSVPrinter(sw, format)) {
            for (Producto p : productos) {
                printer.printRecord(
                        p.getSku() != null ? p.getSku() : p.getId(),
                        p.getEan(),
                        p.getManufacturer(),
                        p.getNombre(),
                        p.getDescripcion() != null
                                ? p.getDescripcion().replace("\n", " ").replace("\r", "")
                                : "",
                        p.getPrecioPVP(),
                        buildProductUrl(p),
                        p.getImagen(),
                        p.getCategoria(),
                        p.getStock() > 0 ? "En stock" : "Sin stock"
                );
            }
        }

        byte[] csvData = sw.toString().getBytes("UTF-8");
        HttpHeaders headers = new HttpHeaders();
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=idealo_feed.csv");
        headers.setContentType(MediaType.parseMediaType("text/csv"));
        return new ResponseEntity<>(csvData, headers, HttpStatus.OK);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FEED GOOGLE SHOPPING — filtra por enShopping=true además de activo
    // URL a registrar en GMC: https://erosyafrodita.com/api/feeds/google-shopping.xml
    // ─────────────────────────────────────────────────────────────────────────
    @GetMapping(value = "/google-shopping.xml", produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<String> getGoogleShoppingFeed() {
        if (cachedGoogleFeed != null && feedCachedAt != null
                && feedCachedAt.plusMinutes(CACHE_MINUTES).isAfter(LocalDateTime.now())) {
            return ResponseEntity.ok().contentType(MediaType.APPLICATION_XML).body(cachedGoogleFeed);
        }

        List<Producto> productos = productoService.getAllProductos().stream()
                .filter(p -> p.isActivo()
                          && p.isEnShopping()
                          && p.getPrecioPVP() != null
                          && p.getPrecioPVP().compareTo(BigDecimal.ZERO) > 0)
                .collect(Collectors.toList());

        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<rss version=\"2.0\" xmlns:g=\"http://base.google.com/ns/1.0\">\n");
        xml.append("<channel>\n");
        xml.append("  <title>Eros &amp; Afrodita &#8212; Perfumes</title>\n");
        xml.append("  <link>").append(baseUrl).append("</link>\n");
        xml.append("  <description>Cat&#225;logo de perfumes y cosm&#233;tica de Eros &amp; Afrodita</description>\n");

        for (Producto p : productos) {
            String title       = escapeXml(p.getNombre());
            String description = p.getDescripcion() != null
                    ? escapeXml(p.getDescripcion().length() > 5000
                            ? p.getDescripcion().substring(0, 5000)
                            : p.getDescripcion())
                    : title;

            xml.append("  <item>\n");
            xml.append("    <g:id>").append(p.getId()).append("</g:id>\n");
            xml.append("    <g:title><![CDATA[").append(title).append("]]></g:title>\n");
            xml.append("    <g:description><![CDATA[").append(description).append("]]></g:description>\n");
            xml.append("    <g:link>").append(buildProductUrl(p)).append("</g:link>\n");
            xml.append("    <g:condition>new</g:condition>\n");
            xml.append("    <g:availability>").append(p.getStock() > 0 ? "in stock" : "out of stock").append("</g:availability>\n");
            xml.append("    <g:price>").append(p.getPrecioPVP()).append(" EUR</g:price>\n");

            if (p.isEnOferta() && p.getPrecioOferta() != null
                    && p.getPrecioOferta().compareTo(BigDecimal.ZERO) > 0
                    && p.getPrecioOferta().compareTo(p.getPrecioPVP()) < 0) {
                xml.append("    <g:sale_price>").append(p.getPrecioOferta()).append(" EUR</g:sale_price>\n");
            }

            if (p.getImagen() != null && !p.getImagen().isBlank()) {
                xml.append("    <g:image_link>").append(p.getImagen()).append("</g:image_link>\n");
            }

            String brand = p.getManufacturer() != null && !p.getManufacturer().isBlank()
                    ? p.getManufacturer() : "Eros &amp; Afrodita";
            xml.append("    <g:brand><![CDATA[").append(brand).append("]]></g:brand>\n");

            boolean hasEan = p.getEan() != null && p.getEan().length() >= 8;
            boolean hasSku = p.getSku() != null && !p.getSku().isBlank();
            if (hasEan) xml.append("    <g:gtin>").append(p.getEan()).append("</g:gtin>\n");
            if (hasSku) xml.append("    <g:mpn>").append(escapeXml(p.getSku())).append("</g:mpn>\n");
            if (!hasEan && !hasSku) xml.append("    <g:identifier_exists>no</g:identifier_exists>\n");

            // 2202 = Health & Beauty > Fragrances
            xml.append("    <g:google_product_category>2202</g:google_product_category>\n");

            if (p.getCategoria() != null && !p.getCategoria().isBlank()) {
                xml.append("    <g:product_type><![CDATA[").append(escapeXml(p.getCategoria())).append("]]></g:product_type>\n");
            }

            xml.append("    <g:shipping>\n");
            xml.append("      <g:country>ES</g:country>\n");
            xml.append("      <g:service>Est\u00e1ndar</g:service>\n");
            xml.append("      <g:price>0.00 EUR</g:price>\n");
            xml.append("    </g:shipping>\n");
            xml.append("  </item>\n");
        }

        xml.append("</channel>\n</rss>");
        cachedGoogleFeed = xml.toString();
        feedCachedAt    = LocalDateTime.now();

        return ResponseEntity.ok().contentType(MediaType.APPLICATION_XML).body(cachedGoogleFeed);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // FEED GOOGLE (legacy alias)
    // ─────────────────────────────────────────────────────────────────────────
    @GetMapping(value = "/google.xml", produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<String> getGoogleFeedLegacy() {
        return getGoogleShoppingFeed();
    }

    // ─────────────────────────────────────────────────────────────────────────
    // SITEMAP — solo rutas reales del frontend (App.tsx) + productos
    // ─────────────────────────────────────────────────────────────────────────
    @GetMapping(value = "/sitemap.xml", produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<String> getSitemap() {
        List<Producto> productos = productoService.getAllProductos().stream()
                .filter(Producto::isActivo)
                .collect(Collectors.toList());

        String today = LocalDateTime.now().format(DateTimeFormatter.ISO_LOCAL_DATE);
        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");

        appendSitemapUrl(xml, baseUrl + "/",        "daily",  "1.0", today);
        appendSitemapUrl(xml, baseUrl + "/catalog", "weekly", "0.8", today);
        appendSitemapUrl(xml, baseUrl + "/about",   "monthly","0.5", today);
        appendSitemapUrl(xml, baseUrl + "/contact", "monthly","0.5", today);
        appendSitemapUrl(xml, baseUrl + "/faq",     "monthly","0.5", today);

        for (Producto p : productos) {
            appendSitemapUrl(xml, buildProductUrl(p), "weekly", "0.7", today);
        }

        xml.append("</urlset>");
        return ResponseEntity.ok().contentType(MediaType.APPLICATION_XML).body(xml.toString());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // HELPERS
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * URL canónica — igual que la ruta del frontend:
     * App.tsx → <Route path="/product/:slug" element={<ProductDetail />} />
     */
    private String buildProductUrl(Producto p) {
        String identifier = (p.getSlug() != null && !p.getSlug().isBlank())
                ? p.getSlug()
                : String.valueOf(p.getId());
        return baseUrl + "/product/" + identifier;
    }

    private void appendSitemapUrl(StringBuilder xml, String loc,
                                   String changefreq, String priority, String lastmod) {
        xml.append("  <url>\n")
           .append("    <loc>").append(loc).append("</loc>\n")
           .append("    <lastmod>").append(lastmod).append("</lastmod>\n")
           .append("    <changefreq>").append(changefreq).append("</changefreq>\n")
           .append("    <priority>").append(priority).append("</priority>\n")
           .append("  </url>\n");
    }

    private String escapeXml(String input) {
        if (input == null) return "";
        return input
                .replace("&",  "&amp;")
                .replace("<",  "&lt;")
                .replace(">",  "&gt;")
                .replace("\"", "&quot;")
                .replace("'",  "&apos;");
    }
}
