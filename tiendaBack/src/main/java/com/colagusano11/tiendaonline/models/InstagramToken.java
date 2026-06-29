package com.colagusano11.tiendaonline.models;

import jakarta.persistence.*;
import java.time.LocalDateTime;

/**
 * Persiste el token de larga duración de Meta Graph API en BD.
 * Solo existe una fila (id = 1). Se actualiza cada ~45 días por el cron.
 *
 * Campos:
 *   accessToken   — token actual (60 días de validez, renovado a los 45)
 *   expiresAt     — fecha de caducidad calculada en la última renovación
 *   renovadoAt    — timestamp de la última renovación exitosa
 *   intentosFallo — contador de fallos consecutivos (reset en éxito)
 */
@Entity
@Table(name = "instagram_token")
public class InstagramToken {

    @Id
    private Long id = 1L;   // singleton: siempre id=1

    @Column(name = "access_token", nullable = false, length = 512)
    private String accessToken;

    @Column(name = "expires_at")
    private LocalDateTime expiresAt;

    @Column(name = "renovado_at")
    private LocalDateTime renovadoAt;

    @Column(name = "intentos_fallo", nullable = false)
    private int intentosFallo = 0;

    public InstagramToken() {}

    // ─── Getters & Setters ────────────────────────────────────────────────────

    public Long getId() { return id; }

    public String getAccessToken() { return accessToken; }
    public void setAccessToken(String accessToken) { this.accessToken = accessToken; }

    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }

    public LocalDateTime getRenovadoAt() { return renovadoAt; }
    public void setRenovadoAt(LocalDateTime renovadoAt) { this.renovadoAt = renovadoAt; }

    public int getIntentosFallo() { return intentosFallo; }
    public void setIntentosFallo(int intentosFallo) { this.intentosFallo = intentosFallo; }
}
