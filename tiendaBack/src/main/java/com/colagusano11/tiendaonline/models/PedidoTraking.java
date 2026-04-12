package com.colagusano11.tiendaonline.models;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;



@Entity
@Table(name = "pedido_tracking")
public class PedidoTraking {
  
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Referencias básicas
    private Long pedidoId;
    private Long usuarioId;
    

    // Datos del pedido
    private LocalDateTime fechaPedido;
    private PedidoEstado estado;   
    private String nombreProducto;         // "PAGADO", "ENVIADO", etc.
    private String pais;                    // ES, FR, etc.
    private String sku;
    private String marca;

    // Importes
    private BigDecimal importeSinIva;
    private BigDecimal importeConIva;
    private BigDecimal envioSinIva;
    private BigDecimal envioConIva;
    private BigDecimal impuestosTotales;

    // Datos de pago
    private String pasarelaPago;           // "REVOLUT"
    private String paymentId;              // id en la pasarela
    private LocalDateTime fechaPago;

    // Momento en el que se creó este registro de tracking
    private LocalDateTime fechaRegistro;


    public Long getId() {
        return id;
    }
    public void setId(Long id) {
        this.id = id;
    }
    public Long getPedidoId() {
        return pedidoId;  
    }
    public void setPedidoId(Long pedidoId) {
        this.pedidoId = pedidoId;
    }
    public Long getUsuarioId() {
        return usuarioId; 
    }
    public void setUsuarioId(Long usuarioId) {
        this.usuarioId = usuarioId;
    }
    public LocalDateTime getFechaPedido() {
        return fechaPedido;
    } 
    public void setFechaPedido(LocalDateTime fechaPedido) {
        this.fechaPedido = fechaPedido;
    }
   
     public PedidoEstado getEstadoPedido() {
        return estado;
    } 
    public void setPedidoEstado(PedidoEstado estado) {
        this.estado = estado;
    }
    public String getPais() {
        return pais;
    }
    public void setPais(String pais) {
        this.pais = pais;
    }
    public String getSku() {
        return sku;
    } 
    public void setSku(String sku) {
        this.sku = sku;
    }
    public String getMarca() {
        return marca;
    } 
    public void setMarca(String marca) {
        this.marca = marca;
    }
    public BigDecimal getImporteSinIva() {
        return importeSinIva;
    }
    public void setImporteSinIva(BigDecimal importeSinIva) {
        this.importeSinIva = importeSinIva;
    }
    public BigDecimal getImporteConIva() {
        return importeConIva;   
    }
    public void setImporteConIva(BigDecimal importeConIva) {
        this.importeConIva = importeConIva;
    }
    public BigDecimal getEnvioSinIva() {
        return envioSinIva;
    }
    public void setEnvioSinIva(BigDecimal envioSinIva) {
        this.envioSinIva = envioSinIva;
    }
    public BigDecimal getEnvioConIva() {
        return envioConIva;
    }
    public void setEnvioConIva(BigDecimal envioConIva) {
        this.envioConIva = envioConIva;
    }
    public BigDecimal getImpuestosTotales() {
        return impuestosTotales;
    } 
    public void setImpuestosTotales(BigDecimal impuestosTotales) {
        this.impuestosTotales = impuestosTotales;
    }
    public String getPasarelaPago() {
        return pasarelaPago;
    }
    public void setPasarelaPago(String pasarelaPago) {
        this.pasarelaPago = pasarelaPago;
    }
    public String getPaymentId() {
        return paymentId;
    }
    public void setPaymentId(String paymentId) {
        this.paymentId = paymentId;
    }
    public LocalDateTime getFechaPago() {
        return fechaPago;
    }
    public void setFechaPago(LocalDateTime fechaPago) {
        this.fechaPago = fechaPago;
    }
    public LocalDateTime getFechaRegistro() {
        return fechaRegistro;
    }
    public void setFechaRegistro(LocalDateTime fechaRegistro) {
        this.fechaRegistro = fechaRegistro;
    }
    public String getNombreProducto() {
        return nombreProducto;
    }
    public void setNombreProducto(String nombreProducto) {
        this.nombreProducto = nombreProducto;   
    }
    

  



}
