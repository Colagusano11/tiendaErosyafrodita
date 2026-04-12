package com.colagusano11.tiendaonline.repositories;

import com.colagusano11.tiendaonline.models.Resena;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ResenaRepository extends JpaRepository<Resena, Long> {
    List<Resena> findByProductoIdOrderByFechaDesc(Long productoId);
    Optional<Resena> findByProductoIdAndUsuarioId(Long productoId, Long usuarioId);
}
