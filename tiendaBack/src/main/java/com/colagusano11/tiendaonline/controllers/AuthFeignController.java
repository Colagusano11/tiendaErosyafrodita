package com.colagusano11.tiendaonline.controllers;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import com.colagusano11.tiendaonline.client.AuthFeignClient;
import com.colagusano11.tiendaonline.client.dto.UsuarioLogin;
import com.colagusano11.tiendaonline.client.dto.VerificarCodigoRequest;
import com.colagusano11.tiendaonline.client.dto.ForgotPasswordRequest;
import com.colagusano11.tiendaonline.client.dto.PasswordReset;
import com.colagusano11.tiendaonline.client.dto.AuthUsuario;

@RestController
@RequestMapping("/auth")
public class AuthFeignController {

    private final AuthFeignClient authFeignClient;

    public AuthFeignController(AuthFeignClient authFeignClient) {
        this.authFeignClient = authFeignClient;
    }

    @PostMapping("/login")
    public ResponseEntity<AuthUsuario> login(@RequestBody UsuarioLogin login) {
        AuthUsuario auth = authFeignClient.login(login);
        return ResponseEntity.ok(auth);
    }

    @PostMapping("/verificar-codigo")
    public ResponseEntity<String> verificarCodigo(@RequestBody VerificarCodigoRequest req) {
        String msg = authFeignClient.verificarCodigo(req);
        return ResponseEntity.ok(msg);
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<String> forgotPassword(@RequestBody ForgotPasswordRequest req) {
        String msg = authFeignClient.resetPassword(req);
        return ResponseEntity.ok(msg);
    }

    @PostMapping("/reset-password")
    public ResponseEntity<String> resetPassword(@RequestBody PasswordReset req) {
        String msg = authFeignClient.forgotPassword(req);
        return ResponseEntity.ok(msg);
    }

    @PostMapping("/resend-code")
    public ResponseEntity<String> resendCode(@RequestBody java.util.Map<String, String> req) {
        String msg = authFeignClient.resendCode(req);
        return ResponseEntity.ok(msg);
    }
}

