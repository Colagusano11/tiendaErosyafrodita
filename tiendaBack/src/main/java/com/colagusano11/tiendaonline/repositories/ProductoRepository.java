package com.colagusano11.tiendaonline.repositories;

import com.colagusano11.tiendaonline.models.Distribuidor;
import com.colagusano11.tiendaonline.models.Producto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Long>,
        JpaSpecificationExecutor<Producto> {

    Optional<Producto> findBySlug(String slug);
    Optional<Producto> findByEan(String ean);
    Optional<Producto> findBySku(String sku);
    Optional<Producto> findBySkuProveedor(String skuProveedor);

    List<Producto> findByActivoTrue();
    List<Producto> findByActivoFalse();

    Page<Producto> findByActivoTrue(Pageable pageable);
    Page<Producto> findByNuevoTrue(Pageable pageable);
    Page<Producto> findByNuevoTrueAndActivoTrue(Pageable pageable);

    // Queries de búsqueda por texto
    List<Producto> findByNombreContainingIgnoreCase(String nombre);
    List<Producto> findByManufacturerContainingIgnoreCaseAndActivoTrue(String manufacturer);
    List<Producto> findByManufacturerAndActivoTrue(String manufacturer);

    // ─── Búsquedas por EAN y distribuidor ───────────────────────────────────

    List<Producto> findAllByEanOrderByPrecioAsc(String ean);

    Optional<Producto> findByEanAndDistribuidor(String ean, Distribuidor distribuidor);

    // ─── Búsqueda para feeds externos ───────────────────────────────────────

    List<Producto> findByActivoTrueAndEnShoppingTrue();

    // ─── Ordenación por precio ───────────────────────────────────────────────

    List<Producto> findAllByOrderByPrecioDesc();
    List<Producto> findAllByOrderByPrecioAsc();

    // ─── Catálogo web (productos activos ordenados por precio asc) ───────────

    @Query("SELECT p FROM Producto p WHERE p.activo = true ORDER BY p.precio ASC")
    Page<Producto> findBestPriceActiveProducts(Pageable pageable);

    // ─── Categorías, marcas y distribuidores ─────────────────────────────────

    @Query("SELECT DISTINCT p.categoria FROM Producto p WHERE p.activo = true AND p.categoria IS NOT NULL ORDER BY p.categoria")
    List<String> findDistinctCategorias();

    @Query("SELECT DISTINCT p.categoria FROM Producto p WHERE p.activo = true AND p.categoria IS NOT NULL ORDER BY p.categoria")
    List<String> findAllDistinctCategorias();

    @Query("SELECT DISTINCT p.manufacturer FROM Producto p WHERE p.activo = true AND p.manufacturer IS NOT NULL ORDER BY p.manufacturer")
    List<String> findDistinctMarcas();

    @Query("SELECT DISTINCT p.manufacturer FROM Producto p WHERE p.activo = true AND p.manufacturer IS NOT NULL ORDER BY p.manufacturer")
    List<String> findAllDistinctManufacturers();

    @Query("SELECT DISTINCT CAST(p.distribuidor AS string) FROM Producto p WHERE p.activo = true AND p.distribuidor IS NOT NULL")
    List<String> findDistinctDistribuidores();

    @Query("SELECT DISTINCT CAST(p.distribuidor AS string) FROM Producto p WHERE p.activo = true AND p.distribuidor IS NOT NULL")
    List<String> findAllDistinctDistribuidores();

    // Contadores
    long countByActivoTrue();
    long countByActivoFalse();
    long countByEnOfertaTrue();
    long countByNuevoTrue();
    long countByAlertaMargenTrue();
    long countByEnShoppingTrue();

    // ─── Búsquedas avanzadas (paginadas) ─────────────────────────────────────

    /**
     * Búsqueda agrupada para catálogo web y novedades (solo activos).
     * Filtra por los parámetros no nulos y ordena según el Pageable recibido.
     */
    @Query("""
        SELECT p FROM Producto p
        WHERE p.activo = true
          AND (:nombre       IS NULL OR LOWER(p.nombre)      LIKE LOWER(CONCAT('%', :nombre, '%')))
          AND (:categoria    IS NULL OR LOWER(p.categoria)   LIKE LOWER(CONCAT('%', :categoria, '%')))
          AND (:gender       IS NULL OR LOWER(p.gender)      = LOWER(:gender))
          AND (:distribuidor IS NULL OR p.distribuidor        = :distribuidor)
          AND (:manufacturer IS NULL OR LOWER(p.manufacturer) LIKE LOWER(CONCAT('%', :manufacturer, '%')))
          AND (:sku          IS NULL OR LOWER(p.sku)         LIKE LOWER(CONCAT('%', :sku, '%')))
          AND (:minPrecio    IS NULL OR p.precio             >= :minPrecio)
          AND (:maxPrecio    IS NULL OR p.precio             <= :maxPrecio)
        """)
    Page<Producto> searchAdvancedNativeGrouped(
            @Param("nombre")       String nombre,
            @Param("categoria")    String categoria,
            @Param("gender")       String gender,
            @Param("distribuidor") Distribuidor distribuidor,
            @Param("manufacturer") String manufacturer,
            @Param("sku")          String sku,
            @Param("minPrecio")    BigDecimal minPrecio,
            @Param("maxPrecio")    BigDecimal maxPrecio,
            Pageable pageable);

    /**
     * Búsqueda avanzada completa (todos los estados: ACTIVOS, INACTIVOS, OFERTA...).
     */
    @Query("""
        SELECT p FROM Producto p
        WHERE (:nombre       IS NULL OR LOWER(p.nombre)      LIKE LOWER(CONCAT('%', :nombre, '%')))
          AND (:categoria    IS NULL OR LOWER(p.categoria)   LIKE LOWER(CONCAT('%', :categoria, '%')))
          AND (:gender       IS NULL OR LOWER(p.gender)      = LOWER(:gender))
          AND (:distribuidor IS NULL OR p.distribuidor        = :distribuidor)
          AND (:manufacturer IS NULL OR LOWER(p.manufacturer) LIKE LOWER(CONCAT('%', :manufacturer, '%')))
          AND (:sku          IS NULL OR LOWER(p.sku)         LIKE LOWER(CONCAT('%', :sku, '%')))
          AND (:status       IS NULL
               OR (:status = 'ACTIVOS'   AND p.activo = true)
               OR (:status = 'INACTIVOS' AND p.activo = false)
               OR (:status = 'OFERTA'    AND p.enOferta = true)
               OR (:status = 'NUEVOS'    AND p.nuevo = true)
               OR (:status = 'SHOPPING'  AND p.enShopping = true))
          AND (:minPrecio    IS NULL OR p.precio >= :minPrecio)
          AND (:maxPrecio    IS NULL OR p.precio <= :maxPrecio)
        """)
    Page<Producto> searchAdvanced(
            @Param("nombre")       String nombre,
            @Param("categoria")    String categoria,
            @Param("gender")       String gender,
            @Param("distribuidor") Distribuidor distribuidor,
            @Param("manufacturer") String manufacturer,
            @Param("sku")          String sku,
            @Param("status")       String status,
            @Param("minPrecio")    BigDecimal minPrecio,
            @Param("maxPrecio")    BigDecimal maxPrecio,
            Pageable pageable);

    /**
     * Devuelve solo IDs para operaciones bulk (status, oferta, etc.).
     */
    @Query("""
        SELECT p.id FROM Producto p
        WHERE (:manufacturer IS NULL OR LOWER(p.manufacturer) LIKE LOWER(CONCAT('%', :manufacturer, '%')))
          AND (:nombre       IS NULL OR LOWER(p.nombre)      LIKE LOWER(CONCAT('%', :nombre, '%')))
          AND (:sku          IS NULL OR LOWER(p.sku)         LIKE LOWER(CONCAT('%', :sku, '%')))
          AND (:distribuidor IS NULL OR p.distribuidor        = :distribuidor)
          AND (:minPrecio    IS NULL OR p.precio             >= :minPrecio)
          AND (:maxPrecio    IS NULL OR p.precio             <= :maxPrecio)
          AND (:categoria    IS NULL OR LOWER(p.categoria)   LIKE LOWER(CONCAT('%', :categoria, '%')))
          AND (:gender       IS NULL OR LOWER(p.gender)      = LOWER(:gender))
          AND (:status       IS NULL
               OR (:status = 'ACTIVOS'   AND p.activo = true)
               OR (:status = 'INACTIVOS' AND p.activo = false)
               OR (:status = 'OFERTA'    AND p.enOferta = true)
               OR (:status = 'NUEVOS'    AND p.nuevo = true)
               OR (:status = 'SHOPPING'  AND p.enShopping = true))
        """)
    List<Long> searchIds(
            @Param("manufacturer") String manufacturer,
            @Param("nombre")       String nombre,
            @Param("sku")          String sku,
            @Param("distribuidor") Distribuidor distribuidor,
            @Param("minPrecio")    BigDecimal minPrecio,
            @Param("maxPrecio")    BigDecimal maxPrecio,
            @Param("categoria")    String categoria,
            @Param("gender")       String gender,
            @Param("status")       String status);

    // ─── Bulk status ─────────────────────────────────────────────────────────

    @Modifying
    @Transactional
    @Query("UPDATE Producto p SET p.activo = :activo WHERE p.id IN :ids")
    void updateBulkStatus(@Param("ids") List<Long> ids, @Param("activo") boolean activo);

    // ─── Bulk pricing ────────────────────────────────────────────────────────

    /**
     * Recalcula precioPVP para una selección de IDs filtrando por distribuidor.
     * PVP = ((precio + envio) * factorIva / divisorMargen) + comisionTarjeta
     */
    @Modifying
    @Transactional
    @Query("""
        UPDATE Producto p
        SET p.precioPVP = ROUND(((p.precio + :envio) * :factorIva / :divisorMargen) + :comisionTarjeta, 2)
        WHERE p.id IN :ids
          AND p.distribuidor = :distribuidor
        """)
    void updateSelectedProviderPricing(
            @Param("ids")             List<Long>    ids,
            @Param("factorIva")       BigDecimal    factorIva,
            @Param("divisorMargen")   BigDecimal    divisorMargen,
            @Param("envio")           BigDecimal    envio,
            @Param("comisionTarjeta") BigDecimal    comisionTarjeta,
            @Param("distribuidor")    Distribuidor  distribuidor);

    /**
     * Recalcula precioPVP para una selección de IDs (todos los distribuidores).
     */
    @Modifying
    @Transactional
    @Query("""
        UPDATE Producto p
        SET p.precioPVP = ROUND(((p.precio + :envio) * :factorIva / :divisorMargen) + :comisionTarjeta, 2)
        WHERE p.id IN :ids
        """)
    void updateSelectedPricing(
            @Param("ids")             List<Long>  ids,
            @Param("factorIva")       BigDecimal  factorIva,
            @Param("divisorMargen")   BigDecimal  divisorMargen,
            @Param("envio")           BigDecimal  envio,
            @Param("comisionTarjeta") BigDecimal  comisionTarjeta);

    /**
     * Recalcula precioPVP para todos los productos de un distribuidor.
     */
    @Modifying
    @Transactional
    @Query("""
        UPDATE Producto p
        SET p.precioPVP = ROUND(((p.precio + :envio) * :factorIva / :divisorMargen) + :comisionTarjeta, 2)
        WHERE p.distribuidor = :distribuidor
        """)
    void updateProviderPricing(
            @Param("factorIva")       BigDecimal   factorIva,
            @Param("divisorMargen")   BigDecimal   divisorMargen,
            @Param("envio")           BigDecimal   envio,
            @Param("comisionTarjeta") BigDecimal   comisionTarjeta,
            @Param("distribuidor")    Distribuidor distribuidor);

    /**
     * Recalcula precioPVP para todos los productos.
     */
    @Modifying
    @Transactional
    @Query("""
        UPDATE Producto p
        SET p.precioPVP = ROUND(((p.precio + :envio) * :factorIva / :divisorMargen) + :comisionTarjeta, 2)
        """)
    void updateAllPricing(
            @Param("factorIva")       BigDecimal factorIva,
            @Param("divisorMargen")   BigDecimal divisorMargen,
            @Param("envio")           BigDecimal envio,
            @Param("comisionTarjeta") BigDecimal comisionTarjeta);

    // ─── Bulk oferta ─────────────────────────────────────────────────────────

    @Modifying
    @Transactional
    @Query("""
        UPDATE Producto p
        SET p.enOferta = :enOferta,
            p.descuentoOferta = :descuento,
            p.precioOferta = CASE
                WHEN :enOferta = true AND :descuento > 0
                THEN ROUND(p.precioPVP * (1 - :descuento / 100), 2)
                ELSE p.precioPVP
            END
        WHERE p.id IN :ids
        """)
    void updateBulkOffer(
            @Param("ids")       List<Long>  ids,
            @Param("enOferta")  boolean     enOferta,
            @Param("descuento") BigDecimal  descuento);

    // ─── Marcar revisados (nuevo = false) ────────────────────────────────────

    @Modifying
    @Transactional
    @Query("UPDATE Producto p SET p.nuevo = false WHERE p.id IN :ids")
    void marcarRevisados(@Param("ids") List<Long> ids);

    // ─── Normalización de género ──────────────────────────────────────────────

    @Modifying
    @Transactional
    @Query("""
        UPDATE Producto p SET p.gender = 'HOMBRE'
        WHERE LOWER(p.gender) IN ('hombre', 'masculino', 'male', 'man', 'men', 'h')
        """)
    int normalizeGenderHombre();

    @Modifying
    @Transactional
    @Query("""
        UPDATE Producto p SET p.gender = 'MUJER'
        WHERE LOWER(p.gender) IN ('mujer', 'femenino', 'female', 'woman', 'women', 'm', 'f')
        """)
    int normalizeGenderMujer();

    @Modifying
    @Transactional
    @Query("""
        UPDATE Producto p SET p.gender = 'UNISEX'
        WHERE LOWER(p.gender) IN ('unisex', 'mixto', 'u')
        """)
    int normalizeGenderUnisex();

    @Modifying
    @Transactional
    @Query("""
        UPDATE Producto p SET p.gender = NULL
        WHERE p.gender IS NOT NULL
          AND LOWER(p.gender) NOT IN ('hombre', 'mujer', 'unisex')
        """)
    int normalizeGenderEmpty();

    // ─── Copy IA (GeminiCopyService) ────────────────────────────────────────

    /** Productos activos sin copy generado — candidatos para el batch */
    List<Producto> findByActivoTrueAndCopyGeneradoEnIsNull();

    /** Cuántos productos activos ya tienen título SEO generado */
    long countByActivoTrueAndTituloSeoIsNotNull();
}
