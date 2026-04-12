package com.example.tiendaonline.usuario.mcsv_usuario.config;


import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.stereotype.Service;

import com.example.tiendaonline.usuario.mcsv_usuario.models.Usuario;
import com.example.tiendaonline.usuario.mcsv_usuario.repository.UsuarioRepository;


@Service
public class UsuarioDetailsService implements UserDetailsService{
    
  
  private final UsuarioRepository repository;



    UsuarioDetailsService(UsuarioRepository repository) {
        this.repository = repository;
    }

     @Override
      public UserDetails loadUserByUsername(String username){

     Usuario usuario = repository.findByEmail(username)
      .orElseThrow(()-> new RuntimeException("Usuario no encontrado"));

      return new UsuarioDetails(usuario);


   }

}
