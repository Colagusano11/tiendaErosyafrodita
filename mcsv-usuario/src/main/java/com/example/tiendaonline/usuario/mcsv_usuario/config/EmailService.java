package com.example.tiendaonline.usuario.mcsv_usuario.config;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.MailSender;
import org.springframework.mail.MailException;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

  private static final Logger log = LoggerFactory.getLogger(EmailService.class);
  private final MailSender mailSender;

  public EmailService(MailSender mailSender){
    this.mailSender=mailSender;
  }

  public void enviarCodigoDeVerificacion(String toEmail, String codigo){
    log.info("Enviando código de verificación a: {}", toEmail);
    try {
        SimpleMailMessage message = new SimpleMailMessage();
        message.setTo(toEmail);
        message.setSubject("Codigo de Verificacion");
        message.setText("Tu codigo de verificacion es : "+ codigo);
        mailSender.send(message);
        log.info("Código enviado con éxito a: {}", toEmail);
    } catch (MailException e) {
        log.error("Fallo al enviar el código de verificación a {}: {}", toEmail, e.getMessage());
        throw e; // Propagar para que el rollback funcione
    }
  }

}
