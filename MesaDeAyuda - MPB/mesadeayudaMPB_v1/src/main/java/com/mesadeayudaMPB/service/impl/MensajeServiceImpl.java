package com.mesadeayudaMPB.service.impl;

import com.mesadeayudaMPB.dao.MensajeDao;
import com.mesadeayudaMPB.domain.Mensajes;
import com.mesadeayudaMPB.service.MensajeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

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
}