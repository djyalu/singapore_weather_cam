# Performance Optimization and Monitoring Guide

**Singapore Weather Cam Performance Documentation**
*Comprehensive guide for monitoring, optimizing, and maintaining high-performance web application*

**Performance Objectives**: Sub-3s load time on 3G, 60fps interactions, <100MB memory usage, 95+ Lighthouse scores

---

## Table of Contents

1. [Performance Metrics and Monitoring](#performance-metrics-and-monitoring)
2. [Optimization Strategies](#optimization-strategies)
3. [Build Performance and CI/CD](#build-performance-and-cicd)
4. [Mobile and Cross-Device Performance](#mobile-and-cross-device-performance)
5. [Performance Troubleshooting Guide](#performance-troubleshooting-guide)
6. [Performance Budget Management](#performance-budget-management)
7. [Real-Time Monitoring Setup](#real-time-monitoring-setup)

---

## Performance Metrics and Monitoring

### Core Web Vitals Benchmarks

**Critical Performance Thresholds**:
- **Largest Contentful Paint (LCP)**: <2.5s (target: <1.8s)
- **First Input Delay (FID)**: <100ms (target: <50ms)
- **Cumulative Layout Shift (CLS)**: <0.1 (target: <0.05)
- **First Contentful Paint (FCP)**: <1.8s (target: <1.2s)
- **Time to Interactive (TTI)**: <3.5s (target: <2.8s)

**Application-Specific Metrics**:
- **Weather Data Load**: <500ms from API call to display
- **Webcam Image Load**: <2s for initial display, <1s for subsequent
- **Map Interaction Response**: <16ms (60fps)
- **Chart Animation Performance**: Consistent 60fps during transitions
- **Memory Usage**: <100MB baseline, <150MB peak

### Performance Monitoring Implementation

#### 1. Web Vitals Tracking

```javascript
// Performance monitoring setup (integrate into main.jsx)
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

const vitalsReporter = (metric) => {
  // Send to analytics
  console.log(metric);
  
  // Real-time performance alerts
  if (metric.name === 'LCP' && metric.value > 2500) {
    console.warn('🚨 LCP threshold exceeded:', metric.value);
  }
  
  if (metric.name === 'FID' && metric.value > 100) {
    console.warn('🚨 FID threshold exceeded:', metric.value);
  }
  
  if (metric.name === 'CLS' && metric.value > 0.1) {
    console.warn('🚨 CLS threshold exceeded:', metric.value);
  }
};

// Initialize monitoring
getCLS(vitalsReporter);
getFID(vitalsReporter);
getFCP(vitalsReporter);
getLCP(vitalsReporter);
getTTFB(vitalsReporter);
```

#### 2. Real-Time Performance Dashboard

**Implementation Location**: `src/components/admin/PerformanceDashboard.jsx`

**Key Metrics Display**:
- Live Core Web Vitals scores
- Memory usage trends (heap size, DOM nodes)
- Network performance (request timing, cache hit rates)
- Frame rate monitoring (target: 60fps)
- Bundle size impact analysis

#### 3. Performance Observer Integration

```javascript
// Advanced performance monitoring
const perfObserver = new PerformanceObserver((list) => {
  list.getEntries().forEach((entry) => {
    if (entry.entryType === 'navigation') {
      console.log('Navigation timing:', {
        domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
        loadComplete: entry.loadEventEnd - entry.loadEventStart,
        totalTime: entry.loadEventEnd - entry.fetchStart
      });
    }
    
    if (entry.entryType === 'resource') {
      // Monitor large resource loads
      if (entry.transferSize > 500000) { // >500KB
        console.warn('Large resource detected:', entry.name, entry.transferSize);
      }
    }
  });
});

perfObserver.observe({ entryTypes: ['navigation', 'resource', 'paint'] });
```

### Performance Budget Configuration

**Resource Budgets**:
- **Initial Bundle**: <500KB (current: ~380KB)
- **Total JavaScript**: <2MB (including chunks)
- **Images**: <50KB per webcam image, <5MB total
- **CSS**: <100KB total
- **Fonts**: <200KB total
- **Third-party Scripts**: <300KB total

**Timing Budgets**:
- **Time to First Byte**: <800ms
- **DOM Content Loaded**: <2s
- **Window Load**: <3s
- **API Response Time**: <500ms average

---

## Optimization Strategies

### Bundle Optimization and Code Splitting

#### 1. Route-Based Code Splitting

```javascript
// Implement in App.jsx for route-based splitting
import { lazy, Suspense } from 'react';
import LoadingScreen from './components/common/LoadingScreen';

const WeatherDashboard = lazy(() => import('./components/weather/WeatherDashboard'));
const WebcamGallery = lazy(() => import('./components/webcam/WebcamGallery'));
const AdminPanels = lazy(() => import('./components/admin/AdminPanels'));

// Route configuration with lazy loading
const routes = [
  {
    path: '/weather',
    element: (
      <Suspense fallback={<LoadingScreen />}>
        <WeatherDashboard />
      </Suspense>
    )
  }
];
```

#### 2. Component-Based Code Splitting

```javascript
// Split heavy components (Chart.js, Leaflet)
const WeatherChart = lazy(() => 
  import('./components/weather/WeatherChart').then(module => ({
    default: module.WeatherChart
  }))
);

const MapView = lazy(() => 
  import('./components/map/MapView').then(module => ({
    default: module.MapView
  }))
);
```

#### 3. Vite Bundle Optimization

**Enhanced `vite.config.js`**:

```javascript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: process.env.NODE_ENV === 'production' ? '/singapore_weather_cam/' : '/',
  
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'terser',
    
    // Advanced bundle optimization
    rollupOptions: {
      output: {
        // Manual chunks for optimal loading
        manualChunks: {
          vendor: ['react', 'react-dom'],
          charts: ['chart.js', 'react-chartjs-2', 'chartjs-adapter-date-fns'],
          maps: ['leaflet', 'react-leaflet'],
          utils: ['date-fns', 'zustand', 'axios']
        }
      }
    },
    
    // Compression and minification
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log']
      }
    },
    
    // Asset optimization
    assetsInlineLimit: 4096, // 4KB threshold for inlining
    chunkSizeWarningLimit: 600, // 600KB warning threshold
  },
  
  // Development optimization
  server: {
    port: 3000,
    open: true,
    hmr: {
      overlay: false // Reduce development overhead
    }
  },
  
  // Dependency pre-bundling optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'chart.js',
      'leaflet',
      'date-fns'
    ],
    exclude: ['@testing-library/jest-dom']
  }
});
```

### Image Optimization and Lazy Loading

#### 1. Advanced Image Loading Strategy

```javascript
// Enhanced image component with performance optimization
import { useState, useRef, useEffect } from 'react';
import { useIntersectionObserver } from 'react-intersection-observer';

const OptimizedImage = ({ 
  src, 
  alt, 
  className = '', 
  priority = false,
  sizes = '100vw',
  quality = 75 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef(null);
  
  const { ref, inView } = useIntersectionObserver({
    threshold: 0.1,
    triggerOnce: true,
    skip: priority // Skip intersection observer for priority images
  });
  
  const shouldLoad = priority || inView;
  
  useEffect(() => {
    if (shouldLoad && imgRef.current) {
      const img = imgRef.current;
      
      // Preload for better performance
      const preloadImg = new Image();
      preloadImg.onload = () => {
        img.src = src;
        setIsLoaded(true);
      };
      preloadImg.onerror = () => setError(true);
      preloadImg.src = src;
    }
  }, [shouldLoad, src]);
  
  return (
    <div ref={ref} className={`relative ${className}`}>
      <img
        ref={imgRef}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onError={() => setError(true)}
      />
      
      {!isLoaded && !error && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse" />
      )}
      
      {error && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <span className="text-sm text-gray-500">Failed to load image</span>
        </div>
      )}
    </div>
  );
};
```

#### 2. Webcam Image Optimization

```javascript
// Webcam-specific optimization for frequent updates
const WebcamImageOptimizer = {
  // Image compression for webcam feeds
  compressImage: async (file, quality = 0.8) => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob(resolve, 'image/jpeg', quality);
      };
      
      img.src = URL.createObjectURL(file);
    });
  },
  
  // Progressive loading for webcam gallery
  loadWebcamImagesProgressively: (images) => {
    const loadQueue = [...images];
    const loadedImages = [];
    
    const loadNext = () => {
      if (loadQueue.length === 0) return;
      
      const image = loadQueue.shift();
      const img = new Image();
      
      img.onload = () => {
        loadedImages.push(image);
        setTimeout(loadNext, 100); // Throttle loading
      };
      
      img.src = image.src;
    };
    
    loadNext();
    return loadedImages;
  }
};
```

### Caching Strategies and Service Worker

#### 1. Service Worker Implementation

**Create `public/sw.js`**:

```javascript
const CACHE_NAME = 'singapore-weather-v1.2.0';
const CACHE_URLS = [
  '/',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/data/weather/latest.json'
];

// Install event - cache critical resources
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CACHE_URLS))
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // API requests - network first with cache fallback
  if (url.pathname.includes('/api/') || url.pathname.includes('/data/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => cache.put(request, responseClone));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }
  
  // Static assets - cache first
  if (request.destination === 'script' || 
      request.destination === 'style' ||
      request.destination === 'image') {
    event.respondWith(
      caches.match(request)
        .then((response) => response || fetch(request))
    );
    return;
  }
  
  // HTML pages - network first
  event.respondWith(
    fetch(request)
      .catch(() => caches.match(request))
  );
});
```

#### 2. Cache Management Strategy

```javascript
// Cache management utility
export const CacheManager = {
  // Weather data caching (5-minute TTL)
  weatherCache: new Map(),
  
  setWeatherData: (key, data) => {
    const timestamp = Date.now();
    CacheManager.weatherCache.set(key, { data, timestamp });
  },
  
  getWeatherData: (key) => {
    const cached = CacheManager.weatherCache.get(key);
    if (!cached) return null;
    
    const age = Date.now() - cached.timestamp;
    if (age > 5 * 60 * 1000) { // 5 minutes
      CacheManager.weatherCache.delete(key);
      return null;
    }
    
    return cached.data;
  },
  
  // Image cache management
  clearImageCache: () => {
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        cacheNames.forEach(cacheName => {
          if (cacheName.includes('image') || cacheName.includes('webcam')) {
            caches.delete(cacheName);
          }
        });
      });
    }
  },
  
  // Memory usage monitoring
  checkMemoryUsage: () => {
    if ('memory' in performance) {
      const memInfo = performance.memory;
      const usage = memInfo.usedJSHeapSize / memInfo.totalJSHeapSize;
      
      if (usage > 0.85) {
        CacheManager.clearImageCache();
        CacheManager.weatherCache.clear();
      }
      
      return {
        used: Math.round(memInfo.usedJSHeapSize / 1048576),
        total: Math.round(memInfo.totalJSHeapSize / 1048576),
        usage: Math.round(usage * 100)
      };
    }
    
    return null;
  }
};
```

### Runtime Performance Optimization

#### 1. React Performance Patterns

```javascript
// High-performance component patterns
import { memo, useMemo, useCallback, useRef } from 'react';

// Memoized component with custom comparison
const WeatherCard = memo(({ weather, onUpdate }) => {
  // Memoize expensive calculations
  const processedData = useMemo(() => {
    return processWeatherData(weather);
  }, [weather.temperature, weather.humidity, weather.timestamp]);
  
  // Stable callback references
  const handleUpdate = useCallback((newData) => {
    onUpdate(newData);
  }, [onUpdate]);
  
  // Ref for DOM operations
  const cardRef = useRef(null);
  
  return (
    <div ref={cardRef} className="weather-card">
      {/* Component content */}
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for optimization
  return (
    prevProps.weather.temperature === nextProps.weather.temperature &&
    prevProps.weather.humidity === nextProps.weather.humidity &&
    prevProps.weather.timestamp === nextProps.weather.timestamp
  );
});
```

#### 2. State Management Optimization

```javascript
// Optimized Zustand store with performance considerations
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

export const useAppStore = create(
  subscribeWithSelector((set, get) => ({
    // Separate state slices for granular updates
    weather: {
      data: null,
      lastUpdate: null,
      loading: false
    },
    
    webcam: {
      images: [],
      currentIndex: 0,
      loading: false
    },
    
    ui: {
      sidebarOpen: false,
      theme: 'light',
      performanceMode: false
    },
    
    // Optimized actions
    setWeatherData: (data) => set((state) => ({
      weather: {
        ...state.weather,
        data,
        lastUpdate: Date.now(),
        loading: false
      }
    })),
    
    // Batch updates for better performance
    batchUpdateWeather: (updates) => set((state) => ({
      weather: { ...state.weather, ...updates }
    })),
    
    // Performance mode toggle
    togglePerformanceMode: () => set((state) => ({
      ui: {
        ...state.ui,
        performanceMode: !state.ui.performanceMode
      }
    }))
  }))
);

// Selective subscriptions for performance
export const useWeatherData = () => useAppStore(state => state.weather.data);
export const useWebcamImages = () => useAppStore(state => state.webcam.images);
export const usePerformanceMode = () => useAppStore(state => state.ui.performanceMode);
```

---

## Build Performance and CI/CD

### Build Time Optimization

#### 1. Enhanced GitHub Actions Performance

**Update `.github/workflows/deploy.yml`**:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [ main ]
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency:
  group: "pages"
  cancel-in-progress: false

jobs:
  build:
    runs-on: ubuntu-latest
    timeout-minutes: 10
    
    # Performance monitoring
    env:
      NODE_OPTIONS: '--max-old-space-size=4096'
      
    steps:
      - name: Checkout
        uses: actions/checkout@v4
        
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'
          
      - name: Setup Pages
        uses: actions/configure-pages@v4
        
      # Optimized dependency installation
      - name: Install dependencies
        run: |
          npm ci --prefer-offline --no-audit --silent
          echo "✅ Dependencies installed successfully"
        
      # Data preparation with compression
      - name: Copy and optimize data
        run: |
          mkdir -p public/data/weather
          mkdir -p public/data/webcam
          cp -r data/weather/* public/data/weather/ 2>/dev/null || true
          cp -r data/webcam/* public/data/webcam/ 2>/dev/null || true
          
          # Compress JSON files
          find public/data -name "*.json" -exec gzip -k {} \;
          echo "✅ Data files optimized and copied"
          
      # Performance-optimized build
      - name: Build with Vite
        run: |
          # Build with performance monitoring
          time npm run build
          
          # Performance analysis
          echo "✅ Build completed successfully"
          echo "Build size: $(du -sh dist | cut -f1)"
          echo "JS bundle sizes:"
          find dist -name "*.js" -exec ls -lh {} \; | awk '{print $5, $9}'
          echo "CSS bundle sizes:"
          find dist -name "*.css" -exec ls -lh {} \; | awk '{print $5, $9}'
          
      # Bundle analysis (optional)
      - name: Analyze bundle size
        run: |
          npx vite-bundle-analyzer dist --mode static --report-filename bundle-report.html
        continue-on-error: true
        
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: ./dist

  deploy:
    runs-on: ubuntu-latest
    needs: build
    timeout-minutes: 5
    
    permissions:
      pages: write
      id-token: write
      
    steps:
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
        
      # Post-deployment performance validation
      - name: Performance validation
        run: |
          # Wait for deployment to be ready
          sleep 30
          
          # Basic performance check (would need external tool)
          echo "✅ Deployment completed"
          echo "Site URL: ${{ steps.deployment.outputs.page_url }}"
```

#### 2. Build Performance Monitoring

```javascript
// vite-plugin-performance.js - Custom Vite plugin for build monitoring
export function performancePlugin() {
  let buildStartTime;
  
  return {
    name: 'performance-monitor',
    
    buildStart() {
      buildStartTime = Date.now();
      console.log('🚀 Build started...');
    },
    
    generateBundle(options, bundle) {
      const buildTime = Date.now() - buildStartTime;
      console.log(`⚡ Build completed in ${buildTime}ms`);
      
      // Analyze bundle composition
      const bundleAnalysis = Object.entries(bundle).map(([name, chunk]) => ({
        name,
        size: chunk.code?.length || 0,
        type: chunk.type
      }));
      
      const totalSize = bundleAnalysis.reduce((sum, chunk) => sum + chunk.size, 0);
      console.log(`📊 Total bundle size: ${(totalSize / 1024).toFixed(2)}KB`);
      
      // Warn about large chunks
      bundleAnalysis.forEach(chunk => {
        if (chunk.size > 500000) { // >500KB
          console.warn(`⚠️  Large chunk detected: ${chunk.name} (${(chunk.size / 1024).toFixed(2)}KB)`);
        }
      });
    }
  };
}
```

### Asset Optimization Pipeline

#### 1. Image Processing Automation

```bash
#!/bin/bash
# scripts/optimize-images.sh

echo "🖼️  Optimizing images for production..."

# Create optimized image directory
mkdir -p public/images/optimized

# Optimize webcam images
for img in public/images/webcam/*.jpg; do
  if [ -f "$img" ]; then
    # Convert and compress
    filename=$(basename "$img")
    
    # Create WebP version for modern browsers
    cwebp -q 80 "$img" -o "public/images/optimized/${filename%.jpg}.webp"
    
    # Compress JPEG for fallback
    jpegoptim --max=85 --strip-all "$img"
    
    echo "✅ Optimized $filename"
  fi
done

echo "🎉 Image optimization completed"
```

#### 2. Performance Regression Testing

```javascript
// scripts/performance-test.js
const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');

async function runPerformanceTest(url) {
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  
  const options = {
    logLevel: 'info',
    output: 'json',
    onlyCategories: ['performance'],
    port: chrome.port,
  };
  
  const runnerResult = await lighthouse(url, options);
  await chrome.kill();
  
  const performance = runnerResult.report.categories.performance;
  const metrics = runnerResult.report.audits;
  
  console.log('Performance Score:', Math.round(performance.score * 100));
  console.log('First Contentful Paint:', metrics['first-contentful-paint'].displayValue);
  console.log('Largest Contentful Paint:', metrics['largest-contentful-paint'].displayValue);
  console.log('Time to Interactive:', metrics['interactive'].displayValue);
  
  // Fail if performance is below threshold
  if (performance.score < 0.9) {
    console.error('❌ Performance regression detected!');
    process.exit(1);
  }
  
  console.log('✅ Performance test passed');
}

// Run test
runPerformanceTest(process.argv[2] || 'http://localhost:3000');
```

---

## Mobile and Cross-Device Performance

### Mobile Optimization Techniques

#### 1. Responsive Performance Strategy

```javascript
// Mobile-first performance optimization
const MobilePerformanceOptimizer = {
  // Detect device capabilities
  detectDeviceCapabilities: () => {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    const memory = navigator.deviceMemory || 4; // Default to 4GB
    const cores = navigator.hardwareConcurrency || 4;
    
    return {
      connectionType: connection?.effectiveType || 'unknown',
      memory,
      cores,
      isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent),
      isLowEnd: memory < 4 || cores < 4
    };
  },
  
  // Adaptive loading based on device
  getOptimalConfiguration: (capabilities) => {
    if (capabilities.isLowEnd || capabilities.connectionType === 'slow-2g') {
      return {
        imageQuality: 60,
        chartAnimations: false,
        maxWebcamImages: 5,
        updateInterval: 60000, // 1 minute
        enableServiceWorker: true
      };
    }
    
    if (capabilities.connectionType === '2g' || capabilities.connectionType === '3g') {
      return {
        imageQuality: 75,
        chartAnimations: true,
        maxWebcamImages: 10,
        updateInterval: 30000, // 30 seconds
        enableServiceWorker: true
      };
    }
    
    // High-end devices
    return {
      imageQuality: 90,
      chartAnimations: true,
      maxWebcamImages: 20,
      updateInterval: 15000, // 15 seconds
      enableServiceWorker: true
    };
  }
};

// Apply mobile optimizations
const applyMobileOptimizations = () => {
  const capabilities = MobilePerformanceOptimizer.detectDeviceCapabilities();
  const config = MobilePerformanceOptimizer.getOptimalConfiguration(capabilities);
  
  // Update app configuration
  window.APP_CONFIG = { ...window.APP_CONFIG, ...config };
  
  // Apply CSS optimizations for low-end devices
  if (capabilities.isLowEnd) {
    document.body.classList.add('low-end-device');
  }
};
```

#### 2. Network-Aware Loading

```javascript
// Network-adaptive resource loading
const NetworkAwareLoader = {
  // Monitor connection changes
  setupConnectionMonitoring: () => {
    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    
    if (connection) {
      const updateConnectionInfo = () => {
        const effectiveType = connection.effectiveType;
        const downlink = connection.downlink;
        const rtt = connection.rtt;
        
        // Adjust loading strategy based on connection
        if (effectiveType === 'slow-2g' || downlink < 0.5) {
          NetworkAwareLoader.enableDataSaverMode();
        } else if (effectiveType === '4g' && downlink > 10) {
          NetworkAwareLoader.enableHighQualityMode();
        }
        
        console.log('Connection updated:', { effectiveType, downlink, rtt });
      };
      
      connection.addEventListener('change', updateConnectionInfo);
      updateConnectionInfo(); // Initial check
    }
  },
  
  enableDataSaverMode: () => {
    document.body.classList.add('data-saver-mode');
    
    // Reduce image quality
    const images = document.querySelectorAll('img[data-src]');
    images.forEach(img => {
      const src = img.dataset.src;
      if (src && src.includes('quality=')) {
        img.dataset.src = src.replace(/quality=\d+/, 'quality=50');
      }
    });
    
    // Disable autoplay and reduce animations
    const videos = document.querySelectorAll('video[autoplay]');
    videos.forEach(video => {
      video.removeAttribute('autoplay');
      video.preload = 'none';
    });
  },
  
  enableHighQualityMode: () => {
    document.body.classList.remove('data-saver-mode');
    
    // Preload critical resources
    const criticalImages = document.querySelectorAll('img[data-priority="high"]');
    criticalImages.forEach(img => {
      if (img.dataset.src) {
        const preloadLink = document.createElement('link');
        preloadLink.rel = 'preload';
        preloadLink.as = 'image';
        preloadLink.href = img.dataset.src;
        document.head.appendChild(preloadLink);
      }
    });
  }
};
```

### Battery Usage Optimization

```javascript
// Battery-conscious performance management
const BatteryOptimizer = {
  batteryInfo: null,
  
  // Initialize battery monitoring
  init: async () => {
    if ('getBattery' in navigator) {
      try {
        BatteryOptimizer.batteryInfo = await navigator.getBattery();
        BatteryOptimizer.setupBatteryMonitoring();
      } catch (error) {
        console.log('Battery API not available');
      }
    }
  },
  
  setupBatteryMonitoring: () => {
    const battery = BatteryOptimizer.batteryInfo;
    if (!battery) return;
    
    const updatePowerMode = () => {
      const level = battery.level;
      const charging = battery.charging;
      
      if (!charging && level < 0.2) {
        BatteryOptimizer.enablePowerSaveMode();
      } else if (!charging && level < 0.5) {
        BatteryOptimizer.enableConservativeMode();
      } else if (charging || level > 0.8) {
        BatteryOptimizer.enableNormalMode();
      }
    };
    
    battery.addEventListener('levelchange', updatePowerMode);
    battery.addEventListener('chargingchange', updatePowerMode);
    updatePowerMode(); // Initial check
  },
  
  enablePowerSaveMode: () => {
    console.log('🔋 Power save mode enabled');
    document.body.classList.add('power-save-mode');
    
    // Reduce update frequency
    window.APP_CONFIG.updateInterval = 120000; // 2 minutes
    
    // Disable animations
    document.body.classList.add('reduce-motion');
    
    // Throttle CPU-intensive operations
    BatteryOptimizer.throttleCPUOperations();
  },
  
  enableConservativeMode: () => {
    console.log('⚡ Conservative mode enabled');
    document.body.classList.remove('power-save-mode');
    document.body.classList.add('conservative-mode');
    
    window.APP_CONFIG.updateInterval = 60000; // 1 minute
  },
  
  enableNormalMode: () => {
    console.log('🚀 Normal mode enabled');
    document.body.classList.remove('power-save-mode', 'conservative-mode');
    
    window.APP_CONFIG.updateInterval = 30000; // 30 seconds
  },
  
  throttleCPUOperations: () => {
    // Reduce chart update frequency
    const charts = document.querySelectorAll('canvas[data-chart]');
    charts.forEach(chart => {
      chart.style.animationPlayState = 'paused';
    });
    
    // Pause non-critical timers
    if (window.performanceMonitoringInterval) {
      clearInterval(window.performanceMonitoringInterval);
    }
  }
};
```

---

## Performance Troubleshooting Guide

### Common Performance Issues and Solutions

#### 1. Slow Initial Load Time

**Symptoms**:
- First Contentful Paint >2.5s
- Time to Interactive >5s
- Large bundle sizes

**Diagnostic Steps**:

```javascript
// Performance diagnostic utility
const PerformanceDiagnostic = {
  analyzeLoadTime: () => {
    const navigation = performance.getEntriesByType('navigation')[0];
    const timing = {
      dns: navigation.domainLookupEnd - navigation.domainLookupStart,
      tcp: navigation.connectEnd - navigation.connectStart,
      ttfb: navigation.responseStart - navigation.requestStart,
      download: navigation.responseEnd - navigation.responseStart,
      domProcessing: navigation.domContentLoadedEventStart - navigation.responseEnd,
      resourceLoad: navigation.loadEventStart - navigation.domContentLoadedEventEnd
    };
    
    console.table(timing);
    
    // Identify bottlenecks
    Object.entries(timing).forEach(([phase, duration]) => {
      if (duration > 1000) {
        console.warn(`🐌 Slow ${phase}: ${duration}ms`);
      }
    });
  },
  
  analyzeBundleSize: () => {
    const resources = performance.getEntriesByType('resource');
    const scripts = resources.filter(r => r.name.includes('.js'));
    const styles = resources.filter(r => r.name.includes('.css'));
    
    console.log('JavaScript bundles:');
    scripts.forEach(script => {
      const size = script.transferSize;
      if (size > 500000) { // >500KB
        console.warn(`📦 Large bundle: ${script.name} (${(size / 1024).toFixed(1)}KB)`);
      }
    });
    
    console.log('CSS bundles:');
    styles.forEach(style => {
      const size = style.transferSize;
      if (size > 100000) { // >100KB
        console.warn(`🎨 Large stylesheet: ${style.name} (${(size / 1024).toFixed(1)}KB)`);
      }
    });
  }
};
```

**Solutions**:
1. Implement code splitting for routes and heavy components
2. Enable compression (gzip/brotli) in hosting
3. Optimize image sizes and formats
4. Remove unused dependencies
5. Implement service worker caching

#### 2. Memory Leaks and High Memory Usage

**Symptoms**:
- Gradual performance degradation
- Browser tab crashes
- High memory usage in DevTools

**Diagnostic Tools**:

```javascript
// Memory leak detection
const MemoryLeakDetector = {
  baseline: null,
  
  startMonitoring: () => {
    if ('memory' in performance) {
      MemoryLeakDetector.baseline = performance.memory.usedJSHeapSize;
      
      setInterval(() => {
        const current = performance.memory.usedJSHeapSize;
        const growth = current - MemoryLeakDetector.baseline;
        
        if (growth > 50 * 1024 * 1024) { // 50MB growth
          console.warn('🚨 Potential memory leak detected:', {
            baseline: Math.round(MemoryLeakDetector.baseline / 1024 / 1024) + 'MB',
            current: Math.round(current / 1024 / 1024) + 'MB',
            growth: Math.round(growth / 1024 / 1024) + 'MB'
          });
          
          MemoryLeakDetector.analyzeLeaks();
        }
      }, 30000); // Check every 30 seconds
    }
  },
  
  analyzeLeaks: () => {
    // Check for common leak sources
    const intervals = [];
    const originalSetInterval = setInterval;
    setInterval = (...args) => {
      const id = originalSetInterval(...args);
      intervals.push(id);
      return id;
    };
    
    console.log('Active intervals:', intervals.length);
    
    // Check for large objects in memory
    if (window.WeatherData && window.WeatherData.length > 1000) {
      console.warn('Large weather data array detected');
    }
    
    // Check for uncleaned event listeners
    const elements = document.querySelectorAll('*');
    let eventListenerCount = 0;
    elements.forEach(el => {
      const listeners = getEventListeners?.(el) || {};
      eventListenerCount += Object.keys(listeners).length;
    });
    
    if (eventListenerCount > 100) {
      console.warn('High number of event listeners:', eventListenerCount);
    }
  }
};
```

**Solutions**:
1. Cleanup intervals and timeouts in useEffect
2. Remove event listeners in component cleanup
3. Implement proper dependency arrays in hooks
4. Use WeakMap/WeakSet for object references
5. Clear caches when memory usage is high

#### 3. Poor Frame Rate and Janky Animations

**Symptoms**:
- Stuttering animations
- Delayed user interactions
- Frame rate <30fps

**Diagnostic Tools**:

```javascript
// Frame rate monitoring
const FrameRateMonitor = {
  frames: [],
  lastTime: performance.now(),
  
  start: () => {
    const measureFrame = (currentTime) => {
      const delta = currentTime - FrameRateMonitor.lastTime;
      FrameRateMonitor.frames.push(delta);
      
      // Keep only last 60 frames
      if (FrameRateMonitor.frames.length > 60) {
        FrameRateMonitor.frames.shift();
      }
      
      // Calculate FPS every second
      if (FrameRateMonitor.frames.length === 60) {
        const avgDelta = FrameRateMonitor.frames.reduce((a, b) => a + b) / 60;
        const fps = Math.round(1000 / avgDelta);
        
        if (fps < 30) {
          console.warn('🐌 Low FPS detected:', fps);
          FrameRateMonitor.optimizeForPerformance();
        }
        
        FrameRateMonitor.frames = [];
      }
      
      FrameRateMonitor.lastTime = currentTime;
      requestAnimationFrame(measureFrame);
    };
    
    requestAnimationFrame(measureFrame);
  },
  
  optimizeForPerformance: () => {
    // Reduce animation complexity
    document.body.classList.add('performance-mode');
    
    // Disable expensive visual effects
    const charts = document.querySelectorAll('[data-chart]');
    charts.forEach(chart => {
      chart.style.animationDuration = '0.1s';
    });
    
    // Throttle DOM updates
    window.domUpdateThrottle = true;
  }
};
```

**Solutions**:
1. Use CSS transforms instead of changing layout properties
2. Implement virtual scrolling for large lists
3. Debounce expensive operations
4. Use RequestAnimationFrame for smooth animations
5. Optimize chart rendering with reduced data points

### Performance Profiling Techniques

#### 1. Custom Performance Profiler

```javascript
// Advanced performance profiling
class PerformanceProfiler {
  constructor() {
    this.marks = new Map();
    this.measures = new Map();
  }
  
  // Start timing an operation
  startTiming(name) {
    const markName = `${name}-start`;
    performance.mark(markName);
    this.marks.set(name, markName);
  }
  
  // End timing and calculate duration
  endTiming(name) {
    const startMark = this.marks.get(name);
    if (!startMark) {
      console.warn(`No start mark found for: ${name}`);
      return;
    }
    
    const endMark = `${name}-end`;
    performance.mark(endMark);
    
    const measureName = `${name}-duration`;
    performance.measure(measureName, startMark, endMark);
    
    const measure = performance.getEntriesByName(measureName)[0];
    this.measures.set(name, measure.duration);
    
    console.log(`⏱️ ${name}: ${measure.duration.toFixed(2)}ms`);
    
    // Cleanup
    performance.clearMarks(startMark);
    performance.clearMarks(endMark);
    performance.clearMeasures(measureName);
    
    return measure.duration;
  }
  
  // Profile React component renders
  profileComponent(WrappedComponent, componentName) {
    return function ProfiledComponent(props) {
      const profiler = useRef(new PerformanceProfiler());
      
      useEffect(() => {
        profiler.current.startTiming(`${componentName}-render`);
        
        return () => {
          profiler.current.endTiming(`${componentName}-render`);
        };
      });
      
      return <WrappedComponent {...props} />;
    };
  }
  
  // Get performance summary
  getSummary() {
    return {
      measures: Object.fromEntries(this.measures),
      memory: performance.memory ? {
        used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
        total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024)
      } : null,
      navigation: performance.getEntriesByType('navigation')[0]
    };
  }
}

// Usage example
const profiler = new PerformanceProfiler();

// Profile API calls
profiler.startTiming('weather-api-call');
fetch('/api/weather')
  .then(response => response.json())
  .then(data => {
    profiler.endTiming('weather-api-call');
    // Process data
  });

// Profile component
const ProfiledWeatherCard = profiler.profileComponent(WeatherCard, 'WeatherCard');
```

---

## Performance Budget Management

### Budget Configuration

```javascript
// Performance budget configuration
export const PERFORMANCE_BUDGETS = {
  // Resource budgets (KB)
  resources: {
    totalJavaScript: 2000,
    totalCSS: 100,
    totalImages: 5000,
    totalFonts: 200,
    thirdPartyScripts: 300
  },
  
  // Timing budgets (ms)
  timings: {
    firstContentfulPaint: 1200,
    largestContentfulPaint: 2500,
    timeToInteractive: 3500,
    firstInputDelay: 50,
    cumulativeLayoutShift: 0.05
  },
  
  // Network budgets
  network: {
    totalRequests: 50,
    totalTransferSize: 3000, // KB
    criticalResourceHints: 10
  },
  
  // Runtime budgets
  runtime: {
    maxMemoryUsage: 150, // MB
    targetFPS: 60,
    maxMainThreadBlocking: 50 // ms
  }
};

// Budget monitoring
export class BudgetMonitor {
  static checkResourceBudgets() {
    const resources = performance.getEntriesByType('resource');
    const budgets = PERFORMANCE_BUDGETS.resources;
    
    const usage = {
      javascript: 0,
      css: 0,
      images: 0,
      fonts: 0,
      total: 0
    };
    
    resources.forEach(resource => {
      const size = resource.transferSize || 0;
      usage.total += size;
      
      if (resource.name.includes('.js')) {
        usage.javascript += size;
      } else if (resource.name.includes('.css')) {
        usage.css += size;
      } else if (/\.(jpg|jpeg|png|gif|webp|svg)/.test(resource.name)) {
        usage.images += size;
      } else if (/\.(woff|woff2|ttf|otf)/.test(resource.name)) {
        usage.fonts += size;
      }
    });
    
    // Convert to KB and check budgets
    Object.entries(usage).forEach(([type, bytes]) => {
      const kb = Math.round(bytes / 1024);
      const budget = budgets[`total${type.charAt(0).toUpperCase()}${type.slice(1)}`];
      
      if (budget && kb > budget) {
        console.warn(`🚨 ${type} budget exceeded: ${kb}KB > ${budget}KB`);
      }
    });
    
    return usage;
  }
  
  static checkTimingBudgets() {
    const budgets = PERFORMANCE_BUDGETS.timings;
    const navigation = performance.getEntriesByType('navigation')[0];
    
    if (!navigation) return;
    
    const timings = {
      firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime,
      timeToInteractive: navigation.domInteractive - navigation.navigationStart,
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart
    };
    
    Object.entries(timings).forEach(([metric, value]) => {
      const budget = budgets[metric];
      if (budget && value > budget) {
        console.warn(`🚨 ${metric} budget exceeded: ${Math.round(value)}ms > ${budget}ms`);
      }
    });
    
    return timings;
  }
}
```

---

## Real-Time Monitoring Setup

### Performance Dashboard Integration

```javascript
// Real-time performance monitoring component
import React, { useState, useEffect } from 'react';

export const PerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    fcp: null,
    lcp: null,
    fid: null,
    cls: null,
    memory: null,
    fps: null
  });
  
  useEffect(() => {
    // Web Vitals monitoring
    import('web-vitals').then(({ getCLS, getFID, getFCP, getLCP }) => {
      getCLS(metric => setMetrics(prev => ({ ...prev, cls: metric.value })));
      getFID(metric => setMetrics(prev => ({ ...prev, fid: metric.value })));
      getFCP(metric => setMetrics(prev => ({ ...prev, fcp: metric.value })));
      getLCP(metric => setMetrics(prev => ({ ...prev, lcp: metric.value })));
    });
    
    // Memory monitoring
    const memoryInterval = setInterval(() => {
      if ('memory' in performance) {
        const memory = performance.memory;
        setMetrics(prev => ({
          ...prev,
          memory: {
            used: Math.round(memory.usedJSHeapSize / 1024 / 1024),
            total: Math.round(memory.totalJSHeapSize / 1024 / 1024)
          }
        }));
      }
    }, 5000);
    
    // FPS monitoring
    let frameCount = 0;
    let lastTime = performance.now();
    
    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        const fps = Math.round(frameCount * 1000 / (currentTime - lastTime));
        setMetrics(prev => ({ ...prev, fps }));
        frameCount = 0;
        lastTime = currentTime;
      }
      
      requestAnimationFrame(measureFPS);
    };
    
    requestAnimationFrame(measureFPS);
    
    return () => {
      clearInterval(memoryInterval);
    };
  }, []);
  
  const getMetricStatus = (value, thresholds) => {
    if (value === null) return 'unknown';
    if (value <= thresholds.good) return 'good';
    if (value <= thresholds.fair) return 'fair';
    return 'poor';
  };
  
  return (
    <div className="performance-monitor">
      <h3>Real-Time Performance Metrics</h3>
      
      <div className="metrics-grid">
        <div className={`metric ${getMetricStatus(metrics.fcp, { good: 1800, fair: 3000 })}`}>
          <label>First Contentful Paint</label>
          <value>{metrics.fcp ? `${Math.round(metrics.fcp)}ms` : '...'}</value>
        </div>
        
        <div className={`metric ${getMetricStatus(metrics.lcp, { good: 2500, fair: 4000 })}`}>
          <label>Largest Contentful Paint</label>
          <value>{metrics.lcp ? `${Math.round(metrics.lcp)}ms` : '...'}</value>
        </div>
        
        <div className={`metric ${getMetricStatus(metrics.fid, { good: 100, fair: 300 })}`}>
          <label>First Input Delay</label>
          <value>{metrics.fid ? `${Math.round(metrics.fid)}ms` : '...'}</value>
        </div>
        
        <div className={`metric ${getMetricStatus(metrics.cls, { good: 0.1, fair: 0.25 })}`}>
          <label>Cumulative Layout Shift</label>
          <value>{metrics.cls ? metrics.cls.toFixed(3) : '...'}</value>
        </div>
        
        <div className={`metric ${getMetricStatus(metrics.fps, { good: 55, fair: 30 })}`}>
          <label>Frame Rate</label>
          <value>{metrics.fps ? `${metrics.fps} fps` : '...'}</value>
        </div>
        
        {metrics.memory && (
          <div className={`metric ${getMetricStatus(metrics.memory.used, { good: 50, fair: 100 })}`}>
            <label>Memory Usage</label>
            <value>{metrics.memory.used}MB / {metrics.memory.total}MB</value>
          </div>
        )}
      </div>
    </div>
  );
};
```

### Automated Performance Alerts

```javascript
// Performance alerting system
export class PerformanceAlerting {
  static thresholds = {
    fcp: 1800, // ms
    lcp: 2500, // ms
    fid: 100,  // ms
    cls: 0.1,  // score
    memory: 100, // MB
    fps: 30    // frames per second
  };
  
  static alerts = [];
  
  static checkThreshold(metric, value) {
    const threshold = PerformanceAlerting.thresholds[metric];
    if (!threshold) return;
    
    const isExceeded = value > threshold;
    const alertKey = `${metric}-threshold`;
    
    if (isExceeded && !PerformanceAlerting.alerts.includes(alertKey)) {
      PerformanceAlerting.alerts.push(alertKey);
      PerformanceAlerting.sendAlert(metric, value, threshold);
    } else if (!isExceeded) {
      PerformanceAlerting.alerts = PerformanceAlerting.alerts.filter(a => a !== alertKey);
    }
  }
  
  static sendAlert(metric, value, threshold) {
    const message = `Performance alert: ${metric} (${value}) exceeded threshold (${threshold})`;
    
    console.warn('🚨', message);
    
    // Send to monitoring service (if configured)
    if (window.MONITORING_ENDPOINT) {
      fetch(window.MONITORING_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'performance-alert',
          metric,
          value,
          threshold,
          timestamp: Date.now(),
          userAgent: navigator.userAgent,
          url: window.location.href
        })
      }).catch(console.error);
    }
    
    // Show user notification for critical issues
    if ((metric === 'memory' && value > 150) || (metric === 'fps' && value < 20)) {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Performance Issue', {
          body: `Your device may be experiencing performance issues. Consider closing other tabs.`,
          icon: '/favicon.ico'
        });
      }
    }
  }
}
```

---

## Conclusion

This performance documentation provides a comprehensive framework for maintaining optimal performance in the Singapore Weather Cam application. Key implementation priorities:

1. **Immediate Actions**:
   - Implement Core Web Vitals monitoring
   - Enable service worker caching
   - Optimize image loading and compression
   - Add performance budgets to CI/CD

2. **Short-term Improvements**:
   - Implement code splitting for major routes
   - Add mobile-specific optimizations
   - Set up real-time performance monitoring
   - Create performance regression testing

3. **Long-term Optimizations**:
   - Advanced caching strategies
   - Battery-aware performance modes
   - Predictive resource loading
   - Machine learning-based optimization

**Performance Targets**:
- **Load Time**: <2s on 3G networks
- **Interactivity**: <50ms response time
- **Memory Usage**: <100MB baseline
- **Frame Rate**: Consistent 60fps
- **Lighthouse Score**: >95 for Performance

Regular monitoring and optimization using these guidelines will ensure the Singapore Weather Cam maintains excellent performance across all devices and network conditions.