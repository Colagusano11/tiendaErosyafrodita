import api from './axios';

export interface SuscripcionStockRequest {
    email: string;
    productoId: number;
}

export async function suscribirAvisoStock(body: SuscripcionStockRequest): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/avisos-stock/suscribir', body);
    return response.data;
}
