package com.colagusano11.tiendaonline.controllers;

import com.colagusano11.tiendaonline.services.ProductoNovaengelService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.util.Set;

@RestController
@RequestMapping("/proxy-image")
@CrossOrigin(origins = "*")
public class ProxyController {

    private static final Set<String> ALLOWED_HOSTS = Set.of(
        "drop.novaengel.com",
        "images-na.ssl-images-amazon.com",
        "m.media-amazon.com",
        "pics.novaengel.com"
    );

    @Autowired
    private ProductoNovaengelService novaService;

    @GetMapping
    public ResponseEntity<byte[]> proxyImage(@RequestParam String url) {
        System.out.println("📥 Petición de proxy (ROOT) para imagen: " + url);

        // ── SSRF Protection: validate URL before making any HTTP call ───────
        try {
            URI parsed = URI.create(url);
            String host = parsed.getHost();
            if (host == null || !ALLOWED_HOSTS.contains(host.toLowerCase())) {
                System.err.println("❌ SSRF bloqueado: host no permitido -> " + host);
                return ResponseEntity.status(403).build();
            }
            // Only http/https
            String scheme = parsed.getScheme();
            if (!"http".equalsIgnoreCase(scheme) && !"https".equalsIgnoreCase(scheme)) {
                return ResponseEntity.status(403).build();
            }
        } catch (IllegalArgumentException e) {
            return ResponseEntity.status(400).build();
        }

        try {
            byte[] image = novaService.getNovaengelImage(url);
            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_JPEG)
                    .body(image);
        } catch (Exception e) {
            System.err.println("❌ Fallo crítico en el proxy (ROOT) de imagen: " + e.getMessage());
            return ResponseEntity.status(404).build();
        }
    }
}
