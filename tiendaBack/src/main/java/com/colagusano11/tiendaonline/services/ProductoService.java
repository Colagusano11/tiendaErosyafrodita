package com.colagusano11.tiendaonline.services;

import com.colagusano11.tiendaonline.models.Configuracion;
import com.colagusano11.tiendaonline.models.Distribuidor;
import com.colagusano11.tiendaonline.models.Producto;
import com.colagusano11.tiendaonline.models.ProductoVenta;
import org.springframework.data.domain.Page;


import java.math.BigDecimal;
import java.util.List;


public interface ProductoService{

    Producto getProducto(Long id);


   
    List<Producto> getAllProductos();
    Producto findById(Long id);
    Producto findByEan(String ean);
    List<Producto> findAllByEan(String ean);
   
    String createSku(Producto p);
    String createSku2(Producto p);
    Producto findByEanAndDistribuidor(String ean, Distribuidor distribuidor);

    Page<Producto> filtrarProductos(String manufacturer,
                                    String nombre,
                                    String sku,
                                    String distribuidor,
                                    String rangePrecio,
                                    BigDecimal minPrecio,
                                    BigDecimal maxPrecio,
                                    String orden,String gender,
                                    String categoria,
                                    String status,
                                    int page, int size);
    
    List<Long> filtrarIds(String manufacturer,
                          String nombre,
                          String sku,
                          String distribuidor,
                          String rangePrecio,
                          BigDecimal minPrecio,
                          BigDecimal maxPrecio,
                          String gender,
                          String categoria,
                          String status);

    Page<ProductoVenta> getAllProductosVenta(int page, int size);


    List<Producto> getProductosOrdenadosByPrecio(String orden);

    // Métodos Admin
    Producto save(Producto producto);
    Producto update(Long id, Producto producto);
    void updateBulkStatus(List<Long> ids, boolean activo);
    void updateBulkStatusByFilters(boolean activo, String manufacturer, String nombre, String sku, String distribuidor, BigDecimal minPrecio, BigDecimal maxPrecio, String categoria, String gender, String status);
    void updatePricingConfig(Configuracion config, List<Long> ids, Distribuidor distribuidor);
    Configuracion getConfiguracion();
    void updateBulkOffer(List<Long> ids, boolean enOferta, BigDecimal descuento);
    void updateBulkOfferByFilters(boolean enOferta, BigDecimal descuento, String manufacturer, String nombre, String sku, String distribuidor, BigDecimal minPrecio, BigDecimal maxPrecio, String categoria, String gender, String status);
    void delete(Long id);
    List<String> getAllCategorias();
    List<String> getAllManufacturers();
    List<String> getAllDistribuidores();
}
