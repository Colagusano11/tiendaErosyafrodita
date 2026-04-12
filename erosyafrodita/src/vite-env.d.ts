/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // añade aquí otras VITE_... si las usas
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
