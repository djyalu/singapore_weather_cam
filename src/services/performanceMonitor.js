/**
 * Performance Monitoring Service
 *
 * Provides comprehensive performance monitoring for React components,
 * animations, and overall application performance.
 */

class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = new Map();
    this.thresholds = {
      componentRender: 16, // 16ms for 60fps
      animationFrame: 16.67, // 60fps target
      bundleSize: 500 * 1024, // 500KB warning
      imageLoad: 3000, // 3 seconds
      apiResponse: 5000, // 5 seconds
    };
    this.initialized = false;
    this.init();
  }

  init() {
    if (this.initialized) {return;}

    // Initialize performance observers
    this.initPerformanceObserver();
    this.initMutationObserver();
    this.initIntersectionObserver();
    this.initMemoryMonitoring();

    this.initialized = true;
    console.log('🚀 Performance Monitor initialized');
  }

  // ===== Component Performance Tracking =====

  /**
   * Start measuring component render time
   * @param {string} componentName - Name of the component
   * @param {Object} props - Component props for context
   */
  startComponentMeasure(componentName, props = {}) {
    const measureId = `${componentName}-${Date.now()}`;
    const startTime = performance.now();

    this.metrics.set(measureId, {
      type: 'component',
      componentName,
      startTime,
      props: this.sanitizeProps(props),
      phase: 'render',
    });

    return measureId;
  }

  /**
   * End component render measurement
   * @param {string} measureId - Measurement ID from startComponentMeasure
   * @param {Object} metadata - Additional metadata
   */
  endComponentMeasure(measureId, metadata = {}) {
    const metric = this.metrics.get(measureId);
    if (!metric) {return;}

    const endTime = performance.now();
    const renderTime = endTime - metric.startTime;

    metric.endTime = endTime;
    metric.renderTime = renderTime;
    metric.metadata = metadata;
    metric.phase = 'complete';

    // Check against thresholds
    if (renderTime > this.thresholds.componentRender) {
      console.warn(`⚠️ Slow component render: ${metric.componentName} took ${renderTime.toFixed(2)}ms`);
    }

    // Store completed measurement
    this.storeMetric(metric);
    this.metrics.delete(measureId);

    return renderTime;
  }

  /**
   * Measure component lifecycle with React DevTools integration
   * @param {string} componentName - Component name
   * @param {Function} renderFunction - Function to measure
   */
  async measureComponentLifecycle(componentName, renderFunction) {
    const measureId = this.startComponentMeasure(componentName);

    try {
      const result = await renderFunction();
      this.endComponentMeasure(measureId, { success: true });
      return result;
    } catch (error) {
      this.endComponentMeasure(measureId, { success: false, error: error.message });
      throw error;
    }
  }

  // ===== Animation Performance Tracking =====

  /**
   * Monitor animation frame rate
   * @param {string} animationName - Name of animation
   * @param {number} duration - Expected duration in ms
   */
  monitorAnimation(animationName, duration = 1000) {
    const frames = [];
    const startTime = performance.now();
    let animationId;

    const measureFrame = (timestamp) => {
      frames.push(timestamp);

      if (timestamp - startTime < duration) {
        animationId = requestAnimationFrame(measureFrame);
      } else {
        this.analyzeAnimationPerformance(animationName, frames, startTime);
      }
    };

    animationId = requestAnimationFrame(measureFrame);

    // Return cleanup function
    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }

  /**
   * Analyze animation performance data
   * @param {string} animationName - Animation name
   * @param {Array} frames - Frame timestamps
   * @param {number} startTime - Animation start time
   */
  analyzeAnimationPerformance(animationName, frames, startTime) {
    if (frames.length < 2) {return;}

    const frameDurations = [];
    for (let i = 1; i < frames.length; i++) {
      frameDurations.push(frames[i] - frames[i - 1]);
    }

    const avgFrameDuration = frameDurations.reduce((a, b) => a + b, 0) / frameDurations.length;
    const fps = 1000 / avgFrameDuration;
    const droppedFrames = frameDurations.filter(duration => duration > this.thresholds.animationFrame).length;

    const metric = {
      type: 'animation',
      animationName,
      duration: frames[frames.length - 1] - startTime,
      averageFPS: fps,
      droppedFrames,
      frameCount: frames.length,
      timestamp: Date.now(),
    };

    this.storeMetric(metric);

    if (fps < 50) {
      console.warn(`⚠️ Poor animation performance: ${animationName} averaged ${fps.toFixed(1)} FPS`);
    }
  }

  // ===== Memory and Resource Monitoring =====

  /**
   * Monitor memory usage
   */
  getMemoryUsage() {
    if (!performance.memory) {
      return { supported: false };
    }

    return {
      supported: true,
      usedJSHeapSize: performance.memory.usedJSHeapSize,
      totalJSHeapSize: performance.memory.totalJSHeapSize,
      jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
      usagePercentage: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100,
    };
  }

  /**
   * Monitor bundle size and loading performance
   */
  monitorBundlePerformance() {
    if (!performance.getEntriesByType) {return;}

    const navigationEntries = performance.getEntriesByType('navigation');
    const resourceEntries = performance.getEntriesByType('resource');

    if (navigationEntries.length > 0) {
      const nav = navigationEntries[0];
      const loadTime = nav.loadEventEnd - nav.fetchStart;
      const domContentLoaded = nav.domContentLoadedEventEnd - nav.fetchStart;

      this.storeMetric({
        type: 'bundle',
        loadTime,
        domContentLoaded,
        timeToInteractive: nav.loadEventEnd - nav.fetchStart,
        timestamp: Date.now(),
      });

      if (loadTime > 3000) {
        console.warn(`⚠️ Slow page load: ${loadTime.toFixed(0)}ms`);
      }
    }

    // Analyze resource loading
    const jsResources = resourceEntries.filter(entry => entry.name.includes('.js'));
    const cssResources = resourceEntries.filter(entry => entry.name.includes('.css'));
    const imageResources = resourceEntries.filter(entry =>
      entry.name.includes('.jpg') || entry.name.includes('.png') || entry.name.includes('.svg'),
    );

    this.storeMetric({
      type: 'resources',
      jsCount: jsResources.length,
      cssCount: cssResources.length,
      imageCount: imageResources.length,
      totalResources: resourceEntries.length,
      timestamp: Date.now(),
    });
  }

  // ===== Performance Observers =====

  initPerformanceObserver() {
    if (!('PerformanceObserver' in window)) {return;}

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach(entry => {
        if (entry.entryType === 'measure') {
          this.handlePerformanceMeasure(entry);
        } else if (entry.entryType === 'paint') {
          this.handlePaintTiming(entry);
        } else if (entry.entryType === 'largest-contentful-paint') {
          this.handleLCP(entry);
        }
      });
    });

    try {
      observer.observe({ entryTypes: ['measure', 'paint', 'largest-contentful-paint'] });
      this.observers.set('performance', observer);
    } catch (error) {
      console.warn('Performance Observer not fully supported:', error);
    }
  }

  initMutationObserver() {
    const observer = new MutationObserver((mutations) => {
      const significantMutations = mutations.filter(mutation =>
        mutation.type === 'childList' && mutation.addedNodes.length > 5,
      );

      if (significantMutations.length > 0) {
        this.storeMetric({
          type: 'dom-mutation',
          mutationCount: significantMutations.length,
          timestamp: Date.now(),
        });
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: false,
    });

    this.observers.set('mutation', observer);
  }

  initIntersectionObserver() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const element = entry.target;
          if (element.dataset.perfMonitor) {
            this.storeMetric({
              type: 'visibility',
              element: element.dataset.perfMonitor,
              visibilityRatio: entry.intersectionRatio,
              timestamp: Date.now(),
            });
          }
        }
      });
    }, { threshold: [0, 0.25, 0.5, 0.75, 1] });

    this.observers.set('intersection', observer);
  }

  initMemoryMonitoring() {
    // Monitor memory every 30 seconds
    setInterval(() => {
      const memory = this.getMemoryUsage();
      if (memory.supported) {
        this.storeMetric({
          type: 'memory',
          ...memory,
          timestamp: Date.now(),
        });

        if (memory.usagePercentage > 80) {
          console.warn(`⚠️ High memory usage: ${memory.usagePercentage.toFixed(1)}%`);
        }
      }
    }, 30000);
  }

  // ===== Event Handlers =====

  handlePerformanceMeasure(entry) {
    this.storeMetric({
      type: 'performance-measure',
      name: entry.name,
      duration: entry.duration,
      startTime: entry.startTime,
      timestamp: Date.now(),
    });
  }

  handlePaintTiming(entry) {
    this.storeMetric({
      type: 'paint',
      paintType: entry.name,
      startTime: entry.startTime,
      timestamp: Date.now(),
    });

    if (entry.name === 'first-contentful-paint' && entry.startTime > 2000) {
      console.warn(`⚠️ Slow First Contentful Paint: ${entry.startTime.toFixed(0)}ms`);
    }
  }

  handleLCP(entry) {
    this.storeMetric({
      type: 'lcp',
      startTime: entry.startTime,
      size: entry.size,
      element: entry.element?.tagName || 'unknown',
      timestamp: Date.now(),
    });

    if (entry.startTime > 2500) {
      console.warn(`⚠️ Poor Largest Contentful Paint: ${entry.startTime.toFixed(0)}ms`);
    }
  }

  // ===== Data Management =====

  storeMetric(metric) {
    const key = `perf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Store in memory (keep last 100 metrics)
    if (!this.storedMetrics) {
      this.storedMetrics = [];
    }

    this.storedMetrics.push({ ...metric, id: key });

    // Keep only recent metrics
    if (this.storedMetrics.length > 100) {
      this.storedMetrics = this.storedMetrics.slice(-100);
    }

    // Store in localStorage for persistence (keep last 50)
    try {
      const stored = JSON.parse(localStorage.getItem('perf-metrics') || '[]');
      stored.push(metric);
      const recent = stored.slice(-50);
      localStorage.setItem('perf-metrics', JSON.stringify(recent));
    } catch (error) {
      // Ignore localStorage errors
    }
  }

  sanitizeProps(props) {
    // Remove functions and complex objects from props for storage
    const sanitized = {};
    Object.keys(props).forEach(key => {
      const value = props[key];
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        sanitized[key] = value;
      } else if (value === null || value === undefined) {
        sanitized[key] = value;
      } else {
        sanitized[key] = '[complex]';
      }
    });
    return sanitized;
  }

  // ===== Public API =====

  /**
   * Get performance report
   * @param {string} type - Type of metrics to include
   * @param {number} since - Timestamp to filter from
   */
  getPerformanceReport(type = null, since = null) {
    let metrics = this.storedMetrics || [];

    if (type) {
      metrics = metrics.filter(metric => metric.type === type);
    }

    if (since) {
      metrics = metrics.filter(metric => metric.timestamp >= since);
    }

    return {
      metrics,
      summary: this.generateSummary(metrics),
      memory: this.getMemoryUsage(),
      timestamp: Date.now(),
    };
  }

  generateSummary(metrics) {
    const summary = {
      totalMetrics: metrics.length,
      types: {},
      averages: {},
      warnings: [],
    };

    metrics.forEach(metric => {
      if (!summary.types[metric.type]) {
        summary.types[metric.type] = 0;
      }
      summary.types[metric.type]++;

      // Calculate averages for specific types
      if (metric.type === 'component' && metric.renderTime) {
        if (!summary.averages.componentRender) {
          summary.averages.componentRender = [];
        }
        summary.averages.componentRender.push(metric.renderTime);
      }

      if (metric.type === 'animation' && metric.averageFPS) {
        if (!summary.averages.animationFPS) {
          summary.averages.animationFPS = [];
        }
        summary.averages.animationFPS.push(metric.averageFPS);
      }
    });

    // Calculate final averages
    Object.keys(summary.averages).forEach(key => {
      const values = summary.averages[key];
      summary.averages[key] = values.reduce((a, b) => a + b, 0) / values.length;
    });

    return summary;
  }

  /**
   * Monitor a specific element for performance
   * @param {HTMLElement} element - Element to monitor
   * @param {string} name - Name for the element
   */
  monitorElement(element, name) {
    if (!element || !this.observers.has('intersection')) {return;}

    element.dataset.perfMonitor = name;
    this.observers.get('intersection').observe(element);

    return () => {
      this.observers.get('intersection').unobserve(element);
      delete element.dataset.perfMonitor;
    };
  }

  /**
   * Cleanup and destroy the performance monitor
   */
  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers.clear();
    this.metrics.clear();
    this.initialized = false;
  }
}

// Create singleton instance
const performanceMonitor = new PerformanceMonitor();

// Export utilities for React components
export const usePerformanceMonitor = () => {
  return {
    startMeasure: (name, props) => performanceMonitor.startComponentMeasure(name, props),
    endMeasure: (id, metadata) => performanceMonitor.endComponentMeasure(id, metadata),
    monitorAnimation: (name, duration) => performanceMonitor.monitorAnimation(name, duration),
    monitorElement: (element, name) => performanceMonitor.monitorElement(element, name),
    getReport: (type, since) => performanceMonitor.getPerformanceReport(type, since),
  };
};

export default performanceMonitor;