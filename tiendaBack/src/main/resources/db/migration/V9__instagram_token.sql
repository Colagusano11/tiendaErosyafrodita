-- ============================================================
-- V9: Tabla para persistir el token de Instagram (singleton)
-- ============================================================

CREATE TABLE IF NOT EXISTS instagram_token (
    id              BIGINT          NOT NULL DEFAULT 1,
    access_token    VARCHAR(512)    NOT NULL,
    expires_at      TIMESTAMP,
    renovado_at     TIMESTAMP,
    intentos_fallo  INT             NOT NULL DEFAULT 0,
    CONSTRAINT pk_instagram_token PRIMARY KEY (id),
    CONSTRAINT chk_singleton CHECK (id = 1)
);

COMMENT ON TABLE  instagram_token                IS 'Token de larga duración de Meta Graph API. Solo existe 1 fila (id=1).';
COMMENT ON COLUMN instagram_token.access_token   IS 'Token activo. Renovado automáticamente cada ~45 días.';
COMMENT ON COLUMN instagram_token.expires_at     IS 'Fecha calculada de caducidad del token actual.';
COMMENT ON COLUMN instagram_token.renovado_at    IS 'Timestamp de la última renovación exitosa.';
COMMENT ON COLUMN instagram_token.intentos_fallo IS 'Contador de fallos consecutivos. Se resetea a 0 en cada éxito.';
