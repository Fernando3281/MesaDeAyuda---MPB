package com.mesadeayudaMPB.dao;

import com.mesadeayudaMPB.domain.Mensajes;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;

public interface MensajeDao extends JpaRepository<Mensajes, Long> {
    List<Mensajes> findByTicketIdTicketOrderByFechaHoraAsc(Long idTicket);
    
    @Modifying
    @Query("DELETE FROM Mensajes m WHERE m.emisor.idUsuario = :usuarioId OR m.receptor.idUsuario = :usuarioId")
    void deleteByEmisorIdOrReceptorId(@Param("usuarioId") Long usuarioId);
    
    // Nuevo método para eliminar mensaje específico si el usuario es el emisor
    @Modifying
    @Query("DELETE FROM Mensajes m WHERE m.idMensaje = :idMensaje AND m.emisor.idUsuario = :usuarioId")
    int deleteByIdAndEmisorId(@Param("idMensaje") Long idMensaje, @Param("usuarioId") Long usuarioId);
    
    // Métodos para búsqueda y filtrado
    @Query("SELECT m FROM Mensajes m WHERE m.ticket.idTicket = :ticketId AND " +
           "(LOWER(m.mensajeTextoPlano) LIKE LOWER(CONCAT('%', :searchTerm, '%'))) " +
           "ORDER BY m.fechaHora ASC")
    List<Mensajes> searchInTicket(@Param("ticketId") Long ticketId, @Param("searchTerm") String searchTerm);
    
    @Query("SELECT m FROM Mensajes m WHERE m.ticket.idTicket = :ticketId AND " +
           "m.esNotaInterna = :esNotaInterna " +
           "ORDER BY m.fechaHora ASC")
    List<Mensajes> filterByType(@Param("ticketId") Long ticketId, @Param("esNotaInterna") boolean esNotaInterna);
    
    @Query("SELECT m FROM Mensajes m WHERE m.ticket.idTicket = :ticketId AND " +
           "m.emisor.idUsuario = :usuarioId " +
           "ORDER BY m.fechaHora ASC")
    List<Mensajes> filterByUser(@Param("ticketId") Long ticketId, @Param("usuarioId") Long usuarioId);
    
    // Métodos para contar mensajes
    long countByTicketIdTicket(Long ticketId);
    
    long countByTicketIdTicketAndEsNotaInterna(Long ticketId, boolean esNotaInterna);
    
    long countByTicketIdTicketAndEmisorIdUsuario(Long ticketId, Long usuarioId);
}