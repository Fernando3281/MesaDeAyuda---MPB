package com.mesadeayudaMPB.controller;

import com.mesadeayudaMPB.domain.Ticket;
import com.mesadeayudaMPB.domain.Usuario;
import com.mesadeayudaMPB.service.TicketService;
import com.mesadeayudaMPB.service.UsuarioService;
import jakarta.servlet.http.HttpSession;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Date;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;

@Controller
@RequestMapping("/usuario")
public class UsuarioController {

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private TicketService ticketService;

    @Autowired
    private HttpSession session;

    @GetMapping("/perfil")
    public String perfil(Model model, Authentication authentication) {
        if (authentication != null) {
            String correoElectronico = authentication.getName();
            Usuario usuario = usuarioService.getUsuarioPorCorreo(correoElectronico);
            if (usuario != null) {
                LocalDateTime fechaActual = LocalDateTime.now();
                model.addAttribute("ultimaConexion", fechaActual);
                model.addAttribute("usuario", usuario);
                // Remove session attribute manipulation here
                return "/usuario/perfil";
            }
        }
        return "redirect:/login";
    }

    @GetMapping("/perfil/{id}") //Este metodo se encarga de obtener el id del usuario solicitado para mostrar en el panel del manager
    public String verPerfil(@PathVariable Long id, Model model, Authentication authentication) {
        if (authentication != null) {
            Usuario usuarioActual = usuarioService.getUsuarioPorCorreo(authentication.getName());
            Usuario usuarioSolicitado = usuarioService.getUsuarioPorId(id);

            if (usuarioSolicitado != null) {
                model.addAttribute("usuario", usuarioSolicitado);
                model.addAttribute("usuarioActual", usuarioActual);

                LocalDateTime fechaActual = LocalDateTime.now();
                model.addAttribute("ultimaConexion", fechaActual);
                // Remove session attribute manipulation here
                return "/usuario/perfil";
            }
        }
        return "redirect:/login";
    }

    @GetMapping("/editar")
    public String editar(Model model, Authentication authentication) {
        if (authentication != null) {
            String correoElectronico = authentication.getName();
            Usuario usuario = usuarioService.getUsuarioPorCorreo(correoElectronico);
            if (usuario != null) {
                // Añadir la fecha actual al modelo para la vista de editar
                LocalDateTime fechaActual = LocalDateTime.now();
                model.addAttribute("ultimaConexion", fechaActual);

                model.addAttribute("usuario", usuario);
                return "/usuario/editar";
            }
        }
        return "redirect:/login";
    }

    @PostMapping("/guardar")
    public String guardar(Usuario usuario, @RequestParam("imagenFile") MultipartFile imagenFile) {
        Usuario usuarioActual = usuarioService.getUsuario(usuario);
        if (usuarioActual != null) {
            // Store original email for comparison
            String originalEmail = usuarioActual.getCorreoElectronico();

            if (!imagenFile.isEmpty()) {
                byte[] imagenBytes = usuarioService.actualizarImagen(imagenFile);
                usuarioActual.setImagen(imagenBytes);
                session.setAttribute("usuarioImagen", imagenBytes);
            }

            // Update user data
            usuarioActual.setNombre(usuario.getNombre());
            usuarioActual.setApellido(usuario.getApellido());
            usuarioActual.setProvincia(usuario.getProvincia());
            usuarioActual.setDireccion(usuario.getDireccion());
            usuarioActual.setNumeroTelefono(usuario.getNumeroTelefono());
            usuarioActual.setDepartamento(usuario.getDepartamento());

            // Only update email if it's different and doesn't exist
            if (!originalEmail.equals(usuario.getCorreoElectronico())
                    && !usuarioService.existeUsuarioPorCorreoElectronico(usuario.getCorreoElectronico())) {
                usuarioActual.setCorreoElectronico(usuario.getCorreoElectronico());
            }

            // Update password only if a new one is provided
            if (usuario.getContrasena() != null && !usuario.getContrasena().isEmpty()) {
                usuarioActual.setContrasena(usuario.getContrasena());
            }

            // Save user and update session
            usuarioService.save(usuarioActual, false);

            // Update session attributes
            session.setAttribute("usuarioNombre", usuarioActual.getNombre());
            session.setAttribute("usuarioId", usuarioActual.getIdUsuario());

            // If email was changed, force logout
            if (!originalEmail.equals(usuarioActual.getCorreoElectronico())) {
                SecurityContextHolder.clearContext();
                session.invalidate();
                return "redirect:/login?logout";
            }
        }
        return "redirect:/usuario/perfil";
    }

    // Nuevo método para obtener la imagen desde la base de datos
    @GetMapping("/imagen/{id}")
    public ResponseEntity<byte[]> obtenerImagen(@PathVariable Long id) {
        Usuario usuario = usuarioService.getUsuarioPorId(id);
        if (usuario != null && usuario.getImagen() != null) {
            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_JPEG) // Ajusta según el tipo de imagen (JPEG, PNG, etc.)
                    .body(usuario.getImagen());
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/historial")
    public String historial(Model model, Authentication authentication) {
        if (authentication != null) {
            String correoElectronico = authentication.getName();
            Usuario usuario = usuarioService.getUsuarioPorCorreo(correoElectronico);

            if (usuario != null) {
                List<Ticket> tickets = ticketService.getTicketsPorSolicitante(usuario);
                model.addAttribute("tickets", tickets);
                model.addAttribute("usuario", usuario);
                return "/usuario/historial";
            }
        }
        return "redirect:/login";
    }

    @GetMapping("/detalles")
    public String detalle(Model model) {
        return "/usuario/detalles";
    }

    @GetMapping("/configuracion")
    public String configuracion(Model model) {
        return "/usuario/configuracion";
    }
}
