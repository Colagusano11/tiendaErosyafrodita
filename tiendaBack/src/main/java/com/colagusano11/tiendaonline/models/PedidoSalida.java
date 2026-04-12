package com.colagusano11.tiendaonline.models;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class PedidoSalida {

        private Long idPedido;
        private LocalDateTime fechaCreacion;
        private BigDecimal total;
        private PedidoEstado estado;
        private String nombre;
        private String apellidos;
        private String calle;
        private String ciudad;
        private String codigoPostal;
        private String provincia;
        private String telefono;
        private String pais;
        private List<PedidoProductoSalida> productos;
        private String paymentId;


        public PedidoSalida(){}


    public Long getIdPedido() {
        return idPedido;
    }

    public void setIdPedido(Long idPedido) {
        this.idPedido = idPedido;
    }

    public LocalDateTime getFechaCreacion() {
        return fechaCreacion;
    }

    public void setFechaCreacion(LocalDateTime fechaCreacion) {
        this.fechaCreacion = fechaCreacion;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
    }

    public PedidoEstado getEstado() {
        return estado;
    }

    public void setEstado(PedidoEstado estado) {
        this.estado = estado;
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

    public List<PedidoProductoSalida> getProductos() {
        return productos;
    }

    private String numSeguimiento;
    private String urlSeguimiento;

    public void setProductos(List<PedidoProductoSalida> productos) {
        this.productos = productos;
    }

    public String getNumSeguimiento() {
        return numSeguimiento;
    }

    public void setNumSeguimiento(String numSeguimiento) {
        this.numSeguimiento = numSeguimiento;
    }

    public String getUrlSeguimiento() {
        return urlSeguimiento;
    }

    public void setUrlSeguimiento(String urlSeguimiento) {
        this.urlSeguimiento = urlSeguimiento;
    }

    private String pedidoProveedorId;
    private String estadoProveedor;

    public String getPedidoProveedorId() {
        return pedidoProveedorId;
    }

    public void setPedidoProveedorId(String pedidoProveedorId) {
        this.pedidoProveedorId = pedidoProveedorId;
    }

    public String getEstadoProveedor() {
        return estadoProveedor;
    }

    public void setEstadoProveedor(String estadoProveedor) {
        this.estadoProveedor = estadoProveedor;
    }

    public String getPaymentId() {
        return paymentId;
    }

    public void setPaymentId(String paymentId) {
        this.paymentId = paymentId;
    }
}



