package com.colagusano11.tiendaonline.config;

import com.colagusano11.tiendaonline.client.UsuarioFeignClient;
import com.colagusano11.tiendaonline.client.dto.UsuarioRegistroDto;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    @Value("${application.security.jwt.secret-key}")
    private String secretKey;

    private final UsuarioFeignClient usuarioFeignClient;

    // Simple in-memory cache: email → CacheEntry
    private static final Map<String, CacheEntry> userCache = new ConcurrentHashMap<>();
    private static final Duration CACHE_TTL = Duration.ofMinutes(5);

    // Rutas públicas — autenticación ignorada para estas rutas
    private static final List<Pattern> PUBLIC_PATHS = List.of(
        Pattern.compile("^/productos/.*"),
        Pattern.compile("^/categorias/.*"),
        Pattern.compile("^/api/categorias/?$"),
        Pattern.compile("^/api/categorias/.*"),
        Pattern.compile("^/api/productos/?$"),
        Pattern.compile("^/api/productos/.*"),
        Pattern.compile("^/proxy-image/.*"),
        Pattern.compile("^/resenas/.*"),
        Pattern.compile("^/pedidos/rastrear.*"),
        Pattern.compile("^/actuator/.*"),
        Pattern.compile("^/avisos-stock/suscribir.*"),
        Pattern.compile("^/api/avisos-stock/suscribir.*")
    );

    // Rutas protegidas — requieren token JWT válido
    private static final List<Pattern> PROTECTED_PATHS = List.of(
        Pattern.compile("^/admin/.*"),
        Pattern.compile("^/api/admin/.*")
    );

    public JwtAuthFilter(UsuarioFeignClient usuarioFeignClient) {
        this.usuarioFeignClient = usuarioFeignClient;
    }

    private record CacheEntry(UsuarioRegistroDto usuario, Instant expiresAt) {}

    private Key getSigningKey() {
        return Keys.hmacShaKeyFor(secretKey.getBytes(StandardCharsets.UTF_8));
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain) throws ServletException, IOException {

        String path = request.getRequestURI();

        // Si es ruta pública → no intentamos autenticación
        if (isPublicPath(path)) {
            filterChain.doFilter(request, response);
            return;
        }

        String authHeader = request.getHeader("Authorization");

        // Token presente
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            try {
                Claims claims = Jwts.parserBuilder()
                        .setSigningKey(getSigningKey())
                        .build()
                        .parseClaimsJws(token)
                        .getBody();

                String email = claims.getSubject();
                String role  = claims.get("role", String.class);

                if (email != null && SecurityContextHolder.getContext().getAuthentication() == null) {
                    UsuarioRegistroDto usuario = getCachedUser(email);
                    if (usuario != null) {
                        // Si es ruta protegida, verificar rol ADMIN
                        if (isProtectedPath(path)) {
                            if (!"ROLE_ADMIN".equals(role)) {
                                response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                                response.setContentType("application/json");
                                response.getWriter().write("{\"error\":\"Acceso denegado\"}");
                                return;
                            }
                        }
                        List<SimpleGrantedAuthority> authorities = List.of(
                                new SimpleGrantedAuthority(role != null ? role : "ROLE_USER")
                        );
                        UsernamePasswordAuthenticationToken authToken =
                                new UsernamePasswordAuthenticationToken(usuario, null, authorities);
                        authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(authToken);
                    }
                }
            } catch (JwtException | IllegalArgumentException e) {
                logger.warn("JWT inválido o expirado: " + e.getMessage());
                // Token inválido en ruta protegida → 401
                if (isProtectedPath(path)) {
                    response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                    response.setContentType("application/json");
                    response.getWriter().write("{\"error\":\"Token inválido o expirado\"}");
                    return;
                }
            }
        } else {
            // Sin token en ruta protegida → 401
            if (isProtectedPath(path)) {
                response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                response.setContentType("application/json");
                response.getWriter().write("{\"error\":\"Autenticación requerida\"}");
                return;
            }
        }

        // Siempre continuar el filter chain (nunca bloquear aquí paths públicos)
        filterChain.doFilter(request, response);
    }

    private boolean isPublicPath(String path) {
        for (Pattern p : PUBLIC_PATHS) {
            if (p.matcher(path).matches()) return true;
        }
        return false;
    }

    private boolean isProtectedPath(String path) {
        for (Pattern p : PROTECTED_PATHS) {
            if (p.matcher(path).matches()) return true;
        }
        return false;
    }

    private UsuarioRegistroDto getCachedUser(String email) {
        Instant now = Instant.now();
        CacheEntry entry = userCache.get(email);
        if (entry != null && entry.expiresAt().isAfter(now)) {
            return entry.usuario();
        }
        try {
            UsuarioRegistroDto fetched = usuarioFeignClient.verUser(email);
            if (fetched != null) {
                userCache.put(email, new CacheEntry(fetched, now.plus(CACHE_TTL)));
                return fetched;
            }
        } catch (Exception e) {
            logger.warn("Feign call failed for user " + email + ", failing open: " + e.getMessage());
        }
        return null;
    }
}
