package com.colagusano11.tiendaonline.controllers;

import com.colagusano11.tiendaonline.models.Pedido;
import com.colagusano11.tiendaonline.models.PedidoEstado;
import com.colagusano11.tiendaonline.models.Producto;
import com.colagusano11.tiendaonline.repositories.PedidoRepository;
import com.colagusano11.tiendaonline.repositories.ProductoRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Endpoints internos consumidos exclusivamente por SellerKing.
 * Protegidos por SellerKingApiKeyFilter (Bearer API key).
 *
 * Contratos:
 *   GET    /api/internal/orders                       → lista pedidos 'confirmed' (PENDIENTE/RECIBIDO)
 *   POST   /api/internal/orders/{id}/tracking         → notificar tracking + marcar ENVIADO
 *   PATCH  /api/internal/products/{webProductId}/stock → actualizar stock
 */
@RestController
@RequestMapping("/api/internal")
public class SellerKingInternalController {

    private final PedidoRepository pedidoRepository;
    private final ProductoRepository productoRepository;

    public SellerKingInternalController(PedidoRepository pedidoRepository,
                                        ProductoRepository productoRepository) {
        this.pedidoRepository = pedidoRepository;
        this.productoRepository = productoRepository;
    }

    // ─────────────────────────────────────────────────────────────────
    // 1. SYNC DE PEDIDOS
    //    SellerKing llama periódicamente para obtener pedidos nuevos
    //    (estado PENDIENTE o RECIBIDO = equivalente a 'confirmed' en EA)
    // ─────────────────────────────────────────────────────────────────
    @GetMapping("/orders")
    public ResponseEntity<List<PedidoSalidaInterna>> getPedidosPendientes() {
        List<Pedido> pedidos = pedidoRepository
                .findByEstadoIn(List.of(PedidoEstado.PENDIENTE, PedidoEstado.RECIBIDO));

        List<PedidoSalidaInterna> result = pedidos.stream()
                .map(PedidoSalidaInterna::from)
                .toList();

        return ResponseEntity.ok(result);
    }

    // ─────────────────────────────────────────────────────────────────
    // 2. NOTIFICAR TRACKING
    //    SellerKing envía carrier + trackingNumber + trackingUrl.
    //    Se actualiza el pedido y se marca como ENVIADO.
    //    Si el pedido tiene email, el servicio de email existente
    //    enviará la notificación al cliente (ver TODO abajo).
    // ─────────────────────────────────────────────────────────────────
    @PostMapping("/orders/{id}/tracking")
    public ResponseEntity<?> notificarTracking(
            @PathVariable Long id,
            @RequestBody TrackingRequest body) {

        Optional<Pedido> opt = pedidoRepository.findById(id);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Pedido pedido = opt.get();
        pedido.setNumSeguimiento(body.trackingNumber());
        pedido.setUrlSeguimiento(body.trackingUrl());
        pedido.setEstadoProveedor(body.carrier());
        pedido.setEstado(PedidoEstado.ENVIADO);
        pedidoRepository.save(pedido);

        // TODO: si pedido.getEmail() != null → disparar email de envío al cliente
        // (reutilizar el EmailService existente con template de tracking)

        return ResponseEntity.ok(Map.of(
                "ok", true,
                "pedidoId", id,
                "estado", pedido.getEstado(),
                "numSeguimiento", pedido.getNumSeguimiento(),
                "urlSeguimiento", pedido.getUrlSeguimiento() != null ? pedido.getUrlSeguimiento() : ""
        ));
    }

    // ─────────────────────────────────────────────────────────────────
    // 3. SYNC DE STOCK
    //    SellerKing envía el nuevo stock disponible de un producto.
    //    Se actualiza Producto.stock sin tocar precio ni otros campos.
    // ─────────────────────────────────────────────────────────────────
    @PatchMapping("/products/{webProductId}/stock")
    public ResponseEntity<?> actualizarStock(
            @PathVariable Long webProductId,
            @RequestBody StockRequest body) {

        Optional<Producto> opt = productoRepository.findById(webProductId);
        if (opt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Producto producto = opt.get();
        producto.setStock(body.stock());
        productoRepository.save(producto);

        return ResponseEntity.ok(Map.of(
                "ok", true,
                "webProductId", webProductId,
                "stock", producto.getStock()
        ));
    }

    // ─────────────────────────────────────────────────────────────────
    // DTOs internos (records — Java 16+, disponible en Java 17)
    // ─────────────────────────────────────────────────────────────────

    record TrackingRequest(String carrier, String trackingNumber, String trackingUrl) {}

    record StockRequest(Integer stock) {}

    /**
     * Proyección mínima del pedido para SellerKing.
     * Solo expone lo necesario para el flujo operativo (no datos de pago).
     */
    record PedidoSalidaInterna(
            Long id,
            String estado,
            String email,
            String nombre,
            String apellidos,
            String telefono,
            String calle,
            String ciudad,
            String codigoPostal,
            String provincia,
            String pais,
            java.math.BigDecimal total,
            java.time.LocalDateTime fecha,
            List<LineaInterna> lineas
    ) {
        static PedidoSalidaInterna from(Pedido p) {
            List<LineaInterna> lineas = p.getLineas() == null ? List.of() :
                    p.getLineas().stream().map(l -> new LineaInterna(
                            l.getProducto() != null ? l.getProducto().getId() : null,
                            l.getProducto() != null ? l.getProducto().getNombre() : null,
                            l.getProducto() != null ? l.getProducto().getEan() : null,
                            l.getCantidad(),
                            l.getPrecioUnitario()
                    )).toList();

            return new PedidoSalidaInterna(
                    p.getId(),
                    p.getEstado() != null ? p.getEstado().name() : null,
                    p.getEmail(),
                    p.getNombre(),
                    p.getApellidos(),
                    p.getTelefono(),
                    p.getCalle(),
                    p.getCiudad(),
                    p.getCodigoPostal(),
                    p.getProvincia(),
                    p.getPais(),
                    p.getTotal(),
                    p.getFecha(),
                    lineas
            );
        }
    }

    record LineaInterna(
            Long productoId,
            String nombre,
            String ean,
            Integer cantidad,
            java.math.BigDecimal precioUnitario
    ) {}
}
