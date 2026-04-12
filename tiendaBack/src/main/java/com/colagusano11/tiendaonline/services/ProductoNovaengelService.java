package com.colagusano11.tiendaonline.services;

import com.colagusano11.tiendaonline.config.NovaApiClient;
import com.colagusano11.tiendaonline.models.Distribuidor;
import com.colagusano11.tiendaonline.models.Producto;
import com.colagusano11.tiendaonline.repositories.ProductoRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Slf4j
public class ProductoNovaengelService {

    private final ProductoRepository productoRepository;
    private final NovaApiClient novaApiClient;
    private final NovaengelImportProcessor importProcessor;
    private final ObjectMapper mapper = new ObjectMapper();

    public ProductoNovaengelService(ProductoRepository productoRepository, 
                                   NovaApiClient novaApiClient,
                                   NovaengelImportProcessor importProcessor) {
        this.productoRepository = productoRepository;
        this.novaApiClient = novaApiClient;
        this.importProcessor = importProcessor;
    }

    /**
     * Importación global de productos (Catálogo completo)
     */
    public void importProductsNova() throws Exception {
        log.info("🚀 Iniciando importación completa de productos desde Novaengel");
        String json = novaApiClient.getAllProducts("es");
        JsonNode root = mapper.readTree(json);
        
        if (!root.isArray()) {
            log.error("❌ La respuesta de Novaengel no es un array de productos");
            return;
        }

        int total = root.size();
        log.info("📦 Catálogo de Novaengel recuperado. {} productos a procesar.", total);
        
        int count = 0;
        for (JsonNode node : root) {
            try {
                importProcessor.processProduct(node); // commit granular
                count++;
                
                if (count % 1000 == 0) {
                    log.info("⏳ Progreso Novaengel: {}/{} productos procesados...", count, total);
                }
            } catch (Exception e) {
                log.error("❌ Error procesando producto de Novaengel: {}", e.getMessage());
            }
        }
        log.info("✅ Importación de Novaengel finalizada. {} productos procesados.", count);
    }

    /**
     * Sincronización horaria de stock (sin crear productos nuevos)
     */
    public void syncStockNova() throws Exception {
        log.info("🔄 Iniciando sincronización de stock Novaengel");
        String json = novaApiClient.getAllProducts("es");
        JsonNode root = mapper.readTree(json);
        if (!root.isArray()) {
            log.error("❌ Respuesta Novaengel no es un array");
            return;
        }
        int count = 0;
        for (JsonNode node : root) {
            try {
                importProcessor.updateStockOnly(node);
                count++;
            } catch (Exception e) {
                log.error("❌ Error stock Novaengel: {}", e.getMessage());
            }
        }
        log.info("✅ Stock Novaengel actualizado: {} productos procesados.", count);
    }

    /**
     * Sincronización masiva de imágenes oficiales
     */
    public void syncMissingImages() {
        log.info("🖼️ Iniciando recuperación de imágenes oficiales de Novaengel...");
        List<Producto> productos = productoRepository.findByDistribuidorAndImagenIsNull(Distribuidor.NOVAENGEL);
        log.info("📦 Encontrados {} productos de Novaengel sin imagen", productos.size());

        if (productos.isEmpty()) return;

        new Thread(() -> {
            for (Producto p : productos) {
                try {
                    // Evitar 429 Too Many Requests
                    Thread.sleep(800);

                    // CRITICAL FIX: Usar SkuProveedor en lugar de EAN para Novaengel
                    String identifier = (p.getSkuProveedor() != null && !p.getSkuProveedor().isBlank()) 
                                        ? p.getSkuProveedor() : p.getEan();
                    
                    log.info("🌐 Consultando imagen para EAN: {} (ID Proveedor: {})", p.getEan(), identifier);
                    String resBody = novaApiClient.getProductImages(identifier);
                    String imageUrl = getImageUrlFromResponse(resBody, identifier);
                    
                    if (imageUrl != null && !imageUrl.isBlank()) {
                        updateProductImage(p.getId(), imageUrl);
                        log.info("✅ Imagen recuperada y guardada para EAN: {}", p.getEan());
                    } else {
                        log.warn("⚠️ Imagen NO disponible en Novaengel para ID: {}", identifier);
                    }
                } catch (Exception e) {
                    log.error("❌ Error recuperando foto para {}: {}", p.getEan(), e.getMessage());
                }
            }
            log.info("🏁 Finalizada la sincronización de imágenes de Novaengel");
        }).start();
    }

    /**
     * Método auxiliar transaccional para actualizar el producto desde un hilo separado
     */
    @Transactional
    public void updateProductImage(Long id, String imageUrl) {
        productoRepository.findById(id).ifPresent(p -> {
            p.setImagen(imageUrl);
            productoRepository.save(p);
        });
    }

    private String getImageUrlFromResponse(String body, String id) {
        try {
            JsonNode root = mapper.readTree(body);
            
            // FIX: Novaengel devuelve la URL directamente como un String JSON ("http://...")
            if (root.isTextual()) {
                return root.asText();
            }

            // Fallback: buscar el campo "Image" (por si algunos productos lo devuelven así)
            if (root.has("Image") && !root.get("Image").isNull()) {
                return root.get("Image").asText();
            }
            log.debug("🔍 Respuesta JSON de Novaengel para ID {}: {}", id, body);
        } catch (Exception e) {
            log.error("Error parseando imagen para {}: {}", id, e.getMessage());
        }
        return null;
    }

    public byte[] getNovaengelImage(String imageUrl) throws Exception {
        return novaApiClient.fetchImageBytes(imageUrl);
    }
}
