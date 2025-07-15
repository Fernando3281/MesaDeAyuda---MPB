package com.mesadeayudaMPB.service;

import com.mesadeayudaMPB.domain.Auditoria;
import com.mesadeayudaMPB.domain.Ticket;
import com.mesadeayudaMPB.domain.Usuario;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import java.util.List;

public interface AuditoriaService {

    // Método existente
    void registrarAccion(Ticket ticket, String accion, String detalle,
            String valorAnterior, String valorNuevo, Usuario usuario);

    // Métodos existentes (para compatibilidad)
    List<Auditoria> obtenerHistorialPorTicket(Ticket ticket);

    List<Auditoria> obtenerHistorialPorTicketId(Long idTicket);

    // Nuevo método paginado
    Page<Auditoria> obtenerHistorialPorTicketIdPaginado(Long idTicket, Pageable pageable);
}
