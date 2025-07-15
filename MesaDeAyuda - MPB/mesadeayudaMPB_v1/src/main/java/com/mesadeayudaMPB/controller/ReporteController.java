package com.mesadeayudaMPB.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@Controller
@RequestMapping("/reportes")
public class ReporteController {
    
    @GetMapping("/listado")
    public String mostrarDashboardReportes() {
        return "reportes/listado";
    }
}