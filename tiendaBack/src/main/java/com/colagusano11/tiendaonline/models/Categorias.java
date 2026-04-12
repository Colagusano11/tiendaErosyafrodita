package com.colagusano11.tiendaonline.models;

import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.persistence.Id;

@Entity
@Table(name="categorias")
public class Categorias {
    @Id
    @jakarta.persistence.Column(name = "idcategorias")
  private String iDCategorias;
  private String categoria;


  public Categorias() {
  }


  public String getIdCategorias() {
      return iDCategorias;
  }
  public void setIdCategorias(String iDCategorias) {
      this.iDCategorias = iDCategorias;
  }
  public String getCategoria() {
      return categoria;
  }
  public void setCategoria(String categoria) {
      this.categoria = categoria;
  }   


}
