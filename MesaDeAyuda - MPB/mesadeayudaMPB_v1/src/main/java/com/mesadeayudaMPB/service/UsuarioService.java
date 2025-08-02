package com.mesadeayudaMPB.service;

import com.mesadeayudaMPB.domain.Usuario;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * Interface for user service operations.
 */
public interface UsuarioService {

    // Retrieve a list of all users
    List<Usuario> getUsuarios();

    // Retrieve a user by their object
    Usuario getUsuario(Usuario usuario);

    // Retrieve a user by their name
    Usuario getUsuarioPorNombre(String nombre);

    // Retrieve a user by name and password
    Usuario getUsuarioPorNombreYContrasena(String nombre, String contrasena);

    // Retrieve a user by name or email
    Usuario getUsuarioPorNombreOCorreo(String nombre, String correoElectronico);

    boolean existeOtroUsuarioConCorreo(String correo, Long idUsuario);

    // Check if a user exists by name or email
    boolean existeUsuarioPorNombreOCorreo(String nombre, String correoElectronico);

    // Check if a user exists by name or email (used for login)
    boolean existeUsuarioPorNombreOCorreoElectronico(String nombre, String correoElectronico);

    // Save or update a user, optionally assigning a default "ROL_USUARIO" role
    void save(Usuario usuario, boolean crearRolUser);

    // Delete a user
    void delete(Usuario usuario);

    // Count users by department
    Long contarUsuariosPorDepartamento(String nombreDepartamento);

    // Retrieve users by a list of role names
    List<Usuario> getUsuariosPorRoles(List<String> roles);

    // Check if a user exists by email
    boolean existeUsuarioPorCorreoElectronico(String correoElectronico);

    // Retrieve a user by email
    Usuario getUsuarioPorCorreo(String correoElectronico);

    // Update user image
    byte[] actualizarImagen(MultipartFile imagen);

    // Retrieve a user by ID
    Usuario getUsuarioPorId(Long id);

    // Retrieve paginated users
    Page<Usuario> getUsuariosPaginados(Pageable pageable);

    // Retrieve paginated users sorted by ID
    Page<Usuario> getUsuariosPaginadosOrdenadosPorId(Pageable pageable);

    // Search users with pagination
    Page<Usuario> buscarUsuarios(String query, Pageable pageable);

    // Search users by status with pagination
    Page<Usuario> buscarUsuariosPorEstado(String query, boolean activo, Pageable pageable);

    // Retrieve users by status with pagination
    Page<Usuario> getUsuariosPorEstado(boolean activo, Pageable pageable);

    // Retrieve users by role with pagination
    Page<Usuario> getUsuariosPorRol(String rol, Pageable pageable);

    // Search users by role with pagination
    Page<Usuario> buscarUsuariosPorRol(String query, String rol, Pageable pageable);

    // Retrieve users by status and role with pagination
    Page<Usuario> getUsuariosPorEstadoYRol(boolean activo, String rol, Pageable pageable);

    // Search users by status and role with pagination
    Page<Usuario> buscarUsuariosPorEstadoYRol(String query, boolean activo, String rol, Pageable pageable);
}
