package com.colagusano11.tiendaonline.mappers;

import com.colagusano11.tiendaonline.models.Pedido;
import com.colagusano11.tiendaonline.models.PedidoProducto;
import com.colagusano11.tiendaonline.models.PedidoProductoSalida;
import com.colagusano11.tiendaonline.models.PedidoSalida;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;

@Component
public class PedidoMapper {

    public PedidoSalida toSalida(Pedido pedido) {
        if (pedido == null) {
            return null;
        }

        PedidoSalida salida = new PedidoSalida();
        // campos de cabecera
        salida.setIdPedido(pedido.getId());
        salida.setFechaCreacion(pedido.getFecha());
        salida.setTotal(pedido.getTotal());
        salida.setEstado(pedido.getEstado());
        
        // Mapeo detallado de envío
        salida.setNombre(pedido.getNombre());
        salida.setApellidos(pedido.getApellidos());
        salida.setCalle(pedido.getCalle());
        salida.setCiudad(pedido.getCiudad());
        salida.setCodigoPostal(pedido.getCodigoPostal());
        salida.setProvincia(pedido.getProvincia());
        salida.setTelefono(pedido.getTelefono());
        salida.setPais(pedido.getPais());

        salida.setNumSeguimiento(pedido.getNumSeguimiento());
        salida.setUrlSeguimiento(pedido.getUrlSeguimiento());
        salida.setPedidoProveedorId(pedido.getPedidoProveedorId());
        salida.setEstadoProveedor(pedido.getEstadoProveedor());
        salida.setPaymentId(pedido.getPaymentId());
        salida.setEmail(pedido.getEmail());

        // líneas
        List<PedidoProductoSalida> productosSalida = new ArrayList<>();
        if (pedido.getLineas() != null) {
            for (PedidoProducto linea : pedido.getLineas()) {
                productosSalida.add(toProductoSalida(linea));
            }
        }
        salida.setProductos(productosSalida);

        return salida;
    }

    private PedidoProductoSalida toProductoSalida(PedidoProducto linea) {
        PedidoProductoSalida dto = new PedidoProductoSalida();

        // id del producto (si existe)
        if (linea.getProducto() != null) {
            dto.setIdProducto(linea.getProducto().getId());
            dto.setImagen(linea.getProducto().getImagen());
        }

        dto.setNombreProducto(linea.getNombreProducto());
        dto.setSku(linea.getSku());
        dto.setEan(linea.getEan());
        dto.setPrecioUnitario(linea.getPrecioUnitario());
        dto.setCantidad(linea.getCantidad());
        dto.setPrecioTotalLinea(linea.getPrecioTotalLinea());
        dto.setPrecioPVP(linea.getPrecioPVP());
        dto.setDistribuidor(linea.getDistribuidor());

        return dto;
    }
}
