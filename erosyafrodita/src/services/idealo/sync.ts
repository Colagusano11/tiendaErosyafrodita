import { IdealoOffer, DeliveryCost } from './types';
import { IdealoAuthService } from './auth';
import { IdealoClient } from './client';

export interface ProductoErosAfrodita {
  id: string;
  nombre: string;
  precio: number;
  precioBase?: number;
  iva: number;
  descripcion: string;
  imagenes: string[];
  categoria: string;
  marca: string;
  stock: number;
  disponible: boolean;
  url: string;
  ean?: string;
  peso?: string;
  color?: string;
  talla?: string;
  material?: string;
  genero?: string;
  condicion?: string;
}

export interface ConfiguracionEnvio {
  pais: string;
  costo: number;
}

export class IdealoSyncService {
  private client: IdealoClient;
  private authService: IdealoAuthService;

  constructor() {
    this.authService = new IdealoAuthService();
    this.client = new IdealoClient();
  }

  /**
   * Convierte un producto de Eros y Afrodita a formato Idealo
   */
  private convertirAOferta(
    producto: ProductoErosAfrodita,
    costosEnvio: ConfiguracionEnvio[] = []
  ): IdealoOffer {
    const deliveryCosts: DeliveryCost[] = costosEnvio.map(envio => ({
      country: envio.pais,
      cost: envio.costo,
    }));

    return {
      sku: producto.id,
      title: producto.nombre,
      price: producto.precio,
      url: producto.url,
      basePrice: producto.precioBase || producto.precio,
      vat: producto.iva,
      deliveryCosts: deliveryCosts.length > 0 ? deliveryCosts : undefined,
      availability: producto.disponible && producto.stock > 0 ? 'INSTOCK' : 'OUTOFSTOCK',
      eans: producto.ean ? [producto.ean] : undefined,
      categoryPath: producto.categoria,
      brand: producto.marca,
      description: producto.descripcion,
      imageUrls: producto.imagenes,
      color: producto.color,
      size: producto.talla,
      material: producto.material,
      gender: producto.genero,
      condition: producto.condicion || 'NEW',
      weight: producto.peso,
    };
  }

  /**
   * Sincroniza un producto con Idealo
   */
  async sincronizarProducto(
    producto: ProductoErosAfrodita,
    costosEnvio?: ConfiguracionEnvio[]
  ): Promise<void> {
    try {
      const oferta = this.convertirAOferta(producto, costosEnvio);
      await this.client.putOffer(oferta);
      console.log(`✅ Producto ${producto.id} sincronizado con Idealo`);
    } catch (error) {
      console.error(`❌ Error al sincronizar producto ${producto.id}:`, error);
      throw error;
    }
  }

  /**
   * Actualiza solo el precio y stock de un producto
   */
  async actualizarPrecioStock(
    sku: string,
    precio: number,
    stock: number,
    disponible: boolean
  ): Promise<void> {
    try {
      await this.client.patchOffer(sku, {
        price: precio,
        availability: disponible && stock > 0 ? 'INSTOCK' : 'OUTOFSTOCK',
      });
      console.log(`💰 Precio/stock actualizado para ${sku}`);
    } catch (error) {
      console.error(`❌ Error al actualizar precio/stock de ${sku}:`, error);
      throw error;
    }
  }

  /**
   * Elimina un producto de Idealo
   */
  async eliminarProducto(sku: string): Promise<void> {
    try {
      await this.client.deleteOffer(sku);
      console.log(`🗑️ Producto ${sku} eliminado de Idealo`);
    } catch (error) {
      console.error(`❌ Error al eliminar producto ${sku}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene información de un producto en Idealo
   */
  async obtenerOferta(sku: string): Promise<IdealoOffer | null> {
    try {
      return await this.client.getOffer(sku);
    } catch (error) {
      console.error(`❌ Error al obtener oferta ${sku}:`, error);
      throw error;
    }
  }

  /**
   * Verifica si la conexión con Idealo está funcionando
   */
  async verificarConexion(): Promise<boolean> {
    try {
      const status = await this.authService.checkStatus();
      return status.status === 'connected';
    } catch (error) {
      console.error('❌ Error de conexión con Idealo:', error);
      return false;
    }
  }
}