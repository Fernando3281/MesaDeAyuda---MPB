package com.mesadeayudaMPB.service.impl;

import com.mesadeayudaMPB.dao.RolDao;
import com.mesadeayudaMPB.domain.Rol;
import com.mesadeayudaMPB.service.RolService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
public class RolServiceImpl implements RolService {

    @Autowired
    private RolDao rolDao;

    @Override
    @Transactional(readOnly = true)
    public List<Rol> obtenerRolesPorUsuario(Long idUsuario) {
        return rolDao.findByUsuarioIdUsuario(idUsuario);
    }
    
    @Override
    @Transactional
    public void eliminarRolesPorUsuario(Long idUsuario) {
        rolDao.deleteByUsuarioIdUsuario(idUsuario);
    }
    
    @Override
    @Transactional
    public void save(Rol rol) {
        rolDao.save(rol);
    }
}