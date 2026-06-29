-- ============================================================
-- V2__indices_rendimiento.sql
-- Índices críticos para rendimiento en búsquedas de productos,
-- consultas de pedidos y lookups frecuentes.
-- ============================================================

-- Productos: búsqueda por EAN (sincronización con Amazon/Idealo)
CREATE INDEX IF NOT EXISTS idx_producto_ean        ON producto(ean);
CREATE INDEX IF NOT EXISTS idx_producto_sku        ON producto(sku);
CREATE INDEX IF NOT EXISTS idx_producto_activo     ON producto(activo);
CREATE INDEX IF NOT EXISTS idx_producto_categoria  ON producto(categoria_id);
CREATE INDEX IF NOT EXISTS idx_producto_destacado  ON producto(destacado);

-- Variantes de producto: búsqueda por EAN y producto padre
CREATE INDEX IF NOT EXISTS idx_pventa_ean          ON producto_venta(ean);
CREATE INDEX IF NOT EXISTS idx_pventa_producto     ON producto_venta(producto_id);

-- Pedidos: búsqueda por usuario y estado (panel admin)
CREATE INDEX IF NOT EXISTS idx_pedido_usuario      ON pedido(usuario_id);
CREATE INDEX IF NOT EXISTS idx_pedido_estado       ON pedido(estado);
CREATE INDEX IF NOT EXISTS idx_pedido_email        ON pedido(email_cliente);
CREATE INDEX IF NOT EXISTS idx_pedido_fecha        ON pedido(created_at);
CREATE INDEX IF NOT EXISTS idx_pedido_referencia   ON pedido(referencia_pago);

-- Carrito: acceso por usuario
CREATE INDEX IF NOT EXISTS idx_carrito_usuario     ON carrito(usuario_id);

-- Reseñas: búsqueda por producto
CREATE INDEX IF NOT EXISTS idx_resena_producto     ON resena(producto_id);

-- Avisos de stock: búsqueda por producto y estado
CREATE INDEX IF NOT EXISTS idx_aviso_producto      ON aviso_stock(producto_id);
CREATE INDEX IF NOT EXISTS idx_aviso_notificado    ON aviso_stock(notificado);
