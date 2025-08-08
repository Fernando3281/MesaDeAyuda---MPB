package com.mesadeayudaMPB.service.impl;

import com.mesadeayudaMPB.dao.AuditoriaDao;
import com.mesadeayudaMPB.domain.Auditoria;
import com.mesadeayudaMPB.domain.Ticket;
import com.mesadeayudaMPB.domain.Usuario;
import com.mesadeayudaMPB.service.AuditoriaService;
import com.mesadeayudaMPB.service.UsuarioService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Date;
import java.util.List;
import org.hibernate.Hibernate;

@Service
public class AuditoriaServiceImpl implements AuditoriaService {

    @Autowired
    private AuditoriaDao auditoriaDao;

    @Autowired
    private UsuarioService usuarioService;

    private String getUsuarioInfo(Usuario usuario) {
        if (usuario == null) {
            return "Usuario no disponible";
        }
        return String.format("%s (%s)",
                usuario.getNombre() + " " + usuario.getApellido(),
                usuario.getCodigo());
    }

    private String getTicketInfo(Ticket ticket) {
        if (ticket == null) {
            return "Ticket no disponible";
        }
        return String.format("%s - %s", ticket.getCodigo(), ticket.getTitulo());
    }

    @Override
    @Transactional
    public void registrarAccion(Ticket ticket, String accion, String detalle,
            String valorAnterior, String valorNuevo, Usuario usuario) {
        try {
            Auditoria auditoria = new Auditoria();
            auditoria.setTicket(ticket);
            auditoria.setAccion(accion);
            auditoria.setDetalle(detalle);
            auditoria.setValorAnterior(valorAnterior);
            auditoria.setValorNuevo(valorNuevo);
            auditoria.setFechaAccion(new Date());
            auditoria.setUsuario(usuario);

            // Obtener solo el ID y nombre del usuario autenticado
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated()
                    && !authentication.getName().equals("anonymousUser")) {
                try {
                    String correoElectronico = authentication.getName();
                    // Solo obtener los datos básicos necesarios
                    String nombreUsuario = usuarioService.getUsuarioPorCorreo(correoElectronico)
                            .getNombre() + " " + usuarioService.getUsuarioPorCorreo(correoElectronico)
                                    .getApellido();

                    // Crear un usuario mínimo para la auditoría
                    Usuario usuarioMinimo = new Usuario();
                    usuarioMinimo.setIdUsuario(usuarioService.getUsuarioPorCorreo(correoElectronico).getIdUsuario());
                    usuarioMinimo.setNombre(nombreUsuario);

                    auditoria.setUsuario(usuarioMinimo);
                } catch (Exception e) {
                    System.err.println("Error obteniendo usuario para auditoría: " + e.getMessage());
                }
            }

            auditoriaDao.save(auditoria);

        } catch (Exception e) {
            System.err.println("Error registrando acción de auditoría: " + e.getMessage());
            throw new RuntimeException("Error al registrar acción de auditoría", e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<Auditoria> obtenerHistorialPorTicket(Ticket ticket) {
        return auditoriaDao.findByTicketOrderByFechaAccionDesc(ticket);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Auditoria> obtenerHistorialPorTicketId(Long idTicket) {
        return auditoriaDao.findByIdTicketOrderByFechaAccionDesc(idTicket);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<Auditoria> obtenerHistorialPorTicketIdPaginado(Long idTicket, Pageable pageable) {
        try {
            // Usar el método más simple basado en convenciones de Spring Data
            return auditoriaDao.findByTicket_IdTicket(idTicket, pageable);
        } catch (Exception e) {
            System.err.println("Error obteniendo historial paginado: " + e.getMessage());
            e.printStackTrace();
            throw new RuntimeException("Error al obtener historial paginado", e);
        }
    }

    @Override
    @Transactional
    public void eliminarAuditoriasPorTicket(Long idTicket) {
        try {
            // Primera opción: Usar el método del repositorio
            auditoriaDao.deleteByTicketId(idTicket);

        } catch (Exception e) {
            System.err.println("Error eliminando auditorías del ticket: " + idTicket + " - " + e.getMessage());
            throw new RuntimeException("Error al eliminar auditorías del ticket", e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public List<Auditoria> findTop50RecentAuditActions() {
        return auditoriaDao.findTop50RecentAuditActions();
    }

}
