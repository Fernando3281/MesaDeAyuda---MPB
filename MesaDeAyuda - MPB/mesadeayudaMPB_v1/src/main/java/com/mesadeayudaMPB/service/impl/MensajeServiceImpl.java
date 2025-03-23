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
}