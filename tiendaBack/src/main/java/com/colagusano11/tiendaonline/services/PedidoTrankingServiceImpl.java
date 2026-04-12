package com.colagusano11.tiendaonline.services;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;
import com.colagusano11.tiendaonline.models.Pedido;
import com.colagusano11.tiendaonline.models.PedidoTraking;
import com.colagusano11.tiendaonline.repositories.PedidoTrakingRepository;

@Service
public class PedidoTrankingServiceImpl implements PedidoTrakingService {

    private final PedidoTrakingRepository pedidoTrak;

    public PedidoTrankingServiceImpl(PedidoTrakingRepository pedidoTrak) {
        this.pedidoTrak = pedidoTrak;
    }

    @Override
    public void registrarPago(Pedido pedido) {
        PedidoTraking t = new PedidoTraking();

        // Referencias básicas
        t.setPedidoId(pedido.getId());
        t.setUsuarioId(pedido.getUsuarioId());      // usamos el id, no el DTO

        // Datos del pedido
        t.setFechaPedido(pedido.getFecha());
        t.setPedidoEstado(pedido.getEstado());

        // Si no quieres duplicar datos del usuario, deja país a null o rellénalo desde otro sitio
        t.setPais(null);

        // Productos
        List<String> productos = pedido.getLineas().stream()
                .map(linea -> linea.getProducto().getNombre())
                .toList();
        t.setNombreProducto(String.join(",", productos));

        List<String> skus = pedido.getLineas().stream()
                .map(linea -> linea.getProducto().getSku())
                .toList();
        t.setSku(String.join(",", skus));

        List<String> marcas = pedido.getLineas().stream()
                .map(linea -> linea.getProducto().getManufacturer())
                .toList();
        t.setMarca(String.join(",", marcas));

        // Importes
        t.setImporteConIva(pedido.getTotal());
        t.setImporteSinIva(null);
        t.setEnvioConIva(null);
        t.setEnvioSinIva(null);
        t.setImpuestosTotales(null);

        // Pago
        t.setPasarelaPago("REVOLUT");
        t.setPaymentId(pedido.getPaymentId());
        t.setFechaPago(pedido.getPaymentDate());

        // Registro
        t.setFechaRegistro(LocalDateTime.now());

        pedidoTrak.save(t);
    }
}
