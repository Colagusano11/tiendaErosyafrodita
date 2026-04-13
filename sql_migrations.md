# SQL Migration Script - Eros & Afrodita

Este documento contiene todas las sentencias SQL ejecutadas para organizar el catálogo y las categorías. Ejecuta estas sentencias en tu VM para ver los mismos cambios que en local.

> [!IMPORTANT]
> Antes de ejecutar, asegúrate de estar usando la base de datos correcta: `USE tienda_db;`

---

## 1. Categoría "Cabello"
Asignación masiva de productos de peluquería, herramientas eléctricas y cuidado capilar.

```sql
UPDATE productos 
SET categoria = 'Cabello', id_categoria = '14502' 
WHERE nombre LIKE '%secador%' 
   OR nombre LIKE '%plancha%' 
   OR nombre LIKE '%cepillo%' 
   OR nombre LIKE '%peinar%' 
   OR nombre LIKE '%cabello%' 
   OR nombre LIKE '%champú%' 
   OR nombre LIKE '%acondicionador%' 
   OR nombre LIKE '%laca%' 
   OR nombre LIKE '%mascarilla%';
```

---

## 2. Categoría "Complementos"
Creación de la categoría y migración de accesorios (Gafas de sol).

```sql
-- Crear la categoría (ID 14513 basado en el último ID disponible)
INSERT INTO categorias (idcategorias, categoria) 
VALUES ('14513', 'Complementos');

-- Mover productos de óptica
UPDATE productos 
SET categoria = 'Complementos', id_categoria = '14513' 
WHERE nombre LIKE '%gafas%' 
   OR nombre LIKE '%sunglasses%';
```

---

## 3. Seguridad y Ajustes
Asegúrate de que los permisos en la tabla de categorías permitan la visualización.

```sql
-- Verificar que las categorías están activas
SELECT * FROM categorias WHERE categoria IN ('Cabello', 'Complementos', 'Otros');

---

## 4. Bacheo Masivo (Categorización de 19k productos)
Ejecutado el 13/04/2026 para limpiar el catálogo huérfano.

```sql
-- Crear categoría de respaldo
INSERT INTO categorias (idcategorias, categoria) VALUES ('14514', 'Otros');

-- Mover por fabricantes especializados
UPDATE productos SET categoria = 'Complementos', id_categoria = '14513' WHERE (categoria IS NULL OR categoria = '' OR categoria = 'sin categoria') AND (manufacturer LIKE '%GAFAS%' OR manufacturer LIKE '%HAWKERS%' OR manufacturer LIKE '%MAX & CO%' OR manufacturer LIKE '%POLAROID%');
UPDATE productos SET categoria = 'Cabello', id_categoria = '14502' WHERE (categoria IS NULL OR categoria = '' OR categoria = 'sin categoria') AND (manufacturer LIKE '%GHD%' OR manufacturer LIKE '%PARLUX%' OR manufacturer LIKE '%REDKEN%' OR manufacturer LIKE '%KERASTASE%' OR manufacturer LIKE '%L\'OREAL PROFESSIONNEL%');
UPDATE productos SET categoria = 'Maquillaje', id_categoria = '14501' WHERE (categoria IS NULL OR categoria = '' OR categoria = 'sin categoria') AND (manufacturer LIKE '%BARE MINERALS%' OR manufacturer LIKE '%NYX%');

-- Mover por Palabras Clave
-- Perfumes
UPDATE productos SET categoria = 'Perfumes', id_categoria = '14498' WHERE (categoria IS NULL OR categoria = '' OR categoria = 'sin categoria') AND (nombre LIKE '%edp%' OR nombre LIKE '%edt%' OR nombre LIKE '%parfum%' OR nombre LIKE '%toilette%' OR nombre LIKE '%vapo%' OR nombre LIKE '%fragancia%' OR nombre LIKE '%scent%' OR nombre LIKE '%colonia%');
-- Cosmética
UPDATE productos SET categoria = 'Cosmetica', id_categoria = '14500' WHERE (categoria IS NULL OR categoria = '' OR categoria = 'sin categoria') AND (nombre LIKE '%crema%' OR nombre LIKE '%sérum%' OR nombre LIKE '%serum%' OR nombre LIKE '%facial%' OR nombre LIKE '%hidratante%' OR nombre LIKE '%limpiador%' OR nombre LIKE '%body milk%' OR nombre LIKE '%antiedad%' OR nombre LIKE '%corporal%');
-- Maquillaje
UPDATE productos SET categoria = 'Maquillaje', id_categoria = '14501' WHERE (categoria IS NULL OR categoria = '' OR categoria = 'sin categoria') AND (nombre LIKE '%labial%' OR nombre LIKE '%máscara%' OR nombre LIKE '%lipstick%' OR nombre LIKE '%shadow%' OR nombre LIKE '%maquillaje%' OR nombre LIKE '%corrector%' OR nombre LIKE '%uñas%' OR nombre LIKE '%esmalte%');
-- Cuidado Solar
UPDATE productos SET categoria = 'Cuidado Solar', id_categoria = '14503' WHERE (categoria IS NULL OR categoria = '' OR categoria = 'sin categoria') AND (nombre LIKE '%solar%' OR nombre LIKE '%spf%' OR nombre LIKE '%bronceador%' OR nombre LIKE '%protección%');
-- Cabello (Keyword)
UPDATE productos SET categoria = 'Cabello', id_categoria = '14502' WHERE (categoria IS NULL OR categoria = '' OR categoria = 'sin categoria') AND (nombre LIKE '%champ%' OR nombre LIKE '%pelo%' OR nombre LIKE '%shampoo%' OR nombre LIKE '%mascarilla capilar%' OR nombre LIKE '%acondicionador%');

-- Limpieza final: Mover el resto a "Otros"
UPDATE productos SET categoria = 'Otros', id_categoria = '14514' WHERE (categoria IS NULL OR categoria = '' OR categoria = 'sin categoria');
```
