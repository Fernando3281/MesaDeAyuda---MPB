package com.mesadeayudaMPB.dao;

import com.mesadeayudaMPB.domain.Usuario;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    // Método para paginación (ya proporcionado por JpaRepository)
    @Override
    Page<Usuario> findAll(Pageable pageable);

    List<Usuario> findByDepartamento(String departamento);

    @Query("SELECT u FROM Usuario u WHERE "
            + "LOWER(u.nombre) LIKE LOWER(CONCAT('%', :query, '%')) OR "
            + "LOWER(u.apellido) LIKE LOWER(CONCAT('%', :query, '%')) OR "
            + "LOWER(u.codigo) LIKE LOWER(CONCAT('%', :query, '%')) OR "
            + "LOWER(u.correoElectronico) LIKE LOWER(CONCAT('%', :query, '%')) OR "
            + "CAST(u.numeroTelefono AS string) LIKE CONCAT('%', :query, '%') OR "
            + "LOWER(u.departamento) LIKE LOWER(CONCAT('%', :query, '%'))")
    Page<Usuario> buscarUsuarios(@Param("query") String query, Pageable pageable);

    @Query("SELECT u FROM Usuario u WHERE "
            + "LOWER(u.nombre) LIKE LOWER(CONCAT('%', :query, '%')) OR "
            + "LOWER(u.apellido) LIKE LOWER(CONCAT('%', :query, '%')) OR "
            + "LOWER(u.codigo) LIKE LOWER(CONCAT('%', :query, '%')) OR "
            + "LOWER(u.correoElectronico) LIKE LOWER(CONCAT('%', :query, '%')) OR "
            + "CAST(u.numeroTelefono AS string) LIKE CONCAT('%', :query, '%') OR "
            + "LOWER(u.departamento) LIKE LOWER(CONCAT('%', :query, '%')) "
            + "AND u.activo = :activo")
    Page<Usuario> buscarUsuariosPorEstado(@Param("query") String query, @Param("activo") boolean activo, Pageable pageable);

    @Query("SELECT u FROM Usuario u WHERE u.activo = :activo")
    Page<Usuario> findByActivo(@Param("activo") boolean activo, Pageable pageable);

    @Query("SELECT DISTINCT u FROM Usuario u JOIN u.roles r WHERE r.nombre = :rol")
    Page<Usuario> findByRolesNombre(@Param("rol") String rol, Pageable pageable);

    @Query("SELECT u FROM Usuario u JOIN u.roles r WHERE "
            + "(LOWER(u.nombre) LIKE LOWER(CONCAT('%', :query, '%')) OR "
            + "LOWER(u.apellido) LIKE LOWER(CONCAT('%', :query, '%')) OR "
            + "LOWER(u.codigo) LIKE LOWER(CONCAT('%', :query, '%')) OR "
            + "LOWER(u.correoElectronico) LIKE LOWER(CONCAT('%', :query, '%')) OR "
            + "CAST(u.numeroTelefono AS string) LIKE CONCAT('%', :query, '%') OR "
            + "LOWER(u.departamento) LIKE LOWER(CONCAT('%', :query, '%'))) "
            + "AND r.nombre = :rol")
    Page<Usuario> buscarUsuariosPorRol(@Param("query") String query, @Param("rol") String rol, Pageable pageable);

    @Query("SELECT u FROM Usuario u JOIN u.roles r WHERE u.activo = :activo AND r.nombre = :rol")
    Page<Usuario> findByActivoAndRolesNombre(@Param("activo") boolean activo, @Param("rol") String rol, Pageable pageable);

    @Query("SELECT u FROM Usuario u JOIN u.roles r WHERE "
            + "(LOWER(u.nombre) LIKE LOWER(CONCAT('%', :query, '%')) OR "
            + "LOWER(u.apellido) LIKE LOWER(CONCAT('%', :query, '%')) OR "
            + "LOWER(u.codigo) LIKE LOWER(CONCAT('%', :query, '%')) OR "
            + "LOWER(u.correoElectronico) LIKE LOWER(CONCAT('%', :query, '%')) OR "
            + "CAST(u.numeroTelefono AS string) LIKE CONCAT('%', :query, '%') OR "
            + "LOWER(u.departamento) LIKE LOWER(CONCAT('%', :query, '%'))) "
            + "AND u.activo = :activo AND r.nombre = :rol")
    Page<Usuario> buscarUsuariosPorEstadoYRol(@Param("query") String query,
            @Param("activo") boolean activo,
            @Param("rol") String rol,
            Pageable pageable);

    boolean existsByCorreoElectronicoAndIdUsuarioNot(String correoElectronico, Long idUsuario);

}
