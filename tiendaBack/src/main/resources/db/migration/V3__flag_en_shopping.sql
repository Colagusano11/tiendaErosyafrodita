-- ============================================================
-- V3 — Flag en_shopping
-- Permite controlar desde el panel admin qué productos
-- se publican en Google Shopping e Idealo sin tocar `activo`.
-- ============================================================

-- 1. Añadir columna solo si no existe
SELECT IF(COUNT(*) = 0, 'ALTER TABLE productos ADD COLUMN en_shopping BOOLEAN NOT NULL DEFAULT TRUE', 'SELECT 1')
INTO @s FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='productos' AND column_name='en_shopping';
PREPARE _s FROM @s; EXECUTE _s; DEALLOCATE PREPARE _s;

-- 2. UPDATE condicional: solo si la columna precio_pvp existe en la tabla
SELECT IF(
  (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='productos' AND column_name='precio_pvp') > 0,
  'UPDATE productos SET en_shopping = FALSE WHERE activo = FALSE OR precio_pvp IS NULL OR precio_pvp <= 0',
  'SELECT 1'
) INTO @s;
PREPARE _s FROM @s; EXECUTE _s; DEALLOCATE PREPARE _s;

-- 3. Índice (MySQL no soporta índices parciales con WHERE — se omite la cláusula)
SELECT IF(COUNT(*) = 0, 'CREATE INDEX idx_productos_shopping ON productos(en_shopping, activo)', 'SELECT 1')
INTO @s FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='productos' AND index_name='idx_productos_shopping';
PREPARE _s FROM @s; EXECUTE _s; DEALLOCATE PREPARE _s;
