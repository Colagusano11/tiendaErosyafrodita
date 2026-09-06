# Plan de integración con SellerKing

> Estado: **plan**, sin implementar. Auditoría realizada el 2026-08-07 sobre el estado real de ambos repos (`tiendaBack` y `SellerKingBackend`) antes de escribir nada de código.

## Objetivo

SellerKing pasa a ser el sistema de gestión de catálogo y pedidos para AGE Parfums:

- SellerKing decide qué productos se publican en la tienda, con qué precio de venta (PVP) y stock.
- Cuando entra un pedido en la tienda, tiene que llegar a SellerKing para su gestión (compra a proveedor, envío, etc.).
- El tracking generado en SellerKing debe reflejarse en la tienda y notificarse al cliente.

## Estado actual (lo que ya existe)

### tiendaBack — API interna ya construida

Commits: `725857f`, `614cd74`, `09ed565`, `160edfe`, `bae3941`, `15de5a9`.

Todo bajo `/api/internal/**`, protegido por `SellerKingApiKeyFilter` (header `Authorization: Bearer <key>`, comparado contra `sellerking.internal.api.key`). `SecurityConfig` tiene esas rutas en `permitAll()` — la autenticación real la hace el filtro de API key, no Spring Security/JWT.

| Endpoint | Método | Descripción |
|---|---|---|
| `/api/internal/products` | POST | Upsert de producto (busca por EAN, luego SKU). Body: `SellerKingProductRequestDto` (ean, sku, skuProveedor, nombre, descripcion, categoria, manufacturer, gender, **precioPVP** [obligatorio], stock, imagen 1-4, nuevo). Responde `{ webProductId, slug, accion }` con 201 (creado) o 200 (actualizado). |
| `/api/internal/products/{id}` | PUT | Igual que el POST pero contra un `webProductId` ya conocido (404 si no existe). |
| `/api/internal/products/{id}/stock` | PATCH | Body `{ stock }`. Solo toca stock, nada más. |
| `/api/internal/products/ping` | GET | Health-check `{status:"ok", service:"products"}`. |
| `/api/internal/orders` | GET | Lista pedidos en estado `PAGADO` o `RECIBIDO`. Devuelve `erosOrderId`, `numPedido` (`ERO-{año}-{id:05d}`), estado, email, envío completo, total, fecha y líneas (productoId, nombre, ean, cantidad, precioUnitario). Sin paginación ni filtro de fecha. |
| `/api/internal/orders/{id}/status` | POST | Body `{ "estado": "RECIBIDO" }`. Único valor permitido. `ENVIADO` se gestiona vía `/tracking`; `CANCELADO`/`ENTREGADO` los gestiona el admin de tiendaBack a mano — SellerKing no tiene permiso sobre esos estados. |
| `/api/internal/orders/{id}/tracking` | POST | Body `{ carrier, trackingNumber, trackingUrl }`. Pasa el pedido a `ENVIADO`, guarda los datos y **envía email al cliente automáticamente** (excepto si el email es `info@erosyafrodita.com`, usado para tests). |

Detalles de modelo relevantes:

- `Producto` tiene `precio` (coste interno) y `precioPVP` (venta). **SellerKing solo manda `precioPVP`**. El `precio` de coste solo se fija en el alta inicial (igual al PVP como valor temporal) y luego el backend lo ignora silenciosamente en updates posteriores — hay que respetar esto y no dar por hecho que actualizar `precioPVP` toca el coste.
- No hay campo `sellerKingProductId`/`externalId` en `Producto`. El id que SellerKing debe persistir como referencia externa es el `webProductId` que tiendaBack devuelve en la respuesta del POST.
- `PedidoSalidaInterna` es un DTO (record) interno del controller, no una entidad. El tracking vive como campos planos en `Pedido` (`numSeguimiento`, `urlSeguimiento`, `estadoProveedor`), no hay tabla `PedidoTracking` separada.

### SellerKingBackend — nada construido todavía para esta integración

- Sin referencias a "eros", "afrodita" ni "ageparfums" en el código.
- `MarketplaceType` (enum en `mcsv_suppliers.entity`) solo tiene `AMAZON` y `MIRAVIA`.
- Sin cliente HTTP, DTO, entidad ni scheduler apuntando a tiendaBack.

**Patrón ya existente y reutilizable** (visto en `mcsv_suppliers/miravia/`):

- `marketplacecenter/` — capa genérica: `MarketplaceCenterStore` (tenantId, name, type, accountName, sellerId, active, repricerActive, allowedStoreCodes).
- Cada canal concreto vive en su propio paquete (`entity/`, `repository/`, `controllers/`, `services/`, `config/`, `dto/`):
  - Entidad de credenciales con `@ManyToOne` a `MarketplaceCenterStore` (en Miravia: appKey/appSecret/accessToken/refreshToken, storeCode, minMarginPercent).
  - Tabla `*OrderLocal` (en Miravia: `MiraviaOrderLocal`) que vincula el pedido del canal externo con el pedido hecho al proveedor real: id externo único, flags de procesado/cancelado, tracking, referencia a `supplierOrderId`/`supplierName`.
  - Servicio con `@Scheduled` para sincronización periódica.
  - Multi-tenant vía `TenantAware` + filtro Hibernate por `tenant_id`.

## Cabos sueltos a resolver antes de conectar (Fase 0)

1. **`SELLERKING_INTERNAL_API_KEY` no está en `docker-compose.yml`**, solo hay un placeholder (`REEMPLAZAR_CON_API_KEY_REAL`) en `application.properties`. Generar una key real y añadirla al `.env`/compose de tiendaBack, y a la config de conexión en SellerKing.
2. Documentar explícitamente para el equipo de SellerKing: **no intentar sincronizar el coste (`precio`)**, solo `precioPVP` — el backend lo ignora tras el alta inicial, sin dar error.
3. (No bloqueante, pero relacionado) Bug encontrado en `SecurityConfig.java`: la regla `permitAll` de `/productos/**` y `/categorias/**` no tiene la variante con prefijo `/api/` que sí tienen el resto de reglas del fichero (pedidos, idealo, cupones...), lo que puede causar 403 en `GET /api/productos/filtro` según cómo llegue la petición (con o sin proxy que recorte `/api/`). Pendiente de decidir si se corrige ahora o se deja para cuando se toque `SecurityConfig` en la Fase 0.1 (mismo fichero que ya se está tocando para la API key de SellerKing).

## Fases de implementación

### Fase 1 — Módulo nuevo en SellerKingBackend

Calcado del patrón de `miravia/`:

- Nuevo valor `MarketplaceType.AGEPARFUMS` (o `OWN_STORE` si se prevé reutilizar para futuras tiendas propias).
- Módulo `mcsv_suppliers/ageparfums/`:
  - Entidad de conexión (URL base de tiendaBack + API key), análoga a `MiraviaStore`.
  - Cliente HTTP hacia `/api/internal/**` (products + orders).
  - DTOs espejo de los que ya expone tiendaBack (`SellerKingProductRequestDto`, `PedidoSalidaInterna`, request de tracking).
  - Tabla `AgeparfumsOrderLocal` (como `MiraviaOrderLocal`): `erosOrderId` (String — así lo persiste SellerKing y así lo espera tiendaBack en las URLs de tracking), estado local, tracking, vínculo con el pedido al proveedor.

### Fase 2 — Flujo de productos (SellerKing → tienda)

- Alta de los 10 productos iniciales vía `POST /api/internal/products`, uno por uno.
- Job `@Scheduled` para sincronizar stock periódicamente (`PATCH /stock`) cuando cambie en SellerKing.
- **Gap a decidir**: no existe endpoint para "despublicar" un producto en tiendaBack — hoy la única forma es bajar el stock a 0. Si se necesita ocultar el producto del todo (no solo "agotado"), habría que añadir un endpoint nuevo (`DELETE` o `PATCH activo=false`) en tiendaBack.

### Fase 3 — Flujo de pedidos (tienda → SellerKing)

- Job `@Scheduled` que hace `GET /api/internal/orders` cada X minutos, crea el pedido correspondiente en SellerKing y confirma con `POST /{id}/status {RECIBIDO}`.
- Al despachar en SellerKing, llamar a `POST /{id}/tracking` con transportista y nº de seguimiento — esto ya dispara el email al cliente automáticamente, no hace falta duplicar esa notificación desde SellerKing.
- **Gaps a decidir**:
  - `GET /orders` no pagina ni filtra por fecha — aceptable con el volumen inicial (10 pedidos), pero a revisar antes de escalar.
  - No hay forma de comunicar una cancelación desde SellerKing hacia tiendaBack (solo `RECIBIDO` está permitido en `/status`). Si un pedido no se puede servir, quedaría como tarea manual en el admin de tiendaBack hasta que se añada ese endpoint.

## Orden recomendado de trabajo

1. Fase 0 (API key real + documentar política de precio de coste).
2. Fase 1 (andamiaje del módulo en SellerKing, sin lógica de negocio aún — solo entidad + cliente HTTP + ping).
3. Fase 2 (alta de los 10 productos reales, validar en tienda).
4. Fase 3 (pedidos + tracking, probar con un pedido de test end-to-end).
5. Revisar los gaps marcados como "a decidir" según cómo vaya el uso real.
