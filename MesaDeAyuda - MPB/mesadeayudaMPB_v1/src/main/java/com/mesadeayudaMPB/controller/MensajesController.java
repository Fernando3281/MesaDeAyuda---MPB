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
                // Cambio importante: usar getTicketsPorSolicitante en lugar de getTicketsPorUsuario
                List<Ticket> tickets = ticketService.getTicketsPorSolicitante(usuario).stream()
                        .filter(ticket -> mensajeService.contarMensajesVisiblesPorTicket(ticket.getIdTicket(), usuario) > 0)
                        .sorted((t1, t2) -> {
                            Date fecha1 = mensajeService.obtenerUltimoMensajeFechaVisible(t1.getIdTicket(), usuario);
                            Date fecha2 = mensajeService.obtenerUltimoMensajeFechaVisible(t2.getIdTicket(), usuario);
                            if (fecha1 == null && fecha2 == null) {
                                return 0;
                            }
                            if (fecha1 == null) {
                                return 1;
                            }
                            if (fecha2 == null) {
                                return -1;
                            }
                            return fecha2.compareTo(fecha1);
                        })
                        .collect(Collectors.toList());

                model.addAttribute("tickets", tickets);
                model.addAttribute("usuario", usuario);

                if (!tickets.isEmpty()) {
                    Ticket primerTicket = tickets.get(0);
                    model.addAttribute("selectedTicket", primerTicket);
                    List<Mensajes> mensajes = mensajeService.obtenerMensajesVisiblesPorTicket(primerTicket.getIdTicket(), usuario);
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
                // Cambio importante: usar getTicketsPorSolicitante
                List<Ticket> tickets = ticketService.getTicketsPorSolicitante(usuario).stream()
                        .filter(ticket -> mensajeService.contarMensajesVisiblesPorTicket(ticket.getIdTicket(), usuario) > 0)
                        .sorted((t1, t2) -> {
                            Date fecha1 = mensajeService.obtenerUltimoMensajeFechaVisible(t1.getIdTicket(), usuario);
                            Date fecha2 = mensajeService.obtenerUltimoMensajeFechaVisible(t2.getIdTicket(), usuario);
                            if (fecha1 == null && fecha2 == null) {
                                return 0;
                            }
                            if (fecha1 == null) {
                                return 1;
                            }
                            if (fecha2 == null) {
                                return -1;
                            }
                            return fecha2.compareTo(fecha1);
                        })
                        .collect(Collectors.toList());

                model.addAttribute("tickets", tickets);
                model.addAttribute("usuario", usuario);

                if (ticketId != null) {
                    Optional<Ticket> selectedTicket = tickets.stream()
                            .filter(t -> t.getIdTicket().equals(ticketId))
                            .findFirst();

                    if (selectedTicket.isPresent()) {
                        model.addAttribute("selectedTicket", selectedTicket.get());
                        List<Mensajes> mensajes = mensajeService.obtenerMensajesVisiblesPorTicket(ticketId, usuario);
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

        if (authentication == null) {
            response.put("success", false);
            response.put("error", "Usuario no autenticado");
            return new ResponseEntity<>(response, HttpStatus.UNAUTHORIZED);
        }

        String correoElectronico = authentication.getName();
        Usuario usuario = usuarioService.getUsuarioPorCorreo(correoElectronico);
        Ticket ticket = ticketService.getTicketPorId(ticketId);

        if (usuario == null || ticket == null || !usuario.equals(ticket.getSolicitante())) {
            response.put("success", false);
            response.put("error", "No tiene permisos para ver estos mensajes");
            return new ResponseEntity<>(response, HttpStatus.FORBIDDEN);
        }

        List<Mensajes> mensajes = mensajeService.obtenerMensajesVisiblesPorTicket(ticketId, usuario);

        List<Map<String, Object>> mensajesFormateados = mensajes.stream()
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
                "estado", ticket.getEstado(),
                "prioridad", ticket.getPrioridad() != null ? ticket.getPrioridad() : "No definida",
                "categoria", ticket.getCategoria() != null ? ticket.getCategoria() : "No definida",
                "fechaActualizacion", mensajeService.obtenerUltimoMensajeFechaVisible(ticketId, usuario) != null
                ? mensajeService.obtenerUltimoMensajeFechaVisible(ticketId, usuario)
                : ticket.getFechaActualizacion()
        ));

        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PostMapping("/enviar")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> enviarMensaje(
            @RequestBody Map<String, Object> request,
            Authentication authentication) {

        Map<String, Object> response = new HashMap<>();

        try {
            if (authentication == null) {
                response.put("success", false);
                response.put("error", "Usuario no autenticado");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }

            Long ticketId = Long.valueOf(request.get("ticketId").toString());
            String contenido = request.get("contenido").toString();

            if (contenido == null || contenido.trim().isEmpty()) {
                response.put("success", false);
                response.put("error", "El mensaje no puede estar vacío");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

            String correoElectronico = authentication.getName();
            Usuario usuario = usuarioService.getUsuarioPorCorreo(correoElectronico);

            if (usuario == null) {
                response.put("success", false);
                response.put("error", "Usuario no encontrado");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }

            Ticket ticket = ticketService.getTicketPorId(ticketId);

            if (ticket == null) {
                response.put("success", false);
                response.put("error", "Ticket no encontrado");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }

            boolean tienePermiso = usuario.equals(ticket.getSolicitante())
                    || usuario.equals(ticket.getAsignadoPara())
                    || usuario.getRoles().stream()
                            .anyMatch(r -> r.getNombre().equals("ROL_ADMINISTRADOR"));

            if (!tienePermiso) {
                response.put("success", false);
                response.put("error", "No tiene permisos para enviar mensajes en este ticket");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            }

            Mensajes nuevoMensaje = new Mensajes();
            nuevoMensaje.setTicket(ticket);
            nuevoMensaje.setEmisor(usuario);
            nuevoMensaje.setMensaje(contenido);
            nuevoMensaje.setMensajeTextoPlano(contenido);
            nuevoMensaje.setFechaHora(new Date());
            nuevoMensaje.setEsNotaInterna(false); // Siempre falso, ya que la interfaz no permite notas internas

            if (usuario.equals(ticket.getSolicitante()) && ticket.getAsignadoPara() != null) {
                nuevoMensaje.setReceptor(ticket.getAsignadoPara());
            } else if (usuario.equals(ticket.getAsignadoPara()) && ticket.getSolicitante() != null) {
                nuevoMensaje.setReceptor(ticket.getSolicitante());
            }

            ticket.setFechaActualizacion(new Date());
            ticketService.actualizarTicket(ticket);

            Mensajes mensajeGuardado = mensajeService.guardarMensaje(nuevoMensaje);

            if (mensajeGuardado != null) {
                auditoriaService.registrarAccion(
                        ticket,
                        "RESPUESTA_PUBLICA",
                        "Respuesta pública añadida",
                        "Mensaje: " + mensajeGuardado.getMensajeTextoPlano(),
                        null,
                        usuario
                );

                Map<String, Object> mensajeResponse = new HashMap<>();
                mensajeResponse.put("id", mensajeGuardado.getIdMensaje());
                mensajeResponse.put("contenido", mensajeGuardado.getMensaje());
                mensajeResponse.put("fecha", mensajeGuardado.getFechaHora());
                mensajeResponse.put("esNotaInterna", mensajeGuardado.isEsNotaInterna());
                mensajeResponse.put("esMio", true);
                Map<String, Object> emisor = new HashMap<>();
                emisor.put("id", usuario.getIdUsuario());
                emisor.put("nombre", usuario.getNombre());
                emisor.put("apellido", usuario.getApellido());
                emisor.put("rol", usuario.getRoles().stream()
                        .findFirst()
                        .map(Rol::getNombre)
                        .orElse("ROL_USUARIO"));
                mensajeResponse.put("emisor", emisor);

                response.put("success", true);
                response.put("message", "Mensaje enviado correctamente");
                response.put("mensajeId", mensajeGuardado.getIdMensaje());
                response.put("nuevoMensaje", mensajeResponse);
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

        Mensajes mensaje = mensajeService.obtenerMensajePorId(idMensaje);
        if (mensaje == null) {
            return ResponseEntity.notFound().build();
        }

        String correoElectronico = authentication.getName();
        Usuario usuario = usuarioService.getUsuarioPorCorreo(correoElectronico);

        List<Mensajes> mensajesTicket = mensajeService.obtenerMensajesVisiblesPorTicket(mensaje.getTicket().getIdTicket(), usuario);

        List<Map<String, Object>> mensajesDTO = mensajesTicket.stream()
                .map(m -> {
                    Map<String, Object> dto = new HashMap<>();
                    dto.put("id", m.getIdMensaje());
                    dto.put("mensaje", m.getMensaje());
                    dto.put("fechaHora", m.getFechaHora());
                    dto.put("esNotaInterna", m.isEsNotaInterna());
                    dto.put("esMensajeSeleccionado", m.getIdMensaje().equals(idMensaje));

                    Map<String, Object> emisor = new HashMap<>();
                    emisor.put("id", m.getEmisor().getIdUsuario());
                    emisor.put("nombre", m.getEmisor().getNombre());
                    emisor.put("apellido", m.getEmisor().getApellido());
                    emisor.put("tieneImagen", m.getEmisor().getImagen() != null ? "true" : "false");
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
    public ResponseEntity<List<Map<String, Object>>> obtenerMensajesPorTicket(@PathVariable Long idTicket, Authentication authentication) {
        String correoElectronico = authentication.getName();
        Usuario usuario = usuarioService.getUsuarioPorCorreo(correoElectronico);

        if (usuario == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        List<Mensajes> mensajes = mensajeService.obtenerMensajesVisiblesPorTicket(idTicket, usuario);

        List<Map<String, Object>> mensajesDTO = mensajes.stream().map(m -> {
            Map<String, Object> dto = new HashMap<>();
            dto.put("id", m.getIdMensaje());
            dto.put("mensaje", m.getMensaje());
            dto.put("mensajeTextoPlano", m.getMensajeTextoPlano());
            dto.put("fechaHora", m.getFechaHora());
            dto.put("esNotaInterna", m.isEsNotaInterna());

            Map<String, Object> emisor = new HashMap<>();
            emisor.put("id", m.getEmisor().getIdUsuario());
            emisor.put("nombre", m.getEmisor().getNombre());
            emisor.put("apellido", m.getEmisor().getApellido());
            dto.put("emisor", emisor);

            return dto;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(mensajesDTO);
    }

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

        Mensajes mensaje = mensajeService.obtenerMensajePorId(idMensaje);
        if (mensaje == null) {
            response.put("success", false);
            response.put("error", "Mensaje no encontrado");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

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
            String tipoMensaje = mensaje.isEsNotaInterna() ? "NOTA_INTERNA" : "RESPUESTA_PUBLICA";
            String accion = mensaje.isEsNotaInterna() ? "Nota interna eliminada" : "Respuesta pública eliminada";

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
            mensajes = mensajeService.buscarEnTicket(ticketId, searchTerm);
            totalMensajes = mensajes.size();
        } else if (filterType != null && !filterType.isEmpty()) {
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
                    mensajes = mensajeService.obtenerMensajesVisiblesPorTicket(ticketId, usuario);
                    totalMensajes = mensajeService.contarMensajesVisiblesPorTicket(ticketId, usuario);
            }
        } else {
            mensajes = mensajeService.obtenerMensajesVisiblesPorTicket(ticketId, usuario);
            totalMensajes = mensajeService.contarMensajesVisiblesPorTicket(ticketId, usuario);
        }

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

    @GetMapping("/tickets/actualizados")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> obtenerTicketsActualizados(Authentication authentication) {
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

        // Obtener solo los tickets donde el usuario es el solicitante
        List<Ticket> tickets = ticketService.getTicketsPorSolicitante(usuario).stream()
                .filter(ticket -> mensajeService.contarMensajesVisiblesPorTicket(ticket.getIdTicket(), usuario) > 0)
                .collect(Collectors.toList());

        // Ordenar por fecha de actualización descendente
        tickets = tickets.stream()
                .sorted((t1, t2) -> {
                    Date date1 = mensajeService.obtenerUltimoMensajeFechaVisible(t1.getIdTicket(), usuario);
                    Date date2 = mensajeService.obtenerUltimoMensajeFechaVisible(t2.getIdTicket(), usuario);
                    if (date1 == null && date2 == null) {
                        return 0;
                    }
                    if (date1 == null) {
                        return 1;
                    }
                    if (date2 == null) {
                        return -1;
                    }
                    return date2.compareTo(date1);
                })
                .collect(Collectors.toList());

        List<Map<String, Object>> ticketsFormateados = tickets.stream().map(ticket -> {
            Map<String, Object> ticketMap = new HashMap<>();
            ticketMap.put("id", ticket.getIdTicket());
            ticketMap.put("codigo", ticket.getCodigo());
            ticketMap.put("titulo", ticket.getTitulo());
            ticketMap.put("estado", ticket.getEstado());
            Date ultimaActividad = mensajeService.obtenerUltimoMensajeFechaVisible(ticket.getIdTicket(), usuario);
            ticketMap.put("fechaActualizacion", ultimaActividad != null ? ultimaActividad : ticket.getFechaActualizacion());
            return ticketMap;
        }).collect(Collectors.toList());

        response.put("success", true);
        response.put("tickets", ticketsFormateados);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/verificar-nuevos/{ticketId}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> verificarNuevosMensajes(
            @PathVariable Long ticketId,
            @RequestParam Long ultimoMensajeId,
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

        boolean hayNuevos = mensajeService.hayNuevosMensajesVisibles(ticketId, ultimoMensajeId, usuario);

        response.put("success", true);
        response.put("hayNuevos", hayNuevos);

        if (hayNuevos) {
            Date ultimaFecha = mensajeService.obtenerUltimoMensajeFechaVisible(ticketId, usuario);
            response.put("ultimaFecha", ultimaFecha);
        }

        return ResponseEntity.ok(response);
    }
}
