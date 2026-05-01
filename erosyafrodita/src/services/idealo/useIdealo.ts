import { useState, useCallback } from 'react';
import { IdealoSyncService, ProductoErosAfrodita, ConfiguracionEnvio } from './sync';

interface UseIdealoReturn {
  sincronizarProducto: (producto: ProductoErosAfrodita, costosEnvio?: ConfiguracionEnvio[]) => Promise<void>;
  actualizarPrecioStock: (sku: string, precio: number, stock: number, disponible: boolean) => Promise<void>;
  eliminarProducto: (sku: string) => Promise<void>;
  verificarConexion: () => Promise<boolean>;
  loading: boolean;
  error: string | null;
}

export function useIdealo(): UseIdealoReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const service = new IdealoSyncService();

  const sincronizarProducto = useCallback(async (
    producto: ProductoErosAfrodita,
    costosEnvio?: ConfiguracionEnvio[]
  ) => {
    setLoading(true);
    setError(null);
    try {
      await service.sincronizarProducto(producto, costosEnvio);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [service]);

  const actualizarPrecioStock = useCallback(async (
    sku: string,
    precio: number,
    stock: number,
    disponible: boolean
  ) => {
    setLoading(true);
    setError(null);
    try {
      await service.actualizarPrecioStock(sku, precio, stock, disponible);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [service]);

  const eliminarProducto = useCallback(async (sku: string) => {
    setLoading(true);
    setError(null);
    try {
      await service.eliminarProducto(sku);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [service]);

  const verificarConexion = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const conectado = await service.verificarConexion();
      return conectado;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
      return false;
    } finally {
      setLoading(false);
    }
  }, [service]);

  return {
    sincronizarProducto,
    actualizarPrecioStock,
    eliminarProducto,
    verificarConexion,
    loading,
    error,
  };
}