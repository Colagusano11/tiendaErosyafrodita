package com.colagusano11.tiendaonline.client;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import com.colagusano11.tiendaonline.client.dto.AuthUsuario;
import com.colagusano11.tiendaonline.client.dto.ForgotPasswordRequest;
import com.colagusano11.tiendaonline.client.dto.PasswordReset;
import com.colagusano11.tiendaonline.client.dto.UsuarioLogin;
import com.colagusano11.tiendaonline.client.dto.VerificarCodigoRequest;
import org.springframework.security.core.annotation.AuthenticationPrincipal;




@FeignClient(name= "mcsv-usuario", 
contextId = "authFeignClient", 
url = "${config.baseurl.endpoint.mcsv-usuario:http://mcsv-usuario:8080}")
public interface AuthFeignClient {

  


@PostMapping("/auth/login")
AuthUsuario login(@RequestBody UsuarioLogin login);

@PostMapping("/auth/verificar-codigo")
String verificarCodigo(@RequestBody VerificarCodigoRequest req);

@GetMapping("/auth/oauth2/success")
AuthUsuario oauth2Success(@AuthenticationPrincipal OAuth2User principal);

@PostMapping("/auth/forgot-password")
String forgotPassword(@RequestBody ForgotPasswordRequest req);


@PostMapping("/auth/reset-password")
String resetPassword(@RequestBody PasswordReset req);

@PostMapping("/auth/resend-code")
String resendCode(@RequestBody java.util.Map<String, String> req);







}
