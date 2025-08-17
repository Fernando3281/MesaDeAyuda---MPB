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
import java.time.ZoneId;
import java.util.*;
import java.util.stream.Collectors;
import net.sf.jasperreports.engine.data.JRBeanCollectionDataSource;
import org.springframework.core.io.Resource;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.RequestParam;
import java.time.format.DateTimeFormatter;
import java.time.LocalDate;

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

    @GetMapping("/listado")
    public String mostrarDashboardReportes(Model model, Authentication authentication) {
        // Estadísticas principales
        List<Ticket> todosTickets = ticketService.getTickets();
        List<Usuario> todosUsuarios = usuarioService.getUsuarios();

        // Total de tickets
        int totalTickets = todosTickets.size();

        // Modified: Count only unassigned tickets with "Abierto" status
        long ticketsAbiertos = todosTickets.stream()
                .filter(t -> "Abierto".equals(t.getEstado()) && t.getAsignadoPara() == null)
                .count();
        long ticketsPendientes = todosTickets.stream()
                .filter(t -> "Pendiente".equals(t.getEstado()))
                .count();
        long ticketsResueltos = todosTickets.stream()
                .filter(t -> "Resuelto".equals(t.getEstado()))
                .count();
        long ticketsCerrados = todosTickets.stream()
                .filter(t -> "Cerrado".equals(t.getEstado()))
                .count();

        // Total de usuarios
        int totalUsuarios = todosUsuarios.size();

        // Total de colaboradores (administradores y soportistas)
        long totalColaboradores = todosUsuarios.stream()
                .filter(u -> u.getRoles().stream()
                .anyMatch(r -> "ROL_SOPORTISTA".equals(r.getNombre())
                || "ROL_ADMINISTRADOR".equals(r.getNombre())))
                .count();

        // Tickets del usuario autenticado
        long misTicketsPendientes = 0;
        long misTicketsResueltos = 0;
        if (authentication != null) {
            Usuario usuario = usuarioService.getUsuarioPorCorreo(authentication.getName());
            if (usuario != null) {
                misTicketsPendientes = todosTickets.stream()
                        .filter(t -> usuario.equals(t.getAsignadoPara())
                        && ("Abierto".equals(t.getEstado()) || "Pendiente".equals(t.getEstado())))
                        .count();
                misTicketsResueltos = todosTickets.stream()
                        .filter(t -> usuario.equals(t.getAsignadoPara())
                        && ("Resuelto".equals(t.getEstado()) || "Cerrado".equals(t.getEstado())))
                        .count();
            }
        }

        // Tickets por diferentes períodos
        Map<String, Long> ticketsPorMes6m = calcularTicketsPorPeriodo(todosTickets, 6);
        Map<String, Long> ticketsPorMes1y = calcularTicketsPorPeriodo(todosTickets, 12);
        Map<String, Long> ticketsPorMes3m = calcularTicketsPorPeriodo(todosTickets, 3);

        // Tickets abiertos y resueltos por mes para el gráfico
        Map<String, Map<String, Long>> estadoTickets6m = calcularEstadoTicketsPorPeriodo(todosTickets, 6);
        Map<String, Map<String, Long>> estadoTickets1y = calcularEstadoTicketsPorPeriodo(todosTickets, 12);
        Map<String, Map<String, Long>> estadoTickets3m = calcularEstadoTicketsPorPeriodo(todosTickets, 3);

        // Categorías más comunes
        Map<String, Long> categoriasPopulares = calcularCategoriasPopulares(todosTickets);

        // Colaboradores más activos
        Map<String, Long> colaboradoresActivos = calcularColaboradoresActivos(todosTickets, todosUsuarios);

        // Historial de auditoría
        List<Map<String, Object>> historialAuditoria = obtenerHistorialAuditoria();

        // Ordenar los meses cronológicamente
        ticketsPorMes6m = ordenarMeses(ticketsPorMes6m);
        ticketsPorMes1y = ordenarMeses(ticketsPorMes1y);
        ticketsPorMes3m = ordenarMeses(ticketsPorMes3m);

        estadoTickets6m = ordenarMesesEnMapa(estadoTickets6m);
        estadoTickets1y = ordenarMesesEnMapa(estadoTickets1y);
        estadoTickets3m = ordenarMesesEnMapa(estadoTickets3m);

        // Agregar datos al modelo
        model.addAttribute("totalTickets", totalTickets);
        model.addAttribute("ticketsAbiertos", ticketsAbiertos);
        model.addAttribute("ticketsPendientes", ticketsPendientes);
        model.addAttribute("ticketsResueltos", ticketsResueltos);
        model.addAttribute("ticketsCerrados", ticketsCerrados);
        model.addAttribute("totalUsuarios", totalUsuarios);
        model.addAttribute("totalColaboradores", totalColaboradores);
        model.addAttribute("misTicketsPendientes", misTicketsPendientes);
        model.addAttribute("misTicketsResueltos", misTicketsResueltos);

        // Datos para gráficos
        model.addAttribute("ticketsPorMes", ticketsPorMes6m);
        model.addAttribute("ticketsPorUltimoAnio", ticketsPorMes1y);
        model.addAttribute("ticketsPorUltimoTrimestre", ticketsPorMes3m);

        model.addAttribute("estadoTicketsPorMes", estadoTickets6m);
        model.addAttribute("estadoTicketsPorUltimoAnio", estadoTickets1y);
        model.addAttribute("estadoTicketsPorUltimoTrimestre", estadoTickets3m);

        model.addAttribute("categoriasPopulares", categoriasPopulares);
        model.addAttribute("colaboradoresActivos", colaboradoresActivos);
        model.addAttribute("historialAuditoria", historialAuditoria);

        return "reportes/listado";
    }

    @GetMapping("/datos")
    public ResponseEntity<Map<String, Object>> obtenerDatosDashboard(Authentication authentication) {
        Map<String, Object> datos = new HashMap<>();

        // Estadísticas principales
        List<Ticket> todosTickets = ticketService.getTickets();
        List<Usuario> todosUsuarios = usuarioService.getUsuarios();

        datos.put("totalTickets", todosTickets.size());
        // Modified: Count only unassigned tickets with "Abierto" status
        datos.put("ticketsAbiertos", todosTickets.stream()
                .filter(t -> "Abierto".equals(t.getEstado()) && t.getAsignadoPara() == null)
                .count());
        datos.put("ticketsPendientes", todosTickets.stream()
                .filter(t -> "Pendiente".equals(t.getEstado()))
                .count());
        datos.put("ticketsResueltos", todosTickets.stream()
                .filter(t -> "Resuelto".equals(t.getEstado()))
                .count());
        datos.put("ticketsCerrados", todosTickets.stream()
                .filter(t -> "Cerrado".equals(t.getEstado()))
                .count());
        datos.put("totalUsuarios", todosUsuarios.size());
        datos.put("totalColaboradores", todosUsuarios.stream()
                .filter(u -> u.getRoles().stream()
                .anyMatch(r -> "ROL_SOPORTISTA".equals(r.getNombre()) || "ROL_ADMINISTRADOR".equals(r.getNombre())))
                .count());

        // Tickets del usuario autenticado
        long misTicketsPendientes = 0;
        long misTicketsResueltos = 0;
        if (authentication != null) {
            Usuario usuario = usuarioService.getUsuarioPorCorreo(authentication.getName());
            if (usuario != null) {
                misTicketsPendientes = todosTickets.stream()
                        .filter(t -> usuario.equals(t.getAsignadoPara())
                        && ("Abierto".equals(t.getEstado()) || "Pendiente".equals(t.getEstado())))
                        .count();
                misTicketsResueltos = todosTickets.stream()
                        .filter(t -> usuario.equals(t.getAsignadoPara())
                        && ("Resuelto".equals(t.getEstado()) || "Cerrado".equals(t.getEstado())))
                        .count();
            }
        }
        datos.put("misTicketsPendientes", misTicketsPendientes);
        datos.put("misTicketsResueltos", misTicketsResueltos);

        // Datos para gráficos
        datos.put("ticketsPorMes", calcularTicketsPorPeriodo(todosTickets, 6));
        datos.put("ticketsPorUltimoAnio", calcularTicketsPorPeriodo(todosTickets, 12));
        datos.put("ticketsPorUltimoTrimestre", calcularTicketsPorPeriodo(todosTickets, 3));
        datos.put("estadoTicketsPorMes", calcularEstadoTicketsPorPeriodo(todosTickets, 6));
        datos.put("estadoTicketsPorUltimoAnio", calcularEstadoTicketsPorPeriodo(todosTickets, 12));
        datos.put("estadoTicketsPorUltimoTrimestre", calcularEstadoTicketsPorPeriodo(todosTickets, 3));

        // Categorías y colaboradores
        datos.put("categoriasPopulares", calcularCategoriasPopulares(todosTickets));
        datos.put("colaboradoresActivos", calcularColaboradoresActivos(todosTickets, todosUsuarios));

        // Historial de auditoría
        datos.put("historialAuditoria", obtenerHistorialAuditoria());

        return ResponseEntity.ok(datos);
    }

    private List<Map<String, Object>> obtenerHistorialAuditoria() {
        try {
            List<Auditoria> auditorias = auditoriaService.findTop50RecentAuditActions();

            if (auditorias.isEmpty()) {
                return Collections.emptyList();
            }

            return auditorias.stream().map(auditoria -> {
                Map<String, Object> item = new HashMap<>();
                String icono = determinarIconoAuditoria(auditoria.getAccion());
                String accion = formatearAccionAuditoria(auditoria);
                String usuario = "Sistema";

                if (auditoria.getUsuario() != null) {
                    usuario = auditoria.getUsuario().getNombre() + " " + auditoria.getUsuario().getApellido();
                    if (auditoria.getUsuario().getCodigo() != null) {
                        usuario += " (" + auditoria.getUsuario().getCodigo() + ")";
                    }
                }

                String tiempoTranscurrido = calcularTiempoTranscurrido(auditoria.getFechaAccion());
                String infoTicket = "";

                if (auditoria.getTicket() != null) {
                    infoTicket = "Ticket #" + auditoria.getTicket().getIdTicket();
                    if (auditoria.getTicket().getCodigo() != null) {
                        infoTicket = auditoria.getTicket().getCodigo();
                    }
                }

                item.put("accion", accion);
                item.put("icono", icono);
                item.put("usuario", usuario);
                item.put("tiempo", tiempoTranscurrido);
                item.put("infoTicket", infoTicket);
                item.put("fechaAccion", auditoria.getFechaAccion());
                item.put("detalle", auditoria.getDetalle());

                return item;
            }).collect(Collectors.toList());
        } catch (Exception e) {
            System.err.println("Error obteniendo historial de auditoría: " + e.getMessage());
            e.printStackTrace();
            return Collections.emptyList();
        }
    }

    private String determinarIconoAuditoria(String accion) {
        if (accion == null) {
            return "fa-ticket-alt";
        }

        return switch (accion.toUpperCase()) {
            case "CREACION" ->
                "fa-plus-circle";
            case "ACTUALIZACION" ->
                "fa-edit";
            case "ASIGNACION" ->
                "fa-user-tag";
            case "CAMBIO_ESTADO" ->
                "fa-exchange-alt";
            case "CIERRE" ->
                "fa-check-circle";
            case "COMENTARIO" ->
                "fa-comment";
            case "REAPERTURA" ->
                "fa-undo";
            case "PRIORIDAD" ->
                "fa-exclamation-circle";
            default ->
                "fa-ticket-alt";
        };
    }

    private String formatearAccionAuditoria(Auditoria auditoria) {
        if (auditoria.getAccion() == null) {
            return "Acción no especificada";
        }

        String accionBase = switch (auditoria.getAccion().toUpperCase()) {
            case "CREACION" ->
                "Nuevo ticket creado";
            case "ACTUALIZACION" ->
                "Ticket actualizado";
            case "ASIGNACION" ->
                "Ticket reasignado";
            case "CAMBIO_ESTADO" ->
                "Cambio de estado del ticket";
            case "CIERRE" ->
                "Ticket cerrado";
            case "COMENTARIO" ->
                "Nuevo comentario en ticket";
            case "REAPERTURA" ->
                "Ticket reabierto";
            case "PRIORIDAD" ->
                "Cambio de prioridad";
            default ->
                "Acción en ticket";
        };

        if (auditoria.getTicket() != null) {
            accionBase += " (" + (auditoria.getTicket().getCodigo() != null
                    ? auditoria.getTicket().getCodigo()
                    : "#" + auditoria.getTicket().getIdTicket()) + ")";
        }

        return accionBase;
    }

    private String calcularTiempoTranscurrido(Date fecha) {
        if (fecha == null) {
            return "Hace algún tiempo";
        }

        long diff = new Date().getTime() - fecha.getTime();
        long diffMinutes = diff / (60 * 1000);
        long diffHours = diff / (60 * 60 * 1000);
        long diffDays = diff / (24 * 60 * 60 * 1000);

        if (diffMinutes < 1) {
            return "Hace unos momentos";
        }
        if (diffMinutes < 60) {
            return "Hace " + diffMinutes + " minuto" + (diffMinutes > 1 ? "s" : "");
        }
        if (diffHours < 24) {
            return "Hace " + diffHours + " hora" + (diffHours > 1 ? "s" : "");
        }
        if (diffDays < 7) {
            return "Hace " + diffDays + " día" + (diffDays > 1 ? "s" : "");
        }
        return "Hace " + (diffDays / 7) + " semana" + ((diffDays / 7) > 1 ? "s" : "");
    }

    private Map<String, Long> calcularTicketsPorPeriodo(List<Ticket> tickets, int meses) {
        Map<String, Long> ticketsPorPeriodo = new LinkedHashMap<>();
        LocalDate ahora = LocalDate.now();

        // Inicializar los meses con 0
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

                // Solo considerar los meses dentro del período
                if (fechaTicket.isAfter(ahora.minusMonths(meses).minusDays(1))) {
                    ticketsPorPeriodo.put(mes, ticketsPorPeriodo.getOrDefault(mes, 0L) + 1);
                }
            }
        });

        return ticketsPorPeriodo;
    }

    private Map<String, Map<String, Long>> calcularEstadoTicketsPorPeriodo(List<Ticket> tickets, int meses) {
        Map<String, Map<String, Long>> estadoPorPeriodo = new LinkedHashMap<>();
        LocalDate ahora = LocalDate.now();

        // Inicializar los meses
        for (int i = meses - 1; i >= 0; i--) {
            LocalDate mes = ahora.minusMonths(i);
            String claveMes = obtenerNombreMes(mes.getMonthValue()) + " " + mes.getYear();

            Map<String, Long> estados = new HashMap<>();
            estados.put("Pendientes", 0L); // Only track "Pendiente" tickets
            estados.put("Resueltos", 0L);  // Keep "Resueltos" for consistency

            estadoPorPeriodo.put(claveMes, estados);
        }

        // Contar por estado y mes
        tickets.forEach(t -> {
            if (t.getFechaApertura() != null) {
                LocalDate fechaTicket = t.getFechaApertura().toInstant()
                        .atZone(ZoneId.systemDefault()).toLocalDate();
                String mes = obtenerNombreMes(fechaTicket.getMonthValue()) + " " + fechaTicket.getYear();

                // Solo considerar los meses dentro del período
                if (fechaTicket.isAfter(ahora.minusMonths(meses).minusDays(1))) {
                    Map<String, Long> estados = estadoPorPeriodo.get(mes);
                    if (estados != null) {
                        if ("Resuelto".equals(t.getEstado()) || "Cerrado".equals(t.getEstado())) {
                            estados.put("Resueltos", estados.get("Resueltos") + 1);
                        } else if ("Pendiente".equals(t.getEstado())) { // Only count "Pendiente"
                            estados.put("Pendientes", estados.get("Pendientes") + 1);
                        }
                    }
                }
            }
        });

        return estadoPorPeriodo;
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
        // Filtramos usuarios que son colaboradores (soporte o admin)
        List<Usuario> colaboradores = usuarios.stream()
                .filter(u -> u.getRoles().stream()
                .anyMatch(r -> "ROL_SOPORTISTA".equals(r.getNombre())
                || "ROL_ADMINISTRADOR".equals(r.getNombre())))
                .collect(Collectors.toList());

        // Contamos tickets resueltos por colaborador
        Map<String, Long> colaboradoresActivos = new HashMap<>();

        for (Usuario colaborador : colaboradores) {
            long ticketsResueltos = tickets.stream()
                    .filter(t -> colaborador.equals(t.getAsignadoPara())
                    && ("Resuelto".equals(t.getEstado()) || "Cerrado".equals(t.getEstado())))
                    .count();

            // Mostrar todos los colaboradores, incluso si no han resuelto tickets
            String nombreCompleto = colaborador.getNombre() + " " + colaborador.getApellido();
            if (colaborador.getCodigo() != null && !colaborador.getCodigo().isEmpty()) {
                nombreCompleto += " (" + colaborador.getCodigo() + ")";
            }
            colaboradoresActivos.put(nombreCompleto, ticketsResueltos);
        }

        // Ordenamos por cantidad de tickets resueltos (descendente)
        return colaboradoresActivos.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (e1, e2) -> e1,
                        LinkedHashMap::new
                ));
    }

    private String obtenerNombreMes(int mes) {
        String[] nombresMeses = {"Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"};
        return nombresMeses[mes - 1];
    }

    private Map<String, Long> ordenarMeses(Map<String, Long> mapa) {
        // Ordenar por año y mes
        return mapa.entrySet().stream()
                .sorted((e1, e2) -> {
                    String[] parts1 = e1.getKey().split(" ");
                    String[] parts2 = e2.getKey().split(" ");
                    int year1 = Integer.parseInt(parts1[1]);
                    int year2 = Integer.parseInt(parts2[1]);
                    if (year1 != year2) {
                        return Integer.compare(year1, year2);
                    }

                    String mes1 = parts1[0];
                    String mes2 = parts2[0];
                    List<String> mesesOrdenados = Arrays.asList("Ene", "Feb", "Mar", "Abr", "May", "Jun",
                            "Jul", "Ago", "Sep", "Oct", "Nov", "Dic");
                    return Integer.compare(mesesOrdenados.indexOf(mes1), mesesOrdenados.indexOf(mes2));
                })
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (e1, e2) -> e1,
                        LinkedHashMap::new
                ));
    }

    private Map<String, Map<String, Long>> ordenarMesesEnMapa(Map<String, Map<String, Long>> mapa) {
        // Ordenar por año y mes
        return mapa.entrySet().stream()
                .sorted((e1, e2) -> {
                    String[] parts1 = e1.getKey().split(" ");
                    String[] parts2 = e2.getKey().split(" ");
                    int year1 = Integer.parseInt(parts1[1]);
                    int year2 = Integer.parseInt(parts2[1]);
                    if (year1 != year2) {
                        return Integer.compare(year1, year2);
                    }

                    String mes1 = parts1[0];
                    String mes2 = parts2[0];
                    List<String> mesesOrdenados = Arrays.asList("Ene", "Feb", "Mar", "Abr", "May", "Jun",
                            "Jul", "Ago", "Sep", "Oct", "Nov", "Dic");
                    return Integer.compare(mesesOrdenados.indexOf(mes1), mesesOrdenados.indexOf(mes2));
                })
                .collect(Collectors.toMap(
                        Map.Entry::getKey,
                        Map.Entry::getValue,
                        (e1, e2) -> e1,
                        LinkedHashMap::new
                ));
    }

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

        // Extraer filtros de columnas
        Map<String, String> columnFilters = allParams.entrySet().stream()
                .filter(e -> e.getKey().startsWith("filter_")
                && !e.getKey().matches("filter_(fechaAperturaFrom|fechaAperturaTo|fechaActualizacionFrom|fechaActualizacionTo)")
                && !e.getValue().isEmpty())
                .collect(Collectors.toMap(
                        e -> e.getKey().replace("filter_", ""),
                        Map.Entry::getValue
                ));

        // Obtener lista base según la sección
        List<Ticket> baseTickets;
        String tituloSeccion;

        if ("mis-tickets".equals(section) && authentication != null) {
            Usuario usuario = usuarioService.getUsuarioPorCorreo(authentication.getName());
            baseTickets = usuario != null ? ticketService.getTicketsPorAsignado(usuario) : ticketService.getTickets();
            String codigoUsuario = (usuario != null && usuario.getCodigo() != null) ? " (" + usuario.getCodigo() + ")" : "";
            tituloSeccion = "Mis Tickets" + codigoUsuario;
        } else if ("sin-asignar".equals(section)) {
            baseTickets = ticketService.getTicketsSinAsignar();
            tituloSeccion = "Sin Asignar";
        } else if ("todos".equals(section)) {
            baseTickets = ticketService.getTickets();
            tituloSeccion = "Todos";
        } else {
            baseTickets = ticketService.getTickets();
            tituloSeccion = section != null ? section : "Todos";
        }

        // Aplicar filtros
        List<Ticket> filteredTickets = ticketService.buscarTicketsPorFiltrosAvanzadosEnLista(
                baseTickets,
                columnFilters,
                search,
                filter_fechaAperturaFrom,
                filter_fechaAperturaTo,
                filter_fechaActualizacionFrom,
                filter_fechaActualizacionTo);

        // Convertir Tickets a DTOs para el reporte
        List<Map<String, Object>> reportData = filteredTickets.stream()
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

        // Preparar información de filtros para el reporte
        StringBuilder filtrosAplicados = new StringBuilder();

        // Filtros de búsqueda general
        if (search != null && !search.isEmpty()) {
            filtrosAplicados.append("Búsqueda: ").append(search).append(", ");
        }

        // Método para formatear fechas de yyyy-MM-dd a dd/MM/yyyy
        DateTimeFormatter inputFormatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        DateTimeFormatter outputFormatter = DateTimeFormatter.ofPattern("dd/MM/yyyy");

        // Filtros de fechas - FORMATEAR AQUÍ
        agregarFiltroFecha(filtrosAplicados, "Fecha apertura desde", filter_fechaAperturaFrom, inputFormatter, outputFormatter);
        agregarFiltroFecha(filtrosAplicados, "Fecha apertura hasta", filter_fechaAperturaTo, inputFormatter, outputFormatter);
        agregarFiltroFecha(filtrosAplicados, "Fecha actualización desde", filter_fechaActualizacionFrom, inputFormatter, outputFormatter);
        agregarFiltroFecha(filtrosAplicados, "Fecha actualización hasta", filter_fechaActualizacionTo, inputFormatter, outputFormatter);

        // Filtros de columnas
        if (!columnFilters.isEmpty()) {
            columnFilters.forEach((campo, valor) -> {
                filtrosAplicados.append(campo).append(": ").append(valor).append(", ");
            });
        }

        // Parámetros para el reporte
        Map<String, Object> parametros = new HashMap<>();
        parametros.put("TITULO_REPORTE", "Reporte de Tickets - " + tituloSeccion);
        parametros.put("TICKETS_DATA_SOURCE", new JRBeanCollectionDataSource(reportData));
        parametros.put("FILTROS_APLICADOS", filtrosAplicados.toString());
        parametros.put("HAY_FILTROS", !filtrosAplicados.toString().isEmpty());

        return reporteService.generaReporte("ReporteTickets", parametros, tipo);
    }

// Método auxiliar para agregar filtros de fecha formateados
    private void agregarFiltroFecha(StringBuilder filtros, String etiqueta, String fecha,
            DateTimeFormatter inputFormatter, DateTimeFormatter outputFormatter) {
        if (fecha != null && !fecha.isEmpty()) {
            String fechaFormateada = formatearFecha(fecha, inputFormatter, outputFormatter);
            filtros.append(etiqueta).append(": ").append(fechaFormateada).append(", ");
        }
    }

// Método auxiliar para formatear fechas
    private String formatearFecha(String fecha, DateTimeFormatter inputFormatter, DateTimeFormatter outputFormatter) {
        try {
            LocalDate localDate = LocalDate.parse(fecha, inputFormatter);
            return localDate.format(outputFormatter);
        } catch (Exception e) {
            // Si hay error en el parseo, devolver la fecha original
            System.err.println("Error formateando fecha: " + fecha + " - " + e.getMessage());
            return fecha;
        }
    }
}
