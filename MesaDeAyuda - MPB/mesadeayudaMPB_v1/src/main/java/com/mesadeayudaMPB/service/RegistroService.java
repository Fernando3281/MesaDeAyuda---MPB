package com.mesadeayudaMPB.service;

import com.mesadeayudaMPB.domain.Usuario;
import org.springframework.ui.Model;
import org.springframework.web.multipart.MultipartFile;

public interface RegistroService {
    void registrarNuevoUsuario(Usuario usuario);
}



/* public interface RegistroService {
    void registrarNuevoUsuario(Usuario usuario);
    String activarCuenta(String username, String clave, Model model);
    void activarCuenta(Usuario usuario, MultipartFile imagenFile);
}*/
