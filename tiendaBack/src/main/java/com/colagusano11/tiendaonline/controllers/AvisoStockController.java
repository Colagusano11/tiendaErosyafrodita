package com.colagusano11.tiendaonline.controllers;

import com.colagusano11.tiendaonline.models.AvisoStock;
import com.colagusano11.tiendaonline.repositories.AvisoStockRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/avisos-stock")
@CrossOrigin(origins = "*")
public class AvisoStockController {

    @Autowired
    private AvisoStockRepository repository;

    @PostMapping("/suscribir")
    public ResponseEntity<?> suscribir(@RequestBody Map<String, Object> payload) {
        String email = (String) payload.get("email");
        Long productoId = Long.valueOf(payload.get("productoId").toString());

        if (email == null || productoId == null) {
            return ResponseEntity.badRequest().body("Email y ProductoId son requeridos");
        }

        if (repository.existsByEmailAndProductoIdAndEnviado(email, productoId, false)) {
            return ResponseEntity.ok(Map.of("message", "Ya estás suscrito a este aviso"));
        }

        AvisoStock aviso = new AvisoStock();
        aviso.setEmail(email);
        aviso.setProductoId(productoId);
        repository.save(aviso);

        return ResponseEntity.ok(Map.of("message", "Suscripción realizada con éxito"));
    }
}
