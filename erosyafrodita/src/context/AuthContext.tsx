import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, RegisterData } from '../api/authService';

interface AuthContextType {
  user: string | null;
  token: string | null;
  name: string | null;
  apellidos: string | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  login: (credentials: any) => Promise<void>;
  register: (userData: RegisterData) => Promise<any>;
  verify: (email: string, code: string) => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (email: string, code: string, newPass: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Cambiamos localStorage por sessionStorage para que la sesión expire al cerrar la pestaña/navegador
  const [user, setUser] = useState<string | null>(sessionStorage.getItem('user'));
  const [token, setToken] = useState<string | null>(sessionStorage.getItem('token'));
  const [name, setName] = useState<string | null>(sessionStorage.getItem('userName'));
  const [apellidos, setApellidos] = useState<string | null>(sessionStorage.getItem('userApellidos'));
  const [isAdmin, setIsAdmin] = useState<boolean>(
    sessionStorage.getItem('isAdmin') === 'true' || sessionStorage.getItem('user') === 'erosyafrodita.com@gmail.com'
  );
  const [loading, setLoading] = useState(false);

  // --- LÓGICA DE AUTO-LOGOUT POR INACTIVIDAD ---
  useEffect(() => {
    if (!token) return;

    let timeoutId: any;
    const INACTIVITY_TIME = 30 * 60 * 1000; // 30 minutos

    const resetTimer = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        console.log("⏱️ Sesión expirada por inactividad");
        logout();
      }, INACTIVITY_TIME);
    };

    // Eventos que resetean el contador
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart', 'mousemove'];
    events.forEach(event => document.addEventListener(event, resetTimer));

    // Iniciamos el contador
    resetTimer();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      events.forEach(event => document.removeEventListener(event, resetTimer));
    };
  }, [token]);

  const login = async (credentials: any) => {
    setLoading(true);
    try {
      const data = await authService.login(credentials);
      console.log("🔐 Autenticación exitosa (Sesión Volátil). Payload:", data);
      
      const isUserAdmin = !!data.admin || data.email === 'erosyafrodita.com@gmail.com';

      setUser(data.email);
      setToken(data.token);
      setName(data.name || null);
      setApellidos(data.apellidos || null);
      setIsAdmin(isUserAdmin);
      
      sessionStorage.setItem('user', data.email);
      sessionStorage.setItem('token', data.token);
      sessionStorage.setItem('isAdmin', String(isUserAdmin));
      if (data.name) sessionStorage.setItem('userName', data.name);
      if (data.apellidos) sessionStorage.setItem('userApellidos', data.apellidos);
    } catch (error) {
      console.error("❌ Error en Login:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    setLoading(true);
    try {
      return await authService.register(userData);
    } finally {
      setLoading(false);
    }
  };

  const verify = async (email: string, code: string) => {
    setLoading(true);
    try {
      await authService.verifyCode(email, code);
    } finally {
      setLoading(false);
    }
  };

  const forgotPassword = async (email: string) => {
    setLoading(true);
    try {
      await authService.forgotPassword(email);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (email: string, code: string, newPass: string) => {
    setLoading(true);
    try {
      await authService.resetPassword({ email, codigo: code, nuevaPass: newPass });
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    setName(null);
    setApellidos(null);
    setIsAdmin(false);
    sessionStorage.removeItem('user');
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('userName');
    sessionStorage.removeItem('userApellidos');
    sessionStorage.removeItem('isAdmin');
    // Limpieza de seguridad por si queda rastro en local antiguo
    localStorage.clear();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        name,
        apellidos,
        isAdmin,
        isAuthenticated: !!token,
        login,
        register,
        verify,
        forgotPassword,
        resetPassword,
        logout,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
