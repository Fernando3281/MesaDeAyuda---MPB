package com.mesadeayudaMPB.dao;

import com.mesadeayudaMPB.domain.Departamento;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

@Repository
public interface DepartamentoDao extends JpaRepository<Departamento, Long> {
    
    Departamento findByNombre(String nombre);
    
    List<Departamento> findByVisibleTrue();
    
    // Métodos para búsqueda
    Page<Departamento> findByNombreContainingIgnoreCaseOrDescripcionContainingIgnoreCase(
        String nombre, String descripcion, Pageable pageable);
    
    // Búsqueda más flexible con Query personalizada
    @Query("SELECT d FROM Departamento d WHERE " +
           "LOWER(d.nombre) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "LOWER(d.descripcion) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           "CAST(d.idDepartamento AS string) LIKE CONCAT('%', :search, '%')")
    Page<Departamento> buscarDepartamentos(@Param("search") String search, Pageable pageable);
}