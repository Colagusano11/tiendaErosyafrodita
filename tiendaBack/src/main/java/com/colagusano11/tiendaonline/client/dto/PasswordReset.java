package com.colagusano11.tiendaonline.client.dto;

public class PasswordReset {

    private String email;
    private String codigo;
    private String nuevaPass;


    
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
    public String getNuevaPass() {
      return nuevaPass;
    }
    public void setNuevaPass(String nuevaPass) {
      this.nuevaPass = nuevaPass;
    }



    
 
}
