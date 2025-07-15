package com.mesadeayudaMPB.service.impl;

import com.mesadeayudaMPB.dao.DepartamentoDao;
import com.mesadeayudaMPB.dao.UsuarioDao;
import com.mesadeayudaMPB.domain.Departamento;
import com.mesadeayudaMPB.domain.Usuario;
import com.mesadeayudaMPB.service.DepartamentoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class DepartamentoServiceImpl implements DepartamentoService {

    @Autowired
    private DepartamentoDao departamentoDao;

    @Autowired
    private UsuarioDao usuarioDao;

    @Override
    @Transactional(readOnly = true)
    public List<Departamento> obtenerTodosLosDepartamentos() {
        return departamentoDao.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public Departamento obtenerDepartamentoPorId(Long id) {
        return departamentoDao.findById(id).orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public Departamento obtenerDepartamentoPorNombre(String nombre) {
        return departamentoDao.findByNombre(nombre);
    }

    @Override
    @Transactional
    public Departamento guardarDepartamento(Departamento departamento) {
        return departamentoDao.save(departamento);
    }

    @Override
    @Transactional
    public void eliminarDepartamento(Long id) {
        departamentoDao.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Departamento> obtenerDepartamentosPaginados(int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return departamentoDao.findAll(pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Departamento> buscarDepartamentosPaginados(String search, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        return departamentoDao.buscarDepartamentos(search, pageable);
    }

    @Override
    @Transactional
    public void toggleVisibilidad(Long id) {
        Departamento departamento = departamentoDao.findById(id).orElse(null);
        if (departamento != null) {
            boolean nuevaVisibilidad = !departamento.isVisible();
            departamento.setVisible(nuevaVisibilidad);
            departamentoDao.save(departamento);

            // Si se está ocultando el departamento, eliminar de los usuarios
            if (!nuevaVisibilidad) {
                eliminarDepartamentoDeUsuarios(departamento.getNombre());
            }
        }
    }

    private void eliminarDepartamentoDeUsuarios(String nombreDepartamento) {
        List<Usuario> usuariosConDepartamento = usuarioDao.findByDepartamento(nombreDepartamento);
        for (Usuario usuario : usuariosConDepartamento) {
            usuario.setDepartamento(null);
            usuarioDao.save(usuario);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<Departamento> obtenerDepartamentosVisibles() {
        return departamentoDao.findByVisibleTrue();
    }
}
