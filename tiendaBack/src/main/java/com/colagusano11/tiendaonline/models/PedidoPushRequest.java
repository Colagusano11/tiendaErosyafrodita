package com.colagusano11.tiendaonline.models;

import java.util.Map;

public class PedidoPushRequest {
    
    private Map<Long, Long> manualSelections;
    
    // Datos mapeados de envío
    private String nombre;
    private String apellidos;
    private String calle;
    private String ciudad;
    private String codigoPostal;
    private String provincia;
    private String telefono;
    private String pais;

    public PedidoPushRequest() {}

    public Map<Long, Long> getManualSelections() {
        return manualSelections;
    }

    public void setManualSelections(Map<Long, Long> manualSelections) {
        this.manualSelections = manualSelections;
    }

    public String getNombre() {
        return nombre;
    }

    public void setNombre(String nombre) {
        this.nombre = nombre;
    }

    public String getApellidos() {
        return apellidos;
    }

    public void setApellidos(String apellidos) {
        this.apellidos = apellidos;
    }

    public String getCalle() {
        return calle;
    }

    public void setCalle(String calle) {
        this.calle = calle;
    }

    public String getCiudad() {
        return ciudad;
    }

    public void setCiudad(String ciudad) {
        this.ciudad = ciudad;
    }

    public String getCodigoPostal() {
        return codigoPostal;
    }

    public void setCodigoPostal(String codigoPostal) {
        this.codigoPostal = codigoPostal;
    }

    public String getProvincia() {
        return provincia;
    }

    public void setProvincia(String provincia) {
        this.provincia = provincia;
    }

    public String getTelefono() {
        return telefono;
    }

    public void setTelefono(String telefono) {
        this.telefono = telefono;
    }

    public String getPais() {
        return pais;
    }

    public void setPais(String pais) {
        this.pais = pais;
    }
}
