#!/usr/bin/env python3
"""
sync_pricing.py — motor de precio dinámico con oferta real entre proveedores.

Para cada EAN de la tienda, mira TODOS los proveedores (SellerKing) con
stock > 0 ahora mismo:

  - 1 solo proveedor con stock -> precio normal calculado desde su coste
    neto (coste + envío, SIN IVA de compra — es deducible, no es un coste
    real para una empresa en régimen general), margen neto objetivo, SIN
    oferta. Margen del 12% normalmente, pero del 15% si el coste con IVA de
    compra incluido de ESE proveedor concreto es menor de 15€ (en absoluto,
    el 12% deja muy poco).

  - 2+ proveedores con stock -> el PRECIO NORMAL (preciopvp, el que se
    tacha) se calcula desde el proveedor MÁS CARO; el PRECIO DE OFERTA
    (precioOferta) desde el proveedor MÁS BARATO. Se activa enOferta=true
    y se guarda el % real de descuento. El stock mostrado es el del
    proveedor barato (es el que de verdad se sirve a ese precio).

  - Si el proveedor barato se agota, en el siguiente ciclo ya no habrá
    "más barato" que comparar -> vuelve a caer en el caso de 1 solo
    proveedor: precio normal recalculado con el que quede, sin oferta.

Pensado para sustituir a sync_stock.sh como cron (stock y precio deben
moverse juntos, o quedan inconsistentes entre ciclos).

Uso: python3 sync_pricing.py [--apply]
  Sin --apply: solo genera el informe y el SQL, no toca la base de datos.
  Con --apply: aplica los UPDATE directamente.
"""
import subprocess
import sys

MARGEN_NETO = 0.20                      # antes 0.12 — decisión de Álvaro/Emilio 2026-09-22: en Amazon
                                         # el margen real efectivo es ~24-25% (18,70% de comisión +
                                         # 6-8% de margen propio); con 20% neto directo en la web, sin
                                         # comisión de marketplace de por medio, queda ~5% más barato
                                         # que Amazon y deja más margen real que el 6-8% que se gana allí.
MARGEN_NETO_BARATO = 0.25               # coste real < UMBRAL_COSTE_BARATO -> este margen, no el de arriba
UMBRAL_COSTE_BARATO = 15.0              # € de coste real (proveedor + envío + IVA de compra)
IVA = 1.21
SHIPPING = {1: 5.20, 2: 4.35}          # BTS=1, NovaEngel=2
DESCUENTO_MINIMO_PCT = 5                # por debajo de esto, no merece la pena mostrar "oferta"

# El margen fijo (20%/25%) NO garantiza por sí solo precios más baratos que
# Amazon: el repricer de Amazon mueve esos precios de forma dinámica (no es
# un simple coste×1,24) y en la práctica la diferencia real va de -53,7% a
# +42,1% según el producto, no un rango estrecho (verificado 2026-09-22
# contra product_store_listings). Se añade un techo: si hay precio real de
# Amazon ES para ese EAN, el precio web no supera Amazon × (1 -
# DESCUENTO_MIN_VS_AMAZON) — pero NUNCA por debajo del margen neto objetivo
# (20%/25%, el mismo de pvp()). Decisión explícita de Álvaro/Emilio
# 2026-09-22: el margen objetivo ES el mínimo aceptable, no hay un suelo más
# bajo aparte — mejor quedar algo por encima de Amazon en un puñado de
# productos (~12 de 384 comparables) que renunciar a margen real.
DESCUENTO_MIN_VS_AMAZON = 0.05

APPLY = "--apply" in sys.argv


def run_mysql(sql):
    cmd = [
        "docker", "exec", "tienda-mysql-db", "mysql",
        "--default-character-set=utf8mb4", "-u", "root", "-proot",
        "-D", "tienda_db", "-N", "-e", sql,
    ]
    out = subprocess.run(cmd, capture_output=True, text=True)
    return out.stdout


def run_psql(sql):
    cmd = ["docker", "exec", "rockeseller-db", "psql", "-U", "rockeuser",
           "-d", "mcsv-suppliers_db", "-t", "-A", "-F", "\t", "-c", sql]
    out = subprocess.run(cmd, capture_output=True, text=True)
    return out.stdout


def coste_real(price, supplier_id):
    """Coste neto: proveedor + envío, SIN IVA de compra.

    El IVA que se paga al proveedor (IVA soportado) NO es un coste real para
    una empresa en régimen general — es deducible, se resta del IVA
    repercutido en la declaración trimestral. Antes esta función multiplicaba
    por IVA aquí Y pvp() volvía a multiplicar por IVA otra vez para el precio
    final: el IVA de compra se estaba cobrando dos veces, inflando todo el
    catálogo muy por encima del margen que se creía estar aplicando (un 12%
    "nominal" salía en la práctica ~27% real). Confirmado con la empresa que
    factura en régimen general (no recargo de equivalencia), donde este
    cambio sí aplica.
    """
    shipping = SHIPPING.get(supplier_id, 5.20)
    return round(price + shipping + 1e-9, 2)


def pvp_con_margen(coste, margen):
    """Precio de venta final (IVA de venta incluido) para un margen neto dado,
    calculado sobre coste NETO (sin IVA de compra, ver coste_real)."""
    return round(coste / (1 - margen) * IVA + 1e-9, 2)


def pvp(coste):
    """Precio de venta final para el margen neto objetivo (tramo normal o
    barato). El umbral UMBRAL_COSTE_BARATO se compara contra el coste CON IVA
    de compra incluido — así el tramo "barato" significa lo mismo que cuando
    se aprobó (15€ de coste real, con todo incluido), aunque el precio final
    ya no arrastre el IVA de compra como si fuera un coste.
    """
    coste_con_iva_compra = coste * IVA
    margen = MARGEN_NETO_BARATO if coste_con_iva_compra < UMBRAL_COSTE_BARATO else MARGEN_NETO
    return pvp_con_margen(coste, margen)


def aplicar_techo_amazon(precio_calculado, coste_mas_barato_disponible, ean, precios_amazon_es):
    """Si hay precio real de Amazon ES para este EAN y el precio calculado lo
    supera, lo baja hasta Amazon × (1 - DESCUENTO_MIN_VS_AMAZON) — pero nunca
    por debajo del margen neto objetivo (20%/25%, pvp()).

    El suelo se evalúa sobre coste_mas_barato_disponible: el coste MÁS BARATO
    entre todos los proveedores con stock para este EAN, no el que se usó
    para calcular precio_calculado (que en el "precio normal"/tachado es a
    propósito el proveedor MÁS CARO, solo de referencia visual). Si hay un
    proveedor más barato disponible, es con ESE con el que de verdad se
    podría servir el pedido más barato, así que es el que marca hasta dónde
    se puede bajar sin perder el margen objetivo. Devuelve (precio_final, capado).
    """
    amazon_price = precios_amazon_es.get(ean)
    if not amazon_price or amazon_price <= 0:
        return precio_calculado, False

    techo = round(amazon_price * (1 - DESCUENTO_MIN_VS_AMAZON), 2)
    if precio_calculado <= techo:
        return precio_calculado, False

    precio_min_seguro = pvp(coste_mas_barato_disponible)
    return max(precio_min_seguro, techo), True


def main():
    eans_raw = run_mysql("SELECT ean FROM productos WHERE ean IS NOT NULL AND precio_manual=0;")
    eans = [l.strip() for l in eans_raw.splitlines() if l.strip()]
    manuales_raw = run_mysql("SELECT COUNT(*) FROM productos WHERE ean IS NOT NULL AND precio_manual=1;")
    n_manuales = manuales_raw.strip() or "0"
    print(f"{len(eans)} EAN a recalcular ({n_manuales} con precio_manual=1, excluidos — no se tocan).")

    eans_sql = ",".join(f"'{e}'" for e in eans)
    supplier_rows = run_psql(f"""
        SELECT ean, supplier_id, price, stock
        FROM suppliers_products
        WHERE stock > 0 AND ean IN ({eans_sql});
    """)

    by_ean = {}
    for line in supplier_rows.splitlines():
        parts = line.split("\t")
        if len(parts) < 4:
            continue
        ean, supplier_id, price, stock = parts[0], int(parts[1]), float(parts[2]), int(parts[3])
        by_ean.setdefault(ean, []).append((supplier_id, price, stock))

    # Precio real vigente en Amazon ES por EAN (para el techo de precio, ver
    # aplicar_techo_amazon). Un EAN puede tener varias filas (una por
    # supplier_products enlazado) — se ignoran duplicados, es el mismo anuncio.
    amazon_rows = run_psql(f"""
        SELECT sp.ean, psl.last_pushed_price
        FROM product_store_listings psl
        JOIN product_catalogs pc ON pc.id = psl.product_catalog_id
        JOIN suppliers_products sp ON sp.id = pc.product_id
        WHERE psl.marketplace_type = 'AMAZON' AND psl.store_code = 'ES'
          AND psl.last_pushed_price IS NOT NULL AND sp.ean IN ({eans_sql});
    """)
    precios_amazon_es = {}
    for line in amazon_rows.splitlines():
        parts = line.split("\t")
        if len(parts) < 2:
            continue
        ean, precio = parts[0], parts[1]
        if ean not in precios_amazon_es:
            try:
                precios_amazon_es[ean] = float(precio)
            except ValueError:
                continue

    updates = []
    zeroed = 0
    con_oferta = 0
    sin_oferta_con_datos = 0
    capados_a_amazon = 0
    capados_por_suelo = 0

    for ean in eans:
        candidatos = by_ean.get(ean, [])
        if not candidatos:
            updates.append((ean, 0, None, False, 0, None))
            zeroed += 1
            continue

        # (coste_real, stock, supplier_id) por candidato
        opciones = sorted(
            [(coste_real(price, sid), stock, sid) for sid, price, stock in candidatos],
            key=lambda x: x[0]
        )
        barato = opciones[0]
        caro = opciones[-1]

        if len(opciones) == 1 or barato[0] == caro[0]:
            precio_normal, capado = aplicar_techo_amazon(pvp(caro[0]), barato[0], ean, precios_amazon_es)
            if capado:
                capados_a_amazon += 1
                if precio_normal > round(precios_amazon_es[ean] * (1 - DESCUENTO_MIN_VS_AMAZON), 2):
                    capados_por_suelo += 1
            updates.append((ean, barato[1], precio_normal, False, None, None))
            sin_oferta_con_datos += 1
            continue

        # El suelo de ambos (normal y oferta) se evalúa sobre barato[0], el
        # coste más barato real disponible para este EAN — es el que de
        # verdad determina hasta dónde se puede bajar sin perder margen.
        precio_normal, capado_n = aplicar_techo_amazon(pvp(caro[0]), barato[0], ean, precios_amazon_es)
        precio_oferta, capado_o = aplicar_techo_amazon(pvp(barato[0]), barato[0], ean, precios_amazon_es)
        if capado_n or capado_o:
            capados_a_amazon += 1
            if ean in precios_amazon_es:
                techo = round(precios_amazon_es[ean] * (1 - DESCUENTO_MIN_VS_AMAZON), 2)
                if precio_normal > techo:
                    capados_por_suelo += 1
        # El techo se aplica a cada precio con su propio coste — no deberían
        # cruzarse, pero por seguridad la oferta nunca queda por encima del normal.
        if precio_oferta > precio_normal:
            precio_oferta = precio_normal
        descuento_pct = round(100 * (1 - precio_oferta / precio_normal)) if precio_normal else 0

        if descuento_pct < DESCUENTO_MINIMO_PCT:
            # Diferencia demasiado pequeña para presentarla como oferta real.
            updates.append((ean, barato[1], precio_normal, False, None, None))
            sin_oferta_con_datos += 1
        else:
            updates.append((ean, barato[1], precio_normal, True, precio_oferta, descuento_pct))
            con_oferta += 1

    print(f"Sin stock en ningún proveedor: {zeroed}")
    print(f"Con precio único (sin oferta): {sin_oferta_con_datos}")
    print(f"Con oferta real activada: {con_oferta}")
    print(f"Con precio de Amazon ES real disponible: {len(precios_amazon_es)}")
    print(f"Bajados por el techo de Amazon (-{int(DESCUENTO_MIN_VS_AMAZON*100)}%): {capados_a_amazon}")
    print(f"  De esos, no llegaron al techo por el margen mínimo de seguridad: {capados_por_suelo}")

    sql_lines = []
    for ean, stock, precio_normal, en_oferta, precio_oferta, descuento_pct in updates:
        if precio_normal is None:
            sql_lines.append(f"UPDATE productos SET stock={stock} WHERE ean='{ean}';")
        elif en_oferta:
            sql_lines.append(
                f"UPDATE productos SET stock={stock}, preciopvp={precio_normal}, "
                f"en_oferta=1, precio_oferta={precio_oferta}, descuento_oferta={descuento_pct} "
                f"WHERE ean='{ean}';"
            )
        else:
            sql_lines.append(
                f"UPDATE productos SET stock={stock}, preciopvp={precio_normal}, "
                f"en_oferta=0, precio_oferta=NULL, descuento_oferta=0 "
                f"WHERE ean='{ean}';"
            )

    out_path = "/tmp/sync_pricing.sql"
    with open(out_path, "w", encoding="utf-8") as f:
        f.write("\n".join(sql_lines) + "\n")
    print(f"SQL generado en {out_path} ({len(sql_lines)} UPDATE)")

    if APPLY:
        print("Aplicando...")
        with open(out_path, "rb") as f:
            sql_content = f.read()
        p = subprocess.run(
            ["docker", "exec", "-i", "tienda-mysql-db", "mysql",
             "--default-character-set=utf8mb4", "-u", "root", "-proot", "-D", "tienda_db"],
            input=sql_content, capture_output=True
        )
        if p.returncode != 0:
            print("ERROR aplicando:", p.stderr.decode(errors="replace"))
            sys.exit(1)
        print("Aplicado.")
    else:
        print("Modo simulación (sin --apply). Nada tocado en la base de datos.")


if __name__ == "__main__":
    main()
