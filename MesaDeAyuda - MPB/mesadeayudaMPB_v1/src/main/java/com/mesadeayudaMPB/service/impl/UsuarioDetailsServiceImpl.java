package com.mesadeayudaMPB.service.impl;

import com.mesadeayudaMPB.dao.UsuarioDao;
import com.mesadeayudaMPB.domain.Rol;
import com.mesadeayudaMPB.domain.Usuario;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;

@Service
public class UsuarioDetailsServiceImpl implements UserDetailsService {

    @Autowired
    private UsuarioDao usuarioDao;

    @Autowired
    private HttpSession session;

    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        Usuario usuario = usuarioDao.findByCorreoElectronico(username);

        if (usuario == null) {
            throw new UsernameNotFoundException(username);
        }

        if (!usuario.isActivo()) {
            throw new UsernameNotFoundException("Usuario inactivo: " + username);
        }

        // Actualizar atributos de sesión
        session.removeAttribute("usuarioImagen");
        session.removeAttribute("usuarioNombre");
        session.removeAttribute("usuarioId");

        session.setAttribute("usuarioImagen", usuario.getImagen());
        session.setAttribute("usuarioNombre", usuario.getNombre());
        session.setAttribute("usuarioId", usuario.getIdUsuario());

        // Obtener roles manteniendo el prefijo "ROL_"
        var roles = new ArrayList<GrantedAuthority>();
        if (usuario.getRoles() != null) {
            for (Rol rol : usuario.getRoles()) {
                // Verificar que el rol tenga el prefijo "ROL_" y agregarlo tal cual
                if (rol.getNombre() != null && rol.getNombre().startsWith("ROL_")) {
                    roles.add(new SimpleGrantedAuthority(rol.getNombre()));
                }
            }
        }

        // Si no tiene roles, asignar "ROL_USUARIO" por defecto
        if (roles.isEmpty()) {
            roles.add(new SimpleGrantedAuthority("ROL_USUARIO"));
        }

        return new User(
                usuario.getCorreoElectronico(),
                usuario.getContrasena(),
                usuario.isActivo(),
                true, // account non-expired
                true, // credentials non-expired
                true, // account non-locked
                roles
        );
    }
}
