package com.colagusano11.tiendaonline.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.colagusano11.tiendaonline.services.ProductoBTSService;
import com.colagusano11.tiendaonline.services.ProductoNovaengelService;
import com.colagusano11.tiendaonline.services.CategoriaImportService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/admin/import")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:4001", "http://127.0.0.1:4001"})
public class ProductImportController {

    private static final Logger log = LoggerFactory.getLogger(ProductImportController.class);

    private final ProductoBTSService btsService;
    private final ProductoNovaengelService novaService;
    private final CategoriaImportService categoriaImportService;

    public ProductImportController(ProductoBTSService btsService, 
                                   ProductoNovaengelService novaService,
                                   CategoriaImportService categoriaImportService) {
        this.btsService = btsService;
        this.novaService = novaService;
        this.categoriaImportService = categoriaImportService;
    }

    @PostMapping("/bts")
    public ResponseEntity<String> importBts() {
        log.info("📥 Petición manual para importar productos de BTS");
        new Thread(btsService::importProductsBts).start(); // Ejecución en segundo plano para no bloquear
        return ResponseEntity.ok("Importación de BTS iniciada en segundo plano.");
    }

    @PostMapping("/nova")
    public ResponseEntity<String> importNova() {
        log.info("📥 Petición manual para importar productos de Novaengel");
        new Thread(() -> {
            try {
                novaService.importProductsNova();
            } catch (Exception e) {
                log.error("❌ Error en importación manual de Novaengel: {}", e.getMessage());
            }
        }).start(); // Ejecución en segundo plano
        return ResponseEntity.ok("Importación de Novaengel iniciada en segundo plano.");
    }

    @PostMapping("/nova/images")
    public ResponseEntity<String> syncNovaImages() {
        log.info("🖼️ Petición manual para sincronizar imágenes de Novaengel");
        new Thread(novaService::syncMissingImages).start(); // Ejecución en segundo plano
        return ResponseEntity.ok("Sincronización de imágenes de Novaengel iniciada en segundo plano.");
    }

    @PostMapping("/web/images")
    public ResponseEntity<String> syncWebImages() {
        log.info("🌐 Petición manual para búsqueda inteligente de imágenes por EAN");
        // Ejecutamos el script Python externo mediante ProcessBuilder
        new Thread(() -> {
            try {
                ProcessBuilder pb = new ProcessBuilder("python3", "tools/image_enricher.py");
                pb.inheritIO();
                Process process = pb.start();
                process.waitFor();
                log.info("🌐 Búsqueda inteligente finalizada.");
            } catch (Exception e) {
                log.error("❌ Error ejecutando image_enricher.py: {}", e.getMessage());
            }
        }).start();
        return ResponseEntity.ok("Búsqueda inteligente iniciada en segundo plano.");
    }
    
    @PostMapping("/categories")
    public ResponseEntity<String> syncCategories() {
        log.info("📂 Petición manual para sincronizar taxonomía de categorías");
        new Thread(() -> {
            try {
                categoriaImportService.importAllCategories();
                log.info("✅ Diccionario de categorías actualizado. Refrescando productos...");
                // Podríamos lanzar un re-proceso ligero aquí si fuera necesario
            } catch (Exception e) {
                log.error("❌ Error en sincronización de categorías: {}", e.getMessage());
            }
        }).start();
        return ResponseEntity.ok("Sincronización de categorías en marcha.");
    }
}
