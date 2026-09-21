# Scripts de mantenimiento del catálogo

## process_product_images.py

Recorta el espacio en blanco sobrante de una foto (para que el producto llene
bien el recuadro en la tienda) y la sube a Cloudinary. Genera un `.sql` con
los `UPDATE` necesarios para aplicar el cambio en la base de datos — no toca
la BD directamente, así puedes revisar el resultado primero.

### Requisitos (una vez)

```bash
pip3 install cloudinary pillow numpy requests
```

### Uso

Una foto suelta:

```bash
export CLOUDINARY_CLOUD_NAME=dko3uwc6
export CLOUDINARY_API_KEY=...
export CLOUDINARY_API_SECRET=...

python3 process_product_images.py --url "https://images.btswholesaler.com/.../123.webp"
```

Varias fotos (una URL por línea en un fichero):

```bash
python3 process_product_images.py --urls-file nuevas_fotos.txt
```

### Aplicar el resultado

1. Revisa `image_map.json` (qué URL vieja mapea a qué URL nueva de Cloudinary).
2. Aplica `update_images.sql` contra la base que corresponda:

```bash
# Local
docker exec -i tienda-mysql-db mysql --default-character-set=utf8mb4 \
    -u root -proot -D tienda_db < update_images.sql

# Producción (desde la VM)
docker exec -i tienda-mysql-db mysql --default-character-set=utf8mb4 \
    -u root -proot -D tienda_db < update_images.sql
```

### Secuencia completa para subir un producto nuevo

1. Buscar el producto en la BD de SellerKing (coste, stock, foto) por marca/EAN.
2. Calcular el precio con margen del 12% neto sobre el coste más barato con
   stock (ver `ErosyAfroditaProductService.computeDefaultSalePrice()`).
3. Insertar el producto en `productos` (local o producción según toque).
4. Pasar su foto por `process_product_images.py` para recortarla y subirla a
   Cloudinary, y aplicar el `.sql` resultante.
