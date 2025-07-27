/**
 * Quality Monitoring Service
 * Real-time quality metrics tracking and alerting
 * Integrates all persona improvements for comprehensive monitoring
 */

class QualityMonitoringService {
  constructor() {
    this.metrics = new Map();
    this.alerts = [];
    this.thresholds = {
      performance: {
        fcp: 2000,      // First Contentful Paint < 2s
        lcp: 3000,      // Largest Contentful Paint < 3s
        fid: 100,       // First Input Delay < 100ms
        cls: 0.1,       // Cumulative Layout Shift < 0.1
        bundle: 500000, // Bundle size < 500KB
      },
      accessibility: {
        wcagScore: 90,  // WCAG compliance > 90%
        colorContrast: 4.5, // Color contrast ratio > 4.5:1
        keyboardNav: 100,   // Keyboard navigation score > 100%
      },
      security: {
        csp: true,      // CSP properly configured
        https: true,    // HTTPS enforcement
        sanitization: 100, // Input sanitization coverage
      },
      quality: {
        testCoverage: 80,   // Test coverage > 80%
        eslintScore: 85,    // ESLint score > 85%
        complexity: 10,     // Cyclomatic complexity < 10
      },
    };
    this.observers = [];
    this.isInitialized = false;
  }

  /**
   * Initialize monitoring with all persona-specific metrics
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      // Performance monitoring (Performance Persona)
      this.initializePerformanceMonitoring();

      // Accessibility monitoring (Frontend Persona)
      this.initializeAccessibilityMonitoring();

      // Security monitoring (Security Persona)
      this.initializeSecurityMonitoring();

      // Quality monitoring (QA Persona)
      this.initializeQualityMonitoring();

      // Architecture monitoring (Architect Persona)
      this.initializeArchitectureMonitoring();

      this.isInitialized = true;
      this.reportMetric('system', 'monitoring_initialized', true);

    } catch (error) {
      console.error('Quality monitoring initialization failed:', error);
      this.reportAlert('critical', 'Monitoring system failed to initialize', error);
    }
  }

  /**
   * Performance Monitoring - Performance Persona focus
   */
  initializePerformanceMonitoring() {
    // Core Web Vitals monitoring
    if (typeof PerformanceObserver !== 'undefined') {
      // First Contentful Paint
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            const fcp = entry.startTime;
            this.reportMetric('performance', 'fcp', fcp);

            if (fcp > this.thresholds.performance.fcp) {
              this.reportAlert('warning', `FCP exceeds threshold: ${fcp.toFixed(0)}ms`);
            }
          }
        }
      }).observe({ entryTypes: ['paint'] });

      // Largest Contentful Paint
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const lcp = entry.startTime;
          this.reportMetric('performance', 'lcp', lcp);

          if (lcp > this.thresholds.performance.lcp) {
            this.reportAlert('warning', `LCP exceeds threshold: ${lcp.toFixed(0)}ms`);
          }
        }
      }).observe({ entryTypes: ['largest-contentful-paint'] });

      // First Input Delay
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const fid = entry.processingStart - entry.startTime;
          this.reportMetric('performance', 'fid', fid);

          if (fid > this.thresholds.performance.fid) {
            this.reportAlert('warning', `FID exceeds threshold: ${fid.toFixed(0)}ms`);
          }
        }
      }).observe({ entryTypes: ['first-input'] });

      // Cumulative Layout Shift
      new PerformanceObserver((list) => {
        let clsValue = 0;
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }

        this.reportMetric('performance', 'cls', clsValue);

        if (clsValue > this.thresholds.performance.cls) {
          this.reportAlert('warning', `CLS exceeds threshold: ${clsValue.toFixed(3)}`);
        }
      }).observe({ entryTypes: ['layout-shift'] });
    }

    // Memory monitoring
    if ('memory' in performance) {
      setInterval(() => {
        const memInfo = performance.memory;
        const usage = memInfo.usedJSHeapSize / memInfo.totalJSHeapSize;

        this.reportMetric('performance', 'memory_usage', usage);

        if (usage > 0.85) {
          this.reportAlert('critical', `High memory usage: ${(usage * 100).toFixed(1)}%`);
        }
      }, 30000); // Check every 30 seconds
    }
  }

  /**
   * Accessibility Monitoring - Frontend Persona focus
   */
  initializeAccessibilityMonitoring() {
    // Keyboard navigation monitoring
    let keyboardEvents = 0;
    let totalInteractions = 0;

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Tab' || e.key === 'Enter' || e.key === 'Space') {
        keyboardEvents++;
        totalInteractions++;

        const keyboardScore = totalInteractions > 0 ? (keyboardEvents / totalInteractions) * 100 : 100;
        this.reportMetric('accessibility', 'keyboard_nav_score', keyboardScore);
      }
    });

    document.addEventListener('click', () => {
      totalInteractions++;
    });

    // Focus management monitoring
    document.addEventListener('focusin', (e) => {
      if (e.target.getAttribute('tabindex') === '-1') {
        this.reportAlert('warning', 'Focus on non-focusable element detected');
      }
    });

    // Color contrast monitoring (simplified)
    const checkColorContrast = () => {
      try {
        const elements = document.querySelectorAll('*');
        const contrastIssues = 0;

        elements.forEach(el => {
          const styles = window.getComputedStyle(el);
          const color = styles.color;
          const backgroundColor = styles.backgroundColor;

          // Simplified contrast check - in production, use a proper contrast ratio calculator
          if (color && backgroundColor &&
              color !== 'rgba(0, 0, 0, 0)' &&
              backgroundColor !== 'rgba(0, 0, 0, 0)') {
            // Placeholder for actual contrast calculation
            // Real implementation would calculate luminance ratios
          }
        });

        const contrastScore = Math.max(0, 100 - contrastIssues);
        this.reportMetric('accessibility', 'color_contrast_score', contrastScore);

      } catch (error) {
        console.warn('Color contrast check failed:', error);
      }
    };

    // Check contrast on load and periodically
    setTimeout(checkColorContrast, 2000);
    setInterval(checkColorContrast, 60000); // Every minute
  }

  /**
   * Security Monitoring - Security Persona focus
   */
  initializeSecurityMonitoring() {
    // CSP violation monitoring
    document.addEventListener('securitypolicyviolation', (e) => {
      this.reportAlert('critical', `CSP Violation: ${e.violatedDirective}`, {
        blockedURI: e.blockedURI,
        lineNumber: e.lineNumber,
        sourceFile: e.sourceFile,
      });
    });

    // HTTPS enforcement check
    const isSecure = window.location.protocol === 'https:' ||
                    window.location.hostname === 'localhost';

    this.reportMetric('security', 'https_enforced', isSecure);

    if (!isSecure) {
      this.reportAlert('critical', 'Non-secure context detected');
    }

    // XSS protection monitoring
    const checkForXSS = () => {
      const potentialXSS = document.querySelectorAll('script[src*="javascript:"]');
      if (potentialXSS.length > 0) {
        this.reportAlert('critical', `Potential XSS detected: ${potentialXSS.length} suspicious scripts`);
      }
    };

    setInterval(checkForXSS, 30000);
  }

  /**
   * Quality Monitoring - QA Persona focus
   */
  initializeQualityMonitoring() {
    // Error tracking
    let errorCount = 0;
    let warningCount = 0;

    const originalConsoleError = console.error;
    const originalConsoleWarn = console.warn;

    console.error = (...args) => {
      errorCount++;
      this.reportMetric('quality', 'error_count', errorCount);
      this.reportAlert('error', `Console error: ${args[0]}`);
      originalConsoleError.apply(console, args);
    };

    console.warn = (...args) => {
      warningCount++;
      this.reportMetric('quality', 'warning_count', warningCount);
      originalConsoleWarn.apply(console, args);
    };

    // Component render monitoring
    let componentRenders = 0;
    const startTime = Date.now();

    // Mock component render tracking
    setInterval(() => {
      componentRenders++;
      const avgRenderTime = (Date.now() - startTime) / componentRenders;
      this.reportMetric('quality', 'avg_render_time', avgRenderTime);
    }, 5000);

    // Quality score calculation
    setInterval(() => {
      const qualityScore = this.calculateOverallQualityScore();
      this.reportMetric('quality', 'overall_score', qualityScore);

      if (qualityScore < 70) {
        this.reportAlert('warning', `Overall quality score low: ${qualityScore.toFixed(1)}`);
      }
    }, 60000); // Every minute
  }

  /**
   * Architecture Monitoring - Architect Persona focus
   */
  initializeArchitectureMonitoring() {
    // Bundle size monitoring
    const checkBundleSize = async () => {
      try {
        const response = await fetch('/dist/assets/js/index.js');
        if (response.ok) {
          const size = parseInt(response.headers.get('content-length')) || 0;
          this.reportMetric('architecture', 'bundle_size', size);

          if (size > this.thresholds.performance.bundle) {
            this.reportAlert('warning', `Bundle size exceeds threshold: ${(size / 1024).toFixed(1)}KB`);
          }
        }
      } catch (error) {
        // Bundle check failed - not critical
      }
    };

    checkBundleSize();

    // Dependency monitoring
    const checkDependencies = () => {
      const scripts = document.querySelectorAll('script[src]');
      const externalDeps = Array.from(scripts).filter(script =>
        script.src.includes('cdn') || script.src.includes('unpkg'),
      );

      this.reportMetric('architecture', 'external_dependencies', externalDeps.length);

      if (externalDeps.length > 5) {
        this.reportAlert('info', `High number of external dependencies: ${externalDeps.length}`);
      }
    };

    checkDependencies();
  }

  /**
   * Report a metric value
   */
  reportMetric(category, name, value) {
    const timestamp = Date.now();
    const key = `${category}.${name}`;

    if (!this.metrics.has(key)) {
      this.metrics.set(key, []);
    }

    const metricData = this.metrics.get(key);
    metricData.push({ value, timestamp });

    // Keep only last 100 entries per metric
    if (metricData.length > 100) {
      metricData.shift();
    }

    // Notify observers
    this.notifyObservers('metric', { category, name, value, timestamp });
  }

  /**
   * Report an alert
   */
  reportAlert(severity, message, details = null) {
    const alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      severity,
      message,
      details,
      timestamp: Date.now(),
    };

    this.alerts.push(alert);

    // Keep only last 50 alerts
    if (this.alerts.length > 50) {
      this.alerts.shift();
    }

    // Notify observers
    this.notifyObservers('alert', alert);

    // Log based on severity
    switch (severity) {
      case 'critical':
        console.error('🚨 Critical Quality Alert:', message, details);
        break;
      case 'error':
        console.error('❌ Quality Error:', message, details);
        break;
      case 'warning':
        console.warn('⚠️ Quality Warning:', message, details);
        break;
      case 'info':
        console.info('ℹ️ Quality Info:', message, details);
        break;
    }
  }

  /**
   * Calculate overall quality score
   */
  calculateOverallQualityScore() {
    const weights = {
      performance: 0.3,
      accessibility: 0.25,
      security: 0.25,
      quality: 0.2,
    };

    let totalScore = 0;
    let totalWeight = 0;

    // Performance score (0-100)
    const fcpScore = this.getLatestMetric('performance', 'fcp');
    const lcpScore = this.getLatestMetric('performance', 'lcp');
    const clsScore = this.getLatestMetric('performance', 'cls');

    if (fcpScore !== null && lcpScore !== null && clsScore !== null) {
      const perfScore = Math.max(0, 100 -
        (fcpScore > this.thresholds.performance.fcp ? 20 : 0) -
        (lcpScore > this.thresholds.performance.lcp ? 20 : 0) -
        (clsScore > this.thresholds.performance.cls ? 20 : 0),
      );
      totalScore += perfScore * weights.performance;
      totalWeight += weights.performance;
    }

    // Accessibility score
    const keyboardScore = this.getLatestMetric('accessibility', 'keyboard_nav_score');
    const contrastScore = this.getLatestMetric('accessibility', 'color_contrast_score');

    if (keyboardScore !== null || contrastScore !== null) {
      const a11yScore = (keyboardScore || 100 + contrastScore || 100) / 2;
      totalScore += a11yScore * weights.accessibility;
      totalWeight += weights.accessibility;
    }

    // Security score
    const httpsScore = this.getLatestMetric('security', 'https_enforced');
    if (httpsScore !== null) {
      const secScore = httpsScore ? 100 : 0;
      totalScore += secScore * weights.security;
      totalWeight += weights.security;
    }

    // Quality score
    const errorCount = this.getLatestMetric('quality', 'error_count') || 0;
    const qualScore = Math.max(0, 100 - (errorCount * 5));
    totalScore += qualScore * weights.quality;
    totalWeight += weights.quality;

    return totalWeight > 0 ? totalScore / totalWeight : 0;
  }

  /**
   * Get latest metric value
   */
  getLatestMetric(category, name) {
    const key = `${category}.${name}`;
    const metricData = this.metrics.get(key);

    if (!metricData || metricData.length === 0) {
      return null;
    }

    return metricData[metricData.length - 1].value;
  }

  /**
   * Get metric history
   */
  getMetricHistory(category, name, limit = 50) {
    const key = `${category}.${name}`;
    const metricData = this.metrics.get(key) || [];

    return metricData.slice(-limit);
  }

  /**
   * Get all alerts
   */
  getAlerts(severity = null, limit = 50) {
    let filteredAlerts = this.alerts;

    if (severity) {
      filteredAlerts = this.alerts.filter(alert => alert.severity === severity);
    }

    return filteredAlerts.slice(-limit).reverse(); // Most recent first
  }

  /**
   * Subscribe to monitoring events
   */
  subscribe(callback) {
    this.observers.push(callback);

    return () => {
      const index = this.observers.indexOf(callback);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }

  /**
   * Notify observers of events
   */
  notifyObservers(type, data) {
    this.observers.forEach(callback => {
      try {
        callback(type, data);
      } catch (error) {
        console.error('Observer notification failed:', error);
      }
    });
  }

  /**
   * Generate quality report
   */
  generateQualityReport() {
    const now = Date.now();
    const report = {
      timestamp: now,
      overallScore: this.calculateOverallQualityScore(),
      metrics: {},
      alerts: {
        critical: this.getAlerts('critical', 10),
        error: this.getAlerts('error', 10),
        warning: this.getAlerts('warning', 10),
      },
      summary: {
        totalMetrics: this.metrics.size,
        totalAlerts: this.alerts.length,
        systemHealth: this.isInitialized ? 'healthy' : 'degraded',
      },
    };

    // Include latest values for key metrics
    const keyMetrics = [
      'performance.fcp',
      'performance.lcp',
      'performance.cls',
      'accessibility.keyboard_nav_score',
      'security.https_enforced',
      'quality.error_count',
    ];

    keyMetrics.forEach(metric => {
      const [category, name] = metric.split('.');
      const value = this.getLatestMetric(category, name);
      if (value !== null) {
        if (!report.metrics[category]) {
          report.metrics[category] = {};
        }
        report.metrics[category][name] = value;
      }
    });

    return report;
  }

  /**
   * Reset monitoring data
   */
  reset() {
    this.metrics.clear();
    this.alerts.length = 0;
  }

  /**
   * Cleanup monitoring
   */
  destroy() {
    this.reset();
    this.observers.length = 0;
    this.isInitialized = false;
  }
}

// Singleton instance
const qualityMonitoringService = new QualityMonitoringService();

export default qualityMonitoringService;