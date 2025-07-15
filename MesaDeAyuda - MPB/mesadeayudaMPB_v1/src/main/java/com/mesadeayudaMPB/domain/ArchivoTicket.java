package com.mesadeayudaMPB.domain;

import jakarta.persistence.*;
import lombok.Data;

@Data
@Entity
@Table(name = "Archivos_Ticket")
public class ArchivoTicket {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_archivo")
    private Long idArchivo;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_ticket", nullable = false)
    private Ticket ticket;

    @Lob
    @Column(name = "archivo", nullable = false)
    private byte[] archivo;

    @Column(name = "nombre_archivo")
    private String nombreArchivo;

    @Column(name = "tipo_archivo")
    private String tipoArchivo;
}