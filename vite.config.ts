import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '^/api/.*': {
        target: 'https://maziv-project-management.onrender.com',
        changeOrigin: true,
        secure: true,
        ws: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.error('Proxy Error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('API Request:', {
              method: req.method,
              url: req.url,
              headers: req.headers,
              body: req.body
            });
          });
          proxy.on('proxyRes', (proxyRes, req, _res) => {
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
