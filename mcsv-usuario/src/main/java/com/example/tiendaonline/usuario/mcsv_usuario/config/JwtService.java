package com.example.tiendaonline.usuario.mcsv_usuario.config;

import java.util.Date;

public interface JwtService {
    String generarToken(String email, String role);
    String extraerEmail(String token);
    String extrarRole(String token);
    String extraerJti(String token);
    Date extraerExpiracion(String token);
}
