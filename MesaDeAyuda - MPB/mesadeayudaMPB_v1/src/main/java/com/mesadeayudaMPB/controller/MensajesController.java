package com.mesadeayudaMPB.controller;

import com.mesadeayudaMPB.domain.Mensajes;
import com.mesadeayudaMPB.domain.Rol;
import com.mesadeayudaMPB.domain.Ticket;
import com.mesadeayudaMPB.domain.Usuario;
import com.mesadeayudaMPB.service.MensajeService;
import com.mesadeayudaMPB.service.TicketService;
import com.mesadeayudaMPB.service.UsuarioService;
import java.util.HashMap;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.http.HttpStatus;

@Controller
@RequestMapping("/mensajes")
public class MensajesController {

    @Autowired
    private MensajeService mensajeService;

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private TicketService ticketService;

    @GetMapping("/inbox")
    public String mostrarInbox(Model model, Authentication authentication) {
        if (authentication != null) {
            String correoElectronico = authentication.getName();
            Usuario usuario = usuarioService.getUsuarioPorCorreo(correoElectronico);
            if (usuario != null) {
                // Obtener todos los tickets que tengan mensajes asociados
                List<Ticket> tickets = ticketService.getTicketsConMensajes(usuario);
                model.addAttribute("tickets", tickets);
                model.addAttribute("usuario", usuario);

                // Si hay tickets, seleccionar el primero por defecto
                if (!tickets.isEmpty()) {
                    Ticket primerTicket = tickets.get(0);
                    model.addAttribute("selectedTicket", primerTicket);

                    // Obtener los mensajes del primer ticket
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
                // Obtener todos los tickets con mensajes del usuario
                List<Ticket> tickets = ticketService.getTicketsConMensajes(usuario);
                model.addAttribute("tickets", tickets);
                model.addAttribute("usuario", usuario);

                // Si se proporciona un ticketId, cargar sus mensajes
                if (ticketId != null) {
                    Ticket selectedTicket = ticketService.getTicketPorId(ticketId);
                    if (selectedTicket != null && tickets.contains(selectedTicket)) {
                        model.addAttribute("selectedTicket", selectedTicket);
                        
                        // Obtener todos los mensajes del ticket
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
            // Verificar que el usuario tiene permiso para ver este ticket
            String correoElectronico = authentication.getName();
            Usuario usuario = usuarioService.getUsuarioPorCorreo(correoElectronico);
            Ticket ticket = ticketService.getTicketPorId(ticketId);
            
            if (usuario != null && ticket != null) {
                // Verificar permisos: usuario es solicitante, soportista asignado o admin
                boolean tienePermiso = usuario.equals(ticket.getSolicitante()) || 
                                      usuario.equals(ticket.getAsignadoPara()) || 
                                      usuario.getRoles().stream()
                                          .anyMatch(r -> r.getNombre().equals("ROL_ADMINISTRADOR"));
                
                if (tienePermiso) {
                    // Obtener todos los mensajes del ticket
                    List<Mensajes> mensajes = mensajeService.obtenerMensajesPorTicket(ticketId);
                    
                    // Convertir a formato para el frontend
                    List<Map<String, Object>> mensajesFormateados = mensajes.stream()
                        .filter(m -> !m.isEsNotaInterna() || 
                            usuario.getRoles().stream()
                                .anyMatch(r -> r.getNombre().equals("ROL_SOPORTISTA") || 
                                              r.getNombre().equals("ROL_ADMINISTRADOR")))
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
                    response.put("ticket", Map.of(
                        "id", ticket.getIdTicket(),
                        "titulo", ticket.getTitulo(),
                        "codigo", ticket.getCodigo(),
                        "estado", ticket.getEstado()
                    ));
                    
                    return new ResponseEntity<>(response, HttpStatus.OK);
                }
            }
        }
        
        response.put("success", false);
        response.put("error", "No tiene permisos para ver estos mensajes");
        return new ResponseEntity<>(response, HttpStatus.FORBIDDEN);
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
            .filter(m -> !m.isEsNotaInterna() || 
                usuario.getRoles().stream()
                    .anyMatch(r -> r.getNombre().equals("ROL_SOPORTISTA") || 
                    r.getNombre().equals("ROL_ADMINISTRADOR")))
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

    @GetMapping("/ticket/{idTicket}")
    @ResponseBody
    public ResponseEntity<List<Map<String, Object>>> obtenerMensajesPorTicket(@PathVariable Long idTicket) {
        List<Mensajes> mensajes = mensajeService.obtenerMensajesPorTicket(idTicket);

        List<Map<String, Object>> mensajesDTO = mensajes.stream().map(m -> {
            Map<String, Object> dto = new HashMap<>();
            dto.put("id", m.getIdMensaje());
            dto.put("mensaje", m.getMensaje());
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

    @PostMapping
    @ResponseBody
    public ResponseEntity<Mensajes> guardarMensaje(@RequestBody Mensajes mensaje) {
        Mensajes mensajeGuardado = mensajeService.guardarMensaje(mensaje);
        return ResponseEntity.ok(mensajeGuardado);
    }
}
