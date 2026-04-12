package com.colagusano11.tiendaonline.exception;

public class StockInsuficienteException extends RuntimeException{

    public StockInsuficienteException(String mensaje){
        super(mensaje);
    }
}
