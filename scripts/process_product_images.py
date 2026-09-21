#!/usr/bin/env python3
"""
Recorta el espacio en blanco sobrante de las fotos de producto y las sube a
Cloudinary, generando un mapa URL-original -> URL-final para actualizar la BD.

No toca la base de datos directamente (para poder revisar el resultado antes
de aplicarlo) — genera un fichero SQL con los UPDATE necesarios.

Uso típico (foto suelta, para probar):
    python3 process_product_images.py --url "https://images.btswholesaler.com/.../123.webp"

Uso típico (varias fotos desde un fichero, una URL por línea):
    python3 process_product_images.py --urls-file mis_urls.txt

Requiere las claves de Cloudinary como variables de entorno (o --cloud-name/
--api-key/--api-secret):
    export CLOUDINARY_CLOUD_NAME=...
    export CLOUDINARY_API_KEY=...
    export CLOUDINARY_API_SECRET=...

Después de revisar el .sql generado, aplícalo con:
    docker exec -i tienda-mysql-db mysql --default-character-set=utf8mb4 \
        -u root -proot -D tienda_db < update_images.sql
"""
import argparse
import json
import os
import sys

import cloudinary
import cloudinary.uploader
import numpy as np
import requests
from PIL import Image

WHITE_THRESHOLD = 20
MARGIN_FRAC = 0.10
SKIP_IF_CONTENT_FRAC_ABOVE = 0.85
VIDEO_EXT = {".mp4", ".mov", ".webm"}
IMAGE_EXT = {".webp", ".jpg", ".jpeg", ".png", ".avif", ".gif"}


def content_bbox(im):
    if im.mode in ("RGBA", "LA") or (im.mode == "P" and "transparency" in im.info):
        arr = np.array(im.convert("RGBA"))
        mask = arr[:, :, 3] > 10
    else:
        arr = np.array(im.convert("RGB")).astype(int)
        dist = np.abs(arr[:, :, 0] - 255) + np.abs(arr[:, :, 1] - 255) + np.abs(arr[:, :, 2] - 255)
        mask = dist > WHITE_THRESHOLD
    ys, xs = np.where(mask)
    if len(xs) == 0:
        return None
    return xs.min(), ys.min(), xs.max(), ys.max()


def process_one(url, cloud_folder, tmp_path="/tmp/_process_src"):
    ext = os.path.splitext(url.split("?")[0])[1].lower()
    resource_type = "video" if ext in VIDEO_EXT else "image"

    resp = requests.get(url, headers={"User-Agent": "Mozilla/5.0"}, timeout=20)
    resp.raise_for_status()
    with open(tmp_path, "wb") as f:
        f.write(resp.content)

    upload_path = tmp_path

    if resource_type == "image":
        im = Image.open(tmp_path)
        im.load()
        w, h = im.size
        bbox = content_bbox(im)
        if bbox is not None:
            x0, y0, x1, y1 = bbox
            content_w, content_h = (x1 - x0), (y1 - y0)
            already_tight = content_w / w > SKIP_IF_CONTENT_FRAC_ABOVE and content_h / h > SKIP_IF_CONTENT_FRAC_ABOVE
            if not already_tight:
                mx = int(content_w * MARGIN_FRAC) + 1
                my = int(content_h * MARGIN_FRAC) + 1
                cx0, cy0 = max(0, x0 - mx), max(0, y0 - my)
                cx1, cy1 = min(w, x1 + mx), min(h, y1 + my)
                cropped_path = "/tmp/_process_cropped.webp"
                im.convert("RGB").crop((cx0, cy0, cx1, cy1)).save(cropped_path, "WEBP", quality=90)
                upload_path = cropped_path

    result = cloudinary.uploader.upload(
        upload_path,
        resource_type=resource_type,
        folder=cloud_folder,
        overwrite=True,
    )
    return result["secure_url"]


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--url", help="Una única URL de imagen/vídeo a procesar")
    ap.add_argument("--urls-file", help="Fichero con una URL por línea")
    ap.add_argument("--cloud-folder", default="ageperfumes/nuevos", help="Carpeta destino en Cloudinary")
    ap.add_argument("--cloud-name", default=os.environ.get("CLOUDINARY_CLOUD_NAME"))
    ap.add_argument("--api-key", default=os.environ.get("CLOUDINARY_API_KEY"))
    ap.add_argument("--api-secret", default=os.environ.get("CLOUDINARY_API_SECRET"))
    ap.add_argument("--out-sql", default="update_images.sql", help="Fichero SQL de salida con los UPDATE")
    ap.add_argument("--out-map", default="image_map.json", help="Fichero JSON con el mapa url-original -> url-final")
    args = ap.parse_args()

    if not (args.cloud_name and args.api_key and args.api_secret):
        sys.exit("Faltan credenciales de Cloudinary (variables de entorno o --cloud-name/--api-key/--api-secret)")

    cloudinary.config(cloud_name=args.cloud_name, api_key=args.api_key, api_secret=args.api_secret, secure=True)

    urls = []
    if args.url:
        urls.append(args.url)
    if args.urls_file:
        with open(args.urls_file, encoding="utf-8") as f:
            urls.extend(line.strip() for line in f if line.strip())
    if not urls:
        sys.exit("Nada que procesar: pasa --url o --urls-file")

    mapping = {}
    sql_lines = []
    for i, url in enumerate(urls, 1):
        try:
            new_url = process_one(url, args.cloud_folder)
            mapping[url] = new_url
            print(f"[{i}/{len(urls)}] OK  {url} -> {new_url}")
            esc_url = url.replace("'", "\\'")
            esc_new = new_url.replace("'", "\\'")
            for col in ["imagen", "imagen2", "imagen3", "imagen4"]:
                sql_lines.append(f"UPDATE productos SET {col}='{esc_new}' WHERE {col}='{esc_url}';")
        except Exception as e:
            print(f"[{i}/{len(urls)}] ERROR {url}: {e}")

    with open(args.out_map, "w", encoding="utf-8") as f:
        json.dump(mapping, f, indent=2, ensure_ascii=False)
    with open(args.out_sql, "w", encoding="utf-8") as f:
        f.write("\n".join(sql_lines) + "\n")

    print(f"\n{len(mapping)} procesadas -> {args.out_map}")
    print(f"SQL de actualización -> {args.out_sql}")


if __name__ == "__main__":
    main()
