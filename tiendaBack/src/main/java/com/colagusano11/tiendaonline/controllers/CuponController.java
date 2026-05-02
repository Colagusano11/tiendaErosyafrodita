package com.colagusano11.tiendaonline.controllers;

import com.colagusano11.tiendaonline.models.Cupon;
import com.colagusano11.tiendaonline.repositories.CuponRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/cupones")
@CrossOrigin(origins = "*")
public class CuponController {

    @Autowired
    private CuponRepository cuponRepository;

    // --- Endpoints Administrativos ---

    @GetMapping
    public List<Cupon> getAll() {
        return cuponRepository.findAll();
    }

    @PostMapping
    public ResponseEntity<Cupon> create(@RequestBody Cupon cupon) {
        if (cupon.getCodigo() != null) {
            cupon.setCodigo(cupon.getCodigo().toUpperCase());
        }
        return ResponseEntity.ok(cuponRepository.save(cupon));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        cuponRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }

    // --- Endpoint Público para el Checkout ---

    @GetMapping("/validar/{codigo}")
    public ResponseEntity<?> validarCupon(@PathVariable String codigo) {
        Optional<Cupon> cuponOpt = cuponRepository.findByCodigo(codigo.toUpperCase());

        if (cuponOpt.isPresent()) {
            Cupon cupon = cuponOpt.get();
            if (cupon.isValido()) {
                return ResponseEntity.ok(cupon);
            } else {
                return ResponseEntity.badRequest().body("El cupón ha expirado o no está activo");
            }
        }

        return ResponseEntity.notFound().build();
    }
}
