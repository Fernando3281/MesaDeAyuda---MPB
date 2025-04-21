package com.mesadeayudaMPB.controller;

import com.mesadeayudaMPB.domain.ImagenTicket;
import com.mesadeayudaMPB.domain.Mensajes;
import com.mesadeayudaMPB.domain.Ticket;
import com.mesadeayudaMPB.domain.Usuario;
import com.mesadeayudaMPB.service.ImagenTicketService;
import com.mesadeayudaMPB.service.MensajeService;
import com.mesadeayudaMPB.service.TicketService;
import com.mesadeayudaMPB.service.UsuarioService;
import java.text.SimpleDateFormat;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.Arrays;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Date;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.HashMap;

import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/tickets")
public class TicketsController {

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private TicketService ticketService;

    @Autowired
    private ImagenTicketService imagenTicketService;

    @Autowired
    private MensajeService mensajeService;

    @GetMapping("/listado")
    public String listado(Model model,
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        if (authentication != null) {
            // Obtener todos los tickets con paginación
            Page<Ticket> ticketPage = ticketService.getTicketsPaginados(page, size);

            // Calcular el rango de páginas a mostrar (máximo 5 páginas)
            int totalPages = ticketPage.getTotalPages();
            int startPage = Math.max(0, page - 2); // Página inicial del rango
            int endPage = Math.min(totalPages - 1, page + 2); // Página final del rango

            // Ajustar el rango si estamos cerca del inicio o del final
            if (endPage - startPage < 4) {
                startPage = Math.max(0, endPage - 4);
            }
            if (endPage - startPage < 4) {
                endPage = Math.min(totalPages - 1, startPage + 4);
            }

            // Agregar los datos al modelo
            model.addAttribute("tickets", ticketPage.getContent());
            model.addAttribute("currentPage", page);
            model.addAttribute("totalPages", totalPages);
            model.addAttribute("totalItems", ticketPage.getTotalElements());
            model.addAttribute("pageSize", size);
            model.addAttribute("startPage", startPage);
            model.addAttribute("endPage", endPage);

            // Calcular información de paginación
            int start = page * size + 1;
            int end = Math.min((page + 1) * size, (int) ticketPage.getTotalElements());
            model.addAttribute("start", start);
            model.addAttribute("end", end);

            // Obtener información del usuario autenticado
            String correoElectronico = authentication.getName();
            Usuario usuario = usuarioService.getUsuarioPorCorreo(correoElectronico);
            if (usuario != null) {
                model.addAttribute("usuario", usuario);
            }

            return "/tickets/listado";
        }
        return "redirect:/login";
    }

    @GetMapping("/manager/{id}")
    public String managerTicket(@PathVariable Long id, Model model, Authentication authentication) {
        if (authentication != null) {
            Ticket ticket = ticketService.getTicketPorId(id);
            if (ticket != null) {
                // Obtener las imágenes asociadas al ticket (si es necesario)
                List<ImagenTicket> imagenes = imagenTicketService.obtenerImagenesPorTicket(id);
                boolean tieneImagenes = !imagenes.isEmpty();

                // Obtener información del usuario autenticado
                String correoElectronico = authentication.getName();
                Usuario usuarioActual = usuarioService.getUsuarioPorCorreo(correoElectronico);

                // Verificar si el usuario es soportista
                boolean esSoportista = usuarioActual.getRoles().stream()
                        .anyMatch(rol -> "ROL_SOPORTISTA".equals(rol.getNombre()));

                // Agregar los atributos al modelo
                model.addAttribute("ticket", ticket);
                model.addAttribute("esSoportista", esSoportista);
                model.addAttribute("esAdmin", esAdmin(usuarioActual));
                model.addAttribute("tieneImagenes", tieneImagenes);
                model.addAttribute("imagenesInfo", imagenes.stream().map(img -> {
                    Map<String, Object> info = new HashMap<>();
                    info.put("id", img.getIdImagen());
                    info.put("nombre", img.getNombreArchivo());
                    info.put("tipo", img.getTipoArchivo());
                    return info;
                }).collect(Collectors.toList()));

                // Obtener los mensajes relacionados con el ticket
                List<Mensajes> mensajes = mensajeService.obtenerMensajesPorTicket(id);

                // Agregar el ticket, las imágenes y los mensajes al modelo
                model.addAttribute("ticket", ticket);
                model.addAttribute("tieneImagenes", !imagenes.isEmpty());
                model.addAttribute("mensajes", mensajes);

                return "/tickets/manager";
            }
        }
        return "redirect:/login";
    }

    // Método auxiliar para verificar permisos
    private boolean puedeEditarTicket(Usuario usuario, Ticket ticket) {
        // El usuario puede editar si:
        // 1. Es ADMIN
        // 2. Es el solicitante del ticket
        // 3. Es el soportista asignado al ticket
        return esAdmin(usuario)
                || usuario.equals(ticket.getSolicitante())
                || usuario.equals(ticket.getAsignadoPara());
    }

    private boolean esAdmin(Usuario usuario) {
        return usuario.getRoles().stream()
                .anyMatch(rol -> "ROL_ADMINISTRADOR".equals(rol.getNombre()));
    }

    @GetMapping("/imagenes/{id}")
    @ResponseBody
    public ResponseEntity<List<Map<String, Object>>> obtenerImagenesPorTicket(@PathVariable Long id) {
        List<ImagenTicket> imagenes = imagenTicketService.obtenerImagenesPorTicket(id);

        if (imagenes.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        List<Map<String, Object>> imagenesData = imagenes.stream().map(img -> {
            Map<String, Object> data = new HashMap<>();
            data.put("id", img.getIdImagen());
            data.put("nombre", img.getNombreArchivo());
            data.put("tipo", img.getTipoArchivo());
            return data;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(imagenesData);
    }

    @GetMapping("/nuevo")
    public String nuevo(Model model, Authentication authentication) {
        if (authentication != null) {
            String correoElectronico = authentication.getName();
            Usuario usuario = usuarioService.getUsuarioPorCorreo(correoElectronico);
            if (usuario != null) {
                // Obtener tickets abiertos del usuario
                List<Ticket> ticketsAbiertos = ticketService.getTicketsPorSolicitanteYEstado(usuario, "Abierto");
                model.addAttribute("ticketsAbiertos", ticketsAbiertos);
                model.addAttribute("usuario", usuario);
                return "/tickets/nuevo";
            }
        }
        return "redirect:/login";
    }

    @PostMapping("/guardar")
    public String guardarTicket(
            @RequestParam("titulo") String titulo,
            @RequestParam("descripcion") String descripcion,
            @RequestParam("categoria") String categoria,
            @RequestParam(value = "impacto", required = false) String impacto,
            @RequestParam(value = "imagenes", required = false) MultipartFile[] imagenes,
            Authentication authentication,
            RedirectAttributes redirectAttributes) {

        try {
            if (authentication != null) {
                String correoElectronico = authentication.getName();
                Usuario usuario = usuarioService.getUsuarioPorCorreo(correoElectronico);

                if (usuario != null) {
                    Ticket ticket = new Ticket();
                    ticket.setCodigo(ticketService.generarCodigoTicket());
                    ticket.setFechaApertura(new Date());
                    ticket.setSolicitante(usuario);
                    ticket.setTitulo(titulo);
                    ticket.setDescripcion(descripcion);
                    ticket.setPrioridad("Sin Asignar");
                    ticket.setEstado("Abierto");
                    ticket.setCategoria(categoria);
                    ticket.setImpacto(impacto);
                    ticket.setFechaActualizacion(new Date());
                    ticketService.save(ticket);

                    // Guardar las imágenes si están presentes
                    if (imagenes != null && imagenes.length > 0) {
                        for (MultipartFile imagen : imagenes) {
                            if (!imagen.isEmpty()) {
                                byte[] imagenBytes = imagen.getBytes();
                                String nombreArchivo = imagen.getOriginalFilename();
                                String tipoArchivo = imagen.getContentType();
                                imagenTicketService.guardarImagen(ticket.getIdTicket(), imagenBytes, nombreArchivo, tipoArchivo);
                            }
                        }
                    }

                    redirectAttributes.addFlashAttribute("success", "Ticket creado exitosamente");
                    return "redirect:/tickets/listado";
                }
            }
            return "redirect:/login";
        } catch (Exception e) {
            redirectAttributes.addFlashAttribute("error", "Error al crear el ticket: " + e.getMessage());
            return "redirect:/tickets/nuevo";
        }
    }

    @GetMapping("/perfil-solicitante/{id}")
    public String verPerfilSolicitante(@PathVariable Long id, Model model, Authentication authentication) {
        if (authentication != null) {
            // Obtener el usuario actual (manager)
            Usuario usuarioActual = usuarioService.getUsuarioPorCorreo(authentication.getName());

            // Obtener el usuario solicitante (dueño del ticket)
            Usuario usuarioSolicitante = usuarioService.getUsuarioPorId(id);

            // Agregar esta línea para verificar si el usuario es soportista
            boolean esSoportista = usuarioActual.getRoles().stream()
                    .anyMatch(rol -> "ROL_SOPORTISTA".equals(rol.getNombre()));

            model.addAttribute("esSoportista", esSoportista);

            if (usuarioSolicitante != null) {
                // Agregar datos al modelo
                model.addAttribute("usuario", usuarioSolicitante);
                model.addAttribute("usuarioActual", usuarioActual);

                // Obtener la fecha de última conexión
                model.addAttribute("ultimaConexion", usuarioSolicitante.getUltimaConexion());

                // Calcular la fecha de ingreso (sin modificar la base de datos)
                LocalDateTime fechaIngreso = usuarioSolicitante.getUltimaConexion() != null
                        ? usuarioSolicitante.getUltimaConexion().toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime()
                        : LocalDateTime.now();
                model.addAttribute("fechaIngreso", fechaIngreso);

                // Retornar la vista del perfil del solicitante
                return "tickets/perfil-solicitante";
            }
        }
        return "redirect:/login";
    }

    @PostMapping("/atender/{idTicket}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> atenderTicket(
            @PathVariable Long idTicket,
            Authentication authentication) {

        Map<String, Object> response = new HashMap<>();
        String correoElectronico = authentication.getName();
        Usuario usuario = usuarioService.getUsuarioPorCorreo(correoElectronico);

        if (usuario != null) {
            // Verificar si el usuario es SOPORTISTA o ADMINISTRADOR
            boolean esSoportista = usuario.getRoles().stream()
                    .anyMatch(rol -> "ROL_SOPORTISTA".equals(rol.getNombre()));
            boolean esAdmin = usuario.getRoles().stream()
                    .anyMatch(rol -> "ROL_ADMINISTRADOR".equals(rol.getNombre()));

            if (esSoportista || esAdmin) {
                Ticket ticket = ticketService.getTicketPorId(idTicket);
                if (ticket != null) {
                    // Verificar si el ticket ya está asignado a otro usuario
                    if (ticket.getAsignadoPara() != null && !ticket.getAsignadoPara().equals(usuario)) {
                        response.put("success", false);
                        response.put("error", "Este ticket ya está asignado a otro usuario.");
                        return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
                    }

                    // Asignar el ticket al usuario actual
                    ticket.setAsignadoPara(usuario);
                    ticket.setEstado("Pendiente");
                    ticket.setFechaActualizacion(new Date());
                    ticketService.save(ticket);

                    response.put("success", true);
                    response.put("asignadoParaNombre", usuario.getNombre() + " " + usuario.getApellido());
                    response.put("habilitarMensajes", true);
                    response.put("habilitarBotones", true);

                    return ResponseEntity.ok(response);
                } else {
                    response.put("success", false);
                    response.put("error", "Ticket no encontrado.");
                    return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
                }
            } else {
                response.put("success", false);
                response.put("error", "No tiene permisos para atender tickets.");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            }
        } else {
            response.put("success", false);
            response.put("error", "Usuario no autenticado.");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }
    }

    @PostMapping("/responder/{idTicket}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> responderTicket(
            @PathVariable Long idTicket,
            @RequestParam String respuesta,
            @RequestParam(required = false, defaultValue = "false") boolean esNotaInterna,
            Authentication authentication) {

        Map<String, Object> response = new HashMap<>();
        String correoElectronico = authentication.getName();
        Usuario usuario = usuarioService.getUsuarioPorCorreo(correoElectronico);

        if (usuario != null) {
            Ticket ticket = ticketService.getTicketPorId(idTicket);
            if (ticket != null) {
                // Verificar que el usuario tenga permiso para responder
                if (!puedeEditarTicket(usuario, ticket)) {
                    response.put("success", false);
                    response.put("error", "No tiene permisos para responder este ticket.");
                    return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
                }

                Mensajes mensaje = new Mensajes();
                mensaje.setTicket(ticket);
                mensaje.setEmisor(usuario);
                mensaje.setReceptor(ticket.getSolicitante());
                mensaje.setMensaje(respuesta);
                mensaje.setFechaHora(new Date());
                mensaje.setEsNotaInterna(esNotaInterna);

                // Guardar el mensaje
                mensajeService.guardarMensaje(mensaje);

                // Formatear la fecha
                SimpleDateFormat dateFormat = new SimpleDateFormat("dd/MM/yyyy, hh:mm:ss a");
                String fechaFormateada = dateFormat.format(mensaje.getFechaHora());

                // Construir la respuesta JSON
                response.put("success", true);
                response.put("mensaje", mensaje.getMensaje());
                response.put("emisorNombre", mensaje.getEmisor().getNombre() + " " + mensaje.getEmisor().getApellido());
                response.put("esNotaInterna", mensaje.isEsNotaInterna());
                response.put("fechaHora", fechaFormateada);

                return ResponseEntity.ok(response);
            } else {
                response.put("success", false);
                response.put("error", "Ticket no encontrado.");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }
        } else {
            response.put("success", false);
            response.put("error", "No tiene permisos para responder tickets.");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        }
    }

    @PostMapping("/nota-interna/{idTicket}")
    public ResponseEntity<String> enviarNotaInterna(@PathVariable Long idTicket, @RequestBody String nota, Authentication authentication) {
        String correoElectronico = authentication.getName();
        Usuario usuario = usuarioService.getUsuarioPorCorreo(correoElectronico);

        if (usuario != null && usuario.getRoles().stream().anyMatch(rol -> rol.getNombre().equals("ROL_SOPORTISTA"))) {
            Ticket ticket = ticketService.getTicketPorId(idTicket);
            if (ticket != null) {
                Mensajes mensaje = new Mensajes();
                mensaje.setTicket(ticket);
                mensaje.setEmisor(usuario);
                mensaje.setReceptor(ticket.getSolicitante());
                mensaje.setMensaje(nota);
                mensaje.setFechaHora(new Date());
                mensaje.setEsNotaInterna(true);

                mensajeService.guardarMensaje(mensaje);

                return ResponseEntity.ok("Nota interna enviada correctamente.");
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Ticket no encontrado.");
            }
        } else {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tiene permisos para enviar notas internas.");
        }
    }

    @PostMapping("/asignar-prioridad/{idTicket}")
    public String asignarPrioridad(
            @PathVariable Long idTicket,
            @RequestParam String prioridad,
            Authentication authentication,
            RedirectAttributes redirectAttributes) {

        // Validar que la prioridad no sea "Sin Asignar"
        if ("Sin Asignar".equals(prioridad)) {
            redirectAttributes.addFlashAttribute("error", "No puedes guardar el ticket con la prioridad 'Sin asignar'.");
            return "redirect:/tickets/manager/" + idTicket;
        }

        String correoElectronico = authentication.getName();
        Usuario usuario = usuarioService.getUsuarioPorCorreo(correoElectronico);

        if (usuario != null) {
            // Verificar si el usuario es SOPORTISTA o ADMINISTRADOR
            boolean esSoportista = usuario.getRoles().stream().anyMatch(rol -> "ROL_SOPORTISTA".equals(rol.getNombre()));
            boolean esAdmin = usuario.getRoles().stream().anyMatch(rol -> "ROL_ADMINISTRADOR".equals(rol.getNombre()));

            if (esSoportista || esAdmin) {
                Ticket ticket = ticketService.getTicketPorId(idTicket);

                if (ticket != null) {
                    // Si es soportista, verificar que esté asignado a él
                    if (esSoportista && !usuario.equals(ticket.getAsignadoPara())) {
                        redirectAttributes.addFlashAttribute("error", "No tienes permisos para asignar prioridad a este ticket.");
                        return "redirect:/tickets/manager/" + idTicket;
                    }

                    // Asignar la prioridad al ticket
                    ticket.setPrioridad(prioridad);
                    // Actualizar la fecha de actualización
                    ticket.setFechaActualizacion(new Date());
                    ticketService.save(ticket); // Guardar cambios

                    // Mensaje de éxito
                    redirectAttributes.addFlashAttribute("success", "Prioridad actualizada correctamente.");
                } else {
                    redirectAttributes.addFlashAttribute("error", "Ticket no encontrado.");
                }
            } else {
                redirectAttributes.addFlashAttribute("error", "No tiene permisos para asignar prioridad.");
            }
        } else {
            redirectAttributes.addFlashAttribute("error", "Usuario no autenticado.");
        }

        // Redirigir de vuelta a la página del ticket
        return "redirect:/tickets/manager/" + idTicket;
    }

    @PostMapping("/cerrarTicket")
    public String cerrarTicket(@RequestParam("idTicket") Long idTicket,
            @RequestParam(value = "comentario", required = false) String comentarioCierre,
            Authentication authentication,
            RedirectAttributes redirectAttributes) {

        if (authentication != null) {
            String correoElectronico = authentication.getName();
            Usuario usuarioActual = usuarioService.getUsuarioPorCorreo(correoElectronico);

            if (usuarioActual != null) {
                Ticket ticket = new Ticket();
                ticket.setIdTicket(idTicket);
                Ticket ticketExistente = ticketService.getTicket(ticket);

                if (ticketExistente != null) {
                    // Actualizar el estado del ticket a "Resuelto"
                    ticketExistente.setEstado("Resuelto");
                    ticketExistente.setFechaActualizacion(new Date());

                    // Si no tiene asignado, asignar al usuario actual que lo está cerrando
                    if (ticketExistente.getAsignadoPara() == null) {
                        ticketExistente.setAsignadoPara(usuarioActual);
                    }

                    // Guardar el ticket actualizado
                    ticketService.save(ticketExistente);

                    // Mensaje de éxito
                    redirectAttributes.addFlashAttribute("success", "Ticket cerrado exitosamente");
                    return "redirect:/tickets/manager/" + idTicket;
                } else {
                    redirectAttributes.addFlashAttribute("error", "No se encontró el ticket");
                }
            }
        }
        return "redirect:/login";
    }

    @GetMapping("/usuarios/soportistas")
    @ResponseBody
    public ResponseEntity<List<Map<String, String>>> getSoportistas() {
        // Obtener usuarios con roles ROLE_SUPPORTER o ROLE_ADMIN
        List<Usuario> usuarios = usuarioService.getUsuariosPorRoles(
                Arrays.asList("ROL_SOPORTISTA", "ROL_ADMINISTRADOR")
        );

        // Mapear a una estructura más simple para el frontend
        List<Map<String, String>> soportistas = usuarios.stream()
                .map(usuario -> {
                    Map<String, String> userMap = new HashMap<>();
                    userMap.put("id", usuario.getIdUsuario().toString());
                    userMap.put("nombreCompleto", usuario.getNombre() + " " + usuario.getApellido());
                    userMap.put("correo", usuario.getCorreoElectronico());
                    return userMap;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(soportistas);
    }

    @PostMapping("/asignar")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> asignarTicket(
            @RequestBody Map<String, Object> requestBody,
            Authentication authentication) {

        Map<String, Object> response = new HashMap<>();
        String correoElectronico = authentication.getName();
        Usuario usuario = usuarioService.getUsuarioPorCorreo(correoElectronico);

        // Verificar si el usuario es ADMIN
        boolean isAdmin = usuario.getRoles().stream()
                .anyMatch(rol -> "ROL_SOPORTISTA".equals(rol.getNombre()));

        if (!isAdmin) {
            response.put("success", false);
            response.put("error", "No tiene permisos para asignar tickets.");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        }

        String soportistaId = (String) requestBody.get("soportistaId");
        Long ticketId = Long.valueOf((String) requestBody.get("ticketId"));

        Usuario soportista = usuarioService.getUsuarioPorId(Long.valueOf(soportistaId));
        Ticket ticket = ticketService.getTicketPorId(ticketId);

        if (soportista != null && ticket != null) {
            // Asignar el ticket al soportista
            ticket.setAsignadoPara(soportista);
            ticket.setEstado("Pendiente");
            ticket.setFechaActualizacion(new Date());
            ticketService.save(ticket);

            response.put("success", true);
            response.put("message", "Ticket asignado correctamente.");
            return ResponseEntity.ok(response);
        } else {
            response.put("success", false);
            response.put("error", "Soportista o ticket no encontrado.");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }
    }

    @PostMapping("/desactivar/{idTicket}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> desactivarTicket(
            @PathVariable("idTicket") Long idTicket, // Asegurar nombre consistente
            Authentication authentication) {

        Map<String, Object> response = new HashMap<>();

        try {
            // Validación robusta del usuario
            Usuario usuario = usuarioService.getUsuarioPorCorreo(authentication.getName());

            // Buscar ticket con manejo de excepciones
            Ticket ticket = ticketService.getTicketPorId(idTicket);
            if (ticket == null) {
                response.put("success", false);
                response.put("error", "Ticket no encontrado");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }

            // Lógica de desactivación
            ticket.setEstado("Desactivado");
            ticket.setFechaActualizacion(new Date());
            ticketService.save(ticket);

            response.put("success", true);
            response.put("nuevoEstado", ticket.getEstado());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Error interno: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/reabrir/{idTicket}")
    public String reabrirTicket(
            @PathVariable Long idTicket,
            Authentication authentication,
            RedirectAttributes redirectAttributes) {

        if (authentication != null) {
            Ticket ticket = ticketService.getTicketPorId(idTicket);
            if (ticket != null && "Resuelto".equals(ticket.getEstado())) {
                ticket.setEstado("Pendiente");
                ticket.setFechaActualizacion(new Date());
                ticketService.save(ticket);

                redirectAttributes.addFlashAttribute("success", "Ticket reabierto correctamente");
                return "redirect:/tickets/manager/" + idTicket;
            }
        }
        redirectAttributes.addFlashAttribute("error", "No se pudo reabrir el ticket");
        return "redirect:/tickets/manager/" + idTicket;
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

                    // Datos del emisor
                    Map<String, Object> emisor = new HashMap<>();
                    emisor.put("id", m.getEmisor().getIdUsuario());
                    emisor.put("nombre", m.getEmisor().getNombre());
                    emisor.put("apellido", m.getEmisor().getApellido());
                    dto.put("emisor", emisor);

                    return dto;
                }).collect(Collectors.toList());

        response.put("conversacion", mensajesDTO);
        response.put("ticketId", mensaje.getTicket().getIdTicket());
        response.put("ticketCodigo", mensaje.getTicket().getCodigo());
        response.put("ticketTitulo", mensaje.getTicket().getTitulo());

        return ResponseEntity.ok(response);
    }
}
