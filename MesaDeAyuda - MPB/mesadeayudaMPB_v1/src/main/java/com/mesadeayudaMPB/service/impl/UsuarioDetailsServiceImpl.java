package com.mesadeayudaMPB.service.impl;

import com.mesadeayudaMPB.dao.UsuarioDao;
import com.mesadeayudaMPB.domain.Rol;
import com.mesadeayudaMPB.domain.Usuario;
import com.mesadeayudaMPB.service.UsuarioService;
import com.mesadeayudaMPB.service.UsuarioService;
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
        // Try to find user by email
        Usuario usuario = usuarioDao.findByCorreoElectronico(username);
        
        if (usuario == null) {
            throw new UsernameNotFoundException("Usuario no encontrado: " + username);
        }
        
        if (!usuario.isActivo()) {
            throw new UsernameNotFoundException("Usuario inactivo: " + username);
        }
        
        // Clear and update session attributes
        session.removeAttribute("usuarioImagen");
        session.removeAttribute("usuarioNombre");
        session.removeAttribute("usuarioId");
        
        session.setAttribute("usuarioImagen", usuario.getImagen());
        session.setAttribute("usuarioNombre", usuario.getNombre());
        session.setAttribute("usuarioId", usuario.getIdUsuario());
        
        // Set up authorities
        var roles = new ArrayList<GrantedAuthority>();
        roles.add(new SimpleGrantedAuthority("ROLE_USER"));
        
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
