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
    public List<PedidoSalida> getAllPedidos() {
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

    @DeleteMapping("/{id}")
    public void deletePedido(@PathVariable Long id) {
        pedidoService.deletePedido(id);
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
    public ResponseEntity<Void> confirmarPago(@RequestBody Map<String, String> body) {
        String paymentId = body.get("paymentId");
        if (paymentId == null || paymentId.isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        pedidoService.marcarPedidoPagado(paymentId);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/{id}/enviado")
    public void cambiarEnviado(@PathVariable Long id) {
        pedidoService.cambiarEnviado(id);
    }

    @PostMapping("/{id}/entregado")
    public void cambiarEntregado(@PathVariable Long id) {
        pedidoService.cambiarEntregado(id);
    }

    @PostMapping("/{id}/devolucion-solicitada")
    public void cambiarDevolucionSolicitada(@PathVariable Long id) {
        pedidoService.cambiarDevolucionSolicitada(id);
    }

    @PostMapping("/{id}/devuelto")
    public void cambiarDevuelto(@PathVariable Long id) {
        pedidoService.cambiarDevuelto(id);
    }

    @PostMapping("/{id}/cancelado")
    public void cambiarCancelado(@PathVariable Long id) {
        pedidoService.cambiarCancelado(id);
    }

    @PostMapping("/{id}/pago/revolut")
    public PaymentInitResponse iniciarPagoRevolut(@PathVariable Long id) {
        return pedidoService.iniciarPago(id);
    }

    @PostMapping("/{id}/pago/paypal")
    public PaymentInitResponse iniciarPagoPayPal(@PathVariable Long id) {
        return pedidoService.iniciarPagoPayPal(id);
    }

    @PostMapping("/{id}/pago/paypal/capture")
    public ResponseEntity<?> capturarPagoPayPal(@PathVariable Long id) {
        boolean success = pedidoService.capturarPagoPayPal(id);
        if (success) {
            return ResponseEntity.ok(Map.of("status", "COMPLETED", "pedidoId", id));
        }
        return ResponseEntity.badRequest().body(Map.of("status", "FAILED"));
    }

    @PutMapping("/{id}/estado")
    public void actualizarEstado(@PathVariable Long id, @RequestBody Map<String, String> body) {
        PedidoEstado estado = PedidoEstado.valueOf(body.get("estado"));
        pedidoService.cambiarEstado(id, estado);
    }

    @PutMapping("/{id}/tracking")
    public void actualizarTracking(@PathVariable Long id, @RequestBody Map<String, String> body) {
        String num = body.get("numSeguimiento");
        String url = body.get("urlSeguimiento");
        pedidoService.actualizarTracking(id, num, url);
    }

    @PostMapping("/{id}/push-proveedor")
    public void pushToProvider(@PathVariable Long id, @RequestBody PedidoPushRequest pushRequest) {
        pedidoService.pushPedidoAProveedor(id, pushRequest);
    }

    @PostMapping("/{id}/sync-tracking")
    public void syncTracking(@PathVariable Long id) {
        pedidoService.syncTrackingConProveedor(id);
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
}
