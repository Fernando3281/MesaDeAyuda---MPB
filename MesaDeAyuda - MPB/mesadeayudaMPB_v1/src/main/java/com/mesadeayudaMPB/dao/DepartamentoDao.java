package com.mesadeayudaMPB.dao;

import com.mesadeayudaMPB.domain.Departamento;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface DepartamentoDao extends JpaRepository<Departamento, Long> {
    Departamento findByNombre(String nombre);
}