/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.mesadeayudaMPB.controller;

import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

/**
 *
 * @author ferva
 */


@Controller
@RequestMapping("/usuario")
public class UsuarioController {

@GetMapping("/perfil")
    public String perfil(Model model) {
        
        return "/usuario/perfil";
    }
    
}
