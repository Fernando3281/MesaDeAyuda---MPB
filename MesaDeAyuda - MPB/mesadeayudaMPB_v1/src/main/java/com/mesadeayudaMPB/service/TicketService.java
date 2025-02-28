package com.mesadeayudaMPB.service;
import com.mesadeayudaMPB.domain.Ticket;
import com.mesadeayudaMPB.domain.Usuario;
import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;
import java.util.List;
public interface TicketService {
    // Obtener todos los tickets
    public List<Ticket> getTickets();

    // Obtener un ticket específico
    public Ticket getTicket(Ticket ticket);

    // Obtener ticket por código
    public Ticket getTicketPorCodigo(String codigo);

    // Guardar o actualizar un ticket
    public void save(Ticket ticket);

    // Eliminar un ticket
    public void delete(Ticket ticket);

    // Generar código único para el ticket
    public String generarCodigoTicket();

    // Procesar las imágenes adjuntas al ticket
    public byte[] procesarImagenes(List<MultipartFile> imagenes);

    // Obtener tickets con paginación
    public Page<Ticket> getTicketsPaginados(int page, int size);

    List<Ticket> getTicketsPorSolicitante(Usuario solicitante);

    int contarImagenes(byte[] imagenesBytes);
    byte[] obtenerImagenPorIndice(byte[] imagenesBytes, int index);
}