package com.mesadeayudaMPB.service;

import com.mesadeayudaMPB.domain.Rol;
import java.util.List;

public interface RolService {
    List<Rol> obtenerRolesPorUsuario(Long idUsuario);
    void eliminarRolesPorUsuario(Long idUsuario);
    void save(Rol rol); // Nuevo método
}