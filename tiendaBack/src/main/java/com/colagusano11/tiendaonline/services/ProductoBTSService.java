package com.colagusano11.tiendaonline.services;

import java.math.BigDecimal;
import java.util.Optional;

import org.springframework.stereotype.Service;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.colagusano11.tiendaonline.config.BtsApiClient;
import com.colagusano11.tiendaonline.models.Categorias;
import com.colagusano11.tiendaonline.models.Distribuidor;
import com.colagusano11.tiendaonline.models.Producto;
import com.colagusano11.tiendaonline.repositories.CategoriasRepository;
import com.colagusano11.tiendaonline.repositories.ProductoRepository;

import jakarta.transaction.Transactional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class ProductoBTSService {

    private static final Logger log = LoggerFactory.getLogger(ProductoBTSService.class);

    private final ProductoRepository productoRepository;
    private final CategoriasRepository categoriasRepository;
    private final BtsApiClient btsApiClient;
    private final ObjectMapper mapper;

    public ProductoBTSService(ProductoRepository productoRepository, 
                               CategoriasRepository categoriasRepository,
                               BtsApiClient btsApiClient) {
        this.productoRepository = productoRepository;
        this.categoriasRepository = categoriasRepository;
        this.btsApiClient = btsApiClient;
        this.mapper = new ObjectMapper();
    }

    public void importProductsBts() {
        int page = 1;
        int sizePage = 200;
        boolean hasMore = true;

        log.info("🚀 Iniciando importación de productos desde BTS API");

        while (hasMore) {
            try {
                String json = btsApiClient.getProductsPage(page, sizePage);
                JsonNode root = mapper.readTree(json);
                JsonNode pag = root.get("pagination");
                JsonNode products = root.get("products");

                if (products == null || !products.isArray() || products.isEmpty()) {
                    hasMore = false;
                    break;
                }

                log.info("📦 Procesando página {} de BTS ({} productos)", page, products.size());

                for (JsonNode p : products) {
                    try {
                        processBtsProduct(p);
                    } catch (Exception e) {
                        log.error("❌ Error al procesar producto BTS: {}", e.getMessage());
                    }
                }

                int currentPage = pag.get("current_page").asInt();
                int totalPages = pag.get("total_pages").asInt();
                hasMore = currentPage < totalPages;
                if (hasMore) {
                    page++;
                }

            } catch (Exception e) {
                log.error("💥 Error crítico en la importación de BTS: {}", e.getMessage());
                hasMore = false;
            }
        }
        log.info("✅ Importación de BTS finalizada.");
    }

    @Transactional
    private void processBtsProduct(JsonNode p) {
        String btsSku = String.valueOf(p.get("id").asLong()).trim();
        String ean = extractEan(p);
        String name = p.hasNonNull("name") ? p.get("name").asText() : "";
        int stock = p.hasNonNull("stock") ? p.get("stock").asInt() : 0;
        BigDecimal price = safeBigDecimal(p, "price");
        String brand = p.hasNonNull("manufacturer") ? p.get("manufacturer").asText() : "";

        // FILTRO DE SEGURIDAD: Solo importamos productos de >= 12€ y que no sean DODOT
        if (price.compareTo(new BigDecimal("12")) < 0) {
            log.debug("⏭️ Saltando producto BTS por precio insuficiente: {} - {}€", name, price);
            return;
        }
        if (brand.toUpperCase().contains("DODOT")) {
            log.info("⏭️ Saltando producto BTS de marca bloqueada (DODOT): {}", name);
            return;
        }

        String image = p.hasNonNull("image") ? p.get("image").asText() : "";
        String gender = NovaengelImportProcessor.normalizeGender(p.hasNonNull("gender") ? p.get("gender").asText() : null);
        
        Distribuidor distribuidor = Distribuidor.BTS;
        Optional<Producto> optProducto = productoRepository.findByEanAndDistribuidor(ean, distribuidor);
        boolean esNuevo = optProducto.isEmpty();

        Producto producto;
        if (optProducto.isPresent()) {
            producto = optProducto.get();
        } else {
            producto = new Producto();
            producto.setEan(ean);
            producto.setDistribuidor(distribuidor);
        }

        // Categoría: BTS suele enviar IDs de categoría tipo "14498/15008"
        String rawCategoria = p.hasNonNull("categories") ? p.get("categories").asText().trim() : "";
        String nombreCategoria = "Sin Categoria";
        if (!rawCategoria.isEmpty()) {
            String numCategoria = rawCategoria.split("/")[0].trim();
            producto.setIdCategoria(numCategoria); // Guardamos el ID para futuras re-sincronizaciones
            nombreCategoria = categoriasRepository.findById(numCategoria)
                    .map(Categorias::getCategoria)
                    .orElse("Sin Categoria");
        }

        producto.setNombre(name);
        producto.setDescripcion(p.hasNonNull("description") ? p.get("description").asText() : "");
        producto.setPrecio(price);
        producto.setPrecioPVP(price); // El setter de Producto ya aplica el margen
        producto.setStock(stock);
        
        // El usuario quiere dejar la imagen de BTS en el "banquillo" (imagen4)
        // porque btswholesaler suele caerse los fines de semana.
        producto.setImagen4(image); 
        
        // Si la imagen principal es nula o es de BTS, la dejamos nula para que el enrichment busque una mejor
        if (producto.getImagen() == null || producto.getImagen().contains("btswholesaler")) {
            producto.setImagen(null);
        }

        producto.setManufacturer(brand);
        producto.setGender(gender);
        producto.setCategoria(nombreCategoria);
        producto.setSkuProveedor(btsSku);
        producto.setSku("B" + btsSku);
        if (esNuevo) producto.setNuevo(true);

        productoRepository.save(producto);
    }

    private String extractEan(JsonNode p) {
        JsonNode eanNode = p.get("ean");
        if (eanNode == null || eanNode.isNull()) {
            return "0";
        } else if (eanNode.isArray() && eanNode.size() > 0) {
            return eanNode.get(0).asText();
        } else {
            return eanNode.asText();
        }
    }

    public void syncStockBts() {
        int page = 1;
        int sizePage = 200;
        boolean hasMore = true;
        int updated = 0;
        log.info("🔄 Iniciando sincronización de stock BTS");

        while (hasMore) {
            try {
                String json = btsApiClient.getProductsPage(page, sizePage);
                JsonNode root = mapper.readTree(json);
                JsonNode pag = root.get("pagination");
                JsonNode products = root.get("products");

                if (products == null || !products.isArray() || products.isEmpty()) {
                    hasMore = false;
                    break;
                }

                for (JsonNode p : products) {
                    try {
                        String ean = extractEan(p);
                        int stock = p.hasNonNull("stock") ? p.get("stock").asInt() : 0;
                        Optional<Producto> opt = productoRepository.findByEanAndDistribuidor(ean, Distribuidor.BTS);
                        if (opt.isPresent()) {
                            Producto prod = opt.get();
                            prod.setStock(stock);
                            productoRepository.save(prod);
                            updated++;
                        }
                    } catch (Exception e) {
                        log.error("❌ Error stock BTS producto: {}", e.getMessage());
                    }
                }

                int currentPage = pag.get("current_page").asInt();
                int totalPages  = pag.get("total_pages").asInt();
                hasMore = currentPage < totalPages;
                if (hasMore) page++;

            } catch (Exception e) {
                log.error("💥 Error en sync stock BTS: {}", e.getMessage());
                hasMore = false;
            }
        }
        log.info("✅ Stock BTS actualizado: {} productos.", updated);
    }

    private BigDecimal safeBigDecimal(JsonNode node, String field) {
        JsonNode v = node.get(field);
        if (v == null || v.isNull()) return BigDecimal.ZERO;
        try {
            String txt = v.asText().replace("€", "").replace(" ", "").replace(",", ".");
            return new BigDecimal(txt);
        } catch (Exception e) {
            return BigDecimal.ZERO;
        }
    }
}
