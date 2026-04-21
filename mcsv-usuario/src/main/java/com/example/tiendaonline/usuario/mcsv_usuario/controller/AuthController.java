package com.example.tiendaonline.usuario.mcsv_usuario.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.tiendaonline.usuario.mcsv_usuario.dto.AuthUsuario;
import com.example.tiendaonline.usuario.mcsv_usuario.dto.ForgotPasswordRequest;
import com.example.tiendaonline.usuario.mcsv_usuario.dto.UsuarioLogin;
import com.example.tiendaonline.usuario.mcsv_usuario.dto.VerificarCodigoRequest;
import com.example.tiendaonline.usuario.mcsv_usuario.models.Password;
import com.example.tiendaonline.usuario.mcsv_usuario.service.PasswordResetService;
import com.example.tiendaonline.usuario.mcsv_usuario.service.TokenService;
import com.example.tiendaonline.usuario.mcsv_usuario.service.UsuarioService;

import java.util.Map;

@RestController
@RequestMapping("/auth")
public class AuthController {

  private final UsuarioService uService;
  private final PasswordResetService rService;
  private final TokenService tokenService;

  public AuthController(UsuarioService uService, PasswordResetService rService, TokenService tokenService){
    this.uService = uService;
    this.rService = rService;
    this.tokenService = tokenService;
  }

  @PostMapping("/login")
  public ResponseEntity<AuthUsuario> login(@RequestBody UsuarioLogin login) {
      AuthUsuario auth = uService.login(login);
      return ResponseEntity.ok(auth);
  }

  @PostMapping("/logout")
  public ResponseEntity<?> logout(@RequestHeader("Authorization") String authHeader) {
      if (authHeader != null && authHeader.startsWith("Bearer ")) {
          String token = authHeader.substring(7);
          tokenService.revokeToken(token);
      }
      SecurityContextHolder.clearContext();
      return ResponseEntity.ok("Sesión cerrada");
  }

  @PostMapping("/verificar-codigo")
  public ResponseEntity<?> verificarCodigo(@RequestBody VerificarCodigoRequest req) {
      uService.verificarCodigo(req.getEmail(), req.getCodigo());
      return ResponseEntity.ok("Cuenta verificada");
  }

  @PostMapping("/resend-code")
  public ResponseEntity<?> resendCode(@RequestBody Map<String, String> req) {
      uService.resendVerificationCode(req.get("email"));
      return ResponseEntity.ok("Nuevo código enviado");
  }

  @GetMapping("/oauth2/success")
  public ResponseEntity<AuthUsuario> oauth2Success(@AuthenticationPrincipal OAuth2User principal) {
    var authentication = SecurityContextHolder.getContext().getAuthentication();
    if (authentication == null) {
      System.out.println("OAuth2 principal es null en /auth/oauth2/success");
        throw new RuntimeException("No vienes de un login OAuth2");
    }
    System.out.println("ATTRS = " + principal.getAttributes());
    String email = principal.getAttribute("email");
    AuthUsuario auth = uService.loginGoogle(email);
    return ResponseEntity.ok(auth);
  }

  @PostMapping("/forgot-password")
  public ResponseEntity<?> forgotPassword(@RequestBody ForgotPasswordRequest req) {
      rService.forgotPassword(req.getEmail());
      return ResponseEntity.ok("Hemos enviado un código a tu correo");
  }

  @PostMapping("/reset-password")
  public ResponseEntity<?> resetPassword(@RequestBody Password req) {
      rService.resetPassword(req.getEmail(), req.getCodigo(), req.getNuevaPass());
      return ResponseEntity.ok("Contraseña actualizada");
  }
}


    



