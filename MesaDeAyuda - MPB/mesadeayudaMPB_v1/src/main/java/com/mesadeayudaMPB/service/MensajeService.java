package com.mesadeayudaMPB.service;

import com.mesadeayudaMPB.domain.Mensajes;
import java.util.List;

public interface MensajeService {
    List<Mensajes> obtenerMensajesPorTicket(Long idTicket);
    Mensajes guardarMensaje(Mensajes mensaje);
    Mensajes obtenerMensajePorId(Long idMensaje);
    void eliminarMensajesPorUsuario(Long idUsuario);

    public List<Mensajes> filtrarPorUsuario(Long ticketId, Long idUsuario);

    public long contarMensajesPorUsuario(Long ticketId, Long idUsuario);

    public List<Mensajes> filtrarPorTipo(Long ticketId, boolean b);

    public long contarMensajesPorTicket(Long ticketId);

    public List<Mensajes> buscarEnTicket(Long ticketId, String searchTerm);

    public long contarMensajesPorTipo(Long ticketId, boolean b);

    public boolean eliminarMensaje(Long idMensaje, Long idUsuario);
}