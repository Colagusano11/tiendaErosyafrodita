package com.example.tiendaonline.usuario.mcsv_usuario.config;




public interface JwtService {

  

String generarToken(String email, String role);
String extraerEmail(String token);
String extrarRole(String token);

  

}
