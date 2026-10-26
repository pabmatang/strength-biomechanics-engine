import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// The frontend talks to the Spring Boot API. In development Vite proxies /api
// to http://localhost:8080 so the browser sees a single origin and the JWT is
// sent without CORS preflight complications.
const apiProxy = {
  '/api': {
    target: 'http://localhost:8080',
    changeOrigin: true
  }
};

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
    allowedHosts: true,
    hmr: {
      clientPort: 443
    },
    proxy: apiProxy
  },
  preview: {
    host: true,
    port: 5173,
    allowedHosts: true,
    proxy: apiProxy
  }
});
