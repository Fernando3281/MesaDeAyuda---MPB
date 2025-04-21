package com.mesadeayudaMPB.service;

import com.mesadeayudaMPB.domain.Mensajes;
import java.util.List;

public interface MensajeService {
    List<Mensajes> obtenerMensajesPorTicket(Long idTicket);
    Mensajes guardarMensaje(Mensajes mensaje);
    Mensajes obtenerMensajePorId(Long idMensaje);
}