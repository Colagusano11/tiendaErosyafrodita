import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      allowedHosts: ['erosyafrodita.com', 'www.erosyafrodita.com'],
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:8082',
          changeOrigin: true,
          rewrite: (path: string) => path.replace(/^\/api/, '/api'),
        },
      },
    },
    plugins: [react()],
    define: {
      // Lo que ya tenías
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      // Si quisieras exponer también la API del back vía process.env (no es obligatorio):
      // 'process.env.API_URL': JSON.stringify(env.VITE_API_URL),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-utils': ['axios', 'framer-motion', 'lucide-react'],
          },
        },
      },
      chunkSizeWarningLimit: 600,
    },
  };
});
