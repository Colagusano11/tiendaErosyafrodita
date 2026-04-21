package com.example.tiendaonline.usuario.mcsv_usuario;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class McsvUsuarioApplication {

	public static void main(String[] args) {
		SpringApplication.run(McsvUsuarioApplication.class, args);
	}

}
