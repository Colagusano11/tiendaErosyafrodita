import api from './axios';

export interface AuthResponse {
  email: string;
  token: string;
  name?: string;
  apellidos?: string;
  admin: boolean;
}

export interface RegisterData {
  name: string;
  apellidos: string;
  email: string;
  password?: string;
}

export const authService = {
  login: async (credentials: any) => {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  register: async (userData: RegisterData) => {
    const response = await api.post<any>('/usuarios/registro', userData);
    return response.data;
  },

  verifyCode: async (email: string, codigo: string) => {
    const response = await api.post<string>('/auth/verificar-codigo', { email, codigo });
    return response.data;
  },

  resendCode: async (email: string) => {
    const response = await api.post<string>('/auth/resend-code', { email });
    return response.data;
  },

  forgotPassword: async (email: string) => {
    const response = await api.post<string>('/auth/forgot-password', { email });
    return response.data;
  },

  resetPassword: async (data: { email: string, codigo: string, nuevaPass: string }) => {
    const response = await api.post<string>('/auth/reset-password', data);
    return response.data;
  }
};
