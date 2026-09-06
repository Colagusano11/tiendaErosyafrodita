package com.colagusano11.tiendaonline.controllers;

import com.colagusano11.tiendaonline.models.Producto;
import com.colagusano11.tiendaonline.repositories.ProductoRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

/**
 * Feeds CSV para comparadores de precio españoles.
 *
 * Endpoints:
 *   GET /api/feed/kelkoo     → CSV para Kelkoo.es
 *   GET /api/feed/pricero    → CSV para Pricero.es
 *   GET /api/feed/shopmania  → CSV para Shopmania.es
 *   GET /api/feed/info       → Info de todos los feeds disponibles
 *
 * Cómo registrarlos:
 *   - Kelkoo:    https://merchants.kelkoo.es → Gestión de feeds → Añadir feed
 *   - Pricero:   https://www.pricero.com/merchants → Subir feed
 *   - Shopmania: https://www.shopmania.es/merchant → Feed URL
 */
@RestController
@RequestMapping({"/api/feed", "/feed"})
@CrossOrigin(origins = "*")
public class FeedComparadoresController {

    private final ProductoRepository productoRepository;

    @Value("${app.base-url:https://www.erosyafrodita.com}")
    private String baseUrl;

    @Value("${app.image-proxy-url:https://api.erosyafrodita.com/proxy/image}")
    private String imageProxyUrl;

    public FeedComparadoresController(ProductoRepository productoRepository) {
        this.productoRepository = productoRepository;
    }

    // ────────────────────────────────────────────────────────────────────────
    // KELKOO
    // Formato: https://developer.kelkoo.com/documentation/merchant-feed
    // Columnas requeridas: offer-id, title, product-url, price, currency,
    //                      image-url, description, category, brand, ean
    // ────────────────────────────────────────────────────────────────────────

    @GetMapping(value = "/kelkoo", produces = "text/csv;charset=UTF-8")
    public ResponseEntity<String> getFeedKelkoo() {
        List<Producto> productos = productoRepository.findByActivoTrue();
        StringBuilder csv = new StringBuilder();

        // Cabecera
        csv.append("offer-id\ttitle\tproduct-url\tprice\tcurrency\timage-url"
                + "\tdescription\tcategory\tbrand\tean\tavailability\tcondition\n");

        for (Producto p : productos) {
            if (p.getPrecio() == null || p.getPrecio().compareTo(BigDecimal.ZERO) <= 0) continue;
            if (p.getStock() != null && p.getStock() <= 0) continue;

            String titulo = elegirTitulo(p);
            String descripcion = elegirDescripcion(p);
            String urlProducto = baseUrl + "/perfumes/" + p.getId() + "-" + generarSlug(p.getNombre());
            String imagenUrl = resolverImagenUrl(p);
            double precio = precioFinal(p);

            csv.append(escaparCsv(String.valueOf(p.getId()))).append("\t")
               .append(escaparCsv(truncar(titulo, 100))).append("\t")
               .append(escaparCsv(urlProducto)).append("\t")
               .append(String.format("%.2f", precio)).append("\t")
               .append("EUR").append("\t")
               .append(escaparCsv(imagenUrl)).append("\t")
               .append(escaparCsv(truncar(descripcion, 1000))).append("\t")
               .append("Perfumes y Fragancias").append("\t")
               .append(escaparCsv(p.getMarca() != null ? p.getMarca() : "")).append("\t")
               .append(escaparCsv(p.getEan() != null ? p.getEan() : "")).append("\t")
               .append("in stock").append("\t")
               .append("new").append("\n");
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv;charset=UTF-8"))
                .cacheControl(CacheControl.maxAge(6, TimeUnit.HOURS).cachePublic())
                .body(csv.toString());
    }

    // ────────────────────────────────────────────────────────────────────────
    // PRICERO
    // Formato básico CSV con BOM UTF-8
    // Columnas: id, nombre, url, precio, imagen, descripcion, marca, ean, stock
    // ────────────────────────────────────────────────────────────────────────

    @GetMapping(value = "/pricero", produces = "text/csv;charset=UTF-8")
    public ResponseEntity<String> getFeedPricero() {
        List<Producto> productos = productoRepository.findByActivoTrue();
        // BOM UTF-8 para Excel/compatibilidad
        StringBuilder csv = new StringBuilder("\uFEFF");

        csv.append("id;nombre;url;precio;imagen;descripcion;marca;ean;disponibilidad\n");

        for (Producto p : productos) {
            if (p.getPrecio() == null || p.getPrecio().compareTo(BigDecimal.ZERO) <= 0) continue;
            if (p.getStock() != null && p.getStock() <= 0) continue;

            String titulo = elegirTitulo(p);
            String descripcion = elegirDescripcion(p);
            String urlProducto = baseUrl + "/perfumes/" + p.getId() + "-" + generarSlug(p.getNombre());
            String imagenUrl = resolverImagenUrl(p);
            double precio = precioFinal(p);

            csv.append(p.getId()).append(";")
               .append(escaparCsvSemicolon(truncar(titulo, 150))).append(";")
               .append(escaparCsvSemicolon(urlProducto)).append(";")
               .append(String.format("%.2f", precio)).append(";")
               .append(escaparCsvSemicolon(imagenUrl)).append(";")
               .append(escaparCsvSemicolon(truncar(descripcion, 500))).append(";")
               .append(escaparCsvSemicolon(p.getMarca() != null ? p.getMarca() : "")).append(";")
               .append(escaparCsvSemicolon(p.getEan() != null ? p.getEan() : "")).append(";")
               .append("disponible").append("\n");
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv;charset=UTF-8"))
                .cacheControl(CacheControl.maxAge(6, TimeUnit.HOURS).cachePublic())
                .body(csv.toString());
    }

    // ────────────────────────────────────────────────────────────────────────
    // SHOPMANIA
    // Mismo formato que Kelkoo pero separado por coma
    // ────────────────────────────────────────────────────────────────────────

    @GetMapping(value = "/shopmania", produces = "text/csv;charset=UTF-8")
    public ResponseEntity<String> getFeedShopmania() {
        List<Producto> productos = productoRepository.findByActivoTrue();
        StringBuilder csv = new StringBuilder("\uFEFF");

        csv.append("id,nombre,url,precio,moneda,imagen,descripcion,categoria,marca,ean,disponibilidad\n");

        for (Producto p : productos) {
            if (p.getPrecio() == null || p.getPrecio().compareTo(BigDecimal.ZERO) <= 0) continue;
            if (p.getStock() != null && p.getStock() <= 0) continue;

            String titulo = elegirTitulo(p);
            String descripcion = elegirDescripcion(p);
            String urlProducto = baseUrl + "/perfumes/" + p.getId() + "-" + generarSlug(p.getNombre());
            String imagenUrl = resolverImagenUrl(p);
            double precio = precioFinal(p);

            csv.append(p.getId()).append(",")
               .append(escaparCsvComa(truncar(titulo, 150))).append(",")
               .append(escaparCsvComa(urlProducto)).append(",")
               .append(String.format("%.2f", precio)).append(",")
               .append("EUR").append(",")
               .append(escaparCsvComa(imagenUrl)).append(",")
               .append(escaparCsvComa(truncar(descripcion, 500))).append(",")
               .append("Perfumes y Fragancias").append(",")
               .append(escaparCsvComa(p.getMarca() != null ? p.getMarca() : "")).append(",")
               .append(escaparCsvComa(p.getEan() != null ? p.getEan() : "")).append(",")
               .append("disponible").append("\n");
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("text/csv;charset=UTF-8"))
                .cacheControl(CacheControl.maxAge(6, TimeUnit.HOURS).cachePublic())
                .body(csv.toString());
    }

    // ────────────────────────────────────────────────────────────────────────
    // INFO: resumen de todos los feeds disponibles
    // ────────────────────────────────────────────────────────────────────────

    @GetMapping("/info")
    public ResponseEntity<?> getInfoFeeds() {
        long totalProductos = productoRepository.findByActivoTrue().size();
        return ResponseEntity.ok(Map.of(
                "totalProductos", totalProductos,
                "feeds", Map.of(
                        "googleShopping", Map.of(
                                "url", "/api/feed/google-shopping",
                                "formato", "XML RSS 2.0 (Google Merchant Center)",
                                "registrarEn", "https://merchants.google.com",
                                "actualizacion", "cada 6h con cache"
                        ),
                        "kelkoo", Map.of(
                                "url", "/api/feed/kelkoo",
                                "formato", "CSV TSV (tab-separated)",
                                "registrarEn", "https://merchants.kelkoo.es",
                                "actualizacion", "cada 6h con cache"
                        ),
                        "pricero", Map.of(
                                "url", "/api/feed/pricero",
                                "formato", "CSV semicolon + BOM UTF-8",
                                "registrarEn", "https://www.pricero.com/merchants",
                                "actualizacion", "cada 6h con cache"
                        ),
                        "shopmania", Map.of(
                                "url", "/api/feed/shopmania",
                                "formato", "CSV comma + BOM UTF-8",
                                "registrarEn", "https://www.shopmania.es/merchant",
                                "actualizacion", "cada 6h con cache"
                        ),
                        "idealo", Map.of(
                                "url", "/idealo/sync (POST)",
                                "formato", "API directa Idealo",
                                "descripcion", "Sincronización activa via API Idealo"
                        )
                )
        ));
    }

    // ────────────────────────────────────────────────────────────────────────
    // Helpers compartidos
    // ────────────────────────────────────────────────────────────────────────

    private String elegirTitulo(Producto p) {
        return (p.getTituloSeo() != null && !p.getTituloSeo().isBlank())
                ? p.getTituloSeo()
                : p.getNombre();
    }

    private String elegirDescripcion(Producto p) {
        if (p.getDescripcionSeo() != null && !p.getDescripcionSeo().isBlank()) {
            return p.getDescripcionSeo();
        }
        StringBuilder sb = new StringBuilder();
        sb.append(p.getNombre());
        if (p.getMarca() != null) sb.append(" de ").append(p.getMarca());
        sb.append(". Perfume original con envío rápido a toda España.");
        return sb.toString();
    }

    private String resolverImagenUrl(Producto p) {
        if (p.getImagenUrl() == null || p.getImagenUrl().isBlank()) return "";
        return p.getImagenUrl().startsWith("http")
                ? p.getImagenUrl()
                : imageProxyUrl + "?url=" + p.getImagenUrl();
    }

    private double precioFinal(Producto p) {
        boolean ofertaValida = p.getPrecioOferta() != null
                && p.getPrecioOferta().compareTo(BigDecimal.ZERO) > 0
                && p.getPrecioOferta().compareTo(p.getPrecio()) < 0;
        return ofertaValida ? p.getPrecioOferta().doubleValue() : p.getPrecio().doubleValue();
    }

    private String generarSlug(String nombre) {
        if (nombre == null) return "perfume";
        return nombre.toLowerCase()
                .replaceAll("[áàä]", "a").replaceAll("[éèë]", "e")
                .replaceAll("[íìï]", "i").replaceAll("[óòö]", "o")
                .replaceAll("[úùü]", "u").replaceAll("ñ", "n")
                .replaceAll("[^a-z0-9]+", "-").replaceAll("^-|-$", "");
    }

    /** Escapa tab-separated (Kelkoo): elimina tabs del contenido */
    private String escaparCsv(String s) {
        if (s == null) return "";
        return s.replace("\t", " ").replace("\n", " ").replace("\r", "");
    }

    /** Escapa semicolon-separated (Pricero): encierra en comillas si hay punto y coma */
    private String escaparCsvSemicolon(String s) {
        if (s == null) return "";
        s = s.replace("\n", " ").replace("\r", "");
        if (s.contains(";") || s.contains("\"")) {
            s = "\"" + s.replace("\"", "\"\"") + "\"";
        }
        return s;
    }

    /** Escapa comma-separated (Shopmania): encierra en comillas si hay coma */
    private String escaparCsvComa(String s) {
        if (s == null) return "";
        s = s.replace("\n", " ").replace("\r", "");
        if (s.contains(",") || s.contains("\"")) {
            s = "\"" + s.replace("\"", "\"\"") + "\"";
        }
        return s;
    }

    private String truncar(String texto, int maxLen) {
        if (texto == null) return "";
        return texto.length() > maxLen ? texto.substring(0, maxLen - 3) + "..." : texto;
    }
}
