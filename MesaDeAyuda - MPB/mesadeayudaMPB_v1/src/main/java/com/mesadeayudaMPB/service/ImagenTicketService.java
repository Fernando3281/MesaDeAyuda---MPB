package com.mesadeayudaMPB.service;

import com.mesadeayudaMPB.domain.ImagenTicket;
import java.util.List;

public interface ImagenTicketService {
    void guardarImagen(Long idTicket, byte[] imagen, String nombreArchivo, String tipoArchivo);
    List<ImagenTicket> obtenerImagenesPorTicket(Long idTicket);
    ImagenTicket obtenerImagenPorId(Long idImagen);
}