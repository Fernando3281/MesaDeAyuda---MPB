package com.mesadeayudaMPB.service.impl;

import com.mesadeayudaMPB.dao.UsuarioDao;
import com.mesadeayudaMPB.domain.Usuario;
import com.mesadeayudaMPB.service.RegistroService;
import com.mesadeayudaMPB.service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import jakarta.mail.MessagingException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import java.util.Locale;

@Service
public class RegistroServiceImpl implements RegistroService {

    @Autowired
    private UsuarioDao usuarioDao;

    @Autowired
    private CorreoService correoService;

    @Autowired
    private UsuarioService usuarioService;

    @Autowired
    private MessageSource messageSource;

    @Override
    public void registrarNuevoUsuario(Usuario usuario) throws MessagingException {
        // Verifica si el usuario ya existe
        if (!usuarioDao.existsByNombreOrCorreoElectronico(usuario.getNombre(), usuario.getCorreoElectronico())) {
            // Encripta la contraseña
            var codigo = new BCryptPasswordEncoder();
            usuario.setContrasena(codigo.encode(usuario.getContrasena()));

            // Guarda el usuario como inactivo
            usuario.setActivo(false);
            usuarioDao.save(usuario);

            // Enviar correo de activación
            enviaCorreoActivar(usuario);

        } else {
            throw new IllegalArgumentException("El usuario ya existe");
        }
    }

    private void enviaCorreoActivar(Usuario usuario) throws MessagingException {
        // Aquí puedes agregar la lógica para enviar el correo de activación
        String mensaje = String.format(
                messageSource.getMessage("registro.mensaje.activacion.ok", null, Locale.getDefault()),
                usuario.getCorreoElectronico());

        correoService.enviarCorreo(usuario.getCorreoElectronico(), "Activación de cuenta", mensaje);
    }
}
