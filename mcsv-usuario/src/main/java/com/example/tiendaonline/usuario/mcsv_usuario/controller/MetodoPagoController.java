package com.example.tiendaonline.usuario.mcsv_usuario.controller;

import com.example.tiendaonline.usuario.mcsv_usuario.dto.MetodoPagoDto;
import com.example.tiendaonline.usuario.mcsv_usuario.service.MetodoPagoService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/usuarios/{email}/pagos")
public class MetodoPagoController {

    private final MetodoPagoService service;

    public MetodoPagoController(MetodoPagoService service) {
        this.service = service;
    }

    @GetMapping
    public ResponseEntity<List<MetodoPagoDto>> listar(@PathVariable String email) {
        return ResponseEntity.ok(service.listarPorUsuario(email));
    }

    @PostMapping
    public ResponseEntity<MetodoPagoDto> agregar(@PathVariable String email, @RequestBody MetodoPagoDto dto) {
        return ResponseEntity.ok(service.agregarMetodo(email, dto));
    }

    @PutMapping("/{id}/principal")
    public ResponseEntity<MetodoPagoDto> marcarPrincipal(@PathVariable String email, @PathVariable Long id) {
        return ResponseEntity.ok(service.establecerPrincipal(email, id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> eliminar(@PathVariable Long id) {
        service.eliminarMetodo(id);
        return ResponseEntity.noContent().build();
    }
}
