import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  base: process.env.NODE_ENV === 'production' ? '/singapore_weather_cam/' : '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true,
    minify: 'terser',
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          chart: ['chart.js', 'react-chartjs-2', 'chartjs-adapter-date-fns'],
          leaflet: ['leaflet', 'react-leaflet'],
          utils: ['date-fns', 'axios'],
          ui: ['lucide-react', 'framer-motion', 'react-hot-toast']
        }
      }
    },
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn']
      }
    }
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api/nea': {
        target: 'https://api.data.gov.sg/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/nea/, ''),
        headers: {
          'User-Agent': 'Singapore Weather Monitor/1.0'
        }
      }
    }
  }
})