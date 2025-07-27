import { useEffect, useCallback, useRef, useState } from 'react';

/**
 * Advanced Performance Optimization Hook
 * Implements comprehensive performance monitoring and optimization strategies
 */
export const usePerformanceOptimization = ({
  enableRealUserMonitoring = true,
  performanceBudgets = {
    lcp: 2500,
    fid: 100,
    cls: 0.1,
    bundleSize: 500 * 1024,
  },
  enableAdaptiveLoading = true,
} = {}) => {
  const [performanceMetrics, setPerformanceMetrics] = useState({
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null,
    fcp: null,
    renderTime: null,
    bundleSize: null,
    networkSpeed: 'unknown',
    deviceType: 'unknown',
  });

  const [optimizationState, setOptimizationState] = useState({
    imageOptimization: true,
    lazyLoading: true,
    codesplitting: true,
    prefetching: false,
    serviceWorker: false,
    compressionLevel: 'auto',
  });

  const observerRef = useRef(null);
  const metricsRef = useRef({});

  /**
   * Core Web Vitals Measurement
   */
  const measureCoreWebVitals = useCallback(() => {
    if (!enableRealUserMonitoring) {return;}

    // Largest Contentful Paint (LCP)
    const measureLCP = () => {
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          const lcp = lastEntry.renderTime || lastEntry.loadTime;

          setPerformanceMetrics(prev => ({ ...prev, lcp }));
          metricsRef.current.lcp = lcp;

          // Check against budget
          if (lcp > performanceBudgets.lcp) {
            console.warn(`LCP budget exceeded: ${lcp}ms > ${performanceBudgets.lcp}ms`);
            triggerOptimization('lcp', lcp);
          }
        });

        observer.observe({ entryTypes: ['largest-contentful-paint'] });
        observerRef.current = observer;
      }
    };

    // First Input Delay (FID)
    const measureFID = () => {
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            const fid = entry.processingStart - entry.startTime;
            setPerformanceMetrics(prev => ({ ...prev, fid }));
            metricsRef.current.fid = fid;

            if (fid > performanceBudgets.fid) {
              console.warn(`FID budget exceeded: ${fid}ms > ${performanceBudgets.fid}ms`);
              triggerOptimization('fid', fid);
            }
          });
        });

        observer.observe({ entryTypes: ['first-input'] });
      }
    };

    // Cumulative Layout Shift (CLS)
    const measureCLS = () => {
      if ('PerformanceObserver' in window) {
        let clsValue = 0;
        const clsEntries = [];

        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsEntries.push(entry);
              clsValue += entry.value;
            }
          }

          setPerformanceMetrics(prev => ({ ...prev, cls: clsValue }));
          metricsRef.current.cls = clsValue;

          if (clsValue > performanceBudgets.cls) {
            console.warn(`CLS budget exceeded: ${clsValue} > ${performanceBudgets.cls}`);
            triggerOptimization('cls', clsValue);
          }
        });

        observer.observe({ entryTypes: ['layout-shift'] });
      }
    };

    measureLCP();
    measureFID();
    measureCLS();
  }, [enableRealUserMonitoring, performanceBudgets]);

  /**
   * Network Speed Detection
   */
  const detectNetworkSpeed = useCallback(() => {
    if ('connection' in navigator) {
      const connection = navigator.connection;
      const effectiveType = connection.effectiveType;

      setPerformanceMetrics(prev => ({
        ...prev,
        networkSpeed: effectiveType,
      }));

      // Adaptive loading based on network speed
      if (enableAdaptiveLoading) {
        if (effectiveType === 'slow-2g' || effectiveType === '2g') {
          setOptimizationState(prev => ({
            ...prev,
            imageOptimization: true,
            lazyLoading: true,
            compressionLevel: 'high',
          }));
        } else if (effectiveType === '4g') {
          setOptimizationState(prev => ({
            ...prev,
            prefetching: true,
            compressionLevel: 'balanced',
          }));
        }
      }
    }
  }, [enableAdaptiveLoading]);

  /**
   * Device Type Detection
   */
  const detectDeviceType = useCallback(() => {
    const userAgent = navigator.userAgent;
    let deviceType = 'desktop';

    if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)) {
      deviceType = 'mobile';
    } else if (/iPad/i.test(userAgent)) {
      deviceType = 'tablet';
    }

    setPerformanceMetrics(prev => ({ ...prev, deviceType }));

    // Device-specific optimizations
    if (deviceType === 'mobile') {
      setOptimizationState(prev => ({
        ...prev,
        imageOptimization: true,
        lazyLoading: true,
      }));
    }
  }, []);

  /**
   * Bundle Size Analysis
   */
  const analyzeBundleSize = useCallback(async () => {
    try {
      // Estimate bundle size from performance API
      const navigationEntries = performance.getEntriesByType('navigation');
      if (navigationEntries.length > 0) {
        const entry = navigationEntries[0];
        const transferSize = entry.transferSize || 0;

        setPerformanceMetrics(prev => ({
          ...prev,
          bundleSize: transferSize,
        }));

        if (transferSize > performanceBudgets.bundleSize) {
          console.warn(`Bundle size budget exceeded: ${transferSize} bytes > ${performanceBudgets.bundleSize} bytes`);
          triggerOptimization('bundleSize', transferSize);
        }
      }
    } catch (error) {
      console.warn('Failed to analyze bundle size:', error);
    }
  }, [performanceBudgets.bundleSize]);

  /**
   * Automatic Optimization Triggers
   */
  const triggerOptimization = useCallback((metric, value) => {
    switch (metric) {
      case 'lcp':
        // Enable image optimization and lazy loading
        setOptimizationState(prev => ({
          ...prev,
          imageOptimization: true,
          lazyLoading: true,
          prefetching: true,
        }));
        break;

      case 'fid':
        // Enable code splitting and reduce main thread work
        setOptimizationState(prev => ({
          ...prev,
          codesplitting: true,
          compressionLevel: 'high',
        }));
        break;

      case 'cls':
        // Implement layout optimization
        document.body.classList.add('optimize-layout');
        break;

      case 'bundleSize':
        // Enable aggressive compression
        setOptimizationState(prev => ({
          ...prev,
          compressionLevel: 'high',
          codesplitting: true,
        }));
        break;
    }
  }, []);

  /**
   * Memory Usage Monitoring
   */
  const monitorMemoryUsage = useCallback(() => {
    if ('memory' in performance) {
      const memory = performance.memory;
      const memoryUsage = {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
      };

      // Warn if memory usage is high
      const usagePercentage = (memoryUsage.used / memoryUsage.limit) * 100;
      if (usagePercentage > 80) {
        console.warn(`High memory usage: ${usagePercentage.toFixed(1)}%`);

        // Trigger garbage collection hint
        if ('gc' in window && typeof window.gc === 'function') {
          window.gc();
        }
      }

      return memoryUsage;
    }
    return null;
  }, []);

  /**
   * Performance Report Generation
   */
  const generatePerformanceReport = useCallback(() => {
    const report = {
      timestamp: new Date().toISOString(),
      metrics: { ...performanceMetrics },
      optimizations: { ...optimizationState },
      budgetCompliance: {
        lcp: performanceMetrics.lcp <= performanceBudgets.lcp,
        fid: performanceMetrics.fid <= performanceBudgets.fid,
        cls: performanceMetrics.cls <= performanceBudgets.cls,
        bundleSize: performanceMetrics.bundleSize <= performanceBudgets.bundleSize,
      },
      recommendations: [],
    };

    // Generate recommendations
    if (performanceMetrics.lcp > performanceBudgets.lcp) {
      report.recommendations.push('Consider image optimization and lazy loading');
    }
    if (performanceMetrics.fid > performanceBudgets.fid) {
      report.recommendations.push('Reduce main thread blocking time');
    }
    if (performanceMetrics.cls > performanceBudgets.cls) {
      report.recommendations.push('Implement proper layout shift prevention');
    }

    return report;
  }, [performanceMetrics, optimizationState, performanceBudgets]);

  /**
   * Initialize Performance Monitoring
   */
  useEffect(() => {
    measureCoreWebVitals();
    detectNetworkSpeed();
    detectDeviceType();
    analyzeBundleSize();

    // Monitor memory usage periodically
    const memoryInterval = setInterval(monitorMemoryUsage, 30000);

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
      clearInterval(memoryInterval);
    };
  }, [measureCoreWebVitals, detectNetworkSpeed, detectDeviceType, analyzeBundleSize, monitorMemoryUsage]);

  return {
    // Current metrics
    performanceMetrics,
    optimizationState,

    // Actions
    generatePerformanceReport,
    triggerOptimization,

    // Utilities
    isPerformant: performanceMetrics.lcp <= performanceBudgets.lcp &&
                  performanceMetrics.fid <= performanceBudgets.fid &&
                  performanceMetrics.cls <= performanceBudgets.cls,

    // Configuration
    updateOptimizations: setOptimizationState,

    // Manual measurements
    measureNow: useCallback(() => {
      measureCoreWebVitals();
      analyzeBundleSize();
    }, [measureCoreWebVitals, analyzeBundleSize]),
  };
};

export default usePerformanceOptimization;