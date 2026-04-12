package com.colagusano11.tiendaonline.services;

import com.colagusano11.tiendaonline.client.dto.UsuarioRegistroDto;
import com.colagusano11.tiendaonline.models.*;
import com.colagusano11.tiendaonline.repositories.CarritoRepository;
import com.colagusano11.tiendaonline.repositories.ProductoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Service
public class CarritoServiceImpl implements CarritoService {

    @Autowired
    private CarritoRepository carritoRepository;

    @Autowired
    private ProductoRepository productoRepository;


    private Long getUserIdOrDefault(UsuarioRegistroDto usuario) {
    // Mientras desarrollas sin login real, usa el usuario 1 cuando venga null.
    if (usuario == null) {
        return 1L;
    }
    return usuario.getId();
}


    @Override
    public Carrito obtenerCarritoUsuario(UsuarioRegistroDto usuario) {
       Long usuarioId = getUserIdOrDefault(usuario);
    return carritoRepository.findByUsuarioId(usuarioId).orElse(null);
    }

    @Override
    public Carrito agregarProductoAlCarrito(UsuarioRegistroDto usuario, Producto producto, int cantidad) {
       Long usuarioId = getUserIdOrDefault(usuario);

        // 1. Buscar carrito del usuario o crear uno nuevo
        Carrito carrito = carritoRepository.findByUsuarioId(usuarioId)
                .orElseGet(() -> {
                    Carrito nuevo = new Carrito(usuarioId);
                    return carritoRepository.save(nuevo);
                });

        // 2. Buscar si el producto ya está en el carrito
        CarritoItem itemExistente = carrito.getItems().stream()
                .filter(item -> item.getProducto().getId().equals(producto.getId()))
                .findFirst()
                .orElse(null);

        if (itemExistente != null) {
            itemExistente.setCantidad(itemExistente.getCantidad() + cantidad);
        } else {
            CarritoItem nuevoItem = new CarritoItem(producto, cantidad);
            carrito.getItems().add(nuevoItem);
        }

        // 3. Guardar carrito y devolverlo actualizado
        return carritoRepository.save(carrito);
    }

    @Override
    public void modificarCantidadProducto(UsuarioRegistroDto usuario, Producto producto, int nuevaCantidad) {
          Long usuarioId = getUserIdOrDefault(usuario);
        Carrito carrito = carritoRepository.findByUsuarioId(usuarioId).orElse(null);
        if (carrito == null) {
            return;
        }

        carrito.getItems().stream()
                .filter(item -> item.getProducto().getId().equals(producto.getId()))
                .findFirst()
                .ifPresent(item -> {
                    if (nuevaCantidad <= 0) {
                        carrito.getItems().remove(item);
                    } else {
                        item.setCantidad(nuevaCantidad);
                    }
                });

        carritoRepository.save(carrito);
    }

    @Override
    public void vaciarCarrito(UsuarioRegistroDto usuario) {
        Long usuarioId = getUserIdOrDefault(usuario);
        Carrito carrito = carritoRepository.findByUsuarioId(usuarioId).orElse(null);
        if (carrito == null) {
            return;
        }
        carrito.getItems().clear(); // orphanRemoval = true borra los CarritoItem
        carritoRepository.save(carrito);
    }

    @Override
    public void eliminarProductoDelCarrito(UsuarioRegistroDto usuario, Producto producto) {
       Long usuarioId = getUserIdOrDefault(usuario);
        Carrito carrito = carritoRepository.findByUsuarioId(usuarioId).orElse(null);
        if (carrito == null) {
            return;
        }

        carrito.getItems().removeIf(item ->
                item.getProducto().getId().equals(producto.getId())
        );

        carritoRepository.save(carrito);
    }

    @Override
    public CarritoSalida mapearCarrito(Carrito carrito) {
        CarritoSalida salida = new CarritoSalida();
        List<CarritoSalidaItem> itemSalida = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;

        for (CarritoItem item : carrito.getItems()) {
            BigDecimal pvp = item.getProducto().getPrecioPVP();
            // Fallback al precio base si por algún motivo no hay PVP
            if (pvp == null || pvp.compareTo(BigDecimal.ZERO) <= 0) {
                pvp = item.getProducto().getPrecio();
            }

            CarritoSalidaItem dto = new CarritoSalidaItem();
            dto.setIdProducto(item.getProducto().getId());
            dto.setNombreProducto(item.getProducto().getNombre());
            dto.setImagen(item.getProducto().getImagen());
            dto.setPrecioUnitario(pvp);
            dto.setCantidad(item.getCantidad());

            BigDecimal subtotal = pvp.multiply(BigDecimal.valueOf(item.getCantidad()));
            dto.setSubtotal(subtotal);
            total = total.add(subtotal);
            itemSalida.add(dto);
        }

        salida.setItems(itemSalida);
        salida.setTotal(total);
        return salida;
    }
}
