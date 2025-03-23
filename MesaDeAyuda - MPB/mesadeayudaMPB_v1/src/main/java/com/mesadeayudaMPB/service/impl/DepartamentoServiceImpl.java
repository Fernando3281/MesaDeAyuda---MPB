package com.mesadeayudaMPB.service.impl;

import com.mesadeayudaMPB.dao.DepartamentoDao;
import com.mesadeayudaMPB.domain.Departamento;
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
}