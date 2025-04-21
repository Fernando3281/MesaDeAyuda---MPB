package com.mesadeayudaMPB.service;

import com.mesadeayudaMPB.domain.Ticket;
import com.mesadeayudaMPB.domain.Usuario;
import java.util.List;
import org.springframework.data.domain.Page;

public interface TicketService {

    void save(Ticket ticket);

    void delete(Ticket ticket);

    List<Ticket> getTickets();

    List<Ticket> getTicketsPorSolicitanteYEstado(Usuario solicitante, String estado);

    Ticket getTicket(Ticket ticket);

    Ticket getTicketPorCodigo(String codigo);

    String generarCodigoTicket();

    Page<Ticket> getTicketsPaginados(int page, int size);

    List<Ticket> getTicketsPorSolicitante(Usuario solicitante);

    // Agregar este método
    Ticket getTicketPorId(Long idTicket);

    List<Ticket> getTicketsConMensajes(Usuario usuario);
}
