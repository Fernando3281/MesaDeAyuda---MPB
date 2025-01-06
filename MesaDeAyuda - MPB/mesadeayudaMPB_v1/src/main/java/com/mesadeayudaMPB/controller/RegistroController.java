package com.mesadeayudaMPB.controller;

import com.mesadeayudaMPB.domain.Usuario;
import com.mesadeayudaMPB.service.EmailService;
import com.mesadeayudaMPB.service.UsuarioService;
import com.mesadeayudaMPB.utils.VerificationCodeManager;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import java.util.HashMap;
import java.util.Map;
import org.springframework.web.bind.annotation.ResponseBody;

@Controller
public class RegistroController {

    @Autowired
    private EmailService emailService;
    @Autowired
    private UsuarioService usuarioService;
    @Autowired
    private VerificationCodeManager verificationCodeManager;

    // Almacenará temporalmente los usuarios pendientes de verificación
    private Map<String, Usuario> usuariosEnEspera = new HashMap<>();

    @GetMapping("/registro")
    public String registroForm(Usuario usuario) {
        return "/registro/registroForm";
    }

    @PostMapping("/registro")
    public String iniciarRegistro(@RequestParam String nombre,
                                  @RequestParam String apellidos,
                                  @RequestParam String departamento,
                                  @RequestParam String correoElectronico,
                                  @RequestParam String contrasena,
                                  Model model) {
        // Crear un objeto Usuario (no lo guardaremos aún en la base de datos)
        Usuario usuario = new Usuario();
        usuario.setNombre(nombre);
        usuario.setApellido(apellidos);
        usuario.setDepartamento(departamento);
        usuario.setCorreoElectronico(correoElectronico);
        usuario.setContrasena(contrasena);
        usuario.setActivo(false); // El usuario no estará activo hasta verificarse

        // Generar código de verificación
        String verificationCode = verificationCodeManager.generateVerificationCode(correoElectronico);
        
        // Enviar el código al correo
        emailService.sendVerificationCode(correoElectronico, verificationCode);

        // Guardar el usuario en el "stand by"
        usuariosEnEspera.put(correoElectronico, usuario);

        // Pasar el correo electrónico a la vista para usarlo en la verificación
        model.addAttribute("correoElectronico", correoElectronico);
        model.addAttribute("mensaje", "Se ha enviado un código de verificación a tu correo.");
        return "verificacionRegistro";
    }

    @PostMapping("/verificar-registro")
    @ResponseBody
    public Map<String, Object> verificarRegistro(@RequestParam String correoElectronico,
                                                @RequestParam String verificationCode) {
        Map<String, Object> response = new HashMap<>();
        boolean verificado = verificationCodeManager.verifyCode(correoElectronico, verificationCode);

        if (verificado) {
            // Recuperar el usuario temporal
            Usuario usuario = usuariosEnEspera.get(correoElectronico);

            if (usuario != null) {
                // Activar y guardar el usuario en la base de datos
                usuario.setActivo(true);
                usuarioService.save(usuario, false);

                // Eliminarlo del mapa temporal
                usuariosEnEspera.remove(correoElectronico);

                response.put("success", true);
                response.put("message", "¡Registro verificado con éxito! Ahora puedes iniciar sesión.");
            } else {
                response.put("success", false);
                response.put("errorMessage", "No se encontró el registro. Vuelve a registrarte.");
            }
        } else {
            response.put("success", false);
            response.put("errorMessage", "Código de verificación inválido o expirado.");
        }

        return response;
    }
}



/* metodo para el hash security


package com.mesadeayudaMPB.controller;

import com.mesadeayudaMPB.domain.Usuario;
import com.mesadeayudaMPB.service.RegistroService;
import com.mesadeayudaMPB.service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

@Controller
public class RegistroController {

    @Autowired
    private RegistroService registroService;

    @Autowired
    private UsuarioService usuarioService;

    @GetMapping("/nuevo")
    public String nuevo(Model model, Usuario usuario) {
        return "/registro/nuevo";
    }

    @PostMapping("/registro")
    public String registrarUsuario(@RequestParam String nombre,
                                    @RequestParam String apellidos,
                                    @RequestParam String departamento,
                                    @RequestParam String correoElectronico,
                                    @RequestParam String contrasena,
                                    Model model) {
        Usuario usuario = new Usuario();
        usuario.setNombre(nombre);
        usuario.setApellido(apellidos);
        usuario.setDepartamento(departamento);
        usuario.setCorreoElectronico(correoElectronico);
        usuario.setContrasena(contrasena);
        usuario.setActivo(true);

        // Llamar al servicio de registro para guardar el nuevo usuario
        try {
            registroService.registrarNuevoUsuario(usuario);
            model.addAttribute("mensaje", "Registro exitoso");
            return "/tickets/login";
        } catch (IllegalArgumentException e) {
            model.addAttribute("mensaje", e.getMessage());
            return "/registro/registroForm"; // Redirige al formulario si hay un error
        }
    }

    @GetMapping("/activar")
    public String activarCuenta(@RequestParam String username,
                                @RequestParam String clave,
                                Model model) {
        return registroService.activarCuenta(username, clave, model);
    }

    @PostMapping("/activar")
    public String activarCuentaPost(Usuario usuario, @RequestParam MultipartFile imagenFile) {
        try {
            registroService.activarCuenta(usuario, imagenFile);
            return "redirect:/tickets/login"; // Redirige al login tras activar
        } catch (Exception e) {
            return "error"; // Opción en caso de error
        }
    }
}
 */
