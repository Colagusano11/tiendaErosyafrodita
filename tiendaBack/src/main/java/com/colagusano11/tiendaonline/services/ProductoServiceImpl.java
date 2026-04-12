package com.colagusano11.tiendaonline.services;

import java.math.BigDecimal;
import java.util.List;
import java.math.RoundingMode;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import com.colagusano11.tiendaonline.models.Configuracion;
import com.colagusano11.tiendaonline.models.Distribuidor;
import com.colagusano11.tiendaonline.models.Producto;
import com.colagusano11.tiendaonline.models.ProductoVenta;
import com.colagusano11.tiendaonline.repositories.ConfiguracionRepository;
import com.colagusano11.tiendaonline.repositories.ProductoRepository;
import com.colagusano11.tiendaonline.repositories.CategoriasRepository;

@Service
@Transactional
public class ProductoServiceImpl implements ProductoService {

    private final ProductoRepository productoRepository;
    private final ConfiguracionRepository configuracionRepository;
    private final CategoriasRepository categoriasRepository;

    public ProductoServiceImpl(ProductoRepository productoRepository, 
                               ConfiguracionRepository configuracionRepository,
                               CategoriasRepository categoriasRepository) {
        this.productoRepository = productoRepository;
        this.configuracionRepository = configuracionRepository;
        this.categoriasRepository = categoriasRepository;
    }

    @Override
    public Producto getProducto(Long id) {
        return productoRepository.findById(id).orElseThrow(
                () -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Producto no encontrado"));
    }

    @Override
    public List<Producto> getAllProductos() {
        return productoRepository.findAll();
    }

    @Override
    public Producto findById(Long id) {
        return productoRepository.findById(id).orElse(null);
    }

    @Override
    public Producto findByEan(String ean) {
        return productoRepository.findByEan(ean).orElse(null);
    }

    @Override
    public List<Producto> findAllByEan(String ean) {
        return productoRepository.findAllByEanOrderByPrecioAsc(ean);
    }

    @Override
    public String createSku(Producto p) {
        if (p.getDistribuidor() == Distribuidor.BTS) {
            return "B" + p.getSkuProveedor();
        } else if (p.getDistribuidor() == Distribuidor.NOVAENGEL) {
            return "N" + p.getSkuProveedor();
        }
        
        // Fallback para otros distribuidores o creación manual
        String prov = p.getDistribuidor() != null ? p.getDistribuidor().name().substring(0, 3) : "GEN";
        String marca = p.getManufacturer() != null ? p.getManufacturer().toUpperCase() : "GEN";
        marca = marca.replaceAll("[^A-Z0-9]", "");
        if (marca.length() > 3) {
            marca = marca.substring(0, 3);
        } else if (marca.length() < 3) {
            marca = String.format("%-3s", marca).replace(' ', 'X');
        }
        String idEan = p.getEan() != null ? p.getEan() : "0";
        if (idEan.length() > 3) idEan = idEan.substring(0, 3);

        return prov + "-" + marca + "-" + idEan;
    }

    @Override
    public String createSku2(Producto p) {
        String prov = "NAY";
        String marca = p.getManufacturer() != null ? p.getManufacturer().toUpperCase() : "GEN";
        marca = marca.replaceAll("[^A-Z0-9]", "");
        if (marca.length() > 3) {
            marca = marca.substring(0, 3);
        } else if (marca.length() < 3) {
            marca = String.format("%-3s", marca).replace(' ', 'X');
        }
        String idEan = p.getEan() != null ? p.getEan() : "0";
        if (idEan.length() > 3) idEan = idEan.substring(0, 3);

        return prov + "-" + marca + "-" + idEan;
    }

    @Override
    public Producto findByEanAndDistribuidor(String ean, Distribuidor distribuidor) {
        return productoRepository.findByEanAndDistribuidor(ean, distribuidor).orElse(null);
    }
    @Override
    public Page<Producto> filtrarProductos(String manufacturer,
                                           String nombre,
                                           String sku,
                                           String distribuidor,
                                           String rangoPrecio,
                                           BigDecimal minPrecio,
                                           BigDecimal maxPrecio,
                                           String orden, String gender,
                                           String categoria,
                                           String status,
                                           int page, int size) {

        Sort sort = Sort.unsorted();
        if ("precioDesc".equalsIgnoreCase(orden)) {
            sort = Sort.by(Sort.Direction.DESC, "precio");
        } else if ("precioAsc".equalsIgnoreCase(orden)) {
            sort = Sort.by(Sort.Direction.ASC, "precio");
        }

        Pageable pageable = PageRequest.of(page, size, sort);
        Distribuidor distEnum = null;
        if (distribuidor != null && !distribuidor.trim().isEmpty()) {
            try {
                distEnum = Distribuidor.valueOf(distribuidor.toUpperCase());
            } catch (IllegalArgumentException e) {
                // Si no es un enum válido, podrías manejarlo o dejarlo null
            }
        }

        return productoRepository.searchAdvanced(nombre, categoria, distEnum, manufacturer, sku, status, minPrecio, maxPrecio, pageable);
    }

    @Override
    public List<Long> filtrarIds(String manufacturer, String nombre, String sku, String distribuidor, String rangePrecio, BigDecimal minPrecio, BigDecimal maxPrecio, String gender, String categoria, String status) {
        Distribuidor distEnum = null;
        if (distribuidor != null && !distribuidor.trim().isEmpty()) {
            try {
                distEnum = Distribuidor.valueOf(distribuidor.toUpperCase());
            } catch (IllegalArgumentException e) {}
        }

        // Para IDs, podemos usar una versión simplificada o reutilizar searchAdvanced con un tamaño grande
        // Pero lo ideal es no cargar todos los objetos si solo queremos IDs. 
        // Por consistencia y simplicidad ahora, pediremos una página muy grande o implementaremos un método específico.
        // Dado el volumen (60k), mejor un método específico en el repo para IDs si es crítico, 
        // pero searchAdvanced ya está optimizado en el repo.
        return productoRepository.searchAdvanced(nombre, categoria, distEnum, manufacturer, sku, status, minPrecio, maxPrecio, Pageable.unpaged())
                .getContent()
                .stream()
                .map(Producto::getId)
                .toList();
    }

    @Override
    public Page<ProductoVenta> getAllProductosVenta(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Producto> productPage = productoRepository.findBestPriceActiveProducts(pageable);
        return productPage.map(p -> {
            ProductoVenta pv = new ProductoVenta();
            pv.setId(p.getId());
            pv.setNombre(p.getNombre());
            pv.setDescripcion(p.getDescripcion());
            pv.setPrecio(p.isEnOferta() ? p.getPrecioOferta() : (p.getPrecioPVP() != null ? p.getPrecioPVP() : p.getPrecio()));
            pv.setStock(p.getStock());
            pv.setImagen(p.getImagen());
            pv.setManufacter(p.getManufacturer());
            pv.setSku(p.getSku());
            pv.setCategoria(p.getCategoria());
            pv.setGender(p.getGender());
            pv.setEnOferta(p.isEnOferta());
            pv.setPrecioOriginal(p.getPrecioPVP() != null ? p.getPrecioPVP() : p.getPrecio());
            pv.setImagen2(p.getImagen2());
            pv.setImagen3(p.getImagen3());
            return pv;
        });
    }

    @Override
    public List<Producto> getProductosOrdenadosByPrecio(String orden) {
        if (orden.equalsIgnoreCase("desc")) {
            return productoRepository.findAllByOrderByPrecioDesc();
        } else {
            return productoRepository.findAllByOrderByPrecioAsc();
        }
    }

    @Override
    public Producto save(Producto p) {
        if (p.getSku() == null) {
            p.setSku(createSku(p));
        }
        return productoRepository.save(p);
    }

    @Override
    public Producto update(Long id, Producto updated) {
        Producto existing = getProducto(id);
        existing.setNombre(updated.getNombre());
        existing.setDescripcion(updated.getDescripcion());
        existing.setPrecio(updated.getPrecio());
        existing.setStock(updated.getStock());
        existing.setImagen(updated.getImagen());
        existing.setManufacturer(updated.getManufacturer());
        existing.setGender(updated.getGender());
        existing.setCategoria(updated.getCategoria());
        existing.setActivo(updated.isActivo());
        
        if (updated.getPrecioPVP() != null) {
            existing.setPrecioPVP(updated.getPrecioPVP());
        }
        
        return productoRepository.save(existing);
    }

    @Override
    public void updateBulkStatus(List<Long> ids, boolean activo) {
        if (ids == null || ids.isEmpty()) return;
        System.out.println("BULK STATUS IDS: Procesando " + ids.size() + " productos en lotes.");
        for (int i = 0; i < ids.size(); i += 500) {
            List<Long> batch = ids.subList(i, Math.min(i + 500, ids.size()));
             System.out.println("BULK STATUS IDS: Lote " + (i/500 + 1) + " de " + (ids.size()/500 + 1));
            productoRepository.updateBulkStatus(batch, activo);
        }
        System.out.println("BULK STATUS IDS: Finalizado.");
    }

    @Override
    public void updateBulkStatusByFilters(boolean activo, String manufacturer, String nombre, String sku, String distribuidor, BigDecimal minPrecio, BigDecimal maxPrecio, String categoria, String status) {
        manufacturer = sanitize(manufacturer);
        nombre = sanitize(nombre);
        sku = sanitize(sku);
        categoria = sanitize(categoria);
        distribuidor = sanitize(distribuidor);
        
        Distribuidor distEnum = null;
        if (distribuidor != null) {
            try { distEnum = Distribuidor.valueOf(distribuidor.toUpperCase()); } catch (Exception e) {}
        }
        
        List<Long> ids = productoRepository.searchIds(manufacturer, nombre, sku, distEnum, minPrecio, maxPrecio, categoria, status);
        
        System.out.println("BULK STATUS: Encontrados " + (ids != null ? ids.size() : 0) + " productos para actualizar.");
        
        if (ids == null || ids.isEmpty()) return;
        
        // Procesar en lotes de 500 para evitar bloqueos y saturación de la BD
        for (int i = 0; i < ids.size(); i += 500) {
            List<Long> batch = ids.subList(i, Math.min(i + 500, ids.size()));
            System.out.println("BULK STATUS: Procesando lote de " + batch.size() + " productos (" + i + " - " + (i + batch.size()) + ")");
            productoRepository.updateBulkStatus(batch, activo);
        }
        System.out.println("BULK STATUS: Finalizado.");
    }

    @Override
    public void updatePricingConfig(Configuracion config, List<Long> ids, Distribuidor distribuidor) {
        configuracionRepository.deleteAll();
        configuracionRepository.save(config);

        // Nueva lógica: PVP = ((Precio + Envio) * IVA_Factor / (1 - Margen/100)) + Comision_Tarjeta
        BigDecimal factorIva = BigDecimal.ONE.add(config.getIva().divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP));
        BigDecimal divisorMargen = BigDecimal.ONE.subtract(config.getMargen().divide(new BigDecimal("100"), 4, RoundingMode.HALF_UP));
        BigDecimal envio = config.getEnvio();
        BigDecimal comisionTarjeta = config.getComisionTarjeta();

        if (ids != null && !ids.isEmpty()) {
            if (distribuidor != null) {
                productoRepository.updateSelectedProviderPricing(ids, factorIva, divisorMargen, envio, comisionTarjeta, distribuidor);
            } else {
                productoRepository.updateSelectedPricing(ids, factorIva, divisorMargen, envio, comisionTarjeta);
            }
        } else {
            if (distribuidor != null) {
                productoRepository.updateProviderPricing(factorIva, divisorMargen, envio, comisionTarjeta, distribuidor);
            } else {
                productoRepository.updateAllPricing(factorIva, divisorMargen, envio, comisionTarjeta);
            }
        }
    }

    @Override
    public Configuracion getConfiguracion() {
        return configuracionRepository.findAll().stream().findFirst().orElse(
            new Configuracion(new BigDecimal("21"), new BigDecimal("25"), new BigDecimal("5"), new BigDecimal("1.20"))
        );
    }

    @Override
    public void updateBulkOffer(List<Long> ids, boolean enOferta, BigDecimal descuento) {
        if (ids == null || ids.isEmpty()) return;
        System.out.println("BULK OFFER IDS: Procesando " + ids.size() + " productos en lotes.");
        for (int i = 0; i < ids.size(); i += 500) {
            List<Long> batch = ids.subList(i, Math.min(i + 500, ids.size()));
            productoRepository.updateBulkOffer(batch, enOferta, descuento);
        }
        System.out.println("BULK OFFER IDS: Finalizado.");
    }

    @Override
    public void updateBulkOfferByFilters(boolean enOferta, BigDecimal descuento, String manufacturer, String nombre, String sku, String distribuidor, BigDecimal minPrecio, BigDecimal maxPrecio, String categoria, String status) {
        manufacturer = sanitize(manufacturer);
        nombre = sanitize(nombre);
        sku = sanitize(sku);
        categoria = sanitize(categoria);
        distribuidor = sanitize(distribuidor);

        Distribuidor distEnum = null;
        if (distribuidor != null) {
            try { distEnum = Distribuidor.valueOf(distribuidor.toUpperCase()); } catch (Exception e) {}
        }
        
        List<Long> ids = productoRepository.searchIds(manufacturer, nombre, sku, distEnum, minPrecio, maxPrecio, categoria, status);
        
        if (ids == null || ids.isEmpty()) return;
        
        // Procesar en lotes de 500
        for (int i = 0; i < ids.size(); i += 500) {
            List<Long> batch = ids.subList(i, Math.min(i + 500, ids.size()));
            productoRepository.updateBulkOffer(batch, enOferta, descuento);
        }
    }

    @Override
    public void delete(Long id) {
        if (!productoRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Producto no encontrado");
        }
        productoRepository.deleteById(id);
    }

    @Override
    public List<String> getAllCategorias() {
        List<String> deProductos = productoRepository.findAllDistinctCategorias();
        List<String> mapeadas = categoriasRepository.findAll().stream().map(c -> c.getCategoria()).toList();

        if (mapeadas != null && !mapeadas.isEmpty()) return mapeadas;
        return deProductos;
    }

    @Override
    public List<String> getAllManufacturers() {
        return productoRepository.findAllDistinctManufacturers();
    }

    @Override
    public List<String> getAllDistribuidores() {
        return productoRepository.findAllDistinctDistribuidores();
    }

    private String sanitize(String s) {
        if (s == null || s.trim().isEmpty()) return null;
        return s.trim();
    }
}
