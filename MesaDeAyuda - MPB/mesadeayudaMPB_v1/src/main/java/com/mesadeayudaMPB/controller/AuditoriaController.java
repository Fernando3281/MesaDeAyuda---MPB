package com.mesadeayudaMPB.controller;

import com.mesadeayudaMPB.domain.Auditoria;
import com.mesadeayudaMPB.service.AuditoriaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;

@RestController
@RequestMapping("/api/auditoria")
public class AuditoriaController {

    @Autowired
    private AuditoriaService auditoriaService;

    @GetMapping("/ticket/{idTicket}")
    public ResponseEntity<Map<String, Object>> obtenerHistorialTicket(
            @PathVariable Long idTicket,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(defaultValue = "all") String filter) {

        Map<String, Object> response = new HashMap<>();

        try {
            Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, "fechaAccion"));
            Page<Auditoria> historialPage = auditoriaService.obtenerHistorialPorTicketIdPaginado(idTicket, pageable);

            List<Map<String, Object>> historial = historialPage.getContent().stream().map(auditoria -> {
                Map<String, Object> item = new HashMap<>();
                item.put("idAuditoria", auditoria.getIdAuditoria());
                item.put("accion", auditoria.getAccion());
                item.put("detalle", auditoria.getDetalle());
                item.put("fechaAccion", auditoria.getFechaAccion());
                item.put("valorAnterior", auditoria.getValorAnterior());
                item.put("valorNuevo", auditoria.getValorNuevo());

                if (auditoria.getUsuario() != null) {
                    Map<String, Object> usuario = new HashMap<>();
                    usuario.put("idUsuario", auditoria.getUsuario().getIdUsuario());
                    usuario.put("nombre", auditoria.getUsuario().getNombre());
                    usuario.put("apellido", auditoria.getUsuario().getApellido());
                    usuario.put("codigo", auditoria.getUsuario().getCodigo()); // Añade esta línea
                    usuario.put("correoElectronico", auditoria.getUsuario().getCorreoElectronico());
                    item.put("usuario", usuario);
                }

                return item;
            }).collect(Collectors.toList());

            response.put("success", true);
            response.put("historial", historial);
            response.put("totalItems", historialPage.getTotalElements());
            response.put("totalPages", historialPage.getTotalPages());
            response.put("currentPage", page);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("error", "Error al obtener el historial: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}
