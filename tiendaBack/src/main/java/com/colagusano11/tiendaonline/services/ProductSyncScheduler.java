package com.colagusano11.tiendaonline.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
public class ProductSyncScheduler {

    private static final Logger log = LoggerFactory.getLogger(ProductSyncScheduler.class);

    private final ProductoBTSService btsService;
    private final ProductoNovaengelService novaService;
    private final ProductoService productoService;
    private final IdealoService idealoService;
    private final com.colagusano11.tiendaonline.repositories.PedidoRepository pedidoRepository;
    private final PedidoServicie pedidoService;

    public ProductSyncScheduler(ProductoBTSService btsService,
                                ProductoNovaengelService novaService,
                                ProductoService productoService,
                                IdealoService idealoService,
                                com.colagusano11.tiendaonline.repositories.PedidoRepository pedidoRepository,
                                PedidoServicie pedidoService) {
        this.btsService = btsService;
        this.novaService = novaService;
        this.productoService = productoService;
        this.idealoService = idealoService;
        this.pedidoRepository = pedidoRepository;
        this.pedidoService = pedidoService;
    }

    /**
     * Sincronización automática con Idealo cada 4 horas
     */
    @Scheduled(cron = "0 0 */4 * * ?", zone = "Europe/Madrid")
    public void idealoAutoSync() {
        log.info("🌐 Iniciando sincronización automática con Idealo");
        try {
            idealoService.syncAllProducts();
        } catch (Exception e) {
            log.error("❌ Error en idealoAutoSync: {}", e.getMessage());
        }
    }

    /**
     * Sincronización de tracking de pedidos activos cada hora
     */
    @Scheduled(cron = "0 30 * * * ?", zone = "Europe/Madrid")
    public void ordersTrackingSync() {
        log.info("📦 Iniciando sincronización automática de tracking de pedidos");
        try {
            List<com.colagusano11.tiendaonline.models.PedidoEstado> estadosActivos = List.of(
                com.colagusano11.tiendaonline.models.PedidoEstado.PAGADO,
                com.colagusano11.tiendaonline.models.PedidoEstado.RECIBIDO,
                com.colagusano11.tiendaonline.models.PedidoEstado.ENVIADO
            );
            List<com.colagusano11.tiendaonline.models.Pedido> pedidos = pedidoRepository.findByEstadoIn(estadosActivos);
            
            for (com.colagusano11.tiendaonline.models.Pedido p : pedidos) {
                if (p.getPedidoProveedorId() != null) {
                    pedidoService.syncTrackingConProveedor(p.getId());
                }
            }
        } catch (Exception e) {
            log.error("❌ Error en ordersTrackingSync: {}", e.getMessage());
        }
    }

    /**
     * Actualización de stock cada hora de 07:00 a 23:00
     */
    @Scheduled(cron = "0 0 7-23 * * ?", zone = "Europe/Madrid")
    public void hourlyStockSync() {
        log.info("🕐 Iniciando sincronización horaria de stock");

        try {
            btsService.syncStockBts();
        } catch (Exception e) {
            log.error("❌ Error en sync stock BTS: {}", e.getMessage());
        }

        try {
            novaService.syncStockNova();
        } catch (Exception e) {
            log.error("❌ Error en sync stock Novaengel: {}", e.getMessage());
        }

        log.info("✅ Sincronización horaria de stock finalizada");
    }

    /**
     * Volcado completo diario a las 02:00 AM (nuevos productos + datos completos)
     */
    @Scheduled(cron = "0 0 2 * * ?", zone = "Europe/Madrid")
    public void dailySync() {
        log.info("⏰ Iniciando sincronización diaria programada de productos");

        try {
            btsService.importProductsBts();
            log.info("✅ Sincronización BTS completada");
        } catch (Exception e) {
            log.error("❌ Error en sincronización programada BTS: {}", e.getMessage());
        }

        try {
            novaService.importProductsNova();
            log.info("✅ Sincronización Novaengel completada");
        } catch (Exception e) {
            log.error("❌ Error en sincronización programada Novaengel: {}", e.getMessage());
        }

        try {
            java.util.Map<String, Integer> result = productoService.normalizeAllGenders();
            log.info("✅ Género normalizado — HOMBRE: {}, MUJER: {}, UNISEX: {}, vaciados: {}",
                    result.get("HOMBRE"), result.get("MUJER"), result.get("UNISEX"), result.get("VACIADOS"));
        } catch (Exception e) {
            log.error("❌ Error normalizando géneros: {}", e.getMessage());
        }
    }
}
