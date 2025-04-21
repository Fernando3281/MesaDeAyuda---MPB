//NO SE ESTA UTILIZANDO

package com.mesadeayudaMPB.controller;

import com.mesadeayudaMPB.service.RolService;
import com.mesadeayudaMPB.service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/rol")
public class RolesController {

    @Autowired
    private RolService rolService;

    @Autowired
    private UsuarioService usuarioService;
}