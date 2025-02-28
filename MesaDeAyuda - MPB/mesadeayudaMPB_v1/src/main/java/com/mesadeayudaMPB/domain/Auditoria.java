package com.mesadeayudaMPB.domain;

import jakarta.persistence.*;
import lombok.Data;
import java.io.Serializable;
import java.util.Date;

@Data
@Entity
@Table(name = "Auditoria")
public class Auditoria implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_auditoria")
    private Long idAuditoria;

    @ManyToOne
    @JoinColumn(name = "id_ticket", referencedColumnName = "id_ticket")
    private Ticket ticket;

    @Column(name = "fecha_actualizacion")
    private Date fechaActualizacion;

    @ManyToOne
    @JoinColumn(name = "usuario_actualizacion", referencedColumnName = "id_Usuario")
    private Usuario usuarioActualizacion;

    @ManyToOne
    @JoinColumn(name = "usuario_asignado", referencedColumnName = "id_Usuario")
    private Usuario usuarioAsignado;

    @Column(name = "actividad")
    private String actividad;
    
    //Agregar propiedad para calcular el tiempo transcurrido en la respuesta del ticket
}