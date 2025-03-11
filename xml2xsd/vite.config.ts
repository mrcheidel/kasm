import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  base: '/iso20022/',
  plugins: [react()],
  optimizeDeps: {
    exclude: ['libxmljs'],
  },
  server: {
    host: true, // Add this to listen on all network interfaces
    cors: true,
    allowedHosts: true,
    proxy: {
      '/iso200200/api/validate': {
        target: 'https://localhost:3005',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      },
      '/iso200200/api/iso20022/health': {
        target: 'http://localhost:3005',
        changeOrigin: true,
        secure: false
      },
      '/iso200200/api/xsd-tree': {
        target: 'http://localhost:3005',
        changeOrigin: true,
        secure: false
      },
      '/iso200200/api/xsd-content': {
        target: 'http://localhost:3005',
        changeOrigin: true,
        secure: false
      }
    }
  }
});