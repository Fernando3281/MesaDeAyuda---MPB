package com.mesadeayudaMPB.dao;

import com.mesadeayudaMPB.domain.Rol;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface RolDao extends JpaRepository<Rol, Long> {
    List<Rol> findByUsuarioIdUsuario(Long idUsuario);
}