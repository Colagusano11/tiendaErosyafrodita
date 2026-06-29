-- ============================================================
-- V1__schema_inicial.sql
-- Migración base: crea todas las tablas del dominio tienda_db.
-- Flyway ejecuta este script UNA SOLA VEZ en la primera
-- ejecución. En bases de datos existentes, baseline-on-migrate
-- marcará V1 como ya aplicada sin ejecutarla.
-- ============================================================

-- Tabla de categorías
CREATE TABLE IF NOT EXISTS categorias (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre     VARCHAR(255) NOT NULL,
    padre_id   BIGINT,
    CONSTRAINT fk_categoria_padre FOREIGN KEY (padre_id) REFERENCES categorias(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla de distribuidores
CREATE TABLE IF NOT EXISTS distribuidor (
    id         BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre     VARCHAR(255),
    activo     TINYINT(1) DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla principal de productos
CREATE TABLE IF NOT EXISTS producto (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    nombre              VARCHAR(500) NOT NULL,
    descripcion         TEXT,
    precio              DECIMAL(10,2),
    precio_coste        DECIMAL(10,2),
    stock               INT DEFAULT 0,
    ean                 VARCHAR(50),
    sku                 VARCHAR(100),
    imagen_url          TEXT,
    activo              TINYINT(1) DEFAULT 1,
    destacado           TINYINT(1) DEFAULT 0,
    categoria_id        BIGINT,
    distribuidor_id     BIGINT,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_producto_categoria    FOREIGN KEY (categoria_id)    REFERENCES categorias(id),
    CONSTRAINT fk_producto_distribuidor FOREIGN KEY (distribuidor_id) REFERENCES distribuidor(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Variantes de venta de un producto (tallas/presentaciones)
CREATE TABLE IF NOT EXISTS producto_venta (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    producto_id     BIGINT NOT NULL,
    ml              VARCHAR(50),
    precio          DECIMAL(10,2),
    precio_coste    DECIMAL(10,2),
    stock           INT DEFAULT 0,
    ean             VARCHAR(50),
    sku             VARCHAR(100),
    activo          TINYINT(1) DEFAULT 1,
    CONSTRAINT fk_pventa_producto FOREIGN KEY (producto_id) REFERENCES producto(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Configuración global de la tienda
CREATE TABLE IF NOT EXISTS configuracion (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    clave           VARCHAR(255) NOT NULL UNIQUE,
    valor           TEXT,
    descripcion     VARCHAR(500)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cupones de descuento
CREATE TABLE IF NOT EXISTS cupon (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    codigo          VARCHAR(100) NOT NULL UNIQUE,
    descuento       DECIMAL(5,2),
    tipo            VARCHAR(50),  -- PORCENTAJE | IMPORTE_FIJO
    activo          TINYINT(1) DEFAULT 1,
    usos_maximos    INT,
    usos_actuales   INT DEFAULT 0,
    fecha_expiracion DATETIME,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Pedidos
CREATE TABLE IF NOT EXISTS pedido (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id          BIGINT,
    email_cliente       VARCHAR(255),
    nombre_cliente      VARCHAR(255),
    telefono            VARCHAR(50),
    direccion           TEXT,
    ciudad              VARCHAR(100),
    codigo_postal       VARCHAR(20),
    pais                VARCHAR(100),
    total               DECIMAL(10,2),
    estado              VARCHAR(50) DEFAULT 'PENDIENTE',
    metodo_pago         VARCHAR(50),
    referencia_pago     VARCHAR(255),
    cupon_id            BIGINT,
    descuento_aplicado  DECIMAL(10,2) DEFAULT 0,
    notas               TEXT,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_pedido_cupon FOREIGN KEY (cupon_id) REFERENCES cupon(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Líneas de pedido (productos comprados)
CREATE TABLE IF NOT EXISTS pedido_producto (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    pedido_id           BIGINT NOT NULL,
    producto_id         BIGINT,
    producto_venta_id   BIGINT,
    nombre_producto     VARCHAR(500),
    cantidad            INT NOT NULL,
    precio_unitario     DECIMAL(10,2),
    subtotal            DECIMAL(10,2),
    CONSTRAINT fk_pp_pedido  FOREIGN KEY (pedido_id)  REFERENCES pedido(id) ON DELETE CASCADE,
    CONSTRAINT fk_pp_producto FOREIGN KEY (producto_id) REFERENCES producto(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tracking de pedidos
CREATE TABLE IF NOT EXISTS pedido_traking (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    pedido_id       BIGINT NOT NULL,
    estado          VARCHAR(100),
    descripcion     TEXT,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_traking_pedido FOREIGN KEY (pedido_id) REFERENCES pedido(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Carrito (persistido en BD para usuarios autenticados)
CREATE TABLE IF NOT EXISTS carrito (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    usuario_id      BIGINT NOT NULL UNIQUE,
    updated_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Líneas del carrito
CREATE TABLE IF NOT EXISTS carrito_item (
    id                  BIGINT AUTO_INCREMENT PRIMARY KEY,
    carrito_id          BIGINT NOT NULL,
    producto_venta_id   BIGINT,
    producto_id         BIGINT,
    cantidad            INT DEFAULT 1,
    CONSTRAINT fk_ci_carrito  FOREIGN KEY (carrito_id) REFERENCES carrito(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reseñas de productos
CREATE TABLE IF NOT EXISTS resena (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    producto_id     BIGINT NOT NULL,
    usuario_id      BIGINT,
    nombre_autor    VARCHAR(255),
    puntuacion      TINYINT,
    comentario      TEXT,
    verificada      TINYINT(1) DEFAULT 0,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_resena_producto FOREIGN KEY (producto_id) REFERENCES producto(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Avisos de reposición de stock
CREATE TABLE IF NOT EXISTS aviso_stock (
    id              BIGINT AUTO_INCREMENT PRIMARY KEY,
    producto_id     BIGINT NOT NULL,
    email           VARCHAR(255) NOT NULL,
    notificado      TINYINT(1) DEFAULT 0,
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_aviso_producto FOREIGN KEY (producto_id) REFERENCES producto(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
