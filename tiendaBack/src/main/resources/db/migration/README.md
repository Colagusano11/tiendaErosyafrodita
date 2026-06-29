# Migraciones Flyway — tienda_db

## Convención de nombres

```
V{version}__{descripcion_snake_case}.sql
```

Ejemplos:
- `V1__schema_inicial.sql` — Schema base (todas las tablas)
- `V2__indices_rendimiento.sql` — Índices de rendimiento  
- `V3__add_column_producto_slug.sql` — Añadir columna slug a producto
- `V4__tabla_newsletter.sql` — Nueva tabla para suscriptores email

## Reglas importantes

1. **NUNCA modificar** un script ya aplicado en producción — Flyway lo detecta por checksum y falla el arranque
2. **Siempre crear un nuevo archivo** `V{N+1}__...sql` para cada cambio
3. Los scripts deben ser **idempotentes** cuando sea posible (`CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`)
4. En local para desarrollo, puedes usar `spring.flyway.clean-on-validation-error=true`, pero **nunca en producción**

## Cómo añadir una nueva migración

```bash
# 1. Crear el archivo con el siguiente número de versión
touch tiendaBack/src/main/resources/db/migration/V3__mi_cambio.sql

# 2. Escribir el SQL
# 3. Commit y push
# 4. En el próximo arranque del backend, Flyway lo aplica automáticamente
```

## Estado de migraciones aplicadas

Consultar en BD:
```sql
SELECT version, description, success, installed_on 
FROM tienda_db.flyway_schema_history 
ORDER BY installed_rank;
```
