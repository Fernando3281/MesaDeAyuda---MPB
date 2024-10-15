/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.mesadeayudaMPB.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

/**
 *
 * @author ferva
 */

@Controller
public class TicketsController {

    @GetMapping("/tickets/nuevoTicket")
    public String nuevoTicket() {
        return "tickets/nuevoTicket"; // Esto debe coincidir con la ubicación de nuevoTicket.html
    }
    
        @GetMapping("/tickets/homePage")
    public String prueba() {
        return "tickets/homePage";
    }
    
    @GetMapping("/tickets/prueba1")
    public String prueba1() {
        return "tickets/prueba1";
    }
}
