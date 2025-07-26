/**
 * Metrics and Observability Service for Singapore Weather Cam
 * Provides comprehensive application metrics, logging, and performance monitoring
 */

import { healthService } from './healthService.js';

/**
 * Performance Metrics Collector
 */
export class MetricsService {
  constructor() {
    this.metrics = {
      pageViews: new Map(),
      userSessions: new Map(),
      apiCalls: new Map(),
      componentRenders: new Map(),
      userInteractions: new Map(),
      errorRates: new Map(),
      performanceMarks: new Map(),
    };

    this.config = {
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      metricsRetention: 24 * 60 * 60 * 1000, // 24 hours
      batchSize: 50,
      flushInterval: 60 * 1000, // 1 minute
    };

    this.sessionId = this.generateSessionId();
    this.userId = this.getUserId();
    this.startTime = Date.now();

    // Initialize performance monitoring
    this.initializePerformanceObserver();
    this.startMetricsCollection();
  }

  /**
   * Generate unique session ID
   */
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  /**
   * Get or create user ID
   */
  getUserId() {
    let userId = localStorage.getItem('user_id');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
      localStorage.setItem('user_id', userId);
    }
    return userId;
  }

  /**
   * Initialize performance observer for Web Vitals
   */
  initializePerformanceObserver() {
    if (typeof window === 'undefined' || !window.PerformanceObserver) {return;}

    try {
      // Observe Largest Contentful Paint (LCP)
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.recordWebVital('LCP', lastEntry.startTime);
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

      // Observe First Input Delay (FID)
      const fidObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.recordWebVital('FID', entry.processingStart - entry.startTime);
        });
      });
      fidObserver.observe({ entryTypes: ['first-input'] });

      // Observe Cumulative Layout Shift (CLS)
      let clsValue = 0;
      const clsObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        this.recordWebVital('CLS', clsValue);
      });
      clsObserver.observe({ entryTypes: ['layout-shift'] });

      // Observe Navigation Timing
      const navObserver = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.recordNavigationTiming(entry);
        });
      });
      navObserver.observe({ entryTypes: ['navigation'] });

    } catch (error) {
      console.warn('Performance Observer not fully supported:', error);
    }
  }

  /**
   * Record Web Vital metric
   */
  recordWebVital(name, value) {
    const metric = {
      name,
      value: Math.round(value),
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId,
      url: window.location.pathname,
    };

    this.metrics.performanceMarks.set(`webvital_${name}_${Date.now()}`, metric);

    // Log significant values
    if ((name === 'LCP' && value > 2500) ||
        (name === 'FID' && value > 100) ||
        (name === 'CLS' && value > 0.1)) {
      console.warn(`⚠️ Poor ${name}: ${value}${name === 'CLS' ? '' : 'ms'}`);
    }
  }

  /**
   * Record navigation timing
   */
  recordNavigationTiming(entry) {
    const timing = {
      domContentLoaded: Math.round(entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart),
      loadComplete: Math.round(entry.loadEventEnd - entry.loadEventStart),
      firstPaint: Math.round(entry.fetchStart),
      domInteractive: Math.round(entry.domInteractive - entry.fetchStart),
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      url: window.location.pathname,
    };

    this.metrics.performanceMarks.set(`navigation_${Date.now()}`, timing);
  }

  /**
   * Track page view
   */
  trackPageView(page, metadata = {}) {
    const pageView = {
      page,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId,
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      screenSize: `${screen.width}x${screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      ...metadata,
    };

    this.metrics.pageViews.set(`pageview_${Date.now()}`, pageView);
    this.updateSessionActivity();
  }

  /**
   * Track API call metrics
   */
  trackAPICall(endpoint, method, status, duration, metadata = {}) {
    const apiCall = {
      endpoint,
      method,
      status,
      duration: Math.round(duration),
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      success: status >= 200 && status < 400,
      ...metadata,
    };

    const key = `api_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    this.metrics.apiCalls.set(key, apiCall);

    // Track error rates
    this.updateErrorRate(endpoint, apiCall.success);
  }

  /**
   * Track user interaction
   */
  trackUserInteraction(type, element, metadata = {}) {
    const interaction = {
      type, // click, scroll, input, etc.
      element,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      page: window.location.pathname,
      ...metadata,
    };

    this.metrics.userInteractions.set(`interaction_${Date.now()}`, interaction);
    this.updateSessionActivity();
  }

  /**
   * Track component render performance
   */
  trackComponentRender(componentName, renderTime, metadata = {}) {
    const render = {
      componentName,
      renderTime: Math.round(renderTime),
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      ...metadata,
    };

    this.metrics.componentRenders.set(`render_${Date.now()}`, render);

    // Warn about slow renders
    if (renderTime > 16) { // 60 FPS threshold
      console.warn(`🐌 Slow render: ${componentName} took ${renderTime}ms`);
    }
  }

  /**
   * Track custom business metrics
   */
  trackCustomMetric(name, value, unit = 'count', metadata = {}) {
    const metric = {
      name,
      value,
      unit,
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId,
      ...metadata,
    };

    this.metrics.performanceMarks.set(`custom_${name}_${Date.now()}`, metric);
  }

  /**
   * Update session activity
   */
  updateSessionActivity() {
    const session = this.metrics.userSessions.get(this.sessionId) || {
      userId: this.userId,
      startTime: new Date().toISOString(),
      pageViews: 0,
      interactions: 0,
    };

    session.lastActivity = new Date().toISOString();
    session.duration = Date.now() - this.startTime;

    this.metrics.userSessions.set(this.sessionId, session);
  }

  /**
   * Update error rate for endpoint
   */
  updateErrorRate(endpoint, success) {
    const now = Date.now();
    const windowMs = 5 * 60 * 1000; // 5 minute window
    const key = `errorRate_${endpoint}`;

    const errorData = this.metrics.errorRates.get(key) || {
      requests: [],
      errors: [],
    };

    // Clean old data
    errorData.requests = errorData.requests.filter(time => now - time < windowMs);
    errorData.errors = errorData.errors.filter(time => now - time < windowMs);

    // Add new data
    errorData.requests.push(now);
    if (!success) {
      errorData.errors.push(now);
    }

    this.metrics.errorRates.set(key, errorData);

    // Calculate error rate
    const errorRate = errorData.errors.length / errorData.requests.length;
    if (errorRate > 0.1 && errorData.requests.length > 10) {
      console.error(`🚨 High error rate for ${endpoint}: ${(errorRate * 100).toFixed(1)}%`);

      // Report to health service
      healthService.recordError(new Error(`High error rate: ${endpoint}`), {
        type: 'high_error_rate',
        endpoint,
        errorRate,
        requests: errorData.requests.length,
        errors: errorData.errors.length,
      });
    }
  }

  /**
   * Start automated metrics collection
   */
  startMetricsCollection() {
    // Track initial page load
    this.trackPageView(window.location.pathname, {
      type: 'initial_load',
      timestamp: new Date().toISOString(),
    });

    // Set up periodic cleanup
    setInterval(() => {
      this.cleanupOldMetrics();
    }, this.config.flushInterval);

    // Track page visibility changes
    document.addEventListener('visibilitychange', () => {
      this.trackUserInteraction('visibility_change', 'document', {
        visible: !document.hidden,
      });
    });

    // Track unload events
    window.addEventListener('beforeunload', () => {
      this.flushMetrics();
    });
  }

  /**
   * Clean up old metrics to prevent memory leaks
   */
  cleanupOldMetrics() {
    const cutoffTime = Date.now() - this.config.metricsRetention;

    Object.values(this.metrics).forEach(metricMap => {
      if (metricMap instanceof Map) {
        for (const [key, metric] of metricMap.entries()) {
          const metricTime = new Date(metric.timestamp).getTime();
          if (metricTime < cutoffTime) {
            metricMap.delete(key);
          }
        }
      }
    });
  }

  /**
   * Get comprehensive metrics report
   */
  getMetricsReport() {
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;
    const report = {
      timestamp: new Date().toISOString(),
      sessionId: this.sessionId,
      userId: this.userId,
      uptime: now - this.startTime,
    };

    // Page views summary
    const recentPageViews = Array.from(this.metrics.pageViews.values())
      .filter(pv => now - new Date(pv.timestamp).getTime() < oneHour);

    report.pageViews = {
      total: this.metrics.pageViews.size,
      lastHour: recentPageViews.length,
      uniquePages: new Set(recentPageViews.map(pv => pv.page)).size,
    };

    // API performance summary
    const recentAPICalls = Array.from(this.metrics.apiCalls.values())
      .filter(call => now - new Date(call.timestamp).getTime() < oneHour);

    if (recentAPICalls.length > 0) {
      const successfulCalls = recentAPICalls.filter(call => call.success);
      const avgDuration = recentAPICalls.reduce((sum, call) => sum + call.duration, 0) / recentAPICalls.length;

      report.apiPerformance = {
        totalCalls: recentAPICalls.length,
        successRate: (successfulCalls.length / recentAPICalls.length * 100).toFixed(1) + '%',
        averageDuration: Math.round(avgDuration),
        slowCalls: recentAPICalls.filter(call => call.duration > 1000).length,
      };
    }

    // User interaction summary
    const recentInteractions = Array.from(this.metrics.userInteractions.values())
      .filter(interaction => now - new Date(interaction.timestamp).getTime() < oneHour);

    report.userActivity = {
      totalInteractions: recentInteractions.length,
      uniqueTypes: new Set(recentInteractions.map(i => i.type)).size,
      sessionDuration: now - this.startTime,
    };

    // Performance summary
    const recentPerformanceMarks = Array.from(this.metrics.performanceMarks.values())
      .filter(mark => now - new Date(mark.timestamp).getTime() < oneHour);

    if (recentPerformanceMarks.length > 0) {
      const webVitals = recentPerformanceMarks.filter(mark => ['LCP', 'FID', 'CLS'].includes(mark.name));
      report.webVitals = webVitals.reduce((acc, vital) => {
        acc[vital.name] = vital.value;
        return acc;
      }, {});
    }

    return report;
  }

  /**
   * Flush metrics (for page unload)
   */
  flushMetrics() {
    try {
      const report = this.getMetricsReport();

      // In a real application, you would send this to your analytics service
      console.log('📊 Metrics Report:', report);

      // Store locally for development
      if (import.meta.env.DEV) {
        const reports = JSON.parse(localStorage.getItem('metrics_reports') || '[]');
        reports.push(report);
        // Keep only last 10 reports
        if (reports.length > 10) {
          reports.splice(0, reports.length - 10);
        }
        localStorage.setItem('metrics_reports', JSON.stringify(reports));
      }

    } catch (error) {
      console.error('Failed to flush metrics:', error);
    }
  }

  /**
   * Get real-time dashboard data
   */
  getDashboardData() {
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    // Recent metrics (last 5 minutes)
    const recentAPICalls = Array.from(this.metrics.apiCalls.values())
      .filter(call => now - new Date(call.timestamp).getTime() < fiveMinutes);

    const recentInteractions = Array.from(this.metrics.userInteractions.values())
      .filter(interaction => now - new Date(interaction.timestamp).getTime() < fiveMinutes);

    const recentErrors = recentAPICalls.filter(call => !call.success);

    return {
      realTime: {
        apiCalls: recentAPICalls.length,
        errors: recentErrors.length,
        interactions: recentInteractions.length,
        avgResponseTime: recentAPICalls.length > 0
          ? Math.round(recentAPICalls.reduce((sum, call) => sum + call.duration, 0) / recentAPICalls.length)
          : 0,
      },
      health: healthService.getHealthReport(),
      session: {
        id: this.sessionId,
        duration: now - this.startTime,
        userId: this.userId,
      },
    };
  }
}

// Create singleton instance
export const metricsService = new MetricsService();

/**
 * React hook for metrics tracking
 */
export const useMetrics = () => {
  const trackPageView = (page, metadata) => metricsService.trackPageView(page, metadata);
  const trackUserInteraction = (type, element, metadata) => metricsService.trackUserInteraction(type, element, metadata);
  const trackCustomMetric = (name, value, unit, metadata) => metricsService.trackCustomMetric(name, value, unit, metadata);

  return {
    trackPageView,
    trackUserInteraction,
    trackCustomMetric,
    getDashboardData: () => metricsService.getDashboardData(),
    getMetricsReport: () => metricsService.getMetricsReport(),
  };
};

export default metricsService;