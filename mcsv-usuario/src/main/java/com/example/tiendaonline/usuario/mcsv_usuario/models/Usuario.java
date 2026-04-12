package com.example.tiendaonline.usuario.mcsv_usuario.models;




import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.time.LocalDate;

import jakarta.persistence.*;


@Entity
@Table(name = "usuarios")
public class Usuario {

 @Id
 @GeneratedValue (strategy = GenerationType.IDENTITY)
  private Long id;
  
  
  private String name;
  private String apellidos;

  @Email(message = "Introduce email valido")
  @NotBlank(message = "Email obligatorio")
  @Column(unique = true)
  private String email;

  @NotBlank(message = "Password obligatiorio")
  @Size(min = 6, message = "La contraseña debe tener al menos 6 caracteres")
  private String password;

  private boolean admin;

  private String pais;
  private String provincia;
  private String codigoPostal;
  private String direccionPrimaria;
  private String direccionSecundaria;

  private String numero;
  private String escalera;
  private String piso;
  private String puerta;
  private String poblacion;

  private String phone;
  private String avatarUrl;
  private LocalDateTime createdAt;
  private LocalDate fechaNacimiento;

  private boolean verificado; 
  private LocalDateTime codigoExpira;
  private String codigoVerifacion;

  @Column(name= "verificacion_token")
  private String verifactionToken;


  public Usuario(){

  }



  public String getName() {
    return name;
  }


  public void setName(String name) {
    this.name = name;
  }

  public String getApellidos() {
    return apellidos;
  }

  public void setApellidos(String apellidos) {
    this.apellidos = apellidos;
  }

  public String getEmail() {
    return email;
  }


  public void setEmail(String email) {
    this.email = email;
  }



  public String getPassword() {
    return password;
  }


  public void setPassword(String password) {
    this.password = password;
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


  public boolean isAdmin() {
    return admin;
  }


  public void setAdmin(boolean admin) {
    this.admin = admin;
  }

  public String getVerifactionToken() {
    return verifactionToken;
  }

  public void setVerifactionToken(String verifactionToken) {
    this.verifactionToken = verifactionToken;
  }

  public Long getId() {
    return id;
  }

  public void setId(Long id) {
    this.id = id;
  }



  public boolean isVerificado() {
    return verificado;
  }



  public void setVerificado(boolean verificado) {
    this.verificado = verificado;
  }



  public LocalDateTime getCodigoExpira() {
    return codigoExpira;
  }



  public void setCodigoExpira(LocalDateTime codigoExpira) {
    this.codigoExpira = codigoExpira;
  }



  public String getCodigoVerifacion() {
    return codigoVerifacion;
  }



  public void setCodigoVerifacion(String codigoVerifacion) {
    this.codigoVerifacion = codigoVerifacion;
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

  public LocalDateTime getCreatedAt() {
    return createdAt;
  }

  public void setCreatedAt(LocalDateTime createdAt) {
    this.createdAt = createdAt;
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
