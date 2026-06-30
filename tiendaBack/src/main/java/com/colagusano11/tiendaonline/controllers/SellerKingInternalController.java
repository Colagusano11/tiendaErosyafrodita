package com.colagusano11.tiendaonline.controllers;

import com.colagusano11.tiendaonline.models.Pedido;
import com.colagusano11.tiendaonline.models.PedidoEstado;
import com.colagusano11.tiendaonline.models.Producto;
import com.colagusano11.tiendaonline.repositories.PedidoRepository;
import com.colagusano11.tiendaonline.repositories.ProductoRepository;
import com.colagusano11.tiendaonline.services.EmailService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;

/**
 * Endpoints internos consumidos exclusivamente por SellerKing.
 * Protegidos por SellerKingApiKeyFilter (Bearer API key).
 *
 * Contratos:
 *   GET    /api/internal/orders                        -> lista pedidos 'confirmed' (PAGADO/RECIBIDO)
 *   POST   /api/internal/orders/{id}/tracking          -> notificar tracking + marcar ENVIADO + email cliente
 *   PATCH  /api/internal/products/{webProductId}/stock -> actualizar stock
 */
@RestController
@RequestMapping("/api/internal")
public class SellerKingInternalController {

    private final PedidoRepository pedidoRepository;
    private final ProductoRepository productoRepository;
    private final EmailService emailService;

    public SellerKingInternalController(PedidoRepository pedidoRepository,
                                        ProductoRepository productoRepository,
                                        EmailService emailService) {
        this.pedidoRepository = pedidoRepository;
        this.productoRepository = productoRepository;
        this.emailService = emailService;
    }

    // -----------------------------------------------------------------
    // 1. SYNC DE PEDIDOS
    //    SellerKing llama periodicamente para obtener pedidos nuevos.
    //    Devuelve los pedidos en estado PAGADO o RECIBIDO:
    //      - PAGADO  = pago confirmado, pendiente de comprar al proveedor
    //      - RECIBIDO = ya comprado al proveedor, pendiente de envio
    // -----------------------------------------------------------------
    @GetMapping("/orders")
    public ResponseEntity<List<PedidoSalidaInterna>> getPedidosPendientes() {
        List<Pedido> pedidos = pedidoRepository
                .findByEstadoIn(List.of(PedidoEstado.PAGADO, PedidoEstado.RECIBIDO));

        List<PedidoSalidaInterna> result = pedidos.stream()
                .map(PedidoSalidaInterna::from)
                .toList();

        return ResponseEntity.ok(result);
    }

    // -----------------------------------------------------------------
    // 2. NOTIFICAR TRACKING
    //    SellerKing envia carrier + trackingNumber + trackingUrl.
    //    - Actualiza numSeguimiento y urlSeguimiento en el pedido
    //    - Marca el pedido como ENVIADO
    //    - Envia email al cliente (invitado o registrado) si tiene email
    // -----------------------------------------------------------------
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

        // Enviar email de envio al cliente (funciona para invitados y registrados)
        String emailDest = pedido.getEmail();
        if (emailDest != null && !emailDest.isBlank() && !emailDest.equals("info@erosyafrodita.com")) {
            try {
                emailService.enviarEmailEnvio(pedido, body.trackingNumber(), body.trackingUrl(), emailDest);
            } catch (Exception e) {
                // Log del error pero no bloqueamos la respuesta — el tracking ya esta guardado
                System.err.println("[TRACKING EMAIL] Error enviando email a " + emailDest + ": " + e.getMessage());
            }
        }

        return ResponseEntity.ok(Map.of(
                "ok", true,
                "pedidoId", id,
                "estado", pedido.getEstado(),
                "numSeguimiento", pedido.getNumSeguimiento() != null ? pedido.getNumSeguimiento() : "",
                "urlSeguimiento", pedido.getUrlSeguimiento() != null ? pedido.getUrlSeguimiento() : "",
                "emailEnviado", emailDest != null && !emailDest.isBlank() && !emailDest.equals("info@erosyafrodita.com")
        ));
    }

    // -----------------------------------------------------------------
    // 3. SYNC DE STOCK
    //    SellerKing envia el nuevo stock disponible de un producto.
    //    Solo actualiza Producto.stock, sin tocar precio ni otros campos.
    // -----------------------------------------------------------------
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

    // -----------------------------------------------------------------
    // DTOs internos (Java records — requiere Java 16+)
    // -----------------------------------------------------------------

    record TrackingRequest(String carrier, String trackingNumber, String trackingUrl) {}

    record StockRequest(Integer stock) {}

    /**
     * Proyeccion minima del pedido para SellerKing.
     * No expone paymentId, paymentGateway ni datos contables.
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
