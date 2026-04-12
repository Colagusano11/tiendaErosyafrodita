import api from './axios';

export interface UserProfile {
  id: number;
  email: string;
  name: string;
  apellidos: string;
  phone?: string;
  avatarUrl?: string;
  pais?: string;
  provincia?: string;
  codigoPostal?: string;
  direccionPrimaria?: string;
  direccionSecundaria?: string;
  fechaNacimiento?: string;
  numero?: string;
  escalera?: string;
  piso?: string;
  puerta?: string;
  poblacion?: string;
  admin?: boolean;
}

export const userService = {
  getAllUsers: async () => {
    const response = await api.get<UserProfile[]>('/usuarios');
    return response.data;
  },

  getUserProfile: async (email: string) => {
    const response = await api.get<UserProfile>(`/usuarios/${email}`);
    return response.data;
  },

  updateUserProfile: async (email: string, data: UserProfile) => {
    const response = await api.put<UserProfile>(`/usuarios/${email}`, data);
    return response.data;
  },

  changePassword: async (email: string, oldPassword: string, newPassword: string) => {
    await api.put(`/usuarios/${email}/password`, { oldPassword, newPassword });
  },

  deleteUser: async (email: string) => {
    await api.delete(`/usuarios/${email}`);
  }
};
