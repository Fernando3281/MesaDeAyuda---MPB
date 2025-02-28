package com.mesadeayudaMPB.dao;

import com.mesadeayudaMPB.domain.Ticket;
import com.mesadeayudaMPB.domain.Usuario;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TicketDao extends JpaRepository<Ticket, Long> {

    boolean existsByCodigo(String codigo);

    Ticket findByCodigo(String codigo);

    Page<Ticket> findAll(Pageable pageable);
    
    List<Ticket> findBySolicitanteOrderByFechaAperturaDesc(Usuario solicitante);
}
