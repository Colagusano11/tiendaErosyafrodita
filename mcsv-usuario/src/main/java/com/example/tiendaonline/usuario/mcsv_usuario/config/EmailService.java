package com.example.tiendaonline.usuario.mcsv_usuario.config;

import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.MailSender;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

  private final MailSender mailSender;

  public EmailService(MailSender mailSender){
    this.mailSender=mailSender;
  }

  public void enviarCodigoDeVerificacion(String toEmail, String codigo){
    SimpleMailMessage message = new SimpleMailMessage();
    message.setTo(toEmail);
    message.setSubject("Codigo de Verificacion");
    message.setText("Tu codigo de verificacion es : "+ codigo);
    mailSender.send(message);
  }

}
