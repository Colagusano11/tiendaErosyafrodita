-- V11: campo para rotar automáticamente qué producto publicar en Instagram.
-- MySQL no soporta ADD COLUMN IF NOT EXISTS — se usa INFORMATION_SCHEMA (mismo
-- patrón que V10__seo_copy_fields.sql).

SELECT IF(COUNT(*) = 0, 'ALTER TABLE productos ADD COLUMN ultima_publicacion_instagram TIMESTAMP NULL', 'SELECT 1')
INTO @s FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='productos' AND column_name='ultima_publicacion_instagram';
PREPARE _s FROM @s; EXECUTE _s; DEALLOCATE PREPARE _s;

-- Acelera "el que lleve más tiempo sin publicarse" (ORDER BY ... ASC, NULL primero en MySQL)
SELECT IF(COUNT(*) = 0, 'CREATE INDEX idx_productos_ultima_pub_ig ON productos(ultima_publicacion_instagram)', 'SELECT 1')
INTO @s FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='productos' AND index_name='idx_productos_ultima_pub_ig';
PREPARE _s FROM @s; EXECUTE _s; DEALLOCATE PREPARE _s;
