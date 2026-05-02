package com.colagusano11.tiendaonline.controllers;

import com.colagusano11.tiendaonline.models.Pedido;
import com.colagusano11.tiendaonline.models.PedidoEstado;
import com.colagusano11.tiendaonline.models.PedidoProducto;
import com.colagusano11.tiendaonline.services.PedidoServicie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/admin/dashboard")
public class DashboardController {

    private final PedidoServicie pedidoService;

    public DashboardController(PedidoServicie pedidoService) {
        this.pedidoService = pedidoService;
    }

    @GetMapping("/stats")
    public ResponseEntity<?> getDashboardStats() {
        List<Pedido> allPedidos = pedidoService.findAll();
        
        // Filtramos pedidos cancelados para la contabilidad real
        List<Pedido> pedidosValidos = allPedidos.stream()
                .filter(p -> p.getEstado() != PedidoEstado.CANCELADO)
                .collect(Collectors.toList());

        // 1. Ventas Totales (PVP Web)
        BigDecimal totalVentas = pedidosValidos.stream()
                .map(Pedido::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 2. Coste Total (Lo que pagamos a proveedores)
        BigDecimal totalCoste = pedidosValidos.stream()
                .flatMap(p -> p.getLineas().stream())
                .map(pp -> {
                    BigDecimal coste = pp.getPrecioPVP(); // En PedidoProducto, precioPVP suele ser el coste del proveedor
                    return (coste != null ? coste : BigDecimal.ZERO).multiply(new BigDecimal(pp.getCantidad()));
                })
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 3. Beneficio Neto
        BigDecimal beneficioNeto = totalVentas.subtract(totalCoste);

        // 4. Pedidos por Estado
        Map<PedidoEstado, Long> pedidosPorEstado = allPedidos.stream()
                .collect(Collectors.groupingBy(Pedido::getEstado, Collectors.counting()));

        // 5. Ventas por Día (Últimos 30 días)
        LocalDateTime hace30Dias = LocalDateTime.now().minusDays(30);
        Map<String, BigDecimal> ventasPorDia = pedidosValidos.stream()
                .filter(p -> p.getFecha().isAfter(hace30Dias))
                .collect(Collectors.groupingBy(
                        p -> p.getFecha().toLocalDate().toString(),
                        Collectors.mapping(Pedido::getTotal, Collectors.reducing(BigDecimal.ZERO, BigDecimal::add))
                ));

        // 6. Beneficio por Día (Últimos 30 días)
        Map<String, BigDecimal> beneficioPorDia = pedidosValidos.stream()
                .filter(p -> p.getFecha().isAfter(hace30Dias))
                .collect(Collectors.groupingBy(
                        p -> p.getFecha().toLocalDate().toString(),
                        Collectors.mapping(p -> {
                            BigDecimal coste = p.getLineas().stream()
                                    .map(pp -> (pp.getPrecioPVP() != null ? pp.getPrecioPVP() : BigDecimal.ZERO).multiply(new BigDecimal(pp.getCantidad())))
                                    .reduce(BigDecimal.ZERO, BigDecimal::add);
                            return p.getTotal().subtract(coste);
                        }, Collectors.reducing(BigDecimal.ZERO, BigDecimal::add))
                ));

        // 7. Preparar Respuesta
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalVentas", totalVentas);
        stats.put("totalCoste", totalCoste);
        stats.put("beneficioNeto", beneficioNeto);
        stats.put("totalPedidos", allPedidos.size());
        stats.put("pedidosValidos", pedidosValidos.size());
        stats.put("pedidosPorEstado", pedidosPorEstado);
        stats.put("ventasPorDia", ventasPorDia);
        stats.put("beneficioPorDia", beneficioPorDia);
        
        // Margen medio
        if (totalVentas.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal margen = beneficioNeto.divide(totalVentas, 4, BigDecimal.ROUND_HALF_UP)
                    .multiply(new BigDecimal("100"));
            stats.put("margenMedio", margen);
        } else {
            stats.put("margenMedio", BigDecimal.ZERO);
        }

        return ResponseEntity.ok(stats);
    }
}
