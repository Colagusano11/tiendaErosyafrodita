package com.colagusano11.tiendaonline.models;

public class PedidoRequest {


        private String nombre;
        private String apellidos;
        private String calle;
        private String ciudad;
        private String codigoPostal;
        private String provincia;
        private String telefono;
        private String pais;
        private Double descuento; // 0..1 — ej. 0.10 = -10% lanzamiento
        private String idempotencyKey; // Para evitar duplicados en checkout

        public PedidoRequest() {
        }

        public Double getDescuento() {
            return descuento;
        }

        public void setDescuento(Double descuento) {
            this.descuento = descuento;
        }

        private String email;
        private java.util.List<ItemRequest> items;

        public static class ItemRequest {
            private Long productoId;
            private Integer cantidad;
            public Long getProductoId() { return productoId; }
            public void setProductoId(Long productoId) { this.productoId = productoId; }
            public Integer getCantidad() { return cantidad; }
            public void setCantidad(Integer cantidad) { this.cantidad = cantidad; }
        }

        public java.util.List<ItemRequest> getItems() { return items; }
        public void setItems(java.util.List<ItemRequest> items) { this.items = items; }

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }

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




