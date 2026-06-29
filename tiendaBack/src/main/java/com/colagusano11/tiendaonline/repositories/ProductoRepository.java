package com.colagusano11.tiendaonline.repositories;

import com.colagusano11.tiendaonline.models.Producto;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductoRepository extends JpaRepository<Producto, Long> {

    List<Producto> findByActivoTrue();

    /** Productos activos Y marcados para aparecer en comparadores (enShopping=true). */
    List<Producto> findByActivoTrueAndEnShoppingTrue();

    Optional<Producto> findBySku(String sku);
    Optional<Producto> findByEan(String ean);
    Optional<Producto> findBySlug(String slug);

    @Query("SELECT p FROM Producto p WHERE p.activo = true AND p.alertaMargen = true")
    List<Producto> findActivosConAlertaMargen();

    @Query("SELECT p FROM Producto p WHERE p.enShopping = true AND p.activo = true AND p.ean IS NOT NULL AND p.ean <> ''")
    List<Producto> findParaFeedExterno();
}
