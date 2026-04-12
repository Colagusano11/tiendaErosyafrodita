package com.colagusano11.tiendaonline.repositories;

import com.colagusano11.tiendaonline.models.Pedido;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface PedidoRepository extends JpaRepository<Pedido, Long> {

    Optional<Pedido> findByIdAndUsuarioId(Long id, Long usuarioId);

    List<Pedido> findByUsuarioIdOrderByFechaDesc(Long usuarioId);

    Optional<Pedido> findByPaymentId(String paymentId);

    @org.springframework.data.jpa.repository.Query("SELECT COUNT(p) > 0 FROM Pedido p JOIN p.lineas l WHERE p.usuarioId = :usuarioId AND l.producto.id = :productoId AND p.estado IN (com.colagusano11.tiendaonline.models.PedidoEstado.PAGADO, com.colagusano11.tiendaonline.models.PedidoEstado.RECIBIDO, com.colagusano11.tiendaonline.models.PedidoEstado.ENVIADO, com.colagusano11.tiendaonline.models.PedidoEstado.ENTREGADO)")
    boolean hasUserPurchasedProduct(Long usuarioId, Long productoId);
}
