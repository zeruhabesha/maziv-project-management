import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import type { IncomingMessage } from 'http';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:10000', // Use local backend server
        changeOrigin: true,
        secure: true,
        ws: true,
        timeout: 30000, // 30 second timeout
        configure: (proxy) => {
          proxy.on('error', (err) => {
            console.error('Proxy Error:', err);
          });
          proxy.on('proxyReq', (_proxyReq, req: IncomingMessage) => {
            console.log('API Request:', {
              method: req.method,
              url: req.url,
              target: 'https://maziv-project-management.onrender.com'
            });
          });
          proxy.on('proxyRes', (proxyRes: IncomingMessage, req: IncomingMessage) => {
            console.log('API Response:', {
              statusCode: proxyRes.statusCode,
              statusMessage: proxyRes.statusMessage,
              url: req.url,
              headers: proxyRes.headers
            });
          });
        },
      }
    },
    host: true, // Listen on all network interfaces
    port: 5173,
    strictPort: true,
    open: true
  },
  define: {
    // Ensure environment variables are available at build time
    'import.meta.env.VITE_API_URL': JSON.stringify(process.env.VITE_API_URL)
  }
});
