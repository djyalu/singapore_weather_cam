/**
 * Health Monitoring Service for Singapore Weather Cam
 * Provides comprehensive system health monitoring and diagnostics
 */

class HealthService {
  constructor() {
    this.metrics = {
      apiHealth: new Map(),
      performanceMetrics: new Map(),
      errorLog: [],
      systemStatus: 'healthy',
      lastCheck: null,
      uptime: Date.now()
    };
    
    this.thresholds = {
      responseTime: 5000, // 5 seconds
      errorRate: 0.1, // 10%
      cacheHitRate: 0.7, // 70%
      memoryUsage: 0.8 // 80%
    };
    
    this.intervals = new Map();
    this.subscribers = new Set();
    
    this.startMonitoring();
  }

  /**
   * Start continuous health monitoring
   */
  startMonitoring() {
    // Check API health every 2 minutes
    this.intervals.set('apiHealth', setInterval(() => {
      this.checkAPIHealth();
    }, 2 * 60 * 1000));

    // Check performance metrics every 30 seconds
    this.intervals.set('performance', setInterval(() => {
      this.checkPerformanceMetrics();
    }, 30 * 1000));

    // Clean old metrics every 10 minutes
    this.intervals.set('cleanup', setInterval(() => {
      this.cleanupOldMetrics();
    }, 10 * 60 * 1000));
  }

  /**
   * Stop monitoring (cleanup)
   */
  stopMonitoring() {
    this.intervals.forEach((interval) => clearInterval(interval));
    this.intervals.clear();
  }

  /**
   * Subscribe to health status changes
   */
  subscribe(callback) {
    this.subscribers.add(callback);
    return () => this.subscribers.delete(callback);
  }

  /**
   * Notify subscribers of status changes
   */
  notifySubscribers(event) {
    this.subscribers.forEach(callback => {
      try {
        callback(event);
      } catch (error) {
        console.error('Health service subscriber error:', error);
      }
    });
  }

  /**
   * Check API health status
   */
  async checkAPIHealth() {
    const endpoints = [
      {
        name: 'NEA Weather API',
        url: 'https://api.data.gov.sg/v1/environment/air-temperature',
        timeout: 10000
      },
      {
        name: 'LTA Traffic API',
        url: 'https://api.data.gov.sg/v1/transport/traffic-images',
        timeout: 15000
      }
    ];

    for (const endpoint of endpoints) {
      try {
        const startTime = Date.now();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), endpoint.timeout);

        const response = await fetch(endpoint.url, {
          method: 'HEAD', // Use HEAD to minimize data transfer
          signal: controller.signal
        });

        clearTimeout(timeoutId);
        const responseTime = Date.now() - startTime;

        this.recordAPIMetric(endpoint.name, {
          status: response.ok ? 'healthy' : 'degraded',
          responseTime,
          statusCode: response.status,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        this.recordAPIMetric(endpoint.name, {
          status: 'unhealthy',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    }

    this.updateSystemStatus();
  }

  /**
   * Record API health metric
   */
  recordAPIMetric(endpointName, metric) {
    if (!this.metrics.apiHealth.has(endpointName)) {
      this.metrics.apiHealth.set(endpointName, []);
    }

    const metrics = this.metrics.apiHealth.get(endpointName);
    metrics.push(metric);

    // Keep only last 50 metrics per endpoint
    if (metrics.length > 50) {
      metrics.splice(0, metrics.length - 50);
    }

    // Notify if status changed
    const previousMetric = metrics[metrics.length - 2];
    if (previousMetric && previousMetric.status !== metric.status) {
      this.notifySubscribers({
        type: 'apiStatusChange',
        endpoint: endpointName,
        oldStatus: previousMetric.status,
        newStatus: metric.status,
        metric
      });
    }
  }

  /**
   * Check performance metrics
   */
  checkPerformanceMetrics() {
    const metrics = {
      timestamp: new Date().toISOString(),
      memory: this.getMemoryUsage(),
      domNodes: document.querySelectorAll('*').length,
      eventListeners: this.estimateEventListeners(),
      cacheSize: this.getCacheSize()
    };

    this.metrics.performanceMetrics.set(Date.now(), metrics);
    
    // Check thresholds
    this.checkPerformanceThresholds(metrics);
  }

  /**
   * Get memory usage (if available)
   */
  getMemoryUsage() {
    if (typeof window !== 'undefined' && window.performance && window.performance.memory) {
      const memory = window.performance.memory;
      return {
        used: memory.usedJSHeapSize,
        total: memory.totalJSHeapSize,
        limit: memory.jsHeapSizeLimit,
        percentage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit * 100).toFixed(2)
      };
    }
    return null;
  }

  /**
   * Estimate number of event listeners (rough approximation)
   */
  estimateEventListeners() {
    if (typeof window === 'undefined') return 0;
    
    // This is a rough estimate based on elements that commonly have listeners
    const interactiveElements = document.querySelectorAll(
      'button, a, input, select, textarea, [onclick], [onmouseover], [onmouseout]'
    );
    
    return interactiveElements.length;
  }

  /**
   * Get cache size from API service (if available)
   */
  getCacheSize() {
    try {
      // This would need to be imported from apiService
      return {
        entries: 0, // apiService.cache.size,
        hitRate: 0 // apiService.cache.getStats().hitRate
      };
    } catch (error) {
      return { entries: 0, hitRate: 0 };
    }
  }

  /**
   * Check performance thresholds and alert if exceeded
   */
  checkPerformanceThresholds(metrics) {
    const alerts = [];

    if (metrics.memory && parseFloat(metrics.memory.percentage) > this.thresholds.memoryUsage * 100) {
      alerts.push({
        type: 'memory',
        severity: 'warning',
        message: `Memory usage high: ${metrics.memory.percentage}%`,
        threshold: this.thresholds.memoryUsage * 100
      });
    }

    if (metrics.domNodes > 5000) {
      alerts.push({
        type: 'dom',
        severity: 'info',
        message: `High DOM node count: ${metrics.domNodes}`,
        threshold: 5000
      });
    }

    if (alerts.length > 0) {
      this.notifySubscribers({
        type: 'performanceAlert',
        alerts,
        metrics
      });
    }
  }

  /**
   * Record error for monitoring
   */
  recordError(error, context = {}) {
    const errorRecord = {
      message: error.message,
      stack: error.stack,
      context,
      timestamp: new Date().toISOString(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
    };

    this.metrics.errorLog.push(errorRecord);

    // Keep only last 100 errors
    if (this.metrics.errorLog.length > 100) {
      this.metrics.errorLog.splice(0, this.metrics.errorLog.length - 100);
    }

    // Check error rate
    this.checkErrorRate();

    this.notifySubscribers({
      type: 'error',
      error: errorRecord
    });
  }

  /**
   * Check error rate and update system status if needed
   */
  checkErrorRate() {
    const recentErrors = this.metrics.errorLog.filter(
      error => Date.now() - new Date(error.timestamp).getTime() < 5 * 60 * 1000 // Last 5 minutes
    );

    const errorRate = recentErrors.length / 100; // Assuming 100 operations per 5 minutes as baseline

    if (errorRate > this.thresholds.errorRate) {
      this.updateSystemStatus('degraded');
    }
  }

  /**
   * Update overall system status
   */
  updateSystemStatus(overrideStatus = null) {
    const previousStatus = this.metrics.systemStatus;
    
    if (overrideStatus) {
      this.metrics.systemStatus = overrideStatus;
    } else {
      // Determine status based on API health
      const apiStatuses = Array.from(this.metrics.apiHealth.values())
        .map(metrics => metrics[metrics.length - 1]?.status)
        .filter(Boolean);

      if (apiStatuses.includes('unhealthy')) {
        this.metrics.systemStatus = 'unhealthy';
      } else if (apiStatuses.includes('degraded')) {
        this.metrics.systemStatus = 'degraded';
      } else if (apiStatuses.length > 0) {
        this.metrics.systemStatus = 'healthy';
      }
    }

    this.metrics.lastCheck = new Date().toISOString();

    // Notify if status changed
    if (previousStatus !== this.metrics.systemStatus) {
      this.notifySubscribers({
        type: 'systemStatusChange',
        oldStatus: previousStatus,
        newStatus: this.metrics.systemStatus,
        timestamp: this.metrics.lastCheck
      });
    }
  }

  /**
   * Clean up old metrics to prevent memory leaks
   */
  cleanupOldMetrics() {
    const cutoffTime = Date.now() - (24 * 60 * 60 * 1000); // 24 hours

    // Clean performance metrics
    for (const [timestamp] of this.metrics.performanceMetrics) {
      if (timestamp < cutoffTime) {
        this.metrics.performanceMetrics.delete(timestamp);
      }
    }

    // Clean error log
    this.metrics.errorLog = this.metrics.errorLog.filter(
      error => new Date(error.timestamp).getTime() > cutoffTime
    );
  }

  /**
   * Get comprehensive health report
   */
  getHealthReport() {
    const uptime = Date.now() - this.metrics.uptime;
    
    return {
      systemStatus: this.metrics.systemStatus,
      uptime: {
        milliseconds: uptime,
        formatted: this.formatUptime(uptime)
      },
      lastCheck: this.metrics.lastCheck,
      apis: this.getAPIHealthSummary(),
      performance: this.getPerformanceSummary(),
      errors: this.getErrorSummary(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Get API health summary
   */
  getAPIHealthSummary() {
    const summary = {};
    
    for (const [endpoint, metrics] of this.metrics.apiHealth) {
      const recentMetrics = metrics.slice(-10); // Last 10 checks
      const healthyCount = recentMetrics.filter(m => m.status === 'healthy').length;
      const avgResponseTime = recentMetrics
        .filter(m => m.responseTime)
        .reduce((sum, m) => sum + m.responseTime, 0) / recentMetrics.length || 0;

      summary[endpoint] = {
        status: metrics[metrics.length - 1]?.status || 'unknown',
        availability: ((healthyCount / recentMetrics.length) * 100).toFixed(2) + '%',
        averageResponseTime: Math.round(avgResponseTime),
        lastCheck: metrics[metrics.length - 1]?.timestamp
      };
    }
    
    return summary;
  }

  /**
   * Get performance summary
   */
  getPerformanceSummary() {
    const recent = Array.from(this.metrics.performanceMetrics.values()).slice(-1)[0];
    
    if (!recent) return null;

    return {
      memory: recent.memory,
      domNodes: recent.domNodes,
      eventListeners: recent.eventListeners,
      cacheSize: recent.cacheSize,
      timestamp: recent.timestamp
    };
  }

  /**
   * Get error summary
   */
  getErrorSummary() {
    const recentErrors = this.metrics.errorLog.filter(
      error => Date.now() - new Date(error.timestamp).getTime() < 60 * 60 * 1000 // Last hour
    );

    const errorTypes = {};
    recentErrors.forEach(error => {
      const type = error.context?.type || 'unknown';
      errorTypes[type] = (errorTypes[type] || 0) + 1;
    });

    return {
      total: this.metrics.errorLog.length,
      lastHour: recentErrors.length,
      types: errorTypes,
      latest: this.metrics.errorLog[this.metrics.errorLog.length - 1]
    };
  }

  /**
   * Format uptime duration
   */
  formatUptime(uptime) {
    const seconds = Math.floor(uptime / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  /**
   * Reset all metrics (useful for testing)
   */
  reset() {
    this.metrics = {
      apiHealth: new Map(),
      performanceMetrics: new Map(),
      errorLog: [],
      systemStatus: 'healthy',
      lastCheck: null,
      uptime: Date.now()
    };
  }
}

// Singleton instance
export const healthService = new HealthService();

// React hook for using health service
import { useState, useEffect } from 'react';
import { apiService } from './apiService.js';

export const useHealthService = () => {
  const [healthStatus, setHealthStatus] = useState(() => healthService.getHealthReport());

  useEffect(() => {
    const unsubscribe = healthService.subscribe((event) => {
      setHealthStatus(healthService.getHealthReport());
    });

    return unsubscribe;
  }, []);

  return {
    healthStatus,
    recordError: healthService.recordError.bind(healthService),
    getHealthReport: healthService.getHealthReport.bind(healthService)
  };
};

export default healthService;