package com.example.tiendaonline.usuario.mcsv_usuario.config;

import java.util.Collection;
import java.util.Collections;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.example.tiendaonline.usuario.mcsv_usuario.models.Usuario;

public class UsuarioDetails implements UserDetails{

  private Usuario usuario;

 

  public UsuarioDetails(Usuario usuario) {
    this.usuario = usuario;
  }


    @Override
  public Collection<? extends GrantedAuthority> getAuthorities() {
    if (usuario.isAdmin()) {
      return Collections.singletonList(new SimpleGrantedAuthority("ROLE_ADMIN"));
    }
    return Collections.singletonList(new SimpleGrantedAuthority("ROLE_USER"));
  } 


  @Override
  public boolean isAccountNonExpired() { return true; }

  @Override
  public boolean isAccountNonLocked() { return true; }

  @Override
  public boolean isCredentialsNonExpired() { return true; }

  @Override
  public boolean isEnabled() { return usuario.isVerificado();}

  @Override
  public String getUsername(){
     return usuario.getEmail();
  }
  
  @Override
  public String getPassword(){
    return usuario.getPassword();
  }


  


}
