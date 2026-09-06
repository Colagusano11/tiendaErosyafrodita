-- ============================================================
-- V9: Tabla para persistir el token de Instagram (singleton)
-- COMMENT ON TABLE/COLUMN es sintaxis PostgreSQL — se omite en MySQL.
-- ============================================================

CREATE TABLE IF NOT EXISTS instagram_token (
    id              BIGINT          NOT NULL DEFAULT 1,
    access_token    VARCHAR(512)    NOT NULL,
    expires_at      TIMESTAMP       NULL,
    renovado_at     TIMESTAMP       NULL,
    intentos_fallo  INT             NOT NULL DEFAULT 0,
    CONSTRAINT pk_instagram_token PRIMARY KEY (id),
    CONSTRAINT chk_singleton CHECK (id = 1)
);
