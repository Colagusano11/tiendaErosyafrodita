package com.example.tiendaonline.usuario.mcsv_usuario.service;

import java.time.LocalDateTime;
import java.util.Random;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.tiendaonline.usuario.mcsv_usuario.config.EmailService;
import com.example.tiendaonline.usuario.mcsv_usuario.models.Password;
import com.example.tiendaonline.usuario.mcsv_usuario.models.Usuario;
import com.example.tiendaonline.usuario.mcsv_usuario.repository.PasswordResetRepository;
import com.example.tiendaonline.usuario.mcsv_usuario.repository.UsuarioRepository;


@Service
public class PasswordResetServiceImpl implements PasswordResetService {

  private final PasswordResetRepository rRepository;
  private final UsuarioRepository uRepository;
  private final EmailService eService;
  private final PasswordEncoder encoder;


  public PasswordResetServiceImpl(PasswordResetRepository rRepository, UsuarioRepository uRepository, EmailService eService,PasswordEncoder encoder) {
      this.rRepository = rRepository;
      this.uRepository = uRepository;
      this.eService=eService;
      this.encoder=encoder;
    }

  @Override
  public void forgotPassword(String email) {
       uRepository.findByEmail(email)
        .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

    String codigo = String.format("%06d", new Random().nextInt(1_000_000));

    Password pr = new Password();
    pr.setEmail(email);
    pr.setCodigo(codigo);
    pr.setExpiracion(LocalDateTime.now().plusMinutes(10));
    pr.setUsado(false);
    rRepository.save(pr);

    eService.enviarCodigoDeVerificacion(email, codigo);
}


  @Override
  public void resetPassword(String email, String codigo, String nuevaPassword) {
    Password pr = rRepository
        .findTopByEmailAndUsadoFalseOrderByExpiracionDesc(email)
        .orElseThrow(() -> new RuntimeException("No hay solicitud de reset"));

    if (pr.getExpiracion().isBefore(LocalDateTime.now())) {
        throw new RuntimeException("Código expirado");
    }

    if (!pr.getCodigo().equals(codigo)) {
        throw new RuntimeException("Código incorrecto");
    }

    Usuario usuario = uRepository.findByEmail(email)
        .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

    usuario.setPassword(encoder.encode(nuevaPassword));
    uRepository.save(usuario);

    pr.setUsado(true);
    rRepository.save(pr);
    }
}
