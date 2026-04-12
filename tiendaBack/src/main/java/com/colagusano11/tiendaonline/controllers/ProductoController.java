package com.colagusano11.tiendaonline.controllers;

import com.colagusano11.tiendaonline.models.Configuracion;
import com.colagusano11.tiendaonline.models.Distribuidor;
import com.colagusano11.tiendaonline.models.Producto;
import com.colagusano11.tiendaonline.models.ProductoVenta;
import com.colagusano11.tiendaonline.services.ProductoService;
import com.colagusano11.tiendaonline.services.ProductoNovaengelService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import com.fasterxml.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/productos")
@CrossOrigin(origins = "http://localhost:3000")
public class ProductoController {

    @Autowired
    private ProductoService productoService;

    @Autowired
    private ProductoNovaengelService novaService;

    public ProductoController(){}

    @GetMapping("/{id}")
    public Producto getProducto(@PathVariable Long id){
        return productoService.getProducto(id);
    }

    @GetMapping("/ean/{ean}/opciones")
    public List<Producto> getOpcionesByEan(@PathVariable String ean) {
        return productoService.findAllByEan(ean);
    }

    @GetMapping
    public List<Producto> getAllProductos(){
        return productoService.getAllProductos();
    }

    @GetMapping("/filtro")
    public Page<Producto> filtrarProductos(
            @RequestParam(required = false) String manufacturer,
            @RequestParam(required = false) String nombre,
            @RequestParam(required = false) String sku,
            @RequestParam(required = false) String distribuidor,
            @RequestParam(required = false) String rangoPrecio,
            @RequestParam(required = false) BigDecimal minPrecio,
            @RequestParam(required = false) BigDecimal maxPrecio,
            @RequestParam(required = false) String gender,
            @RequestParam(required = false) String categoria,   
            @RequestParam(required = false) String status,
            @RequestParam(required = false, defaultValue = "precioAsc") String orden,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        return productoService.filtrarProductos(manufacturer, nombre, sku, distribuidor, rangoPrecio, minPrecio, maxPrecio, orden, gender, categoria, status, page, size);
    }

    @GetMapping("/filtro/ids")
    public List<Long> getFiltrarIds(
            @RequestParam(required = false) String manufacturer,
            @RequestParam(required = false) String nombre,
            @RequestParam(required = false) String sku,
            @RequestParam(required = false) String distribuidor,
            @RequestParam(required = false) String rangoPrecio,
            @RequestParam(required = false) BigDecimal minPrecio,
            @RequestParam(required = false) BigDecimal maxPrecio,
            @RequestParam(required = false) String gender,
            @RequestParam(required = false) String categoria,
            @RequestParam(required = false) String status
    ) {
        return productoService.filtrarIds(manufacturer, nombre, sku, distribuidor, rangoPrecio, minPrecio, maxPrecio, gender, categoria, status);
    }

    @GetMapping("/venta")
    public Page<ProductoVenta> getAllProductosVenta(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ){
        return productoService.getAllProductosVenta(page, size);
    }

    @GetMapping("/categorias")
    public List<String> getAllCategorias() {
        return productoService.getAllCategorias();
    }

    @GetMapping("/marcas")
    public List<String> getAllManufacturers() {
        return productoService.getAllManufacturers();
    }

    @GetMapping("/proveedores")
    public List<String> getAllDistribuidores() {
        return productoService.getAllDistribuidores();
    }

    // Métodos Admin
    @PostMapping
    public Producto createProducto(@RequestBody Producto producto) {
        return productoService.save(producto);
    }

    @PutMapping("/{id}")
    public Producto updateProducto(@PathVariable Long id, @RequestBody Producto producto) {
        return productoService.update(id, producto);
    }

    @PutMapping("/bulk-status")
    public void updateBulkStatus(@RequestBody Map<String, Object> body) {
        boolean activo = (boolean) body.get("activo");
        Object idsObj = body.get("ids");
        
        System.out.println("BULK STATUS REQUEST - Activo: " + activo + ", Has IDs: " + (idsObj != null) + ", Has Filters: " + body.containsKey("filters"));

        if (idsObj instanceof List<?> && !((List<?>) idsObj).isEmpty()) {
            List<Long> ids = ((List<?>) idsObj).stream()
                .map(id -> Long.valueOf(id.toString()))
                .toList();
            System.out.println("BULK STATUS: Procesando por lista de IDs (" + ids.size() + ")");
            productoService.updateBulkStatus(ids, activo);
        } 
        
        if (body.containsKey("filters")) {
            @SuppressWarnings("unchecked")
            Map<String, Object> filters = (Map<String, Object>) body.get("filters");
            System.out.println("BULK STATUS: Procesando por filtros: " + filters);
            productoService.updateBulkStatusByFilters(
                activo,
                (String) filters.get("manufacturer"),
                (String) filters.get("nombre"),
                (String) filters.get("sku"),
                (String) filters.get("distribuidor"),
                filters.get("minPrecio") != null ? new BigDecimal(filters.get("minPrecio").toString()) : null,
                filters.get("maxPrecio") != null ? new BigDecimal(filters.get("maxPrecio").toString()) : null,
                (String) filters.get("categoria"),
                (String) filters.get("gender"),
                (String) filters.get("status")
            );
        }
    }


    @GetMapping("/config")
    public Configuracion getConfig() {
        return productoService.getConfiguracion();
    }

    @PutMapping("/bulk-pricing")
    public void updateBulkPricing(@RequestBody Map<String, Object> body) {
        ObjectMapper mapper = new ObjectMapper();
        Configuracion config = mapper.convertValue(body.get("config"), Configuracion.class);
        
        List<Long> ids = null;
        Object idsObj = body.get("ids");
        if (idsObj instanceof List<?>) {
            ids = ((List<?>) idsObj).stream()
                .map(id -> Long.valueOf(id.toString()))
                .toList();
        }

        Distribuidor distribuidor = null;
        String distBody = (String) body.get("distribuidor");
        if (distBody != null && !distBody.isEmpty()) {
            distribuidor = Distribuidor.valueOf(distBody.toUpperCase());
        }
        
        productoService.updatePricingConfig(config, ids, distribuidor);
    }

    @PutMapping("/bulk-offer")
    public void updateBulkOffer(@RequestBody Map<String, Object> body) {
        boolean enOferta = (boolean) body.get("enOferta");
        BigDecimal descuento = new BigDecimal(body.get("descuento").toString());
        Object idsObj = body.get("ids");
        
        if (idsObj instanceof List<?> && !((List<?>) idsObj).isEmpty()) {
            List<Long> ids = ((List<?>) idsObj).stream()
                .map(id -> Long.valueOf(id.toString()))
                .toList();
            productoService.updateBulkOffer(ids, enOferta, descuento);
        } else if (body.containsKey("filters")) {
            @SuppressWarnings("unchecked")
            Map<String, Object> filters = (Map<String, Object>) body.get("filters");
            productoService.updateBulkOfferByFilters(
                enOferta,
                descuento,
                (String) filters.get("manufacturer"),
                (String) filters.get("nombre"),
                (String) filters.get("sku"),
                (String) filters.get("distribuidor"),
                filters.get("minPrecio") != null ? new BigDecimal(filters.get("minPrecio").toString()) : null,
                filters.get("maxPrecio") != null ? new BigDecimal(filters.get("maxPrecio").toString()) : null,
                (String) filters.get("categoria"),
                (String) filters.get("gender"),
                (String) filters.get("status")
            );
        }
    }

    @DeleteMapping("/{id}")
    public void deleteProducto(@PathVariable Long id) {
        productoService.delete(id);
    }

}
