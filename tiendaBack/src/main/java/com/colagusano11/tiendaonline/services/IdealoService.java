package com.colagusano11.tiendaonline.services;

import com.colagusano11.tiendaonline.models.Producto;
import com.colagusano11.tiendaonline.repositories.ProductoRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.*;

@Service
public class IdealoService {

    private static final Logger log = LoggerFactory.getLogger(IdealoService.class);

    @Value("${IDEALO_CLIENT_ID:}")
    private String clientId;

    @Value("${IDEALO_CLIENT_SECRET:}")
    private String clientSecret;

    @Value("${IDEALO_SHOP_ID:}")
    private String shopId;

    private static final String AUTH_URL = "https://api.idealo.com/mer/businessaccount/api/v1/oauth/token";
    private static final String API_BASE_URL = "https://import.idealo.com";

    private String accessToken;
    private long tokenExpiry = 0;

    private final ProductoRepository productoRepository;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();

    public IdealoService(ProductoRepository productoRepository) {
        this.productoRepository = productoRepository;
    }

    public void syncAllProducts() {
        log.info("🚀 Iniciando sincronización masiva con Idealo...");
        List<Producto> activos = productoRepository.findByActivoTrue();
        
        int success = 0;
        int errors = 0;

        for (Producto p : activos) {
            try {
                if (p.getEan() == null || p.getEan().length() < 8) continue;
                
                Map<String, Object> offer = new HashMap<>();
                offer.put("sku", p.getSku());
                offer.put("ean", p.getEan());
                offer.put("brand", p.getManufacturer());
                offer.put("title", p.getNombre());
                offer.put("categoryPath", List.of(p.getCategoria() != null ? p.getCategoria() : "Belleza"));
                offer.put("url", "https://erosyafrodita.com/producto/" + p.getSlug());
                offer.put("imageUrls", List.of(p.getImagen()));
                
                // Lógica de precio (PVP o Oferta)
                BigDecimal precioFinal = (p.getEnOferta() != null && p.getEnOferta() && p.getPrecioOferta() != null) 
                                         ? p.getPrecioOferta() : p.getPrecioPVP();
                
                if (precioFinal == null || precioFinal.compareTo(BigDecimal.ZERO) <= 0) continue;

                offer.put("price", precioFinal.toString());
                offer.put("currency", "EUR");
                offer.put("deliveryTime", "2-3 días");
                offer.put("shippingCosts", Map.of("DPD", "0.00"));
                offer.put("fulfillmentType", "MERCHANT");
                offer.put("checkoutState", "PAYMENT_AFTER_CHECKOUT");

                sendToIdealo(p.getSku(), offer);
                success++;
            } catch (Exception e) {
                errors++;
                log.error("❌ Error sincronizando SKU {}: {}", p.getSku(), e.getMessage());
            }
        }
        log.info("✅ Sincronización finalizada. Éxito: {}, Errores: {}", success, errors);
    }

    private void sendToIdealo(String sku, Map<String, Object> offerData) throws Exception {
        String token = getAccessToken();
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<String> entity = new HttpEntity<>(objectMapper.writeValueAsString(offerData), headers);
        String url = API_BASE_URL + "/shop/" + shopId + "/offer/" + sku;

        restTemplate.exchange(url, HttpMethod.PUT, entity, String.class);
    }

    private synchronized String getAccessToken() {
        if (accessToken != null && System.currentTimeMillis() < tokenExpiry) {
            return accessToken;
        }

        HttpHeaders headers = new HttpHeaders();
        String auth = clientId + ":" + clientSecret;
        String encodedAuth = Base64.getEncoder().encodeToString(auth.getBytes());
        headers.set("Authorization", "Basic " + encodedAuth);
        headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);

        HttpEntity<String> entity = new HttpEntity<>("grant_type=client_credentials", headers);

        ResponseEntity<Map> response = restTemplate.exchange(AUTH_URL, HttpMethod.POST, entity, Map.class);
        if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
            Map<String, Object> body = response.getBody();
            accessToken = (String) body.get("access_token");
            Integer expiresIn = (Integer) body.get("expires_in");
            tokenExpiry = System.currentTimeMillis() + ((expiresIn != null ? expiresIn : 3600) - 60) * 1000;
            return accessToken;
        }
        throw new RuntimeException("No se pudo obtener el token de Idealo");
    }
}
