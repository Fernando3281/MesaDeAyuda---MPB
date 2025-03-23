package com.mesadeayudaMPB.domain;

import jakarta.persistence.*;
import lombok.Data;
import java.io.Serializable;

@Data
@Entity
@Table(name = "Departamentos")
public class Departamento implements Serializable {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "IdDepartamento")
    private Long idDepartamento;

    @Column(name = "Nombre", nullable = false)
    private String nombre;

    @Column(name = "Descripcion", length = 510)
    private String descripcion;
}