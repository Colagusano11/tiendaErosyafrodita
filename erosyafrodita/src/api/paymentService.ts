import api from './axios';

export interface MetodoPago {
  id: number;
  nombreTitular: string;
  numeroEnmascarado: string;
  tipoTarjeta: string;
  mesExp: string;
  anioExp: string;
  principal: boolean;
}

export const paymentService = {
  getMetodos: async (email: string) => {
    const response = await api.get<MetodoPago[]>(`/usuarios/${email}/pagos`);
    return response.data;
  },
  
  agregarMetodo: async (email: string, data: Omit<MetodoPago, 'id'>) => {
    const response = await api.post<MetodoPago>(`/usuarios/${email}/pagos`, data);
    return response.data;
  },
  
  marcarPrincipal: async (email: string, id: number) => {
    const response = await api.put<MetodoPago>(`/usuarios/${email}/pagos/${id}/principal`);
    return response.data;
  },
  
  eliminarMetodo: async (email: string, id: number) => {
    await api.delete(`/usuarios/${email}/pagos/${id}`);
  }
};
