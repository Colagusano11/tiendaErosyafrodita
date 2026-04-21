package com.example.tiendaonline.usuario.mcsv_usuario.repository;

import com.example.tiendaonline.usuario.mcsv_usuario.models.RevokedToken;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

@Repository
public interface RevokedTokenRepository extends JpaRepository<RevokedToken, String> {

    /** Check if a token JTI is revoked */
    boolean existsByJti(String jti);

    /** Clean up expired tokens (call periodically via scheduled task) */
    @Modifying
    @Transactional
    @Query("DELETE FROM RevokedToken r WHERE r.expiresAt < :now")
    int deleteExpiredTokens(LocalDateTime now);
}
