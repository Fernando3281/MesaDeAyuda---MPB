/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Interface.java to edit this template
 */
package com.mesadeayudaMPB.service;

import com.mesadeayudaMPB.domain.Usuario;
import java.util.List;

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
    
    boolean existeUsuarioPorNombreOCorreoElectronico(String nombre, String correoElectronico);

    // Se inserta un nuevo usuario si el id del usuario esta vacío
    // Se actualiza un usuario si el id del usuario NO esta vacío
    public void save(Usuario usuario, boolean crearRolUser);

    // Se elimina el usuario que tiene el id pasado por parámetro
    public void delete(Usuario usuario);

}