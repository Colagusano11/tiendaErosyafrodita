package com.colagusano11.tiendaonline.models;



public class CarritoRequest {
    private Long idProducto;
    private int cantidad;


    public CarritoRequest() {
    }

    public Long getIdProducto() {
        return idProducto;
    }

    public void setIdProducto(Long idProducto) {
        this.idProducto = idProducto;
    }

    public int getCantidad() {
        return cantidad;
    }

    public void setCantidad(int cantidad) {
        this.cantidad = cantidad;
    }
}
