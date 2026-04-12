package com.example.tiendaonline.usuario.mcsv_usuario.service;

import org.springframework.stereotype.Service;

@Service
public interface PasswordResetService {

  void forgotPassword(String email);
  void resetPassword(String email, String codigo, String nuevaPass);

}
