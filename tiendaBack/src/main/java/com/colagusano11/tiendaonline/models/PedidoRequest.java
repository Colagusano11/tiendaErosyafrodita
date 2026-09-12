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

        /**
         * Codigo de cupon introducido por el cliente (opcional). El porcentaje de
         * descuento NUNCA se acepta directamente del cliente: se recalcula en el
         * servidor a partir de este codigo (ver PedidoServicieImpl), consultando
         * el cupon real en BD y comprobando que esta activo y no ha expirado.
         * Antes se aceptaba un campo "descuento" (0..1) tal cual desde el
         * frontend, sin validar contra ningun cupon — cualquiera podia mandar
         * descuento=0.99 y pagar el 1% de cualquier pedido.
         */
        private String cuponCodigo;

        public PedidoRequest() {
        }

        public String getCuponCodigo() {
            return cuponCodigo;
        }

        public void setCuponCodigo(String cuponCodigo) {
            this.cuponCodigo = cuponCodigo;
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




