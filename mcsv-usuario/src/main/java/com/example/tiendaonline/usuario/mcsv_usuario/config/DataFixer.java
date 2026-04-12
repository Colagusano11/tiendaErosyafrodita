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

    @Value("${ADMIN_INIT_PASSWORD}")
    private String adminPassword;

    @Bean
    CommandLineRunner initData(UsuarioRepository repository, PasswordEncoder passwordEncoder) {
        return args -> {


            // 2. Asegurar existencia y contraseña del admin principal
            String adminEmail = "erosyafrodita.com@gmail.com";
            if (adminPassword == null || adminPassword.isBlank()) {
                System.err.println(">>> ERROR: ADMIN_INIT_PASSWORD no está definida!");
                return;
            }

            repository.findByEmail(adminEmail).ifPresentOrElse(
                admin -> {
                    admin.setPassword(passwordEncoder.encode(adminPassword));
                    admin.setAdmin(true);
                    admin.setVerificado(true);
                    repository.save(admin);
                    System.out.println(">>> Usuario administrador sincronizado.");
                },
                () -> {
                    Usuario admin = new Usuario();
                    admin.setEmail(adminEmail);
                    admin.setPassword(passwordEncoder.encode(adminPassword));
                    admin.setName("Admin");
                    admin.setApellidos("Eros & Afrodita");
                    admin.setAdmin(true);
                    admin.setVerificado(true);
                    repository.save(admin);
                    System.out.println(">>> Usuario administrador inicial creado.");
                }
            );
        };
    }
}
