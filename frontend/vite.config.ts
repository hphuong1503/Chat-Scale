import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiUrl = env.VITE_API_URL || env.VITE_API_BASE_URL || 'http://localhost:8000';
  const wsUrl = env.VITE_WS_URL || env.VITE_WS_BASE_URL || 'ws://localhost:8000';

  return {
    plugins: [react()],
    server: {
      port: 5173,
      proxy: {
        '/auth': {
          target: apiUrl,
          changeOrigin: true,
        },
        '/rooms': {
          target: apiUrl,
          changeOrigin: true,
        },
        '/messages': {
          target: apiUrl,
          changeOrigin: true,
        },
        '/ws': {
          target: wsUrl,
          ws: true,
          changeOrigin: true,
        },
      },
    },
  };
});
