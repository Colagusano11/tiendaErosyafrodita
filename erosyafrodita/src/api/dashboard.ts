import api from "./axios";

export interface DashboardStats {
    totalVentas: number;
    totalCoste: number;
    totalComisiones: number;
    totalEnvios: number;
    totalImpuestos: number;
    beneficioNeto: number;
    totalPedidos: number;
    pedidosValidos: number;
    margenMedio: number;
    pedidosPorEstado: Record<string, number>;
    ventasPorDia: Record<string, number>;
    beneficioPorDia: Record<string, number>;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
    const response = await api.get<DashboardStats>("/admin/dashboard/stats");
    return response.data;
};
