package com.mesadeayudaMPB.service.impl;

import com.mesadeayudaMPB.dao.TicketDao;
import com.mesadeayudaMPB.domain.ArchivoTicket;
import com.mesadeayudaMPB.domain.Ticket;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import com.mesadeayudaMPB.service.ArchivoTicketService;
import com.mesadeayudaMPB.dao.ArchivoTicketDao;

@Service
public class ArchivoTicketServiceImpl implements ArchivoTicketService {

    @Autowired
    private ArchivoTicketDao archivoTicketDao;

    @Autowired
    private TicketDao ticketDao;

    @Override
    @Transactional
    public void guardarArchivo(Long idTicket, byte[] archivo, String nombreArchivo, String tipoArchivo) {
        if (archivo == null || archivo.length == 0) {
            return;
        }

        Ticket ticket = ticketDao.findById(idTicket)
                .orElseThrow(() -> new RuntimeException("Ticket no encontrado"));

        ArchivoTicket archivoTicket = new ArchivoTicket();
        archivoTicket.setTicket(ticket);
        archivoTicket.setArchivo(archivo);
        archivoTicket.setNombreArchivo(nombreArchivo);
        archivoTicket.setTipoArchivo(tipoArchivo);

        archivoTicketDao.save(archivoTicket);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ArchivoTicket> obtenerArchivosPorTicket(Long idTicket) {
        return archivoTicketDao.findArchivosCompletasByTicketId(idTicket);
    }

    @Override
    @Transactional(readOnly = true)
    public ArchivoTicket obtenerArchivoPorId(Long idArchivo) {
        return archivoTicketDao.findById(idArchivo).orElse(null);
    }

    @Override
    @Transactional
    public void eliminarArchivosPorTicket(Long idTicket) {
        archivoTicketDao.deleteByTicketId(idTicket);
    }
}