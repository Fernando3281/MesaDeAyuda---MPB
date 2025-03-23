package com.mesadeayudaMPB.dao;

import com.mesadeayudaMPB.domain.Usuario;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

/**
 *
 * @author ferva
 */
public interface UsuarioDao extends JpaRepository<Usuario, Long> {

    Usuario findByNombre(String nombre);

    Usuario findByNombreAndContrasena(String nombre, String contrasena);

    Usuario findByNombreOrCorreoElectronico(String nombre, String correoElectronico);

    Usuario findByCorreoElectronico(String correoElectronico);

    @Query("SELECT COUNT(u) FROM Usuario u WHERE u.departamento = :nombreDepartamento")
    Long countByDepartamento(@Param("nombreDepartamento") String nombreDepartamento);

    @Query("SELECT DISTINCT u FROM Usuario u JOIN u.roles r WHERE r.nombre IN :roles")
    List<Usuario> findByRolesNombreIn(@Param("roles") List<String> roles);

    //METODO PARA EL REGISTRO
    boolean existsByNombreOrCorreoElectronico(String nombre, String correoElectronico);

    boolean existsByCorreoElectronico(String correoElectronico);

    boolean existsByCodigo(String codigo);
}
