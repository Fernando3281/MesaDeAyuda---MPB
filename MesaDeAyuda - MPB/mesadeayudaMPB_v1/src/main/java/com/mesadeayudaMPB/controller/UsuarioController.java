package com.mesadeayudaMPB.controller;

import static com.mesadeayudaMPB.ProjectConfig.passwordEncoder;
import com.mesadeayudaMPB.dao.MensajeDao;
import com.mesadeayudaMPB.dao.UsuarioDao;
import com.mesadeayudaMPB.domain.Departamento;
import com.mesadeayudaMPB.domain.ArchivoTicket;
import com.mesadeayudaMPB.domain.Rol;
import com.mesadeayudaMPB.domain.Ticket;
import com.mesadeayudaMPB.domain.Usuario;
import com.mesadeayudaMPB.service.DepartamentoService;
import com.mesadeayudaMPB.service.RegistroService;
import com.mesadeayudaMPB.service.RolService;
import com.mesadeayudaMPB.service.TicketService;
import com.mesadeayudaMPB.service.UsuarioService;
import com.mesadeayudaMPB.service.impl.RegistroServiceImpl;
import jakarta.servlet.http.HttpSession;
import java.time.LocalDateTime;
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
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import com.mesadeayudaMPB.service.ArchivoTicketService;
import com.mesadeayudaMPB.service.EmailService;
import com.mesadeayudaMPB.service.MensajeService;
import jakarta.servlet.http.HttpServletRequest;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.UUID;

@Controller
@RequestMapping("/usuario")
public class UsuarioController {

    @Autowired
    private UsuarioDao usuarioDao;

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private ArchivoTicketService archivoTicketService;

    @Autowired
    private MensajeService mensajeService;

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

    @Autowired
    private EmailService emailService;

    // Mapa para almacenar tokens de restablecimiento de contraseña y su tiempo de expiración
    private final Map<String, Map<String, Object>> passwordResetTokens = new HashMap<>();

    @GetMapping("/perfil")
    public String perfilUsuario(Model model, Authentication authentication) {
        if (authentication != null) {
            String correoElectronico = authentication.getName();
            Usuario usuario = usuarioService.getUsuarioPorCorreo(correoElectronico);

            if (usuario != null) {
                // Obtener los últimos 10 tickets ordenados por fecha descendente
                List<Ticket> ticketsRecientes = ticketService.getTicketsPorSolicitante(usuario)
                    .stream()
                    .sorted(Comparator.comparing(Ticket::getFechaApertura).reversed())
                    .limit(10)
                    .collect(Collectors.toList());

                // Crear lista de tickets con información de archivos adjuntos
                List<Map<String, Object>> ticketsConAdjuntos = ticketsRecientes.stream()
                    .map(ticket -> {
                        Map<String, Object> ticketMap = new HashMap<>();
                        ticketMap.put("ticket", ticket);
                        ticketMap.put("tieneArchivos", !archivoTicketService.obtenerArchivosPorTicket(ticket.getIdTicket()).isEmpty());
                        return ticketMap;
                    })
                    .collect(Collectors.toList());

                model.addAttribute("ticketsConAdjuntos", ticketsConAdjuntos);
                model.addAttribute("usuario", usuario);
                model.addAttribute("ultimaConexion", LocalDateTime.now());
                
                return "usuario/perfil";
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
                List<Departamento> departamentos = departamentoService.obtenerTodosLosDepartamentos();

                // Mostrar mensaje si el departamento fue eliminado
                if (usuario.getDepartamento() == null) {
                    model.addAttribute("departamentoEliminado", true);
                }

                model.addAttribute("ultimaConexion", LocalDateTime.now());
                model.addAttribute("usuario", usuario);
                model.addAttribute("departamentos", departamentos);

                return "/usuario/editar";
            }
        }
        return "redirect:/login";
    }

    @PostMapping("/guardar")
    public String guardar(Usuario usuario, @RequestParam("imagenFile") MultipartFile imagenFile,
            RedirectAttributes redirectAttributes) {

        // Validar que se haya seleccionado un departamento
        if (usuario.getDepartamento() == null || usuario.getDepartamento().isEmpty()) {
            redirectAttributes.addFlashAttribute("error", "Debe seleccionar un departamento");
            return "redirect:/usuario/editar";
        }
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

    @GetMapping("/detalles/{id}")
    public String detalle(@PathVariable Long id, Model model, Authentication authentication) {
        if (authentication != null) {
            Ticket ticket = ticketService.getTicketPorId(id);
            if (ticket != null) {
                // Obtener las imágenes asociadas al ticket
                List<ArchivoTicket> archivos = archivoTicketService.obtenerArchivosPorTicket(id);

                model.addAttribute("ticket", ticket);
                model.addAttribute("imagenes", archivos);
                return "/usuario/detalles";
            }
        }
        return "redirect:/login";
    }

    @GetMapping("/configuracion")
    public String configuracion(Model model) {
        return "/usuario/configuracion";
    }

    @GetMapping("/listado")
    public String administrarUsuarios(
            Model model,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String estado,
            @RequestParam(required = false) String rol,
            Authentication authentication) {

        if (authentication != null) {
            // Obtener el usuario logueado
            String correoElectronico = authentication.getName();
            Usuario usuarioLogueado = usuarioService.getUsuarioPorCorreo(correoElectronico);
            model.addAttribute("usuarioLogueado", usuarioLogueado);

            // Obtener todos los departamentos
            List<String> departamentos = departamentoService.obtenerTodosLosDepartamentos()
                    .stream()
                    .map(Departamento::getNombre)
                    .collect(Collectors.toList());

            model.addAttribute("departamentos", departamentos);

            // Obtener usuarios con los filtros aplicados
            Page<Usuario> usuarioPage;

            // Convertir parámetros de filtro
            Boolean activo = (estado != null && !estado.isEmpty()) ? estado.equals("activo") : null;

            // Aplicar filtros combinados
            if (search != null && !search.isEmpty()) {
                if (activo != null && rol != null && !rol.isEmpty()) {
                    usuarioPage = usuarioService.buscarUsuariosPorEstadoYRol(search, activo, rol, page, size);
                } else if (activo != null) {
                    usuarioPage = usuarioService.buscarUsuariosPorEstado(search, activo, page, size);
                } else if (rol != null && !rol.isEmpty()) {
                    usuarioPage = usuarioService.buscarUsuariosPorRol(search, rol, page, size);
                } else {
                    usuarioPage = usuarioService.buscarUsuarios(search, page, size);
                }
            } else {
                if (activo != null && rol != null && !rol.isEmpty()) {
                    usuarioPage = usuarioService.getUsuariosPorEstadoYRol(activo, rol, page, size);
                } else if (activo != null) {
                    usuarioPage = usuarioService.getUsuariosPorEstado(activo, page, size);
                } else if (rol != null && !rol.isEmpty()) {
                    usuarioPage = usuarioService.getUsuariosPorRol(rol, page, size);
                } else {
                    // Ordenar por ID ascendente por defecto
                    usuarioPage = usuarioService.getUsuariosPaginadosOrdenadosPorId(page, size);
                }
            }

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
            model.addAttribute("searchQuery", search);
            model.addAttribute("estadoFiltro", estado);
            model.addAttribute("rolFiltro", rol);

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
    public ResponseEntity<Map<String, Object>> crearUsuario(
            @ModelAttribute Usuario usuario,
            @RequestParam("imagenFile") MultipartFile imagenFile) {

        Map<String, Object> response = new HashMap<>();

        try {
            // Validar campos obligatorios
            if (usuario.getNombre() == null || usuario.getNombre().isEmpty()) {
                response.put("success", false);
                response.put("error", "El nombre es obligatorio");
                return ResponseEntity.badRequest().body(response);
            }

            if (usuario.getCorreoElectronico() == null || usuario.getCorreoElectronico().isEmpty()) {
                response.put("success", false);
                response.put("error", "El correo electrónico es obligatorio");
                return ResponseEntity.badRequest().body(response);
            }

            if (usuario.getDepartamento() == null || usuario.getDepartamento().isEmpty()) {
                response.put("success", false);
                response.put("error", "El departamento es obligatorio");
                return ResponseEntity.badRequest().body(response);
            }

            if (usuario.getContrasena() == null || usuario.getContrasena().isEmpty()) {
                response.put("success", false);
                response.put("error", "La contraseña es obligatoria");
                return ResponseEntity.badRequest().body(response);
            }

            // Validar correo único
            if (usuarioService.existeUsuarioPorCorreoElectronico(usuario.getCorreoElectronico())) {
                response.put("success", false);
                response.put("error", "El correo electrónico ya está registrado");
                return ResponseEntity.badRequest().body(response);
            }

            // Generar código único
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
                byte[] imagenDefault = ((RegistroServiceImpl) registroService).obtenerImagenDefault();
                usuario.setImagen(imagenDefault);
            }

            // Hashear la contraseña
            usuario.setContrasena(passwordEncoder.encode(usuario.getContrasena()));

            // Manejar campos opcionales
            if (usuario.getApellido() == null || usuario.getApellido().isEmpty()) {
                usuario.setApellido(null); // O puedes usar "" si prefieres cadena vacía
            }

            if (usuario.getNumeroTelefono() == null) {
                usuario.setNumeroTelefono(null);
            }

            // Configurar valores por defecto
            usuario.setActivo(true);
            usuario.setUltimaConexion(new Date());

            // Guardar usuario
            usuarioService.save(usuario, true);

            response.put("success", true);
            response.put("message", "Usuario creado exitosamente");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Error al crear el usuario: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
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

            response.put("success", true);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("error", "Error al actualizar el usuario: " + e.getMessage());
            response.put("success", false);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/actualizar-ultima-conexion")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> actualizarUltimaConexion(Authentication authentication) {
        Map<String, Object> response = new HashMap<>();

        try {
            if (authentication == null) {
                response.put("success", false);
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }

            String correoElectronico = authentication.getName();
            Usuario usuario = usuarioService.getUsuarioPorCorreo(correoElectronico);

            if (usuario != null) {
                usuario.setUltimaConexion(new Date());
                usuarioService.save(usuario, false);
                response.put("success", true);
                return ResponseEntity.ok(response);
            }

            response.put("success", false);
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Error al actualizar última conexión");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // Método para eliminar usuario
    @PostMapping("/eliminar/{id}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> eliminarUsuario(@PathVariable Long id, Authentication authentication) {
        Map<String, Object> response = new HashMap<>();

        try {
            // Verificar autenticación
            if (authentication == null) {
                response.put("success", false);
                response.put("error", "No autenticado");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }

            // Obtener el usuario autenticado
            Usuario usuarioAutenticado = usuarioService.getUsuarioPorCorreo(authentication.getName());

            // Verificar que el usuario autenticado es administrador
            boolean esAdmin = usuarioAutenticado.getRoles().stream()
                    .anyMatch(rol -> "ROL_ADMINISTRADOR".equals(rol.getNombre()));

            if (!esAdmin) {
                response.put("success", false);
                response.put("error", "Requiere rol de administrador");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            }

            // Obtener el usuario a eliminar
            Usuario usuario = usuarioService.getUsuarioPorId(id);
            if (usuario == null) {
                response.put("success", false);
                response.put("error", "Usuario no encontrado");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }

            // Verificar que no es el mismo usuario
            String currentUsername = authentication.getName();
            if (usuario.getCorreoElectronico().equals(currentUsername)) {
                response.put("success", false);
                response.put("error", "No puedes eliminarte a ti mismo");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

            // 1. Eliminar archivos asociados a tickets del usuario
            List<Ticket> ticketsUsuario = ticketService.getTicketsPorSolicitante(usuario);
            for (Ticket ticket : ticketsUsuario) {
                archivoTicketService.eliminarArchivosPorTicket(ticket.getIdTicket());
            }

            // 2. Eliminar mensajes del usuario
            mensajeService.eliminarMensajesPorUsuario(id);

            // 3. Eliminar tickets del usuario (como solicitante o asignado)
            ticketService.eliminarTicketsPorUsuario(id);

            // 4. Eliminar roles del usuario
            rolService.eliminarRolesPorUsuario(id);

            // 5. Finalmente eliminar el usuario
            usuarioService.delete(usuario);

            response.put("success", true);
            response.put("message", "Usuario eliminado exitosamente");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Error al eliminar el usuario: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // Método para solicitar cambio de contraseña (usuario logueado)
    @PostMapping("/solicitar-cambio-contrasena")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> solicitarCambioContrasena(Authentication authentication) {
        Map<String, Object> response = new HashMap<>();

        try {
            if (authentication == null) {
                response.put("error", "Usuario no autenticado");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }

            String correoElectronico = authentication.getName();
            Usuario usuario = usuarioService.getUsuarioPorCorreo(correoElectronico);

            if (usuario == null) {
                response.put("error", "Usuario no encontrado");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }

            // Invalidar cualquier token existente para este email
            invalidarTokensExistentesPorEmail(correoElectronico);

            // Generar token único para cambio de contraseña
            String token = UUID.randomUUID().toString();

            // Guardar token con tiempo de expiración (10 minutos)
            Map<String, Object> tokenData = new HashMap<>();
            tokenData.put("email", correoElectronico);
            tokenData.put("expiryTime", LocalDateTime.now().plusMinutes(10));
            tokenData.put("type", "CHANGE_PASSWORD"); // Diferenciar del reset

            passwordResetTokens.put(token, tokenData);

            // Enviar correo con enlace para cambiar contraseña
            emailService.sendPasswordChangeLink(correoElectronico, token);

            response.put("success", true);
            response.put("message", "Se ha enviado un enlace de cambio de contraseña a tu correo electrónico");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("error", "Error al procesar la solicitud: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

// Método para mostrar el formulario de cambio de contraseña (usuario logueado)
    @GetMapping("/cambiar-contrasena")
    public String mostrarCambiarContrasenaUsuario(@RequestParam String token, Model model) {
        // Verificar si el token existe y es válido
        if (!passwordResetTokens.containsKey(token)) {
            return "redirect:/usuario/perfil?error=token_invalido";
        }

        Map<String, Object> tokenData = passwordResetTokens.get(token);
        LocalDateTime expiryTime = (LocalDateTime) tokenData.get("expiryTime");
        String tokenType = (String) tokenData.get("type");

        // Verificar si el token ha expirado
        if (LocalDateTime.now().isAfter(expiryTime)) {
            passwordResetTokens.remove(token);
            return "redirect:/usuario/perfil?error=token_expirado";
        }

        // Verificar que es un token de cambio de contraseña
        if (!"CHANGE_PASSWORD".equals(tokenType)) {
            return "redirect:/usuario/perfil?error=token_invalido";
        }

        model.addAttribute("token", token);
        return "/usuario/cambiar-contrasena";
    }

// Método para procesar el cambio de contraseña (usuario logueado)
    @PostMapping("/cambiar-contrasena")
    public String procesarCambiarContrasenaUsuario(@RequestParam String token,
            @RequestParam String password,
            @RequestParam String confirmPassword,
            RedirectAttributes redirectAttrs) {

        // Verificar si el token existe y es válido
        if (!passwordResetTokens.containsKey(token)) {
            return "redirect:/usuario/perfil?error=token_invalido";
        }

        Map<String, Object> tokenData = passwordResetTokens.get(token);
        LocalDateTime expiryTime = (LocalDateTime) tokenData.get("expiryTime");
        String email = (String) tokenData.get("email");
        String tokenType = (String) tokenData.get("type");

        // Verificar si el token ha expirado
        if (LocalDateTime.now().isAfter(expiryTime)) {
            passwordResetTokens.remove(token);
            return "redirect:/usuario/perfil?error=token_expirado";
        }

        // Verificar que es un token de cambio de contraseña
        if (!"CHANGE_PASSWORD".equals(tokenType)) {
            return "redirect:/usuario/perfil?error=token_invalido";
        }

        // Verificar que las contraseñas coincidan
        if (!password.equals(confirmPassword)) {
            return "redirect:/usuario/cambiar-contrasena?token=" + token + "&error=password_mismatch";
        }

        try {
            // Obtener el usuario y actualizar la contraseña
            Usuario usuario = usuarioService.getUsuarioPorCorreo(email);
            if (usuario != null) {
                usuario.setContrasena(passwordEncoder.encode(password));
                usuarioService.save(usuario, false);
            }

            // Eliminar el token usado
            passwordResetTokens.remove(token);

            // Redirigir con parámetro de éxito para que el JavaScript pueda detectarlo
            return "redirect:/usuario/cambiar-contrasena?token=" + token + "&success=true";

        } catch (Exception e) {
            return "redirect:/usuario/cambiar-contrasena?token=" + token + "&error=update_failed";
        }
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
}
