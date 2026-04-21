package com.colagusano11.tiendaonline.controllers;

import com.colagusano11.tiendaonline.repositories.CategoriasRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/categorias")
@CrossOrigin(origins = {"http://localhost:5173","http://localhost:3000","http://localhost:4001","http://localhost:8080","http://localhost:8081","http://localhost:8082","https://erosyafrodita.com","https://erosyafrodita.com:8082"}, allowedHeaders = "*", allowCredentials = "true")
public class CategoriaController {

    private final CategoriasRepository categoriasRepository;

    public CategoriaController(CategoriasRepository categoriasRepository) {
        this.categoriasRepository = categoriasRepository;
    }

    @GetMapping
    public ResponseEntity<List<String>> getCategorias() {
        return ResponseEntity.ok(categoriasRepository.findAll()
            .stream()
            .map(c -> c.getCategoria())
            .toList());
    }
}
