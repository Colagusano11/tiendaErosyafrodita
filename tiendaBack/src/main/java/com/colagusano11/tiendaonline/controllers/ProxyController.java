package com.colagusano11.tiendaonline.controllers;

import com.colagusano11.tiendaonline.services.ProductoNovaengelService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/proxy-image")
@CrossOrigin(origins = "*")
public class ProxyController {

    @Autowired
    private ProductoNovaengelService novaService;

    @GetMapping
    public ResponseEntity<byte[]> proxyImage(@RequestParam String url) {
        System.out.println("📥 Petición de proxy (ROOT) para imagen: " + url);
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
