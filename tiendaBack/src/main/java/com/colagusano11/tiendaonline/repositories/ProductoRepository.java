package com.colagusano11.tiendaonline.repositories;

import com.colagusano11.tiendaonline.models.Producto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

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

    @Query("SELECT DISTINCT p.categoria FROM Producto p WHERE p.activo = true AND p.categoria IS NOT NULL ORDER BY p.categoria")
    List<String> findDistinctCategorias();

    @Query("SELECT DISTINCT p.manufacturer FROM Producto p WHERE p.activo = true AND p.manufacturer IS NOT NULL ORDER BY p.manufacturer")
    List<String> findDistinctMarcas();

    @Query("SELECT DISTINCT CAST(p.distribuidor AS string) FROM Producto p WHERE p.activo = true AND p.distribuidor IS NOT NULL")
    List<String> findDistinctDistribuidores();

    // Contadores
    long countByActivoTrue();
    long countByActivoFalse();
    long countByEnOfertaTrue();
    long countByNuevoTrue();
    long countByAlertaMargenTrue();
    long countByEnShoppingTrue();

    // ─── Copy IA (GeminiCopyService) ────────────────────────────────────────

    /** Productos activos sin copy generado — candidatos para el batch */
    List<Producto> findByActivoTrueAndCopyGeneradoEnIsNull();

    /** Cuántos productos activos ya tienen título SEO generado */
    long countByActivoTrueAndTituloSeoIsNotNull();
}
