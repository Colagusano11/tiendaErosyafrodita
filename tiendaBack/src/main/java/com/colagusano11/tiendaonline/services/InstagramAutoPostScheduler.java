package com.colagusano11.tiendaonline.services;

import com.colagusano11.tiendaonline.models.Producto;
import com.colagusano11.tiendaonline.repositories.ProductoRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Map;
import java.util.Optional;

/**
 * Publica en Instagram, sin intervención manual, rotando por el catálogo.
 *
 * Cada vez que corre elige UN producto: activo, con stock, y el que lleve
 * más tiempo sin publicarse (o nunca) — así con el tiempo pasa por todo el
 * catálogo en vez de repetir siempre los mismos. Reutiliza el copy ya
 * generado por GeminiCopyService (título/descripción/copy de Instagram
 * guardados en el propio producto); si un producto no tiene copy todavía,
 * lo genera al vuelo antes de publicar.
 *
 * Si falla (sin imagen, sin copy tras generar, error de la API de Meta),
 * avisa por email al admin en vez de fallar en silencio — mismo patrón que
 * InstagramTokenScheduler.
 *
 * Configurar en application.properties:
 *   instagram.autopost.enabled = true|false (apagar sin tocar código)
 *   instagram.autopost.cron    = cron de Spring (por defecto: Lun/Mié/Vie 11:00)
 */
@Service
public class InstagramAutoPostScheduler {

    private static final Logger log = LoggerFactory.getLogger(InstagramAutoPostScheduler.class);

    @Value("${instagram.autopost.enabled:true}")
    private boolean enabled;

    @Value("${instagram.admin.email:admin@erosyafrodita.com}")
    private String adminEmail;

    private final ProductoRepository productoRepository;
    private final GeminiCopyService geminiCopyService;
    private final InstagramService instagramService;
    private final EmailService emailService;

    public InstagramAutoPostScheduler(
            ProductoRepository productoRepository,
            GeminiCopyService geminiCopyService,
            InstagramService instagramService,
            EmailService emailService) {
        this.productoRepository = productoRepository;
        this.geminiCopyService  = geminiCopyService;
        this.instagramService   = instagramService;
        this.emailService       = emailService;
    }

    @Scheduled(cron = "${instagram.autopost.cron:0 0 11 * * MON,WED,FRI}")
    public void publicarSiguienteProducto() {
        if (!enabled) {
            log.debug("[InstagramAutoPost] Desactivado por configuración (instagram.autopost.enabled=false).");
            return;
        }

        Optional<Producto> candidato = productoRepository
                .findTopByActivoTrueAndStockGreaterThanOrderByUltimaPublicacionInstagramAscIdAsc(0);

        if (candidato.isEmpty()) {
            log.info("[InstagramAutoPost] No hay ningún producto activo con stock para publicar.");
            return;
        }

        Producto producto = candidato.get();

        try {
            String imagen = producto.getImagen();
            if (imagen == null || imagen.isBlank()) {
                throw new IllegalStateException("El producto no tiene imagen principal.");
            }

            String caption = producto.getCopyInstagram();
            if (caption == null || caption.isBlank()) {
                log.info("[InstagramAutoPost] Producto id={} sin copy todavía, generándolo con Gemini...", producto.getId());
                geminiCopyService.generarParaProducto(producto.getId());
                producto = productoRepository.findById(producto.getId())
                        .orElseThrow(() -> new IllegalStateException("El producto desapareció mientras se generaba el copy."));
                caption = producto.getCopyInstagram();
            }
            if (caption == null || caption.isBlank()) {
                throw new IllegalStateException("No se pudo obtener un copy de Instagram válido tras generarlo.");
            }

            Map<String, String> resultado = instagramService.publicar(imagen, caption)
                    .block(Duration.ofSeconds(30));

            if (resultado == null || resultado.containsKey("error")) {
                throw new RuntimeException("La API de Instagram devolvió error: " + resultado);
            }

            producto.setUltimaPublicacionInstagram(LocalDateTime.now());
            productoRepository.save(producto);

            log.info("[InstagramAutoPost] Publicado '{}' (id={}) -> {}",
                    producto.getNombre(), producto.getId(), resultado.get("url"));

        } catch (Exception e) {
            log.error("[InstagramAutoPost] Error publicando producto id={}: {}",
                    producto.getId(), e.getMessage(), e);
            avisarFallo(producto, e.getMessage());
        }
    }

    private void avisarFallo(Producto producto, String motivo) {
        try {
            emailService.enviarEmailGenerico(
                    adminEmail,
                    "[AGE Parfums] Fallo en la publicación automática de Instagram",
                    "No se pudo publicar automáticamente el producto '" + producto.getNombre()
                            + "' (id=" + producto.getId() + "). Motivo: " + motivo
                            + ". El siguiente intento programado elegirá el mismo producto (no se marcó "
                            + "como publicado), o revísalo manualmente en /api/admin/marketing/instagram/publish."
            );
        } catch (Exception emailEx) {
            log.error("[InstagramAutoPost] No se pudo enviar el email de alerta: {}", emailEx.getMessage());
        }
    }
}
