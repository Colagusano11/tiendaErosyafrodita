package com.example.tiendaonline.usuario.mcsv_usuario.models;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "revoked_tokens")
public class RevokedToken {

    @Id
    private String jti;

    @Column(nullable = false)
    private String email;

    @Column(name = "revoked_at")
    private LocalDateTime revokedAt;

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt;

    public RevokedToken() {}

    public RevokedToken(String jti, String email, LocalDateTime expiresAt) {
        this.jti = jti;
        this.email = email;
        this.expiresAt = expiresAt;
        this.revokedAt = LocalDateTime.now();
    }

    public String getJti() { return jti; }
    public void setJti(String jti) { this.jti = jti; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public LocalDateTime getRevokedAt() { return revokedAt; }
    public void setRevokedAt(LocalDateTime revokedAt) { this.revokedAt = revokedAt; }
    public LocalDateTime getExpiresAt() { return expiresAt; }
    public void setExpiresAt(LocalDateTime expiresAt) { this.expiresAt = expiresAt; }
}
