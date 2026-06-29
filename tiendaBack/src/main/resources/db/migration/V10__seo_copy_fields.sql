-- V10: Añade campos de copy IA al modelo de producto
-- titulo_seo       → <title> optimizado para Google (max 60 chars)
-- descripcion_seo  → meta description + ficha de producto (max 160 chars)
-- copy_instagram   → texto del post con emojis y hashtags
-- copy_generado_en → timestamp de última generación (para saber si está obsoleto)

ALTER TABLE productos
    ADD COLUMN IF NOT EXISTS titulo_seo       VARCHAR(100),
    ADD COLUMN IF NOT EXISTS descripcion_seo  VARCHAR(320),
    ADD COLUMN IF NOT EXISTS copy_instagram   TEXT,
    ADD COLUMN IF NOT EXISTS copy_generado_en TIMESTAMP;

-- Índice para encontrar rápido los productos que aún no tienen copy generado
CREATE INDEX IF NOT EXISTS idx_productos_sin_copy
    ON productos (copy_generado_en)
    WHERE copy_generado_en IS NULL;
