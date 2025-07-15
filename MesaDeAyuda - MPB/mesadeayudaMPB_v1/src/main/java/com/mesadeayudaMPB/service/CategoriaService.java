package com.mesadeayudaMPB.service;

import com.mesadeayudaMPB.domain.Categoria;
import java.util.List;
import org.springframework.data.domain.Page;

public interface CategoriaService {

    void save(Categoria categoria);

    void delete(Categoria categoria);

    List<Categoria> getCategorias();

    List<Categoria> getCategoriasActivas();

    Categoria getCategoria(Categoria categoria);

    Categoria getCategoriaPorId(Long idCategoria);

    Categoria getCategoriaPorNombre(String nombre);

    boolean existeCategoriaPorNombre(String nombre);

    void activarDesactivarCategoria(Long idCategoria, boolean activo);

    Page<Categoria> obtenerCategoriasPaginados(int page, int size);

    Page<Categoria> buscarCategoriasPaginados(String search, int page, int size);
}
