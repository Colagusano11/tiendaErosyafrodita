package com.colagusano11.tiendaonline.services;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailService {

    private final JavaMailSender mailSender;

    // Colores y Estilos Premium
    private static final String COLOR_GOLD = "#D4AF37";
    private static final String COLOR_BG = "#1A1A1A";
    private static final String COLOR_SURFACE = "#252525";
    private static final String STYLISH_TEMPLATE = 
        "<html><body style='margin:0;padding:0;background-color:" + COLOR_BG + ";font-family:\"Helvetica Neue\",Helvetica,Arial,sans-serif;color:#ffffff;'>" +
        "<table width='100%' border='0' cellspacing='0' cellpadding='0' style='background-color:" + COLOR_BG + ";padding:40px 20px;'>" +
        "<tr><td align='center'>" +
        "  <table width='600' border='0' cellspacing='0' cellpadding='0' style='background-color:" + COLOR_SURFACE + ";border-radius:24px;overflow:hidden;border:1px solid rgba(212,175,55,0.1);'>" +
        "    <tr><td style='padding:40px;text-align:center;border-bottom:1px solid rgba(212,175,55,0.1);'>" +
        "      <h1 style='margin:0;font-size:28px;font-weight:900;letter-spacing:4px;color:" + COLOR_GOLD + ";text-transform:uppercase;'>EROS & AFRODITA</h1>" +
        "      <p style='margin:8px 0 0;font-size:10px;letter-spacing:4px;color:rgba(255,255,255,0.4);text-transform:uppercase;'>Boutique de Exclusividad</p>" +
        "    </td></tr>" +
        "    <tr><td style='padding:40px;'>" +
        "      {{CONTENT}}" +
        "    </td></tr>" +
        "    <tr><td style='padding:40px;text-align:center;background-color:rgba(0,0,0,0.2);'>" +
        "      <p style='margin:0;font-size:12px;color:rgba(255,255,255,0.3);'>&copy; 2026 Eros & Afrodita. Todos los derechos reservados.</p>" +
        "    </td></tr>" +
        "  </table>" +
        "</td></tr>" +
        "</table>" +
        "</body></html>";

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    private void enviarHtml(String destino, String asunto, String htmlContent) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            
            helper.setTo(destino);
            helper.setSubject(asunto);
            helper.setText(htmlContent, true);
            
            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Error al enviar email: " + e.getMessage());
        }
    }

    public void enviarEmailVerificacion(String destino, String token) {
        String subject = "Bienvenido a la Boutique de Eros & Afrodita";
        String urlVerificacion = "http://localhost:8080/auth/verify?token=" + token;
        
        String content = 
            "<h2 style='font-size:24px;margin-bottom:20px;color:#ffffff;'>Bienvenido al Olimpo de la Exclusividad</h2>" +
            "<p style='font-size:16px;line-height:1.6;color:rgba(255,255,255,0.7);margin-bottom:30px;'>" +
            "Tu viaje comienza aquí. Por favor, confirma tu identidad para acceder a nuestra boutique y descubrir piezas seleccionadas para tu deleite." +
            "</p>" +
            "<div style='text-align:center;margin-bottom:30px;'>" +
            "  <a href='" + urlVerificacion + "' style='display:inline-block;padding:18px 40px;background-color:" + COLOR_GOLD + ";color:#1A1A1A;text-decoration:none;font-weight:900;border-radius:12px;text-transform:uppercase;letter-spacing:2px;font-size:12px;'>Activar mi Cuenta</a>" +
            "</div>" +
            "<p style='font-size:14px;color:rgba(255,255,255,0.4);border-top:1px solid rgba(255,255,255,0.05);padding-top:20px;'>" +
            "Si no has solicitado el registro en nuestra boutique, puedes ignorar este mensaje." +
            "</p>";

        String fullHtml = STYLISH_TEMPLATE.replace("{{CONTENT}}", content);
        enviarHtml(destino, subject, fullHtml);
    }

    public void enviarEmailGenerico(String destinatario, String asunto, String cuerpo) {
        String content = "<p style='font-size:16px;line-height:1.6;color:rgba(255,255,255,0.7);'>" + cuerpo + "</p>";
        String fullHtml = STYLISH_TEMPLATE.replace("{{CONTENT}}", content);
        enviarHtml(destinatario, asunto, fullHtml);
    }

    public void enviarEmailPedido(com.colagusano11.tiendaonline.models.Pedido pedido, String destino) {
        String subject = "Confirmación de Pedido #" + pedido.getId() + " - Eros & Afrodita";
        
        StringBuilder productosHtml = new StringBuilder();
        productosHtml.append("<table width='100%' cellspacing='0' cellpadding='10' style='color:#ffffff;border-collapse:collapse;margin-bottom:30px;'>");
        productosHtml.append("<tr style='border-bottom:1px solid rgba(255,255,255,0.1);text-align:left;font-size:12px;color:rgba(255,255,255,0.4);'>");
        productosHtml.append("<th>Producto</th><th style='text-align:center;'>Cant.</th><th style='text-align:right;'>Precio</th></tr>");

        for (com.colagusano11.tiendaonline.models.PedidoProducto linea : pedido.getLineas()) {
            productosHtml.append("<tr style='border-bottom:1px solid rgba(255,255,255,0.05);'>");
            productosHtml.append("<td style='padding:15px 0;'>");
            productosHtml.append("<div style='display:flex;align-items:center;'>");
            productosHtml.append("<img src='").append(linea.getProducto().getImagen()).append("' width='50' style='border-radius:8px;margin-right:15px;background:#fff;padding:2px;'/>");
            productosHtml.append("<div><p style='margin:0;font-weight:bold;font-size:14px;'>").append(linea.getNombreProducto()).append("</p></div>");
            productosHtml.append("</div></td>");
            productosHtml.append("<td style='text-align:center;'>").append(linea.getCantidad()).append("</td>");
            productosHtml.append("<td style='text-align:right;font-weight:bold;'>").append(linea.getPrecioUnitario()).append("€</td>");
            productosHtml.append("</tr>");
        }
        productosHtml.append("</table>");

        String content = 
            "<h2 style='font-size:24px;margin-bottom:10px;color:" + COLOR_GOLD + ";'>¡Gracias por tu pedido!</h2>" +
            "<p style='font-size:16px;color:rgba(255,255,255,0.7);margin-bottom:30px;'>Hemos recibido tu solicitud. Tu selección está siendo preparada con el máximo cuidado en nuestra boutique.</p>" +
            "<div style='background-color:rgba(0,0,0,0.2);padding:25px;border-radius:16px;margin-bottom:30px;'>" +
            "  <p style='margin:0 0 10px;font-size:12px;color:rgba(255,255,255,0.4);text-transform:uppercase;'>Resumen del Pedido #" + pedido.getId() + "</p>" +
               productosHtml.toString() +
            "  <div style='border-top:1px solid rgba(255,255,255,0.1);padding-top:20px;'>" +
            "    <div style='display:flex;justify-content:space-between;margin-bottom:10px;'><span style='color:rgba(255,255,255,0.4);'>Subtotal:</span><span style='color:#fff;font-weight:bold;margin-left:auto;'> " + pedido.getTotal() + "€</span></div>" +
            "    <div style='display:flex;justify-content:space-between;margin-bottom:10px;'><span style='color:rgba(255,255,255,0.4);'>Envío:</span><span style='color:#2ecc71;font-weight:bold;margin-left:auto;'> GRATIS</span></div>" +
            "    <div style='display:flex;justify-content:space-between;font-size:20px;margin-top:10px;color:" + COLOR_GOLD + ";'><span style='font-weight:900;'>TOTAL:</span><span style='font-weight:900;margin-left:auto;'> " + pedido.getTotal() + "€</span></div>" +
            "  </div>" +
            "</div>" +
            "<div style='border-left:4px solid " + COLOR_GOLD + ";padding-left:20px;margin-bottom:30px;'>" +
            "  <h3 style='font-size:14px;margin:0 0 10px;text-transform:uppercase;letter-spacing:1px;color:rgba(255,255,255,0.4);'>Destino del Ritual</h3>" +
            "  <p style='margin:0;font-size:16px;font-weight:bold;color:#fff;'>" + pedido.getNombre() + " " + pedido.getApellidos() + "</p>" +
            "  <p style='margin:5px 0 0;font-size:14px;color:rgba(255,255,255,0.7);line-height:1.6;'>" +
               pedido.getCalle() + "<br/>" + pedido.getCodigoPostal() + " " + pedido.getCiudad() + " (" + pedido.getProvincia() + ")</p>" +
            "</div>" +
            "<p style='font-size:14px;color:rgba(255,255,255,0.4);text-align:center;'>Recibirás un nuevo correo cuando tu pedido sea enviado con los detalles del seguimiento.</p>";

        String fullHtml = STYLISH_TEMPLATE.replace("{{CONTENT}}", content);
        
        // Enviamos al cliente
        enviarHtml(destino, subject, fullHtml);
        
        // Enviamos copia al Admin (Tú)
        enviarHtml("Erosyafrodita.com@gmail.com", "[ADMIN] Nuevo Pedido Recibido #" + pedido.getId(), fullHtml);
    }
}
