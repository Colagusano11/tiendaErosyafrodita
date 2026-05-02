package com.colagusano11.tiendaonline.models;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDateTime;

@Entity
@Table(name = "cupones")
public class Cupon {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotBlank(message = "El nombre de la campaña es obligatorio")
    private String nombre;

    @NotBlank(message = "El código del cupón es obligatorio")
    @Column(unique = true)
    private String codigo;

    @NotNull(message = "el porcentaje de descuento es obligatorio")
    @Min(0)
    @Max(100)
    private Integer porcentajeDescuento;

    @NotNull(message = "La fecha de expiración es obligatoria")
    private LocalDateTime fechaExpiracion;

    private boolean activo = true;

    public Cupon() {}

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getCodigo() { return codigo; }
    public void setCodigo(String codigo) { this.codigo = codigo.toUpperCase().trim(); }

    public Integer getPorcentajeDescuento() { return porcentajeDescuento; }
    public void setPorcentajeDescuento(Integer porcentajeDescuento) { this.porcentajeDescuento = porcentajeDescuento; }

    public LocalDateTime getFechaExpiracion() { return fechaExpiracion; }
    public void setFechaExpiracion(LocalDateTime fechaExpiracion) { this.fechaExpiracion = fechaExpiracion; }

    public boolean isActivo() { return activo; }
    public void setActivo(boolean activo) { this.activo = activo; }

    public boolean isValido() {
        return activo && fechaExpiracion.isAfter(LocalDateTime.now());
    }
}
