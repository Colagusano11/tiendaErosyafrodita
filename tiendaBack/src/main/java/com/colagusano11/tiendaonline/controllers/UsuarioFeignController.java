package com.colagusano11.tiendaonline.controllers;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.colagusano11.tiendaonline.client.dto.UsuarioDto;
import com.colagusano11.tiendaonline.client.dto.UsuarioRegistro;
import com.colagusano11.tiendaonline.client.dto.UsuarioRegistroDto;
import com.colagusano11.tiendaonline.services.UsuarioServiceFeign;

@RestController
@RequestMapping("/usuarios")
public class UsuarioFeignController {

    private final UsuarioServiceFeign usuarioServiceFeign;

    public UsuarioFeignController(UsuarioServiceFeign usuarioServiceFeign) {
        this.usuarioServiceFeign = usuarioServiceFeign;
    }

    @PostMapping("/registro")
    public ResponseEntity<UsuarioDto> registrar(@RequestBody UsuarioRegistro user) {
        UsuarioDto creado = usuarioServiceFeign.registrar(user);
        return new ResponseEntity<>(creado, HttpStatus.CREATED);
    }

    @GetMapping
    public ResponseEntity<List<UsuarioRegistroDto>> getAll() {
        List<UsuarioRegistroDto> usuarios = usuarioServiceFeign.getAll();
        return ResponseEntity.ok(usuarios);
    }

    @GetMapping("/{email}")
    public ResponseEntity<UsuarioRegistroDto> verUser(@PathVariable String email) {
        UsuarioRegistroDto usuario = usuarioServiceFeign.verUser(email);
        return ResponseEntity.ok(usuario);
    }

    @PutMapping("/{email}")
    public ResponseEntity<UsuarioRegistroDto> actualizar(
            @PathVariable String email,
            @RequestBody UsuarioRegistroDto datos) {

        UsuarioRegistroDto actualizado = usuarioServiceFeign.actualizarDatos(email, datos);
        return ResponseEntity.ok(actualizado);
    }

    @DeleteMapping("/{email}")
    public ResponseEntity<Void> delete(@PathVariable String email) {
        usuarioServiceFeign.deleteUsuario(email);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{email}/pagos")
    public ResponseEntity<List<com.colagusano11.tiendaonline.client.dto.MetodoPagoDto>> getMetodos(@PathVariable String email) {
        return ResponseEntity.ok(usuarioServiceFeign.getMetodos(email));
    }

    @PostMapping("/{email}/pagos")
    public ResponseEntity<com.colagusano11.tiendaonline.client.dto.MetodoPagoDto> agregarMetodo(@PathVariable String email, @RequestBody com.colagusano11.tiendaonline.client.dto.MetodoPagoDto dto) {
        return ResponseEntity.ok(usuarioServiceFeign.agregarMetodo(email, dto));
    }

    @DeleteMapping("/{email}/pagos/{id}")
    public ResponseEntity<Void> eliminarMetodo(@PathVariable String email, @PathVariable Long id) {
        usuarioServiceFeign.eliminarMetodo(email, id);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{email}/pagos/{id}/principal")
    public ResponseEntity<com.colagusano11.tiendaonline.client.dto.MetodoPagoDto> marcarPrincipal(@PathVariable String email, @PathVariable Long id) {
        return ResponseEntity.ok(usuarioServiceFeign.marcarPrincipal(email, id));
    }

    @PutMapping("/{email}/password")
    public ResponseEntity<Void> updatePassword(
            @PathVariable String email,
            @RequestBody com.colagusano11.tiendaonline.client.dto.PasswordChangeRequest request) {
        usuarioServiceFeign.updatePassword(email, request);
        return ResponseEntity.ok().build();
    }
}



