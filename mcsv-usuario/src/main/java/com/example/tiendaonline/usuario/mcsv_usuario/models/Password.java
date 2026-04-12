package com.example.tiendaonline.usuario.mcsv_usuario.models;

import java.time.LocalDateTime;


import jakarta.persistence.*;

@Entity
public class Password {

  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  private String email;
  private String codigo;
  private String nuevaPass;
  private LocalDateTime expiracion;
  private boolean usado;



  public Long getId() {
    return id;
  }
  public void setId(Long id) {
    this.id = id;
  }
  public String getEmail() {
    return email;
  }
  public void setEmail(String email) {
    this.email = email;
  }
  public String getCodigo() {
    return codigo;
  }
  public void setCodigo(String codigo) {
    this.codigo = codigo;
  }
  public LocalDateTime getExpiracion() {
    return expiracion;
  }
  public void setExpiracion(LocalDateTime expiracion) {
    this.expiracion = expiracion;
  }
  public boolean isUsado() {
    return usado;
  }
  public void setUsado(boolean usado) {
    this.usado = usado;
  }
  public String getNuevaPass() {
    return nuevaPass;
  }
  public void setNuevaPass(String nuevaPass) {
    this.nuevaPass = nuevaPass;
  }
  

  

}
