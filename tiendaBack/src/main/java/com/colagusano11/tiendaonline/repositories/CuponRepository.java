package com.colagusano11.tiendaonline.repositories;

import com.colagusano11.tiendaonline.models.Cupon;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface CuponRepository extends JpaRepository<Cupon, Long> {
    Optional<Cupon> findByCodigo(String codigo);
}
