import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'react-toastify/dist/ReactToastify.css': path.resolve(__dirname, './src/utils/empty.css'),
      'react-toastify': path.resolve(__dirname, './src/utils/toastShim.jsx'),
    },
  },
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
    assetsDir: 'assets',
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/') || id.includes('node_modules/react-router-dom/')) {
            return 'vendor-react';
          }
          if (id.includes('node_modules/country-state-city')) {
            return 'vendor-geo-data';
          }
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          if (id.includes('node_modules/axios')) {
            return 'vendor-axios';
          }
        }
      }
    }
  },
  envPrefix: 'VITE_' // Simplify if REACT_APP_ is not needed
});