import mysql.connector
import time
import sys

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

# ==========================================
# MOTOR DE PLANTILLAS Y CATEGORIZACIÓN
# ==========================================

TEMPLATES = {
    "PERFUMES": (
        "Déjate seducir por {nombre} de {marca}. Este perfume, una pieza clave en nuestra colección, "
        "envuelve tus sentidos con una fragancia única diseñada por {marca}. Ideal para quienes buscan "
        "una esencia distintiva y duradera que deje huella en cualquier ocasión."
    ),
    "COSMETICA": (
        "Cuida tu piel con {nombre}, el tratamiento avanzado de {marca}. Dentro de nuestra gama de cuidado personal, "
        "este producto destaca por su fórmula innovadora diseñada para revitalizar y proteger. "
        "Añade un toque de lujo a tu rutina diaria con la garantía de calidad de {marca}."
    ),
    "CABELLO": (
        "Transforma tu melena con {nombre} de {marca}. Especialmente formulado para el cuidado capilar, "
        "este producto proporciona los nutrientes necesarios para un acabado profesional y saludable. "
        "La solución perfecta de {marca} para un cabello radiante y lleno de vida."
    ),
    "MAQUILLAJE": (
        "Realza tu belleza natural con {nombre}, una joya del maquillaje de {marca}. Logra un acabado "
        "impecable y duradero con este producto esencial. {marca} redefine el estilo con esta propuesta "
        "vibrante y profesional."
    ),
    "GENERAL": (
        "Presentamos el {nombre}, uno de los artículos más destacados de {marca}. Este producto combina "
        "funcionalidad y estilo para ofrecerte la mejor experiencia. Una elección segura avalada por "
        "el prestigio y la calidad de {marca}."
    )
}

KEYWORDS = {
    "PERFUMES": ["eau de", "parfum", "edp", "edt", "cologne", "fragancia", "colonia", "perfume", "vaporizador", "spray"],
    "COSMETICA": ["crema", "serum", "facial", "anti-age", "antiedad", "hidratante", "locion", "limpiador", "contorno", "body", "piel"],
    "CABELLO": ["champu", "champú", "acondicionador", "mascarilla", "mask", "kerastase", "pelo", "cabello", "capilar", "laca"],
    "MAQUILLAJE": ["pintalabios", "eye", "liner", "base", "maquillaje", "sombra", "rimel", "máscara de pestañas", "corrector", "polvos"]
}

def detectar_categoria(nombre, cat_actual):
    # Si ya tiene una categoría conocida, la respetamos
    if cat_actual:
        c = cat_actual.upper()
        if "PERFUME" in c: return "PERFUMES"
        if "COSMETICA" in c or "COSMÉTICA" in c: return "COSMETICA"
        if "CABELLO" in c: return "CABELLO"
        if "MAQUILLAJE" in c: return "MAQUILLAJE"

    # Si no, buscamos por palabras clave en el nombre
    n = nombre.lower()
    for cat, words in KEYWORDS.items():
        for word in words:
            if word in n:
                return cat
                
    return "GENERAL"

def generar_descripcion(nombre, marca, categoria_detectada):
    template = TEMPLATES.get(categoria_detectada, TEMPLATES["GENERAL"])
    return template.format(nombre=nombre, marca=marca)

def main():
    batch_size = 100
    wait_time = 5
    
    # Forzamos que los mensajes se impriman inmediatamente (sin buffer)
    print("🚀 Iniciando Enriquecedor de Descripciones...", flush=True)
    
    while True:
        try:
            conn = mysql.connector.connect(**DB_CONFIG)
            cursor = conn.cursor(dictionary=True)
            
            # Buscamos productos que NO tengan descripción (NULL o vacía)
            query = """
                SELECT id, nombre, manufacturer, categoria 
                FROM productos 
                WHERE (descripcion IS NULL OR descripcion = '' OR descripcion = 'Sin descripción')
                AND precio >= 12
                LIMIT %s
            """
            cursor.execute(query, (batch_size,))
            productos = cursor.fetchall()
            
            if not productos:
                print("🏁 No quedan productos por describir. Proceso finalizado.", flush=True)
                cursor.close()
                conn.close()
                break
                
            print(f"📦 Procesando lote de {len(productos)} productos...", flush=True)
            
            for p in productos:
                nombre_p = p['nombre']
                marca_p = p['manufacturer'] if p['manufacturer'] else "Eros & Afrodita"
                cat_orig = p['categoria']
                
                cat_detectada = detectar_categoria(nombre_p, cat_orig)
                nueva_desc = generar_descripcion(nombre_p, marca_p, cat_detectada)
                
                update_query = "UPDATE productos SET descripcion = %s WHERE id = %s"
                cursor.execute(update_query, (nueva_desc, p['id']))
                
            conn.commit()
            print(f"✅ Lote de {len(productos)} productos actualizado correctamente.", flush=True)
            
            cursor.close()
            conn.close()
            
            time.sleep(wait_time)
            
        except mysql.connector.Error as err:
            print(f"❌ Error de MySQL: {err}", flush=True)
            time.sleep(10)
        except Exception as e:
            print(f"❌ Error general: {e}", flush=True)
            time.sleep(10)

if __name__ == "__main__":
    main()
