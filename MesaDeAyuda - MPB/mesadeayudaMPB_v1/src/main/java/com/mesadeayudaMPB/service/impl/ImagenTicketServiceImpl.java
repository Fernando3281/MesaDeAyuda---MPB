package com.mesadeayudaMPB.service.impl;

import com.mesadeayudaMPB.dao.ImagenTicketDao;
import com.mesadeayudaMPB.dao.TicketDao;
import com.mesadeayudaMPB.domain.ImagenTicket;
import com.mesadeayudaMPB.domain.Ticket;
import com.mesadeayudaMPB.service.ImagenTicketService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class ImagenTicketServiceImpl implements ImagenTicketService {

    @Autowired
    private ImagenTicketDao imagenTicketDao;
    
    @Autowired
    private TicketDao ticketDao;

    @Override
    @Transactional
    public void guardarImagen(Long idTicket, byte[] imagen, String nombreArchivo, String tipoArchivo) {
        if (imagen == null || imagen.length == 0) {
            System.out.println("DEBUG: Imagen is null or empty");
            return;
        }
        
        Ticket ticket = ticketDao.findById(idTicket)
                .orElseThrow(() -> new RuntimeException("Ticket no encontrado"));
                
        System.out.println("DEBUG: Saving image for ticket ID: " + idTicket);
        System.out.println("DEBUG: Image filename: " + nombreArchivo);
        System.out.println("DEBUG: Image type: " + tipoArchivo);
        System.out.println("DEBUG: Image size: " + imagen.length + " bytes");
        
        ImagenTicket imagenTicket = new ImagenTicket();
        imagenTicket.setTicket(ticket);
        imagenTicket.setImagen(imagen);
        imagenTicket.setNombreArchivo(nombreArchivo);
        imagenTicket.setTipoArchivo(tipoArchivo);
        
        imagenTicketDao.save(imagenTicket);
        System.out.println("DEBUG: Image saved successfully");
    }

    @Override
    @Transactional(readOnly = true)
    public List<ImagenTicket> obtenerImagenesPorTicket(Long idTicket) {
        return imagenTicketDao.findImagenesCompletasByTicketId(idTicket);
    }

    @Override
    @Transactional(readOnly = true)
    public ImagenTicket obtenerImagenPorId(Long idImagen) {
        return imagenTicketDao.findById(idImagen).orElse(null);
    }
}