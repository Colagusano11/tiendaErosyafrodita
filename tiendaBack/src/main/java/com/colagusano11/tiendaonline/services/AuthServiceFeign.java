package com.colagusano11.tiendaonline.services;

import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import com.colagusano11.tiendaonline.client.AuthFeignClient;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.colagusano11.tiendaonline.client.dto.AuthUsuario;
import com.colagusano11.tiendaonline.client.dto.ForgotPasswordRequest;
import com.colagusano11.tiendaonline.client.dto.PasswordReset;
import com.colagusano11.tiendaonline.client.dto.UsuarioLogin;
import com.colagusano11.tiendaonline.client.dto.VerificarCodigoRequest;

@Service
public class AuthServiceFeign {

  private final AuthFeignClient client;

  public AuthServiceFeign(AuthFeignClient client){
    this.client=client;
  }





public AuthUsuario login(UsuarioLogin login){
  return client.login(login);
}


public String verificarCodigo(VerificarCodigoRequest req){
  return verificarCodigo(req);
}


public AuthUsuario oauth2Success(@AuthenticationPrincipal OAuth2User principal){

  return client.oauth2Success(principal);
}


public String resetPassword(ForgotPasswordRequest req){
  return resetPassword(req);
}



public String forgotPassword(PasswordReset req){
  return forgotPassword(req);
}







}
