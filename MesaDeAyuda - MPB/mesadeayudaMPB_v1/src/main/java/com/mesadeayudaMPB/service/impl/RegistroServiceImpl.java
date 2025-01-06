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

/*
package com.mesadeayudaMPB.service.impl;

import com.mesadeayudaMPB.domain.Usuario;
import com.mesadeayudaMPB.service.RegistroService;
import com.mesadeayudaMPB.service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.MessageSource;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.ui.Model;
import org.springframework.web.multipart.MultipartFile;

import java.util.Locale;

@Service
public class RegistroServiceImpl implements RegistroService {

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private MessageSource messageSource;

    @Override
    public void registrarNuevoUsuario(Usuario usuario) {
        if (!usuarioService.existeUsuarioPorNombreOCorreo(usuario.getNombre(), usuario.getCorreoElectronico())) {
            usuario.setContrasena(demeClave());
            usuario.setActivo(false);
            usuarioService.save(usuario, true);
        } else {
            throw new IllegalArgumentException("El usuario ya existe");
        }
    }

    @Override
    public String activarCuenta(String username, String clave, Model model) {
        Usuario usuario = usuarioService.getUsuarioPorNombreYContrasena(username, clave);
        if (usuario != null) {
            model.addAttribute("usuario", usuario);
            return "/registro/activarCuenta"; // Redirige a la página de activación
        } else {
            model.addAttribute("mensaje", messageSource.getMessage("registro.activar.error", null, Locale.getDefault()));
            return "/registro/activarCuenta";
        }
    }

    @Override
    public void activarCuenta(Usuario usuario, MultipartFile imagenFile) {
        var codigo = new BCryptPasswordEncoder();
        usuario.setContrasena(codigo.encode(usuario.getContrasena()));

        // Si se proporciona una imagen, se puede agregar al usuario, pero sin Firebase
        if (!imagenFile.isEmpty()) {
            // Aquí se podría añadir código para almacenar la imagen de forma local, si es necesario
            // usuario.setRutaImagen(rutaImagen); // Lógica de almacenamiento de la imagen (si aplica)
        }

        usuario.setActivo(true);
        usuarioService.save(usuario, true);
    }

    private String demeClave() {
        String tira = "ABCDEFGHIJKLMNOPQRSTUXYZabcdefghijklmnopqrstuvwxyz0123456789_*+-";
        String clave = "";
        for (int i = 0; i < 40; i++) {
            clave += tira.charAt((int) (Math.random() * tira.length()));
        }
        return clave;
    }
}

*/
