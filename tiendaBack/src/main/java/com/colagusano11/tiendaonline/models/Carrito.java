package com.colagusano11.tiendaonline.models;


import jakarta.persistence.*;

import java.util.ArrayList;
import java.util.List;

import com.colagusano11.tiendaonline.client.dto.UsuarioRegistroDto;

@Entity
@Table(name="carrito")
public class Carrito {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;


    @Column(name = "usuario_id", nullable = false)
    private Long usuarioId;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    private List<CarritoItem> items = new ArrayList<>();


    public Carrito(Long usuarioId){
        this.usuarioId = usuarioId;
    }

    public Carrito() { }

 

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public List<CarritoItem> getItems() {
        return items;
    }

    public void setItems(List<CarritoItem> items) {
        this.items = items;
    }



    public Long getUsuarioId() {
        return usuarioId;
    }



    public void setUsuarioId(Long usuarioId) {
        this.usuarioId = usuarioId;
    }
    
}
