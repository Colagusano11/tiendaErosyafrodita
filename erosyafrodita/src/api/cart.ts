import api from './axios';
import type { Producto } from './products';

export interface CarritoSalidaItem {
  idProducto: number;
  nombreProducto: string;
  imagen: string | null;
  precioUnitario: number;
  cantidad: number;
  subtotal: number;
}

export interface CarritoSalida {
  items: CarritoSalidaItem[];
  total: number;
}

export interface CarritoRequest {
  idProducto: number;
  cantidad: number;
}

export async function apiGetCarrito(): Promise<CarritoSalida> {
  const response = await api.get<CarritoSalida>('/carrito');
  return response.data;
}

export async function apiAgregarAlCarrito(payload: CarritoRequest): Promise<CarritoSalida> {
  const response = await api.post<CarritoSalida>('/carrito/agregar', payload);
  return response.data;
}

export async function apiVaciarCarrito(): Promise<void> {
  await api.delete('/carrito/vaciar');
}

export async function apiEliminarProducto(idProducto: number): Promise<void> {
  await api.delete(`/carrito/eliminar/${idProducto}`);
}
