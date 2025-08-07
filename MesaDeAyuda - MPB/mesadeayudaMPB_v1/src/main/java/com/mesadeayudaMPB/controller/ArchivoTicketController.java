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

/**
 * Controlador para manejar operaciones relacionadas con archivos adjuntos a tickets
 */
@Controller
@RequestMapping("/archivos")
public class ArchivoTicketController {
    
    @Autowired
    private ArchivoTicketService archivoTicketService;
    
    /**
     * Obtiene información básica de todos los archivos asociados a un ticket
     * @param idTicket ID del ticket a consultar
     * @return Lista con metadatos de los archivos (id, nombre, tipo) o 404 si no hay archivos
     */
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
    
    /**
     * Devuelve el contenido binario de un archivo específico con las cabeceras adecuadas
     * @param idArchivo ID del archivo a visualizar
     * @return Contenido del archivo con las cabeceras HTTP apropiadas o 404 si no existe
     */
    @GetMapping("/ver/{idArchivo}")
    public ResponseEntity<byte[]> verArchivo(@PathVariable Long idArchivo) {
        ArchivoTicket archivo = archivoTicketService.obtenerArchivoPorId(idArchivo);
        if (archivo == null || archivo.getArchivo() == null) {
            return ResponseEntity.notFound().build();
        }
        
        HttpHeaders headers = new HttpHeaders();
        
        // Configuración específica para PDFs (visualización en navegador)
        if (archivo.getTipoArchivo() != null && archivo.getTipoArchivo().equals("application/pdf")) {
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.add("Content-Disposition", "inline");
            headers.setContentLength(archivo.getArchivo().length);
            headers.setCacheControl("no-cache, no-store, must-revalidate");
            headers.add("Pragma", "no-cache");
            headers.add("Expires", "0");
            headers.add("X-Frame-Options", "SAMEORIGIN");
            headers.add("Content-Security-Policy", "frame-ancestors 'self'");
        } 
        // Configuración para imágenes (visualización directa)
        else if (archivo.getTipoArchivo() != null && archivo.getTipoArchivo().startsWith("image/")) {
            headers.setContentType(MediaType.parseMediaType(archivo.getTipoArchivo()));
            headers.add("Content-Disposition", "inline");
        } 
        // Configuración por defecto para otros tipos (descarga forzada)
        else {
            headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
            headers.setContentDispositionFormData("attachment", archivo.getNombreArchivo());
        }
        
        return ResponseEntity.ok()
                .headers(headers)
                .body(archivo.getArchivo());
    }
}