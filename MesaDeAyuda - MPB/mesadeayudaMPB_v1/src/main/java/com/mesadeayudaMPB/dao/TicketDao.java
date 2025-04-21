package com.mesadeayudaMPB.dao;

import com.mesadeayudaMPB.domain.Ticket;
import com.mesadeayudaMPB.domain.Usuario;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TicketDao extends JpaRepository<Ticket, Long> {

    boolean existsByCodigo(String codigo);

    Ticket findByCodigo(String codigo);

    List<Ticket> findBySolicitanteAndEstadoOrderByFechaAperturaDesc(Usuario solicitante, String estado);

    Page<Ticket> findAll(Pageable pageable);

    List<Ticket> findBySolicitanteOrderByFechaAperturaDesc(Usuario solicitante);

    // Este método ya está en JpaRepository, pero lo puedes agregar si lo necesitas explícitamente
    Optional<Ticket> findById(Long id);

    // En TicketDao.java
    @Query("SELECT t FROM Ticket t WHERE EXISTS (SELECT 1 FROM Mensajes m WHERE m.ticket = t)")
    List<Ticket> findTicketsWithMessages();

    @Query("SELECT t FROM Ticket t WHERE t.asignadoPara.idUsuario = :idSoportista AND EXISTS (SELECT 1 FROM Mensajes m WHERE m.ticket = t)")
    List<Ticket> findTicketsWithMessagesBySupport(@Param("idSoportista") Long idSoportista);

    @Query("SELECT t FROM Ticket t WHERE t.solicitante.idUsuario = :idCliente AND EXISTS (SELECT 1 FROM Mensajes m WHERE m.ticket = t)")
    List<Ticket> findTicketsWithMessagesByClient(@Param("idCliente") Long idCliente);
}
