package com.colagusano11.tiendaonline.controllers;

import com.colagusano11.tiendaonline.client.dto.UsuarioRegistroDto;
import com.colagusano11.tiendaonline.models.Resena;
import com.colagusano11.tiendaonline.repositories.ResenaRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.OptionalDouble;

@RestController
@RequestMapping("/resenas")
public class ResenaController {

    private final ResenaRepository resenaRepository;

    public ResenaController(ResenaRepository resenaRepository) {
        this.resenaRepository = resenaRepository;
    }

    @GetMapping("/producto/{productoId}")
    public ResponseEntity<Map<String, Object>> getResenas(@PathVariable Long productoId) {
        List<Resena> resenas = resenaRepository.findByProductoIdOrderByFechaDesc(productoId);
        OptionalDouble avg = resenas.stream().mapToInt(Resena::getRating).average();
        double media = avg.isPresent() ? Math.round(avg.getAsDouble() * 10.0) / 10.0 : 0.0;
        return ResponseEntity.ok(Map.of(
                "resenas", resenas,
                "media", media,
                "total", resenas.size()
        ));
    }

    @PostMapping("/producto/{productoId}")
    public ResponseEntity<?> crearResena(
            @PathVariable Long productoId,
            @RequestBody Map<String, Object> body,
            @AuthenticationPrincipal UsuarioRegistroDto usuario) {

        if (usuario == null) {
            return ResponseEntity.status(401).body("Debes iniciar sesión para dejar una reseña.");
        }

        int rating = (int) body.get("rating");
        if (rating < 1 || rating > 5) {
            return ResponseEntity.badRequest().body("La valoración debe estar entre 1 y 5.");
        }

        // Un usuario solo puede dejar una reseña por producto
        if (resenaRepository.findByProductoIdAndUsuarioId(productoId, usuario.getId()).isPresent()) {
            return ResponseEntity.badRequest().body("Ya has dejado una reseña para este producto.");
        }

        Resena resena = new Resena();
        resena.setProductoId(productoId);
        resena.setUsuarioId(usuario.getId());
        String nombre = (usuario.getName() != null ? usuario.getName() : "") +
                        (usuario.getApellidos() != null ? " " + usuario.getApellidos().charAt(0) + "." : "");
        resena.setNombreUsuario(nombre.trim().isEmpty() ? usuario.getEmail() : nombre.trim());
        resena.setRating(rating);
        resena.setComentario(body.getOrDefault("comentario", "").toString());
        resena.setFecha(LocalDateTime.now());

        return ResponseEntity.ok(resenaRepository.save(resena));
    }
}
