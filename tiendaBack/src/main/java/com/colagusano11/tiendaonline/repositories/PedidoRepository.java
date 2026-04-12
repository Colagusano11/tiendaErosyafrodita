package com.colagusano11.tiendaonline.repositories;

import com.colagusano11.tiendaonline.models.Pedido;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PedidoRepository extends JpaRepository<Pedido, Long> {

    Optional<Pedido> findByIdAndUsuarioId(Long id, Long usuarioId);

    List<Pedido> findByUsuarioIdOrderByFechaDesc(Long usuarioId);

    Optional<Pedido> findByPaymentId(String paymentId);
}
