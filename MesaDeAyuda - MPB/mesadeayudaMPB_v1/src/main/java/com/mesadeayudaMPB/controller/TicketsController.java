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
@RequestMapping("/tickets")
public class TicketsController {
    
    
    @GetMapping("/listado")
    public String listado(Model model) {
        
        return "/tickets/listado";
    }
    
    
    
    
    
    //// BASE DE RUTAS

    /*@GetMapping("/tickets/nuevoTicket")
    public String nuevoTicket() {
        return "tickets/nuevoTicket"; // Esto debe coincidir con la ubicación de nuevoTicket.html
    }
    
        @GetMapping("/tickets/homePage")
    public String prueba() {
        return "tickets/homePage";
    }
    
    @GetMapping("/tickets/tickets-manager")
    public String ticketsManager() {
        return "tickets/tickets-manager";
    }
    
    @GetMapping("/tickets/historial")
    public String prueba2() {
        return "tickets/historial";
    }
    
    @GetMapping("/tickets/detallesTicket")
    public String prueba3() {
        return "tickets/detallesTicket";
    }
    
    @GetMapping("/tickets/login")
    public String login() {
        return "tickets/login";
    }
    
    @GetMapping("/tickets/registro")
    public String registro() {
        return "tickets/registro";
    }
    
    @GetMapping("/tickets/verificacionRegistro")
    public String verificacionRegistro() {
        return "tickets/verificacionRegistro";
    }
    
    @GetMapping("/tickets/propiedadesTicket")
    public String PropiedadesTicket() {
        return "tickets/propiedadesTicket";
    }
    
    @GetMapping("/tickets/configuracion")
    public String Configuracion() {
        return "tickets/configuracion";
    }
    
    @GetMapping("/tickets/modificarPerfil")
    public String ModificarPerfil() {
        return "tickets/modificarPerfil";
    }
    
    @GetMapping("/tickets/perfil")
    public String perfil() {
        return "tickets/perfil";
    }
    
    @GetMapping("/tickets/reporte-manager")
    public String Reporte() {
        return "tickets/reporte-manager";
    }*/
}
