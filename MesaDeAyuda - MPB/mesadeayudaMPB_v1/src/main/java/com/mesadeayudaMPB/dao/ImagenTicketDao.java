package com.mesadeayudaMPB.dao;

import com.mesadeayudaMPB.domain.ImagenTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ImagenTicketDao extends JpaRepository<ImagenTicket, Long> {
    
    List<ImagenTicket> findByTicketIdTicket(Long idTicket);
    
    @Query("SELECT i FROM ImagenTicket i JOIN FETCH i.ticket WHERE i.ticket.idTicket = :idTicket")
    List<ImagenTicket> findImagenesCompletasByTicketId(@Param("idTicket") Long idTicket);
}