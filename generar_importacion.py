#!/usr/bin/env python3
"""
Genera los archivos JSON de landing (src/content/landing/<ean>.json) a partir
de productos_importar.json.

Precio, stock y alta del producto en la tienda YA NO se gestionan desde este
script ni por SQL manual: entran en vivo a través de la API interna de
SellerKing (POST /api/internal/products, PATCH /api/internal/products/{id}/stock).
Este script solo sirve para no escribir a mano el JSON de contenido editorial
(claim, notas, FAQs, SEO) de cada producto.
"""
import json
import os

JSON_INPUT_PATH = "productos_importar.json"
LANDING_OUTPUT_DIR = "erosyafrodita/src/content/landing"


def main():
    print("🚀 Generando JSON de landing por producto...")

    if not os.path.exists(JSON_INPUT_PATH):
        print(f"❌ Error: No se encuentra el archivo {JSON_INPUT_PATH}")
        return

    with open(JSON_INPUT_PATH, "r", encoding="utf-8") as f:
        productos = json.load(f)

    os.makedirs(LANDING_OUTPUT_DIR, exist_ok=True)

    generados = 0
    for idx, p in enumerate(productos):
        ean = p.get("ean")
        marketing = p.get("marketing")
        nombre = p.get("nombre", f"producto #{idx}")

        if not ean:
            print(f"⚠️ Saltando '{nombre}': sin 'ean' (es la clave que usa la ficha para encontrar su landing)")
            continue
        if not marketing:
            print(f"⚠️ Saltando '{nombre}': sin bloque 'marketing'")
            continue

        m_item = {
            "brand": p.get("marca", ""),
            "claim": marketing.get("claim", ""),
            "shortDescription": marketing.get("shortDescription", ""),
            "benefits": marketing.get("benefits", []),
            "fragranceFamily": marketing.get("fragranceFamily", ""),
            "topNotes": marketing.get("topNotes", []),
            "heartNotes": marketing.get("heartNotes", []),
            "baseNotes": marketing.get("baseNotes", []),
            "recommendedFor": marketing.get("recommendedFor", []),
            "recommendedOccasions": marketing.get("recommendedOccasions", []),
            "season": marketing.get("season", []),
            "faqs": marketing.get("faqs", []),
            "seoTitle": marketing.get("seoTitle", f"{nombre} | AGE Parfums"),
            "seoDescription": marketing.get("seoDescription", p.get("descripcion_basica", "")),
        }

        path = os.path.join(LANDING_OUTPUT_DIR, f"{ean}.json")
        with open(path, "w", encoding="utf-8") as f:
            json.dump(m_item, f, indent=2, ensure_ascii=False)
            f.write("\n")
        print(f"✅ {path}")
        generados += 1

    print(f"🎉 Listo. {generados} archivo(s) de landing generado(s) en {LANDING_OUTPUT_DIR}/")
    print("   Recuerda: el alta del producto (precio, stock, imágenes) la hace SellerKing vía API, no este script.")


if __name__ == "__main__":
    main()
