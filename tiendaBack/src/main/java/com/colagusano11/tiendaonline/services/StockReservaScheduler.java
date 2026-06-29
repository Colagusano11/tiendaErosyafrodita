package com.colagusano11.tiendaonline.services;

import com.colagusano11.tiendaonline.models.Pedido;
import com.colagusano11.tiendaonline.models.PedidoEstado;
import com.colagusano11.tiendaonline.models.PedidoProducto;
import com.colagusano11.tiendaonline.models.Producto;
import com.colagusano11.tiendaonline.repositories.PedidoRepository;
import com.colagusano11.tiendaonline.repositories.ProductoRepository;
import jakarta.transaction.Transactional;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Libera reservas de stock de pedidos PENDIENTE_DE_PAGO con mas de 15 minutos sin pagar.
 * Se ejecuta cada 2 minutos.
 *
 * Flujo de stock:
 *   createPedidoDesdeCarrito()     -> descuenta stock (reserva inmediata)
 *   marcarPedidoPagado()           -> NO toca stock (ya descontado)
 *   liberarStockPedidosExpirados() -> devuelve stock + cancela si >15 min sin pago
 *   cambiarCancelado()             -> devuelve stock si cancelacion manual
 */
@Slf4j
@Component
public class StockReservaScheduler {

    private final PedidoRepository pedidoRepository;
    private final ProductoRepository productoRepository;

    public StockReservaScheduler(PedidoRepository pedidoRepository,
                                  ProductoRepository productoRepository) {
        this.pedidoRepository = pedidoRepository;
        this.productoRepository = productoRepository;
    }

    @Scheduled(fixedDelay = 120_000)
    @Transactional
    public void liberarStockPedidosExpirados() {
        LocalDateTime limite = LocalDateTime.now().minusMinutes(15);

        List<Pedido> pedidosExpirados = pedidoRepository
                .findByEstadoAndFechaBefore(PedidoEstado.PENDIENTE_DE_PAGO, limite);

        if (pedidosExpirados.isEmpty()) {
            return;
        }

        log.info("[StockReservaScheduler] {} pedido(s) expirado(s). Liberando stock...",
                pedidosExpirados.size());

        for (Pedido pedido : pedidosExpirados) {
            try {
                if (pedido.getLineas() != null) {
                    for (PedidoProducto linea : pedido.getLineas()) {
                        Producto p = linea.getProducto();
                        if (p != null) {
                            int cantidad = (linea.getCantidad() != null) ? linea.getCantidad() : 0;
                            int stockActual = (p.getStock() != null) ? p.getStock() : 0;
                            p.setStock(stockActual + cantidad);
                            productoRepository.save(p);
                            log.info("[STOCK LIBERADO] Pedido #{} - Producto #{}: {} -> {}",
                                    pedido.getId(), p.getId(), stockActual, p.getStock());
                        }
                    }
                }
                pedido.setEstado(PedidoEstado.CANCELADO);
                pedidoRepository.save(pedido);
                log.info("[StockReservaScheduler] Pedido #{} cancelado por timeout (>15 min sin pago).",
                        pedido.getId());
            } catch (Exception e) {
                log.error("[StockReservaScheduler] Error en pedido #{}: {}", pedido.getId(), e.getMessage());
            }
        }
    }
}
