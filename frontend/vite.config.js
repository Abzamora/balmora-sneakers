import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Proxies /api calls to the local backend during development so the
// frontend can always call same-origin "/api/..." paths (no CORS juggling
// in dev, and one env var to change for production — see src/api/api.js).
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
