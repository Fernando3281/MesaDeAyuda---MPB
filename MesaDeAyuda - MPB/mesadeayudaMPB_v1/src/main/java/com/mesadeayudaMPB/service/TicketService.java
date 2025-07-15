package com.mesadeayudaMPB.service;

import com.mesadeayudaMPB.domain.Ticket;
import com.mesadeayudaMPB.domain.Usuario;
import java.util.List;
import java.util.Map;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface TicketService {

    void save(Ticket ticket);

    void delete(Ticket ticket);

    List<Ticket> getTickets();

    List<Ticket> getTicketsPorSolicitanteYEstado(Usuario solicitante, String estado);

    Ticket getTicket(Ticket ticket);

    Ticket getTicketPorCodigo(String codigo);

    String generarCodigoTicket();

    Page<Ticket> getTicketsPaginados(Pageable pageable);

    Page<Ticket> buscarTickets(String search, Pageable pageable);

    List<Ticket> getTicketsPorSolicitante(Usuario solicitante);

    Ticket getTicketPorId(Long idTicket);

    List<Ticket> getTicketsConMensajes(Usuario usuario);

    void eliminarTicketsPorUsuario(Long idUsuario);

    List<Ticket> getTicketsPorEstado(String estado);

    List<Ticket> buscarTicketsPorFiltros(Map<String, String> columnFilters, String searchTerm);
    
    List<Ticket> buscarTicketsPorFiltrosAvanzados(
            Map<String, String> columnFilters, 
            String searchTerm,
            String fechaAperturaFrom,
            String fechaAperturaTo,
            String fechaActualizacionFrom,
            String fechaActualizacionTo);
}