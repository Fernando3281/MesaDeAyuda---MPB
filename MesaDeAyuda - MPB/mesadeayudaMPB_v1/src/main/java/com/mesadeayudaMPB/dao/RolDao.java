package com.mesadeayudaMPB.dao;

import com.mesadeayudaMPB.domain.Rol;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface RolDao extends JpaRepository<Rol, Long> {
}
