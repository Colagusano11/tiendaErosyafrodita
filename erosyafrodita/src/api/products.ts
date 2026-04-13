// src/api/products.ts
import api from "./axios";

export interface Producto {
  id: number;
  ean: string | null;
  sku: string | null;
  categoria: string | null;
  nombre: string;
  descripcion: string | null;
  precio: number;
  stock: number;
  imagen: string | null;
  imagen2: string | null;
  imagen3: string | null;
  imagen4: string | null;
  manufacturer: string | null;
  gender: string | null;
  precioPVP: number;
  distribuidor: string | null;
  activo: boolean;
  enOferta: boolean;
  nuevo: boolean;
  descuentoOferta: number;
  precioOferta: number;
  precioOriginal?: number;
  precioUnitario?: number;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  last: boolean;
  first: boolean;
  empty: boolean;
}

// Helpers
const transformProduct = (p: Producto): Producto => {
  if (p.imagen && p.imagen.includes("drop.novaengel.com")) {
    const baseUrl = import.meta.env.VITE_API_URL || "/api";
    p.imagen = `${baseUrl}/proxy-image?url=${encodeURIComponent(p.imagen)}`;
  }
  return p;
};

// Lista de productos
export async function getProductos(page = 0, size = 20, status?: string): Promise<PaginatedResponse<Producto>> {
  const url = status ? `/productos/filtro?page=${page}&size=${size}&status=${status}` : `/productos/filtro?page=${page}&size=${size}`;
  const res = await api.get<PaginatedResponse<Producto>>(url);
  res.data.content = res.data.content.map(transformProduct);
  return res.data;
}

export async function getFilteredIds(filtro: FiltroProductos & { status?: string }): Promise<number[]> {
  const params = new URLSearchParams();
  if (filtro.manufacturer) params.append("manufacturer", filtro.manufacturer);
  if (filtro.nombre) params.append("nombre", filtro.nombre);
  if (filtro.sku) params.append("sku", filtro.sku);
  if (filtro.distribuidor) params.append("distribuidor", filtro.distribuidor);
  if (filtro.categoria) params.append("categoria", filtro.categoria);
  if (filtro.status) params.append("status", filtro.status);
  if (filtro.minPrecio !== undefined) params.append("minPrecio", String(filtro.minPrecio));
  if (filtro.maxPrecio !== undefined) params.append("maxPrecio", String(filtro.maxPrecio));
  
  const res = await api.get<number[]>(`/productos/filtro/ids?${params.toString()}`);
  return res.data;
}

// Detalle por id
export async function getProductoById(id: number | string): Promise<Producto> {
  const res = await api.get<Producto>(`/productos/${id}`);
  return transformProduct(res.data);
}

// Filtros
export interface FiltroProductos {
  manufacturer?: string;
  nombre?: string;
  sku?: string;
  distribuidor?: string;
  rangoPrecio?: string;
  minPrecio?: number;
  maxPrecio?: number;
  gender?: string;
  categoria?: string;
  status?: string;
  orden?: string; // "precioAsc", "precioDesc", etc.
  page?: number;
  size?: number;
}

export async function filtrarProductos(
  filtro: FiltroProductos
): Promise<PaginatedResponse<Producto>> {
  const params = new URLSearchParams();

  if (filtro.manufacturer) params.append("manufacturer", filtro.manufacturer);
  if (filtro.nombre) params.append("nombre", filtro.nombre);
  if (filtro.rangoPrecio) params.append("rangoPrecio", filtro.rangoPrecio);
  if (filtro.minPrecio !== undefined)
    params.append("minPrecio", String(filtro.minPrecio));
  if (filtro.maxPrecio !== undefined)
    params.append("maxPrecio", String(filtro.maxPrecio));
  if (filtro.gender) params.append("gender", filtro.gender);
  if (filtro.categoria) params.append("categoria", filtro.categoria);
  if (filtro.status) params.append("status", filtro.status);
  if (filtro.sku) params.append("sku", filtro.sku);
  if (filtro.orden) params.append("orden", filtro.orden);
  if (filtro.page !== undefined) params.append("page", String(filtro.page));
  if (filtro.size !== undefined) params.append("size", String(filtro.size));
  if (filtro.distribuidor) params.append("distribuidor", filtro.distribuidor);
  
  const res = await api.get<PaginatedResponse<Producto>>(`/productos/filtro?${params.toString()}`);
  res.data.content = res.data.content.map(transformProduct);
  return res.data;
}

// === Métodos ADMIN ===

export async function createProducto(p: Partial<Producto>): Promise<Producto> {
  const res = await api.post<Producto>("/productos", p);
  return transformProduct(res.data);
}

export async function updateProducto(id: number, p: Partial<Producto>): Promise<Producto> {
  const res = await api.put<Producto>(`/productos/${id}`, p);
  return transformProduct(res.data);
}

export interface Configuracion {
  iva: number;
  margen: number;
  envio: number;
  comisionTarjeta: number;
  novedadesBrands?: string;
  recomendadosBrands?: string;
}

export async function updateBulkPricing(config: Configuracion, ids?: number[], distribuidor?: string): Promise<void> {
  await api.put("/productos/bulk-pricing", { config, ids, distribuidor });
}

export async function updateHomeConfig(novedades: string, recomendados: string): Promise<void> {
  await api.put("/productos/home-config", { novedades, recomendados });
}

export async function getConfiguracion(): Promise<Configuracion> {
  const res = await api.get<Configuracion>("/productos/config");
  return res.data;
}

export async function updateBulkStatus(ids: number[] | null, activo: boolean, filters?: FiltroProductos): Promise<void> {
  await api.put("/productos/bulk-status", { ids, activo, filters });
}

export async function deleteProducto(id: number): Promise<void> {
  await api.delete(`/productos/${id}`);
}

export async function syncWebImages(): Promise<void> {
  await api.post('/admin/import/web/images');
}

export async function syncAmazonImages(forceOverwrite = false): Promise<{ updated: number }> {
  const res = await api.post<{ updated: number }>(`/productos/admin/sync-images-amazon?forceOverwrite=${forceOverwrite}`);
  return res.data;
}

export async function updateBulkOffer(ids: number[] | null, enOferta: boolean, descuento: number, filters?: FiltroProductos): Promise<void> {
  await api.put("/productos/bulk-offer", { ids, enOferta, descuento, filters });
}

export async function syncCategories(): Promise<void> {
  await api.post('/admin/import/categories');
}

export async function getCategorias(): Promise<string[]> {
  const res = await api.get<string[]>('/productos/categorias');
  return res.data;
}

export async function getManufacturers(): Promise<string[]> {
  const res = await api.get<string[]>('/productos/marcas');
  return res.data;
}

export async function getDistribuidores(): Promise<string[]> {
  const res = await api.get<string[]>('/productos/proveedores');
  return res.data;
}

// === Variantes y Novedades ===

/**
 * Busca productos similares (variantes de tamaño)
 * Busca por marca y que el nombre empiece igual
 */
export async function getVariantes(producto: Producto): Promise<Producto[]> {
  if (!producto.manufacturer) return [];
  
  // Limpiamos el nombre de tamaños (ej: "Sauvage 100ml" -> "Sauvage")
  const nombreBase = producto.nombre.split(/\d+\s*ml/i)[0].trim();
  
  const res = await filtrarProductos({
    manufacturer: producto.manufacturer,
    nombre: nombreBase,
    size: 50,
    status: "ACTIVOS"
  });

  return res.content.filter(p => p.id !== producto.id);
}

/**
 * Obtiene los productos marcados como nuevos (Novedades)
 */
export async function getNuevos(page = 0, size = 10): Promise<PaginatedResponse<Producto>> {
  const res = await api.get<PaginatedResponse<Producto>>(`/productos/nuevos?page=${page}&size=${size}`);
  res.data.content = res.data.content.map(transformProduct);
  return res.data;
}
