package com.mesadeayudaMPB.controller;

import com.mesadeayudaMPB.domain.Departamento;
import com.mesadeayudaMPB.service.DepartamentoService;
import com.mesadeayudaMPB.service.UsuarioService;
import java.util.HashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/departamento")
public class DepartamentoController {

    @Autowired
    private DepartamentoService departamentoService;

    @Autowired
    private UsuarioService usuarioService;

    @GetMapping("/listado")
    public String listadoDepartamentos(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(required = false) String search,
            Model model) {

        Page<Departamento> pageResult;

        // Aplicar filtro de búsqueda si existe
        if (search != null && !search.trim().isEmpty()) {
            pageResult = departamentoService.buscarDepartamentosPaginados(search, page, size);
        } else {
            pageResult = departamentoService.obtenerDepartamentosPaginados(page, size);
        }

        // Obtener el número de usuarios por departamento
        Map<Long, Long> usuariosPorDepartamento = new HashMap<>();
        for (Departamento departamento : pageResult.getContent()) {
            Long count = usuarioService.contarUsuariosPorDepartamento(departamento.getNombre());
            usuariosPorDepartamento.put(departamento.getIdDepartamento(), count);
        }

        // Cálculo de rangos de paginación
        int totalPages = pageResult.getTotalPages();
        int currentPage = pageResult.getNumber();
        int startPage = Math.max(0, currentPage - 2);
        int endPage = Math.min(totalPages - 1, currentPage + 2);

        // Asegurarse de que siempre mostremos 5 páginas si es posible
        if (endPage - startPage < 4) {
            if (currentPage < totalPages / 2) {
                endPage = Math.min(totalPages - 1, startPage + 4);
            } else {
                startPage = Math.max(0, endPage - 4);
            }
        }

        model.addAttribute("departamentos", pageResult.getContent());
        model.addAttribute("usuariosPorDepartamento", usuariosPorDepartamento);
        model.addAttribute("currentPage", currentPage);
        model.addAttribute("startPage", startPage);
        model.addAttribute("endPage", endPage);
        model.addAttribute("totalPages", totalPages);
        model.addAttribute("totalItems", pageResult.getTotalElements());
        model.addAttribute("pageSize", size);
        model.addAttribute("start", page * size + 1);
        model.addAttribute("end", Math.min((page + 1) * size, pageResult.getTotalElements()));
        model.addAttribute("searchQuery", search);

        return "/departamento/listado";
    }

    // MÉTODO PARA CREAR DEPARTAMENTO - CORREGIDO
    @PostMapping("/crear")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> crearDepartamento(
            @RequestParam("nombre") String nombre,
            @RequestParam(value = "descripcion", required = false) String descripcion,
            @RequestParam(value = "visible", required = false, defaultValue = "false") boolean visible) {

        Map<String, Object> response = new HashMap<>();

        try {
            // Validar que el nombre no esté vacío
            if (nombre == null || nombre.trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "El nombre del departamento es obligatorio");
                return ResponseEntity.badRequest().body(response);
            }

            // Verificar si ya existe un departamento con el mismo nombre
            Departamento existente = departamentoService.obtenerDepartamentoPorNombre(nombre.trim());
            if (existente != null) {
                response.put("success", false);
                response.put("message", "Ya existe un departamento con ese nombre");
                return ResponseEntity.badRequest().body(response);
            }

            // Crear nuevo departamento - NO establecer el ID manualmente
            Departamento nuevoDepartamento = new Departamento();
            nuevoDepartamento.setNombre(nombre.trim());
            nuevoDepartamento.setDescripcion(descripcion != null ? descripcion.trim() : null);
            nuevoDepartamento.setVisible(visible);

            // Guardar el departamento
            Departamento departamentoGuardado = departamentoService.guardarDepartamento(nuevoDepartamento);

            if (departamentoGuardado.getIdDepartamento() == null) {
                throw new RuntimeException("No se generó el ID del departamento");
            }

            response.put("success", true);
            response.put("message", "Departamento creado exitosamente");
            response.put("id", departamentoGuardado.getIdDepartamento());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error al crear el departamento: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/obtener/{id}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> obtenerDepartamentoParaEditar(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            Departamento departamento = departamentoService.obtenerDepartamentoPorId(id);
            if (departamento == null) {
                response.put("success", false);
                response.put("message", "Departamento no encontrado");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }

            response.put("success", true);
            response.put("idDepartamento", departamento.getIdDepartamento());
            response.put("nombre", departamento.getNombre());
            response.put("descripcion", departamento.getDescripcion());
            response.put("visible", departamento.isVisible());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error al obtener el departamento: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // METODO PARA ACTUALIZAR DEPARTAMENTOS
    @PostMapping("/actualizar/{id}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> actualizarDepartamento(
            @PathVariable Long id,
            @RequestParam("nombre") String nombre,
            @RequestParam(value = "descripcion", required = false) String descripcion,
            @RequestParam(value = "visible", required = false, defaultValue = "false") boolean visible) {

        Map<String, Object> response = new HashMap<>();
        try {
            // Verificar que el departamento existe
            Departamento departamentoExistente = departamentoService.obtenerDepartamentoPorId(id);
            if (departamentoExistente == null) {
                response.put("success", false);
                response.put("message", "Departamento no encontrado");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }

            // Validar que el nombre no esté vacío
            if (nombre == null || nombre.trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "El nombre del departamento es obligatorio");
                return ResponseEntity.badRequest().body(response);
            }

            // Verificar si ya existe otro departamento con el mismo nombre
            Departamento existenteConMismoNombre = departamentoService.obtenerDepartamentoPorNombre(nombre.trim());
            if (existenteConMismoNombre != null && !existenteConMismoNombre.getIdDepartamento().equals(id)) {
                response.put("success", false);
                response.put("message", "Ya existe otro departamento con ese nombre");
                return ResponseEntity.badRequest().body(response);
            }

            // Actualizar los campos
            departamentoExistente.setNombre(nombre.trim());
            departamentoExistente.setDescripcion(descripcion != null ? descripcion.trim() : null);
            departamentoExistente.setVisible(visible);

            departamentoService.guardarDepartamento(departamentoExistente);

            response.put("success", true);
            response.put("message", "Departamento actualizado correctamente");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error al actualizar el departamento: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/eliminar/{id}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> eliminarDepartamento(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            // Verificar que el departamento existe
            Departamento departamento = departamentoService.obtenerDepartamentoPorId(id);
            if (departamento == null) {
                response.put("success", false);
                response.put("message", "Departamento no encontrado");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }

            // Verificar si hay usuarios asociados
            Long usuariosAsociados = usuarioService.contarUsuariosPorDepartamento(departamento.getNombre());
            if (usuariosAsociados > 0) {
                response.put("success", false);
                response.put("message", "No se puede eliminar el departamento porque tiene usuarios asociados");
                return ResponseEntity.badRequest().body(response);
            }

            departamentoService.eliminarDepartamento(id);
            response.put("success", true);
            response.put("message", "Departamento eliminado correctamente");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error al eliminar el departamento: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/toggle-visibilidad/{id}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> toggleVisibilidad(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            Departamento departamento = departamentoService.obtenerDepartamentoPorId(id);
            if (departamento == null) {
                response.put("success", false);
                response.put("message", "Departamento no encontrado");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }

            departamentoService.toggleVisibilidad(id);

            // Obtener el departamento actualizado
            departamento = departamentoService.obtenerDepartamentoPorId(id);

            response.put("success", true);
            response.put("visible", departamento.isVisible());
            response.put("message", departamento.isVisible()
                    ? "Departamento visible para los usuarios"
                    : "Departamento oculto para los usuarios");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error al cambiar visibilidad: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}
