package com.colagusano11.tiendaonline.models;

import java.math.BigDecimal;
import java.util.List;

public class CarritoSalida {

    List<CarritoSalidaItem> items;
    private BigDecimal total;


    public CarritoSalida(){}

    public List<CarritoSalidaItem> getItems() {
        return items;
    }

    public void setItems(List<CarritoSalidaItem> items) {
        this.items = items;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
    }
}
