import requests
import re
import mysql.connector
import time
from urllib.parse import quote

# ==========================================
# CONFIGURACIÓN DE LA BASE DE DATOS
# ==========================================
DB_CONFIG = {
    "host": "db",
    "user": "root",
    "password": "root",
    "database": "tienda_db",
    "port": 3306
}

def get_image_urls(ean, productName, brand="", count=5):
    """
    Busca una lista de imágenes candidatas en Bing.
    """
    query = f"{brand} {productName} {ean} product images"
    print(f"🔍 Buscando imágenes para: {query}")
    
    url = f"https://www.bing.com/images/search?q={quote(query)}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    }

    urls = []
    try:
        response = requests.get(url, headers=headers, timeout=15)
        if response.status_code != 200:
            return urls
            
        matches = re.findall(r'm=["\']({.*?})["\']', response.text)
        for m_str in matches:
            match_url = re.search(r'(?:murl|imgurl|&quot;murl&quot;|&quot;imgurl&quot;)[:=](?:&quot;|")([^&"]+)(?:&quot;|")', m_str)
            if match_url:
                img_url = match_url.group(1)
                if img_url.startswith("http") and img_url not in urls:
                    urls.append(img_url)
                    if len(urls) >= count:
                        break
        return urls
    except Exception as e:
        print(f"❌ Error buscando {ean}: {e}")
        return urls

def main():
    batch_size = 20
    wait_between_batches = 10 # segundos

    while True:
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor(dictionary=True)
            
            # Buscamos productos que les falte alguna imagen o que tengan imagen de BTS en el slot principal
            query = """
                SELECT id, ean, nombre, manufacturer, imagen, imagen2, imagen3, imagen4, distribuidor 
                FROM productos 
                WHERE (imagen IS NULL OR imagen2 IS NULL OR imagen3 IS NULL OR (distribuidor = 'BTS' AND imagen LIKE '%btswholesaler%')) 
                AND ean != '0' AND ean IS NOT NULL 
                AND precio >= 12
                LIMIT %s
            """
            cursor.execute(query, (batch_size,))
            productos = cursor.fetchall()
            
            if not productos:
                print("🏁 No quedan productos por enriquecer. Proceso finalizado.")
                cursor.close()
                conn.close()
                break

            print(f"📦 Iniciando nueva tanda de {len(productos)} productos...")
            
            for p in productos:
                ean = p['ean']
                nombre = p['nombre']
                brand = p['manufacturer'] if p['manufacturer'] else ""
                img_original = p['imagen']
                img2_original = p['imagen2']
                img3_original = p['imagen3']
                img4_original = p['imagen4']
                distribuidor = p.get('distribuidor')

                # Lógica de "Banquillo" para BTS:
                # Si es de BTS y la imagen principal es de btswholesaler, la movemos al slot 4
                if distribuidor == 'BTS' and img_original and 'btswholesaler' in img_original:
                    print(f"🔄 Desplazando imagen de BTS al banquillo (imagen4) para {ean}")
                    img4_original = img_original
                    img_original = None

                # Buscamos una lista de candidatos
                candidatos = get_image_urls(ean, nombre, brand, count=6)
                
                if not candidatos:
                    # Si no hay candidatos web, al menos aseguramos que la de BTS esté en imagen4 si venía de ahí
                    if img4_original != p['imagen4']:
                         update_query = "UPDATE productos SET imagen = %s, imagen4 = %s WHERE id = %s"
                         cursor.execute(update_query, (img_original, img4_original, p['id']))
                         conn.commit()
                    
                    print(f"⚠️ No se encontraron imágenes web para {ean}")
                    time.sleep(2)
                    continue

                # Selección de imágenes
                new_img = img_original
                new_img2 = img2_original
                new_img3 = img3_original
                new_img4 = img4_original

                idx = 0
                if not new_img:
                    new_img = candidatos[idx]
                    idx += 1
                
                if idx < len(candidatos) and not new_img2:
                    new_img2 = candidatos[idx]
                    idx += 1
                
                if idx < len(candidatos) and not new_img3:
                    new_img3 = candidatos[idx]
                    idx += 1

                # Si aún nos sobran candidatos y no tenemos nada en el banquillo (o queremos mejorar),
                # pero el usuario pidió dejar la de bts en imagen4. 
                # Solo llenamos imagen4 si está vacía.
                if idx < len(candidatos) and not new_img4:
                    new_img4 = candidatos[idx]
                    idx += 1
                
                if (new_img != p['imagen'] or new_img2 != p['imagen2'] or 
                    new_img3 != p['imagen3'] or new_img4 != p['imagen4']):
                    
                    update_query = "UPDATE productos SET imagen = %s, imagen2 = %s, imagen3 = %s, imagen4 = %s WHERE id = %s"
                    cursor.execute(update_query, (new_img, new_img2, new_img3, new_img4, p['id']))
                    conn.commit()
                    print(f"✅ Actualizado {ean} ({idx} nuevas imágenes)")
                
                time.sleep(1) # Pausa entre productos
                
            cursor.close()
            conn.close()
            
            print(f"⏳ Tanda finalizada. Esperando {wait_between_batches} segundos para la siguiente...")
            time.sleep(wait_between_batches)

        except mysql.connector.Error as err:
            print(f"❌ Error de MySQL: {err}")
            time.sleep(10)
        except Exception as e:
            print(f"❌ Error general: {e}")
            time.sleep(10)

if __name__ == "__main__":
    main()
