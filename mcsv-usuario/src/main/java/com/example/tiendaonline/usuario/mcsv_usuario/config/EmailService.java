package com.example.tiendaonline.usuario.mcsv_usuario.config;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailService.class);
    private final JavaMailSender mailSender;

    @Value("${mail.from.address:${spring.mail.username:}}")
    private String fromAddress;

    @Value("${mail.from.name:AGE Parfums}")
    private String fromName;

    @Value("${mail.reply-to:celegorsl@gmail.com}")
    private String replyTo;

    // Estética AGE Parfums — verde profundo + lima
    private static final String COLOR_ACCENT = "#BBE235";
    private static final String COLOR_BG = "#0C3528";
    private static final String COLOR_SURFACE = "#123D2D";
    private static final String COLOR_BORDER = "#1B4B39";
    private static final String COLOR_MUTED = "#9BAEA3";
    private static final String COLOR_CREAM = "#F9F8F3";

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void enviarCodigoDeVerificacion(String toEmail, String codigo) {
        log.info("Enviando código de verificación a: {}", toEmail);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            if (fromAddress != null && !fromAddress.isBlank()) {
                helper.setFrom(fromAddress, fromName);
            }
            if (replyTo != null && !replyTo.isBlank()) {
                helper.setReplyTo(replyTo);
            }
            helper.setTo(toEmail);
            helper.setSubject("Tu código de verificación - AGE Parfums");

            String htmlContent =
                "<html><body style='margin:0;padding:0;background-color:" + COLOR_BG + ";font-family:Helvetica,Arial,sans-serif;color:" + COLOR_CREAM + ";'>" +
                "<table width='100%' border='0' cellspacing='0' cellpadding='0' style='padding:40px 20px;'>" +
                "  <tr><td align='center'>" +
                "    <table width='500' border='0' cellspacing='0' cellpadding='0' style='background-color:" + COLOR_SURFACE + ";border-radius:24px;border:1px solid " + COLOR_BORDER + ";overflow:hidden;'>" +
                "      <tr><td style='padding:40px;text-align:center;border-bottom:1px solid " + COLOR_BORDER + ";'>" +
                "        <h1 style='margin:0;font-size:24px;letter-spacing:4px;color:" + COLOR_CREAM + ";text-transform:uppercase;'>AGE Parfums</h1>" +
                "        <p style='margin:5px 0 0;font-size:10px;letter-spacing:3px;color:" + COLOR_ACCENT + ";text-transform:uppercase;'>Verificación de Cuenta</p>" +
                "      </td></tr>" +
                "      <tr><td style='padding:40px;text-align:center;'>" +
                "        <h2 style='font-size:20px;margin-bottom:20px;color:" + COLOR_CREAM + ";'>Confirma tu código</h2>" +
                "        <p style='font-size:15px;line-height:1.6;color:" + COLOR_MUTED + ";margin-bottom:30px;'>" +
                "          Para acceder a tu cuenta y descubrir nuestra selección de perfumes, utiliza el siguiente código de verificación:" +
                "        </p>" +
                "        <div style='background:rgba(187,226,53,0.1);padding:24px;border-radius:16px;border:1px dashed " + COLOR_ACCENT + ";'>" +
                "          <span style='font-size:36px;font-weight:900;letter-spacing:8px;color:" + COLOR_ACCENT + ";'>" + codigo + "</span>" +
                "        </div>" +
                "        <p style='font-size:12px;color:" + COLOR_MUTED + ";margin-top:30px;'>" +
                "          Este código expirará en los próximos minutos por seguridad." +
                "        </p>" +
                "      </td></tr>" +
                "      <tr><td style='padding:30px;text-align:center;background-color:rgba(0,0,0,0.15);'>" +
                "        <p style='margin:0;font-size:11px;color:" + COLOR_MUTED + ";'>&copy; 2026 AGE Parfums &middot; <a href='https://ageperfumes.com' style='color:" + COLOR_MUTED + ";'>ageperfumes.com</a></p>" +
                "      </td></tr>" +
                "    </table>" +
                "  </td></tr>" +
                "</table>" +
                "</body></html>";

            helper.setText(htmlContent, true);
            mailSender.send(message);

            log.info("Código enviado con éxito a: {}", toEmail);

        } catch (MessagingException | java.io.UnsupportedEncodingException e) {
            log.error("Error al construir el email HTML para {}: {}", toEmail, e.getMessage());
            throw new RuntimeException("Error en el envío de email", e);
        }
    }
}
