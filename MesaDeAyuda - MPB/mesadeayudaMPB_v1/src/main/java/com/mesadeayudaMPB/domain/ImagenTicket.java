package com.mesadeayudaMPB.domain;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "Imagenes_Ticket")
public class ImagenTicket {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_imagen")
    private Long idImagen;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_ticket", nullable = false)
    private Ticket ticket;

    @Lob
    @Column(name = "imagen", nullable = false)
    private byte[] imagen;

    @Column(name = "nombre_archivo")
    private String nombreArchivo;

    @Column(name = "tipo_archivo")
    private String tipoArchivo;
}