/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Interface.java to edit this template
 */
package com.mesadeayudaMPB.service;

import com.mesadeayudaMPB.domain.Usuario;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.web.multipart.MultipartFile;

/**
 *
 * @author ferva
 */
public interface UsuarioService {

    // Se obtiene un listado de usuarios en un List
    public List<Usuario> getUsuarios();

    // Se obtiene un Usuario, a partir del id de un usuario
    public Usuario getUsuario(Usuario usuario);

    // Se obtiene un Usuario, a partir del username de un usuario
    public Usuario getUsuarioPorNombre(String Nombre);

    // Se obtiene un Usuario, a partir del username y el password de un usuario
    public Usuario getUsuarioPorNombreYContrasena(String Nombre, String Contraseña);

    // Se obtiene un Usuario, a partir del username y el password de un usuario
    public Usuario getUsuarioPorNombreOCorreo(String Nombre, String correoElectronico);

    // Se valida si existe un Usuario considerando el username
    public boolean existeUsuarioPorNombreOCorreo(String Nombre, String correoElectronico);

    //ESTE BOOLEAN FUNCCIONA PARA EL LOGIN
    boolean existeUsuarioPorNombreOCorreoElectronico(String nombre, String correoElectronico);

    // Se inserta un nuevo usuario si el id del usuario esta vacío
    // Se actualiza un usuario si el id del usuario NO esta vacío
    public void save(Usuario usuario, boolean crearRolUser);

    // Se elimina el usuario que tiene el id pasado por parámetro
    public void delete(Usuario usuario);

    Long contarUsuariosPorDepartamento(String nombreDepartamento);

    List<Usuario> getUsuariosPorRoles(List<String> roles);

    //METODO PARA EL REGISTRO
    public boolean existeUsuarioPorCorreoElectronico(String correoElectronico);

    Usuario getUsuarioPorCorreo(String correoElectronico);

    // Método para actualizar la imagen como bytes
    byte[] actualizarImagen(MultipartFile imagen);

    public Usuario getUsuarioPorId(Long id);

    // Nuevo método para paginación
    Page<Usuario> getUsuariosPaginados(int page, int size);

    Page<Usuario> getUsuariosPaginadosOrdenadosPorId(int page, int size);

    Page<Usuario> buscarUsuarios(String query, int page, int size);

    Page<Usuario> buscarUsuariosPorEstado(String query, boolean activo, int page, int size);

    Page<Usuario> getUsuariosPorEstado(boolean activo, int page, int size);

    Page<Usuario> getUsuariosPorRol(String rol, int page, int size);

    Page<Usuario> buscarUsuariosPorRol(String query, String rol, int page, int size);

    Page<Usuario> getUsuariosPorEstadoYRol(boolean activo, String rol, int page, int size);

    Page<Usuario> buscarUsuariosPorEstadoYRol(String query, boolean activo, String rol, int page, int size);
}
