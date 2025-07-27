import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react({
      // Enable React Fast Refresh
      fastRefresh: true,
      // Include React DevTools in development
      include: "**/*.{jsx,tsx}",
    })
  ],
  base: process.env.NODE_ENV === 'production' ? '/singapore_weather_cam/' : '/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: process.env.NODE_ENV !== 'production',
    // Enhanced performance optimization settings
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: process.env.NODE_ENV === 'production',
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
        // Additional compression optimizations
        unsafe_arrows: true,
        unsafe_methods: true,
        unsafe_proto: true,
        passes: 2
      },
      mangle: {
        safari10: true
      }
    },
    rollupOptions: {
      output: {
        // Enhanced chunk splitting strategy for optimal caching
        manualChunks: (id) => {
          // Vendor chunks - split by functionality
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'react-vendor';
            }
            if (id.includes('leaflet') || id.includes('react-leaflet')) {
              return 'map-vendor';
            }
            if (id.includes('chart.js') || id.includes('react-chartjs-2')) {
              return 'chart-vendor';
            }
            if (id.includes('lucide-react') || id.includes('prop-types')) {
              return 'ui-vendor';
            }
            if (id.includes('date-fns') || id.includes('@anthropic-ai/sdk')) {
              return 'utils-vendor';
            }
            // All other vendor dependencies
            return 'vendor';
          }
          
          // Application chunks - split by feature
          if (id.includes('/components/sections/')) {
            return 'sections';
          }
          if (id.includes('/components/webcam/') || id.includes('/components/map/')) {
            return 'interactive';
          }
          if (id.includes('/components/admin/') || id.includes('/components/system/')) {
            return 'admin';
          }
          if (id.includes('/components/analysis/') || id.includes('/components/weather/')) {
            return 'analysis';
          }
          if (id.includes('/contexts/') || id.includes('/hooks/')) {
            return 'core';
          }
          if (id.includes('/services/')) {
            return 'services';
          }
        },
        // Optimize chunk file names for better caching
        chunkFileNames: (chunkInfo) => {
          const facadeModuleId = chunkInfo.facadeModuleId
            ? chunkInfo.facadeModuleId.split('/').pop().replace(/\.[^/.]+$/, '')
            : 'chunk';
          return `assets/js/${facadeModuleId}-[hash].js`;
        },
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          const extType = assetInfo.name.split('.').at(1);
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            return `assets/images/[name]-[hash][extname]`;
          }
          if (/css/i.test(extType)) {
            return `assets/css/[name]-[hash][extname]`;
          }
          return `assets/[name]-[hash][extname]`;
        }
      },
      // Tree shaking optimization
      treeshake: {
        moduleSideEffects: false,
        propertyReadSideEffects: false,
        tryCatchDeoptimization: false
      }
    },
    // Chunk size warning limit - increased for better compression
    chunkSizeWarningLimit: 800,
    // Asset inlining threshold - optimized for performance
    assetsInlineLimit: 2048,
    // CSS code splitting
    cssCodeSplit: true,
    // Generate manifest for better caching
    manifest: true,
    // Report compressed size
    reportCompressedSize: true
  },
  server: {
    port: 3000,
    open: true,
    host: true,
    // Enable HTTP/2 for development
    https: false,
    // Improve dev server performance
    hmr: {
      overlay: true
    }
  },
  fs: {
    allow: ['..', '.', './data', './public']
  },
  // Performance optimizations
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'leaflet',
      'lucide-react',
      'chart.js',
      'date-fns'
    ],
    exclude: []
  },
  // CSS optimization
  css: {
    devSourcemap: true,
    preprocessorOptions: {
      // Add any CSS preprocessor options here
    }
  },
  // Define global constants
  define: {
    __DEV__: process.env.NODE_ENV === 'development',
    __PROD__: process.env.NODE_ENV === 'production'
  }
})