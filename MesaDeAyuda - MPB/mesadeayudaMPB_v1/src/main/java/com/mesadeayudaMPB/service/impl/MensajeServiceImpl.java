package com.mesadeayudaMPB.service.impl;

import com.mesadeayudaMPB.dao.MensajeDao;
import com.mesadeayudaMPB.domain.Mensajes;
import com.mesadeayudaMPB.domain.Usuario;
import com.mesadeayudaMPB.service.MensajeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Date;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class MensajeServiceImpl implements MensajeService {

    @Autowired
    private MensajeDao mensajeDao;

    @Override
    @Transactional(readOnly = true)
    public List<Mensajes> obtenerMensajesPorTicket(Long idTicket) {
        return mensajeDao.findByTicketIdTicketOrderByFechaHoraAsc(idTicket);
    }

    @Override
    @Transactional
    public Mensajes guardarMensaje(Mensajes mensaje) {
        return mensajeDao.save(mensaje);
    }

    @Override
    @Transactional(readOnly = true)
    public Mensajes obtenerMensajePorId(Long idMensaje) {
        return mensajeDao.findById(idMensaje).orElse(null);
    }

    @Override
    @Transactional
    public void eliminarMensajesPorUsuario(Long idUsuario) {
        mensajeDao.deleteByEmisorIdOrReceptorId(idUsuario);
    }

    @Override
    @Transactional
    public boolean eliminarMensaje(Long idMensaje, Long idUsuario) {
        return mensajeDao.deleteByIdAndEmisorId(idMensaje, idUsuario) > 0;
    }

    @Override
    @Transactional(readOnly = true)
    public List<Mensajes> buscarEnTicket(Long idTicket, String searchTerm) {
        return mensajeDao.searchInTicket(idTicket, searchTerm);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Mensajes> filtrarPorTipo(Long idTicket, boolean esNotaInterna) {
        return mensajeDao.filterByType(idTicket, esNotaInterna);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Mensajes> filtrarPorUsuario(Long idTicket, Long idUsuario) {
        return mensajeDao.filterByUser(idTicket, idUsuario);
    }

    @Override
    @Transactional(readOnly = true)
    public long contarMensajesPorTicket(Long idTicket) {
        return mensajeDao.countByTicketIdTicket(idTicket);
    }

    @Override
    @Transactional(readOnly = true)
    public long contarMensajesPorTipo(Long idTicket, boolean esNotaInterna) {
        return mensajeDao.countByTicketIdTicketAndEsNotaInterna(idTicket, esNotaInterna);
    }

    @Override
    @Transactional(readOnly = true)
    public long contarMensajesPorUsuario(Long idTicket, Long idUsuario) {
        return mensajeDao.countByTicketIdTicketAndEmisorIdUsuario(idTicket, idUsuario);
    }

    @Override
    @Transactional(readOnly = true)
    public Date obtenerUltimoMensajeFecha(Long idTicket) {
        return mensajeDao.findTopByTicketIdTicketOrderByFechaHoraDesc(idTicket)
                .map(Mensajes::getFechaHora)
                .orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hayNuevosMensajes(Long ticketId, Long ultimoMensajeId) {
        Optional<Mensajes> ultimoMensaje = mensajeDao.findTopByTicketIdTicketOrderByFechaHoraDesc(ticketId);
        return ultimoMensaje.isPresent()
                && (ultimoMensaje.get().getIdMensaje() > ultimoMensajeId
                || !mensajeDao.existsById(ultimoMensajeId));
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<Mensajes> obtenerUltimoMensaje(Long ticketId) {
        return mensajeDao.findTopByTicketIdTicketOrderByFechaHoraDesc(ticketId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Mensajes> obtenerMensajesVisiblesPorTicket(Long idTicket, Usuario usuario) {
        boolean esSoporteOAdmin = usuario.getRoles().stream()
                .anyMatch(r -> r.getNombre().equals("ROL_SOPORTISTA") || r.getNombre().equals("ROL_ADMINISTRADOR"));
        
        List<Mensajes> mensajes = mensajeDao.findByTicketIdTicketOrderByFechaHoraAsc(idTicket);
        if (!esSoporteOAdmin) {
            mensajes = mensajes.stream()
                    .filter(m -> !m.isEsNotaInterna())
                    .collect(Collectors.toList());
        }
        return mensajes;
    }

    @Override
    @Transactional(readOnly = true)
    public Date obtenerUltimoMensajeFechaVisible(Long idTicket, Usuario usuario) {
        boolean esSoporteOAdmin = usuario.getRoles().stream()
                .anyMatch(r -> r.getNombre().equals("ROL_SOPORTISTA") || r.getNombre().equals("ROL_ADMINISTRADOR"));
        
        if (esSoporteOAdmin) {
            return mensajeDao.findTopByTicketIdTicketOrderByFechaHoraDesc(idTicket)
                    .map(Mensajes::getFechaHora)
                    .orElse(null);
        } else {
            return mensajeDao.findTopByTicketIdTicketAndEsNotaInternaFalseOrderByFechaHoraDesc(idTicket)
                    .map(Mensajes::getFechaHora)
                    .orElse(null);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public long contarMensajesVisiblesPorTicket(Long idTicket, Usuario usuario) {
        boolean esSoporteOAdmin = usuario.getRoles().stream()
                .anyMatch(r -> r.getNombre().equals("ROL_SOPORTISTA") || r.getNombre().equals("ROL_ADMINISTRADOR"));
        
        if (esSoporteOAdmin) {
            return mensajeDao.countByTicketIdTicket(idTicket);
        } else {
            return mensajeDao.countByTicketIdTicketAndEsNotaInterna(idTicket, false);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hayNuevosMensajesVisibles(Long ticketId, Long ultimoMensajeId, Usuario usuario) {
        boolean esSoporteOAdmin = usuario.getRoles().stream()
                .anyMatch(r -> r.getNombre().equals("ROL_SOPORTISTA") || r.getNombre().equals("ROL_ADMINISTRADOR"));
        
        Optional<Mensajes> ultimoMensaje = esSoporteOAdmin
                ? mensajeDao.findTopByTicketIdTicketOrderByFechaHoraDesc(ticketId)
                : mensajeDao.findTopByTicketIdTicketAndEsNotaInternaFalseOrderByFechaHoraDesc(ticketId);
        
        return ultimoMensaje.isPresent()
                && (ultimoMensaje.get().getIdMensaje() > ultimoMensajeId
                || !mensajeDao.existsById(ultimoMensajeId));
    }
}