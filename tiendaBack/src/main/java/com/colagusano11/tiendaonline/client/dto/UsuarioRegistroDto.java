package com.colagusano11.tiendaonline.client.dto;

import java.time.LocalDate;

public class UsuarioRegistroDto {

  private String name;
  private String apellidos;

  private String phone;
  private String avatarUrl;
  private String email;

  private Long id;

  private String pais;
  private String provincia;
  private String codigoPostal;
  private String direccionPrimaria;
  private String direccionSecundaria;
  private LocalDate fechaNacimiento;

  private String numero;
  private String escalera;
  private String piso;
  private String puerta;
  private String poblacion;

  private boolean admin = false;

  public UsuarioRegistroDto(){}

  public boolean isAdmin() { return admin; }
  public void setAdmin(boolean admin) { this.admin = admin; }

  public String getName() {
    return name;
  }
  public void setName(String name) {
    this.name = name;
  }
  public String getEmail() {
    return email;
  }
  public void setEmail(String email) {
    this.email = email;
  }
  public String getPais() {
    return pais;
  }
  public void setPais(String pais) {
    this.pais = pais;
  }
  public String getProvincia() {
    return provincia;
  }
  public void setProvincia(String provincia) {
    this.provincia = provincia;
  }
  public String getCodigoPostal() {
    return codigoPostal;
  }
  public void setCodigoPostal(String codigoPostal) {
    this.codigoPostal = codigoPostal;
  }
  public String getDireccionPrimaria() {
    return direccionPrimaria;
  }
  public void setDireccionPrimaria(String direccionPrimaria) {
    this.direccionPrimaria = direccionPrimaria;
  }
  public String getDireccionSecundaria() {
    return direccionSecundaria;
  }
  public void setDireccionSecundaria(String direccionSecundaria) {
    this.direccionSecundaria = direccionSecundaria;
  }

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }

  public String getApellidos() {
    return apellidos;
  }

  public void setApellidos(String apellidos) {
    this.apellidos = apellidos;
  }

  public String getPhone() {
    return phone;
  }

  public void setPhone(String phone) {
    this.phone = phone;
  }

  public String getAvatarUrl() {
    return avatarUrl;
  }

  public void setAvatarUrl(String avatarUrl) {
    this.avatarUrl = avatarUrl;
  }

  public LocalDate getFechaNacimiento() {
    return fechaNacimiento;
  }

  public void setFechaNacimiento(LocalDate fechaNacimiento) {
    this.fechaNacimiento = fechaNacimiento;
  }

  public String getNumero() {
    return numero;
  }

  public void setNumero(String numero) {
    this.numero = numero;
  }

  public String getEscalera() {
    return escalera;
  }

  public void setEscalera(String escalera) {
    this.escalera = escalera;
  }

  public String getPiso() {
    return piso;
  }

  public void setPiso(String piso) {
    this.piso = piso;
  }

  public String getPuerta() {
    return puerta;
  }

  public void setPuerta(String puerta) {
    this.puerta = puerta;
  }

  public String getPoblacion() {
    return poblacion;
  }

  public void setPoblacion(String poblacion) {
    this.poblacion = poblacion;
  }
}
