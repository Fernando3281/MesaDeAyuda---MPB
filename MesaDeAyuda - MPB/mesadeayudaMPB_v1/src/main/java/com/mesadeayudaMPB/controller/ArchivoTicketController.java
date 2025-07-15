package com.mesadeayudaMPB.controller;

import com.mesadeayudaMPB.domain.ArchivoTicket;
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
import com.mesadeayudaMPB.service.ArchivoTicketService;

@Controller
@RequestMapping("/archivos")
public class ArchivoTicketController {
    
    @Autowired
    private ArchivoTicketService archivoTicketService;
    
    @GetMapping("/ticket/{idTicket}")
    @ResponseBody
    public ResponseEntity<List<Map<String, Object>>> obtenerArchivosInfo(@PathVariable Long idTicket) {
        List<ArchivoTicket> archivos = archivoTicketService.obtenerArchivosPorTicket(idTicket);
        if (archivos.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        List<Map<String, Object>> archivosInfo = archivos.stream().map(img -> {
            Map<String, Object> info = new HashMap<>();
            info.put("id", img.getIdArchivo());
            info.put("nombre", img.getNombreArchivo());
            info.put("tipo", img.getTipoArchivo());
            return info;
        }).collect(Collectors.toList());
        
        return ResponseEntity.ok(archivosInfo);
    }
    
    @GetMapping("/ver/{idArchivo}")
    public ResponseEntity<byte[]> verArchivo(@PathVariable Long idArchivo) {
        ArchivoTicket archivo = archivoTicketService.obtenerArchivoPorId(idArchivo);
        if (archivo == null || archivo.getArchivo() == null) {
            return ResponseEntity.notFound().build();
        }
        
        HttpHeaders headers = new HttpHeaders();
        
        // Configuración mejorada para PDFs - CLAVE PARA EVITAR DESCARGA
        if (archivo.getTipoArchivo() != null && archivo.getTipoArchivo().equals("application/pdf")) {
            headers.setContentType(MediaType.APPLICATION_PDF);
            // CAMBIO CRÍTICO: usar "inline" sin filename para evitar descargas
            headers.add("Content-Disposition", "inline");
            headers.setContentLength(archivo.getArchivo().length);
            headers.setCacheControl("no-cache, no-store, must-revalidate");
            headers.add("Pragma", "no-cache");
            headers.add("Expires", "0");
            // Importantes para compatibilidad con iframe
            headers.add("X-Frame-Options", "SAMEORIGIN");
            headers.add("Content-Security-Policy", "frame-ancestors 'self'");
        } 
        // Configuración para imágenes
        else if (archivo.getTipoArchivo() != null && archivo.getTipoArchivo().startsWith("image/")) {
            headers.setContentType(MediaType.parseMediaType(archivo.getTipoArchivo()));
            headers.add("Content-Disposition", "inline");
        } 
        // Para otros tipos de archivo
        else {
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", archivo.getNombreArchivo());
        }
        
        return ResponseEntity.ok()
                .headers(headers)
                .body(archivo.getArchivo());
    }
}