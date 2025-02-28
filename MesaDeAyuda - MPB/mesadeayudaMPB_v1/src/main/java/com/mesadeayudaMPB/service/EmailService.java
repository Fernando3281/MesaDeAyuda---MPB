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
            String resetUrl = "http://localhost:8080/registro/cambiar-contrasena?token=" + token;
            
            String htmlContent = loadHtmlTemplate("classpath:templates/recuperacion-contrasena.html")
                    .replace("{{resetUrl}}", resetUrl)
                    .replace("{{year}}", String.valueOf(java.time.Year.now().getValue()));
            helper.setText(htmlContent, true);
            emailSender.send(message);
        } catch (MessagingException | IOException e) {
            throw new RuntimeException("Error al enviar el correo de recuperación", e);
        }
    }
    
    private String loadHtmlTemplate(String path) throws IOException {
        var resource = resourceLoader.getResource(path);
        try (var reader = new InputStreamReader(resource.getInputStream(), StandardCharsets.UTF_8)) {
            return FileCopyUtils.copyToString(reader);
        }
    }
}