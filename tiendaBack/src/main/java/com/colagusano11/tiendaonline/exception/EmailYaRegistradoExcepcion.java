package com.colagusano11.tiendaonline.exception;

public class EmailYaRegistradoExcepcion extends RuntimeException {
    public EmailYaRegistradoExcepcion(String email) {
        super("El email "+ email +" ya esta regiistrado");
    }
}
