import api from "./axios";

export interface Resena {
  id: number;
  productoId: number;
  usuarioId: number;
  nombreUsuario: string;
  rating: number;
  comentario: string;
  fecha: string;
}

export interface ResenasSummary {
  resenas: Resena[];
  media: number;
  total: number;
}

export async function getResenas(productoId: number): Promise<ResenasSummary> {
  const res = await api.get<ResenasSummary>(`/resenas/producto/${productoId}`);
  return res.data;
}

export async function crearResena(
  productoId: number,
  rating: number,
  comentario: string
): Promise<Resena> {
  const res = await api.post<Resena>(`/resenas/producto/${productoId}`, { rating, comentario });
  return res.data;
}

export async function checkPurchaseStatus(productoId: number): Promise<boolean> {
  try {
    const res = await api.get<{ purchased: boolean }>(`/resenas/purchased/${productoId}`);
    return res.data.purchased;
  } catch {
    return false;
  }
}
