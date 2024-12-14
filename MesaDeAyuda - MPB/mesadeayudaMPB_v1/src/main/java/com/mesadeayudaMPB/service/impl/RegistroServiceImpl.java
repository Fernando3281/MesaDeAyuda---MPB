package com.mesadeayudaMPB.service.impl;

import com.mesadeayudaMPB.dao.UsuarioDao;
import com.mesadeayudaMPB.domain.Usuario;
import com.mesadeayudaMPB.service.RegistroService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class RegistroServiceImpl implements RegistroService {

    @Autowired
    private UsuarioDao usuarioDao;

    @Override
    public void registrarNuevoUsuario(Usuario usuario) {
        if (!usuarioDao.existsByNombreOrCorreoElectronico(usuario.getNombre(), usuario.getCorreoElectronico())) {
            usuarioDao.save(usuario);
        } else {
            throw new IllegalArgumentException("El usuario ya existe");
        }
    }
}
