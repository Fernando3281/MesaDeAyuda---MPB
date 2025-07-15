package com.mesadeayudaMPB.dao;

import com.mesadeayudaMPB.domain.Categoria;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface CategoriaDao extends JpaRepository<Categoria, Long> {
    
    // Buscar categorías activas
    List<Categoria> findByActivoTrueOrderByIdCategoriaAsc();
    
    // Buscar todas las categorías ordenadas por nombre
    List<Categoria> findAllByOrderByNombreAsc();
    
    // Buscar categoría por nombre
    Optional<Categoria> findByNombre(String nombre);
    
    // Verificar si existe una categoría con ese nombre
    boolean existsByNombre(String nombre);
    
    // Buscar categorías activas para uso en formularios
    @Query("SELECT c FROM Categoria c WHERE c.activo = true ORDER BY c.nombre ASC")
    List<Categoria> findCategoriasActivas();
    
    Page<Categoria> findByNombreContainingIgnoreCaseOrDescripcionContainingIgnoreCase(
    String nombre, String descripcion, Pageable pageable);
}