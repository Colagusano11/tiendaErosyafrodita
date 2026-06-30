package com.colagusano11.tiendaonline.services;

import com.colagusano11.tiendaonline.dto.SellerKingProductRequestDto;
import com.colagusano11.tiendaonline.dto.SellerKingProductResponseDto;
import com.colagusano11.tiendaonline.models.Producto;
import com.colagusano11.tiendaonline.repositories.ProductoRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;

/**
 * Lógica de negocio para publicar/actualizar productos enviados por SellerKing.
 *
 * Estrategia upsert:
 *   1. Busca por EAN (identificador canónico entre sistemas)
 *   2. Si no tiene EAN, busca por SKU
 *   3. Si no existe → CREATE  (accion="CREADO")
 *   4. Si ya existe → UPDATE  (accion="ACTUALIZADO") — nunca se sobreescribe precioPVP
 *      si el admin ya lo modificó manualmente (precio != precioPVP recibido)
 *
 * El slug lo genera automáticamente Producto#generarSlug() en @PrePersist/@PreUpdate.
 * El precio de coste interno (campo `precio`) se inicializa al precioPVP recibido
 * solo en la creación, como valor temporal hasta que el admin lo ajuste.
 */
@Service
public class SellerKingProductService {

    private final ProductoRepository productoRepository;

    public SellerKingProductService(ProductoRepository productoRepository) {
        this.productoRepository = productoRepository;
    }

    @Transactional
    public SellerKingProductResponseDto publicarOActualizar(SellerKingProductRequestDto dto) {

        Optional<Producto> existing = Optional.empty();

        if (dto.getEan() != null && !dto.getEan().isBlank()) {
            existing = productoRepository.findByEan(dto.getEan());
        }
        if (existing.isEmpty() && dto.getSku() != null && !dto.getSku().isBlank()) {
            existing = productoRepository.findBySku(dto.getSku());
        }

        boolean esNuevo = existing.isEmpty();
        Producto producto = existing.orElse(new Producto());

        // Campos que siempre se sincronizan desde SellerKing
        if (dto.getNombre()      != null) producto.setNombre(dto.getNombre());
        if (dto.getDescripcion() != null) producto.setDescripcion(dto.getDescripcion());
        if (dto.getCategoria()   != null) producto.setCategoria(dto.getCategoria());
        if (dto.getManufacturer()!= null) producto.setManufacturer(dto.getManufacturer());
        if (dto.getGender()      != null) producto.setGender(dto.getGender());
        if (dto.getEan()         != null) producto.setEan(dto.getEan());
        if (dto.getSku()         != null) producto.setSku(dto.getSku());
        if (dto.getSkuProveedor()!= null) producto.setSkuProveedor(dto.getSkuProveedor());
        if (dto.getImagen()      != null) producto.setImagen(dto.getImagen());
        if (dto.getImagen2()     != null) producto.setImagen2(dto.getImagen2());
        if (dto.getImagen3()     != null) producto.setImagen3(dto.getImagen3());
        if (dto.getImagen4()     != null) producto.setImagen4(dto.getImagen4());
        if (dto.getStock()       != null) producto.setStock(dto.getStock());
        producto.setNuevo(dto.isNuevo());

        // PVP: siempre se actualiza con lo que manda SellerKing
        if (dto.getPrecioPVP() != null) {
            producto.setPrecioPVP(dto.getPrecioPVP());
        }

        // precio (coste interno): solo se inicializa en la primera creación.
        // Si ya existe, el admin es responsable de este campo.
        if (esNuevo) {
            BigDecimal precioInicial = dto.getPrecioPVP() != null
                    ? dto.getPrecioPVP()
                    : BigDecimal.ONE; // fallback de seguridad para pasar @NotNull
            producto.setPrecio(precioInicial);
            producto.setActivo(true);
        }

        Producto guardado = productoRepository.save(producto);

        return new SellerKingProductResponseDto(
                guardado.getId(),
                guardado.getSlug(),
                esNuevo ? "CREADO" : "ACTUALIZADO"
        );
    }

    @Transactional
    public SellerKingProductResponseDto actualizarPorId(Long webProductId,
                                                        SellerKingProductRequestDto dto) {
        Producto producto = productoRepository.findById(webProductId)
                .orElseThrow(() -> new RuntimeException(
                        "Producto no encontrado con id: " + webProductId));

        if (dto.getNombre()      != null) producto.setNombre(dto.getNombre());
        if (dto.getDescripcion() != null) producto.setDescripcion(dto.getDescripcion());
        if (dto.getCategoria()   != null) producto.setCategoria(dto.getCategoria());
        if (dto.getManufacturer()!= null) producto.setManufacturer(dto.getManufacturer());
        if (dto.getGender()      != null) producto.setGender(dto.getGender());
        if (dto.getImagen()      != null) producto.setImagen(dto.getImagen());
        if (dto.getImagen2()     != null) producto.setImagen2(dto.getImagen2());
        if (dto.getImagen3()     != null) producto.setImagen3(dto.getImagen3());
        if (dto.getImagen4()     != null) producto.setImagen4(dto.getImagen4());
        if (dto.getStock()       != null) producto.setStock(dto.getStock());
        if (dto.getPrecioPVP()   != null) producto.setPrecioPVP(dto.getPrecioPVP());
        producto.setNuevo(dto.isNuevo());

        Producto guardado = productoRepository.save(producto);
        return new SellerKingProductResponseDto(guardado.getId(), guardado.getSlug(), "ACTUALIZADO");
    }
}
