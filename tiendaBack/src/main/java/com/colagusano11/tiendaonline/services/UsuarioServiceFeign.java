package com.colagusano11.tiendaonline.services;

import java.util.List;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;


import com.colagusano11.tiendaonline.client.UsuarioFeignClient;
import com.colagusano11.tiendaonline.client.dto.UsuarioDto;
import com.colagusano11.tiendaonline.client.dto.UsuarioRegistroDto;
import com.colagusano11.tiendaonline.client.dto.UsuarioRegistro;


@Service
public class UsuarioServiceFeign {

  @Autowired
  private UsuarioFeignClient client;


  public List<UsuarioRegistroDto> getAll() {
    return client.getAll();
  }


  public void deleteUsuario(String email) {
    client.deleteUsuario(email);
    }

  
  public UsuarioDto registrar(UsuarioRegistro user) {
   return client.registrar(user);
  }

  public UsuarioRegistroDto verUser(String email){
    return client.verUser(email);
  }


  public UsuarioRegistroDto actualizarDatos(String email, UsuarioRegistroDto datos) {
   return client.actualizarDatos(email, datos);
  }

  public List<com.colagusano11.tiendaonline.client.dto.MetodoPagoDto> getMetodos(String email) {
    return client.getMetodos(email);
  }

  public com.colagusano11.tiendaonline.client.dto.MetodoPagoDto agregarMetodo(String email, com.colagusano11.tiendaonline.client.dto.MetodoPagoDto dto) {
    return client.agregarMetodo(email, dto);
  }

  public void eliminarMetodo(String email, Long id) {
    client.eliminarMetodo(email, id);
  }

  public com.colagusano11.tiendaonline.client.dto.MetodoPagoDto marcarPrincipal(String email, Long id) {
    return client.marcarPrincipal(email, id);
  }

  public void updatePassword(String email, com.colagusano11.tiendaonline.client.dto.PasswordChangeRequest request) {
    client.updatePassword(email, request);
  }






}
