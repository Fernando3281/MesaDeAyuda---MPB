package com.mesadeayudaMPB.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ResourceLoader;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.springframework.util.FileCopyUtils;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import org.springframework.scheduling.annotation.Async;
import java.io.IOException;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.util.Map;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender emailSender;

    @Autowired
    private ResourceLoader resourceLoader;

    @Value("${spring.mail.username}")
    private String fromEmail;

    @Async
    public void sendVerificationCode(String to, String code) {
        try {
            MimeMessage message = emailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("Verificación de cuenta");

            String htmlContent = loadHtmlTemplate("classpath:templates/verificacion-nuevo.html")
                    .replace("{{code}}", code)
                    .replace("{{year}}", String.valueOf(java.time.Year.now().getValue()));

            helper.setText(htmlContent, true);
            emailSender.send(message);
        } catch (MessagingException | IOException e) {
            throw new RuntimeException("Error al enviar el correo de verificación", e);
        }
    }

    @Async
    public void sendPasswordResetLink(String to, String token) {
        try {
            MimeMessage message = emailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("Recuperación de contraseña");

            // URL de recuperación de contraseña
            String resetUrl = "https://mesadeayuda-mpb.onrender.com/registro/recuperar-contrasena?token=" + token;

            String htmlContent = loadHtmlTemplate("classpath:templates/recuperacion-contrasena.html")
                    .replace("{{resetUrl}}", resetUrl)
                    .replace("{{year}}", String.valueOf(java.time.Year.now().getValue()));

            helper.setText(htmlContent, true);
            emailSender.send(message);
        } catch (MessagingException | IOException e) {
            throw new RuntimeException("Error al enviar el correo de recuperación", e);
        }
    }

    @Async
    public void sendPasswordChangeLink(String to, String token) {
        try {
            MimeMessage message = emailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("Cambio de contraseña solicitado");

            // URL para cambio de contraseña desde usuario logueado
            String changeUrl = "https://mesadeayuda-mpb.onrender.com/usuario/cambiar-contrasena?token=" + token;

            String htmlContent = loadHtmlTemplate("classpath:templates/cambio-contrasena-usuario.html")
                    .replace("{{changeUrl}}", changeUrl)
                    .replace("{{year}}", String.valueOf(java.time.Year.now().getValue()));

            helper.setText(htmlContent, true);
            emailSender.send(message);
        } catch (MessagingException | IOException e) {
            throw new RuntimeException("Error al enviar el correo de cambio de contraseña", e);
        }
    }

    @Async
    public void sendTicketStatusNotification(String to, String ticketCode, String newStatus, String ticketTitle, String updatedBy) {
        try {
            MimeMessage message = emailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");
            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject("Actualización de estado del ticket #" + ticketCode);

            // Mapear estados visibles para el usuario
            Map<String, String> estadoVisible = Map.of(
                    "Abierto", "En Revisión",
                    "Pendiente", "En Progreso",
                    "Resuelto", "Solucionado",
                    "Cerrado", "Cerrado",
                    "Cancelado", "Cancelado",
                    "Desactivado", "Desactivado"
            );

            String statusDisplay = estadoVisible.getOrDefault(newStatus, newStatus);

            String htmlContent = loadHtmlTemplate("classpath:templates/notificacion-estado-ticket.html")
                    .replace("{{ticketCode}}", ticketCode)
                    .replace("{{ticketTitle}}", ticketTitle)
                    .replace("{{newStatus}}", statusDisplay)
                    .replace("{{updatedBy}}", updatedBy)
                    .replace("{{year}}", String.valueOf(java.time.Year.now().getValue()));

            helper.setText(htmlContent, true);
            emailSender.send(message);
        } catch (MessagingException | IOException e) {
            throw new RuntimeException("Error al enviar notificación de estado de ticket", e);
        }
    }

    private String loadHtmlTemplate(String path) throws IOException {
        var resource = resourceLoader.getResource(path);
        try (var reader = new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8)) {
            return FileCopyUtils.copyToString(reader);
        }
    }
}
