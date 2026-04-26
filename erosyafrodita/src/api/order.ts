import api from './axios'; // usa el interceptor que añade Bearer token automáticamente

export interface PedidoRequest {
  nombre: string;
  apellidos: string;
  calle: string;
  ciudad: string;
  codigoPostal: string;
  provincia: string;
  telefono: string;
  pais: string;
  descuento?: number; // 0..1 — ej. 0.10 para -10% de lanzamiento
  email?: string;
  items?: { productoId: number; cantidad: number }[];
}

export interface PedidoProductoSalida {
  idProducto: number;
  nombreProducto: string;
  imagen: string | null;
  sku: string | null;
  ean: string | null;
  precioUnitario: number;
  precioPVP: number;
  cantidad: number;
  precioTotalLinea: number;
  distribuidor?: 'BTS' | 'NAYPES' | 'NOVAENGEL';
}

export type PedidoEstado =
  | 'PENDIENTE'
  | 'RECIBIDO'
  | 'ENVIADO'
  | 'CANCELADO'
  | 'ENTREGADO'
  | 'DEVOLUCION_SOLICITADA'
  | 'DEVUELTO'
  | 'PENDIENTE_DE_PAGO'
  | 'PAGADO';

export interface PedidoSalida {
  idPedido: number;
  fechaCreacion: string;
  total: number;
  estado: PedidoEstado;
  productos: PedidoProductoSalida[];
  numSeguimiento?: string;
  urlSeguimiento?: string;
  pedidoProveedorId?: string;
  estadoProveedor?: string;
  // Campos de envío desglosados
  nombre: string;
  apellidos: string;
  calle: string;
  ciudad: string;
  codigoPostal: string;
  provincia: string;
  telefono: string;
  pais: string;
  email: string;
  paymentId?: string;
  usuarioId?: number;
}

export async function crearPedido(body: PedidoRequest): Promise<PedidoSalida> {
  const response = await api.post<PedidoSalida>('/pedidos', body);
  return response.data;
}

export async function getPedidoById(id: number): Promise<PedidoSalida> {
  const response = await api.get<PedidoSalida>(`/pedidos/${id}`);
  return response.data;
}

export async function getHistorial(): Promise<PedidoSalida[]> {
  const response = await api.get<PedidoSalida[]>('/pedidos/historial');
  return response.data;
}

export async function cancelarPedido(id: number): Promise<void> {
  await api.post(`/pedidos/${id}/cancelado`);
}

export async function getAllPedidos(): Promise<PedidoSalida[]> {
  const response = await api.get<PedidoSalida[]>('/pedidos');
  return response.data;
}

export async function updateOrderStatus(id: number, estado: PedidoEstado): Promise<void> {
    await api.put(`/pedidos/${id}/estado`, { estado });
}

export async function updateOrderTracking(id: number, numSeguimiento: string, urlSeguimiento: string): Promise<void> {
    await api.put(`/pedidos/${id}/tracking`, { numSeguimiento, urlSeguimiento });
}

export interface PushProviderRequest {
    distribuidor: 'BTS' | 'NOVAENGEL';
    manualSelections?: Record<string, number>;
    nombre: string;
    apellidos: string;
    calle: string;
    ciudad: string;
    codigoPostal: string;
    provincia: string;
    telefono: string;
    pais: string;
}

export async function pushOrderToProvider(id: number, data: PushProviderRequest): Promise<void> {
    await api.post(`/pedidos/${id}/push-proveedor`, data);
}

export async function getProductoOpciones(ean: string): Promise<any[]> {
    const response = await api.get<any[]>(`/productos/ean/${ean}/opciones`);
    return response.data;
}

export async function syncOrderTracking(id: number): Promise<void> {
    await api.post(`/pedidos/${id}/sync-tracking`);
}

export interface TrackingInfo {
    numSeguimiento?: string;
    urlSeguimiento?: string;
    estadoProveedor?: string;
}

export async function checkOrderTracking(id: number): Promise<TrackingInfo> {
    const response = await api.get<TrackingInfo>(`/pedidos/${id}/check-tracking`);
    return response.data;
}

export interface PaymentInitResponse {
    paymentUrl: string;
    paymentId: string;
}

export async function iniciarPago(id: number, gateway: string = 'revolut'): Promise<PaymentInitResponse> {
    const response = await api.post<PaymentInitResponse>(`/pedidos/${id}/pago/revolut`, null, {
        params: { gateway }
    });
    return response.data;
}

export async function deletePedidoCompleto(id: number): Promise<void> {
    await api.delete(`/pedidos/${id}`);
}

export async function confirmarPago(paymentId: string): Promise<void> {
    await api.post(`/pedidos/pago/confirmar`, { paymentId });
}

export async function rastrearPedido(id: number, email: string): Promise<PedidoSalida> {
  const response = await api.get<PedidoSalida>(`/pedidos/rastrear`, {
    params: { id, email }
  });
  return response.data;
}
