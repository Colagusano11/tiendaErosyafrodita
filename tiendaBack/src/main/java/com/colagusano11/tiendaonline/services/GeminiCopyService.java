package com.colagusano11.tiendaonline.services;

import com.colagusano11.tiendaonline.models.Producto;
import com.colagusano11.tiendaonline.repositories.ProductoRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.reactive.function.client.WebClient;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * Genera copy SEO y posts de Instagram para cada producto usando Gemini 1.5 Pro.
 *
 * Variables de entorno requeridas:
 *   GEMINI_API_KEY  — tu clave de Google AI Studio
 *
 * Endpoints del controlador:
 *   POST /api/admin/copy/generar/{id}    — genera copy para un producto
 *   POST /api/admin/copy/generar-batch   — genera copy para todos los sin copy
 *   GET  /api/admin/copy/status          — cuántos productos tienen/no tienen copy
 */
@Service
public class GeminiCopyService {

    private static final Logger log = LoggerFactory.getLogger(GeminiCopyService.class);

    private static final String GEMINI_API_URL =
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent";

    @Value("${GEMINI_API_KEY:}")
    private String apiKey;

    private final ProductoRepository productoRepository;
    private final ObjectMapper        objectMapper = new ObjectMapper();
    private final WebClient           webClient    = WebClient.builder().build();

    public GeminiCopyService(ProductoRepository productoRepository) {
        this.productoRepository = productoRepository;
    }

    // ────────────────────────────────────────────────────────────────
    // PÚBLICO: genera copy para UN producto por id
    // ────────────────────────────────────────────────────────────────
    public Map<String, String> generarParaProducto(Long productoId) {
        Producto p = productoRepository.findById(productoId)
            .orElseThrow(() -> new IllegalArgumentException("Producto no encontrado: " + productoId));
        return generarYGuardar(p);
    }

    // ────────────────────────────────────────────────────────────────
    // BATCH: genera copy para todos los productos que aún no lo tienen
    // Devuelve stats: total procesados, OK, errores
    // ────────────────────────────────────────────────────────────────
    public Map<String, Object> generarBatch() {
        // Solo los que nunca han tenido copy generado
        List<Producto> sinCopy = productoRepository.findByActivoTrueAndCopyGeneradoEnIsNull();
        log.info("[GeminiCopy] Batch: {} productos sin copy", sinCopy.size());

        AtomicInteger ok     = new AtomicInteger(0);
        AtomicInteger errors = new AtomicInteger(0);

        for (Producto p : sinCopy) {
            try {
                generarYGuardar(p);
                ok.incrementAndGet();
                // Pausa de 1s entre llamadas para respetar rate-limits de la API
                Thread.sleep(1000);
            } catch (Exception e) {
                errors.incrementAndGet();
                log.error("[GeminiCopy] Error en SKU {}: {}", p.getSku(), e.getMessage());
            }
        }

        return Map.of(
            "total",   sinCopy.size(),
            "ok",      ok.get(),
            "errores", errors.get()
        );
    }

    // ────────────────────────────────────────────────────────────────
    // CORE: llama a Gemini, parsea el JSON y guarda en BD
    // ────────────────────────────────────────────────────────────────
    private Map<String, String> generarYGuardar(Producto p) {
        if (apiKey == null || apiKey.isBlank()) {
            throw new IllegalStateException("GEMINI_API_KEY no configurada");
        }

        String prompt = construirPrompt(p);
        String respuestaJson = llamarGemini(prompt);
        Map<String, String> copy = parsearCopy(respuestaJson);

        // Guardar en BD sin pasar por @PrePersist (usamos save directo)
        p.setTituloSeo(copy.get("titulo_seo"));
        p.setDescripcionSeo(copy.get("descripcion_seo"));
        p.setCopyInstagram(copy.get("copy_instagram"));
        p.setCopyGeneradoEn(LocalDateTime.now());
        productoRepository.save(p);

        log.info("[GeminiCopy] Copy generado para: {} (id={})", p.getNombre(), p.getId());
        return copy;
    }

    // ────────────────────────────────────────────────────────────────
    // PROMPT especializado en perfumería española con tono Eros & Afrodita
    // ────────────────────────────────────────────────────────────────
    private String construirPrompt(Producto p) {
        BigDecimal precioFinal = (p.isEnOferta() && p.getPrecioOferta() != null)
            ? p.getPrecioOferta() : p.getPrecioPVP();
        String precio = precioFinal != null ? precioFinal.toPlainString() + "€" : "precio exclusivo";

        return """
            Eres el redactor de Eros y Afrodita, una boutique española de perfumes de lujo.
            El tono es elegante, evocador y sensorial, con referencias mitológicas sutiles.
            Escribe SIEMPRE en español de España.

            Producto:
              Nombre:    %s
              Marca:     %s
              Género:    %s
              Categoría: %s
              Precio:    %s
              EAN:       %s

            Genera un JSON válido (sin markdown, sin bloques de código) con exactamente estas 3 claves:

            1. "titulo_seo"
               - Máx 60 caracteres
               - Incluye marca + nombre + ml si aparece en el nombre
               - Termina con " | Eros y Afrodita"
               - Optimizado para búsqueda en Google España
               - Ejemplo: "Hugo Boss Bottled EDT 100ml | Eros y Afrodita"

            2. "descripcion_seo"
               - Entre 120 y 155 caracteres
               - Evocadora y sensorial, con 1-2 adjetivos potentes
               - Incluye el precio y menciona envío gratis
               - Sin hashtags
               - Ejemplo: "Descubre Hugo Boss Bottled, la fragancia cítrica que define al hombre moderno. Desde 42.90€ con envío gratis."

            3. "copy_instagram"
               - Entre 150 y 280 caracteres
               - Tono poético, con 2-3 emojis bien colocados
               - Termina con 4-6 hashtags relevantes en español
               - Incluye una llamada a la acción ("Encuéntralo en nuestra web", "Disponible ahora", etc.)
               - Ejemplo: "Una brisa cítrica que despierta los sentidos... 🍋 Hugo Boss Bottled es la fragancia del hombre que deja huella. Disponible en erosyafrodita.com 💫 #perfumes #hugoboss #fragancia #lujo #erosyafrodita"

            Devuelve SOLO el JSON. Sin texto adicional. Sin bloques ```json. Solo el objeto JSON.
            """.formatted(
                p.getNombre(),
                p.getManufacturer() != null ? p.getManufacturer() : "Sin marca",
                p.getGender()       != null ? p.getGender()       : "Unisex",
                p.getCategoria()    != null ? p.getCategoria()    : "Perfumes",
                precio,
                p.getEan()          != null ? p.getEan()          : "N/A"
            );
    }

    // ────────────────────────────────────────────────────────────────
    // Llamada HTTP a la API de Gemini
    // ────────────────────────────────────────────────────────────────
    private String llamarGemini(String prompt) {
        // Cuerpo de la petición según la API de Gemini 1.5
        Map<String, Object> requestBody = Map.of(
            "contents", List.of(
                Map.of("parts", List.of(
                    Map.of("text", prompt)
                ))
            ),
            "generationConfig", Map.of(
                "temperature",     0.7,
                "maxOutputTokens", 512,
                "responseMimeType", "application/json"  // fuerza respuesta JSON
            )
        );

        String responseBody = webClient.post()
            .uri(GEMINI_API_URL + "?key=" + apiKey)
            .header("Content-Type", "application/json")
            .bodyValue(requestBody)
            .retrieve()
            .bodyToMono(String.class)
            .block();

        if (responseBody == null || responseBody.isBlank()) {
            throw new RuntimeException("Gemini devolvió respuesta vacía");
        }

        try {
            // Estructura de respuesta: candidates[0].content.parts[0].text
            JsonNode root = objectMapper.readTree(responseBody);
            return root.path("candidates").get(0)
                       .path("content").path("parts").get(0)
                       .path("text").asText();
        } catch (Exception e) {
            throw new RuntimeException("Error parseando respuesta de Gemini: " + responseBody, e);
        }
    }

    // ────────────────────────────────────────────────────────────────
    // Parsea el JSON que devuelve Gemini y extrae las 3 claves
    // ────────────────────────────────────────────────────────────────
    @SuppressWarnings("unchecked")
    private Map<String, String> parsearCopy(String jsonText) {
        try {
            // Limpieza defensiva por si Gemini añade comillas o bloques de código
            String clean = jsonText.strip();
            if (clean.startsWith("```")) {
                clean = clean.replaceAll("^```[a-z]*\\n?", "").replaceAll("```$", "").strip();
            }
            Map<String, String> copy = objectMapper.readValue(clean, Map.class);

            // Validación: las 3 claves deben existir
            if (!copy.containsKey("titulo_seo") || !copy.containsKey("descripcion_seo") || !copy.containsKey("copy_instagram")) {
                throw new RuntimeException("El JSON de Gemini no contiene todas las claves esperadas: " + jsonText);
            }
            return copy;
        } catch (Exception e) {
            throw new RuntimeException("No se pudo parsear el JSON de Gemini: " + jsonText, e);
        }
    }
}
