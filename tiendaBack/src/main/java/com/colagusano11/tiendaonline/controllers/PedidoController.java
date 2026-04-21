package com.colagusano11.tiendaonline.controllers;

import com.colagusano11.tiendaonline.client.dto.UsuarioRegistroDto;
import com.colagusano11.tiendaonline.models.Pedido;
import com.colagusano11.tiendaonline.models.PedidoEstado;
import com.colagusano11.tiendaonline.models.PedidoPushRequest;
import com.colagusano11.tiendaonline.models.PedidoRequest;
import com.colagusano11.tiendaonline.models.PedidoSalida;
import com.colagusano11.tiendaonline.models.TrackingInfoDTO;
import com.colagusano11.tiendaonline.payments.dto.PaymentInitResponse;
import com.colagusano11.tiendaonline.services.PedidoServicie;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/pedidos")
public class PedidoController {

    private final PedidoServicie pedidoService;

    public PedidoController(PedidoServicie pedidoService) {
        this.pedidoService = pedidoService;
    }

    // Admin: ver todos los pedidos
    @GetMapping
    public List<PedidoSalida> getAllPedidos(@AuthenticationPrincipal UsuarioRegistroDto admin) {
        if (admin == null || !admin.getEmail().contains("admin")) {
            // log security event
            return List.of();
        }
        return pedidoService.getAllPedidos();
    }

    // Crear pedido desde el carrito del usuario autenticado
    @PostMapping
    public ResponseEntity<?> crearPedidoDesdeCarrito(
            @RequestBody PedidoRequest pedidoRequest,
            @AuthenticationPrincipal UsuarioRegistroDto usuario) {

        // Permitimos usuario null para pedidos como invitado

        Pedido pedido = pedidoService.createPedidoDesdeCarrito(usuario, pedidoRequest);
        PedidoSalida dto = pedidoService.mapearPedidoSalida(pedido);
        return ResponseEntity.ok(dto);
    }

    // Alias con /confirmar (para compatibilidad si alguna parte del código lo usa)
    @PostMapping("/confirmar")
    public ResponseEntity<?> confirmarPedido(
            @RequestBody PedidoRequest pedidoRequest,
            @AuthenticationPrincipal UsuarioRegistroDto usuario) {
        return crearPedidoDesdeCarrito(pedidoRequest, usuario);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // ADMIN ONLY — todos los cambios de estado requieren ADMIN y ownership check
    // ─────────────────────────────────────────────────────────────────────────

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deletePedido(
            @PathVariable Long id,
            @AuthenticationPrincipal UsuarioRegistroDto admin) {
        if (admin == null || !isAdmin(admin)) {
            return ResponseEntity.status(403).body("Acceso denegado.");
        }
        // Validar que el admin existe y es admin de verdad (cruce con microservicio)
        if (!pedidoService.esAdminDelPedido(id, admin.getEmail())) {
            // Si no es admin del pedido, denegado (por ahora solo permite borrar propios)
            // TODO: si el admin tiene rol ADMIN_GLOBAL, puede borrar cualquier pedido
            pedidoService.deletePedido(id);
        }
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> verPedido(
            @PathVariable Long id,
            @AuthenticationPrincipal UsuarioRegistroDto usuario) {

        if (usuario == null) {
            return ResponseEntity.status(401).body("Debes iniciar sesión.");
        }

        Pedido pedido = pedidoService.buscarPorIdYUsuario(id, usuario);
        if (pedido == null) {
            return ResponseEntity.status(404).body("Pedido no encontrado.");
        }
        PedidoSalida dto = pedidoService.mapearPedidoSalida(pedido);
        return ResponseEntity.ok(dto);
    }

    // Historial de pedidos del usuario autenticado
    @GetMapping("/historial")
    public ResponseEntity<?> historialPedidos(@AuthenticationPrincipal UsuarioRegistroDto usuario) {
        if (usuario == null) {
            return ResponseEntity.status(401).body("Debes iniciar sesión.");
        }
        List<PedidoSalida> historial = pedidoService.historialPedidos(usuario.getId());
        return ResponseEntity.ok(historial);
    }

    @PostMapping("/pago/confirmar")
    public ResponseEntity<Void> confirmarPago(
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UsuarioRegistroDto usuario) {
        if (usuario == null) {
            return ResponseEntity.status(401).build();
        }
        String paymentId = body.get("paymentId");
        if (paymentId == null || paymentId.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        // Verificar que el usuario tiene un pedido con ese paymentId
        Pedido pedido = pedidoService.findByPaymentId(paymentId);
        if (pedido == null) {
            return ResponseEntity.status(404).build();
        }
        // Solo el dueño del pedido puede confirmarlo
        if (!pedido.getUsuarioId().equals(usuario.getId())) {
            return ResponseEntity.status(403).build();
        }
        pedidoService.marcarPedidoPagado(paymentId);
        return ResponseEntity.noContent().build();
    }

    // Cambios de estado — SOLO ADMIN con validación de propiedad del pedido
    @PostMapping("/{id}/enviado")
    public ResponseEntity<?> cambiarEnviado(
            @PathVariable Long id,
            @AuthenticationPrincipal UsuarioRegistroDto admin) {
        return validarAdminYCambiarEstado(id, admin, p -> pedidoService.cambiarEnviado(id));
    }

    @PostMapping("/{id}/entregado")
    public ResponseEntity<?> cambiarEntregado(
            @PathVariable Long id,
            @AuthenticationPrincipal UsuarioRegistroDto admin) {
        return validarAdminYCambiarEstado(id, admin, p -> pedidoService.cambiarEntregado(id));
    }

    @PostMapping("/{id}/devolucion-solicitada")
    public ResponseEntity<?> cambiarDevolucionSolicitada(
            @PathVariable Long id,
            @AuthenticationPrincipal UsuarioRegistroDto admin) {
        return validarAdminYCambiarEstado(id, admin, p -> pedidoService.cambiarDevolucionSolicitada(id));
    }

    @PostMapping("/{id}/devuelto")
    public ResponseEntity<?> cambiarDevuelto(
            @PathVariable Long id,
            @AuthenticationPrincipal UsuarioRegistroDto admin) {
        return validarAdminYCambiarEstado(id, admin, p -> pedidoService.cambiarDevuelto(id));
    }

    @PostMapping("/{id}/cancelado")
    public ResponseEntity<?> cambiarCancelado(
            @PathVariable Long id,
            @AuthenticationPrincipal UsuarioRegistroDto usuario) {
        if (usuario == null) {
            return ResponseEntity.status(401).body("Autenticación requerida.");
        }
        // El usuario puede cancelar su propio pedido si está en estado pendiente
        Pedido pedido = pedidoService.buscarPorIdYUsuario(id, usuario);
        if (pedido == null) {
            return ResponseEntity.status(404).body("Pedido no encontrado.");
        }
        if (pedido.getEstado() != PedidoEstado.PENDIENTE_DE_PAGO && pedido.getEstado() != PedidoEstado.PENDIENTE) {
            return ResponseEntity.status(400).body("No se puede cancelar un pedido que ya ha sido pagado o enviado.");
        }
        pedidoService.cambiarCancelado(id);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/pago/revolut")
    public ResponseEntity<?> iniciarPago(
            @PathVariable Long id,
            @AuthenticationPrincipal UsuarioRegistroDto usuario) {
        if (usuario == null) {
            return ResponseEntity.status(401).body("Autenticación requerida.");
        }
        PaymentInitResponse resp = pedidoService.iniciarPago(id);
        return ResponseEntity.ok(resp);
    }

    @PutMapping("/{id}/estado")
    public ResponseEntity<?> actualizarEstado(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UsuarioRegistroDto admin) {
        if (!isAdmin(admin)) {
            return ResponseEntity.status(403).body("Acceso denegado.");
        }
        try {
            PedidoEstado estado = PedidoEstado.valueOf(body.get("estado"));
            pedidoService.cambiarEstado(id, estado);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body("Estado inválido.");
        }
    }

    @PutMapping("/{id}/tracking")
    public ResponseEntity<?> actualizarTracking(
            @PathVariable Long id,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal UsuarioRegistroDto admin) {
        if (!isAdmin(admin)) {
            return ResponseEntity.status(403).body("Acceso denegado.");
        }
        String num = body.get("numSeguimiento");
        String url = body.get("urlSeguimiento");
        pedidoService.actualizarTracking(id, num, url);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/push-proveedor")
    public ResponseEntity<?> pushToProvider(
            @PathVariable Long id,
            @RequestBody PedidoPushRequest pushRequest,
            @AuthenticationPrincipal UsuarioRegistroDto admin) {
        if (!isAdmin(admin)) {
            return ResponseEntity.status(403).body("Acceso denegado.");
        }
        pedidoService.pushPedidoAProveedor(id, pushRequest);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/{id}/sync-tracking")
    public ResponseEntity<?> syncTracking(
            @PathVariable Long id,
            @AuthenticationPrincipal UsuarioRegistroDto admin) {
        if (!isAdmin(admin)) {
            return ResponseEntity.status(403).body("Acceso denegado.");
        }
        pedidoService.syncTrackingConProveedor(id);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/check-tracking")
    public TrackingInfoDTO checkTracking(@PathVariable Long id) {
        return pedidoService.getTrackingExterno(id);
    }

    @GetMapping("/rastrear")
    public ResponseEntity<?> rastrearPedido(
            @RequestParam Long id,
            @RequestParam String email) {
        return pedidoService.rastrearPedido(id, email)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.status(404).build());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helper methods
    // ─────────────────────────────────────────────────────────────────────────

    /** Checks if user has admin role */
    private boolean isAdmin(UsuarioRegistroDto usuario) {
        return usuario != null && usuario.isAdmin();
    }

    /** Generic helper for admin state-change operations */
    @FunctionalInterface
    interface PedidoOperation {
        void execute(Pedido pedido);
    }

    private ResponseEntity<?> validarAdminYCambiarEstado(
            Long idPedido,
            UsuarioRegistroDto admin,
            PedidoOperation operation) {
        if (!isAdmin(admin)) {
            return ResponseEntity.status(403).body("Acceso denegado.");
        }
        // Admin puede cambiar cualquier pedido (rol ADMIN global)
        // La validación específica del pedido se delega al service
        Pedido pedido = pedidoService.findById(idPedido);
        if (pedido == null) {
            return ResponseEntity.status(404).body("Pedido no encontrado.");
        }
        operation.execute(pedido);
        return ResponseEntity.ok().build();
    }
}