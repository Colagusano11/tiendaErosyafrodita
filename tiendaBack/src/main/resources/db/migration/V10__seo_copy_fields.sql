-- V10: Añade campos de copy IA al modelo de producto
-- MySQL no soporta ADD COLUMN IF NOT EXISTS — se usa INFORMATION_SCHEMA.
-- MySQL no soporta índices parciales (WHERE en CREATE INDEX) — se omite.

SELECT IF(COUNT(*) = 0, 'ALTER TABLE productos ADD COLUMN titulo_seo VARCHAR(100)', 'SELECT 1')
INTO @s FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='productos' AND column_name='titulo_seo';
PREPARE _s FROM @s; EXECUTE _s; DEALLOCATE PREPARE _s;

SELECT IF(COUNT(*) = 0, 'ALTER TABLE productos ADD COLUMN descripcion_seo VARCHAR(320)', 'SELECT 1')
INTO @s FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='productos' AND column_name='descripcion_seo';
PREPARE _s FROM @s; EXECUTE _s; DEALLOCATE PREPARE _s;

SELECT IF(COUNT(*) = 0, 'ALTER TABLE productos ADD COLUMN copy_instagram TEXT', 'SELECT 1')
INTO @s FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='productos' AND column_name='copy_instagram';
PREPARE _s FROM @s; EXECUTE _s; DEALLOCATE PREPARE _s;

SELECT IF(COUNT(*) = 0, 'ALTER TABLE productos ADD COLUMN copy_generado_en TIMESTAMP NULL', 'SELECT 1')
INTO @s FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='productos' AND column_name='copy_generado_en';
PREPARE _s FROM @s; EXECUTE _s; DEALLOCATE PREPARE _s;

SELECT IF(COUNT(*) = 0, 'CREATE INDEX idx_productos_sin_copy ON productos(copy_generado_en)', 'SELECT 1')
INTO @s FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='productos' AND index_name='idx_productos_sin_copy';
PREPARE _s FROM @s; EXECUTE _s; DEALLOCATE PREPARE _s;
