package com.mesadeayudaMPB.controller;

import com.mesadeayudaMPB.domain.Mensajes;
import com.mesadeayudaMPB.domain.Rol;
import com.mesadeayudaMPB.domain.Ticket;
import com.mesadeayudaMPB.domain.Usuario;
import com.mesadeayudaMPB.service.AuditoriaService;
import com.mesadeayudaMPB.service.MensajeService;
import com.mesadeayudaMPB.service.TicketService;
import com.mesadeayudaMPB.service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;

@Controller
@RequestMapping("/mensajes")
public class MensajesController {

    @Autowired
    private MensajeService mensajeService;

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private TicketService ticketService;

    @Autowired
    private AuditoriaService auditoriaService;

    @GetMapping("/inbox")
public String mostrarInbox(Model model, Authentication authentication) {
    if (authentication != null) {
        String correoElectronico = authentication.getName();
        Usuario usuario = usuarioService.getUsuarioPorCorreo(correoElectronico);
        if (usuario != null) {
            // Obtener tickets donde el usuario es el solicitante y tienen mensajes
            List<Ticket> tickets = ticketService.getTicketsPorSolicitante(usuario).stream()
                .filter(ticket -> mensajeService.contarMensajesPorTicket(ticket.getIdTicket()) > 0)
                .collect(Collectors.toList());
                
            model.addAttribute("tickets", tickets);
            model.addAttribute("usuario", usuario);

            if (!tickets.isEmpty()) {
                Ticket primerTicket = tickets.get(0);
                model.addAttribute("selectedTicket", primerTicket);
                List<Mensajes> mensajes = mensajeService.obtenerMensajesPorTicket(primerTicket.getIdTicket());
                model.addAttribute("mensajes", mensajes);
            }
            return "mensajes/listado";
        }
    }
    return "redirect:/login";
}

@GetMapping("/listado")
public String mostrarMensajes(Model model, Authentication authentication,
        @RequestParam(required = false) Long ticketId) {
    if (authentication != null) {
        String correoElectronico = authentication.getName();
        Usuario usuario = usuarioService.getUsuarioPorCorreo(correoElectronico);

        if (usuario != null) {
            // Obtener tickets donde el usuario es el solicitante y tienen mensajes
            List<Ticket> tickets = ticketService.getTicketsPorSolicitante(usuario).stream()
                .filter(ticket -> mensajeService.contarMensajesPorTicket(ticket.getIdTicket()) > 0)
                .collect(Collectors.toList());
                
            model.addAttribute("tickets", tickets);
            model.addAttribute("usuario", usuario);

            if (ticketId != null) {
                // Verificar que el ticket pertenece al usuario
                Optional<Ticket> selectedTicket = tickets.stream()
                    .filter(t -> t.getIdTicket().equals(ticketId))
                    .findFirst();
                    
                if (selectedTicket.isPresent()) {
                    model.addAttribute("selectedTicket", selectedTicket.get());
                    List<Mensajes> mensajes = mensajeService.obtenerMensajesPorTicket(ticketId);
                    model.addAttribute("mensajes", mensajes);
                }
            }
            return "mensajes/listado";
        }
    }
    return "redirect:/login";
}

    @GetMapping("/cargar/{ticketId}")
@ResponseBody
public ResponseEntity<Map<String, Object>> cargarMensajesTicket(
        @PathVariable Long ticketId,
        Authentication authentication) {

    Map<String, Object> response = new HashMap<>();

    if (authentication != null) {
        String correoElectronico = authentication.getName();
        Usuario usuario = usuarioService.getUsuarioPorCorreo(correoElectronico);
        Ticket ticket = ticketService.getTicketPorId(ticketId);

        if (usuario != null && ticket != null) {
            // Verificar que el usuario es el solicitante del ticket
            if (!usuario.equals(ticket.getSolicitante())) {
                response.put("success", false);
                response.put("error", "No tiene permisos para ver estos mensajes");
                return new ResponseEntity<>(response, HttpStatus.FORBIDDEN);
            }

            List<Mensajes> mensajes = mensajeService.obtenerMensajesPorTicket(ticketId);

            List<Map<String, Object>> mensajesFormateados = mensajes.stream()
                .filter(m -> !m.isEsNotaInterna()) // Filtrar notas internas
                .map(m -> {
                    Map<String, Object> msg = new HashMap<>();
                    msg.put("id", m.getIdMensaje());
                    msg.put("contenido", m.getMensaje());
                    msg.put("fecha", m.getFechaHora());
                    msg.put("esNotaInterna", m.isEsNotaInterna());
                    msg.put("esMio", m.getEmisor().getIdUsuario().equals(usuario.getIdUsuario()));

                    Map<String, Object> emisor = new HashMap<>();
                    emisor.put("id", m.getEmisor().getIdUsuario());
                    emisor.put("nombre", m.getEmisor().getNombre());
                    emisor.put("apellido", m.getEmisor().getApellido());
                    emisor.put("tieneImagen", m.getEmisor().getImagen() != null && m.getEmisor().getImagen().length > 0);
                    emisor.put("rol", m.getEmisor().getRoles().stream()
                            .findFirst()
                            .map(Rol::getNombre)
                            .orElse("ROL_USUARIO"));

                    msg.put("emisor", emisor);
                    return msg;
                }).collect(Collectors.toList());

            response.put("success", true);
            response.put("mensajes", mensajesFormateados);
            response.put("ticket", Map.of(
                    "id", ticket.getIdTicket(),
                    "titulo", ticket.getTitulo(),
                    "codigo", ticket.getCodigo(),
                    "estado", ticket.getEstado()
            ));

            return new ResponseEntity<>(response, HttpStatus.OK);
        }
    }

    response.put("success", false);
    response.put("error", "No tiene permisos para ver estos mensajes");
    return new ResponseEntity<>(response, HttpStatus.FORBIDDEN);
}
    @PostMapping("/enviar")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> enviarMensaje(
            @RequestBody Map<String, Object> request,
            Authentication authentication) {

        Map<String, Object> response = new HashMap<>();

        try {
            // Verificar autenticación
            if (authentication == null) {
                response.put("success", false);
                response.put("error", "Usuario no autenticado");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }

            // Obtener datos del request
            Long ticketId = Long.valueOf(request.get("ticketId").toString());
            String contenido = request.get("contenido").toString();

            // Validar que el contenido no esté vacío
            if (contenido == null || contenido.trim().isEmpty()) {
                response.put("success", false);
                response.put("error", "El mensaje no puede estar vacío");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

            // Obtener usuario actual
            String correoElectronico = authentication.getName();
            Usuario usuario = usuarioService.getUsuarioPorCorreo(correoElectronico);

            if (usuario == null) {
                response.put("success", false);
                response.put("error", "Usuario no encontrado");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }

            // Obtener el ticket
            Ticket ticket = ticketService.getTicketPorId(ticketId);

            if (ticket == null) {
                response.put("success", false);
                response.put("error", "Ticket no encontrado");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }

            // Verificar permisos: usuario es solicitante, soportista asignado o admin
            boolean tienePermiso = usuario.equals(ticket.getSolicitante())
                    || usuario.equals(ticket.getAsignadoPara())
                    || usuario.getRoles().stream()
                            .anyMatch(r -> r.getNombre().equals("ROL_ADMINISTRADOR"));

            if (!tienePermiso) {
                response.put("success", false);
                response.put("error", "No tiene permisos para enviar mensajes en este ticket");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            }

            // Crear el nuevo mensaje
            Mensajes nuevoMensaje = new Mensajes();
            nuevoMensaje.setTicket(ticket);
            nuevoMensaje.setEmisor(usuario);
            nuevoMensaje.setMensaje(contenido);
            nuevoMensaje.setMensajeTextoPlano(contenido); // Puedes procesar el HTML aquí si es necesario
            nuevoMensaje.setFechaHora(new Date());
            nuevoMensaje.setEsNotaInterna(false); // Los mensajes normales no son notas internas

            // Determinar el receptor (opcional, dependiendo de tu lógica de negocio)
            if (usuario.equals(ticket.getSolicitante()) && ticket.getAsignadoPara() != null) {
                nuevoMensaje.setReceptor(ticket.getAsignadoPara());
            } else if (usuario.equals(ticket.getAsignadoPara()) && ticket.getSolicitante() != null) {
                nuevoMensaje.setReceptor(ticket.getSolicitante());
            }

            // Guardar el mensaje
            Mensajes mensajeGuardado = mensajeService.guardarMensaje(nuevoMensaje);

            if (mensajeGuardado != null) {
                response.put("success", true);
                response.put("message", "Mensaje enviado correctamente");
                response.put("mensajeId", mensajeGuardado.getIdMensaje());
                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("error", "Error al guardar el mensaje");
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
            }

        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Error interno del servidor: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/conversacion/{idMensaje}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> obtenerConversacionPorMensaje(@PathVariable Long idMensaje, Authentication authentication) {
        Map<String, Object> response = new HashMap<>();

        // Obtener el mensaje específico
        Mensajes mensaje = mensajeService.obtenerMensajePorId(idMensaje);
        if (mensaje == null) {
            return ResponseEntity.notFound().build();
        }

        // Obtener todos los mensajes del ticket asociado
        List<Mensajes> mensajesTicket = mensajeService.obtenerMensajesPorTicket(mensaje.getTicket().getIdTicket());

        // Obtener información del usuario autenticado
        String correoElectronico = authentication.getName();
        Usuario usuario = usuarioService.getUsuarioPorCorreo(correoElectronico);

        // Filtrar mensajes según permisos (mostrar notas internas solo para soporte/admin)
        List<Map<String, Object>> mensajesDTO = mensajesTicket.stream()
                .filter(m -> !m.isEsNotaInterna()
                || usuario.getRoles().stream()
                        .anyMatch(r -> r.getNombre().equals("ROL_SOPORTISTA")
                        || r.getNombre().equals("ROL_ADMINISTRADOR")))
                .map(m -> {
                    Map<String, Object> dto = new HashMap<>();
                    dto.put("id", m.getIdMensaje());
                    dto.put("mensaje", m.getMensaje());
                    dto.put("fechaHora", m.getFechaHora());
                    dto.put("esNotaInterna", m.isEsNotaInterna());
                    dto.put("esMensajeSeleccionado", m.getIdMensaje().equals(idMensaje));

                    // Datos del emisor - AGREGANDO INFORMACIÓN DE LA IMAGEN
                    Map<String, Object> emisor = new HashMap<>();
                    emisor.put("id", m.getEmisor().getIdUsuario());
                    emisor.put("nombre", m.getEmisor().getNombre());
                    emisor.put("apellido", m.getEmisor().getApellido());
                    // AGREGAR ESTA LÍNEA:
                    emisor.put("tieneImagen", m.getEmisor().getImagen() != null ? "true" : "false");
                    // OPCIONAL - También agregar el rol:
                    emisor.put("rol", m.getEmisor().getRoles().stream()
                            .findFirst()
                            .map(Rol::getNombre)
                            .orElse("ROL_USUARIO"));

                    dto.put("emisor", emisor);

                    return dto;
                }).collect(Collectors.toList());

        response.put("conversacion", mensajesDTO);
        response.put("ticketId", mensaje.getTicket().getIdTicket());
        response.put("ticketCodigo", mensaje.getTicket().getCodigo());
        response.put("ticketTitulo", mensaje.getTicket().getTitulo());

        return ResponseEntity.ok(response);
    }

    @GetMapping("/ticket/{idTicket}")
    @ResponseBody
    public ResponseEntity<List<Map<String, Object>>> obtenerMensajesPorTicket(@PathVariable Long idTicket) {
        List<Mensajes> mensajes = mensajeService.obtenerMensajesPorTicket(idTicket);

        List<Map<String, Object>> mensajesDTO = mensajes.stream().map(m -> {
            Map<String, Object> dto = new HashMap<>();
            dto.put("id", m.getIdMensaje());
            dto.put("mensaje", m.getMensaje()); // HTML formateado
            dto.put("mensajeTextoPlano", m.getMensajeTextoPlano()); // Texto plano
            dto.put("fechaHora", m.getFechaHora());
            dto.put("esNotaInterna", m.isEsNotaInterna());

            // Datos del emisor
            Map<String, Object> emisor = new HashMap<>();
            emisor.put("id", m.getEmisor().getIdUsuario());
            emisor.put("nombre", m.getEmisor().getNombre());
            emisor.put("apellido", m.getEmisor().getApellido());
            dto.put("emisor", emisor);

            return dto;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(mensajesDTO);
    }

    // Endpoint para eliminar mensaje
    @DeleteMapping("/{idMensaje}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> eliminarMensaje(
            @PathVariable Long idMensaje,
            Authentication authentication) {

        Map<String, Object> response = new HashMap<>();

        if (authentication == null) {
            response.put("success", false);
            response.put("error", "Usuario no autenticado");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        String correoElectronico = authentication.getName();
        Usuario usuario = usuarioService.getUsuarioPorCorreo(correoElectronico);

        if (usuario == null) {
            response.put("success", false);
            response.put("error", "Usuario no encontrado");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

        // Obtener el mensaje antes de eliminarlo para registrar en auditoría
        Mensajes mensaje = mensajeService.obtenerMensajePorId(idMensaje);
        if (mensaje == null) {
            response.put("success", false);
            response.put("error", "Mensaje no encontrado");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

        // Verificar permisos: solo el emisor o un administrador puede eliminar
        boolean puedeEliminar = mensaje.getEmisor().equals(usuario)
                || usuario.getRoles().stream()
                        .anyMatch(r -> r.getNombre().equals("ROL_ADMINISTRADOR"));

        if (!puedeEliminar) {
            response.put("success", false);
            response.put("error", "No tienes permisos para eliminar este mensaje");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        }

        boolean eliminado = mensajeService.eliminarMensaje(idMensaje, usuario.getIdUsuario());

        if (eliminado) {
            // Registrar la eliminación en auditoría
            String tipoMensaje = mensaje.isEsNotaInterna() ? "NOTA_INTERNA" : "RESPUESTA_PUBLICA";
            String accion = mensaje.isEsNotaInterna() ? "Nota interna eliminada" : "Respuesta pública eliminada";

            // Modificado para mostrar el mensaje eliminado en valorAnterior
            auditoriaService.registrarAccion(
                    mensaje.getTicket(),
                    "ELIMINACION_" + tipoMensaje,
                    accion,
                    "Mensaje Eliminado: " + mensaje.getMensajeTextoPlano(),
                    null,
                    usuario
            );

            response.put("success", true);
            response.put("message", "Mensaje eliminado correctamente");
            return ResponseEntity.ok(response);
        } else {
            response.put("success", false);
            response.put("error", "No se pudo eliminar el mensaje");
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // Nuevo endpoint para búsqueda y filtrado
    @GetMapping("/filtro")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> filtrarMensajes(
            @RequestParam Long ticketId,
            @RequestParam(required = false) String searchTerm,
            @RequestParam(required = false) String filterType,
            Authentication authentication) {

        Map<String, Object> response = new HashMap<>();

        if (authentication == null) {
            response.put("success", false);
            response.put("error", "Usuario no autenticado");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        String correoElectronico = authentication.getName();
        Usuario usuario = usuarioService.getUsuarioPorCorreo(correoElectronico);

        List<Mensajes> mensajes;
        long totalMensajes = 0;

        if (searchTerm != null && !searchTerm.isEmpty()) {
            // Búsqueda por texto
            mensajes = mensajeService.buscarEnTicket(ticketId, searchTerm);
            totalMensajes = mensajes.size();
        } else if (filterType != null && !filterType.isEmpty()) {
            // Filtrado por tipo
            switch (filterType) {
                case "usuario":
                    mensajes = mensajeService.filtrarPorUsuario(ticketId, usuario.getIdUsuario());
                    totalMensajes = mensajeService.contarMensajesPorUsuario(ticketId, usuario.getIdUsuario());
                    break;
                case "soporte":
                    mensajes = mensajeService.filtrarPorTipo(ticketId, false);
                    totalMensajes = mensajeService.contarMensajesPorTipo(ticketId, false);
                    break;
                case "notas":
                    mensajes = mensajeService.filtrarPorTipo(ticketId, true);
                    totalMensajes = mensajeService.contarMensajesPorTipo(ticketId, true);
                    break;
                default:
                    mensajes = mensajeService.obtenerMensajesPorTicket(ticketId);
                    totalMensajes = mensajeService.contarMensajesPorTicket(ticketId);
            }
        } else {
            // Todos los mensajes
            mensajes = mensajeService.obtenerMensajesPorTicket(ticketId);
            totalMensajes = mensajeService.contarMensajesPorTicket(ticketId);
        }

        // Formatear los mensajes para la respuesta
        List<Map<String, Object>> mensajesFormateados = mensajes.stream()
                .filter(m -> !m.isEsNotaInterna()
                || usuario.getRoles().stream()
                        .anyMatch(r -> r.getNombre().equals("ROL_SOPORTISTA")
                        || r.getNombre().equals("ROL_ADMINISTRADOR")))
                .map(m -> {
                    Map<String, Object> msg = new HashMap<>();
                    msg.put("id", m.getIdMensaje());
                    msg.put("contenido", m.getMensaje());
                    msg.put("fecha", m.getFechaHora());
                    msg.put("esNotaInterna", m.isEsNotaInterna());
                    msg.put("esMio", m.getEmisor().getIdUsuario().equals(usuario.getIdUsuario()));

                    // Información del emisor
                    Map<String, String> emisor = new HashMap<>();
                    emisor.put("id", m.getEmisor().getIdUsuario().toString());
                    emisor.put("nombre", m.getEmisor().getNombre() + " " + m.getEmisor().getApellido());
                    emisor.put("rol", m.getEmisor().getRoles().stream()
                            .findFirst()
                            .map(Rol::getNombre)
                            .orElse("ROL_USUARIO"));

                    msg.put("emisor", emisor);

                    return msg;
                }).collect(Collectors.toList());

        response.put("success", true);
        response.put("mensajes", mensajesFormateados);
        response.put("totalMensajes", totalMensajes);

        return ResponseEntity.ok(response);
    }
}
