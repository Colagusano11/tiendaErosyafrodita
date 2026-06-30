package com.colagusano11.tiendaonline.controllers;

import com.colagusano11.tiendaonline.models.Pedido;
import com.colagusano11.tiendaonline.models.PedidoEstado;
import com.colagusano11.tiendaonline.models.Producto;
import com.colagusano11.tiendaonline.repositories.PedidoRepository;
import com.colagusano11.tiendaonline.repositories.ProductoRepository;
import com.colagusano11.tiendaonline.services.EmailService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

/**
 * Endpoints internos consumidos exclusivamente por SellerKing.
 * Protegidos por SellerKingApiKeyFilter (Bearer API key).
 *
 * Contratos:
 *   GET    /api/internal/orders                        -> lista pedidos PAGADO/RECIBIDO
 *                                                         Devuelve erosOrderId (= id numerico del pedido)
 *   POST   /api/internal/orders/{id}/tracking          -> notificar tracking + marcar ENVIADO + email cliente
 *   POST   /api/internal/orders/{id}/status            -> cambiar estado (solo RECIBIDO admitido por SellerKing)
 *   PATCH  /api/internal/products/{webProductId}/stock -> actualizar stock
 *
 * CONTRATO erosOrderId:
 *   PedidoSalidaInterna devuelve erosOrderId (Long) = id numerico del pedido.
 *   SellerKing lo persiste como String ("42") y lo usa en las URLs de tracking.
 *   Spring convierte "42" a Long en el PathVariable de tiendaback. Ciclo cerrado.
 */
@RestController
@RequestMapping("/api/internal")
public class SellerKingInternalController {

    /** Estados que SellerKing tiene permiso de escribir directamente. */
    private static final Set<PedidoEstado> ESTADOS_PERMITIDOS_SELLERKING =
            Set.of(PedidoEstado.RECIBIDO);

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
    //    Devuelve los pedidos en estado PAGADO o RECIBIDO.
    //    PAGADO   = pago confirmado, pendiente de comprar al proveedor
    //    RECIBIDO = ya comprado al proveedor, pendiente de envio
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
    //    {id} = Long id de la tabla pedidos (= erosOrderId del JSON).
    //    - Actualiza numSeguimiento, urlSeguimiento y estadoProveedor
    //    - Marca el pedido como ENVIADO
    //    - Envia email al cliente si tiene email valido
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

        String emailDest = pedido.getEmail();
        if (emailDest != null && !emailDest.isBlank() && !emailDest.equals("info@erosyafrodita.com")) {
            try {
                emailService.enviarEmailEnvio(pedido, body.trackingNumber(), body.trackingUrl(), emailDest);
            } catch (Exception e) {
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
    // 3. ACTUALIZAR ESTADO (GAP 2)
    //    Permite a SellerKing marcar un pedido como RECIBIDO (comprado
    //    al proveedor pero aun no enviado al cliente).
    //
    //    Solo se admiten los estados de ESTADOS_PERMITIDOS_SELLERKING.
    //    ENVIADO lo gestiona /tracking; CANCELADO/ENTREGADO los gestiona
    //    el admin de tiendaback directamente.
    //
    //    Request body: { "estado": "RECIBIDO" }
    //    Response 200: { ok, pedidoId, estado, numPedido }
    //    Response 400: si el estado solicitado no esta permitido
    //    Response 404: si el pedido no existe
    // -----------------------------------------------------------------
    @PostMapping("/orders/{id}/status")
    public ResponseEntity<?> actualizarEstado(
            @PathVariable Long id,
            @RequestBody EstadoRequest body) {

        PedidoEstado nuevoEstado;
        try {
            nuevoEstado = PedidoEstado.valueOf(body.estado().toUpperCase());
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Estado desconocido: " + body.estado()));
        }

        if (!ESTADOS_PERMITIDOS_SELLERKING.contains(nuevoEstado)) {
            return ResponseEntity.badRequest()
                    .body(Map.of(
                            "error", "Estado '" + nuevoEstado + "' no permitido via API interna.",
                            "permitidos", ESTADOS_PERMITIDOS_SELLERKING.stream()
                                    .map(Enum::name).toList()));
        }

        Optional<Pedido> opt = pedidoRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.notFound().build();

        Pedido pedido = opt.get();
        pedido.setEstado(nuevoEstado);
        pedidoRepository.save(pedido);

        return ResponseEntity.ok(Map.of(
                "ok", true,
                "pedidoId", id,
                "estado", pedido.getEstado(),
                "numPedido", PedidoSalidaInterna.formatNumPedido(pedido)
        ));
    }

    // -----------------------------------------------------------------
    // 4. SYNC DE STOCK
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

    record EstadoRequest(String estado) {}

    /**
     * Proyeccion minima del pedido para SellerKing.
     * No expone paymentId, paymentGateway ni datos contables.
     *
     * CAMPO CLAVE: erosOrderId == id (Long).
     * CAMPO LEGIBLE: numPedido == "ERO-{anio}-{id:05d}" (ej: ERO-2026-00042)
     *   -> Coincide con el numero que el cliente recibe en su email de confirmacion.
     */
    record PedidoSalidaInterna(
            Long id,
            Long erosOrderId,          // alias de id — clave que usa SellerKing
            String numPedido,          // numero legible para el operador (GAP 3)
            String estado,
            String customerEmail,      // alias de email
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
            java.math.BigDecimal orderTotal,
            java.time.LocalDateTime fecha,
            List<LineaInterna> lineas
    ) {
        /** Genera el numero de pedido legible: ERO-2026-00042 */
        static String formatNumPedido(Pedido p) {
            String anio = (p.getFecha() != null)
                    ? String.valueOf(p.getFecha().getYear())
                    : String.valueOf(java.time.LocalDateTime.now().getYear());
            return String.format("ERO-%s-%05d", anio, p.getId());
        }

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
                    p.getId(),             // erosOrderId
                    formatNumPedido(p),    // numPedido: ERO-2026-00042
                    p.getEstado() != null ? p.getEstado().name() : null,
                    p.getEmail(),          // customerEmail
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
                    p.getTotal(),          // orderTotal
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
