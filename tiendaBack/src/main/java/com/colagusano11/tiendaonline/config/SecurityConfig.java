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

    public SecurityConfig(JwtAuthFilter jwtAuthFilter) {
        this.jwtAuthFilter = jwtAuthFilter;
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
                // Endpoints públicos: auth, registro, productos, categorías
                .requestMatchers(HttpMethod.POST, "/auth/**", "/usuarios/registro").permitAll()
                .requestMatchers(HttpMethod.GET, "/productos/**", "/categorias/**", "/proxy-image/**", "/resenas/**").permitAll()
                .requestMatchers(HttpMethod.GET, "/actuator/**").permitAll()
                // Webhook de pago (llamada externa de Revolut, sin JWT)
                .requestMatchers(HttpMethod.POST, "/pagos/revolut/webhook").permitAll()
                // Permitir acceso a los comandos de administración e importación — solo ADMIN autenticado
                .requestMatchers("/admin/**").hasRole("ADMIN")
                // Todo lo demás requiere autenticación JWT
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .httpBasic(httpBasic -> httpBasic.disable());

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(
            "http://localhost:5173",  // Vite legacy port
            "http://localhost:3000",  // Vite new port (configurado en vite.config.ts)
            "http://localhost:8080",  // Backend local
            "http://localhost:8081",  // Microservicio usuarios
            "http://localhost:8082",  // Backend tienda
            "http://localhost:4001",  // Nuevo puerto Frontend
            "http://localhost:81",    // Docker Frontend (puerto 81)
            "http://localhost",       // Docker Frontend (puerto 80)
            "http://127.0.0.1",       // Localhost IP
            "https://erosyafrodita.com", // Producción (Añadido)
            "https://erosyafrodita.com:8082" // Producción API (Añadido)
        ));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        configuration.setAllowedHeaders(List.of("Content-Type", "Authorization"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
