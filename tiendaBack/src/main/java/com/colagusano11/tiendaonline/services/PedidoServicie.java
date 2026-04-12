package com.colagusano11.tiendaonline.services;

import java.util.List;
import java.util.Optional;

import com.colagusano11.tiendaonline.models.*;
import com.colagusano11.tiendaonline.payments.dto.PaymentInitResponse;
import com.colagusano11.tiendaonline.client.dto.UsuarioRegistroDto;

public interface PedidoServicie {

    List<PedidoSalida> getAllPedidos();
    Optional<PedidoSalida> obtenerPedidoPorId(Long id);
    Pedido createPedidoDesdeCarrito(UsuarioRegistroDto usuario, PedidoRequest pedidoRequest);
    void cambiarEstado(Long idPedido, PedidoEstado nuevoEstado);
    void deletePedido(Long id);
    PedidoSalida mapearPedidoSalida(Pedido pedido);
    Pedido buscarPorIdYUsuario(Long id, UsuarioRegistroDto usuario);
    List<Pedido> findByUsuarioIdOrderByFechaDesc(Long usuarioId);
    List<PedidoSalida> historialPedidos(Long usuarioId);
    boolean transicionEstado(PedidoEstado estadoActual, PedidoEstado nuevoEstado);
    void cambiarEnviado(Long idPedido);
    void cambiarEntregado(Long idPedido);
    void cambiarDevolucionSolicitada(Long idPedido);
    void cambiarDevuelto(Long idPedido);
    void cambiarCancelado(Long idPedido);
    PaymentInitResponse iniciarPago(Long id);
    Pedido findByPaymentId(String paymentId);
    void marcarPedidoPagado(String revolutOrderId);
    void actualizarTracking(Long idPedido, String numSeguimiento, String urlSeguimiento);
    void pushPedidoAProveedor(Long idPedido, PedidoPushRequest pushRequest);
    void syncTrackingConProveedor(Long idPedido);
    TrackingInfoDTO getTrackingExterno(Long idPedido);
    Pedido findById(Long id);
}
