package com.mesadeayudaMPB.dao;

import com.mesadeayudaMPB.domain.Ticket;
import com.mesadeayudaMPB.domain.Usuario;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface TicketDao extends JpaRepository<Ticket, Long> {

    boolean existsByCodigo(String codigo);

    Ticket findByCodigo(String codigo);

    List<Ticket> findBySolicitanteAndEstadoOrderByFechaAperturaDesc(Usuario solicitante, String estado);

    Page<Ticket> findAll(Pageable pageable);

    @Query("SELECT t FROM Ticket t WHERE "
            + "LOWER(t.codigo) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(t.titulo) LIKE LOWER(CONCAT('%', :search, '%')) OR "
            + "LOWER(t.descripcion) LIKE LOWER(CONCAT('%', :search, '%'))")
    Page<Ticket> findByCodigoContainingOrTituloContainingOrDescripcionContaining(
            @Param("search") String search,
            @Param("search") String search2,
            @Param("search") String search3,
            Pageable pageable);

    List<Ticket> findBySolicitanteOrderByFechaAperturaDesc(Usuario solicitante);

    Optional<Ticket> findById(Long id);

    List<Ticket> findByEstado(String estado);

    @Query("SELECT t FROM Ticket t WHERE EXISTS (SELECT 1 FROM Mensajes m WHERE m.ticket = t)")
    List<Ticket> findTicketsWithMessages();

    @Query("SELECT t FROM Ticket t WHERE t.asignadoPara.idUsuario = :idSoportista AND EXISTS (SELECT 1 FROM Mensajes m WHERE m.ticket = t)")
    List<Ticket> findTicketsWithMessagesBySupport(@Param("idSoportista") Long idSoportista);

    @Query("SELECT t FROM Ticket t WHERE t.solicitante.idUsuario = :idCliente AND EXISTS (SELECT 1 FROM Mensajes m WHERE m.ticket = t)")
    List<Ticket> findTicketsWithMessagesByClient(@Param("idCliente") Long idCliente);

    // Nuevos métodos para manejar la eliminación de usuarios
    @Modifying
    @Query("DELETE FROM Ticket t WHERE t.solicitante.idUsuario = :usuarioId")
    void deleteBySolicitanteId(@Param("usuarioId") Long usuarioId);

    @Modifying
    @Query("UPDATE Ticket t SET t.asignadoPara = null WHERE t.asignadoPara.idUsuario = :usuarioId")
    void clearAsignadoPara(@Param("usuarioId") Long usuarioId);
}
