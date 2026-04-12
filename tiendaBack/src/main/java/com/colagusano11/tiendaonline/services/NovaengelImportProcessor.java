package com.colagusano11.tiendaonline.services;

import com.colagusano11.tiendaonline.models.Distribuidor;
import com.colagusano11.tiendaonline.models.Producto;
import com.colagusano11.tiendaonline.repositories.ProductoRepository;
import com.fasterxml.jackson.databind.JsonNode;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Component
@RequiredArgsConstructor
public class NovaengelImportProcessor {

    private final ProductoRepository productoRepository;

    /**
     * Procesa un producto individual de Novaengel en su propia transacción.
     * REQUIRES_NEW asegura que cada producto se guarde inmediatamente.
     */
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void processProduct(JsonNode node) {
        // Validación de campos obligatorios
        if (!node.has("Id") || node.get("Id").isNull()) {
            return;
        }

        String ean = null;
        if (node.has("EANs") && node.get("EANs").isArray() && node.get("EANs").size() > 0) {
            ean = node.get("EANs").get(0).asText();
        }

        if (ean == null || ean.isBlank()) {
            return;
        }

        java.math.BigDecimal price = node.has("Price") ? node.get("Price").decimalValue() : java.math.BigDecimal.ZERO;
        String brand = node.has("BrandName") && !node.get("BrandName").isNull() 
                        ? node.get("BrandName").asText() : "";

        // FILTRO DE SEGURIDAD: Solo importamos productos de >= 12€ y que no sean DODOT
        if (price.compareTo(new java.math.BigDecimal("12")) < 0) {
            return;
        }
        if (brand.toUpperCase().contains("DODOT")) {
            return;
        }

        java.util.Optional<Producto> existing = productoRepository.findByEanAndDistribuidor(ean, Distribuidor.NOVAENGEL);
        boolean esNuevo = existing.isEmpty();
        Producto producto = existing.orElseGet(Producto::new);

        producto.setEan(ean);
        producto.setDistribuidor(Distribuidor.NOVAENGEL);
        producto.setSkuProveedor(node.get("Id").asText());
        
        String nombre = (node.has("Description") && !node.get("Description").isNull()) 
                        ? node.get("Description").asText() : "Producto sin nombre";
        producto.setNombre(nombre);
        producto.setManufacturer(brand);
        producto.setPrecio(price);
        producto.setPrecioPVP(node.has("PVR") ? node.get("PVR").decimalValue() : java.math.BigDecimal.ZERO);
        producto.setStock(node.has("Stock") ? node.get("Stock").asInt() : 0);
        producto.setGender(normalizeGender(node.has("Gender") && !node.get("Gender").isNull() ? node.get("Gender").asText() : null));
        producto.setActivo(true);

        if (node.has("Families") && node.get("Families").isArray() && node.get("Families").size() > 0) {
            JsonNode family = node.get("Families").get(0);
            if (family.has("Id") && !family.get("Id").isNull()) {
                producto.setIdCategoria(family.get("Id").asText());
            }
            if (family.has("Name") && !family.get("Name").isNull()) {
                producto.setCategoria(family.get("Name").asText());
            }
        } else {
            if (producto.getCategoria() == null) {
                producto.setCategoria("Sin Categoria");
            }
        }

        if (esNuevo) producto.setNuevo(true);
        productoRepository.save(producto);
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void updateStockOnly(JsonNode node) {
        if (!node.has("EANs") || !node.get("EANs").isArray() || node.get("EANs").size() == 0) return;
        String ean = node.get("EANs").get(0).asText();
        if (ean == null || ean.isBlank()) return;
        int stock = node.has("Stock") ? node.get("Stock").asInt() : 0;
        productoRepository.findByEanAndDistribuidor(ean, Distribuidor.NOVAENGEL).ifPresent(p -> {
            p.setStock(stock);
            productoRepository.save(p);
        });
    }

    static String normalizeGender(String raw) {
        if (raw == null || raw.isBlank()) return null;
        String up = raw.trim().toUpperCase();
        switch (up) {
            case "HOMBRE": case "MAN": case "MEN": case "MALE":
            case "MASCULINO": case "MASCULIN": case "H": case "1":
                return "HOMBRE";
            case "MUJER": case "WOMAN": case "WOMEN": case "FEMALE":
            case "FEMENINO": case "FEMININ": case "F": case "2":
                return "MUJER";
            case "UNISEX": case "BOTH": case "AMBOS": case "U": case "3": case "MIXTO":
                return "UNISEX";
            default:
                if (up.contains("HOMBRE") || up.contains("MEN") || up.contains("MALE") || up.contains("MASCULIN")) return "HOMBRE";
                if (up.contains("MUJER") || up.contains("WOMEN") || up.contains("FEMALE") || up.contains("FEMININ")) return "MUJER";
                if (up.contains("UNISEX") || up.contains("AMBOS")) return "UNISEX";
                return null;
        }
    }
}
