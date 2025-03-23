package com.mesadeayudaMPB.domain;

import jakarta.persistence.*;
import lombok.Data;
import java.io.Serializable;
import java.util.Date;
import java.util.List;

@Data
@Entity
@Table(name = "Tickets")
public class Ticket implements Serializable {
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_ticket")
    private Long idTicket;

    @Column(name = "codigo", length = 11, unique = true, nullable = false)
    private String codigo;

    @Column(name = "fecha_apertura", nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date fechaApertura;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "solicitante", referencedColumnName = "id_Usuario")
    private Usuario solicitante;

    @Column(name = "titulo", length = 80, nullable = false)
    private String titulo;

    @Column(name = "descripcion", columnDefinition = "TEXT", nullable = false)
    private String descripcion;

    @Column(name = "prioridad", nullable = false)
    private String prioridad;

    @Column(name = "estado", nullable = false)
    private String estado;

    @Column(name = "categoria", nullable = false)
    private String categoria;

    @Column(name = "impacto", length = 10)
    private String impacto;

    @Column(name = "fecha_actualizacion", nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date fechaActualizacion;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "asignado_para", referencedColumnName = "id_Usuario")
    private Usuario asignadoPara;
    
    @OneToMany(mappedBy = "ticket", fetch = FetchType.LAZY)
    private List<Mensajes> mensajes;
}