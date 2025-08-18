package com.mesadeayudaMPB.dao;

import com.mesadeayudaMPB.domain.Auditoria;
import com.mesadeayudaMPB.domain.Ticket;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import org.springframework.data.jpa.repository.Modifying;

public interface AuditoriaDao extends JpaRepository<Auditoria, Long> {

    // Métodos existentes
    List<Auditoria> findByTicketOrderByFechaAccionDesc(Ticket ticket);

    @Query("SELECT a FROM Auditoria a WHERE a.ticket.idTicket = :idTicket ORDER BY a.fechaAccion DESC")
    List<Auditoria> findByIdTicketOrderByFechaAccionDesc(@Param("idTicket") Long idTicket);

    // SOLUCIÓN: Remover el ORDER BY de la query JPQL para el método paginado
    // El ordenamiento se manejará a través del Pageable
    @Query("SELECT a FROM Auditoria a WHERE a.ticket.idTicket = :idTicket")
    Page<Auditoria> findByTicketIdTicketOrderByFechaAccionDesc(
            @Param("idTicket") Long idTicket,
            Pageable pageable);

    // Alternativamente, puedes usar este método más simple basado en convenciones de Spring Data
    Page<Auditoria> findByTicket_IdTicket(Long idTicket, Pageable pageable);

    @Modifying
    @Query("DELETE FROM Auditoria a WHERE a.ticket.idTicket = :idTicket")
    void deleteByTicketId(@Param("idTicket") Long idTicket);

    @Query(value = "SELECT TOP 50 * FROM Auditoria ORDER BY fecha_accion DESC", nativeQuery = true)
    List<Auditoria> findTop50RecentAuditActions();
}