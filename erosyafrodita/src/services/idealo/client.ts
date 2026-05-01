import { IdealoOffer } from './types';

const API_URL = import.meta.env.VITE_API_URL || '/api';

export class IdealoClient {
  /**
   * Obtiene una oferta por SKU
   */
  async getOffer(sku: string): Promise<IdealoOffer | null> {
    try {
      const response = await fetch(`${API_URL}/idealo/offer/${sku}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Error al obtener oferta: ${error.message || error.error}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Error al obtener oferta ${sku}:`, error);
      throw error;
    }
  }

  /**
   * Crea o actualiza una oferta (PUT)
   */
  async putOffer(offer: IdealoOffer): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/idealo/offer/${offer.sku}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(offer),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Error al crear/actualizar oferta: ${error.message || error.error}`);
      }
    } catch (error) {
      console.error(`Error al crear/actualizar oferta ${offer.sku}:`, error);
      throw error;
    }
  }

  /**
   * Actualiza parcialmente una oferta (PATCH)
   */
  async patchOffer(sku: string, partialOffer: Partial<IdealoOffer>): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/idealo/offer/${sku}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(partialOffer),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Error al actualizar oferta: ${error.message || error.error}`);
      }
    } catch (error) {
      console.error(`Error al actualizar oferta ${sku}:`, error);
      throw error;
    }
  }

  /**
   * Elimina una oferta
   */
  async deleteOffer(sku: string): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/idealo/offer/${sku}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Error al eliminar oferta: ${error.message || error.error}`);
      }
    } catch (error) {
      console.error(`Error al eliminar oferta ${sku}:`, error);
      throw error;
    }
  }

  /**
   * Elimina todas las ofertas
   */
  async deleteAllOffers(): Promise<void> {
    try {
      const response = await fetch(`${API_URL}/idealo/offer`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(`Error al eliminar ofertas: ${error.message || error.error}`);
      }
    } catch (error) {
      console.error('Error al eliminar todas las ofertas:', error);
      throw error;
    }
  }
}