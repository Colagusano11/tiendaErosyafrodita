#!/bin/bash
# ============================================================
# sync_stock.sh — sincroniza el stock de tiendaBack con SellerKing
#
# Para cada producto (por EAN), busca entre TODOS los proveedores
# (SellerKing) cuál es el más barato con stock > 0 ahora mismo —
# la misma fórmula que se usa para fijar el precio (coste + envío
# + IVA de compra) — y usa el stock DE ESE proveedor. Si ningún
# proveedor tiene stock, el producto se pone a 0 (y desaparece del
# catálogo web automáticamente).
#
# Pensado para correr como cron en la propia VM, donde los dos
# contenedores (rockeseller-db y tienda-mysql-db) son accesibles
# por nombre vía `docker exec`.
#
# Uso: ./sync_stock.sh
# Cron sugerido (cada 6 horas):
#   0 */6 * * * /home/deploy/tiendaonline/scripts/sync_stock.sh >> /home/deploy/sync_stock.log 2>&1
# ============================================================
set -euo pipefail

TMP_DIR=$(mktemp -d)
trap 'rm -rf "$TMP_DIR"' EXIT

echo "[$(date -Iseconds)] Iniciando sync de stock..."

# 1. EANs actuales en la tienda
docker exec tienda-mysql-db mysql -u root -proot -D tienda_db -N -e \
  "SELECT ean FROM productos WHERE ean IS NOT NULL;" 2>/dev/null > "$TMP_DIR/all_eans.txt"

TOTAL_EANS=$(wc -l < "$TMP_DIR/all_eans.txt")
if [ "$TOTAL_EANS" -eq 0 ]; then
  echo "Sin productos con EAN, nada que sincronizar."
  exit 0
fi

EANS_SQL=$(paste -sd, "$TMP_DIR/all_eans.txt" | sed "s/,/','/g")

# 2. Para cada EAN, el proveedor más barato con stock > 0 ahora mismo
docker exec rockeseller-db psql -U rockeuser -d mcsv-suppliers_db -t -A -F$'\t' -c "
SELECT DISTINCT ON (ean) ean, stock
FROM suppliers_products
WHERE stock > 0 AND ean IN ('$EANS_SQL')
ORDER BY ean, ROUND((price + CASE WHEN supplier_id=1 THEN 5.20 WHEN supplier_id=2 THEN 4.35 ELSE 5.20 END) * 1.21, 2) ASC;
" > "$TMP_DIR/best_stock.tsv"

# 3. Generar los UPDATE (0 para los EAN sin ningún proveedor con stock)
python3 - "$TMP_DIR/all_eans.txt" "$TMP_DIR/best_stock.tsv" "$TMP_DIR/stock_sync.sql" << 'PYEOF'
import sys
all_eans_file, best_stock_file, out_file = sys.argv[1:4]

with open(all_eans_file, encoding="utf-8") as f:
    all_eans = [l.strip() for l in f if l.strip()]

best_stock = {}
with open(best_stock_file, encoding="utf-8") as f:
    for line in f:
        parts = line.rstrip("\n").split("\t")
        if len(parts) < 2:
            continue
        ean, stock = parts[0], parts[1]
        best_stock[ean] = int(stock)

lines = []
zeroed = 0
for ean in all_eans:
    stock = best_stock.get(ean, 0)
    if ean not in best_stock:
        zeroed += 1
    lines.append(f"UPDATE productos SET stock={stock} WHERE ean='{ean}';")

with open(out_file, "w", encoding="utf-8") as f:
    f.write("\n".join(lines) + "\n")

print(f"{len(lines)} productos revisados, {zeroed} puestos a 0 (agotados en todos los proveedores)")
PYEOF

# 4. Aplicar
docker exec -i tienda-mysql-db mysql -u root -proot -D tienda_db < "$TMP_DIR/stock_sync.sql" 2>&1 | grep -v "Using a password" || true

echo "[$(date -Iseconds)] Sync de stock completado."
