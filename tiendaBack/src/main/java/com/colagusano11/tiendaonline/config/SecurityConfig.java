package com.colagusano11.tiendaonline.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;


@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;
    private final SellerKingApiKeyFilter sellerKingApiKeyFilter;

    public SecurityConfig(JwtAuthFilter jwtAuthFilter,
                          SellerKingApiKeyFilter sellerKingApiKeyFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
        this.sellerKingApiKeyFilter = sellerKingApiKeyFilter;
    }

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Permitir preflight OPTIONS para todo
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                // Endpoints internos de SellerKing: protegidos por SellerKingApiKeyFilter (no JWT)
                .requestMatchers("/api/internal/**").permitAll()
                // Endpoints públicos: auth, registro, productos, categorías
                .requestMatchers(HttpMethod.POST, "/auth/**", "/usuarios/registro").permitAll()
                .requestMatchers(HttpMethod.GET, "/productos/**", "/categorias/**", "/api/feeds/**", "/feeds/**", "/api/feed/**", "/feed/**", "/proxy-image/**", "/resenas/**", "/pedidos/rastrear", "/api/cupones/validar/**", "/cupones/validar/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/avisos-stock/suscribir", "/api/avisos-stock/suscribir").permitAll()
                .requestMatchers(HttpMethod.GET, "/actuator/**").permitAll()
                // Endpoints de Pedidos para Invitados (crear pedido y arrancar pago con Revolut)
                .requestMatchers(HttpMethod.POST, "/pedidos", "/api/pedidos", "/pedidos/confirmar", "/api/pedidos/confirmar").permitAll()
                .requestMatchers(HttpMethod.POST, "/pedidos/*/pago/revolut", "/api/pedidos/*/pago/revolut").permitAll()
                // Confirmación de pago (invitado, tras aprobar en PayPal/Revolut): el checkout de
                // invitado la llama sin sesión, así que NO puede exigir ADMIN (antes lo exigía y
                // dejaba todos los pedidos pagados con PayPal atascados en PENDIENTE_DE_PAGO). La
                // verificación real de que el pago existe de verdad ahora la hace
                // PedidoServicieImpl.marcarPedidoPagado() llamando a la pasarela correspondiente
                // ANTES de marcar PAGADO, no confiando en el payload del cliente.
                .requestMatchers(HttpMethod.POST, "/pedidos/pago/confirmar", "/api/pedidos/pago/confirmar").permitAll()
                // Webhook externo de Revolut (llamada server-to-server, sin JWT)
                .requestMatchers(HttpMethod.POST, "/pagos/revolut/webhook", "/api/pagos/revolut/webhook").permitAll()
                // SEGURIDAD: rescatar pedidos atascados requiere ADMIN (acción manual de emergencia)
                .requestMatchers(HttpMethod.POST, "/pedidos/rescatar/**", "/api/pedidos/rescatar/**").hasAnyAuthority("ADMIN", "ROLE_ADMIN")
                // El resto de pedidos (cambiar estados, borrar, etc) requiere ADMIN
                .requestMatchers(HttpMethod.POST, "/pedidos/**", "/api/pedidos/**").hasAnyAuthority("ADMIN", "ROLE_ADMIN")
                .requestMatchers(HttpMethod.PUT, "/pedidos/**", "/api/pedidos/**").hasAnyAuthority("ADMIN", "ROLE_ADMIN")
                .requestMatchers(HttpMethod.DELETE, "/pedidos/**", "/api/pedidos/**").hasAnyAuthority("ADMIN", "ROLE_ADMIN")
                // Endpoints de Idealo (acceso autenticado o desde frontend)
                .requestMatchers(HttpMethod.GET, "/idealo/**", "/api/idealo/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/idealo/**", "/api/idealo/**").permitAll()
                .requestMatchers(HttpMethod.PUT, "/idealo/**", "/api/idealo/**").permitAll()
                .requestMatchers(HttpMethod.PATCH, "/idealo/**", "/api/idealo/**").permitAll()
                .requestMatchers(HttpMethod.DELETE, "/idealo/**", "/api/idealo/**").permitAll()
                // Cupónes: Permitir verlos a todos, pero solo ADMIN puede crear/borrar
                .requestMatchers(HttpMethod.GET, "/api/cupones", "/api/cupones/**", "/cupones", "/cupones/**").permitAll()
                .requestMatchers("/admin/**", "/api/admin/dashboard/**", "/api/cupones", "/api/cupones/**", "/cupones", "/cupones/**").hasAnyAuthority("ADMIN", "ROLE_ADMIN")
                // API interna de proveedores — autenticación por API key (ver InternalApiKeyFilter)
                .requestMatchers("/internal/**").permitAll()
                // Todo lo demás requiere autenticación JWT
                .anyRequest().authenticated()
            )
            // SellerKingApiKeyFilter se ejecuta ANTES que JwtAuthFilter
            // para interceptar /api/internal/** sin tocar las rutas JWT
            .addFilterBefore(sellerKingApiKeyFilter, UsernamePasswordAuthenticationFilter.class)
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .httpBasic(httpBasic -> httpBasic.disable());

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(
            "http://localhost:5173",
            "http://localhost:3000",
            "http://localhost:4001",
            "http://localhost:81",
            "http://localhost",
            "http://127.0.0.1",
            "https://erosyafrodita.com"
        ));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of("Content-Type", "Authorization"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
