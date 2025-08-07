package com.mesadeayudaMPB.controller;

import com.mesadeayudaMPB.domain.Auditoria;
import com.mesadeayudaMPB.domain.Ticket;
import com.mesadeayudaMPB.domain.Usuario;
import com.mesadeayudaMPB.service.AuditoriaService;
import com.mesadeayudaMPB.service.ReporteService;
import com.mesadeayudaMPB.service.TicketService;
import com.mesadeayudaMPB.service.UsuarioService;
import java.io.IOException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.RequestParam;
import java.time.format.DateTimeFormatter;

@Controller
@RequestMapping("/reportes")
public class ReporteController {

    @Autowired
    private TicketService ticketService;

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private AuditoriaService auditoriaService;

    @Autowired
    private ReporteService reporteService;

    /**
     * Muestra el dashboard de reportes con estadísticas y gráficos
     * @param model Modelo para pasar datos a la vista
     * @param authentication Información de autenticación del usuario
     * @return Vista del dashboard de reportes
     */
    @GetMapping("/listado")
    public String mostrarDashboardReportes(Model model, Authentication authentication) {
        // Obtener datos base
        List<Ticket> todosTickets = ticketService.getTickets();
        List<Usuario> todosUsuarios = usuarioService.getUsuarios();

        // Estadísticas principales
        model.addAttribute("totalTickets", todosTickets.size());
        model.addAttribute("ticketsAbiertos", contarTicketsAbiertos(todosTickets));
        model.addAttribute("ticketsPendientes", contarTicketsPendientes(todosTickets));
        model.addAttribute("ticketsResueltos", contarTicketsResueltos(todosTickets));
        model.addAttribute("ticketsCerrados", contarTicketsCerrados(todosTickets));
        model.addAttribute("totalUsuarios", todosUsuarios.size());
        model.addAttribute("totalColaboradores", contarColaboradores(todosUsuarios));

        // Estadísticas del usuario actual
        if (authentication != null) {
            Usuario usuario = usuarioService.getUsuarioPorCorreo(authentication.getName());
            if (usuario != null) {
                model.addAttribute("misTicketsPendientes", contarTicketsPendientesUsuario(todosTickets, usuario));
                model.addAttribute("misTicketsResueltos", contarTicketsResueltosUsuario(todosTickets, usuario));
            }
        }

        // Datos para gráficos
        model.addAttribute("ticketsPorMes", calcularTicketsPorPeriodo(todosTickets, 6));
        model.addAttribute("ticketsPorUltimoAnio", calcularTicketsPorPeriodo(todosTickets, 12));
        model.addAttribute("ticketsPorUltimoTrimestre", calcularTicketsPorPeriodo(todosTickets, 3));

        model.addAttribute("estadoTicketsPorMes", calcularEstadoTicketsPorPeriodo(todosTickets, 6));
        model.addAttribute("estadoTicketsPorUltimoAnio", calcularEstadoTicketsPorPeriodo(todosTickets, 12));
        model.addAttribute("estadoTicketsPorUltimoTrimestre", calcularEstadoTicketsPorPeriodo(todosTickets, 3));

        // Datos adicionales
        model.addAttribute("categoriasPopulares", calcularCategoriasPopulares(todosTickets));
        model.addAttribute("colaboradoresActivos", calcularColaboradoresActivos(todosTickets, todosUsuarios));
        model.addAttribute("historialAuditoria", obtenerHistorialAuditoria());

        return "reportes/listado";
    }

    /**
     * Endpoint para obtener datos del dashboard en formato JSON
     * @param authentication Información de autenticación del usuario
     * @return ResponseEntity con los datos del dashboard
     */
    @GetMapping("/datos")
    public ResponseEntity<Map<String, Object>> obtenerDatosDashboard(Authentication authentication) {
        Map<String, Object> datos = new HashMap<>();
        List<Ticket> todosTickets = ticketService.getTickets();
        List<Usuario> todosUsuarios = usuarioService.getUsuarios();

        // Estadísticas principales
        datos.put("totalTickets", todosTickets.size());
        datos.put("ticketsAbiertos", contarTicketsAbiertos(todosTickets));
        datos.put("ticketsPendientes", contarTicketsPendientes(todosTickets));
        datos.put("ticketsResueltos", contarTicketsResueltos(todosTickets));
        datos.put("ticketsCerrados", contarTicketsCerrados(todosTickets));
        datos.put("totalUsuarios", todosUsuarios.size());
        datos.put("totalColaboradores", contarColaboradores(todosUsuarios));

        // Estadísticas del usuario actual
        if (authentication != null) {
            Usuario usuario = usuarioService.getUsuarioPorCorreo(authentication.getName());
            if (usuario != null) {
                datos.put("misTicketsPendientes", contarTicketsPendientesUsuario(todosTickets, usuario));
                datos.put("misTicketsResueltos", contarTicketsResueltosUsuario(todosTickets, usuario));
            }
        }

        // Datos para gráficos
        datos.put("ticketsPorMes", calcularTicketsPorPeriodo(todosTickets, 6));
        datos.put("ticketsPorUltimoAnio", calcularTicketsPorPeriodo(todosTickets, 12));
        datos.put("ticketsPorUltimoTrimestre", calcularTicketsPorPeriodo(todosTickets, 3));
        datos.put("estadoTicketsPorMes", calcularEstadoTicketsPorPeriodo(todosTickets, 6));
        datos.put("estadoTicketsPorUltimoAnio", calcularEstadoTicketsPorPeriodo(todosTickets, 12));
        datos.put("estadoTicketsPorUltimoTrimestre", calcularEstadoTicketsPorPeriodo(todosTickets, 3));

        // Datos adicionales
        datos.put("categoriasPopulares", calcularCategoriasPopulares(todosTickets));
        datos.put("colaboradoresActivos", calcularColaboradoresActivos(todosTickets, todosUsuarios));
        datos.put("historialAuditoria", obtenerHistorialAuditoria());

        return ResponseEntity.ok(datos);
    }

    /**
     * Exporta tickets en diferentes formatos (PDF, Excel, etc.)
     * @param tipo Tipo de reporte a generar (pdf, xlsx, etc.)
     * @param search Búsqueda general
     * @param filter_fechaAperturaFrom Filtro de fecha de apertura desde
     * @param filter_fechaAperturaTo Filtro de fecha de apertura hasta
     * @param filter_fechaActualizacionFrom Filtro de fecha de actualización desde
     * @param filter_fechaActualizacionTo Filtro de fecha de actualización hasta
     * @param section Sección de tickets a exportar
     * @param allParams Todos los parámetros de filtro
     * @param authentication Información de autenticación
     * @return ResponseEntity con el recurso del reporte generado
     */
    @GetMapping("/exportarTickets")
    public ResponseEntity<Resource> exportarTickets(
            @RequestParam String tipo,
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String filter_fechaAperturaFrom,
            @RequestParam(required = false) String filter_fechaAperturaTo,
            @RequestParam(required = false) String filter_fechaActualizacionFrom,
            @RequestParam(required = false) String filter_fechaActualizacionTo,
            @RequestParam(required = false) String section,
            @RequestParam Map<String, String> allParams,
            Authentication authentication) throws IOException {

        // Procesar filtros de columnas
        Map<String, String> columnFilters = extraerFiltrosColumnas(allParams);

        // Obtener tickets según la sección seleccionada
        List<Ticket> ticketsFiltrados = obtenerTicketsFiltrados(section, authentication, 
                columnFilters, search, filter_fechaAperturaFrom, filter_fechaAperturaTo,
                filter_fechaActualizacionFrom, filter_fechaActualizacionTo);

        // Preparar datos para el reporte
        List<Map<String, Object>> reportData = prepararDatosReporte(ticketsFiltrados);
        Map<String, Object> parametros = prepararParametrosReporte(section, authentication, 
                search, filter_fechaAperturaFrom, filter_fechaAperturaTo,
                filter_fechaActualizacionFrom, filter_fechaActualizacionTo, columnFilters);

        return reporteService.generaReporte("ReporteTickets", parametros, tipo);
    }

    // Métodos auxiliares para contar tickets

    private long contarTicketsAbiertos(List<Ticket> tickets) {
        return tickets.stream()
                .filter(t -> "Abierto".equals(t.getEstado()) && t.getAsignadoPara() == null)
                .count();
    }

    private long contarTicketsPendientes(List<Ticket> tickets) {
        return tickets.stream()
                .filter(t -> "Pendiente".equals(t.getEstado()))
                .count();
    }

    private long contarTicketsResueltos(List<Ticket> tickets) {
        return tickets.stream()
                .filter(t -> "Resuelto".equals(t.getEstado()))
                .count();
    }

    private long contarTicketsCerrados(List<Ticket> tickets) {
        return tickets.stream()
                .filter(t -> "Cerrado".equals(t.getEstado()))
                .count();
    }

    private long contarColaboradores(List<Usuario> usuarios) {
        return usuarios.stream()
                .filter(u -> u.getRoles().stream()
                .anyMatch(r -> "ROL_SOPORTISTA".equals(r.getNombre()) || "ROL_ADMINISTRADOR".equals(r.getNombre())))
                .count();
    }

    private long contarTicketsPendientesUsuario(List<Ticket> tickets, Usuario usuario) {
        return tickets.stream()
                .filter(t -> usuario.equals(t.getAsignadoPara())
                && ("Abierto".equals(t.getEstado()) || "Pendiente".equals(t.getEstado())))
                .count();
    }

    private long contarTicketsResueltosUsuario(List<Ticket> tickets, Usuario usuario) {
        return tickets.stream()
                .filter(t -> usuario.equals(t.getAsignadoPara())
                && ("Resuelto".equals(t.getEstado()) || "Cerrado".equals(t.getEstado())))
                .count();
    }

    // Métodos para procesar datos de auditoría

    private List<Map<String, Object>> obtenerHistorialAuditoria() {
        try {
            List<Auditoria> auditorias = auditoriaService.findTop50RecentAuditActions();
            return auditorias.stream()
                    .map(this::mapearAuditoria)
                    .collect(Collectors.toList());
        } catch (Exception e) {
            System.err.println("Error obteniendo historial de auditoría: " + e.getMessage());
            return Collections.emptyList();
        }
    }

    private Map<String, Object> mapearAuditoria(Auditoria auditoria) {
        Map<String, Object> item = new HashMap<>();
        item.put("accion", formatearAccionAuditoria(auditoria));
        item.put("icono", determinarIconoAuditoria(auditoria.getAccion()));
        item.put("usuario", obtenerNombreUsuario(auditoria));
        item.put("tiempo", calcularTiempoTranscurrido(auditoria.getFechaAccion()));
        item.put("infoTicket", obtenerInfoTicket(auditoria));
        item.put("fechaAccion", auditoria.getFechaAccion());
        item.put("detalle", auditoria.getDetalle());
        return item;
    }

    private String obtenerNombreUsuario(Auditoria auditoria) {
        if (auditoria.getUsuario() == null) return "Sistema";
        
        String nombre = auditoria.getUsuario().getNombre() + " " + auditoria.getUsuario().getApellido();
        if (auditoria.getUsuario().getCodigo() != null) {
            nombre += " (" + auditoria.getUsuario().getCodigo() + ")";
        }
        return nombre;
    }

    private String obtenerInfoTicket(Auditoria auditoria) {
        if (auditoria.getTicket() == null) return "";
        return auditoria.getTicket().getCodigo() != null ? 
                auditoria.getTicket().getCodigo() : 
                "Ticket #" + auditoria.getTicket().getIdTicket();
    }

    private String determinarIconoAuditoria(String accion) {
        if (accion == null) return "fa-ticket-alt";
        
        switch (accion.toUpperCase()) {
            case "CREACION": return "fa-plus-circle";
            case "ACTUALIZACION": return "fa-edit";
            case "ASIGNACION": return "fa-user-tag";
            case "CAMBIO_ESTADO": return "fa-exchange-alt";
            case "CIERRE": return "fa-check-circle";
            case "COMENTARIO": return "fa-comment";
            case "REAPERTURA": return "fa-undo";
            case "PRIORIDAD": return "fa-exclamation-circle";
            default: return "fa-ticket-alt";
        }
    }

    private String formatearAccionAuditoria(Auditoria auditoria) {
        if (auditoria.getAccion() == null) return "Acción no especificada";
        
        String accionBase;
        switch (auditoria.getAccion().toUpperCase()) {
            case "CREACION": accionBase = "Nuevo ticket creado"; break;
            case "ACTUALIZACION": accionBase = "Ticket actualizado"; break;
            case "ASIGNACION": accionBase = "Ticket reasignado"; break;
            case "CAMBIO_ESTADO": accionBase = "Cambio de estado del ticket"; break;
            case "CIERRE": accionBase = "Ticket cerrado"; break;
            case "COMENTARIO": accionBase = "Nuevo comentario en ticket"; break;
            case "REAPERTURA": accionBase = "Ticket reabierto"; break;
            case "PRIORIDAD": accionBase = "Cambio de prioridad"; break;
            default: accionBase = "Acción en ticket"; break;
        }
        
        if (auditoria.getTicket() != null) {
            accionBase += " (" + obtenerInfoTicket(auditoria) + ")";
        }
        
        return accionBase;
    }

    private String calcularTiempoTranscurrido(Date fecha) {
        if (fecha == null) return "Hace algún tiempo";
        
        long diff = new Date().getTime() - fecha.getTime();
        long diffMinutes = diff / (60 * 1000);
        long diffHours = diff / (60 * 60 * 1000);
        long diffDays = diff / (24 * 60 * 60 * 1000);

        if (diffMinutes < 1) return "Hace unos momentos";
        if (diffMinutes < 60) return "Hace " + diffMinutes + " minuto" + (diffMinutes > 1 ? "s" : "");
        if (diffHours < 24) return "Hace " + diffHours + " hora" + (diffHours > 1 ? "s" : "");
        if (diffDays < 7) return "Hace " + diffDays + " día" + (diffDays > 1 ? "s" : "");
        return "Hace " + (diffDays / 7) + " semana" + ((diffDays / 7) > 1 ? "s" : "");
    }

    // Métodos para cálculos de estadísticas

    private Map<String, Long> calcularTicketsPorPeriodo(List<Ticket> tickets, int meses) {
        Map<String, Long> ticketsPorPeriodo = new LinkedHashMap<>();
        LocalDate ahora = LocalDate.now();

        // Inicializar meses con 0
        for (int i = meses - 1; i >= 0; i--) {
            LocalDate mes = ahora.minusMonths(i);
            String claveMes = obtenerNombreMes(mes.getMonthValue()) + " " + mes.getYear();
            ticketsPorPeriodo.put(claveMes, 0L);
        }

        // Contar tickets por mes
        tickets.forEach(t -> {
            if (t.getFechaApertura() != null) {
                LocalDate fechaTicket = t.getFechaApertura().toInstant()
                        .atZone(ZoneId.systemDefault()).toLocalDate();
                String mes = obtenerNombreMes(fechaTicket.getMonthValue()) + " " + fechaTicket.getYear();

                if (fechaTicket.isAfter(ahora.minusMonths(meses).minusDays(1))) {
                    ticketsPorPeriodo.put(mes, ticketsPorPeriodo.getOrDefault(mes, 0L) + 1);
                }
            }
        });

        return ordenarMeses(ticketsPorPeriodo);
    }

    private Map<String, Map<String, Long>> calcularEstadoTicketsPorPeriodo(List<Ticket> tickets, int meses) {
        Map<String, Map<String, Long>> estadoPorPeriodo = new LinkedHashMap<>();
        LocalDate ahora = LocalDate.now();

        // Inicializar meses con contadores
        for (int i = meses - 1; i >= 0; i--) {
            LocalDate mes = ahora.minusMonths(i);
            String claveMes = obtenerNombreMes(mes.getMonthValue()) + " " + mes.getYear();

            Map<String, Long> estados = new HashMap<>();
            estados.put("Pendientes", 0L);
            estados.put("Resueltos", 0L);
            estadoPorPeriodo.put(claveMes, estados);
        }

        // Contar tickets por estado y mes
        tickets.forEach(t -> {
            if (t.getFechaApertura() != null) {
                LocalDate fechaTicket = t.getFechaApertura().toInstant()
                        .atZone(ZoneId.systemDefault()).toLocalDate();
                String mes = obtenerNombreMes(fechaTicket.getMonthValue()) + " " + fechaTicket.getYear();

                if (fechaTicket.isAfter(ahora.minusMonths(meses).minusDays(1))) {
                    Map<String, Long> estados = estadoPorPeriodo.get(mes);
                    if (estados != null) {
                        if ("Resuelto".equals(t.getEstado()) || "Cerrado".equals(t.getEstado())) {
                            estados.put("Resueltos", estados.get("Resueltos") + 1);
                        } else if ("Pendiente".equals(t.getEstado())) {
                            estados.put("Pendientes", estados.get("Pendientes") + 1);
                        }
                    }
                }
            }
        });

        return ordenarMesesEnMapa(estadoPorPeriodo);
    }

    private Map<String, Long> calcularCategoriasPopulares(List<Ticket> tickets) {
        return tickets.stream()
                .filter(t -> t.getCategoria() != null && !t.getCategoria().trim().isEmpty())
                .collect(Collectors.groupingBy(Ticket::getCategoria, Collectors.counting()))
                .entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (e1, e2) -> e1,
                        LinkedHashMap::new
                ));
    }

    private Map<String, Long> calcularColaboradoresActivos(List<Ticket> tickets, List<Usuario> usuarios) {
        List<Usuario> colaboradores = usuarios.stream()
                .filter(u -> u.getRoles().stream()
                .anyMatch(r -> "ROL_SOPORTISTA".equals(r.getNombre()) || "ROL_ADMINISTRADOR".equals(r.getNombre())))
                .collect(Collectors.toList());

        Map<String, Long> colaboradoresActivos = new HashMap<>();

        for (Usuario colaborador : colaboradores) {
            long ticketsResueltos = tickets.stream()
                    .filter(t -> colaborador.equals(t.getAsignadoPara())
                    && ("Resuelto".equals(t.getEstado()) || "Cerrado".equals(t.getEstado())))
                    .count();

            String nombreCompleto = colaborador.getNombre() + " " + colaborador.getApellido();
            if (colaborador.getCodigo() != null && !colaborador.getCodigo().isEmpty()) {
                nombreCompleto += " (" + colaborador.getCodigo() + ")";
            }
            colaboradoresActivos.put(nombreCompleto, ticketsResueltos);
        }

        return colaboradoresActivos.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (e1, e2) -> e1,
                        LinkedHashMap::new
                ));
    }

    // Métodos auxiliares para ordenación

    private Map<String, Long> ordenarMeses(Map<String, Long> mapa) {
        return mapa.entrySet().stream()
                .sorted(this::compararMeses)
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (e1, e2) -> e1,
                        LinkedHashMap::new
                ));
    }

    private Map<String, Map<String, Long>> ordenarMesesEnMapa(Map<String, Map<String, Long>> mapa) {
        return mapa.entrySet().stream()
                .sorted(this::compararMeses)
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (e1, e2) -> e1,
                        LinkedHashMap::new
                ));
    }

    private int compararMeses(Map.Entry<String, ?> e1, Map.Entry<String, ?> e2) {
        String[] parts1 = e1.getKey().split(" ");
        String[] parts2 = e2.getKey().split(" ");
        int year1 = Integer.parseInt(parts1[1]);
        int year2 = Integer.parseInt(parts2[1]);
        if (year1 != year2) return Integer.compare(year1, year2);

        String mes1 = parts1[0];
        String mes2 = parts2[0];
        List<String> mesesOrdenados = Arrays.asList("Ene", "Feb", "Mar", "Abr", "May", "Jun",
                "Jul", "Ago", "Sep", "Oct", "Nov", "Dic");
        return Integer.compare(mesesOrdenados.indexOf(mes1), mesesOrdenados.indexOf(mes2));
    }

    // Métodos auxiliares para exportación

    private Map<String, String> extraerFiltrosColumnas(Map<String, String> allParams) {
        return allParams.entrySet().stream()
                .filter(e -> e.getKey().startsWith("filter_")
                && !e.getKey().matches("filter_(fechaAperturaFrom|fechaAperturaTo|fechaActualizacionFrom|fechaActualizacionTo)")
                && !e.getValue().isEmpty())
                .collect(Collectors.toMap(
                        e -> e.getKey().replace("filter_", ""),
                        Map.Entry::getValue
                ));
    }

    private List<Ticket> obtenerTicketsFiltrados(String section, Authentication authentication, 
            Map<String, String> columnFilters, String search, 
            String fechaAperturaFrom, String fechaAperturaTo,
            String fechaActualizacionFrom, String fechaActualizacionTo) {
        
        List<Ticket> baseTickets;
        if ("mis-tickets".equals(section) && authentication != null) {
            Usuario usuario = usuarioService.getUsuarioPorCorreo(authentication.getName());
            baseTickets = usuario != null ? ticketService.getTicketsPorAsignado(usuario) : ticketService.getTickets();
        } else if ("sin-asignar".equals(section)) {
            baseTickets = ticketService.getTicketsSinAsignar();
        } else {
            baseTickets = ticketService.getTickets();
        }

        return ticketService.buscarTicketsPorFiltrosAvanzadosEnLista(
                baseTickets, columnFilters, search, 
                fechaAperturaFrom, fechaAperturaTo, 
                fechaActualizacionFrom, fechaActualizacionTo);
    }

    private List<Map<String, Object>> prepararDatosReporte(List<Ticket> tickets) {
        return tickets.stream()
                .map(t -> {
                    Map<String, Object> row = new HashMap<>();
                    row.put("ID_Ticket", t.getIdTicket());
                    row.put("Codigo", t.getCodigo());
                    row.put("Apertura", t.getFechaApertura());
                    row.put("Breve_Descripcion", t.getTitulo());
                    row.put("Solicitante", t.getSolicitante().getNombre() + " " + t.getSolicitante().getApellido());
                    row.put("Prioridad", t.getPrioridad());
                    row.put("Estado", t.getEstado());
                    row.put("Categoria", t.getCategoria());
                    row.put("Asignado_Para", t.getAsignadoPara() != null
                            ? t.getAsignadoPara().getNombre() + " " + t.getAsignadoPara().getApellido() : "Sin Asignar");
                    row.put("Actualizacion", t.getFechaActualizacion());
                    return row;
                })
                .collect(Collectors.toList());
    }

    private Map<String, Object> prepararParametrosReporte(String section, Authentication authentication,
            String search, String fechaAperturaFrom, String fechaAperturaTo,
            String fechaActualizacionFrom, String fechaActualizacionTo,
            Map<String, String> columnFilters) {
        
        // Determinar título de la sección
        String tituloSeccion = determinarTituloSeccion(section, authentication);

        // Construir cadena de filtros aplicados
        StringBuilder filtrosAplicados = new StringBuilder();
        DateTimeFormatter inputFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        DateTimeFormatter outputFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");

        if (search != null && !search.isEmpty()) {
            filtrosAplicados.append("Búsqueda: ").append(search).append(", ");
        }

        agregarFiltroFecha(filtrosAplicados, "Fecha apertura desde", fechaAperturaFrom, inputFormatter, outputFormatter);
        agregarFiltroFecha(filtrosAplicados, "Fecha apertura hasta", fechaAperturaTo, inputFormatter, outputFormatter);
        agregarFiltroFecha(filtrosAplicados, "Fecha actualización desde", fechaActualizacionFrom, inputFormatter, outputFormatter);
        agregarFiltroFecha(filtrosAplicados, "Fecha actualización hasta", fechaActualizacionTo, inputFormatter, outputFormatter);

        columnFilters.forEach((campo, valor) -> {
            filtrosAplicados.append(campo).append(": ").append(valor).append(", ");
        });

        // Preparar parámetros finales
        Map<String, Object> parametros = new HashMap<>();
        parametros.put("TITULO_REPORTE", "Reporte de Tickets - " + tituloSeccion);
        parametros.put("FILTROS_APLICADOS", filtrosAplicados.toString());
        parametros.put("HAY_FILTROS", !filtrosAplicados.toString().isEmpty());
        return parametros;
    }

    private String determinarTituloSeccion(String section, Authentication authentication) {
        if ("mis-tickets".equals(section) && authentication != null) {
            Usuario usuario = usuarioService.getUsuarioPorCorreo(authentication.getName());
            if (usuario != null) {
                String codigo = usuario.getCodigo() != null ? " (" + usuario.getCodigo() + ")" : "";
                return "Mis Tickets" + codigo;
            }
        }
        switch (section) {
            case "sin-asignar": return "Sin Asignar";
            case "todos": return "Todos";
            default: return section != null ? section : "Todos";
        }
    }

    private void agregarFiltroFecha(StringBuilder filtros, String etiqueta, String fecha,
            DateTimeFormatter inputFormatter, DateTimeFormatter outputFormatter) {
        if (fecha != null && !fecha.isEmpty()) {
            filtros.append(etiqueta).append(": ")
                  .append(formatearFecha(fecha, inputFormatter, outputFormatter))
                  .append(", ");
        }
    }

    private String formatearFecha(String fecha, DateTimeFormatter inputFormatter, 
            DateTimeFormatter outputFormatter) {
        try {
            LocalDate localDate = LocalDate.parse(fecha, inputFormatter);
            return localDate.format(outputFormatter);
        } catch (Exception e) {
            System.err.println("Error formateando fecha: " + fecha + " - " + e.getMessage());
            return fecha;
        }
    }

    private String obtenerNombreMes(int mes) {
        String[] nombresMeses = {"Ene", "Feb", "Mar", "Abr", "May", "Jun", 
                               "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"};
        return nombresMeses[mes - 1];
    }
}