import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Proxy API calls during dev to avoid CORS friction.
    // Now points at the VPS-hosted backend (Coolify). Switch back to
    // http://localhost:4000 if you ever run the backend locally again.
    proxy: {
      '/api': {
        target: 'http://n97le4freg8s92ke3thqm3v6.144.217.14.30.sslip.io',
        changeOrigin: true,
      },
    },
  },
});
