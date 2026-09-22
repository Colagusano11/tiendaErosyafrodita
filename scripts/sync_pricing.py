#!/usr/bin/env python3
"""
sync_pricing.py — motor de precio dinámico con oferta real entre proveedores.

Para cada EAN de la tienda, mira TODOS los proveedores (SellerKing) con
stock > 0 ahora mismo:

  - 1 solo proveedor con stock -> precio normal calculado desde su coste
    real (coste + envío + IVA de compra), margen neto objetivo, SIN oferta.
    Margen del 12% normalmente, pero del 15% si el coste real de ESE
    proveedor concreto es menor de 15€ (en absoluto, el 12% deja muy poco).

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

MARGEN_NETO = 0.12
MARGEN_NETO_BARATO = 0.15               # coste real < UMBRAL_COSTE_BARATO -> este margen, no el de arriba
UMBRAL_COSTE_BARATO = 15.0              # € de coste real (proveedor + envío + IVA de compra)
IVA = 1.21
SHIPPING = {1: 5.20, 2: 4.35}          # BTS=1, NovaEngel=2
DESCUENTO_MINIMO_PCT = 5                # por debajo de esto, no merece la pena mostrar "oferta"

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
    shipping = SHIPPING.get(supplier_id, 5.20)
    return round((price + shipping) * IVA + 1e-9, 2)


def pvp(coste):
    margen = MARGEN_NETO_BARATO if coste < UMBRAL_COSTE_BARATO else MARGEN_NETO
    return round(coste * IVA / (1 - margen) + 1e-9, 2)


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

    updates = []
    zeroed = 0
    con_oferta = 0
    sin_oferta_con_datos = 0

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
            precio_normal = pvp(caro[0])
            updates.append((ean, barato[1], precio_normal, False, None, None))
            sin_oferta_con_datos += 1
            continue

        precio_normal = pvp(caro[0])
        precio_oferta = pvp(barato[0])
        descuento_pct = round(100 * (1 - precio_oferta / precio_normal))

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
