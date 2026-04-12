package com.example.tiendaonline.usuario.mcsv_usuario.config;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private final JavaMailSender mailSender;

    // Estética Premium Eros & Afrodita
    private static final String COLOR_GOLD = "#D4AF37";
    private static final String COLOR_BG = "#1A1A1A";
    private static final String COLOR_SURFACE = "#252525";

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void enviarCodigoDeVerificacion(String toEmail, String codigo) {
        log.info("Enviando código de verificación premium a: {}", toEmail);
        
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("Tu Código de Exclusividad - Eros & Afrodita");

            String htmlContent = 
                "<html><body style='margin:0;padding:0;background-color:" + COLOR_BG + ";font-family:Helvetica,Arial,sans-serif;color:#ffffff;'>" +
                "<table width='100%' border='0' cellspacing='0' cellpadding='0' style='padding:40px 20px;'>" +
                "  <tr><td align='center'>" +
                "    <table width='500' border='0' cellspacing='0' cellpadding='0' style='background-color:" + COLOR_SURFACE + ";border-radius:24px;border:1px solid rgba(212,175,55,0.2);overflow:hidden;'>" +
                "      <tr><td style='padding:40px;text-align:center;border-bottom:1px solid rgba(212,175,55,0.1);'>" +
                "        <h1 style='margin:0;font-size:24px;letter-spacing:4px;color:" + COLOR_GOLD + ";text-transform:uppercase;'>EROS & AFRODITA</h1>" +
                "        <p style='margin:5px 0 0;font-size:10px;letter-spacing:3px;color:rgba(255,255,255,0.4);text-transform:uppercase;'>Portal de Verificación</p>" +
                "      </td></tr>" +
                "      <tr><td style='padding:40px;text-align:center;'>" +
                "        <h2 style='font-size:20px;margin-bottom:20px;color:#fff;'>Bienvenido a la Experiencia</h2>" +
                "        <p style='font-size:15px;line-height:1.6;color:rgba(255,255,255,0.7);margin-bottom:30px;'>" +
                "          Para acceder a nuestra boutique y descubrir piezas seleccionadas, por favor utiliza el siguiente código de activación:" +
                "        </p>" +
                "        <div style='background:rgba(212,175,55,0.1);padding:24px;border-radius:16px;border:1px dashed " + COLOR_GOLD + ";'>" +
                "          <span style='font-size:36px;font-weight:900;letter-spacing:8px;color:" + COLOR_GOLD + ";'>" + codigo + "</span>" +
                "        </div>" +
                "        <p style='font-size:12px;color:rgba(255,255,255,0.3);margin-top:30px;'>" +
                "          Este código expirará en los próximos minutos por seguridad." +
                "        </p>" +
                "      </td></tr>" +
                "      <tr><td style='padding:30px;text-align:center;background-color:rgba(0,0,0,0.2);'>" +
                "        <p style='margin:0;font-size:11px;color:rgba(255,255,255,0.3);'>&copy; 2026 Eros & Afrodita. Todos los derechos reservados.</p>" +
                "      </td></tr>" +
                "    </table>" +
                "  </td></tr>" +
                "</table>" +
                "</body></html>";

            helper.setText(htmlContent, true);
            mailSender.send(message);
            
            log.info("Código premium enviado con éxito a: {}", toEmail);
            
        } catch (MessagingException e) {
            log.error("Error al construir el email HTML para {}: {}", toEmail, e.getMessage());
            throw new RuntimeException("Error en el envío de email", e);
        }
    }
}
