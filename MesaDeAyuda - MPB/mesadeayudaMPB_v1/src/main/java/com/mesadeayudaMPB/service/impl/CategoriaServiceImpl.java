package com.mesadeayudaMPB.service.impl;

import com.mesadeayudaMPB.dao.CategoriaDao;
import com.mesadeayudaMPB.domain.Categoria;
import com.mesadeayudaMPB.service.CategoriaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

@Service
public class CategoriaServiceImpl implements CategoriaService {

    @Autowired
    private CategoriaDao categoriaDao;

    @Override
    @Transactional
    public void save(Categoria categoria) {
        categoriaDao.save(categoria);
    }

    @Override
    @Transactional
    public void delete(Categoria categoria) {
        categoriaDao.delete(categoria);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Categoria> getCategorias() {
        return categoriaDao.findAllByOrderByNombreAsc();
    }

    @Override
    @Transactional(readOnly = true)
    public List<Categoria> getCategoriasActivas() {
        return categoriaDao.findByActivoTrueOrderByIdCategoriaAsc();
    }

    @Override
    @Transactional(readOnly = true)
    public Categoria getCategoria(Categoria categoria) {
        return categoriaDao.findById(categoria.getIdCategoria()).orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public Categoria getCategoriaPorId(Long idCategoria) {
        return categoriaDao.findById(idCategoria).orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public Categoria getCategoriaPorNombre(String nombre) {
        return categoriaDao.findByNombre(nombre).orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existeCategoriaPorNombre(String nombre) {
        return categoriaDao.existsByNombre(nombre);
    }

    @Override
    @Transactional
    public void activarDesactivarCategoria(Long idCategoria, boolean activo) {
        Categoria categoria = categoriaDao.findById(idCategoria).orElse(null);
        if (categoria != null) {
            categoria.setActivo(activo);
            categoriaDao.save(categoria);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Categoria> obtenerCategoriasPaginados(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return categoriaDao.findAll(pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Categoria> buscarCategoriasPaginados(String search, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return categoriaDao.findByNombreContainingIgnoreCaseOrDescripcionContainingIgnoreCase(
                search, search, pageable);
    }

    @Override
    public List<Categoria> obtenerCategoriasActivas() {
        return categoriaDao.findByActivoTrue();
    }
}
