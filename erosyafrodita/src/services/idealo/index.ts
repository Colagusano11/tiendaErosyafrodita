// Servicio de integración con Idealo Partner Web Service 2.0
export { IdealoAuthService } from './auth';
export { IdealoClient } from './client';
export { IdealoSyncService, ProductoErosAfrodita, ConfiguracionEnvio } from './sync';
export { useIdealo } from './useIdealo';
export * from './types';

// Configuración por defecto
export const IDEALO_CONFIG = {
  AUTH_URL: 'https://api.idealo.com/mer/businessaccount/api/v1/oauth/token',
  API_BASE_URL: 'https://import.idealo.com',
  DEFAULT_TOKEN_EXPIRY: 3600, // segundos
};
