package com.colagusano11.tiendaonline.repositories;

import com.colagusano11.tiendaonline.models.AvisoStock;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AvisoStockRepository extends JpaRepository<AvisoStock, Long> {
    List<AvisoStock> findByProductoIdAndEnviado(Long productoId, boolean enviado);
    boolean existsByEmailAndProductoIdAndEnviado(String email, Long productoId, boolean enviado);
}
