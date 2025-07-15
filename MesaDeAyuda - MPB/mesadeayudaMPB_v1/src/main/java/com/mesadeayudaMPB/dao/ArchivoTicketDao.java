package com.mesadeayudaMPB.dao;

import com.mesadeayudaMPB.domain.ArchivoTicket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import org.springframework.data.jpa.repository.Modifying;

public interface ArchivoTicketDao extends JpaRepository<ArchivoTicket, Long> {

    List<ArchivoTicket> findByTicketIdTicket(Long idTicket);

    @Query("SELECT i FROM ArchivoTicket i JOIN FETCH i.ticket WHERE i.ticket.idTicket = :idTicket")
    List<ArchivoTicket> findArchivosCompletasByTicketId(@Param("idTicket") Long idTicket);

    // Nuevo método para eliminar archivos por ticket
    @Modifying
    @Query("DELETE FROM ArchivoTicket a WHERE a.ticket.idTicket = :ticketId")
    void deleteByTicketId(@Param("ticketId") Long ticketId);
}
