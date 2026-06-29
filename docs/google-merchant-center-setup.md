# Guía: Configurar Google Merchant Center para Eros y Afrodita

## 1. Crear cuenta en Google Merchant Center

1. Ve a [merchants.google.com](https://merchants.google.com)
2. Inicia sesión con la cuenta de Google que usas para Google Ads
3. Introduce los datos de tu empresa:
   - Nombre del negocio: **Eros y Afrodita**
   - País: **España**
   - Moneda: **EUR**
4. **Verifica tu sitio web**: Merchant Center te pedirá añadir una metaetiqueta HTML o un archivo de verificación

---

## 2. Verificar el dominio

Opción A — Meta tag (más fácil): añade en el `<head>` de tu index.html:
```html
<meta name="google-site-verification" content="TU_CODIGO_AQUI" />
```

Opción B — Google Tag Manager (si ya lo tienes instalado).

---

## 3. Registrar el feed de productos

1. En Merchant Center: **Productos → Fuentes de datos → Añadir fuente principal**
2. Tipo de fuente: **Feed programado (URL)**
3. Rellena:
   - Nombre: `Eros y Afrodita - Feed principal`
   - País de destino: `España`
   - Idioma: `Español`
   - URL del feed: `https://api.erosyafrodita.com/api/feed/google-shopping`
   - Frecuencia de actualización: **Diaria** (a las 6:00 AM)
4. Guarda y haz clic en **Obtener feed ahora** para la primera carga

---

## 4. Configurar envío (política de envío)

En Merchant Center: **Herramientas → Envío y devoluciones**
- Nombre: `Envío España`
- País: `España`
- Envío gratuito para pedidos >= 30€
- Envío estándar 3,99€ para pedidos < 30€
- Tiempo de entrega: 1-3 días laborables

> ⚠️ Aunque el feed ya incluye los datos de envío (`g:shipping`), configurarlo
> también en Merchant Center mejora la validación y evita warnings.

---

## 5. Activar Google Shopping Ads

Una vez aprobados los productos (24-72h):
1. Ve a **Google Ads** → **Nueva campaña**
2. Tipo: **Shopping** (o Performance Max)
3. Vincula tu cuenta de Merchant Center
4. Presupuesto inicial recomendado: **5-10€/día**
5. Prioridad de campaña: estándar

---

## 6. Comparadores adicionales (feeds CSV)

| Comparador | Feed URL | Portal de registro |
|---|---|---|
| Kelkoo | `/api/feed/kelkoo` | [merchants.kelkoo.es](https://merchants.kelkoo.es) |
| Pricero | `/api/feed/pricero` | [pricero.com/merchants](https://www.pricero.com/merchants) |
| Shopmania | `/api/feed/shopmania` | [shopmania.es/merchant](https://www.shopmania.es/merchant) |
| Idealo | API directa | Ya configurado vía `IdealoController` |

---

## 7. Verificar el estado del feed

```bash
# Ver info de todos los feeds
curl https://api.erosyafrodita.com/api/feed/info

# Ver el feed de Google Shopping (XML)
curl https://api.erosyafrodita.com/api/feed/google-shopping

# Forzar regeneración del feed (tras actualizar precios)
curl -X POST https://api.erosyafrodita.com/api/feed/google-shopping/refresh
```

---

## 8. Campos que mejoran la visibilidad

Cuando tengas EAN/GTIN de los productos, añádelos en la BD (`ean` column).
Google prioriza productos con GTIN — pueden aparecer junto a otros vendedores
del mismo producto con comparativa de precios, lo que aumenta el CTR significativamente.

Sin GTIN (campo `identifier_exists: no`), los productos aparecen igualmente
pero con menor prioridad en algunas categorías.
