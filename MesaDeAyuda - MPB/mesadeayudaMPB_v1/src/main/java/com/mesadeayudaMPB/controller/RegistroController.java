package com.mesadeayudaMPB.controller;

import com.mesadeayudaMPB.domain.Usuario;
import com.mesadeayudaMPB.service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

@Controller
public class RegistroController {

    @Autowired
    private UsuarioService usuarioService;

    @GetMapping("/registro")
    public String registroForm(Usuario usuario) {
        return "/registro/registroForm";
    }

    @PostMapping("/registro")
    public String registrarUsuario(@RequestParam String nombre,
            @RequestParam String apellidos,
            @RequestParam String departamento,
            @RequestParam String correoElectronico,
            @RequestParam String contrasena,
            Model model) {
        Usuario usuario = new Usuario();
        usuario.setNombre(nombre);
        usuario.setApellido(apellidos);
        usuario.setDepartamento(departamento);
        usuario.setCorreoElectronico(correoElectronico);
        usuario.setContrasena(contrasena);
        usuario.setActivo(true);
        usuarioService.save(usuario, true);
        model.addAttribute("mensaje", "Registro exitoso");
        return "/tickets/login";
    }
}
