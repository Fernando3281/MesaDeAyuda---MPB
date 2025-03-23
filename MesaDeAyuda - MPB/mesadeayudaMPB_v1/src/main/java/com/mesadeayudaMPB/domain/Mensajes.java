package com.mesadeayudaMPB.domain;

import jakarta.persistence.*;
import lombok.Data;
import java.util.Date;

@Data
@Entity
@Table(name = "Mensajes")
public class Mensajes {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_Mensaje")
    private Long idMensaje;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_Ticket", referencedColumnName = "id_ticket")
    private Ticket ticket; // Relación con Ticket

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_Emisor", referencedColumnName = "id_Usuario")
    private Usuario emisor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_Receptor", referencedColumnName = "id_Usuario")
    private Usuario receptor;

    @Column(name = "Mensaje", columnDefinition = "TEXT", nullable = false)
    private String mensaje;

    @Column(name = "FechaHora", nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date fechaHora;

    @Column(name = "EsNotaInterna", nullable = false)
    private boolean esNotaInterna;
}
