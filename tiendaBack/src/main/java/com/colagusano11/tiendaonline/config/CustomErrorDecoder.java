package com.colagusano11.tiendaonline.config;

import feign.Response;
import feign.codec.ErrorDecoder;
import org.springframework.http.HttpStatus;
import org.springframework.util.StreamUtils;
import org.springframework.web.server.ResponseStatusException;

import java.io.IOException;
import java.nio.charset.StandardCharsets;

public class CustomErrorDecoder implements ErrorDecoder {

    @Override
    public Exception decode(String methodKey, Response response) {
        String message = "Error en el microservicio";
        try {
            if (response.body() != null) {
                String body = StreamUtils.copyToString(response.body().asInputStream(), StandardCharsets.UTF_8);
                // Parsing manual rudimentario para evitar dependencias de Jackson que están fallando
                if (body.contains("\"message\":\"")) {
                    message = body.split("\"message\":\"")[1].split("\"")[0];
                } else if (body.contains("\"error\":\"")) {
                    message = body.split("\"error\":\"")[1].split("\"")[0];
                }
            }
        } catch (IOException e) {
            // Fallback message
        }

        HttpStatus status = HttpStatus.valueOf(response.status());
        return new ResponseStatusException(status, message);
    }
}
