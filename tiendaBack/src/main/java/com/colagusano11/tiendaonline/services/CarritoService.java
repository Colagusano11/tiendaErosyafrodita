package com.colagusano11.tiendaonline.services;

import com.colagusano11.tiendaonline.models.Carrito;

import com.colagusano11.tiendaonline.models.CarritoSalida;
import com.colagusano11.tiendaonline.models.Producto;
import com.colagusano11.tiendaonline.client.dto.UsuarioRegistroDto;


import java.util.List;

public interface CarritoService {

    Carrito obtenerCarritoUsuario(UsuarioRegistroDto usuario);
    Carrito agregarProductoAlCarrito(UsuarioRegistroDto usuario, Producto producto, int cantidad);
    void modificarCantidadProducto(UsuarioRegistroDto usuario, Producto producto, int nuevaCantidad);
    void eliminarProductoDelCarrito(UsuarioRegistroDto usuario, Producto producto);
    void vaciarCarrito(UsuarioRegistroDto usuario);
    CarritoSalida mapearCarrito(Carrito carrito);

}


