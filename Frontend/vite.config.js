// Frontend/vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  assetsInclude: ['**/*.mp4'],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '/api'), // Preserve /api prefix
      },
    },
    allowedHosts: [
      'localhost',
      '473124b010fb.ngrok-free.app'
    ]
  },
  envPrefix: ['VITE_', 'REACT_APP_'], // Allow REACT_APP_ prefixes
});