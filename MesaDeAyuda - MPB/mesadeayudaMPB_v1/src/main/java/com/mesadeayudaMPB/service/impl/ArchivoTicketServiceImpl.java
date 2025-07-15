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
            System.out.println("DEBUG: Archivo is null or empty");
            return;
        }

        Ticket ticket = ticketDao.findById(idTicket)
                .orElseThrow(() -> new RuntimeException("Ticket no encontrado"));

        System.out.println("DEBUG: Saving archivo for ticket ID: " + idTicket);
        System.out.println("DEBUG: Archivo filename: " + nombreArchivo);
        System.out.println("DEBUG: Archivo type: " + tipoArchivo);
        System.out.println("DEBUG: Archivo size: " + archivo.length + " bytes");

        ArchivoTicket archivoTicket = new ArchivoTicket();
        archivoTicket.setTicket(ticket);
        archivoTicket.setArchivo(archivo);
        archivoTicket.setNombreArchivo(nombreArchivo);
        archivoTicket.setTipoArchivo(tipoArchivo);

        archivoTicketDao.save(archivoTicket);
        System.out.println("DEBUG: archivo saved successfully");
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
