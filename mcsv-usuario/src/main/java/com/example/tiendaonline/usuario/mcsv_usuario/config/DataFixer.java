package com.example.tiendaonline.usuario.mcsv_usuario.config;

import com.example.tiendaonline.usuario.mcsv_usuario.models.Usuario;
import com.example.tiendaonline.usuario.mcsv_usuario.repository.UsuarioRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataFixer {

    @Value("${ADMIN_INIT_PASSWORD:ErosMolaMazo}")
    private String adminPassword;

    @Bean
    CommandLineRunner initData(UsuarioRepository repository, PasswordEncoder passwordEncoder) {
        return args -> {
            // 1. Quitar admin a amarlo8@hotmail.com (Ajuste de limpieza)
            repository.findByEmail("amarlo8@hotmail.com").ifPresent(u -> {
                if (u.isAdmin()) {
                    u.setAdmin(false);
                    repository.save(u);
                }
            });

            // 2. Asegurar existencia del admin principal
            String adminEmail = "erosyafrodita.com@gmail.com";
            if (repository.findByEmail(adminEmail).isEmpty()) {
                Usuario admin = new Usuario();
                admin.setEmail(adminEmail);
                admin.setPassword(passwordEncoder.encode(adminPassword));
                admin.setName("Admin");
                admin.setApellidos("Eros & Afrodita");
                admin.setAdmin(true);
                admin.setVerificado(true);
                repository.save(admin);
                // Log genérico sin contraseña
                System.out.println(">>> Usuario administrador inicial creado.");
            }
        };
    }
}
