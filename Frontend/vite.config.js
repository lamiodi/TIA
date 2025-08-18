import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/', // Ensure assets are served from root
  assetsInclude: ['**/*.mp4', '**/*.jpg', '**/*.png'], // Include common asset types
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'https://tia-backend-r331.onrender.com',
        changeOrigin: true,
        secure: true
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  },
  envPrefix: 'VITE_' // Simplify if REACT_APP_ is not needed
});