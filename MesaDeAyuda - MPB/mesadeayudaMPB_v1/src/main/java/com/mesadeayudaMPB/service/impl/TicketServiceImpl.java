package com.mesadeayudaMPB.service.impl;

import com.mesadeayudaMPB.dao.TicketDao;
import com.mesadeayudaMPB.domain.Ticket;
import com.mesadeayudaMPB.domain.Usuario;
import com.mesadeayudaMPB.service.TicketService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Optional;
import java.util.Random;

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
        return ticketDao.findAll(Sort.by("fechaApertura").descending());
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
    public Page<Ticket> getTicketsPaginados(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("fechaApertura").descending());
        return ticketDao.findAll(pageable);
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
            // Si es admin, obtener todos los tickets que tienen mensajes
            return ticketDao.findTicketsWithMessages();
        } else if (esSoportista) {
            // Si es soportista, obtener tickets asignados a él que tienen mensajes
            return ticketDao.findTicketsWithMessagesBySupport(usuario.getIdUsuario());
        } else {
            // Si es cliente, obtener sus tickets que tienen mensajes
            return ticketDao.findTicketsWithMessagesByClient(usuario.getIdUsuario());
        }
    }
}
