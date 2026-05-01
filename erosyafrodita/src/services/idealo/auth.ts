import { IdealoAuthToken } from './types';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export class IdealoAuthService {
  private token: IdealoAuthToken | null = null;
  private tokenExpiry: number = 0;

  /**
   * Verifica si el token está vigente
   */
  isTokenValid(): boolean {
    return !!this.token && Date.now() < this.tokenExpiry;
  }

  /**
   * Obtiene el estado de la conexión desde el backend
   */
  async checkStatus(): Promise<{ status: string; shopId: string }> {
    const response = await fetch(`${API_URL}/idealo/status`);
    if (!response.ok) {
      throw new Error('Error al verificar estado de Idealo');
    }
    return await response.json();
  }
}