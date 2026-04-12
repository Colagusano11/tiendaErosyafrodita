package com.example.tiendaonline.usuario.mcsv_usuario.service;
import com.example.tiendaonline.usuario.mcsv_usuario.dto.UsuarioRegistro;
import com.example.tiendaonline.usuario.mcsv_usuario.dto.UsuarioRegistroDto;

import java.util.List;

import com.example.tiendaonline.usuario.mcsv_usuario.dto.AuthUsuario;
import com.example.tiendaonline.usuario.mcsv_usuario.dto.UsuarioDto;
import com.example.tiendaonline.usuario.mcsv_usuario.dto.UsuarioLogin;


public interface UsuarioService{ 


  List<UsuarioRegistroDto> getAll();
  UsuarioDto registrar(UsuarioRegistro user);
  AuthUsuario login(UsuarioLogin login);
  AuthUsuario loginGoogle(String email);
  UsuarioRegistroDto verUser(String email);
  void deleteUsuario(String email); 
  UsuarioRegistroDto actualizarPerfil(String email, UsuarioRegistroDto datos);
  void verificarCodigo(String email, String codigo);
  void resendVerificationCode(String email);
  void changePassword(String email, String oldPass, String newPass);
}
