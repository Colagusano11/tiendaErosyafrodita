package com.colagusano11.tiendaonline.models;

import jakarta.persistence.*;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "pedido")
public class Pedido {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // id del usuario en el microservicio de usuarios
    @Column(name = "usuario_id", nullable = true)
    private Long usuarioId;

    @OneToMany(mappedBy = "pedido", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<PedidoProducto> lineas;

    @Enumerated(EnumType.STRING)
    private PedidoEstado estado = PedidoEstado.PENDIENTE;

    private LocalDateTime fecha;

    private LocalDateTime paymentDate;

    private String paymentId;
    private String paymentGateway;

    // Campos de envío desglosados
    private String nombre;
    private String apellidos;
    private String calle;
    private String ciudad;
    private String codigoPostal;
    private String provincia;
    private String telefono;
    private String pais;
    private String email;

    private BigDecimal total;

    private Distribuidor distribuidor;

    @Column(name = "num_seguimiento")
    private String numSeguimiento;

    @Column(name = "url_seguimiento")
    private String urlSeguimiento;

    @Column(name = "pedido_proveedor_id")
    private String pedidoProveedorId;

    @Column(name = "estado_proveedor")
    private String estadoProveedor;

    public Pedido() {
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    // === usuarioId en vez de UsuarioRegistroDto ===
    public Long getUsuarioId() {
        return usuarioId;
    }

    public void setUsuarioId(Long usuarioId) {
        this.usuarioId = usuarioId;
    }

    public PedidoEstado getEstado() {
        return estado;
    }

    public void setEstado(PedidoEstado estado) {
        this.estado = estado;
    }

    public List<PedidoProducto> getLineas() {
        return lineas;
    }

    public void setLineas(List<PedidoProducto> lineas) {
        this.lineas = lineas;
    }

    public LocalDateTime getFecha() {
        return fecha;
    }

    public void setFecha(LocalDateTime fecha) {
        this.fecha = fecha;
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

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public BigDecimal getTotal() {
        return total;
    }

    public void setTotal(BigDecimal total) {
        this.total = total;
    }

    public LocalDateTime getPaymentDate() {
        return paymentDate;
    }

    public void setPaymentDate(LocalDateTime paymentDate) {
        this.paymentDate = paymentDate;
    }

    public String getPaymentId() {
        return paymentId;
    }

    public void setPaymentId(String paymentId) {
        this.paymentId = paymentId;
    }

    public String getPaymentGateway() {
        return paymentGateway;
    }

    public void setPaymentGateway(String paymentGateway) {
        this.paymentGateway = paymentGateway;
    }

    public Distribuidor getDistribuidor() {
        return distribuidor;
    }

    public void setDistribuidor(Distribuidor distribuidor) {
        this.distribuidor = distribuidor;
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
}
