package com.mesadeayudaMPB.service;

import com.mesadeayudaMPB.domain.ArchivoTicket;
import java.util.List;

public interface ArchivoTicketService {

    void guardarArchivo(Long idArchivo, byte[] archivo, String nombreArchivo, String tipoArchivo);

    List<ArchivoTicket> obtenerArchivosPorTicket(Long idTicket);

    ArchivoTicket obtenerArchivoPorId(Long idArchivo);

    void eliminarArchivosPorTicket(Long idTicket);
}
