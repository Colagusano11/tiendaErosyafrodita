package com.colagusano11.tiendaonline.controllers;

import com.colagusano11.tiendaonline.services.EmailService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/contacto")
@CrossOrigin(origins = "*") // Para desarrollo
public class ContactoController {

    private final EmailService emailService;

    public ContactoController(EmailService emailService) {
        this.emailService = emailService;
    }

    @PostMapping
    public ResponseEntity<?> recibirContacto(@RequestBody ContactoDTO contacto) {
        if (contacto.getNombre() == null || contacto.getEmail() == null || contacto.getMensaje() == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "Todos los campos son obligatorios"));
        }

        String cuerpo = String.format(
            "<h1>Nuevo Mensaje de Contacto</h1>" +
            "<p><strong>Nombre:</strong> %s</p>" +
            "<p><strong>Email:</strong> %s</p>" +
            "<p><strong>Mensaje:</strong></p>" +
            "<div style='border-left: 2px solid #D4AF37; padding-left: 15px; margin-top: 10px; color: #ffffff;'>%s</div>",
            contacto.getNombre(),
            contacto.getEmail(),
            contacto.getMensaje().replace("\n", "<br/>")
        );

        try {
            // Enviamos el correo a la dirección de Gmail indicada por el usuario
            emailService.enviarEmailGenerico("erosyafrodita.com@gmail.com", "NUEVO CONTACTO: " + contacto.getNombre(), cuerpo);
            return ResponseEntity.ok(Map.of("message", "Mensaje enviado correctamente"));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", "No se pudo enviar el mensaje: " + e.getMessage()));
        }
    }
}
