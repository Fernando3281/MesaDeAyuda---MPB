package com.mesadeayudaMPB.controller;

import com.mesadeayudaMPB.domain.ArchivoTicket;
import com.mesadeayudaMPB.domain.Auditoria;
import com.mesadeayudaMPB.domain.Categoria;
import com.mesadeayudaMPB.domain.Mensajes;
import com.mesadeayudaMPB.domain.Ticket;
import com.mesadeayudaMPB.domain.Usuario;
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
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.springframework.data.domain.Page;
import org.jsoup.Jsoup;
import org.jsoup.safety.Safelist;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.servlet.mvc.support.RedirectAttributes;
import com.mesadeayudaMPB.service.ArchivoTicketService;
import com.mesadeayudaMPB.service.AuditoriaService;
import com.mesadeayudaMPB.service.CategoriaService;
import java.io.IOException;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.concurrent.TimeUnit;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.transaction.annotation.Transactional;

@Controller
@RequestMapping("/tickets")
public class TicketsController {

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private TicketService ticketService;

    @Autowired
    private ArchivoTicketService archivoTicketService;

    @Autowired
    private MensajeService mensajeService;

    @Autowired
    private CategoriaService categoriaService;

    @Autowired
    private AuditoriaService auditoriaService;

    private static final Logger logger = LoggerFactory.getLogger(TicketsController.class);

    @GetMapping("/listado")
public String listado(Model model,
        Authentication authentication,
        @RequestParam(defaultValue = "0") int page,
        @RequestParam(defaultValue = "15") int size,
        @RequestParam(defaultValue = "fechaApertura") String sortField,
        @RequestParam(defaultValue = "desc") String sortDirection,
        @RequestParam(required = false) String search,
        @RequestParam(required = false) String filter_fechaAperturaFrom,
        @RequestParam(required = false) String filter_fechaAperturaTo,
        @RequestParam(required = false) String filter_fechaActualizacionFrom,
        @RequestParam(required = false) String filter_fechaActualizacionTo,
        @RequestParam Map<String, String> allParams) {

    if (authentication != null) {
        // Validar el tamaño de página
        List<Integer> allowedPageSizes = Arrays.asList(15, 30, 50, 100, 200, 500, 1000);
        if (!allowedPageSizes.contains(size)) {
            size = 15;
        }

            // Configurar el ordenamiento
            Sort sort = Sort.by(sortField);
            sort = sortDirection.equalsIgnoreCase("asc") ? sort.ascending() : sort.descending();
            Pageable pageable = PageRequest.of(page, size, sort);

            // Extraer filtros de columnas
            Map<String, String> columnFilters = new HashMap<>();
            allParams.forEach((key, value) -> {
                if (key.startsWith("filter_") && !value.isEmpty()
                        && !key.equals("filter_fechaAperturaFrom")
                        && !key.equals("filter_fechaAperturaTo")
                        && !key.equals("filter_fechaActualizacionFrom")
                        && !key.equals("filter_fechaActualizacionTo")) {
                    columnFilters.put(key.replace("filter_", ""), value);
                }
            });

            Page<Ticket> ticketPage;

            // Si hay filtros activos
            if (!columnFilters.isEmpty() || (search != null && !search.isEmpty())
                    || (filter_fechaAperturaFrom != null && !filter_fechaAperturaFrom.isEmpty())
                    || (filter_fechaAperturaTo != null && !filter_fechaAperturaTo.isEmpty())
                    || (filter_fechaActualizacionFrom != null && !filter_fechaActualizacionFrom.isEmpty())
                    || (filter_fechaActualizacionTo != null && !filter_fechaActualizacionTo.isEmpty())) {

                List<Ticket> filteredTickets = ticketService.buscarTicketsPorFiltrosAvanzados(
                        columnFilters, search,
                        filter_fechaAperturaFrom, filter_fechaAperturaTo,
                        filter_fechaActualizacionFrom, filter_fechaActualizacionTo);

                // Aplicar ordenamiento manualmente a los resultados filtrados
                Comparator<Ticket> comparator = getComparator(sortField);
                filteredTickets.sort(sortDirection.equalsIgnoreCase("asc") ? comparator : comparator.reversed());

                // Implementar paginación manual
                int start = (int) pageable.getOffset();
                int end = Math.min((start + pageable.getPageSize()), filteredTickets.size());
                List<Ticket> pageContent = filteredTickets.subList(start, end);

                ticketPage = new PageImpl<>(pageContent, pageable, filteredTickets.size());
            } else {
                // Sin filtros - usar paginación normal
                ticketPage = ticketService.getTicketsPaginados(pageable);
            }

            // Configurar paginación para la vista
            int totalPages = ticketPage.getTotalPages();
            int currentPage = ticketPage.getNumber();
            int startPage = Math.max(0, currentPage - 2);
            int endPage = Math.min(totalPages - 1, currentPage + 2);

            if (endPage - startPage < 4) {
                startPage = Math.max(0, endPage - 4);
            }
            if (endPage - startPage < 4) {
                endPage = Math.min(totalPages - 1, startPage + 4);
            }

            model.addAttribute("tickets", ticketPage.getContent());
            model.addAttribute("currentPage", currentPage);
            model.addAttribute("totalPages", totalPages);
            model.addAttribute("totalItems", ticketPage.getTotalElements());
            model.addAttribute("pageSize", size);
            model.addAttribute("startPage", startPage);
            model.addAttribute("endPage", endPage);
            model.addAttribute("sortField", sortField);
            model.addAttribute("sortDirection", sortDirection);
            model.addAttribute("search", search);

            int startItem = currentPage * size + 1;
            int endItem = Math.min((currentPage + 1) * size, (int) ticketPage.getTotalElements());
            model.addAttribute("start", startItem);
            model.addAttribute("end", endItem);

            return "/tickets/listado";
        }
        return "redirect:/login";
    }

    private Comparator<Ticket> getComparator(String sortField) {
        switch (sortField.toLowerCase()) {
            case "codigo":
                return Comparator.comparing(Ticket::getCodigo);
            case "fechaapertura":
                return Comparator.comparing(Ticket::getFechaApertura);
            case "titulo":
                return Comparator.comparing(Ticket::getTitulo);
            case "solicitante":
                return Comparator.comparing(t -> t.getSolicitante().getNombre());
            case "prioridad":
                return Comparator.comparing(Ticket::getPrioridad);
            case "estado":
                return Comparator.comparing(Ticket::getEstado);
            case "categoria":
                return Comparator.comparing(Ticket::getCategoria);
            case "asignadopara":
                return Comparator.comparing(
                        t -> t.getAsignadoPara() != null ? t.getAsignadoPara().getNombre() : "",
                        Comparator.nullsLast(Comparator.naturalOrder())
                );
            case "fechaactualizacion":
                return Comparator.comparing(Ticket::getFechaActualizacion);
            default:
                return Comparator.comparing(Ticket::getFechaApertura);
        }
    }

    @GetMapping("/manager/{id}")
    public String managerTicket(@PathVariable Long id, Model model, Authentication authentication) {
        if (authentication != null) {
            Ticket ticket = ticketService.getTicketPorId(id);
            if (ticket != null) {
                // Obtener el último registro de auditoría para este ticket
                List<Auditoria> historial = auditoriaService.obtenerHistorialPorTicketId(id);

                // Buscar el último usuario que modificó el ticket
                String lastUpdatedBy = historial.stream()
                        .filter(a -> a.getUsuario() != null)
                        .max(Comparator.comparing(Auditoria::getFechaAccion))
                        .map(a -> a.getUsuario().getNombre() + " " + a.getUsuario().getApellido())
                        .orElse("Sistema");

                // Agregar al modelo
                model.addAttribute("lastUpdatedBy", lastUpdatedBy);

                List<ArchivoTicket> archivos = archivoTicketService.obtenerArchivosPorTicket(id);
                boolean tieneArchivos = !archivos.isEmpty();

                String correoElectronico = authentication.getName();
                Usuario usuarioActual = usuarioService.getUsuarioPorCorreo(correoElectronico);

                List<Categoria> categoriasActivas = categoriaService.getCategoriasActivas();
                model.addAttribute("categoriasActivas", categoriasActivas);

                boolean esSoportista = usuarioActual.getRoles().stream()
                        .anyMatch(rol -> "ROL_SOPORTISTA".equals(rol.getNombre()));

                List<Map<String, Object>> archivosInfo = archivos.stream().map(archivo -> {
                    Map<String, Object> info = new HashMap<>();
                    info.put("id", archivo.getIdArchivo());
                    info.put("nombre", archivo.getNombreArchivo());
                    info.put("tipo", archivo.getTipoArchivo());
                    return info;
                }).collect(Collectors.toList());

                // Obtener historial de auditoría
                List<Auditoria> historialAuditoria = auditoriaService.obtenerHistorialPorTicketId(id);
                model.addAttribute("historialAuditoria", historialAuditoria);

                model.addAttribute("ticket", ticket);
                model.addAttribute("esSoportista", esSoportista);
                model.addAttribute("esAdmin", esAdmin(usuarioActual));
                model.addAttribute("tieneArchivos", tieneArchivos);
                model.addAttribute("archivosInfo", archivosInfo);
                model.addAttribute("usuarioActual", usuarioActual);

                List<Mensajes> mensajes = mensajeService.obtenerMensajesPorTicket(id);
                model.addAttribute("mensajes", mensajes);

                return "/tickets/manager";
            }
        }
        return "redirect:/login";
    }

    private boolean puedeEditarTicket(Usuario usuario, Ticket ticket) {
        // Si el ticket está cerrado y fue creado por un soportista que es el usuario actual
        if ("Cerrado".equals(ticket.getEstado())) {
            boolean esCreadorSoportista = ticket.getSolicitante().getRoles().stream()
                    .anyMatch(rol -> "ROL_SOPORTISTA".equals(rol.getNombre()));

            if (esCreadorSoportista && usuario.equals(ticket.getSolicitante())) {
                return true;
            }
        }

        return esAdmin(usuario)
                || usuario.equals(ticket.getSolicitante())
                || usuario.equals(ticket.getAsignadoPara())
                || usuario.getRoles().stream().anyMatch(rol -> "ROL_SOPORTISTA".equals(rol.getNombre()));
    }

    private boolean esAdmin(Usuario usuario) {
        return usuario.getRoles().stream()
                .anyMatch(rol -> "ROL_ADMINISTRADOR".equals(rol.getNombre()));
    }

    @GetMapping("/imagenes/{id}")
    @ResponseBody
    public ResponseEntity<List<Map<String, Object>>> obtenerImagenesPorTicket(@PathVariable Long id) {
        List<ArchivoTicket> imagenes = archivoTicketService.obtenerArchivosPorTicket(id);

        if (imagenes.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        List<Map<String, Object>> imagenesData = imagenes.stream().map(img -> {
            Map<String, Object> data = new HashMap<>();
            data.put("id", img.getIdArchivo());
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
                List<Ticket> ticketsAbiertos = ticketService.getTicketsPorSolicitanteYEstado(usuario, "Abierto");
                model.addAttribute("ticketsAbiertos", ticketsAbiertos);
                model.addAttribute("usuario", usuario);

                List<Categoria> categoriasActivas = categoriaService.getCategoriasActivas();
                model.addAttribute("categorias", categoriasActivas);

                boolean esAdmin = usuario.getRoles().stream()
                        .anyMatch(rol -> "ROL_ADMINISTRADOR".equals(rol.getNombre()));
                boolean esSoportista = usuario.getRoles().stream()
                        .anyMatch(rol -> "ROL_SOPORTISTA".equals(rol.getNombre()));

                model.addAttribute("esAdmin", esAdmin);
                model.addAttribute("esSoportista", esSoportista);

                if (esAdmin || esSoportista) {
                    List<Usuario> usuariosAsignables = new ArrayList<>();

                    if (esAdmin) {
                        usuariosAsignables = usuarioService.getUsuariosPorRoles(
                                Arrays.asList("ROL_SOPORTISTA", "ROL_ADMINISTRADOR"));
                    } else if (esSoportista) {
                        usuariosAsignables = usuarioService.getUsuariosPorRoles(
                                Arrays.asList("ROL_SOPORTISTA"));
                    }

                    model.addAttribute("usuariosAsignables", usuariosAsignables);
                }

                return "tickets/nuevo";
            }
        }
        return "redirect:/login";
    }

    @PostMapping("/guardar")
    public String guardarTicket(
            @RequestParam("titulo") String titulo,
            @RequestParam("descripcion") String descripcion,
            @RequestParam("categoria") Long idCategoria,
            @RequestParam(value = "impacto", required = false) String impacto,
            @RequestParam(value = "imagenes", required = false) MultipartFile[] imagenes,
            @RequestParam(value = "estado", required = false) String estado,
            @RequestParam(value = "prioridad", required = false) String prioridad,
            @RequestParam(value = "asignadoParaId", required = false) Long asignadoParaId,
            Authentication authentication,
            RedirectAttributes redirectAttributes) {

        try {
            if (authentication != null) {
                String correoElectronico = authentication.getName();
                Usuario usuario = usuarioService.getUsuarioPorCorreo(correoElectronico);

                if (usuario != null) {
                    Categoria categoria = categoriaService.getCategoriaPorId(idCategoria);
                    if (categoria == null) {
                        redirectAttributes.addFlashAttribute("error", "La categoría seleccionada no es válida");
                        return "redirect:/tickets/nuevo";
                    }

                    Ticket ticket = new Ticket();
                    ticket.setCodigo(ticketService.generarCodigoTicket());
                    ticket.setFechaApertura(new Date());
                    ticket.setSolicitante(usuario);
                    ticket.setTitulo(titulo);
                    ticket.setDescripcion(descripcion);
                    ticket.setCategoria(categoria.getNombre());
                    ticket.setImpacto(impacto != null && !impacto.isEmpty() ? impacto : "Sin Asignar");
                    ticket.setFechaActualizacion(new Date());

                    boolean esAdminOSoporte = usuario.getRoles().stream()
                            .anyMatch(rol -> "ROL_SOPORTISTA".equals(rol.getNombre())
                            || "ROL_ADMINISTRADOR".equals(rol.getNombre()));

                    if (esAdminOSoporte) {
                        ticket.setEstado(estado != null ? estado : "Abierto");
                        ticket.setPrioridad(prioridad != null ? prioridad : "Sin Asignar");

                        if (asignadoParaId != null) {
                            Usuario soportista = usuarioService.getUsuarioPorId(asignadoParaId);
                            if (soportista != null) {
                                ticket.setAsignadoPara(soportista);
                            }
                        }
                    } else {
                        ticket.setEstado("Abierto");
                        ticket.setPrioridad("Sin Asignar");
                    }

                    ticketService.save(ticket);

                    // Registrar creación en auditoría
                    auditoriaService.registrarAccion(
                            ticket,
                            "CREACION",
                            "Ticket creado por",
                            null,
                            "Nuevo ticket: " + ticket.getCodigo() + " - " + ticket.getTitulo(),
                            usuario
                    );

                    if (imagenes != null && imagenes.length > 0) {
                        for (MultipartFile archivo : imagenes) {
                            if (!archivo.isEmpty()) {
                                byte[] bytesArchivo = archivo.getBytes();
                                String nombreArchivo = archivo.getOriginalFilename();
                                String tipoArchivo = archivo.getContentType();
                                archivoTicketService.guardarArchivo(ticket.getIdTicket(), bytesArchivo, nombreArchivo, tipoArchivo);
                            }
                        }
                    }

                    redirectAttributes.addFlashAttribute("success", "Ticket creado exitosamente");
                    return "redirect:/tickets/listado";
                }
            }
            return "redirect:/login";
        } catch (IOException e) {
            redirectAttributes.addFlashAttribute("error", "Error al crear el ticket: " + e.getMessage());
            return "redirect:/tickets/nuevo";
        }
    }

    @GetMapping("/perfil-solicitante/{id}")
    public String verPerfilSolicitante(@PathVariable Long id, Model model, Authentication authentication) {
        if (authentication != null) {
            Usuario usuarioActual = usuarioService.getUsuarioPorCorreo(authentication.getName());
            Usuario usuarioSolicitante = usuarioService.getUsuarioPorId(id);

            boolean esSoportista = usuarioActual.getRoles().stream()
                    .anyMatch(rol -> "ROL_SOPORTISTA".equals(rol.getNombre()));

            model.addAttribute("esSoportista", esSoportista);

            if (usuarioSolicitante != null) {
                // Obtener los últimos 10 tickets del solicitante ordenados por fecha descendente
                List<Ticket> ticketsRecientes = ticketService.getTicketsPorSolicitante(usuarioSolicitante)
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
                model.addAttribute("usuario", usuarioSolicitante);
                model.addAttribute("usuarioActual", usuarioActual);
                model.addAttribute("ultimaConexion", usuarioSolicitante.getUltimaConexion());

                LocalDateTime fechaIngreso = usuarioSolicitante.getUltimaConexion() != null
                        ? usuarioSolicitante.getUltimaConexion().toInstant().atZone(ZoneId.systemDefault()).toLocalDateTime()
                        : LocalDateTime.now();
                model.addAttribute("fechaIngreso", fechaIngreso);

                return "tickets/perfil-solicitante";
            }
        }
        return "redirect:/login";
    }

    @PostMapping("/actualizar/{idTicket}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> actualizarTicket(
            @PathVariable Long idTicket,
            @RequestBody Map<String, String> ticketData,
            Authentication authentication) {

        Map<String, Object> response = new HashMap<>();
        String correoElectronico = authentication.getName();
        Usuario usuario = usuarioService.getUsuarioPorCorreo(correoElectronico);

        try {
            if (usuario == null) {
                response.put("success", false);
                response.put("error", "Usuario no autenticado.");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }

            Ticket ticket = ticketService.getTicketPorId(idTicket);
            if (ticket == null) {
                response.put("success", false);
                response.put("error", "Ticket no encontrado.");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }

            if (!puedeEditarTicket(usuario, ticket)) {
                response.put("success", false);
                response.put("error", "No tiene permisos para editar este ticket.");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            }

            // Crear mapa para registrar cambios
            Map<String, String> cambios = new LinkedHashMap<>(); // Usamos LinkedHashMap para mantener orden

            // Registrar cambios en descripción (sin resumir)
            String nuevaDescripcion = ticketData.get("descripcion");
            if (!ticket.getDescripcion().equals(nuevaDescripcion)) {
                cambios.put("Descripción", ticket.getDescripcion() + " → " + nuevaDescripcion);
            }

            // Resto de campos (mantener el formato existente)
            if (!ticket.getCodigo().equals(ticketData.get("codigo"))) {
                cambios.put("Código", ticket.getCodigo() + " → " + ticketData.get("codigo"));
            }
            if (!ticket.getImpacto().equals(ticketData.get("impacto"))) {
                cambios.put("Impacto", ticket.getImpacto() + " → " + ticketData.get("impacto"));
            }
            if (!ticket.getCategoria().equals(ticketData.get("categoria"))) {
                cambios.put("Categoría", ticket.getCategoria() + " → " + ticketData.get("categoria"));
            }
            if (!ticket.getPrioridad().equals(ticketData.get("prioridad"))) {
                cambios.put("Prioridad", ticket.getPrioridad() + " → " + ticketData.get("prioridad"));
            }
            if (!ticket.getEstado().equals(ticketData.get("estado"))) {
                cambios.put("Estado", ticket.getEstado() + " → " + ticketData.get("estado"));
            }
            if (!ticket.getTitulo().equals(ticketData.get("titulo"))) {
                cambios.put("Título", ticket.getTitulo() + " → " + ticketData.get("titulo"));
            }

            // Actualizar campos del ticket
            ticket.setCodigo(ticketData.get("codigo"));
            ticket.setImpacto(ticketData.get("impacto"));
            ticket.setCategoria(ticketData.get("categoria"));
            ticket.setPrioridad(ticketData.get("prioridad"));
            ticket.setEstado(ticketData.get("estado"));
            ticket.setTitulo(ticketData.get("titulo"));
            ticket.setDescripcion(nuevaDescripcion);
            ticket.setFechaActualizacion(new Date());

            ticketService.save(ticket);

            // Registrar en auditoría solo si hay cambios
            if (!cambios.isEmpty()) {
                String cambiosAnteriores = cambios.entrySet().stream()
                        .map(e -> e.getKey() + ": " + e.getValue().split(" → ")[0])
                        .collect(Collectors.joining(", "));

                String cambiosNuevos = cambios.entrySet().stream()
                        .map(e -> e.getKey() + ": " + e.getValue().split(" → ")[1])
                        .collect(Collectors.joining(", "));

                auditoriaService.registrarAccion(
                        ticket,
                        "ACTUALIZACION",
                        "Ticket actualizado",
                        cambiosAnteriores,
                        cambiosNuevos,
                        usuario
                );
            }

            response.put("success", true);
            response.put("message", "Ticket actualizado correctamente.");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Error al actualizar ticket ID: " + idTicket, e);
            response.put("success", false);
            response.put("error", "Error al actualizar el ticket: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
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
            boolean esSoportista = usuario.getRoles().stream()
                    .anyMatch(rol -> "ROL_SOPORTISTA".equals(rol.getNombre()));
            boolean esAdmin = usuario.getRoles().stream()
                    .anyMatch(rol -> "ROL_ADMINISTRADOR".equals(rol.getNombre()));

            if (esSoportista || esAdmin) {
                Ticket ticket = ticketService.getTicketPorId(idTicket);
                if (ticket != null) {
                    // Verificar si ya estaba asignado a alguien
                    boolean estabaAsignado = ticket.getAsignadoPara() != null;
                    String asignadoAnterior = estabaAsignado
                            ? ticket.getAsignadoPara().getNombre() + " " + ticket.getAsignadoPara().getApellido()
                            : "Sin asignar";

                    // Determinar el tipo de acción y mensaje
                    String accion = "ASIGNACION";
                    String detalle;
                    String mensajeAuditoria;

                    if (estabaAsignado) {
                        // Si ya estaba asignado, registrar que el nuevo usuario lo está atendiendo
                        detalle = "El ticket fue atendido por";
                        mensajeAuditoria = "El usuario " + usuario.getNombre() + " " + usuario.getApellido()
                                + " atendió el ticket que estaba asignado a " + asignadoAnterior;
                    } else {
                        // Si no estaba asignado, registrar la asignación normal
                        detalle = "Ticket atendido directamente por el soportista";
                        mensajeAuditoria = "Ticket asignado a " + usuario.getNombre() + " " + usuario.getApellido();
                    }

                    ticket.setAsignadoPara(usuario);
                    ticket.setEstado("Pendiente");
                    ticket.setFechaActualizacion(new Date());
                    ticketService.save(ticket);

                    auditoriaService.registrarAccion(
                            ticket,
                            accion,
                            detalle,
                            asignadoAnterior,
                            usuario.getNombre() + " " + usuario.getApellido(),
                            usuario
                    );

                    response.put("success", true);
                    response.put("asignadoParaNombre", usuario.getNombre() + " " + usuario.getApellido());
                    response.put("habilitarMensajes", true);
                    response.put("habilitarBotones", true);
                    response.put("fueAutoAsignacion", !estabaAsignado);

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
            @RequestParam String respuestaTexto,
            @RequestParam(required = false, defaultValue = "false") boolean esNotaInterna,
            Authentication authentication) {

        Map<String, Object> response = new HashMap<>();

        if (respuestaTexto == null || respuestaTexto.trim().isEmpty()) {
            response.put("success", false);
            response.put("error", "El mensaje no puede estar vacío");
            return ResponseEntity.badRequest().body(response);
        }

        String mensajeLimpio = Jsoup.clean(respuesta,
                Safelist.relaxed()
                        .addTags("span", "div")
                        .addAttributes("span", "style", "class")
                        .addAttributes("div", "style", "class")
        );

        String correoElectronico = authentication.getName();
        Usuario usuario = usuarioService.getUsuarioPorCorreo(correoElectronico);

        if (usuario == null) {
            response.put("success", false);
            response.put("error", "Usuario no autenticado");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        Ticket ticket = ticketService.getTicketPorId(idTicket);
        if (ticket == null) {
            response.put("success", false);
            response.put("error", "Ticket no encontrado");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

        boolean esAdmin = usuario.getRoles().stream()
                .anyMatch(rol -> "ROL_ADMINISTRADOR".equals(rol.getNombre()));
        boolean esSoportista = usuario.getRoles().stream()
                .anyMatch(rol -> "ROL_SOPORTISTA".equals(rol.getNombre()));

        // Permitir respuesta si:
        // 1. Es admin o soportista
        // 2. Es el solicitante del ticket
        // 3. Es el usuario asignado al ticket (si está asignado)
        // 4. Es el creador del ticket (soportista) y el ticket está cerrado
        boolean puedeResponder = esAdmin || esSoportista
                || usuario.equals(ticket.getSolicitante())
                || (ticket.getAsignadoPara() != null && usuario.equals(ticket.getAsignadoPara()))
                || (ticket.getEstado().equals("Cerrado")
                && usuario.equals(ticket.getSolicitante())
                && esSoportista);

        if (!puedeResponder) {
            response.put("success", false);
            response.put("error", "No tiene permisos para responder este ticket");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        }

        try {
            Mensajes mensaje = new Mensajes();
            mensaje.setTicket(ticket);
            mensaje.setEmisor(usuario);
            mensaje.setReceptor(ticket.getSolicitante());
            mensaje.setMensaje(mensajeLimpio);
            mensaje.setMensajeTextoPlano(respuestaTexto.trim());
            mensaje.setFechaHora(new Date());
            mensaje.setEsNotaInterna(esNotaInterna);

            mensajeService.guardarMensaje(mensaje);

            SimpleDateFormat dateFormat = new SimpleDateFormat("dd/MM/yyyy, hh:mm:ss a");
            String fechaFormateada = dateFormat.format(mensaje.getFechaHora());

            String accion = esNotaInterna ? "NOTA_INTERNA" : "RESPUESTA_PUBLICA";
            String detalle = esNotaInterna ? "Nota interna agregada" : "Respuesta pública agregada";

            auditoriaService.registrarAccion(
                    ticket,
                    accion,
                    detalle,
                    null,
                    "Mensaje eliminado: " + mensaje.getMensajeTextoPlano(),
                    usuario
            );

            boolean tieneImagen = usuario.getImagen() != null && usuario.getImagen().length > 0;

            response.put("success", true);
            response.put("idMensaje", mensaje.getIdMensaje());
            response.put("mensaje", mensajeLimpio);
            response.put("emisorNombre", mensaje.getEmisor().getNombre() + " " + mensaje.getEmisor().getApellido());
            response.put("emisorId", mensaje.getEmisor().getIdUsuario());
            response.put("emisorTieneImagen", tieneImagen);
            response.put("esNotaInterna", mensaje.isEsNotaInterna());
            response.put("fechaHora", fechaFormateada);

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Error al procesar la respuesta: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
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

                auditoriaService.registrarAccion(
                        ticket,
                        "NOTA_INTERNA",
                        "Nota interna agregada",
                        null,
                        "Mensaje eliminado: " + mensaje.getMensajeTextoPlano(),
                        usuario
                );

                return ResponseEntity.ok("Nota interna enviada correctamente.");
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Ticket no encontrado.");
            }
        } else {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body("No tiene permisos para enviar notas internas.");
        }
    }

    @GetMapping("/mensajes/{idTicket}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> obtenerMensajesTicket(
            @PathVariable Long idTicket,
            @RequestParam(required = false) String filtro,
            @RequestParam(required = false) String busqueda,
            Authentication authentication) {

        Map<String, Object> response = new HashMap<>();

        try {
            String correoElectronico = authentication.getName();
            Usuario usuarioActual = usuarioService.getUsuarioPorCorreo(correoElectronico);

            if (usuarioActual == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            Ticket ticket = ticketService.getTicketPorId(idTicket);
            if (ticket == null) {
                return ResponseEntity.notFound().build();
            }

            List<Mensajes> todosLosMensajes = mensajeService.obtenerMensajesPorTicket(idTicket);
            int totalMensajes = todosLosMensajes.size();

            boolean puedeVerNotas = usuarioActual.getRoles().stream()
                    .anyMatch(rol -> "ROL_SOPORTISTA".equals(rol.getNombre())
                    || "ROL_ADMINISTRADOR".equals(rol.getNombre()));

            List<Map<String, Object>> mensajesDTO = todosLosMensajes.stream()
                    .filter(m -> {
                        if (m.isEsNotaInterna() && !puedeVerNotas) {
                            return false;
                        }

                        if (filtro != null) {
                            switch (filtro) {
                                case "usuario":
                                    return !m.isEsNotaInterna()
                                            && m.getEmisor().equals(ticket.getSolicitante());
                                case "soporte":
                                    return !m.isEsNotaInterna()
                                            && m.getEmisor().getRoles().stream()
                                                    .anyMatch(r -> "ROL_SOPORTISTA".equals(r.getNombre())
                                                    || "ROL_ADMINISTRADOR".equals(r.getNombre()));
                                case "notas":
                                    return m.isEsNotaInterna();
                            }
                        }

                        return true;
                    })
                    .filter(m -> {
                        if (busqueda != null && !busqueda.trim().isEmpty()) {
                            String busquedaLower = busqueda.toLowerCase();
                            return m.getMensajeTextoPlano().toLowerCase().contains(busquedaLower)
                                    || (m.getEmisor().getNombre() + " " + m.getEmisor().getApellido())
                                            .toLowerCase().contains(busquedaLower);
                        }
                        return true;
                    })
                    .map(m -> {
                        Map<String, Object> dto = new HashMap<>();
                        dto.put("id", m.getIdMensaje());
                        dto.put("contenido", m.getMensaje());
                        dto.put("fecha", m.getFechaHora());
                        dto.put("esNotaInterna", m.isEsNotaInterna());
                        dto.put("esMio", m.getEmisor().getIdUsuario().equals(usuarioActual.getIdUsuario()));

                        Map<String, Object> emisor = new HashMap<>();
                        emisor.put("id", m.getEmisor().getIdUsuario());
                        emisor.put("nombre", m.getEmisor().getNombre());
                        emisor.put("apellido", m.getEmisor().getApellido());
                        emisor.put("tieneImagen", m.getEmisor().getImagen() != null && m.getEmisor().getImagen().length > 0);

                        if (!m.getEmisor().getRoles().isEmpty()) {
                            emisor.put("rol", m.getEmisor().getRoles().get(0).getNombre());
                        }

                        dto.put("emisor", emisor);

                        return dto;
                    })
                    .collect(Collectors.toList());

            response.put("mensajes", mensajesDTO);
            response.put("totalMensajes", totalMensajes);
            response.put("mensajesFiltrados", mensajesDTO.size());
            response.put("success", true);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Error al obtener mensajes: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/asignar-prioridad/{idTicket}")
    public String asignarPrioridad(
            @PathVariable Long idTicket,
            @RequestParam String prioridad,
            Authentication authentication,
            RedirectAttributes redirectAttributes) {

        if ("Sin Asignar".equals(prioridad)) {
            redirectAttributes.addFlashAttribute("error", "No puedes guardar el ticket con la prioridad 'Sin asignar'.");
            return "redirect:/tickets/manager/" + idTicket;
        }

        String correoElectronico = authentication.getName();
        Usuario usuario = usuarioService.getUsuarioPorCorreo(correoElectronico);

        if (usuario != null) {
            boolean esSoportista = usuario.getRoles().stream().anyMatch(rol -> "ROL_SOPORTISTA".equals(rol.getNombre()));
            boolean esAdmin = usuario.getRoles().stream().anyMatch(rol -> "ROL_ADMINISTRADOR".equals(rol.getNombre()));

            if (esSoportista || esAdmin) {
                Ticket ticket = ticketService.getTicketPorId(idTicket);

                if (ticket != null) {
                    // Registrar cambio de prioridad en auditoría
                    auditoriaService.registrarAccion(
                            ticket,
                            "CAMBIO_PRIORIDAD",
                            "Prioridad asignada al ticket",
                            ticket.getPrioridad(),
                            prioridad,
                            usuario
                    );

                    ticket.setPrioridad(prioridad);
                    ticket.setFechaActualizacion(new Date());
                    ticketService.save(ticket);

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

        return "redirect:/tickets/manager/" + idTicket;
    }

    @PostMapping("/cerrarTicket")
    public String cerrarTicket(@RequestParam("idTicket") Long idTicket,
            Authentication authentication,
            RedirectAttributes redirectAttributes) {

        if (authentication != null) {
            Ticket ticket = new Ticket();
            ticket.setIdTicket(idTicket);
            Ticket ticketExistente = ticketService.getTicket(ticket);

            if (ticketExistente != null) {
                String correoElectronico = authentication.getName();
                Usuario usuario = usuarioService.getUsuarioPorCorreo(correoElectronico);

                auditoriaService.registrarAccion(
                        ticketExistente,
                        "CIERRE",
                        "Ticket cerrado manualmente",
                        ticketExistente.getEstado(),
                        "Resuelto",
                        usuario
                );

                ticketExistente.setEstado("Resuelto");
                ticketExistente.setFechaActualizacion(new Date());

                if (ticketExistente.getAsignadoPara() == null && usuario != null) {
                    ticketExistente.setAsignadoPara(usuario);
                }

                ticketService.save(ticketExistente);

                redirectAttributes.addFlashAttribute("success", "Ticket cerrado exitosamente");
                return "redirect:/tickets/manager/" + idTicket;
            } else {
                redirectAttributes.addFlashAttribute("error", "No se encontró el ticket");
            }
        }
        return "redirect:/login";
    }

    @GetMapping("/usuarios/soportistas")
    @ResponseBody
    public ResponseEntity<List<Map<String, Object>>> getSoportistas() {
        List<Usuario> usuarios = usuarioService.getUsuariosPorRoles(
                Arrays.asList("ROL_SOPORTISTA", "ROL_ADMINISTRADOR")
        );

        List<Map<String, Object>> soportistas = usuarios.stream()
                .map(usuario -> {
                    Map<String, Object> userMap = new HashMap<>();
                    userMap.put("id", usuario.getIdUsuario().toString());
                    userMap.put("nombreCompleto", usuario.getNombre() + " " + usuario.getApellido());
                    userMap.put("codigo", usuario.getCodigo());
                    userMap.put("correo", usuario.getCorreoElectronico());
                    userMap.put("imagen", usuario.getImagen());

                    if (!usuario.getRoles().isEmpty()) {
                        userMap.put("rol", usuario.getRoles().get(0).getNombre());
                    }

                    return userMap;
                })
                .collect(Collectors.toList());

        return ResponseEntity.ok(soportistas);
    }

    @PostMapping("/asignar")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> asignarTickets(
            @RequestBody Map<String, Object> requestBody,
            Authentication authentication) {

        Map<String, Object> response = new HashMap<>();
        String correoElectronico = authentication.getName();
        Usuario usuario = usuarioService.getUsuarioPorCorreo(correoElectronico);

        // Check permissions
        boolean tienePermisos = usuario.getRoles().stream()
                .anyMatch(rol -> "ROL_ADMINISTRADOR".equals(rol.getNombre())
                || "ROL_SOPORTISTA".equals(rol.getNombre()));
        if (!tienePermisos) {
            response.put("success", false);
            response.put("error", "No tiene permisos para asignar tickets.");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        }

        String soportistaId = (String) requestBody.get("soportistaId");
        List<String> ticketIds = (List<String>) requestBody.get("ticketIds");

        if (soportistaId == null || ticketIds == null || ticketIds.isEmpty()) {
            response.put("success", false);
            response.put("error", "Datos de entrada inválidos.");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        Usuario soportista = usuarioService.getUsuarioPorId(Long.valueOf(soportistaId));
        if (soportista == null) {
            response.put("success", false);
            response.put("error", "Colaborador no encontrado.");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

        boolean esSoportista = usuario.getRoles().stream()
                .anyMatch(rol -> "ROL_SOPORTISTA".equals(rol.getNombre()));
        if (esSoportista) {
            boolean asignandoASoportista = soportista.getRoles().stream()
                    .anyMatch(rol -> "ROL_SOPORTISTA".equals(rol.getNombre()));
            if (!asignandoASoportista) {
                response.put("success", false);
                response.put("error", "Los soportistas solo pueden asignar tickets a otros soportistas.");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            }
        }

        try {
            for (String ticketId : ticketIds) {
                Ticket ticket = ticketService.getTicketPorId(Long.valueOf(ticketId));
                if (ticket == null) {
                    continue; // Skip invalid ticket IDs
                }

                String asignadoAnterior = ticket.getAsignadoPara() != null
                        ? ticket.getAsignadoPara().getNombre() + " " + ticket.getAsignadoPara().getApellido()
                        : "Sin asignar";

                String detalle = usuario.equals(soportista)
                        ? "Ticket autoasignado por " + usuario.getNombre() + " " + usuario.getApellido()
                        : "Ticket asignado por " + usuario.getNombre() + " " + usuario.getApellido();

                ticket.setAsignadoPara(soportista);
                ticket.setEstado("Pendiente");
                ticket.setFechaActualizacion(new Date());
                ticketService.save(ticket);

                auditoriaService.registrarAccion(
                        ticket,
                        "ASIGNACION",
                        detalle,
                        asignadoAnterior,
                        soportista.getNombre() + " " + soportista.getApellido(),
                        usuario
                );
            }

            response.put("success", true);
            response.put("message", "Tickets asignados correctamente.");
            response.put("fueAutoAsignacion", usuario.equals(soportista));
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Error al asignar tickets: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/desactivar/{idTicket}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> desactivarTicket(
            @PathVariable("idTicket") Long idTicket,
            Authentication authentication) {

        Map<String, Object> response = new HashMap<>();

        try {
            Usuario usuario = usuarioService.getUsuarioPorCorreo(authentication.getName());
            Ticket ticket = ticketService.getTicketPorId(idTicket);

            if (ticket == null) {
                response.put("success", false);
                response.put("error", "Ticket no encontrado");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }

            auditoriaService.registrarAccion(
                    ticket,
                    "DESACTIVACION",
                    "Ticket desactivado por " + usuario.getNombre() + " " + usuario.getApellido(),
                    ticket.getEstado(),
                    "Desactivado",
                    usuario
            );

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
                String correoElectronico = authentication.getName();
                Usuario usuario = usuarioService.getUsuarioPorCorreo(correoElectronico);

                auditoriaService.registrarAccion(
                        ticket,
                        "CAMBIO_ESTADO",
                        "Ticket reabierto después de estar resuelto",
                        "Resuelto",
                        "Pendiente",
                        usuario
                );

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

        Mensajes mensaje = mensajeService.obtenerMensajePorId(idMensaje);
        if (mensaje == null) {
            return ResponseEntity.notFound().build();
        }

        List<Mensajes> mensajesTicket = mensajeService.obtenerMensajesPorTicket(mensaje.getTicket().getIdTicket());

        String correoElectronico = authentication.getName();
        Usuario usuario = usuarioService.getUsuarioPorCorreo(correoElectronico);

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

    @PostMapping("/cancelar/{idTicket}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> cancelarTicket(
            @PathVariable Long idTicket,
            Authentication authentication) {

        Map<String, Object> response = new HashMap<>();

        try {
            // Verificar autenticación
            if (authentication == null || !authentication.isAuthenticated()) {
                response.put("success", false);
                response.put("error", "No autenticado");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }

            Usuario usuario = usuarioService.getUsuarioPorCorreo(authentication.getName());
            Ticket ticket = ticketService.getTicketPorId(idTicket);

            if (ticket == null) {
                response.put("success", false);
                response.put("error", "Ticket no encontrado");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }

            // Verificar permisos (solo el solicitante puede cancelar)
            if (!ticket.getSolicitante().getIdUsuario().equals(usuario.getIdUsuario())) {
                response.put("success", false);
                response.put("error", "No tienes permiso para cancelar este ticket");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            }

            // Verificar que el ticket puede ser cancelado (Abierto y sin asignar)
            if (!"Abierto".equals(ticket.getEstado())) {
                response.put("success", false);
                response.put("error", "Solo se pueden cancelar tickets en estado Abierto");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

            if (ticket.getAsignadoPara() != null) {
                response.put("success", false);
                response.put("error", "No se puede cancelar un ticket ya asignado");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

            // Registrar en auditoría
            auditoriaService.registrarAccion(
                    ticket,
                    "CANCELACION",
                    "Ticket cancelado por el usuario",
                    ticket.getEstado(),
                    "Cancelado",
                    usuario
            );

            // Actualizar estado del ticket
            ticket.setEstado("Cancelado");
            ticket.setFechaActualizacion(new Date());
            ticketService.save(ticket);

            response.put("success", true);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            logger.error("Error al cancelar ticket: " + idTicket, e);
            response.put("success", false);
            response.put("error", "Error interno: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @Scheduled(fixedRate = 60 * 60 * 1000)
    @Transactional
    public void cerrarTicketsResueltosAutomaticamente() {
        logger.info("Ejecutando cierre automático de tickets resueltos...");

        List<Ticket> ticketsResueltos = ticketService.getTicketsPorEstado("Resuelto");
        if (ticketsResueltos.isEmpty()) {
            logger.info("No hay tickets resueltos para cerrar automáticamente");
            return;
        }

        Date ahora = new Date();
        int ticketsCerrados = 0;

        for (Ticket ticket : ticketsResueltos) {
            long horasDesdeResuelto = TimeUnit.MILLISECONDS.toHours(
                    ahora.getTime() - ticket.getFechaActualizacion().getTime());

            if (horasDesdeResuelto >= 24) {
                try {
                    auditoriaService.registrarAccion(
                            ticket,
                            "CIERRE_AUTOMATICO",
                            "Ticket cerrado automáticamente después de 24 horas en estado Resuelto",
                            ticket.getEstado(),
                            "Cerrado",
                            null
                    );

                    ticket.setEstado("Cerrado");
                    ticket.setFechaActualizacion(ahora);
                    ticketService.save(ticket);
                    ticketsCerrados++;

                    logger.info("Ticket {} cerrado automáticamente", ticket.getCodigo());
                } catch (Exception e) {
                    logger.error("Error al cerrar automáticamente el ticket {}: {}", ticket.getCodigo(), e.getMessage());
                }
            }
        }

        logger.info("Proceso completado. Tickets cerrados: {}", ticketsCerrados);
    }

    @GetMapping("/tiempoCierre/{idTicket}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> getTiempoParaCierre(@PathVariable Long idTicket) {
        Map<String, Object> response = new HashMap<>();

        try {
            Ticket ticket = ticketService.getTicketPorId(idTicket);
            if (ticket == null || !"Resuelto".equals(ticket.getEstado())) {
                response.put("success", false);
                response.put("message", "El ticket no está en estado Resuelto");
                return ResponseEntity.ok(response);
            }

            Date ahora = new Date();
            long horasTranscurridas = TimeUnit.MILLISECONDS.toHours(
                    ahora.getTime() - ticket.getFechaActualizacion().getTime());
            long horasRestantes = 24 - horasTranscurridas;

            // Determinar la unidad correcta (singular o plural)
            String unidadTiempo = horasRestantes == 1 ? "Hora" : "Horas";

            response.put("success", true);
            response.put("horasRestantes", horasRestantes);
            response.put("unidadTiempo", unidadTiempo);
            response.put("cerradoAutomaticamente", horasRestantes <= 0);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Error al calcular el tiempo para cierre: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/desactivar-multiples")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> desactivarTicketsMultiples(
            @RequestBody Map<String, List<Long>> requestBody,
            Authentication authentication) {

        Map<String, Object> response = new HashMap<>();

        try {
            Usuario usuario = usuarioService.getUsuarioPorCorreo(authentication.getName());
            List<Long> ticketIds = requestBody.get("ticketIds");

            if (ticketIds == null || ticketIds.isEmpty()) {
                response.put("success", false);
                response.put("message", "No se proporcionaron IDs de tickets");
                return ResponseEntity.badRequest().body(response);
            }

            int count = 0;
            for (Long ticketId : ticketIds) {
                Ticket ticket = ticketService.getTicketPorId(ticketId);
                if (ticket != null) {
                    // Registrar en auditoría
                    auditoriaService.registrarAccion(
                            ticket,
                            "DESACTIVACION_MULTIPLE",
                            "Ticket desactivado en operación múltiple",
                            ticket.getEstado(),
                            "Desactivado",
                            usuario
                    );

                    ticket.setEstado("Desactivado");
                    ticket.setFechaActualizacion(new Date());
                    ticketService.save(ticket);
                    count++;
                }
            }

            response.put("success", true);
            response.put("count", count);
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error al desactivar tickets: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}
