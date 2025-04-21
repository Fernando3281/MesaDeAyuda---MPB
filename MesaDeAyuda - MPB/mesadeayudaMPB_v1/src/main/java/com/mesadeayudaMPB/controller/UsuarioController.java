package com.mesadeayudaMPB.controller;

import static com.mesadeayudaMPB.ProjectConfig.passwordEncoder;
import com.mesadeayudaMPB.dao.MensajeDao;
import com.mesadeayudaMPB.dao.UsuarioDao;
import com.mesadeayudaMPB.domain.Departamento;
import com.mesadeayudaMPB.domain.ImagenTicket;
import com.mesadeayudaMPB.domain.Rol;
import com.mesadeayudaMPB.domain.Ticket;
import com.mesadeayudaMPB.domain.Usuario;
import com.mesadeayudaMPB.service.DepartamentoService;
import com.mesadeayudaMPB.service.ImagenTicketService;
import com.mesadeayudaMPB.service.RegistroService;
import com.mesadeayudaMPB.service.RolService;
import com.mesadeayudaMPB.service.TicketService;
import com.mesadeayudaMPB.service.UsuarioService;
import com.mesadeayudaMPB.service.impl.RegistroServiceImpl;
import jakarta.servlet.http.HttpSession;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.validation.BindingResult;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/usuario")
public class UsuarioController {

    @Autowired
    private UsuarioDao usuarioDao;

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private ImagenTicketService imagenTicketService;

    @Autowired
    private RolService rolService;

    @Autowired
    private DepartamentoService departamentoService;

    @Autowired
    private TicketService ticketService;

    @Autowired
    private RegistroService registroService;

    @Autowired
    private HttpSession session;

    @Autowired
    private PasswordEncoder passwordEncoder;

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

    @GetMapping("/editar")
    public String editar(Model model, Authentication authentication) {
        if (authentication != null) {
            String correoElectronico = authentication.getName();
            Usuario usuario = usuarioService.getUsuarioPorCorreo(correoElectronico);
            if (usuario != null) {
                // Obtener la lista de departamentos desde la base de datos
                List<Departamento> departamentos = departamentoService.obtenerTodosLosDepartamentos();

                // Añadir la fecha actual al modelo para la vista de editar
                LocalDateTime fechaActual = LocalDateTime.now();
                model.addAttribute("ultimaConexion", fechaActual);

                // Añadir el usuario y la lista de departamentos al modelo
                model.addAttribute("usuario", usuario);
                model.addAttribute("departamentos", departamentos);

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

    //Revisar
    @GetMapping("/detalles/{id}")
    public String detalle(@PathVariable Long id, Model model, Authentication authentication) {
        if (authentication != null) {
            Ticket ticket = ticketService.getTicketPorId(id);
            if (ticket != null) {
                // Obtener las imágenes asociadas al ticket
                List<ImagenTicket> imagenes = imagenTicketService.obtenerImagenesPorTicket(id);

                model.addAttribute("ticket", ticket);
                model.addAttribute("imagenes", imagenes);
                return "/usuario/detalles";
            }
        }
        return "redirect:/login";
    }

    @GetMapping("/configuracion")
    public String configuracion(Model model) {
        return "/usuario/configuracion";
    }

    //METODOS PARA EL PANEL DE CONFIGURACION (Administrador)
    // Método para el panel de configuración (Administrador) con paginación
    @GetMapping("/listado")
    public String administrarUsuarios(
            Model model,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            Authentication authentication) {

        if (authentication != null) {
            // Obtener todos los departamentos para los selects en los modales
            List<String> departamentos = departamentoService.obtenerTodosLosDepartamentos()
                    .stream()
                    .map(Departamento::getNombre)
                    .collect(Collectors.toList());

            model.addAttribute("departamentos", departamentos);
            // Obtener todos los usuarios con paginación
            Page<Usuario> usuarioPage = usuarioService.getUsuariosPaginados(page, size);

            // Cargar roles para cada usuario
            for (Usuario usuario : usuarioPage.getContent()) {
                List<Rol> roles = rolService.obtenerRolesPorUsuario(usuario.getIdUsuario());
                usuario.setRoles(roles);
            }

            // Calcular el rango de páginas a mostrar (máximo 5 páginas)
            int totalPages = usuarioPage.getTotalPages();
            int startPage = Math.max(0, page - 2);
            int endPage = Math.min(totalPages - 1, page + 2);

            // Ajustar el rango si estamos cerca del inicio o del final
            if (endPage - startPage < 4) {
                startPage = Math.max(0, endPage - 4);
            }
            if (endPage - startPage < 4) {
                endPage = Math.min(totalPages - 1, startPage + 4);
            }

            // Agregar los datos al modelo
            model.addAttribute("usuarios", usuarioPage.getContent());
            model.addAttribute("currentPage", page);
            model.addAttribute("totalPages", totalPages);
            model.addAttribute("totalItems", usuarioPage.getTotalElements());
            model.addAttribute("pageSize", size);
            model.addAttribute("startPage", startPage);
            model.addAttribute("endPage", endPage);

            // Calcular información de paginación
            int start = page * size + 1;
            int end = Math.min((page + 1) * size, (int) usuarioPage.getTotalElements());
            model.addAttribute("start", start);
            model.addAttribute("end", end);

            return "/usuario/listado";
        }
        return "redirect:/login";
    }

    @GetMapping("/crear")
    public String mostrarFormularioCrear(Model model) {
        List<Departamento> departamentos = departamentoService.obtenerTodosLosDepartamentos();
        model.addAttribute("usuario", new Usuario());
        model.addAttribute("departamentos", departamentos);
        return "/usuario/crear";
    }

    // Métodos para manejar las acciones CRUD a través de modales
    @PostMapping("/crear")
    public String crearUsuario(
            @ModelAttribute Usuario usuario,
            @RequestParam("imagenFile") MultipartFile imagenFile,
            RedirectAttributes redirectAttributes) {

        try {
            // Validar correo único
            if (usuarioService.existeUsuarioPorCorreoElectronico(usuario.getCorreoElectronico())) {
                redirectAttributes.addFlashAttribute("error", "El correo electrónico ya está registrado");
                return "redirect:/usuario/listado";
            }

            // Generar código único (reutilizando método de RegistroServiceImpl)
            String codigoUnico = ((RegistroServiceImpl) registroService).generarCodigoUnico();
            while (usuarioDao.existsByCodigo(codigoUnico)) {
                codigoUnico = ((RegistroServiceImpl) registroService).generarCodigoUnico();
            }
            usuario.setCodigo(codigoUnico);

            // Procesar imagen
            if (!imagenFile.isEmpty()) {
                byte[] imagenBytes = usuarioService.actualizarImagen(imagenFile);
                usuario.setImagen(imagenBytes);
            } else {
                // Asignar imagen de perfil por defecto (reutilizando método de RegistroServiceImpl)
                byte[] imagenDefault = ((RegistroServiceImpl) registroService).obtenerImagenDefault();
                usuario.setImagen(imagenDefault);
            }

            // Hashear la contraseña (reutilizando el passwordEncoder)
            usuario.setContrasena(passwordEncoder.encode(usuario.getContrasena()));

            usuario.setActivo(true);
            usuario.setUltimaConexion(new Date());

            // Guardar usuario
            usuarioService.save(usuario, true);

            redirectAttributes.addFlashAttribute("mensaje", "Usuario creado exitosamente");
            return "redirect:/usuario/listado?created=true";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "Error al crear el usuario: " + e.getMessage());
            return "redirect:/usuario/listado";
        }
    }

    // Método para mostrar el formulario de edición con los datos del usuario
    @GetMapping("/editar/{id}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getUsuarioParaEditar(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();

        try {
            Usuario usuario = usuarioService.getUsuarioPorId(id);
            if (usuario == null) {
                response.put("error", "Usuario no encontrado");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }

            Map<String, Object> usuarioResponse = new HashMap<>();
            usuarioResponse.put("idUsuario", usuario.getIdUsuario());
            usuarioResponse.put("nombre", usuario.getNombre());
            usuarioResponse.put("apellido", usuario.getApellido());
            usuarioResponse.put("correoElectronico", usuario.getCorreoElectronico());
            usuarioResponse.put("departamento", usuario.getDepartamento());
            usuarioResponse.put("numeroTelefono", usuario.getNumeroTelefono());
            usuarioResponse.put("provincia", usuario.getProvincia());
            usuarioResponse.put("direccion", usuario.getDireccion());
            usuarioResponse.put("activo", usuario.isActivo());
            usuarioResponse.put("tieneImagen", usuario.getImagen() != null && usuario.getImagen().length > 0);

            List<Rol> roles = rolService.obtenerRolesPorUsuario(id);
            List<String> nombresRoles = roles.stream().map(Rol::getNombre).collect(Collectors.toList());

            response.put("usuario", usuarioResponse);
            response.put("roles", nombresRoles);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("error", "Error al obtener datos del usuario: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // Método para actualizar el usuario
    @PostMapping("/actualizar")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> actualizarUsuario(
            @RequestParam("idUsuario") Long idUsuario,
            @RequestParam("nombre") String nombre,
            @RequestParam("apellido") String apellido,
            @RequestParam("correoElectronico") String correoElectronico,
            @RequestParam("departamento") String departamento,
            @RequestParam(value = "numeroTelefono", required = false) Integer numeroTelefono,
            @RequestParam(value = "provincia", required = false) String provincia,
            @RequestParam(value = "direccion", required = false) String direccion,
            @RequestParam(value = "activo", required = false) String activoParam,
            @RequestParam(value = "rol", required = false) String rol,
            @RequestParam(value = "imagenFile", required = false) MultipartFile imagenFile,
            @RequestParam(value = "contrasena", required = false) String contrasena) {

        Map<String, Object> response = new HashMap<>();

        try {
            Usuario usuarioExistente = usuarioService.getUsuarioPorId(idUsuario);

            if (usuarioExistente == null) {
                response.put("error", "Usuario no encontrado");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }

            // Procesar el valor de activo (checkbox)
            boolean activo = "true".equals(activoParam) || "on".equals(activoParam);

            // Actualizar campos
            usuarioExistente.setNombre(nombre);
            usuarioExistente.setApellido(apellido);
            usuarioExistente.setCorreoElectronico(correoElectronico);
            usuarioExistente.setDepartamento(departamento);
            usuarioExistente.setNumeroTelefono(numeroTelefono);
            usuarioExistente.setProvincia(provincia);
            usuarioExistente.setDireccion(direccion);
            usuarioExistente.setActivo(activo);

            // Manejo de imagen
            if (imagenFile != null && !imagenFile.isEmpty()) {
                byte[] imagenBytes = usuarioService.actualizarImagen(imagenFile);
                usuarioExistente.setImagen(imagenBytes);
            }

            // Manejo de contraseña
            if (contrasena != null && !contrasena.isEmpty()) {
                usuarioExistente.setContrasena(passwordEncoder.encode(contrasena));
            }

            usuarioService.save(usuarioExistente, false);

            // Manejo de rol único
            if (rol != null && !rol.isEmpty()) {
                rolService.eliminarRolesPorUsuario(idUsuario);
                Rol nuevoRol = new Rol();
                nuevoRol.setNombre(rol);
                nuevoRol.setUsuario(usuarioExistente);
                rolService.save(nuevoRol);
            }

            response.put("mensaje", "Usuario actualizado correctamente");
            response.put("success", true);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("error", "Error al actualizar el usuario: " + e.getMessage());
            response.put("success", false);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // Método para eliminar usuario
    @PostMapping("/eliminar/{id}")
    public String eliminarUsuario(@PathVariable Long id, RedirectAttributes redirectAttributes) {
        try {
            Usuario usuario = usuarioService.getUsuarioPorId(id);
            if (usuario != null) {
                // Primero eliminar los roles asociados
                rolService.eliminarRolesPorUsuario(id);

                // Luego eliminar el usuario
                usuarioService.delete(usuario);
                redirectAttributes.addFlashAttribute("mensaje", "Usuario eliminado exitosamente");
            } else {
                redirectAttributes.addFlashAttribute("error", "Usuario no encontrado");
            }
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "Error al eliminar el usuario: " + e.getMessage());
        }
        return "redirect:/usuario/listado";
    }
}
