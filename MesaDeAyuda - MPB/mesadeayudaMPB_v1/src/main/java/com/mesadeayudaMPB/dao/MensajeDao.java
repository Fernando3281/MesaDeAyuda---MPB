package com.mesadeayudaMPB.dao;

import com.mesadeayudaMPB.domain.Mensajes;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface MensajeDao extends JpaRepository<Mensajes, Long> {

    List<Mensajes> findByTicketIdTicketOrderByFechaHoraAsc(Long idTicket);
}
