package com.mesadeayudaMPB.controller;

import com.mesadeayudaMPB.domain.Departamento;
import com.mesadeayudaMPB.service.DepartamentoService;
import com.mesadeayudaMPB.service.UsuarioService;
import java.util.HashMap;
import java.util.Map;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
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
            @RequestParam(defaultValue = "10") int size,
            Model model) {

        Page<Departamento> pageResult = departamentoService.obtenerDepartamentosPaginados(page, size);

        // Obtener el número de usuarios por departamento
        Map<Long, Long> usuariosPorDepartamento = new HashMap<>();
        for (Departamento departamento : pageResult.getContent()) {
            Long count = usuarioService.contarUsuariosPorDepartamento(departamento.getNombre());
            usuariosPorDepartamento.put(departamento.getIdDepartamento(), count);
        }

        model.addAttribute("departamentos", pageResult.getContent());
        model.addAttribute("usuariosPorDepartamento", usuariosPorDepartamento);
        model.addAttribute("currentPage", page);
        model.addAttribute("totalPages", pageResult.getTotalPages());
        model.addAttribute("totalItems", pageResult.getTotalElements());
        model.addAttribute("pageSize", size);

        return "/departamento/listado";
    }

    @GetMapping("/nuevo")
    public String mostrarFormularioNuevoDepartamento(Model model) {
        model.addAttribute("departamento", new Departamento());
        return "/departamento/nuevo";
    }

    @PostMapping("/guardar")
    public String guardarDepartamento(@ModelAttribute Departamento departamento) {
        departamentoService.guardarDepartamento(departamento);
        return "redirect:/departamento/listado";
    }

    @GetMapping("/editar/{id}")
    public String mostrarFormularioEditarDepartamento(@PathVariable Long id, Model model) {
        Departamento departamento = departamentoService.obtenerDepartamentoPorId(id);
        model.addAttribute("departamento", departamento);
        return "/departamento/editar";
    }

    @PostMapping("/actualizar/{id}")
    public String actualizarDepartamento(@PathVariable Long id, @ModelAttribute Departamento departamento) {
        departamento.setIdDepartamento(id);
        departamentoService.guardarDepartamento(departamento);
        return "redirect:/departamento/listado";
    }

    @GetMapping("/eliminar/{id}")
    public String eliminarDepartamento(@PathVariable Long id) {
        departamentoService.eliminarDepartamento(id);
        return "redirect:/departamento/listado";
    }
}
