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

    public ProductSyncScheduler(ProductoBTSService btsService, 
                                ProductoNovaengelService novaService) {
        this.btsService = btsService;
        this.novaService = novaService;
    }

    /**
     * Sincronización diaria a las 02:00 AM
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
    }
}
