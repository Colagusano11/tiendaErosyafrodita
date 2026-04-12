package com.colagusano11.tiendaonline.services;

import com.colagusano11.tiendaonline.config.BtsApiClient;
import com.colagusano11.tiendaonline.config.NovaApiClient;
import com.colagusano11.tiendaonline.models.Categorias;
import com.colagusano11.tiendaonline.repositories.CategoriasRepository;
import com.colagusano11.tiendaonline.models.Producto;
import com.colagusano11.tiendaonline.repositories.ProductoRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import jakarta.transaction.Transactional;
import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.List;
import org.springframework.core.io.ClassPathResource;

@Service
public class CategoriaImportService {

    private static final Logger log = LoggerFactory.getLogger(CategoriaImportService.class);

    private final CategoriasRepository categoriasRepository;
    private final ProductoRepository productoRepository;
    private final BtsApiClient btsApiClient;
    private final NovaApiClient novaApiClient;
    private final ObjectMapper mapper;

    public CategoriaImportService(CategoriasRepository categoriasRepository,
                                  ProductoRepository productoRepository,
                                  BtsApiClient btsApiClient,
                                  NovaApiClient novaApiClient) {
        this.categoriasRepository = categoriasRepository;
        this.productoRepository = productoRepository;
        this.btsApiClient = btsApiClient;
        this.novaApiClient = novaApiClient;
        this.mapper = new ObjectMapper();
    }

    @Transactional
    public void importAllCategories() {
        log.info("📂 Iniciando importación global de categorías para Eros & Afrodita");
        importCsvCategories();
        importBtsCategories();
        importNovaCategories();
        updateAllProductCategories();
        log.info("✅ Importación global de categorías finalizada");
    }

    private void importCsvCategories() {
        try {
            log.info("📑 Cargando categorías maestras desde CSV local...");
            ClassPathResource resource = new ClassPathResource("Relacion_Categorias_BTS.csv");
            try (BufferedReader reader = new BufferedReader(new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8))) {
                String line;
                boolean first = true;
                while ((line = reader.readLine()) != null) {
                    if (first) { first = false; continue; } // Skip header
                    String[] parts = line.split(";");
                    if (parts.length >= 2) {
                        processCategory(parts[0].trim(), parts[1].trim());
                    }
                }
            }
            log.info("✅ Categorías de CSV cargadas");
        } catch (Exception e) {
            log.warn("⚠️ No se pudo cargar el CSV de categorías fallback: {}", e.getMessage());
        }
    }

    private void importBtsCategories() {
        try {
            log.info("📦 Recuperando categorías de BTS...");
            String json = btsApiClient.getCategories();
            log.info("🔍 Respuesta bruta de BTS Categorías: {}", json);
            JsonNode root = mapper.readTree(json);
            
            // Según documentación, BTS devuelve el array de categorías directamente o puede venir envuelto.
            JsonNode categories = root.isArray() ? root : root.get("categories");

            if (categories != null && categories.isArray()) {
                for (JsonNode c : categories) {
                    processCategory(c.get("id").asText(), c.get("name").asText());
                }
            }
            log.info("✅ Categorías de BTS sincronizadas");
        } catch (Exception e) {
            log.error("❌ Error importando categorías BTS: {}", e.getMessage());
        }
    }

    private void importNovaCategories() {
        try {
            log.info("📦 Recuperando categorías de Novaengel...");
            String json = novaApiClient.getCategories();
            JsonNode root = mapper.readTree(json);
            // Nova suele devolver un array directo o bajo "Categories"
            JsonNode categories = root.isArray() ? root : root.get("Categories");

            if (categories != null && categories.isArray()) {
                for (JsonNode c : categories) {
                    String id = c.has("Id") ? c.get("Id").asText() : c.get("id").asText();
                    String name = c.has("Name") ? c.get("Name").asText() : c.get("name").asText();
                    processCategory(id, name);
                }
            }
            log.info("✅ Categorías de Novaengel sincronizadas");
        } catch (Exception e) {
            log.error("❌ Error importando categorías Novaengel: {}", e.getMessage());
        }
    }

    private void processCategory(String id, String name) {
        if (id == null || name == null) return;
        Categorias cat = categoriasRepository.findById(id).orElse(new Categorias());
        cat.setIdCategorias(id);
        cat.setCategoria(name);
        categoriasRepository.save(cat);
    }

    /**
     * Recorre todos los productos que tienen un ID de categoría y actualiza su nombre descriptivo
     * basándose en la tabla de categorías actualizada.
     */
    @Transactional
    public void updateAllProductCategories() {
        log.info("🔄 Re-asignando nombres de categorías a productos existentes...");
        List<Producto> productos = productoRepository.findAll();
        int count = 0;

        for (Producto p : productos) {
            String catId = p.getIdCategoria(); // Usando el nombre correcto del getter
            if (catId != null && !catId.isEmpty()) {
                String nuevoNombre = categoriasRepository.findById(catId)
                        .map(Categorias::getCategoria)
                        .orElse(null);
                
                if (nuevoNombre != null && !nuevoNombre.equals(p.getCategoria())) {
                    p.setCategoria(nuevoNombre);
                    // No hace falta save() explícito por el @Transactional si el objeto está gestionado, 
                    // pero lo ponemos para asegurar ante diferentes estados
                    productoRepository.save(p);
                    count++;
                }
            }
        }
        log.info("✅ Se han actualizado {} productos con nuevas categorías.", count);
    }
}
