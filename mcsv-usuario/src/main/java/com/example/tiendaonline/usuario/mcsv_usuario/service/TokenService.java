package com.example.tiendaonline.usuario.mcsv_usuario.service;

import com.example.tiendaonline.usuario.mcsv_usuario.config.JwtService;
import com.example.tiendaonline.usuario.mcsv_usuario.models.RevokedToken;
import com.example.tiendaonline.usuario.mcsv_usuario.repository.RevokedTokenRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Date;

@Service
public class TokenService {

    private final RevokedTokenRepository revokedTokenRepository;
    private final JwtService jwtService;

    public TokenService(RevokedTokenRepository revokedTokenRepository, JwtService jwtService) {
        this.revokedTokenRepository = revokedTokenRepository;
        this.jwtService = jwtService;
    }

    /** Revoca un token (logout) */
    @Transactional
    public void revokeToken(String token) {
        try {
            String jti = jwtService.extraerJti(token);
            Date expDate = jwtService.extraerExpiracion(token);
            String email = jwtService.extraerEmail(token);

            if (jti != null && !revokedTokenRepository.existsById(jti)) {
                RevokedToken revoked = new RevokedToken(
                    jti,
                    email,
                    LocalDateTime.ofInstant(expDate.toInstant(), java.time.ZoneId.systemDefault())
                );
                revokedTokenRepository.save(revoked);
            }
        } catch (Exception e) {
            // Token inválido — no se puede revocar
        }
    }

    /** Check if a token is revoked */
    public boolean isTokenRevoked(String token) {
        try {
            String jti = jwtService.extraerJti(token);
            if (jti == null) return false;
            return revokedTokenRepository.existsByJti(jti);
        } catch (Exception e) {
            return true; // Treat invalid tokens as revoked for safety
        }
    }

    /** Cleanup expired entries — runs daily at 3am */
    @Scheduled(cron = "0 0 3 * * *")
    @Transactional
    public void cleanupExpiredTokens() {
        int deleted = revokedTokenRepository.deleteExpiredTokens(LocalDateTime.now());
        if (deleted > 0) {
            System.out.println("[TokenService] Cleaned up " + deleted + " expired revoked tokens");
        }
    }
}
