import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 8080,
    proxy: {
      '/api': 'http://localhost:3001', // Make sure this matches your backend port
      '/sentinel-auth': {
        target: 'https://services.sentinel-hub.com',
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/sentinel-auth/, ''),
      },
      '/sentinel-api': {
        target: 'https://services.sentinel-hub.com',
        changeOrigin: true,
        rewrite: (path: string) => path.replace(/^\/sentinel-api/, ''),
      },
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});
