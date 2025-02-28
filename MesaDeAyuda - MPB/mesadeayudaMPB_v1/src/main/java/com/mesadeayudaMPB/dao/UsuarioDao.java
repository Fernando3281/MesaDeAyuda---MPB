package com.mesadeayudaMPB.dao;

import com.mesadeayudaMPB.domain.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;

/**
 *
 * @author ferva
 */
public interface UsuarioDao extends JpaRepository<Usuario, Long> {

    Usuario findByNombre(String nombre);

    Usuario findByNombreAndContrasena(String nombre, String contrasena);

    Usuario findByNombreOrCorreoElectronico(String nombre, String correoElectronico);

    Usuario findByCorreoElectronico(String correoElectronico);

    //METODO PARA EL REGISTRO
    boolean existsByNombreOrCorreoElectronico(String nombre, String correoElectronico);

    boolean existsByCorreoElectronico(String correoElectronico);

    boolean existsByCodigo(String codigo);
}
