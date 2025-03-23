package com.mesadeayudaMPB.controller;

import com.mesadeayudaMPB.domain.ImagenTicket;
import com.mesadeayudaMPB.service.ImagenTicketService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Controller
@RequestMapping("/imagenes")
public class ImagenTicketController {

    @Autowired
    private ImagenTicketService imagenTicketService;

    @GetMapping("/ticket/{idTicket}")
    @ResponseBody
    public ResponseEntity<List<Map<String, Object>>> obtenerImagenesInfo(@PathVariable Long idTicket) {
        List<ImagenTicket> imagenes = imagenTicketService.obtenerImagenesPorTicket(idTicket);
        
        if (imagenes.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        List<Map<String, Object>> imagenesInfo = imagenes.stream().map(img -> {
            Map<String, Object> info = new HashMap<>();
            info.put("id", img.getIdImagen());
            info.put("nombre", img.getNombreArchivo());
            info.put("tipo", img.getTipoArchivo());
            return info;
        }).collect(Collectors.toList());
        
        return ResponseEntity.ok(imagenesInfo);
    }
    
    @GetMapping("/ver/{idImagen}")
    public ResponseEntity<byte[]> verImagen(@PathVariable Long idImagen) {
        ImagenTicket imagen = imagenTicketService.obtenerImagenPorId(idImagen);
        
        if (imagen == null) {
            return ResponseEntity.notFound().build();
        }
        
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(imagen.getTipoArchivo()));
        headers.setContentDispositionFormData("inline", imagen.getNombreArchivo());
        
        return ResponseEntity.ok()
                .headers(headers)
                .body(imagen.getImagen());
    }
}