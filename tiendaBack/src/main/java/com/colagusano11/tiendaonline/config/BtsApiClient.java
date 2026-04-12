package com.colagusano11.tiendaonline.config;

import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;

import org.springframework.stereotype.Component;

@Component
public class BtsApiClient {

    private final String jwt;
    private static final String BASE_URL = "https://api.btswholesaler.com/v1/api";

    private final HttpClient httpClient = HttpClient.newBuilder()
            .version(HttpClient.Version.HTTP_1_1)
            .connectTimeout(Duration.ofSeconds(15))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();

    public BtsApiClient(String jwt) {
        this.jwt = jwt;
    }

    public String getProductStock(List<String> skus) throws Exception {
        StringBuilder params = new StringBuilder();
        for (String sku : skus) {
            if (params.length() > 0)
                params.append("&");
            params.append("product_sku[]=").append(URLEncoder.encode(sku, StandardCharsets.UTF_8));
        }

        String url = BASE_URL + "/getProductStock?" + params;

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Authorization", "Bearer " + jwt)
                .header("User-Agent", "ErosAfrodita/1.0")
                .GET()
                .timeout(Duration.ofSeconds(30))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() / 100 != 2) {
            throw new RuntimeException("BTS HTTP " + response.statusCode() + ": " + response.body());
        }
        return response.body();
    }

    public String getProductsPage(int page, int pageSize) throws Exception {
        String url = String.format(
                BASE_URL + "/getListProducts?page=%d&page_size=%d&language_code=es-ES",
                page, pageSize);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Authorization", "Bearer " + jwt)
                .header("User-Agent", "ErosAfrodita/1.0")
                .GET()
                .timeout(Duration.ofSeconds(30))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() / 100 != 2) {
            throw new RuntimeException("BTS HTTP " + response.statusCode() + ": " + response.body());
        }
        return response.body();
    }

    public String createOrder(String formData) throws Exception {
        String url = BASE_URL + "/createOrder";

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Authorization", "Bearer " + jwt)
                .header("Content-Type", "application/x-www-form-urlencoded")
                .header("User-Agent", "ErosAfrodita/1.0")
                .POST(HttpRequest.BodyPublishers.ofString(formData, StandardCharsets.UTF_8))
                .timeout(Duration.ofSeconds(60))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() / 100 != 2) {
            throw new RuntimeException("BTS Error al crear pedido: " + response.statusCode() + " - " + response.body());
        }
        return response.body();
    }

    public String getShippingPrices(String queryString) throws Exception {
        String url = BASE_URL + "/getShippingPrices?" + queryString;

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Authorization", "Bearer " + jwt)
                .header("User-Agent", "ErosAfrodita/1.0")
                .GET()
                .timeout(Duration.ofSeconds(30))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() / 100 != 2) {
            throw new RuntimeException(
                    "BTS Error al obtener shipping prices: " + response.statusCode() + " - " + response.body());
        }
        return response.body();
    }

    public String getOrderStatus(String orderId) throws Exception {
        String url = BASE_URL + "/getOrderStatus?order_id=" + orderId;
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Authorization", "Bearer " + jwt)
                .header("User-Agent", "ErosAfrodita/1.0")
                .GET()
                .timeout(Duration.ofSeconds(30))
                .build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() / 100 != 2) {
            throw new RuntimeException(
                    "BTS Error al obtener estado: " + response.statusCode() + " - " + response.body());
        }
        return response.body();
    }

    public String getCategories() throws Exception {
        String url = BASE_URL + "/getListCategories?language_code=es-ES";
        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Authorization", "Bearer " + jwt)
                .header("User-Agent", "ErosAfrodita/1.0")
                .GET()
                .timeout(Duration.ofSeconds(30))
                .build();
        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
        if (response.statusCode() / 100 != 2) {
            throw new RuntimeException(
                    "BTS Error al obtener categorías: " + response.statusCode() + " - " + response.body());
        }
        return response.body();
    }
}
