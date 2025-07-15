package com.mesadeayudaMPB.service;

import com.mesadeayudaMPB.domain.Departamento;
import java.util.List;
import org.springframework.data.domain.Page;

public interface DepartamentoService {
    List<Departamento> obtenerTodosLosDepartamentos();
    Departamento obtenerDepartamentoPorId(Long id);
    Departamento obtenerDepartamentoPorNombre(String nombre);
    Departamento guardarDepartamento(Departamento departamento);
    void eliminarDepartamento(Long id);
    Page<Departamento> obtenerDepartamentosPaginados(int page, int size);
    Page<Departamento> buscarDepartamentosPaginados(String search, int page, int size);
    void toggleVisibilidad(Long id);
    List<Departamento> obtenerDepartamentosVisibles();
}