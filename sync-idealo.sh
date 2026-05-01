#!/bin/bash
set -e

# Configuración
API_URL="http://localhost:8082"
BATCH_SIZE=50
DELAY_BETWEEN_REQUESTS=2
DELAY_BETWEEN_BATCHES=5
LOG_FILE="/home/ventas/eros-afrodita-web/sync-idealo.log"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "🚀 Iniciando sincronización con Idealo..." | tee -a "$LOG_FILE"
echo "📊 Shop ID: 337535" | tee -a "$LOG_FILE"
echo "⏰ Inicio: $(date)" | tee -a "$LOG_FILE"
echo "---" | tee -a "$LOG_FILE"

# Obtener todos los productos
echo "📥 Obteniendo catálogo de productos..." | tee -a "$LOG_FILE"
PRODUCTOS=$(curl -s "${API_URL}/productos" 2>/dev/null)
TOTAL=$(echo "$PRODUCTOS" | python3 -c "import sys,json; print(len(json.load(sys.stdin)))" 2>/dev/null)

echo "📦 Total productos a sincronizar: $TOTAL" | tee -a "$LOG_FILE"
echo "📦 Tamaño de lote: $BATCH_SIZE" | tee -a "$LOG_FILE"
echo "⏱️  Delay entre requests: ${DELAY_BETWEEN_REQUESTS}s" | tee -a "$LOG_FILE"
echo "---" | tee -a "$LOG_FILE"

# Contadores
EXITOSOS=0
FALLIDOS=0
PROCESADOS=0

# Procesar productos en lotes
python3 -c "
import sys
import json
import time
import subprocess

productos = json.loads('$PRODUCTOS')
total = len(productos)
batch_size = $BATCH_SIZE
exitosos = 0
fallidos = 0

print(f'🔄 Procesando {total} productos...')

for i, producto in enumerate(productos):
    sku = producto.get('sku', '')
    nombre = producto.get('nombre', '')
    precio = producto.get('precio', 0)
    
    if not sku or not nombre:
        continue
    
    # Formatear precio
    precio_str = f\"{precio:.2f}\"
    
    # Crear payload con configuración por defecto
    payload = {
        'sku': sku,
        'title': nombre[:100],  # Idealo limita el título
        'price': precio_str,
        'url': f\"https://erosyafrodita.com/producto/{sku}\",
        'brand': producto.get('marca', 'Eros y Afrodita'),
        'description': nombre[:200],
        'deliveryCosts': {
            'DHL': '5.99'
        },
        'paymentCosts': {
            'CREDIT_CARD': '0.00'
        }
    }
    
    # Enviar a Idealo
    try:
        import urllib.request
        req = urllib.request.Request(
            f\"${API_URL}/api/idealo/offer/{sku}\",
            data=json.dumps(payload).encode(),
            headers={
                'Content-Type': 'application/json',
                'Origin': 'http://localhost:4001'
            },
            method='PUT'
        )
        
        with urllib.request.urlopen(req, timeout=30) as response:
            result = json.loads(response.read().decode())
            
            if 'fieldErrors' in result and result['fieldErrors']:
                print(f'⚠️  {sku}: Errores de validación')
                fallidos += 1
            elif 'generalErrors' in result and result['generalErrors']:
                if 'sufficient privileges' in str(result['generalErrors']):
                    print(f'❌ {sku}: Sin privilegios - Verificar cuenta Idealo')
                    fallidos += 1
                else:
                    print(f'⚠️  {sku}: {result[\"generalErrors\"]}')
                    fallidos += 1
            else:
                exitosos += 1
                
    except Exception as e:
        print(f'❌ {sku}: Error - {str(e)}')
        fallidos += 1
    
    # Mostrar progreso cada 10 productos
    if (i + 1) % 10 == 0:
        progreso = (i + 1) / total * 100
        print(f'📊 Progreso: {i+1}/{total} ({progreso:.1f}%) - ✅ {exitosos} ❌ {fallidos}')
    
    # Delay entre requests
    time.sleep($DELAY_BETWEEN_REQUESTS)
    
    # Delay extra cada batch
    if (i + 1) % batch_size == 0:
        print(f'⏸️  Pausa de ${DELAY_BETWEEN_BATCHES}s...')
        time.sleep($DELAY_BETWEEN_BATCHES)

print(f'\n✅ Sincronización completada!')
print(f'📊 Total procesado: {total}')
print(f'✅ Exitosos: {exitosos}')
print(f'❌ Fallidos: {fallidos}')
" 2>&1 | tee -a "$LOG_FILE"

echo "---" | tee -a "$LOG_FILE"
echo "✅ Sincronización finalizada" | tee -a "$LOG_FILE"
echo "⏰ Fin: $(date)" | tee -a "$LOG_FILE"
echo "📊 Shop ID: 337535" | tee -a "$LOG_FILE"