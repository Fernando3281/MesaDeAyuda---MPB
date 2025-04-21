package com.mesadeayudaMPB.controller;

import com.mesadeayudaMPB.dao.UsuarioDao;
import com.mesadeayudaMPB.domain.Departamento;
import com.mesadeayudaMPB.domain.Usuario;
import com.mesadeayudaMPB.service.DepartamentoService;
import com.mesadeayudaMPB.service.RegistroService;
import com.mesadeayudaMPB.service.EmailService;
import com.mesadeayudaMPB.service.UsuarioService;
import com.mesadeayudaMPB.service.VerificationService;
import com.mesadeayudaMPB.service.impl.RegistroServiceImpl;
import jakarta.servlet.http.HttpSession;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/registro")
public class RegistroController {
    
    @Autowired
    private UsuarioDao usuarioDao;

    @Autowired
    private RegistroService registroService;
    
    @Autowired
    private VerificationService verificationService;

    @Autowired
    private DepartamentoService departamentoService;

    @Autowired
    private EmailService emailService;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    // Mapa para almacenar tokens de restablecimiento de contraseña y su tiempo de expiración
    private final Map<String, Map<String, Object>> passwordResetTokens = new HashMap<>();

    @GetMapping("/nuevo")
    public String nuevoRegistro(Model model) {
        model.addAttribute("usuario", new Usuario());
        // Obtener la lista de departamentos y pasarla a la vista
        List<Departamento> departamentos = departamentoService.obtenerTodosLosDepartamentos();
        model.addAttribute("departamentos", departamentos);
        return "/registro/nuevo";
    }

    @PostMapping("/nuevo")
    public ResponseEntity<?> registrarUsuario(@ModelAttribute Usuario usuario,
            BindingResult result,
            HttpSession session) {
        try {
            // Validar si el usuario ya existe
            if (registroService.existeUsuario(usuario.getCorreoElectronico())) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "El correo ya está registrado"));
            }

            // Preparar usuario con campos adicionales
            usuario = ((RegistroServiceImpl) registroService).prepararNuevoUsuario(usuario);

            // Generar código de verificación
            String verificationCode = ((RegistroServiceImpl) registroService).iniciarVerificacion(usuario);

            // Guardar en sesión
            session.setAttribute("pendingUser", usuario);
            session.setAttribute("verificationCode", verificationCode);

            // Redirigir sin esperar el envío del correo
            return ResponseEntity.ok()
                    .body(Map.of(
                            "success", true,
                            "redirectUrl", "/registro/verificacion?email="
                            + URLEncoder.encode(usuario.getCorreoElectronico(), StandardCharsets.UTF_8)
                    ));

        } catch (Exception e) {
            return ResponseEntity.badRequest()
                    .body(Map.of("error", "Error en el registro: " + e.getMessage()));
        }
    }

    @GetMapping("/verificacion")
    public String mostrarVerificacion(@RequestParam(required = false) String email,
            Model model,
            HttpSession session) {
        Usuario pendingUser = (Usuario) session.getAttribute("pendingUser");

        if (pendingUser == null || !pendingUser.getCorreoElectronico().equals(email)) {
            return "redirect:/registro/nuevo";
        }

        model.addAttribute("email", email);
        return "/registro/verificacion";
    }

    @PostMapping("/verificar")
public String verificarCodigo(@RequestParam String code,
        HttpSession session,
        RedirectAttributes redirectAttrs) {
    Usuario pendingUser = (Usuario) session.getAttribute("pendingUser");
    String storedCode = (String) session.getAttribute("verificationCode");

    if (pendingUser == null || storedCode == null) {
        return "redirect:/registro/nuevo";
    }

    if (verificationService.verifyCode(storedCode, code)) {
        // Verificar si el usuario ya existe
        if (usuarioDao.existsByCorreoElectronico(pendingUser.getCorreoElectronico())) {
            redirectAttrs.addFlashAttribute("error", "El correo ya está registrado");
            return "redirect:/registro/nuevo";
        }
        
        // Registrar al nuevo usuario
        registroService.registrarNuevoUsuario(pendingUser);

        // Limpiar sesión
        session.removeAttribute("pendingUser");
        session.removeAttribute("verificationCode");

        return "redirect:/login?registroExitoso=true";
    } else {
        redirectAttrs.addFlashAttribute("error", "Código de verificación inválido");
        redirectAttrs.addAttribute("email", pendingUser.getCorreoElectronico());
        return "redirect:/registro/verificacion";
    }
}

    // Método para mostrar el formulario de recordar contraseña
    @GetMapping("/recordar")
    public String mostrarRecordarContrasena() {
        return "/registro/recordar";
    }

    // Método para procesar la solicitud de recuperación de contraseña
    @PostMapping("/recordar")
    public String procesarRecordarContrasena(@RequestParam String email,
            RedirectAttributes redirectAttrs) {
        // Verificar si el email existe
        if (!registroService.existeUsuario(email)) {
            redirectAttrs.addFlashAttribute("error", "El correo electrónico no está registrado en el sistema");
            return "redirect:/registro/recordar";
        }

        // Invalidar cualquier token existente para este email
        invalidarTokensExistentesPorEmail(email);

        // Generar token único para restablecimiento
        String token = UUID.randomUUID().toString();

        // Guardar token con tiempo de expiración (10 minutos)
        Map<String, Object> tokenData = new HashMap<>();
        tokenData.put("email", email);
        tokenData.put("expiryTime", LocalDateTime.now().plusMinutes(10));

        passwordResetTokens.put(token, tokenData);

        // Enviar correo con enlace para restablecer contraseña
        emailService.sendPasswordResetLink(email, token);

        redirectAttrs.addFlashAttribute("success", "Se ha enviado un enlace de recuperación a tu correo electrónico");
        return "redirect:/login";
    }

    // Método auxiliar para invalidar tokens existentes para un email específico
    private void invalidarTokensExistentesPorEmail(String email) {
        // Crear una lista de tokens a eliminar para evitar ConcurrentModificationException
        List<String> tokensParaEliminar = new ArrayList<>();

        // Buscar tokens existentes para este email
        for (Map.Entry<String, Map<String, Object>> entry : passwordResetTokens.entrySet()) {
            String token = entry.getKey();
            Map<String, Object> tokenData = entry.getValue();

            if (email.equals(tokenData.get("email"))) {
                tokensParaEliminar.add(token);
            }
        }

        // Eliminar los tokens encontrados
        for (String token : tokensParaEliminar) {
            passwordResetTokens.remove(token);
        }
    }

    // Método para mostrar el formulario de cambio de contraseña
    @GetMapping("/cambiar-contrasena")
    public String mostrarCambiarContrasena(@RequestParam String token, Model model, RedirectAttributes redirectAttrs) {
        // Verificar si el token existe y es válido
        if (!passwordResetTokens.containsKey(token)) {
            redirectAttrs.addFlashAttribute("error", "El enlace de recuperación no es válido o ha expirado");
            return "redirect:/login";
        }

        Map<String, Object> tokenData = passwordResetTokens.get(token);
        LocalDateTime expiryTime = (LocalDateTime) tokenData.get("expiryTime");

        // Verificar si el token ha expirado
        if (LocalDateTime.now().isAfter(expiryTime)) {
            passwordResetTokens.remove(token);
            redirectAttrs.addFlashAttribute("error", "El enlace de recuperación ha expirado. Por favor, solicita uno nuevo");
            return "redirect:/login";
        }

        model.addAttribute("token", token);
        return "/registro/cambiar-contrasena";
    }

    // Método para procesar el cambio de contraseña
    @PostMapping("/cambiar-contrasena")
    public String procesarCambiarContrasena(@RequestParam String token,
            @RequestParam String password,
            @RequestParam String confirmPassword,
            RedirectAttributes redirectAttrs) {
        // Verificar si el token existe y es válido
        if (!passwordResetTokens.containsKey(token)) {
            redirectAttrs.addFlashAttribute("error", "El enlace de recuperación no es válido o ha expirado");
            return "redirect:/login";
        }

        Map<String, Object> tokenData = passwordResetTokens.get(token);
        LocalDateTime expiryTime = (LocalDateTime) tokenData.get("expiryTime");
        String email = (String) tokenData.get("email");

        // Verificar si el token ha expirado
        if (LocalDateTime.now().isAfter(expiryTime)) {
            passwordResetTokens.remove(token);
            redirectAttrs.addFlashAttribute("error", "El enlace de recuperación ha expirado. Por favor, solicita uno nuevo");
            return "redirect:/login";
        }

        // Verificar que las contraseñas coincidan
        if (!password.equals(confirmPassword)) {
            redirectAttrs.addFlashAttribute("error", "Las contraseñas no coinciden");
            return "redirect:/registro/cambiar-contrasena?token=" + token;
        }

        // Actualizar la contraseña
        ((RegistroServiceImpl) registroService).actualizarContrasena(email, password);

        // Eliminar el token usado
        passwordResetTokens.remove(token);

        redirectAttrs.addFlashAttribute("success", "Tu contraseña ha sido actualizada correctamente. Ya puedes iniciar sesión");
        return "redirect:/login";
    }
}
