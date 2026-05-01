# Integración Idealo Partner Web Service 2.0

Módulo de integración con Idealo para sincronizar productos de Eros y Afrodita.

## Instalación

El módulo ya está incluido en el proyecto. No requiere instalación adicional.

## Configuración

### Credenciales

Las credenciales de Idealo ya están configuradas en el componente `IdealoSync.tsx`:

```typescript
const CREDENTIALS = {
  clientId: 'dedcb69e-56d1-4631-8bbe-53dd8523e2da',
  clientSecret: ',iIEg$uAn%Ejjc6kPl!Fi',
};
```

**IMPORTANTE:** En producción, mueve estas credenciales a variables de entorno:

```env
VITE_IDEALO_CLIENT_ID=dedcb69e-56d1-4631-8bbe-53dd8523e2da
VITE_IDEALO_CLIENT_SECRET=tu_secreto
```

## Uso

### Hook useIdealo

```typescript
import { useIdealo, ProductoErosAfrodita } from '../services/idealo';

const { sincronizarProducto, actualizarPrecioStock, eliminarProducto, verificarConexion, loading, error } = useIdealo({
  clientId: 'tu_client_id',
  clientSecret: 'tu_client_secret',
});

// Sincronizar un producto
const producto: ProductoErosAfrodita = {
  id: 'SKU-001',
  nombre: 'Nombre del producto',
  precio: 29.99,
  iva: 21,
  descripcion: 'Descripción del producto',
  imagenes: ['https://tuweb.com/img/producto.jpg'],
  categoria: 'Categoría > Subcategoría',
  marca: 'Tu Marca',
  stock: 10,
  disponible: true,
  url: 'https://tuweb.com/producto/sku-001',
};

await sincronizarProducto(producto);

// Actualizar precio y stock
await actualizarPrecioStock('SKU-001', 24.99, 5, true);

// Eliminar producto
await eliminarProducto('SKU-001');
```

### Servicio Directo

```typescript
import { IdealoSyncService } from '../services/idealo';

const service = new IdealoSyncService({
  clientId: 'tu_client_id',
  clientSecret: 'tu_client_secret',
});

// Sincronizar
await service.sincronizarProducto(producto);

// Verificar conexión
const conectado = await service.verificarConexion();
```

## API de Idealo

### Endpoints Disponibles

- **GET** `/shop/{shopId}/offer/{sku}` - Obtener oferta
- **PUT** `/shop/{shopId}/offer/{sku}` - Crear/actualizar oferta
- **PATCH** `/shop/{shopId}/offer/{sku}` - Actualizar parcialmente
- **DELETE** `/shop/{shopId}/offer/{sku}` - Eliminar oferta
- **DELETE** `/shop/{shopId}/offer` - Eliminar todas las ofertas

### Campos de Oferta

| Campo | Tipo | Requerido | Descripción |
|-------|------|-----------|-------------|
| sku | string | Sí | Identificador único |
| title | string | No | Título del producto |
| price | number | No | Precio |
| url | string | No | URL del producto |
| availability | string | No | INSTOCK/OUTOFSTOCK |
| eans | string[] | No | Códigos EAN |
| categoryPath | string | No | Ruta de categoría |
| brand | string | No | Marca |
| description | string | No | Descripción |
| imageUrls | string[] | No | Imágenes |
| color | string | No | Color |
| size | string | No | Talla |
| material | string | No | Material |
| gender | string | No | Género |
| condition | string | No | NEW/USED/REFURBISHED |

## Tipos de Disponibilidad

- `INSTOCK` - En stock
- `OUTOFSTOCK` - Sin stock
- `UNKNOWN` - Desconocido

## Manejo de Errores

El módulo incluye manejo de errores para:
- Errores de autenticación (401)
- Errores de validación (400)
- Límites de rate (429)
- Errores del servidor (500)

## Rate Limits

- Límite por minuto según configuración de Idealo
- El token se refresca automáticamente

## Seguridad

⚠️ **Nunca commitees las credenciales a git.** Usa variables de entorno en producción.
