package com.colagusano11.tiendaonline.controllers;

import com.colagusano11.tiendaonline.dto.SellerKingProductRequestDto;
import com.colagusano11.tiendaonline.dto.SellerKingProductResponseDto;
import com.colagusano11.tiendaonline.services.SellerKingProductService;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Endpoints internos para la integración SellerKing → ErosyAfrodita (catálogo).
 * Protegidos por SellerKingApiKeyFilter (Authorization: Bearer <key>).
 * No requieren JWT — el SecurityConfig ya hace .requestMatchers("/api/internal/**").permitAll().
 *
 * POST /api/internal/products           → crea o actualiza por EAN/SKU (upsert)
 * PUT  /api/internal/products/{id}      → actualiza por webProductId (ya conocido por SK)
 */
@RestController
@RequestMapping("/api/internal/products")
public class SellerKingProductController {

    private final SellerKingProductService sellerKingProductService;

    public SellerKingProductController(SellerKingProductService sellerKingProductService) {
        this.sellerKingProductService = sellerKingProductService;
    }

    /**
     * Publica o actualiza un producto desde SellerKing.
     * Upsert por EAN (primero) o SKU (fallback).
     *
     * Response 201 en creación, 200 en actualización.
     */
    @PostMapping
    public ResponseEntity<SellerKingProductResponseDto> publicarProducto(
            @RequestBody SellerKingProductRequestDto dto) {

        if (dto.getNombre() == null || dto.getNombre().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        if (dto.getPrecioPVP() == null) {
            return ResponseEntity.badRequest().build();
        }

        SellerKingProductResponseDto response = sellerKingProductService.publicarOActualizar(dto);

        HttpStatus status = "CREADO".equals(response.getAccion())
                ? HttpStatus.CREATED
                : HttpStatus.OK;

        return ResponseEntity.status(status).body(response);
    }

    /**
     * Actualiza un producto existente por su webProductId.
     * SellerKing usa este endpoint cuando ya tiene el external_id guardado.
     */
    @PutMapping("/{id}")
    public ResponseEntity<SellerKingProductResponseDto> actualizarProducto(
            @PathVariable Long id,
            @RequestBody SellerKingProductRequestDto dto) {

        try {
            SellerKingProductResponseDto response =
                    sellerKingProductService.actualizarPorId(id, dto);
            return ResponseEntity.ok(response);
        } catch (RuntimeException e) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(null);
        }
    }

    /**
     * Health-check rápido para que SellerKing verifique conectividad.
     */
    @GetMapping("/ping")
    public ResponseEntity<Map<String, String>> ping() {
        return ResponseEntity.ok(Map.of("status", "ok", "service", "products"));
    }
}
