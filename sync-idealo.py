#!/usr/bin/env python3
"""
Sincronización masiva de productos con Idealo
Shop ID: 337535
"""
import json
import time
import urllib.request
import urllib.error
import sys
from datetime import datetime

# Configuración
API_URL = "http://localhost:8082"
BATCH_SIZE = 50
DELAY_BETWEEN_REQUESTS = 2
DELAY_BETWEEN_BATCHES = 5
LOG_FILE = "/home/ventas/eros-afrodita-web/sync-idealo.log"

def log(msg):
    """Log con timestamp"""
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{timestamp}] {msg}"
    print(line)
    with open(LOG_FILE, "a", encoding="utf-8") as f:
        f.write(line + "\n")

def obtener_productos():
    """Obtener catálogo de productos"""
    try:
        req = urllib.request.Request(f"{API_URL}/productos")
        with urllib.request.urlopen(req, timeout=30) as response:
            return json.loads(response.read().decode())
    except Exception as e:
        log(f"❌ Error al obtener productos: {e}")
        return []

def sincronizar_producto(producto):
    """Sincronizar un producto con Idealo"""
    sku = producto.get("sku", "")
    nombre = producto.get("nombre", "")
    precio = producto.get("precio", 0)
    
    if not sku or not nombre:
        return None
    
    # Formatear precio
    precio_str = f"{precio:.2f}"
    
    # Crear payload
    payload = {
        "sku": sku,
        "title": nombre[:100],
        "price": precio_str,
        "url": f"https://erosyafrodita.com/producto/{sku}",
        "brand": producto.get("marca", "Eros y Afrodita"),
        "description": nombre[:200],
        "deliveryCosts": {
            "DHL": "5.99"
        },
        "paymentCosts": {
            "CREDIT_CARD": "0.00"
        }
    }
    
    try:
        req = urllib.request.Request(
            f"{API_URL}/api/idealo/offer/{sku}",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Content-Type": "application/json",
                "Origin": "http://localhost:4001"
            },
            method="PUT"
        )
        
        with urllib.request.urlopen(req, timeout=30) as response:
            result = json.loads(response.read().decode())
            return result
            
    except urllib.error.HTTPError as e:
        try:
            error_body = json.loads(e.read().decode())
            return error_body
        except:
            return {"error": str(e.code)}
    except Exception as e:
        return {"error": str(e)}

def main():
    log("=" * 60)
    log("🚀 INICIANDO SINCRONIZACIÓN CON IDEALO")
    log("📊 Shop ID: 337535")
    log("=" * 60)
    
    # Obtener productos
    log("📥 Obteniendo catálogo de productos...")
    productos = obtener_productos()
    total = len(productos)
    
    if total == 0:
        log("❌ No se encontraron productos")
        return
    
    log(f"📦 Total productos a sincronizar: {total}")
    log(f"📦 Tamaño de lote: {BATCH_SIZE}")
    log(f"⏱️  Delay entre requests: {DELAY_BETWEEN_REQUESTS}s")
    log("-" * 60)
    
    # Contadores
    exitosos = 0
    fallidos = 0
    errores_validacion = 0
    ya_existentes = 0
    
    # Procesar productos
    for i, producto in enumerate(productos):
        sku = producto.get("sku", "N/A")
        nombre = producto.get("nombre", "")[:50]
        
        # Sincronizar
        resultado = sincronizar_producto(producto)
        
        # Analizar resultado
        if resultado is None:
            log(f"⏭️  {sku}: Omitido (datos incompletos)")
            continue
        
        if "error" in resultado:
            log(f"❌ {sku}: Error - {resultado['error']}")
            fallidos += 1
        elif "fieldErrors" in resultado and resultado["fieldErrors"]:
            errores = ", ".join([e.get("message", "") for e in resultado["fieldErrors"]])
            log(f"⚠️  {sku}: Errores de validación - {errores}")
            errores_validacion += 1
        elif "generalErrors" in resultado and resultado["generalErrors"]:
            errores = ", ".join(resultado["generalErrors"])
            if "No offer found" in errores:
                log(f"📄 {sku}: Producto no encontrado en Idealo")
                fallidos += 1
            elif "sufficient privileges" in errores:
                log(f"🔒 {sku}: Sin privilegios - {errores}")
                fallidos += 1
            else:
                log(f"⚠️  {sku}: {errores}")
                errores_validacion += 1
        else:
            # Éxito - el producto se creó o actualizó
            exitosos += 1
        
        # Progreso cada 10 productos
        if (i + 1) % 10 == 0:
            progreso = (i + 1) / total * 100
            log(f"📊 Progreso: {i+1}/{total} ({progreso:.1f}%) - ✅ {exitosos} ⚠️ {errores_validacion} ❌ {fallidos}")
        
        # Delay entre requests
        time.sleep(DELAY_BETWEEN_REQUESTS)
        
        # Delay extra cada batch
        if (i + 1) % BATCH_SIZE == 0:
            log(f"⏸️  Pausa de {DELAY_BETWEEN_BATCHES}s...")
            time.sleep(DELAY_BETWEEN_BATCHES)
    
    # Resumen final
    log("=" * 60)
    log("✅ SINCRONIZACIÓN COMPLETADA")
    log("=" * 60)
    log(f"📊 Total procesado: {total}")
    log(f"✅ Exitosos: {exitosos}")
    log(f"⚠️  Errores de validación: {errores_validacion}")
    log(f"❌ Fallidos: {fallidos}")
    log(f"⏰ Fin: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    log("=" * 60)

if __name__ == "__main__":
    main()
