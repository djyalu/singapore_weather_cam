import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/singapore_weather_cam/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['chart.js', 'react-chartjs-2'],
          maps: ['leaflet', 'react-leaflet']
        }
      }
    }
  },
  server: {
    port: 3000,
    open: true,
    fs: {
      // Allow serving files from data directory
      allow: ['..', '.', './data']
    }
  },
  publicDir: 'public',
  preview: {
    port: 3001
  }
});