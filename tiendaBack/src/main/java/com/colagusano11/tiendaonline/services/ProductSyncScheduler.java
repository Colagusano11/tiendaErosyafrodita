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

    public ProductSyncScheduler(ProductoBTSService btsService,
                                ProductoNovaengelService novaService,
                                ProductoService productoService) {
        this.btsService = btsService;
        this.novaService = novaService;
        this.productoService = productoService;
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
