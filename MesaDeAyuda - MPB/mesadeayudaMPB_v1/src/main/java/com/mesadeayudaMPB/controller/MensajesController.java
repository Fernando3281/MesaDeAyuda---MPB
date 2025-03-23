package com.mesadeayudaMPB.controller;

import com.mesadeayudaMPB.domain.Mensajes;
import com.mesadeayudaMPB.service.MensajeService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/mensajes")
public class MensajesController {

    @Autowired
    private MensajeService mensajeService;

    @GetMapping("/ticket/{idTicket}")
    public ResponseEntity<List<Mensajes>> obtenerMensajesPorTicket(@PathVariable Long idTicket) {
        List<Mensajes> mensajes = mensajeService.obtenerMensajesPorTicket(idTicket);
        return ResponseEntity.ok(mensajes);
    }

    @PostMapping
    public ResponseEntity<Mensajes> guardarMensaje(@RequestBody Mensajes mensaje) {
        Mensajes mensajeGuardado = mensajeService.guardarMensaje(mensaje);
        return ResponseEntity.ok(mensajeGuardado);
    }
}