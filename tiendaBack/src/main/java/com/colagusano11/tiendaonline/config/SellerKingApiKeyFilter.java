package com.colagusano11.tiendaonline.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Filtro de seguridad para los endpoints /api/internal/**.
 * Verifica que la cabecera Authorization: Bearer <key> coincida
 * con SELLERKING_INTERNAL_API_KEY definida en application.properties.
 *
 * Solo actúa sobre /api/internal/. El resto de rutas lo ignora
 * y deja actuar al JwtAuthFilter de forma normal.
 */
@Component
public class SellerKingApiKeyFilter extends OncePerRequestFilter {

    @Value("${sellerking.internal.api.key}")
    private String expectedApiKey;

    private static final String INTERNAL_PATH_PREFIX = "/api/internal";

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String path = request.getRequestURI();

        if (!path.startsWith(INTERNAL_PATH_PREFIX)) {
            filterChain.doFilter(request, response);
            return;
        }

        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"error\":\"API key requerida\"}");
            return;
        }

        String providedKey = authHeader.substring(7);
        if (!expectedApiKey.equals(providedKey)) {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.getWriter().write("{\"error\":\"API key inválida\"}");
            return;
        }

        filterChain.doFilter(request, response);
    }
}
