package com.colagusano11.tiendaonline.controllers;

import com.colagusano11.tiendaonline.client.dto.UsuarioRegistroDto;
import com.colagusano11.tiendaonline.models.*;
import com.colagusano11.tiendaonline.services.CarritoService;
import com.colagusano11.tiendaonline.services.ProductoService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/carrito")
public class CarritoController {

    private final CarritoService carritoService;
    private final ProductoService productoService;

    public CarritoController(CarritoService carritoService, ProductoService productoService) {
        this.carritoService = carritoService;
        this.productoService = productoService;
    }

    @PostMapping("/agregar")
    public ResponseEntity<?> agregarProductosAlCarrito(
            @RequestBody CarritoRequest request,
            @AuthenticationPrincipal UsuarioRegistroDto usuario) {

        if (usuario == null) {
            return ResponseEntity.status(401).body("Debes iniciar sesión para añadir productos al carrito.");
        }

        Producto producto = productoService.findById(request.getIdProducto());
        if (producto == null) {
            return ResponseEntity.status(404).body("Producto no encontrado.");
        }
        if (request.getCantidad() <= 0) {
            return ResponseEntity.badRequest().body("Cantidad no válida.");
        }

        Carrito carritoActualizado = carritoService.agregarProductoAlCarrito(usuario, producto, request.getCantidad());
        CarritoSalida dto = carritoService.mapearCarrito(carritoActualizado);
        return ResponseEntity.ok(dto);
    }

    @GetMapping
    public ResponseEntity<?> verCarrito(@AuthenticationPrincipal UsuarioRegistroDto usuario) {
        if (usuario == null) {
            return ResponseEntity.status(401).body("Debes iniciar sesión para ver tu carrito.");
        }
        var carrito = carritoService.obtenerCarritoUsuario(usuario);
        if (carrito == null) {
            return ResponseEntity.ok("El usuario no tiene carrito todavía.");
        }
        CarritoSalida dto = carritoService.mapearCarrito(carrito);
        return ResponseEntity.ok(dto);
    }

    @DeleteMapping("/vaciar")
    public ResponseEntity<String> vaciarCarrito(@AuthenticationPrincipal UsuarioRegistroDto usuario) {
        if (usuario == null) {
            return ResponseEntity.status(401).body("Debes iniciar sesión.");
        }
        carritoService.vaciarCarrito(usuario);
        return ResponseEntity.ok("Carrito vaciado.");
    }

    @DeleteMapping("/eliminar/{idProducto}")
    public ResponseEntity<String> eliminarProductoDelCarrito(
            @PathVariable Long idProducto,
            @AuthenticationPrincipal UsuarioRegistroDto usuario) {

        if (usuario == null) {
            return ResponseEntity.status(401).body("Debes iniciar sesión.");
        }

        Producto producto = productoService.findById(idProducto);
        if (producto == null) {
            return ResponseEntity.status(404).body("Producto no encontrado.");
        }

        carritoService.eliminarProductoDelCarrito(usuario, producto);
        return ResponseEntity.ok("Producto eliminado del carrito.");
    }
}
