import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type SupportedLanguage = 'es' | 'en';
export const DEFAULT_LANGUAGE: SupportedLanguage = 'es';

const messages: Record<SupportedLanguage, Record<string, any>> = {
  es: {
    header: {
      searchPlaceholder: 'Encuentra tu esencia...',
      wishlist: 'Favoritos',
      cart: 'Carrito',
      admin: 'Administración',
      account: 'Cuenta',
      language: 'Idioma',
    },
    auth: {
      login: 'Iniciar sesión',
      profile: 'Perfil',
    },
    adminUsers: {
      title: 'Gestión de Clientes',
      subtitle: 'Control de Usuarios y Privilegios',
      totalUsers: 'Total de usuarios',
      admins: 'Administradores',
      customers: 'Clientes',
      viewDetails: 'Ver Detalles',
      confirmRoleChange: 'Cambiar Rol',
      changeToAdmin: '¿Estás seguro de hacer Administrador a {{email}}?',
      changeToClient: '¿Estás seguro de quitar permisos de Admin a {{email}}?',
      deleteUser: 'Eliminar Usuario',
      deleteUserConfirmation: '¿Estás seguro de eliminar permanentemente a {{email}}? Esta acción no se puede deshacer.',
      saveSuccess: 'Información de usuario guardada',
      saveError: 'No se pudo guardar el usuario',
      loadError: 'No se pudieron cargar los usuarios',
    },
    home: {
      demementoTitle: 'Dememento',
      demementoDescription: 'Una historia olfativa atrevida para espíritus libres y almas osadas.',
      demementoButton: 'Explorar Dememento',
    },
    alerts: {
      error: 'Error',
      success: 'Éxito',
      info: 'Atención',
    },
  },
  en: {
    header: {
      searchPlaceholder: 'Find your essence...',
      wishlist: 'Wishlist',
      cart: 'Cart',
      admin: 'Admin',
      account: 'Account',
      language: 'Language',
    },
    auth: {
      login: 'Login',
      profile: 'Profile',
    },
    adminUsers: {
      title: 'Customer Management',
      subtitle: 'Users and Privileges Control',
      totalUsers: 'Total users',
      admins: 'Administrators',
      customers: 'Customers',
      viewDetails: 'View Details',
      confirmRoleChange: 'Change Role',
      changeToAdmin: 'Are you sure you want to make {{email}} an administrator?',
      changeToClient: 'Are you sure you want to remove admin access from {{email}}?',
      deleteUser: 'Delete User',
      deleteUserConfirmation: 'Are you sure you want to permanently delete {{email}}? This action cannot be undone.',
      saveSuccess: 'User information saved',
      saveError: 'Unable to save user',
      loadError: 'Unable to load users',
    },
    home: {
      demementoTitle: 'Dememento',
      demementoDescription: 'A bold fragrance story for free spirits and daring souls.',
      demementoButton: 'Explore Dememento',
    },
    alerts: {
      error: 'Error',
      success: 'Success',
      info: 'Attention',
    },
  },
};

const LanguageContext = createContext<{
  language: SupportedLanguage;
  setLanguage: (value: SupportedLanguage) => void;
}>({
  language: DEFAULT_LANGUAGE,
  setLanguage: () => { },
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<SupportedLanguage>(DEFAULT_LANGUAGE);

  useEffect(() => {
    const persisted = window.localStorage.getItem('preferredLanguage') as SupportedLanguage | null;
    if (persisted && (persisted === 'es' || persisted === 'en')) {
      setLanguage(persisted);
      return;
    }

    const browserLang = window.navigator.language.slice(0, 2).toLowerCase();
    setLanguage(browserLang === 'en' ? 'en' : 'es');
  }, []);

  useEffect(() => {
    window.localStorage.setItem('preferredLanguage', language);
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

function resolveKey(path: string, locale: Record<string, any>): string | undefined {
  return path.split('.').reduce((current: any, segment) => {
    if (!current || typeof current !== 'object') return undefined;
    return current[segment];
  }, locale);
}

export const useTranslation = () => {
  const { language, setLanguage } = useContext(LanguageContext);

  const t = (key: string, values?: Record<string, string | number>): string => {
    const locale = messages[language] || messages[DEFAULT_LANGUAGE];
    let result = resolveKey(key, locale) || resolveKey(key, messages[DEFAULT_LANGUAGE]) || key;

    if (values) {
      Object.entries(values).forEach(([name, value]) => {
        result = result.replace(new RegExp(`{{${name}}}`, 'g'), String(value));
      });
    }

    return result;
  };

  return { t, language, setLanguage };
};
