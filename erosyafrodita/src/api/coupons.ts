// src/api/coupons.ts
import api from "./axios";

export interface Cupon {
  id?: number;
  nombre: string;
  codigo: string;
  porcentajeDescuento: number;
  fechaExpiracion: string;
  activo: boolean;
}

export async function getCupones(): Promise<Cupon[]> {
  const res = await api.get<Cupon[]>("/cupones");
  return res.data;
}

export async function createCupon(cupon: Cupon): Promise<Cupon> {
  const res = await api.post<Cupon>("/cupones", cupon);
  return res.data;
}

export async function deleteCupon(id: number): Promise<void> {
  await api.delete(`/cupones/${id}`);
}

export async function validarCupon(codigo: string): Promise<Cupon> {
  const res = await api.get<Cupon>(`/cupones/validar/${codigo}`);
  return res.data;
}
