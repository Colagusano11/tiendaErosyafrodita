-- ============================================================
-- V2__indices_rendimiento.sql
-- Crea índices solo si: (1) el índice no existe ya y
-- (2) la columna que indexa existe en la tabla.
-- Seguro ante tablas pre-existentes con schema distinto.
-- ============================================================

-- producto(ean)
SELECT IF((SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='producto' AND index_name='idx_producto_ean')=0 AND (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='producto' AND column_name='ean')>0,'CREATE INDEX idx_producto_ean ON producto(ean)','SELECT 1') INTO @s;
PREPARE _s FROM @s; EXECUTE _s; DEALLOCATE PREPARE _s;

-- producto(sku)
SELECT IF((SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='producto' AND index_name='idx_producto_sku')=0 AND (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='producto' AND column_name='sku')>0,'CREATE INDEX idx_producto_sku ON producto(sku)','SELECT 1') INTO @s;
PREPARE _s FROM @s; EXECUTE _s; DEALLOCATE PREPARE _s;

-- producto(activo)
SELECT IF((SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='producto' AND index_name='idx_producto_activo')=0 AND (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='producto' AND column_name='activo')>0,'CREATE INDEX idx_producto_activo ON producto(activo)','SELECT 1') INTO @s;
PREPARE _s FROM @s; EXECUTE _s; DEALLOCATE PREPARE _s;

-- producto(categoria_id)
SELECT IF((SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='producto' AND index_name='idx_producto_categoria')=0 AND (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='producto' AND column_name='categoria_id')>0,'CREATE INDEX idx_producto_categoria ON producto(categoria_id)','SELECT 1') INTO @s;
PREPARE _s FROM @s; EXECUTE _s; DEALLOCATE PREPARE _s;

-- producto(destacado)
SELECT IF((SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='producto' AND index_name='idx_producto_destacado')=0 AND (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='producto' AND column_name='destacado')>0,'CREATE INDEX idx_producto_destacado ON producto(destacado)','SELECT 1') INTO @s;
PREPARE _s FROM @s; EXECUTE _s; DEALLOCATE PREPARE _s;

-- producto_venta(ean)
SELECT IF((SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='producto_venta' AND index_name='idx_pventa_ean')=0 AND (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='producto_venta' AND column_name='ean')>0,'CREATE INDEX idx_pventa_ean ON producto_venta(ean)','SELECT 1') INTO @s;
PREPARE _s FROM @s; EXECUTE _s; DEALLOCATE PREPARE _s;

-- producto_venta(producto_id)
SELECT IF((SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='producto_venta' AND index_name='idx_pventa_producto')=0 AND (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='producto_venta' AND column_name='producto_id')>0,'CREATE INDEX idx_pventa_producto ON producto_venta(producto_id)','SELECT 1') INTO @s;
PREPARE _s FROM @s; EXECUTE _s; DEALLOCATE PREPARE _s;

-- pedido(usuario_id)
SELECT IF((SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='pedido' AND index_name='idx_pedido_usuario')=0 AND (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='pedido' AND column_name='usuario_id')>0,'CREATE INDEX idx_pedido_usuario ON pedido(usuario_id)','SELECT 1') INTO @s;
PREPARE _s FROM @s; EXECUTE _s; DEALLOCATE PREPARE _s;

-- pedido(estado)
SELECT IF((SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='pedido' AND index_name='idx_pedido_estado')=0 AND (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='pedido' AND column_name='estado')>0,'CREATE INDEX idx_pedido_estado ON pedido(estado)','SELECT 1') INTO @s;
PREPARE _s FROM @s; EXECUTE _s; DEALLOCATE PREPARE _s;

-- pedido(email_cliente)
SELECT IF((SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='pedido' AND index_name='idx_pedido_email')=0 AND (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='pedido' AND column_name='email_cliente')>0,'CREATE INDEX idx_pedido_email ON pedido(email_cliente)','SELECT 1') INTO @s;
PREPARE _s FROM @s; EXECUTE _s; DEALLOCATE PREPARE _s;

-- pedido(created_at)
SELECT IF((SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='pedido' AND index_name='idx_pedido_fecha')=0 AND (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='pedido' AND column_name='created_at')>0,'CREATE INDEX idx_pedido_fecha ON pedido(created_at)','SELECT 1') INTO @s;
PREPARE _s FROM @s; EXECUTE _s; DEALLOCATE PREPARE _s;

-- pedido(referencia_pago)
SELECT IF((SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='pedido' AND index_name='idx_pedido_referencia')=0 AND (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='pedido' AND column_name='referencia_pago')>0,'CREATE INDEX idx_pedido_referencia ON pedido(referencia_pago)','SELECT 1') INTO @s;
PREPARE _s FROM @s; EXECUTE _s; DEALLOCATE PREPARE _s;

-- carrito(usuario_id)
SELECT IF((SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='carrito' AND index_name='idx_carrito_usuario')=0 AND (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='carrito' AND column_name='usuario_id')>0,'CREATE INDEX idx_carrito_usuario ON carrito(usuario_id)','SELECT 1') INTO @s;
PREPARE _s FROM @s; EXECUTE _s; DEALLOCATE PREPARE _s;

-- resena(producto_id)
SELECT IF((SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='resena' AND index_name='idx_resena_producto')=0 AND (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='resena' AND column_name='producto_id')>0,'CREATE INDEX idx_resena_producto ON resena(producto_id)','SELECT 1') INTO @s;
PREPARE _s FROM @s; EXECUTE _s; DEALLOCATE PREPARE _s;

-- aviso_stock(producto_id)
SELECT IF((SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='aviso_stock' AND index_name='idx_aviso_producto')=0 AND (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='aviso_stock' AND column_name='producto_id')>0,'CREATE INDEX idx_aviso_producto ON aviso_stock(producto_id)','SELECT 1') INTO @s;
PREPARE _s FROM @s; EXECUTE _s; DEALLOCATE PREPARE _s;

-- aviso_stock(notificado)
SELECT IF((SELECT COUNT(*) FROM information_schema.statistics WHERE table_schema=DATABASE() AND table_name='aviso_stock' AND index_name='idx_aviso_notificado')=0 AND (SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='aviso_stock' AND column_name='notificado')>0,'CREATE INDEX idx_aviso_notificado ON aviso_stock(notificado)','SELECT 1') INTO @s;
PREPARE _s FROM @s; EXECUTE _s; DEALLOCATE PREPARE _s;
