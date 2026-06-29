-- ============================================================
-- V3 — Flag en_shopping
-- Permite controlar desde el panel admin qué productos
-- se publican en Google Shopping e Idealo sin tocar `activo`.
-- ============================================================

-- 1. Añadir columna con TRUE por defecto para no romper feeds existentes
ALTER TABLE productos
    ADD COLUMN en_shopping BOOLEAN NOT NULL DEFAULT TRUE;

-- 2. Activar solo los productos que ya están activos y tienen precio PVP
--    Los que estaban inactivos o sin precio se dejan en FALSE.
UPDATE productos
   SET en_shopping = FALSE
 WHERE activo = FALSE
    OR precio_pvp IS NULL
    OR precio_pvp <= 0;

-- 3. Índice para que el feed no haga full-scan en catálogos grandes
CREATE INDEX idx_productos_shopping
    ON productos (en_shopping, activo)
    WHERE en_shopping = TRUE AND activo = TRUE;
