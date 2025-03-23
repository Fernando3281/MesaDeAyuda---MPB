package com.mesadeayudaMPB.service.impl;

import com.mesadeayudaMPB.dao.RolDao;
import com.mesadeayudaMPB.dao.UsuarioDao;
import com.mesadeayudaMPB.domain.Usuario;
import com.mesadeayudaMPB.domain.Rol;
import com.mesadeayudaMPB.service.UsuarioService;
import java.io.IOException;
import java.util.List;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

@Service
public class UsuarioServiceImpl implements UsuarioService {

    @Autowired
    private UsuarioDao usuarioDao;

    @Autowired
    private RolDao rolDao;

    @Override
    @Transactional(readOnly = true)
    public List<Usuario> getUsuarios() {
        return usuarioDao.findAll();
    }

    @Override
    @Transactional(readOnly = true)
    public Usuario getUsuario(Usuario usuario) {
        return usuarioDao.findById(usuario.getIdUsuario()).orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public Usuario getUsuarioPorNombre(String nombre) {
        return usuarioDao.findByNombre(nombre);
    }

    @Override
    @Transactional(readOnly = true)
    public Usuario getUsuarioPorNombreYContrasena(String nombre, String contrasena) {
        return usuarioDao.findByNombreAndContrasena(nombre, contrasena);
    }

    @Override
    @Transactional(readOnly = true)
    public Usuario getUsuarioPorNombreOCorreo(String nombre, String correoElectronico) {
        return usuarioDao.findByNombreOrCorreoElectronico(nombre, correoElectronico);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existeUsuarioPorNombreOCorreo(String nombre, String correoElectronico) {
        return usuarioDao.existsByNombreOrCorreoElectronico(nombre, correoElectronico);
    }

    @Override
    @Transactional
    public void delete(Usuario usuario) {
        usuarioDao.delete(usuario);
    }

    @Override
    @Transactional
    public void save(Usuario usuario, boolean crearRolUser) {
        // Guardar el usuario
        usuario = usuarioDao.save(usuario);

        // Si se debe crear el rol, crear el rol "ROLE_USER" asociado al usuario
        if (crearRolUser) {
            Rol rol = new Rol();
            rol.setNombre("ROLE_USER");
            rol.setUsuario(usuario);
            rolDao.save(rol);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existeUsuarioPorNombreOCorreoElectronico(String nombre, String correoElectronico) {
        return usuarioDao.existsByNombreOrCorreoElectronico(nombre, correoElectronico);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean existeUsuarioPorCorreoElectronico(String correoElectronico) {
        return usuarioDao.existsByCorreoElectronico(correoElectronico);
    }

    @Override
    @Transactional(readOnly = true)
    public Usuario getUsuarioPorCorreo(String correoElectronico) {
        return usuarioDao.findByCorreoElectronico(correoElectronico);
    }

    @Override
    @Transactional
    public byte[] actualizarImagen(MultipartFile imagen) {
        try {
            // Convertir la imagen a un arreglo de bytes
            return imagen.getBytes();
        } catch (IOException e) {
            e.printStackTrace();
            return null;
        }
    }

    @Override
    @Transactional(readOnly = true)
    public Usuario getUsuarioPorId(Long id) {
        return usuarioDao.findById(id).orElse(null);
    }

    @Override
    @Transactional(readOnly = true)
    public Long contarUsuariosPorDepartamento(String nombreDepartamento) {
        return usuarioDao.countByDepartamento(nombreDepartamento);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Usuario> getUsuariosPorRoles(List<String> roles) {
        return usuarioDao.findByRolesNombreIn(roles);
    }
}
