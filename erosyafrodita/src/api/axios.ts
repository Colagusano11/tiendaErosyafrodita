import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para añadir el token en cada petición
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores globales (ej: token expirado)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("🚫 Sesión expirada o no autorizada. Redirigiendo a login...");
      sessionStorage.clear();
      if (!window.location.hash.includes('/login')) {
        window.location.href = '/#/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
