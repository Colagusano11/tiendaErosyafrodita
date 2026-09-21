package com.colagusano11.tiendaonline.controllers;

import com.colagusano11.tiendaonline.models.Producto;
import com.colagusano11.tiendaonline.repositories.ProductoRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

/**
 * Vista mínima con las meta-etiquetas Open Graph correctas para un producto,
 * pensada solo para los robots de vista previa de redes sociales (WhatsApp,
 * Facebook, Twitter/X, Telegram, Slack, Discord, LinkedIn...).
 *
 * La app real es una SPA de React: esos robots no ejecutan JavaScript, así
 * que siempre veían la imagen genérica del index.html sin importar qué
 * producto se compartiera. nginx detecta el User-Agent del robot y reenvía
 * SOLO esas peticiones a /social-preview/product/{slug} — un usuario real
 * sigue recibiendo la SPA normal (ver erosyafrodita/nginx.conf).
 */
@RestController
public class SocialPreviewController {

    private final ProductoRepository productoRepository;

    @Value("${app.base.url:https://ageperfumes.com}")
    private String baseUrl;

    public SocialPreviewController(ProductoRepository productoRepository) {
        this.productoRepository = productoRepository;
    }

    @GetMapping(value = "/social-preview/product/{slug}", produces = "text/html;charset=UTF-8")
    public ResponseEntity<String> productPreview(@PathVariable String slug) {
        Producto p = productoRepository.findBySlug(slug).orElse(null);
        if (p == null) {
            return ResponseEntity.notFound().build();
        }

        String title = (p.getTituloSeo() != null && !p.getTituloSeo().isBlank())
                ? p.getTituloSeo() : p.getNombre();
        String description = (p.getDescripcionSeo() != null && !p.getDescripcionSeo().isBlank())
                ? p.getDescripcionSeo() : truncar(p.getDescripcion(), 300);
        String image = (p.getImagen() != null && !p.getImagen().isBlank())
                ? p.getImagen() : baseUrl + "/og-image.png";
        String url = baseUrl + "/product/" + p.getSlug();

        String html = "<!DOCTYPE html><html lang=\"es\"><head>"
                + "<meta charset=\"UTF-8\">"
                + "<meta property=\"og:site_name\" content=\"AGE Parfums\">"
                + "<meta property=\"og:type\" content=\"product\">"
                + "<meta property=\"og:title\" content=\"" + escapar(title) + "\">"
                + "<meta property=\"og:description\" content=\"" + escapar(description) + "\">"
                + "<meta property=\"og:image\" content=\"" + escapar(image) + "\">"
                + "<meta property=\"og:image:secure_url\" content=\"" + escapar(image) + "\">"
                + "<meta property=\"og:url\" content=\"" + escapar(url) + "\">"
                + "<meta property=\"og:locale\" content=\"es_ES\">"
                + "<meta name=\"twitter:card\" content=\"summary_large_image\">"
                + "<meta name=\"twitter:title\" content=\"" + escapar(title) + "\">"
                + "<meta name=\"twitter:description\" content=\"" + escapar(description) + "\">"
                + "<meta name=\"twitter:image\" content=\"" + escapar(image) + "\">"
                + "<title>" + escapar(title) + "</title>"
                + "</head><body>"
                + "<h1>" + escapar(title) + "</h1>"
                + "<p>" + escapar(description) + "</p>"
                + "<img src=\"" + escapar(image) + "\" alt=\"" + escapar(title) + "\">"
                + "</body></html>";

        return ResponseEntity.ok().body(html);
    }

    private String truncar(String texto, int max) {
        if (texto == null) return "";
        return texto.length() > max ? texto.substring(0, max) + "..." : texto;
    }

    private String escapar(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;")
                .replace("\"", "&quot;")
                .replace("<", "&lt;")
                .replace(">", "&gt;");
    }
}
