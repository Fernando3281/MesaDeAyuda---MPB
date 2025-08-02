package com.mesadeayudaMPB.service;

import com.mesadeayudaMPB.domain.Mensajes;
import com.mesadeayudaMPB.domain.Usuario;
import java.util.Date;
import java.util.List;
import java.util.Optional;

public interface MensajeService {

    List<Mensajes> obtenerMensajesPorTicket(Long idTicket);

    Mensajes guardarMensaje(Mensajes mensaje);

    Mensajes obtenerMensajePorId(Long idMensaje);

    void eliminarMensajesPorUsuario(Long idUsuario);

    List<Mensajes> filtrarPorUsuario(Long ticketId, Long idUsuario);

    long contarMensajesPorUsuario(Long ticketId, Long idUsuario);

    List<Mensajes> filtrarPorTipo(Long ticketId, boolean esNotaInterna);

    long contarMensajesPorTicket(Long idTicket);

    List<Mensajes> buscarEnTicket(Long ticketId, String searchTerm);

    long contarMensajesPorTipo(Long ticketId, boolean esNotaInterna);

    boolean eliminarMensaje(Long idMensaje, Long idUsuario);

    Date obtenerUltimoMensajeFecha(Long idTicket);

    boolean hayNuevosMensajes(Long ticketId, Long ultimoMensajeId);

    Optional<Mensajes> obtenerUltimoMensaje(Long ticketId);

    List<Mensajes> obtenerMensajesVisiblesPorTicket(Long idTicket, Usuario usuario);

    Date obtenerUltimoMensajeFechaVisible(Long idTicket, Usuario usuario);

    long contarMensajesVisiblesPorTicket(Long idTicket, Usuario usuario);

    boolean hayNuevosMensajesVisibles(Long ticketId, Long ultimoMensajeId, Usuario usuario);
}