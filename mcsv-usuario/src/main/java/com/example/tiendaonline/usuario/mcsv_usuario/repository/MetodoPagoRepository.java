package com.example.tiendaonline.usuario.mcsv_usuario.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.tiendaonline.usuario.mcsv_usuario.models.MetodoPago;
import com.example.tiendaonline.usuario.mcsv_usuario.models.Usuario;
import java.util.List;

public interface MetodoPagoRepository extends JpaRepository<MetodoPago, Long> {
    List<MetodoPago> findByUsuarioOrderByIsPrincipalDesc(Usuario usuario);
}
