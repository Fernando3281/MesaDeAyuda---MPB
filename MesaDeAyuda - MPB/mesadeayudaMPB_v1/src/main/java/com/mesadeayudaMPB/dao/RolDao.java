package com.mesadeayudaMPB.dao;

import com.mesadeayudaMPB.domain.Rol;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

public interface RolDao extends JpaRepository<Rol, Long> {
    List<Rol> findByUsuarioIdUsuario(Long idUsuario);
    
    @Transactional
    @Modifying
    @Query("DELETE FROM Rol r WHERE r.usuario.idUsuario = :idUsuario")
    void deleteByUsuarioIdUsuario(@Param("idUsuario") Long idUsuario);
}