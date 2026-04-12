package com.colagusano11.tiendaonline.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.jdbc.core.JdbcTemplate;

@Configuration
public class DatabaseFixer {

    @Bean
    CommandLineRunner fixDatabaseSchema(JdbcTemplate jdbcTemplate) {
        return args -> {
            try {
                System.out.println(">>> Ejecutando corrección de esquema: Permitir usuario_id NULL en tabla pedido...");
                jdbcTemplate.execute("ALTER TABLE pedido MODIFY usuario_id BIGINT NULL");
                System.out.println(">>> Esquema corregido con éxito.");
            } catch (Exception e) {
                System.err.println(">>> Error al corregir esquema (posiblemente ya corregido o tabla no existente): " + e.getMessage());
            }
        };
    }
}
