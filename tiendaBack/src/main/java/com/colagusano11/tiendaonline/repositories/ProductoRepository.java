package com.colagusano11.tiendaonline.repositories;

import com.colagusano11.tiendaonline.models.Distribuidor;
import com.colagusano11.tiendaonline.models.Producto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProductoRepository extends JpaRepository<Producto, Long>{

    Optional<Producto> findByNombre(String nombre);
    List<Producto> findAllByOrderByPrecioAsc();
    List<Producto> findAllByOrderByPrecioDesc();
    Optional<Producto> findByEan(String ean);
    Optional<Producto> findBySlug(String slug);
    Optional<Producto> findByEanAndDistribuidor(String ean, Distribuidor distribuidor);
    List<Producto> findAllByEanOrderByPrecioAsc(String ean);
    
    List<Producto> findByActivoTrue();
    Page<Producto> findByActivoTrue(Pageable pageable);

    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true)
    @org.springframework.data.jpa.repository.Query("UPDATE Producto p SET p.activo = :activo WHERE p.id IN :ids")
    void updateBulkStatus(List<Long> ids, boolean activo);

    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true)
    @org.springframework.data.jpa.repository.Query("UPDATE Producto p SET " +
            "p.precioPVP = (p.precio + :envio + :comisionTarjeta) / :divisorMargen * :ivaFactor, " +
            "p.alertaMargen = (CASE WHEN ((p.precio + :envio + :comisionTarjeta) / :divisorMargen * :ivaFactor < (p.precio + 5) * 1.21) THEN true ELSE false END), " +
            "p.activo = (CASE WHEN ((p.precio + :envio + :comisionTarjeta) / :divisorMargen * :ivaFactor < (p.precio + 5) * 1.21) THEN false ELSE p.activo END) " +
            "WHERE p.precio IS NOT NULL")
    void updateAllPricing(java.math.BigDecimal ivaFactor, java.math.BigDecimal divisorMargen, java.math.BigDecimal envio, java.math.BigDecimal comisionTarjeta);

    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true)
    @org.springframework.data.jpa.repository.Query("UPDATE Producto p SET " +
            "p.precioPVP = (p.precio + :envio + :comisionTarjeta) / :divisorMargen * :ivaFactor, " +
            "p.alertaMargen = (CASE WHEN ((p.precio + :envio + :comisionTarjeta) / :divisorMargen * :ivaFactor < (p.precio + 5) * 1.21) THEN true ELSE false END), " +
            "p.activo = (CASE WHEN ((p.precio + :envio + :comisionTarjeta) / :divisorMargen * :ivaFactor < (p.precio + 5) * 1.21) THEN false ELSE p.activo END) " +
            "WHERE p.distribuidor = :distribuidor AND p.precio IS NOT NULL")
    void updateProviderPricing(java.math.BigDecimal ivaFactor, java.math.BigDecimal divisorMargen, java.math.BigDecimal envio, java.math.BigDecimal comisionTarjeta, Distribuidor distribuidor);

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("UPDATE Producto p SET " +
            "p.precioPVP = (p.precio + :envio + :comisionTarjeta) / :divisorMargen * :ivaFactor, " +
            "p.alertaMargen = (CASE WHEN ((p.precio + :envio + :comisionTarjeta) / :divisorMargen * :ivaFactor < (p.precio + 5) * 1.21) THEN true ELSE false END), " +
            "p.activo = (CASE WHEN ((p.precio + :envio + :comisionTarjeta) / :divisorMargen * :ivaFactor < (p.precio + 5) * 1.21) THEN false ELSE p.activo END) " +
            "WHERE p.id IN :ids AND p.precio IS NOT NULL")
    void updateSelectedPricing(List<Long> ids, java.math.BigDecimal ivaFactor, java.math.BigDecimal divisorMargen, java.math.BigDecimal envio, java.math.BigDecimal comisionTarjeta);

    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true)
    @org.springframework.data.jpa.repository.Query("UPDATE Producto p SET " +
            "p.precioPVP = (p.precio + :envio + :comisionTarjeta) / :divisorMargen * :ivaFactor, " +
            "p.alertaMargen = (CASE WHEN ((p.precio + :envio + :comisionTarjeta) / :divisorMargen * :ivaFactor < (p.precio + 5) * 1.21) THEN true ELSE false END), " +
            "p.activo = (CASE WHEN ((p.precio + :envio + :comisionTarjeta) / :divisorMargen * :ivaFactor < (p.precio + 5) * 1.21) THEN false ELSE p.activo END) " +
            "WHERE p.id IN :ids AND p.distribuidor = :distribuidor AND p.precio IS NOT NULL")
    void updateSelectedProviderPricing(List<Long> ids, java.math.BigDecimal ivaFactor, java.math.BigDecimal divisorMargen, java.math.BigDecimal envio, java.math.BigDecimal comisionTarjeta, Distribuidor distribuidor);

    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true)
    @org.springframework.data.jpa.repository.Query("UPDATE Producto p SET " +
            "p.enOferta = :enOferta, " +
            "p.descuentoOferta = :descuento, " +
            "p.precioOferta = (CASE WHEN (:enOferta = true) THEN p.precioPVP * (1.0 - :descuento / 100.0) ELSE NULL END), " +
            "p.alertaMargen = (CASE WHEN (:enOferta = true AND p.precioPVP * (1.0 - :descuento / 100.0) < (p.precio + 5) * 1.21) THEN true " +
            "                       WHEN (:enOferta = false AND p.precioPVP < (p.precio + 5) * 1.21) THEN true ELSE false END), " +
            "p.activo = (CASE WHEN (:enOferta = true AND p.precioPVP * (1.0 - :descuento / 100.0) < (p.precio + 5) * 1.21) THEN false " +
            "                 WHEN (:enOferta = false AND p.precioPVP < (p.precio + 5) * 1.21) THEN false ELSE p.activo END) " +
            "WHERE p.id IN :ids AND p.precioPVP IS NOT NULL")
    void updateBulkOffer(List<Long> ids, boolean enOferta, java.math.BigDecimal descuento);

    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true)
    @org.springframework.data.jpa.repository.Query("UPDATE Producto p SET p.activo = :activo WHERE " +
            "(:nombre IS NULL OR (" +
            "  LOWER(p.nombre) LIKE LOWER(CONCAT('%', :nombre, '%')) OR " +
            "  LOWER(p.manufacturer) LIKE LOWER(CONCAT('%', :nombre, '%')) OR " +
            "  LOWER(p.categoria) LIKE LOWER(CONCAT('%', :nombre, '%')) OR " +
            "  LOWER(p.sku) LIKE LOWER(CONCAT('%', :nombre, '%')) OR " +
            "  LOWER(p.ean) LIKE LOWER(CONCAT('%', :nombre, '%'))" +
            ")) AND " +
            "(:categoria IS NULL OR p.categoria = :categoria) AND " +
            "(:gender IS NULL OR UPPER(p.gender) = UPPER(:gender)) AND " +
            "(:distribuidor IS NULL OR p.distribuidor = :distribuidor) AND " +
            "(:manufacturador IS NULL OR p.manufacturer = :manufacturador) AND " +
            "(:sku IS NULL OR p.sku LIKE CONCAT('%', :sku, '%') OR p.ean LIKE CONCAT('%', :sku, '%')) AND " +
            "(:minPrecio IS NULL OR p.precio >= :minPrecio) AND " +
            "(:maxPrecio IS NULL OR p.precio <= :maxPrecio) AND " +
            "(:status = 'TODOS' OR " +
            "(:status = 'INACTIVOS' AND p.activo = false) OR " +
            "(:status = 'OFERTAS' AND p.enOferta = true) OR " +
            "((:status = '' OR :status = 'ACTIVOS') AND p.activo = true) OR " +
            "(:status = 'BAJO_MARGEN' AND p.activo = true AND p.precioPVP < ((p.precio + 5) * 1.21)) OR " +
            "(:status = 'ALERTA_MARGEN' AND p.alertaMargen = true) OR " +
            "(:status IS NULL AND p.activo = true AND (p.imagen IS NOT NULL AND p.imagen <> '')))")
    void updateStatusByFilters(
            @org.springframework.data.repository.query.Param("activo") boolean activo,
            @org.springframework.data.repository.query.Param("nombre") String nombre,
            @org.springframework.data.repository.query.Param("categoria") String categoria,
            @org.springframework.data.repository.query.Param("gender") String gender,
            @org.springframework.data.repository.query.Param("distribuidor") Distribuidor distribuidor,
            @org.springframework.data.repository.query.Param("manufacturador") String manufacturador,
            @org.springframework.data.repository.query.Param("sku") String sku,
            @org.springframework.data.repository.query.Param("status") String status,
            @org.springframework.data.repository.query.Param("minPrecio") java.math.BigDecimal minPrecio,
            @org.springframework.data.repository.query.Param("maxPrecio") java.math.BigDecimal maxPrecio);

    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true)
    @org.springframework.data.jpa.repository.Query("UPDATE Producto p SET " +
            "p.enOferta = :enOferta, " +
            "p.descuentoOferta = :descuento, " +
            "p.precioOferta = (CASE WHEN (:enOferta = true) THEN p.precioPVP * (1.0 - :descuento / 100.0) ELSE NULL END), " +
            "p.alertaMargen = (CASE WHEN (:enOferta = true AND p.precioPVP * (1.0 - :descuento / 100.0) < (p.precio + 5) * 1.21) THEN true " +
            "                       WHEN (:enOferta = false AND p.precioPVP < (p.precio + 5) * 1.21) THEN true ELSE false END), " +
            "p.activo = (CASE WHEN (:enOferta = true AND p.precioPVP * (1.0 - :descuento / 100.0) < (p.precio + 5) * 1.21) THEN false " +
            "                 WHEN (:enOferta = false AND p.precioPVP < (p.precio + 5) * 1.21) THEN false ELSE p.activo END) " +
            "WHERE p.precioPVP IS NOT NULL AND (" +
            "(:nombre IS NULL OR (" +
            "  LOWER(p.nombre) LIKE LOWER(CONCAT('%', :nombre, '%')) OR " +
            "  LOWER(p.manufacturer) LIKE LOWER(CONCAT('%', :nombre, '%')) OR " +
            "  LOWER(p.categoria) LIKE LOWER(CONCAT('%', :nombre, '%')) OR " +
            "  LOWER(p.sku) LIKE LOWER(CONCAT('%', :nombre, '%')) OR " +
            "  LOWER(p.ean) LIKE LOWER(CONCAT('%', :nombre, '%'))" +
            ")) AND " +
            "(:categoria IS NULL OR p.categoria = :categoria) AND " +
            "(:gender IS NULL OR UPPER(p.gender) = UPPER(:gender)) AND " +
            "(:distribuidor IS NULL OR p.distribuidor = :distribuidor) AND " +
            "(:manufacturador IS NULL OR p.manufacturer = :manufacturador) AND " +
            "(:sku IS NULL OR p.sku LIKE CONCAT('%', :sku, '%') OR p.ean LIKE CONCAT('%', :sku, '%')) AND " +
            "(:minPrecio IS NULL OR p.precio >= :minPrecio) AND " +
            "(:maxPrecio IS NULL OR p.precio <= :maxPrecio) AND " +
            "(:status = 'TODOS' OR " +
            "(:status = 'INACTIVOS' AND p.activo = false) OR " +
            "(:status = 'OFERTAS' AND p.enOferta = true) OR " +
            "((:status = '' OR :status = 'ACTIVOS') AND p.activo = true) OR " +
            "(:status = 'BAJO_MARGEN' AND p.activo = true AND p.precioPVP < ((p.precio + 5) * 1.21)) OR " +
            "(:status = 'ALERTA_MARGEN' AND p.alertaMargen = true) OR " +
            "(:status IS NULL AND p.activo = true AND (p.imagen IS NOT NULL AND p.imagen <> ''))))")
    void updateOfferByFilters(
            @org.springframework.data.repository.query.Param("enOferta") boolean enOferta,
            @org.springframework.data.repository.query.Param("descuento") java.math.BigDecimal descuento,
            @org.springframework.data.repository.query.Param("nombre") String nombre,
            @org.springframework.data.repository.query.Param("categoria") String categoria,
            @org.springframework.data.repository.query.Param("gender") String gender,
            @org.springframework.data.repository.query.Param("distribuidor") Distribuidor distribuidor,
            @org.springframework.data.repository.query.Param("manufacturador") String manufacturador,
            @org.springframework.data.repository.query.Param("sku") String sku,
            @org.springframework.data.repository.query.Param("status") String status,
            @org.springframework.data.repository.query.Param("minPrecio") java.math.BigDecimal minPrecio,
            @org.springframework.data.repository.query.Param("maxPrecio") java.math.BigDecimal maxPrecio);

    List<Producto> findByDistribuidorAndImagenIsNull(Distribuidor distribuidor);
    
    @org.springframework.data.jpa.repository.Query("SELECT p.id FROM Producto p WHERE " +
            "(:nombre IS NULL OR (" +
            "  LOWER(p.nombre) LIKE LOWER(CONCAT('%', :nombre, '%')) OR " +
            "  LOWER(p.manufacturer) LIKE LOWER(CONCAT('%', :nombre, '%')) OR " +
            "  LOWER(p.categoria) LIKE LOWER(CONCAT('%', :nombre, '%')) OR " +
            "  LOWER(p.sku) LIKE LOWER(CONCAT('%', :nombre, '%')) OR " +
            "  LOWER(p.ean) LIKE LOWER(CONCAT('%', :nombre, '%'))" +
            ")) AND " +
            "(:categoria IS NULL OR p.categoria = :categoria) AND " +
            "(:gender IS NULL OR UPPER(p.gender) = UPPER(:gender)) AND " +
            "(:distribuidor IS NULL OR p.distribuidor = :distribuidor) AND " +
            "(:manufacturador IS NULL OR p.manufacturer = :manufacturador) AND " +
            "(:sku IS NULL OR p.sku LIKE CONCAT('%', :sku, '%') OR p.ean LIKE CONCAT('%', :sku, '%')) AND " +
            "(:minPrecio IS NULL OR p.precio >= :minPrecio) AND " +
            "(:maxPrecio IS NULL OR p.precio <= :maxPrecio) AND " +
            "(:status = 'TODOS' OR " +
            "(:status = 'INACTIVOS' AND p.activo = false) OR " +
            "(:status = 'OFERTAS' AND p.enOferta = true) OR " +
            "((:status = '' OR :status = 'ACTIVOS') AND p.activo = true) OR " +
            "(:status = 'BAJO_MARGEN' AND p.activo = true AND p.precioPVP < ((p.precio + 5) * 1.21)) OR " +
            "(:status = 'ALERTA_MARGEN' AND p.alertaMargen = true) OR " +
            "(:status IS NULL AND p.activo = true AND (p.imagen IS NOT NULL AND p.imagen <> '')))")
    List<Long> searchIds(
            @org.springframework.data.repository.query.Param("manufacturador") String manufacturador,
            @org.springframework.data.repository.query.Param("nombre") String nombre,
            @org.springframework.data.repository.query.Param("sku") String sku,
            @org.springframework.data.repository.query.Param("distribuidor") Distribuidor distribuidor,
            @org.springframework.data.repository.query.Param("minPrecio") java.math.BigDecimal minPrecio,
            @org.springframework.data.repository.query.Param("maxPrecio") java.math.BigDecimal maxPrecio,
            @org.springframework.data.repository.query.Param("categoria") String categoria,
            @org.springframework.data.repository.query.Param("gender") String gender,
            @org.springframework.data.repository.query.Param("status") String status);
    
    @org.springframework.data.jpa.repository.Query(value = "SELECT * FROM productos WHERE id IN (" +
            "  SELECT id FROM (" +
            "    SELECT id, ROW_NUMBER() OVER(" +
            "      PARTITION BY (CASE WHEN ean IS NULL OR ean = '' OR ean = '0' THEN CAST(id AS CHAR) ELSE ean END) " +
            "      ORDER BY (CASE WHEN stock > 0 THEN 0 ELSE 1 END) ASC, precio ASC" +
            "    ) as rn FROM productos WHERE activo = true" +
            "  ) t WHERE rn = 1" +
            ")", 
            countQuery = "SELECT count(DISTINCT CASE WHEN ean IS NULL OR ean = '' OR ean = '0' THEN CAST(id AS CHAR) ELSE ean END) FROM productos WHERE activo = true",
            nativeQuery = true)
    Page<Producto> findBestPriceActiveProducts(Pageable pageable);
    @org.springframework.data.jpa.repository.Query("SELECT p FROM Producto p WHERE " +
            "(:nombre IS NULL OR (" +
            "  LOWER(p.nombre) LIKE LOWER(CONCAT('%', :nombre, '%')) OR " +
            "  LOWER(p.manufacturer) LIKE LOWER(CONCAT('%', :nombre, '%')) OR " +
            "  LOWER(p.categoria) LIKE LOWER(CONCAT('%', :nombre, '%')) OR " +
            "  LOWER(p.sku) LIKE LOWER(CONCAT('%', :nombre, '%')) OR " +
            "  LOWER(p.ean) LIKE LOWER(CONCAT('%', :nombre, '%'))" +
            ")) AND " +
            "(:categoria IS NULL OR LOWER(p.categoria) = LOWER(:categoria)) AND " +
            "(:gender IS NULL OR UPPER(p.gender) = UPPER(:gender)) AND " +
            "(:distribuidor IS NULL OR p.distribuidor = :distribuidor) AND " +
            "(:manufacturadores IS NULL OR p.manufacturer IN :manufacturadores) AND " +
            "(:sku IS NULL OR p.sku LIKE CONCAT('%', :sku, '%') OR p.ean LIKE CONCAT('%', :sku, '%')) AND " +
            "(:minPrecio IS NULL OR p.precio >= :minPrecio) AND " +
            "(:maxPrecio IS NULL OR p.precio <= :maxPrecio) AND " +
            "(:status = 'TODOS' OR " +
            "(:status = 'INACTIVOS' AND p.activo = false) OR " +
            "(:status = 'OFERTAS' AND p.enOferta = true) OR " +
            "(:status = 'BAJO_MARGEN' AND p.activo = true AND p.precioPVP < ((p.precio + 5) * 1.21)) OR " +
            "(:status = 'ALERTA_MARGEN' AND p.alertaMargen = true) OR " +
            "((:status = '' OR :status = 'ACTIVOS') AND p.activo = true) OR " +
            "(:status IS NULL AND p.activo = true AND (p.imagen IS NOT NULL AND p.imagen <> '')))")
    Page<Producto> searchAdvancedMultipleManufacturers(
            @org.springframework.data.repository.query.Param("nombre") String nombre,
            @org.springframework.data.repository.query.Param("categoria") String categoria,
            @org.springframework.data.repository.query.Param("gender") String gender,
            @org.springframework.data.repository.query.Param("distribuidor") Distribuidor distribuidor,
            @org.springframework.data.repository.query.Param("manufacturadores") List<String> manufacturadores,
            @org.springframework.data.repository.query.Param("sku") String sku,
            @org.springframework.data.repository.query.Param("status") String status,
            @org.springframework.data.repository.query.Param("minPrecio") java.math.BigDecimal minPrecio,
            @org.springframework.data.repository.query.Param("maxPrecio") java.math.BigDecimal maxPrecio,
            Pageable pageable);

    @org.springframework.data.jpa.repository.Query("SELECT p FROM Producto p WHERE " +
            "(:nombre IS NULL OR (" +
            "  LOWER(p.nombre) LIKE LOWER(CONCAT('%', :nombre, '%')) OR " +
            "  LOWER(p.manufacturer) LIKE LOWER(CONCAT('%', :nombre, '%')) OR " +
            "  LOWER(p.categoria) LIKE LOWER(CONCAT('%', :nombre, '%')) OR " +
            "  LOWER(p.sku) LIKE LOWER(CONCAT('%', :nombre, '%')) OR " +
            "  LOWER(p.ean) LIKE LOWER(CONCAT('%', :nombre, '%'))" +
            ")) AND " +
            "(:categoria IS NULL OR LOWER(p.categoria) = LOWER(:categoria)) AND " +
            "(:gender IS NULL OR UPPER(p.gender) = UPPER(:gender)) AND " +
            "(:distribuidor IS NULL OR p.distribuidor = :distribuidor) AND " +
            "(:manufacturador IS NULL OR p.manufacturer = :manufacturador) AND " +
            "(:sku IS NULL OR p.sku LIKE CONCAT('%', :sku, '%') OR p.ean LIKE CONCAT('%', :sku, '%')) AND " +
            "(:minPrecio IS NULL OR p.precio >= :minPrecio) AND " +
            "(:maxPrecio IS NULL OR p.precio <= :maxPrecio) AND " +
            "(:status = 'TODOS' OR " +
            "(:status = 'INACTIVOS' AND p.activo = false) OR " +
            "(:status = 'OFERTAS' AND p.enOferta = true) OR " +
            "(:status = 'BAJO_MARGEN' AND p.activo = true AND p.precioPVP < ((p.precio + 5) * 1.21)) OR " +
            "(:status = 'ALERTA_MARGEN' AND p.alertaMargen = true) OR " +
            "((:status = '' OR :status = 'ACTIVOS') AND p.activo = true) OR " +
            "(:status IS NULL AND p.activo = true AND (p.imagen IS NOT NULL AND p.imagen <> '')))")
    Page<Producto> searchAdvanced(
            @org.springframework.data.repository.query.Param("nombre") String nombre,
            @org.springframework.data.repository.query.Param("categoria") String categoria,
            @org.springframework.data.repository.query.Param("gender") String gender,
            @org.springframework.data.repository.query.Param("distribuidor") Distribuidor distribuidor,
            @org.springframework.data.repository.query.Param("manufacturador") String manufacturador,
            @org.springframework.data.repository.query.Param("sku") String sku,
            @org.springframework.data.repository.query.Param("status") String status,
            @org.springframework.data.repository.query.Param("minPrecio") java.math.BigDecimal minPrecio,
            @org.springframework.data.repository.query.Param("maxPrecio") java.math.BigDecimal maxPrecio,
            Pageable pageable);

    // --- Nuevos productos ---
    org.springframework.data.domain.Page<Producto> findByNuevoTrue(org.springframework.data.domain.Pageable pageable);
    long countByNuevoTrue();

    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true)
    @org.springframework.data.jpa.repository.Query("UPDATE Producto p SET p.nuevo = false WHERE p.id IN :ids")
    void marcarRevisados(@org.springframework.data.repository.query.Param("ids") List<Long> ids);

    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true)
    @org.springframework.data.jpa.repository.Query("UPDATE Producto p SET p.gender = 'HOMBRE' WHERE p.gender IS NOT NULL AND UPPER(p.gender) IN ('HOMBRE','MAN','MEN','MALE','MASCULINO','MASCULIN','H','1')")
    int normalizeGenderHombre();

    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true)
    @org.springframework.data.jpa.repository.Query("UPDATE Producto p SET p.gender = 'MUJER' WHERE p.gender IS NOT NULL AND UPPER(p.gender) IN ('MUJER','WOMAN','WOMEN','FEMALE','FEMENINO','FEMININ','F','2')")
    int normalizeGenderMujer();

    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true)
    @org.springframework.data.jpa.repository.Query("UPDATE Producto p SET p.gender = 'UNISEX' WHERE p.gender IS NOT NULL AND UPPER(p.gender) IN ('UNISEX','BOTH','AMBOS','U','3','MIXTO')")
    int normalizeGenderUnisex();

    @org.springframework.data.jpa.repository.Modifying(clearAutomatically = true)
    @org.springframework.data.jpa.repository.Query("UPDATE Producto p SET p.gender = NULL WHERE p.gender = ''")
    int normalizeGenderEmpty();

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT p.categoria FROM Producto p WHERE p.categoria IS NOT NULL AND p.categoria <> '' ORDER BY p.categoria ASC")
    List<String> findAllDistinctCategorias();

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT p.manufacturer FROM Producto p WHERE p.manufacturer IS NOT NULL AND p.manufacturer <> '' ORDER BY p.manufacturer ASC")
    List<String> findAllDistinctManufacturers();

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT p.distribuidor FROM Producto p WHERE p.distribuidor IS NOT NULL AND p.distribuidor <> '' ORDER BY p.distribuidor ASC")
    List<String> findAllDistinctDistribuidores();
}
