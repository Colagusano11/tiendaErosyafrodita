package com.example.tiendaonline.usuario.mcsv_usuario.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;


@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final UsuarioDetailsService usuarioDetailsService;
    private final JwtAuthFilter jwtAuthFilter;

    public SecurityConfig(UsuarioDetailsService usuarioDetailsService, JwtAuthFilter jwtAuthFilter) {
        this.usuarioDetailsService = usuarioDetailsService;
        this.jwtAuthFilter = jwtAuthFilter;
    }

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationProvider authenticationProvider(UserDetailsService userDetailsService,
                                                         PasswordEncoder passwordEncoder) {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder);
        return provider;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                // Preflight
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                // Auth público (login, registro, verificación, recuperación de contraseña)
                .requestMatchers(HttpMethod.POST,
                    "/auth/login",
                    "/auth/verificar-codigo",
                    "/auth/resend-code",
                    "/auth/forgot-password",
                    "/auth/reset-password",
                    "/usuarios/registro"
                ).permitAll()
                // OAuth2 callback público
                .requestMatchers("/auth/oauth2/success", "/error").permitAll()
                // GET perfil propio — requiere JWT válido (el propio usuario o admin)
                .requestMatchers(HttpMethod.GET, "/usuarios/{email}").authenticated()
                // Listado completo de usuarios — solo ADMIN
                .requestMatchers(HttpMethod.GET, "/usuarios", "/usuarios/").hasRole("ADMIN")
                // Actualizar perfil propio — requiere JWT
                .requestMatchers(HttpMethod.PUT, "/usuarios/{email}").authenticated()
                // Cambio de contraseña — requiere JWT
                .requestMatchers(HttpMethod.PUT, "/usuarios/{email}/password").authenticated()
                // Métodos de pago — requiere JWT
                .requestMatchers("/usuarios/{email}/pagos/**").authenticated()
                // Borrar usuario — solo ADMIN
                .requestMatchers(HttpMethod.DELETE, "/usuarios/{email}").hasRole("ADMIN")
                // Cualquier otra cosa requiere auth
                .anyRequest().authenticated()
            )
            .oauth2Login(oauth -> oauth
                .defaultSuccessUrl("/auth/oauth2/success", true)
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .userDetailsService(usuarioDetailsService);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(List.of(
            "http://localhost:4200",
            "http://localhost:3000",
            "http://localhost:8080",
            "http://localhost:8082",
            "http://localhost:81",
            "http://localhost",
            "https://erosyafrodita.com",
            "https://erosyafrodita.com:8082"
        ));
        configuration.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(List.of("Content-Type", "Authorization"));
        configuration.setAllowCredentials(true);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }
}
