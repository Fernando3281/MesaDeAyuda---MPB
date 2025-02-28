package com.mesadeayudaMPB.service;

import com.mesadeayudaMPB.domain.Usuario;

public interface RegistroService {

    void registrarNuevoUsuario(Usuario usuario);

    boolean existeUsuario(String correoElectronico);

    boolean existeCodigo(String codigo);
}
