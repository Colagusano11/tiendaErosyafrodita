package com.colagusano11.tiendaonline.controllers;

import com.colagusano11.tiendaonline.models.Producto;
import com.colagusano11.tiendaonline.repositories.ProductoRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;

/**
 * Genera el sitemap.xml dinámico y robots.txt.
 *
 * URLs públicas:
 *   GET /sitemap.xml           → Sitemap con todos los productos activos + páginas estáticas
 *   GET /robots.txt            → Robots.txt apuntando al sitemap
 *
 * Estas URLs deben estar FUERA del prefijo /api para que Google las encuentre
 * en la raíz del dominio. Configurar en Spring Security como permitAll().
 *
 * Ejemplo de URL real: https://erosyafrodita.com/sitemap.xml
 * (si el frontend y el backend comparten dominio vía reverse proxy)
 *
 * Si backend y frontend están en dominios distintos (api.erosyafrodita.com vs erosyafrodita.com),
 * añade en tu servidor Nginx/Caddy una regla que proxy-pase /sitemap.xml y /robots.txt
 * desde el dominio raíz a este controlador.
 */
@RestController
public class SitemapController {

    @Value("${app.base.url:https://erosyafrodita.com}")
    private String baseUrl;

    private final ProductoRepository productoRepository;

    public SitemapController(ProductoRepository productoRepository) {
        this.productoRepository = productoRepository;
    }

    /**
     * Sitemap XML dinámico — regenerado en cada petición (es un endpoint GET ligero).
     *
     * Incluye:
     *  - Página de inicio
     *  - Páginas de categoría (/catalog?categoria=...)
     *  - Página de cada producto activo (/perfume/{slug})
     *
     * Google indexa ~50.000 URLs por sitemap. Con el catálogo actual está lejos de ese límite.
     */
    @GetMapping(value = "/sitemap.xml", produces = MediaType.APPLICATION_XML_VALUE)
    public ResponseEntity<String> sitemap() {
        List<Producto> productos = productoRepository.findByActivoTrue();
        String hoy = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE);

        StringBuilder sb = new StringBuilder();
        sb.append("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n")
          .append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");

        // ── Páginas estáticas ──────────────────────────────────────────────
        appendUrl(sb, baseUrl + "/",               hoy, "daily",   "1.00");
        appendUrl(sb, baseUrl + "/#/catalog",       hoy, "daily",   "0.90");
        appendUrl(sb, baseUrl + "/#/about",         hoy, "monthly", "0.30");
        appendUrl(sb, baseUrl + "/#/contact",       hoy, "monthly", "0.30");
        appendUrl(sb, baseUrl + "/#/faq",           hoy, "monthly", "0.30");

        // ── Páginas de categoría ────────────────────────────────────────────
        List.of(
            "Perfumes Hombre", "Perfumes Mujer", "Perfumes Unisex",
            "Novedades", "Ofertas"
        ).forEach(cat -> {
            String catSlug = cat.toLowerCase().replace(" ", "-");
            appendUrl(sb, baseUrl + "/#/catalog?categoria=" + catSlug, hoy, "weekly", "0.70");
        });

        // ── Páginas de producto ─────────────────────────────────────────────
        for (Producto p : productos) {
            if (p.getSlug() == null || p.getSlug().isBlank()) continue;

            // Fecha de última modificación: usar updatedAt si existe, si no la fecha actual
            String lastMod = hoy;
            if (p.getUpdatedAt() != null) {
                lastMod = p.getUpdatedAt().toLocalDate().format(DateTimeFormatter.ISO_LOCAL_DATE);
            }

            // Prioridad mayor para productos en oferta o en stock
            String priority = p.isEnOferta() ? "0.90" : (p.getStock() > 0 ? "0.80" : "0.50");

            appendUrl(sb, baseUrl + "/#/product/" + p.getSlug(), lastMod, "weekly", priority);
        }

        sb.append("</urlset>");
        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_XML)
            .header("Cache-Control", "public, max-age=3600") // cacheado 1h
            .body(sb.toString());
    }

    /**
     * robots.txt — le indica a los crawlers dónde está el sitemap
     * y bloquea las rutas de admin y API privadas.
     */
    @GetMapping(value = "/robots.txt", produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> robots() {
        String body =
            "User-agent: *\n" +
            "Allow: /\n" +
            "\n" +
            "# Rutas privadas — no indexar\n" +
            "Disallow: /api/admin/\n" +
            "Disallow: /api/auth/\n" +
            "Disallow: /#/checkout\n" +
            "Disallow: /#/cart\n" +
            "Disallow: /#/profile\n" +
            "Disallow: /#/login\n" +
            "Disallow: /#/admin\n" +
            "\n" +
            "Sitemap: " + baseUrl + "/sitemap.xml\n";

        return ResponseEntity.ok()
            .contentType(MediaType.TEXT_PLAIN)
            .header("Cache-Control", "public, max-age=86400") // cacheado 24h
            .body(body);
    }

    // ── Helper ─────────────────────────────────────────────────────────────
    private void appendUrl(StringBuilder sb, String loc, String lastMod,
                           String changefreq, String priority) {
        sb.append("  <url>\n")
          .append("    <loc>").append(loc).append("</loc>\n")
          .append("    <lastmod>").append(lastMod).append("</lastmod>\n")
          .append("    <changefreq>").append(changefreq).append("</changefreq>\n")
          .append("    <priority>").append(priority).append("</priority>\n")
          .append("  </url>\n");
    }
}
