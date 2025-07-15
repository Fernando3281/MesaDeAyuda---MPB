package com.mesadeayudaMPB.service.impl;

import com.mesadeayudaMPB.dao.TicketDao;
import com.mesadeayudaMPB.domain.Ticket;
import com.mesadeayudaMPB.domain.Usuario;
import com.mesadeayudaMPB.service.TicketService;
import java.text.ParseException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Calendar;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Random;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class TicketServiceImpl implements TicketService {

    @Autowired
    private TicketDao ticketDao;

    @Override
    @Transactional
    public void save(Ticket ticket) {
        ticketDao.save(ticket);
    }

    @Override
    @Transactional
    public void delete(Ticket ticket) {
        ticketDao.delete(ticket);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Ticket> getTickets() {
        return ticketDao.findAll(Sort.by(Sort.Direction.DESC, "fechaApertura"));
    }

    @Override
    @Transactional(readOnly = true)
    public List<Ticket> getTicketsPorSolicitanteYEstado(Usuario solicitante, String estado) {
        return ticketDao.findBySolicitanteAndEstadoOrderByFechaAperturaDesc(solicitante, estado);
    }

    @Override
    @Transactional(readOnly = true)
    public Ticket getTicket(Ticket ticket) {
        return ticketDao.findById(ticket.getIdTicket()).orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public Ticket getTicketPorCodigo(String codigo) {
        return ticketDao.findByCodigo(codigo);
    }

    @Override
    public String generarCodigoTicket() {
        Random random = new Random();
        String codigo;
        do {
            StringBuilder sb = new StringBuilder("TIC");
            for (int i = 0; i < 8; i++) {
                sb.append(random.nextInt(10));
            }
            codigo = sb.toString();
        } while (ticketDao.existsByCodigo(codigo));
        return codigo;
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Ticket> getTicketsPaginados(Pageable pageable) {
        return ticketDao.findAll(pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Ticket> buscarTickets(String search, Pageable pageable) {
        return ticketDao.findByCodigoContainingOrTituloContainingOrDescripcionContaining(
                search, search, search, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Ticket> getTicketsPorSolicitante(Usuario solicitante) {
        return ticketDao.findBySolicitanteOrderByFechaAperturaDesc(solicitante);
    }

    @Override
    @Transactional(readOnly = true)
    public Ticket getTicketPorId(Long idTicket) {
        return ticketDao.findById(idTicket).orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Ticket> getTicketsConMensajes(Usuario usuario) {
        boolean esAdmin = usuario.getRoles().stream()
                .anyMatch(rol -> "ROL_ADMINISTRADOR".equals(rol.getNombre()));
        boolean esSoportista = usuario.getRoles().stream()
                .anyMatch(rol -> "ROL_SOPORTISTA".equals(rol.getNombre()));

        if (esAdmin) {
            return ticketDao.findTicketsWithMessages();
        } else if (esSoportista) {
            return ticketDao.findTicketsWithMessagesBySupport(usuario.getIdUsuario());
        } else {
            return ticketDao.findTicketsWithMessagesByClient(usuario.getIdUsuario());
        }
    }

    @Override
    @Transactional
    public void eliminarTicketsPorUsuario(Long idUsuario) {
        ticketDao.deleteBySolicitanteId(idUsuario);
        ticketDao.clearAsignadoPara(idUsuario);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Ticket> getTicketsPorEstado(String estado) {
        return ticketDao.findByEstado(estado);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Ticket> buscarTicketsPorFiltros(Map<String, String> columnFilters, String searchTerm) {
        return buscarTicketsPorFiltrosAvanzados(columnFilters, searchTerm, null, null, null, null);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Ticket> buscarTicketsPorFiltrosAvanzados(
            Map<String, String> columnFilters, 
            String searchTerm,
            String fechaAperturaFrom,
            String fechaAperturaTo,
            String fechaActualizacionFrom,
            String fechaActualizacionTo) {
        
        List<Ticket> allTickets = ticketDao.findAll(Sort.by(Sort.Direction.DESC, "fechaApertura"));
        
        return allTickets.stream()
                .filter(ticket -> {
                    boolean matches = true;
                    
                    // Aplicar búsqueda global si existe
                    if (searchTerm != null && !searchTerm.isEmpty()) {
                        String searchLower = searchTerm.toLowerCase();
                        matches = ticket.getCodigo().toLowerCase().contains(searchLower) ||
                                  ticket.getTitulo().toLowerCase().contains(searchLower) ||
                                  ticket.getDescripcion().toLowerCase().contains(searchLower) ||
                                  ticket.getCategoria().toLowerCase().contains(searchLower) ||
                                  (ticket.getSolicitante().getNombre() + " " + ticket.getSolicitante().getApellido()).toLowerCase().contains(searchLower) ||
                                  (ticket.getAsignadoPara() != null && 
                                   (ticket.getAsignadoPara().getNombre() + " " + ticket.getAsignadoPara().getApellido()).toLowerCase().contains(searchLower));
                    }
                    
                    // Aplicar filtros de columnas
                    if (matches && columnFilters != null && !columnFilters.isEmpty()) {
                        for (Map.Entry<String, String> entry : columnFilters.entrySet()) {
                            String filterValue = entry.getValue().toLowerCase();
                            
                            switch (entry.getKey()) {
                                case "codigo":
                                    matches = matches && ticket.getCodigo().toLowerCase().contains(filterValue);
                                    break;
                                case "fechaApertura":
                                    String fechaApertura = new SimpleDateFormat("dd/MM/yyyy").format(ticket.getFechaApertura());
                                    matches = matches && fechaApertura.toLowerCase().contains(filterValue);
                                    break;
                                case "titulo":
                                    matches = matches && ticket.getTitulo().toLowerCase().contains(filterValue);
                                    break;
                                case "solicitante":
                                    String solicitante = ticket.getSolicitante().getNombre() + " " + ticket.getSolicitante().getApellido();
                                    matches = matches && solicitante.toLowerCase().contains(filterValue);
                                    break;
                                case "prioridad":
                                    matches = matches && ticket.getPrioridad().toLowerCase().contains(filterValue);
                                    break;
                                case "estado":
                                    matches = matches && ticket.getEstado().toLowerCase().contains(filterValue);
                                    break;
                                case "categoria":
                                    matches = matches && ticket.getCategoria().toLowerCase().contains(filterValue);
                                    break;
                                case "asignadoPara":
                                    String asignadoPara = ticket.getAsignadoPara() != null ? 
                                            ticket.getAsignadoPara().getNombre() + " " + ticket.getAsignadoPara().getApellido() : 
                                            "sin asignar";
                                    matches = matches && asignadoPara.toLowerCase().contains(filterValue);
                                    break;
                                case "fechaActualizacion":
                                    String fechaActualizacion = new SimpleDateFormat("dd/MM/yyyy").format(ticket.getFechaActualizacion());
                                    matches = matches && fechaActualizacion.toLowerCase().contains(filterValue);
                                    break;
                            }
                            
                            if (!matches) break;
                        }
                    }
                    
                    // Aplicar filtros de fecha para Apertura
                    if (matches && (fechaAperturaFrom != null || fechaAperturaTo != null)) {
                        try {
                            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
                            Date fechaApertura = ticket.getFechaApertura();
                            
                            if (fechaAperturaFrom != null && !fechaAperturaFrom.isEmpty()) {
                                Date fromDate = sdf.parse(fechaAperturaFrom);
                                matches = matches && !fechaApertura.before(fromDate);
                            }
                            
                            if (fechaAperturaTo != null && !fechaAperturaTo.isEmpty()) {
                                Date toDate = sdf.parse(fechaAperturaTo);
                                // Añadir 1 día para incluir el día completo
                                Calendar cal = Calendar.getInstance();
                                cal.setTime(toDate);
                                cal.add(Calendar.DATE, 1);
                                toDate = cal.getTime();
                                
                                matches = matches && !fechaApertura.after(toDate);
                            }
                        } catch (ParseException e) {
                            matches = false;
                        }
                    }
                    
                    // Aplicar filtros de fecha para Actualización
                    if (matches && (fechaActualizacionFrom != null || fechaActualizacionTo != null)) {
                        try {
                            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd");
                            Date fechaActualizacion = ticket.getFechaActualizacion();
                            
                            if (fechaActualizacionFrom != null && !fechaActualizacionFrom.isEmpty()) {
                                Date fromDate = sdf.parse(fechaActualizacionFrom);
                                matches = matches && !fechaActualizacion.before(fromDate);
                            }
                            
                            if (fechaActualizacionTo != null && !fechaActualizacionTo.isEmpty()) {
                                Date toDate = sdf.parse(fechaActualizacionTo);
                                // Añadir 1 día para incluir el día completo
                                Calendar cal = Calendar.getInstance();
                                cal.setTime(toDate);
                                cal.add(Calendar.DATE, 1);
                                toDate = cal.getTime();
                                
                                matches = matches && !fechaActualizacion.after(toDate);
                            }
                        } catch (ParseException e) {
                            matches = false;
                        }
                    }
                    
                    return matches;
                })
                .collect(Collectors.toList());
    }
}