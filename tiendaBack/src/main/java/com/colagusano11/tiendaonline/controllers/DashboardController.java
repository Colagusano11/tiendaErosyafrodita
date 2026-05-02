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
import java.math.RoundingMode;
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

        // 1. Ventas Totales (Ingreso Bruto)
        BigDecimal totalVentas = pedidosValidos.stream()
                .map(Pedido::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        // 2. Desglose Contable
        BigDecimal totalCosteProducto = BigDecimal.ZERO;
        BigDecimal totalComisiones = BigDecimal.ZERO;
        BigDecimal totalEnvios = BigDecimal.ZERO;
        BigDecimal totalImpuestos = BigDecimal.ZERO;

        for (Pedido p : pedidosValidos) {
            // Coste del producto
            BigDecimal costePedido = p.getLineas().stream()
                    .map(pp -> (pp.getPrecioPVP() != null ? pp.getPrecioPVP() : BigDecimal.ZERO).multiply(new BigDecimal(pp.getCantidad())))
                    .reduce(BigDecimal.ZERO, BigDecimal::add);
            totalCosteProducto = totalCosteProducto.add(costePedido);

            // Cálculo de Comisiones (Estimado si es 0)
            BigDecimal comision = p.getComisionPasarela();
            if (comision == null || comision.compareTo(BigDecimal.ZERO) == 0) {
                if ("paypal".equalsIgnoreCase(p.getPaymentGateway())) {
                    comision = p.getTotal().multiply(new BigDecimal("0.034")).add(new BigDecimal("0.35"));
                } else {
                    // Revolut / Tarjeta estimación
                    comision = p.getTotal().multiply(new BigDecimal("0.012")).add(new BigDecimal("0.25"));
                }
            }
            totalComisiones = totalComisiones.add(comision);

            // Gastos de Envío (Estimado si es 0)
            BigDecimal envio = p.getGastosEnvio();
            if (envio == null || envio.compareTo(BigDecimal.ZERO) == 0) {
                envio = new BigDecimal("5.50"); // Estimación estándar
            }
            totalEnvios = totalEnvios.add(envio);

            // Impuestos (IVA 21% incluido en el total)
            // IVA = Total - (Total / 1.21)
            BigDecimal baseImponible = p.getTotal().divide(new BigDecimal("1.21"), 4, RoundingMode.HALF_UP);
            BigDecimal iva = p.getTotal().subtract(baseImponible);
            totalImpuestos = totalImpuestos.add(iva);
        }

        // 3. Beneficio Neto Real
        // Neto = Ventas - Coste Producto - Comisiones - Envios - Impuestos
        BigDecimal beneficioNetoReal = totalVentas
                .subtract(totalCosteProducto)
                .subtract(totalComisiones)
                .subtract(totalEnvios)
                .subtract(totalImpuestos);

        // 4. Preparar Respuesta
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalVentas", totalVentas);
        stats.put("totalCoste", totalCosteProducto);
        stats.put("totalComisiones", totalComisiones.setScale(2, RoundingMode.HALF_UP));
        stats.put("totalEnvios", totalEnvios.setScale(2, RoundingMode.HALF_UP));
        stats.put("totalImpuestos", totalImpuestos.setScale(2, RoundingMode.HALF_UP));
        stats.put("beneficioNeto", beneficioNetoReal.setScale(2, RoundingMode.HALF_UP));
        
        stats.put("totalPedidos", allPedidos.size());
        stats.put("pedidosValidos", pedidosValidos.size());
        
        // Ventas por Día (Últimos 30 días)
        LocalDateTime hace30Dias = LocalDateTime.now().minusDays(30);
        Map<String, BigDecimal> ventasPorDia = pedidosValidos.stream()
                .filter(p -> p.getFecha().isAfter(hace30Dias))
                .collect(Collectors.groupingBy(
                        p -> p.getFecha().toLocalDate().toString(),
                        Collectors.mapping(Pedido::getTotal, Collectors.reducing(BigDecimal.ZERO, BigDecimal::add))
                ));
        stats.put("ventasPorDia", ventasPorDia);

        // Margen Neto Medio %
        if (totalVentas.compareTo(BigDecimal.ZERO) > 0) {
            BigDecimal margen = beneficioNetoReal.divide(totalVentas, 4, RoundingMode.HALF_UP)
                    .multiply(new BigDecimal("100"));
            stats.put("margenMedio", margen.setScale(2, RoundingMode.HALF_UP));
        } else {
            stats.put("margenMedio", BigDecimal.ZERO);
        }

        return ResponseEntity.ok(stats);
    }
}
