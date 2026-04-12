package com.colagusano11.tiendaonline.config;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;

import org.springframework.stereotype.Component;

import static java.net.http.HttpClient.Version.HTTP_1_1;

@Component
public class NovaApiClient {

    private static final String BASE_URL = "https://drop.novaengel.com/api";

    private final HttpClient httpClient = HttpClient.newBuilder()
            .version(HTTP_1_1)
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    private final String user;
    private final String password;
    private String token;

    public NovaApiClient(String user, String password) {
        this.user = user;
        this.password = password;
    }

    private synchronized void login() throws Exception {
        String url = BASE_URL + "/login";

        String bodyJson = String.format(
                "{\"user\":\"%s\",\"password\":\"%s\"}",
                user, password);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Content-Type", "application/json")
                .POST(HttpRequest.BodyPublishers.ofString(bodyJson, StandardCharsets.UTF_8))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() / 100 != 2) {
            throw new RuntimeException("Error NovaEngel login: "
                    + response.statusCode() + " " + response.body());
        }

        String body = response.body();
        String marker = "\"Token\":\"";
        int idx = body.indexOf(marker);
        if (idx == -1) {
            throw new RuntimeException("Login NOVA sin Token en respuesta");
        }
        int start = idx + marker.length();
        int end = body.indexOf('"', start);
        this.token = body.substring(start, end);
    }

    private String ensureTokenAndCall(String urlBuilder) throws Exception {
        if (token == null) {
            login();
        }

        String url = String.format(urlBuilder, token);
        // log.info("🌐 Invocando URL Novaengel: {}", url);

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Accept", "application/json")
                .header("User-Agent", "ErosAfrodita/1.0")
                .timeout(Duration.ofSeconds(30))
                .GET()
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() == 401 || response.statusCode() == 403) {
            login();
            String retryUrl = String.format(urlBuilder, token);
            HttpRequest retryReq = HttpRequest.newBuilder()
                    .uri(URI.create(retryUrl))
                    .header("Accept", "application/json")
                    .header("User-Agent", "ErosAfrodita/1.0")
                    .timeout(Duration.ofSeconds(30))
                    .GET()
                    .build();
            response = httpClient.send(retryReq, HttpResponse.BodyHandlers.ofString());
        }

        if (response.statusCode() / 100 != 2) {
            throw new RuntimeException("Error NovaEngel: " + response.statusCode() + " " + response.body());
        }

        return response.body();
    }

    public String getProductsPage(int page, int elements, String language) throws Exception {
        String pattern = BASE_URL + "/products/paging/%s/" + page + "/" + elements + "/" + language;
        return ensureTokenAndCall(pattern);
    }

    public String getAllProducts(String language) throws Exception {
        this.token = null;
        String pattern = BASE_URL + "/products/availables/%s/" + language;
        return ensureTokenAndCall(pattern);
    }

    public String getStockAndPrice() throws Exception {
        String pattern = BASE_URL + "/stock/update/%s";
        return ensureTokenAndCall(pattern);
    }

    public String createOrder(String jsonBody) throws Exception {
        if (token == null)
            login();
        String url = BASE_URL + "/orders/sendv2/" + token;

        HttpRequest request = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Accept", "application/json")
                .header("Content-Type", "application/json")
                .header("User-Agent", "ErosAfrodita/1.0")
                .POST(HttpRequest.BodyPublishers.ofString(jsonBody, StandardCharsets.UTF_8))
                .timeout(Duration.ofSeconds(60))
                .build();

        HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

        if (response.statusCode() / 100 != 2) {
            throw new RuntimeException(
                    "NovaEngel Error al crear pedido: " + response.statusCode() + " - " + response.body());
        }
        return response.body();
    }

    public String getProductImages(String productId) throws Exception {
        // Petición especial para obtener las imágenes de un producto específico
        String pattern = BASE_URL + "/products/image/%s/" + productId;
        return ensureTokenAndCall(pattern);
    }

    public String getOrderStatus(String orderId) throws Exception {
        // En NovaEngel suele ser una llamada GET que requiere el token
        String pattern = BASE_URL + "/orders/get/%s/" + orderId;
        return ensureTokenAndCall(pattern);
    }

    public String getCategories() throws Exception {
        // Endpoint para obtener categorías en español
        // En NovaEngel el idioma es 'es', no 'es-ES'
        String pattern = BASE_URL + "/categories/all/%s/es";
        return ensureTokenAndCall(pattern);
    }

    public byte[] fetchImageBytes(String imageUrl) throws Exception {
        if (token == null)
            login();

        // Intentaremos varias formas de autenticación para ver cuál acepta Novaengel

        // 1. Cabecera Authorization: [token] (Ya probada sin "Bearer ")
        try {
            return callImageApi(imageUrl, "Authorization", token);
        } catch (Exception e1) {
            System.err.println("⚠️ Intento 1 (Authorization) falló: " + e1.getMessage());
        }

        // 2. Cabecera X-Auth-Token (Muy común en APIs REST)
        try {
            return callImageApi(imageUrl, "X-Auth-Token", token);
        } catch (Exception e2) {
            System.err.println("⚠️ Intento 2 (X-Auth-Token) falló: " + e2.getMessage());
        }

        // 3. Parámetro en URL: ?Token=[token] (Formato de otros endpoints de Nova)
        try {
            String urlWithToken = imageUrl + (imageUrl.contains("?") ? "&" : "?") + "Token=" + token;
            return callImageApi(urlWithToken, null, null);
        } catch (Exception e3) {
            System.err.println("⚠️ Intento 3 (URL ?Token=) falló: " + e3.getMessage());
        }

        // 4. Intentar inyectar en el path si detectamos el patrón /imageres/ID ->
        // /imageres/TOKEN/ID
        if (imageUrl.contains("/imageres/")) {
            try {
                String injectedUrl = imageUrl.replace("/imageres/", "/imageres/" + token + "/");
                return callImageApi(injectedUrl, null, null);
            } catch (Exception e4) {
                System.err.println("⚠️ Intento 4 (Inyección Path) falló: " + e4.getMessage());
            }
        }

        throw new RuntimeException("❌ Ninguno de los 4 métodos de autenticación funcionó para Novaengel: " + imageUrl);
    }

    private byte[] callImageApi(String url, String headerName, String headerValue) throws Exception {
        HttpRequest.Builder builder = HttpRequest.newBuilder()
                .uri(URI.create(url))
                .header("Accept", "image/*")
                .header("User-Agent", "ErosAfrodita/1.0")
                .timeout(Duration.ofSeconds(30))
                .GET();

        if (headerName != null) {
            builder.header(headerName, headerValue);
        }

        HttpRequest request = builder.build();
        HttpResponse<byte[]> response = httpClient.send(request, HttpResponse.BodyHandlers.ofByteArray());

        if (response.statusCode() / 100 != 2) {
            // Si es 401 o 403, intentamos login y reintento una sola vez para este método
            if (response.statusCode() == 401 || response.statusCode() == 403) {
                login();
                // Re-ejecutar la petición con el nuevo token (recursión limitada)
                // Usamos una lógica simple aquí para no complicar el bucle de intentos
                // principal
            }
            throw new RuntimeException("HTTP " + response.statusCode());
        }

        System.out.println("✅ Imagen recuperada con éxito de: " + url);
        return response.body();
    }
}
