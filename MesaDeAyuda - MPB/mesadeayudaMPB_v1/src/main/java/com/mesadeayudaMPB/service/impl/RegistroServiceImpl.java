package com.mesadeayudaMPB.service.impl;

import com.mesadeayudaMPB.dao.UsuarioDao;
import com.mesadeayudaMPB.dao.RolDao;
import com.mesadeayudaMPB.domain.Usuario;
import com.mesadeayudaMPB.domain.Rol;
import com.mesadeayudaMPB.service.RegistroService;
import com.mesadeayudaMPB.service.EmailService;
import com.mesadeayudaMPB.service.VerificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Date;
import java.util.Random;

@Service
public class RegistroServiceImpl implements RegistroService {

    @Autowired
    private UsuarioDao usuarioDao;
    @Autowired
    private RolDao rolDao;
    @Autowired
    private BCryptPasswordEncoder passwordEncoder;
    @Autowired
    private EmailService emailService;
    @Autowired
    private VerificationService verificationService;

    @Override
    @Transactional
    public void registrarNuevoUsuario(Usuario usuario) {
        if (!existeUsuario(usuario.getCorreoElectronico())) {
            // Encriptar contraseña
            usuario.setContrasena(passwordEncoder.encode(usuario.getContrasena()));
            usuario.setActivo(true);
            // Asignar imagen de perfil por defecto
            byte[] imagenDefault = cargarImagenDefault();
            usuario.setImagen(imagenDefault);
            // Guardar el usuario
            Usuario usuarioGuardado = usuarioDao.save(usuario);
            // Crear y asignar rol ROL_USUARIO
            Rol rol = new Rol();
            rol.setNombre("ROL_USUARIO");
            rol.setDescripcion("Usuario regular del sistema");
            rol.setUsuario(usuarioGuardado);
            rolDao.save(rol);
        } else {
            throw new IllegalArgumentException("El usuario ya existe");
        }
    }

    @Override
    public boolean existeUsuario(String correoElectronico) {
        return usuarioDao.existsByCorreoElectronico(correoElectronico);
    }

    @Override
    public boolean existeCodigo(String codigo) {
        return usuarioDao.existsByCodigo(codigo);
    }

    public String generarCodigoUnico() {
        String CARACTERES = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        StringBuilder codigo = new StringBuilder();
        Random random = new Random();
        for (int i = 0; i < 6; i++) {
            codigo.append(CARACTERES.charAt(random.nextInt(CARACTERES.length())));
        }
        return codigo.toString();
    }

    // Método para cargar la imagen predeterminada
    private byte[] cargarImagenDefault() {
        try {
            // Ruta de la imagen predeterminada
            Path rutaImagenDefault = Paths.get("src/main/resources/static/img/ImagenDefaultPerfil.jpg");
            return Files.readAllBytes(rutaImagenDefault);
        } catch (IOException e) {
            e.printStackTrace();
            return null;
        }
    }

    // Método para cargar la imagen predeterminada
    @Override
    public byte[] obtenerImagenDefault() {
        try {
            // Ruta de la imagen predeterminada
            Path rutaImagenDefault = Paths.get("src/main/resources/static/img/ImagenDefaultPerfil.jpg");
            return Files.readAllBytes(rutaImagenDefault);
        } catch (IOException e) {
            e.printStackTrace();
            return new byte[0]; // Retorna un arreglo vacío si hay error
        }
    }

    public Usuario prepararNuevoUsuario(Usuario usuario) {
        // Generar código único
        String codigoUnico = generarCodigoUnico();
        while (existeCodigo(codigoUnico)) {
            codigoUnico = generarCodigoUnico();
        }
        // Establecer campos adicionales
        usuario.setCodigo(codigoUnico);
        usuario.setUltimaConexion(new Date());
        return usuario;
    }

    public String iniciarVerificacion(Usuario usuario) {
        String verificationCode = verificationService.generateVerificationCode();
        emailService.sendVerificationCode(usuario.getCorreoElectronico(), verificationCode);
        return verificationCode;
    }

    @Transactional
    public void actualizarContrasena(String correoElectronico, String nuevaContrasena) {
        Usuario usuario = usuarioDao.findByCorreoElectronico(correoElectronico);
        if (usuario != null) {
            // Encriptar la nueva contraseña
            usuario.setContrasena(passwordEncoder.encode(nuevaContrasena));
            // Actualizar fecha de última conexión
            usuario.setUltimaConexion(new Date());
            // Guardar los cambios
            usuarioDao.save(usuario);
        } else {
            throw new IllegalArgumentException("Usuario no encontrado");
        }
    }
}
