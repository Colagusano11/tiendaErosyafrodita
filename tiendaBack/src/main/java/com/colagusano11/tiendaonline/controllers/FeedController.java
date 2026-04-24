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
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/feeds")
public class FeedController {

    @Autowired
    private ProductoService productoService;

    @Value("${FRONTEND_URL:https://erosyafrodita.com}")
    private String baseUrl;

    @GetMapping(value = "/idealo.csv", produces = "text/csv")
    public ResponseEntity<byte[]> getIdealoFeed() throws IOException {
        List<Producto> productos = productoService.getAllProductos().stream()
                .filter(p -> p.isActivo() && p.getPrecioPVP() != null)
                .collect(Collectors.toList());

        StringWriter sw = new StringWriter();
        CSVFormat format = CSVFormat.DEFAULT.builder()
                .setHeader("sku", "ean", "brand", "title", "description", "price", "url", "image_url", "category", "delivery_status")
                .build();

        try (CSVPrinter printer = new CSVPrinter(sw, format)) {
            for (Producto p : productos) {
                printer.printRecord(
                        p.getSku() != null ? p.getSku() : p.getId(),
                        p.getEan(),
                        p.getManufacturer(),
                        p.getNombre(),
                        p.getDescripcion() != null ? p.getDescripcion().replace("\n", " ").replace("\r", "") : "",
                        p.getPrecioPVP(),
                        baseUrl + "/#/product/" + p.getId(),
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

    @GetMapping(value = "/google.xml", produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<String> getGoogleFeed() {
        List<Producto> productos = productoService.getAllProductos().stream()
                .filter(p -> p.isActivo() && p.getPrecioPVP() != null)
                .collect(Collectors.toList());

        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<rss version=\"2.0\" xmlns:g=\"http://base.google.com/ns/1.0\">\n");
        xml.append("<channel>\n");
        xml.append("<title>Eros &amp; Afrodita Feed</title>\n");
        xml.append("<link>").append(baseUrl).append("</link>\n");
        xml.append("<description>Catálogo de perfumes y cosmética</description>\n");

        for (Producto p : productos) {
            xml.append("<item>\n");
            xml.append("<g:id>").append(p.getId()).append("</g:id>\n");
            xml.append("<g:title><![CDATA[").append(p.getNombre()).append("]]></g:title>\n");
            xml.append("<g:description><![CDATA[").append(p.getDescripcion() != null ? p.getDescripcion() : p.getNombre()).append("]]></g:description>\n");
            xml.append("<g:link>").append(baseUrl).append("/#/product/").append(p.getId()).append("</g:link>\n");
            xml.append("<g:image_link>").append(p.getImagen()).append("</g:image_link>\n");
            xml.append("<g:brand><![CDATA[").append(p.getManufacturer() != null ? p.getManufacturer() : "Eros &amp; Afrodita").append("]]></g:brand>\n");
            xml.append("<g:condition>new</g:condition>\n");
            xml.append("<g:availability>").append(p.getStock() > 0 ? "in stock" : "out of stock").append("</g:availability>\n");
            xml.append("<g:price>").append(p.getPrecioPVP()).append(" EUR</g:price>\n");
            if (p.getEan() != null && !p.getEan().isEmpty()) {
                xml.append("<g:gtin>").append(p.getEan()).append("</g:gtin>\n");
            }
            xml.append("<g:google_product_category>Health &amp; Beauty &gt; Personal Care &gt; Cosmetics &gt; Perfume &amp; Cologne</g:google_product_category>\n");
            xml.append("</item>\n");
        }

        xml.append("</channel>\n");
        xml.append("</rss>");
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_XML)
                .body(xml.toString());
    }

    @GetMapping(value = "/sitemap.xml", produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<String> getSitemap() {
        List<Producto> productos = productoService.getAllProductos().stream()
                .filter(Producto::isActivo)
                .collect(Collectors.toList());

        StringBuilder xml = new StringBuilder();
        xml.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n");
        xml.append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");

        // Home
        xml.append("  <url>\n");
        xml.append("    <loc>").append(baseUrl).append("/</loc>\n");
        xml.append("    <changefreq>daily</changefreq>\n");
        xml.append("    <priority>1.0</priority>\n");
        xml.append("  </url>\n");

        // Categorías principales (H / M)
        xml.append("  <url>\n");
        xml.append("    <loc>").append(baseUrl).append("/#/catalog?genero=HOMBRE</loc>\n");
        xml.append("    <changefreq>weekly</changefreq>\n");
        xml.append("    <priority>0.8</priority>\n");
        xml.append("  </url>\n");
        xml.append("  <url>\n");
        xml.append("    <loc>").append(baseUrl).append("/#/catalog?genero=MUJER</loc>\n");
        xml.append("    <changefreq>weekly</changefreq>\n");
        xml.append("    <priority>0.8</priority>\n");
        xml.append("  </url>\n");

        // Productos
        for (Producto p : productos) {
            xml.append("  <url>\n");
            xml.append("    <loc>").append(baseUrl).append("/#/product/").append(p.getId()).append("</loc>\n");
            xml.append("    <changefreq>weekly</changefreq>\n");
            xml.append("    <priority>0.7</priority>\n");
            xml.append("  </url>\n");
        }

        xml.append("</urlset>");

        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_XML)
                .body(xml.toString());
    }
}
