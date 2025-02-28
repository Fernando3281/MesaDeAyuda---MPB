package com.mesadeayudaMPB.controller;

import com.mesadeayudaMPB.domain.Ticket;
import com.mesadeayudaMPB.domain.Usuario;
import com.mesadeayudaMPB.service.TicketService;
import com.mesadeayudaMPB.service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Date;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;

@Controller
@RequestMapping("/tickets")
public class TicketsController {

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private TicketService ticketService;

    @GetMapping("/listado")
    public String listado(Model model,
            Authentication authentication,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        if (authentication != null) {
            // Obtener todos los tickets con paginación
            Page<Ticket> ticketPage = ticketService.getTicketsPaginados(page, size);

            model.addAttribute("tickets", ticketPage.getContent());
            model.addAttribute("currentPage", page);
            model.addAttribute("totalPages", ticketPage.getTotalPages());
            model.addAttribute("totalItems", ticketPage.getTotalElements());
            model.addAttribute("pageSize", size);

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
            Ticket ticket = new Ticket();
            ticket.setIdTicket(id);
            Ticket ticketEncontrado = ticketService.getTicket(ticket);

            if (ticketEncontrado != null) {
                model.addAttribute("ticket", ticketEncontrado);

                // Verificar si hay imágenes y cuántas hay
                if (ticketEncontrado.getImagenes() != null) {
                    int numeroImagenes = ticketService.contarImagenes(ticketEncontrado.getImagenes());
                    model.addAttribute("numeroImagenes", numeroImagenes);
                }

                return "/tickets/manager";
            }
        }
        return "redirect:/login";
    }

// Endpoint para obtener una imagen específica
    @GetMapping("/imagen/{id}/{index}")
    @ResponseBody
    public ResponseEntity<byte[]> obtenerImagen(@PathVariable Long id, @PathVariable int index) {
        Ticket ticket = new Ticket();
        ticket.setIdTicket(id);
        Ticket ticketEncontrado = ticketService.getTicket(ticket);

        if (ticketEncontrado != null && ticketEncontrado.getImagenes() != null) {
            byte[] imagen = ticketService.obtenerImagenPorIndice(ticketEncontrado.getImagenes(), index);
            if (imagen != null) {
                return ResponseEntity.ok()
                        .contentType(MediaType.IMAGE_JPEG)
                        .body(imagen);
            }
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/nuevo")
    public String nuevo(Model model, Authentication authentication) {
        if (authentication != null) {
            String correoElectronico = authentication.getName();
            Usuario usuario = usuarioService.getUsuarioPorCorreo(correoElectronico);
            if (usuario != null) {
                model.addAttribute("usuario", usuario);
                return "/tickets/nuevo";
            }
        }
        return "redirect:/login";
    }

    @PostMapping("/guardar")
    public String guardarTicket(@RequestParam("titulo") String titulo,
            @RequestParam("descripcion") String descripcion,
            @RequestParam("categoria") String categoria,
            @RequestParam(value = "impacto", required = false) String impacto,
            @RequestParam("imagenes") List<MultipartFile> imagenes,
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

                    // Procesar imágenes
                    if (!imagenes.isEmpty()) {
                        byte[] imagenesBytes = ticketService.procesarImagenes(imagenes);
                        ticket.setImagenes(imagenesBytes);
                    }

                    ticket.setFechaActualizacion(new Date());
                    ticketService.save(ticket);
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
}
