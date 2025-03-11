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
      '/validate': {
        target: 'http://localhost:3005',
        changeOrigin: true,
        secure: false
      },
      '/health': {
        target: 'http://localhost:3005',
        changeOrigin: true,
        secure: false
      },
      '/xsd-tree': {
        target: 'http://localhost:3005',
        changeOrigin: true,
        secure: false
      },
      '/xsd-content': {
        target: 'http://localhost:3005',
        changeOrigin: true,
        secure: false
      }
    }
  }
});