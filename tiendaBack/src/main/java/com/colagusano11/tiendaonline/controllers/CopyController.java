package com.colagusano11.tiendaonline.controllers;

import com.colagusano11.tiendaonline.repositories.ProductoRepository;
import com.colagusano11.tiendaonline.services.GeminiCopyService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

/**
 * Endpoints de administración para el motor de copy IA con Gemini.
 *
 * Todos bajo /api/admin/ — proteger con rol ADMIN en SecurityConfig.
 *
 *  POST /api/admin/copy/generar/{id}     → Genera copy para un producto
 *  POST /api/admin/copy/generar-batch    → Genera copy para todos los sin copy (puede tardar)
 *  GET  /api/admin/copy/status           → Estado: cuántos tienen/no tienen copy
 */
@RestController
@RequestMapping("/api/admin/copy")
public class CopyController {

    private final GeminiCopyService geminiCopyService;
    private final ProductoRepository productoRepository;

    public CopyController(GeminiCopyService geminiCopyService,
                          ProductoRepository productoRepository) {
        this.geminiCopyService   = geminiCopyService;
        this.productoRepository  = productoRepository;
    }

    /**
     * Genera (o regenera) el copy SEO + Instagram para un producto concreto.
     * Responde inmediatamente con el copy generado.
     *
     * Ejemplo: POST /api/admin/copy/generar/42
     */
    @PostMapping("/generar/{id}")
    public ResponseEntity<Map<String, String>> generarUno(@PathVariable Long id) {
        Map<String, String> copy = geminiCopyService.generarParaProducto(id);
        return ResponseEntity.ok(copy);
    }

    /**
     * Genera copy en batch para todos los productos activos sin copy.
     * Proceso síncrono con pausa de 1s entre llamadas.
     * Para catálogos grandes (~500 productos) tarda ~10 minutos.
     * Llama a este endpoint desde el panel de admin y espera.
     *
     * Ejemplo: POST /api/admin/copy/generar-batch
     */
    @PostMapping("/generar-batch")
    public ResponseEntity<Map<String, Object>> generarBatch() {
        Map<String, Object> resultado = geminiCopyService.generarBatch();
        return ResponseEntity.ok(resultado);
    }

    /**
     * Estado del motor de copy:
     *   - totalActivos:   productos activos en la tienda
     *   - conCopy:        los que ya tienen titulo_seo generado
     *   - sinCopy:        los que aún no tienen copy (pendientes)
     *   - porcentaje:     progreso del batch
     *
     * Ejemplo: GET /api/admin/copy/status
     */
    @GetMapping("/status")
    public ResponseEntity<Map<String, Object>> status() {
        long totalActivos = productoRepository.countByActivoTrue();
        long conCopy      = productoRepository.countByActivoTrueAndTituloSeoIsNotNull();
        long sinCopy      = totalActivos - conCopy;
        double porcentaje = totalActivos > 0
            ? Math.round((conCopy * 100.0 / totalActivos) * 10) / 10.0
            : 0.0;

        return ResponseEntity.ok(Map.of(
            "totalActivos", totalActivos,
            "conCopy",      conCopy,
            "sinCopy",      sinCopy,
            "porcentaje",   porcentaje
        ));
    }
}
