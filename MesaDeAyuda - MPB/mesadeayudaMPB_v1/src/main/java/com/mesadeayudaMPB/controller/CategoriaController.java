package com.mesadeayudaMPB.controller;

import com.mesadeayudaMPB.domain.Categoria;
import com.mesadeayudaMPB.service.CategoriaService;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.*;

@Controller
@RequestMapping("/categoria")
public class CategoriaController {

    @Autowired
    private CategoriaService categoriaService;

    @GetMapping("/listado")
    public String listadoCategorias(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "15") int size,
            @RequestParam(required = false) String search,
            Model model) {

        Page<Categoria> pageResult;

        if (search != null && !search.trim().isEmpty()) {
            pageResult = categoriaService.buscarCategoriasPaginados(search, page, size);
        } else {
            pageResult = categoriaService.obtenerCategoriasPaginados(page, size);
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

        model.addAttribute("categorias", pageResult.getContent());
        model.addAttribute("currentPage", currentPage);
        model.addAttribute("startPage", startPage);
        model.addAttribute("endPage", endPage);
        model.addAttribute("totalPages", totalPages);
        model.addAttribute("totalItems", pageResult.getTotalElements());
        model.addAttribute("pageSize", size);
        model.addAttribute("start", page * size + 1);
        model.addAttribute("end", Math.min((page + 1) * size, pageResult.getTotalElements()));
        model.addAttribute("searchQuery", search);

        return "/categoria/listado";
    }

    @PostMapping("/crear")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> crearCategoria(
            @RequestParam("nombre") String nombre,
            @RequestParam(value = "descripcion", required = false) String descripcion,
            @RequestParam(value = "activo", required = false, defaultValue = "false") boolean activo) {

        Map<String, Object> response = new HashMap<>();

        try {
            // Validar que el nombre no esté vacío
            if (nombre == null || nombre.trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "El nombre de la categoría es obligatorio");
                return ResponseEntity.badRequest().body(response);
            }

            // Verificar si ya existe una categoría con el mismo nombre
            if (categoriaService.existeCategoriaPorNombre(nombre.trim())) {
                response.put("success", false);
                response.put("message", "Ya existe una categoría con ese nombre");
                return ResponseEntity.badRequest().body(response);
            }

            // Crear nueva categoría
            Categoria nuevaCategoria = new Categoria();
            nuevaCategoria.setNombre(nombre.trim());
            nuevaCategoria.setDescripcion(descripcion != null ? descripcion.trim() : null);
            nuevaCategoria.setActivo(activo);

            // Guardar la categoría
            categoriaService.save(nuevaCategoria);

            response.put("success", true);
            response.put("message", "Categoría creada exitosamente");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error al crear la categoría: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/obtener/{id}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> obtenerCategoriaParaEditar(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            Categoria categoria = categoriaService.getCategoriaPorId(id);
            if (categoria == null) {
                response.put("success", false);
                response.put("message", "Categoría no encontrada");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }

            response.put("success", true);
            response.put("idCategoria", categoria.getIdCategoria());
            response.put("nombre", categoria.getNombre());
            response.put("descripcion", categoria.getDescripcion());
            response.put("activo", categoria.getActivo());

            return ResponseEntity.ok(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error al obtener la categoría: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/actualizar/{id}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> actualizarCategoria(
            @PathVariable Long id,
            @RequestParam("nombre") String nombre,
            @RequestParam(value = "descripcion", required = false) String descripcion,
            @RequestParam(value = "activo", required = false, defaultValue = "false") boolean activo) {

        Map<String, Object> response = new HashMap<>();
        try {
            // Verificar que la categoría existe
            Categoria categoriaExistente = categoriaService.getCategoriaPorId(id);
            if (categoriaExistente == null) {
                response.put("success", false);
                response.put("message", "Categoría no encontrada");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }

            // Validar que el nombre no esté vacío
            if (nombre == null || nombre.trim().isEmpty()) {
                response.put("success", false);
                response.put("message", "El nombre de la categoría es obligatorio");
                return ResponseEntity.badRequest().body(response);
            }

            // Verificar si ya existe otra categoría con el mismo nombre
            Categoria existenteConMismoNombre = categoriaService.getCategoriaPorNombre(nombre.trim());
            if (existenteConMismoNombre != null && !existenteConMismoNombre.getIdCategoria().equals(id)) {
                response.put("success", false);
                response.put("message", "Ya existe otra categoría con ese nombre");
                return ResponseEntity.badRequest().body(response);
            }

            // Actualizar los campos
            categoriaExistente.setNombre(nombre.trim());
            categoriaExistente.setDescripcion(descripcion != null ? descripcion.trim() : null);
            categoriaExistente.setActivo(activo);

            categoriaService.save(categoriaExistente);

            response.put("success", true);
            response.put("message", "Categoría actualizada correctamente");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error al actualizar la categoría: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/eliminar/{id}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> eliminarCategoria(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            // Verificar que la categoría existe
            Categoria categoria = categoriaService.getCategoriaPorId(id);
            if (categoria == null) {
                response.put("success", false);
                response.put("message", "Categoría no encontrada");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }

            // Aquí podrías agregar validaciones adicionales, como verificar si hay tickets asociados
            categoriaService.delete(categoria);
            response.put("success", true);
            response.put("message", "Categoría eliminada correctamente");
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error al eliminar la categoría: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/toggle-estado/{id}")
    @ResponseBody
    public ResponseEntity<Map<String, Object>> toggleEstado(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        try {
            Categoria categoria = categoriaService.getCategoriaPorId(id);
            if (categoria == null) {
                response.put("success", false);
                response.put("message", "Categoría no encontrada");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }

            boolean nuevoEstado = !categoria.getActivo();
            categoriaService.activarDesactivarCategoria(id, nuevoEstado);

            response.put("success", true);
            response.put("activo", nuevoEstado);
            response.put("message", nuevoEstado
                    ? "Categoría activada correctamente"
                    : "Categoría desactivada correctamente");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Error al cambiar estado: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/activas")
    @ResponseBody
    public ResponseEntity<List<Map<String, Object>>> obtenerCategoriasActivas() {
        try {
            List<Categoria> categorias = categoriaService.obtenerCategoriasActivas();
            List<Map<String, Object>> response = categorias.stream().map(categoria -> {
                Map<String, Object> categoriaMap = new HashMap<>();
                categoriaMap.put("idCategoria", categoria.getIdCategoria());
                categoriaMap.put("nombre", categoria.getNombre());
                return categoriaMap;
            }).collect(Collectors.toList());
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
