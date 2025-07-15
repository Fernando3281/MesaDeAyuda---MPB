package com.mesadeayudaMPB.domain;

import jakarta.persistence.*;
import lombok.Data;
import java.io.Serializable;
import java.util.Date;

@Data
@Entity
@Table(name = "Auditoria")
public class Auditoria implements Serializable {
    private static final long serialVersionUID = 1L;

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_auditoria")
    private Long idAuditoria;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_ticket", referencedColumnName = "id_ticket")
    private Ticket ticket;

    @Column(name = "accion", nullable = false)
    private String accion; // CREACION, ACTUALIZACION, ASIGNACION, CAMBIO_ESTADO, CIERRE, etc.

    @Column(name = "detalle", columnDefinition = "TEXT")
    private String detalle;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "id_usuario", referencedColumnName = "id_Usuario")
    private Usuario usuario;

    @Column(name = "fecha_accion", nullable = false)
    @Temporal(TemporalType.TIMESTAMP)
    private Date fechaAccion;

    @Column(name = "valor_anterior", columnDefinition = "TEXT")
    private String valorAnterior;

    @Column(name = "valor_nuevo", columnDefinition = "TEXT")
    private String valorNuevo;
}