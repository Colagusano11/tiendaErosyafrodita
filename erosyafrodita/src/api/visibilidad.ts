import api from "./axios";

export interface GoogleShoppingStatus {
  ultimaGeneracion: string;
  bytes: number;
  kb: number;
  feedUrl: string;
}

export interface FeedInfo {
  totalProductos: number;
  feeds: {
    googleShopping: { url: string; formato: string; registrarEn: string; actualizacion: string };
    kelkoo:         { url: string; formato: string; registrarEn: string; actualizacion: string };
    pricero:        { url: string; formato: string; registrarEn: string; actualizacion: string };
    shopmania:      { url: string; formato: string; registrarEn: string; actualizacion: string };
    idealo:         { url: string; formato: string; descripcion: string };
  };
}

export interface RefreshResult {
  ok: boolean;
  generadoEn: string;
  bytes: number;
}

export async function getGoogleShoppingStatus(): Promise<GoogleShoppingStatus> {
  const res = await api.get<GoogleShoppingStatus>("/feeds/google-shopping/status");
  return res.data;
}

export async function refreshGoogleShoppingFeed(): Promise<RefreshResult> {
  const res = await api.post<RefreshResult>("/feeds/google-shopping/refresh");
  return res.data;
}

export async function getFeedInfo(): Promise<FeedInfo> {
  const res = await api.get<FeedInfo>("/feed/info");
  return res.data;
}
