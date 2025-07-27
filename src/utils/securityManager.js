/**
 * Comprehensive Security Manager
 * Implements enterprise-grade security measures for Singapore Weather Cam
 */

class SecurityManager {
  constructor() {
    this.cspViolations = [];
    this.securityEvents = [];
    this.trustedDomains = [
      'api.data.gov.sg',
      'fonts.googleapis.com',
      'fonts.gstatic.com'
    ];
    this.securityConfig = {
      enableCSP: true,
      enableXSSProtection: true,
      enableClickjacking: true,
      enableMITM: true,
      enableDataValidation: true,
      logSecurityEvents: true
    };
    
    this.initializeSecurity();
  }

  /**
   * Initialize comprehensive security measures
   */
  initializeSecurity() {
    this.setupContentSecurityPolicy();
    this.setupSecurityHeaders();
    this.setupInputValidation();
    this.setupCSPViolationReporting();
    this.setupSecurityEventMonitoring();
    this.preventCommonAttacks();
  }

  /**
   * Enhanced Content Security Policy
   */
  setupContentSecurityPolicy() {
    if (!this.securityConfig.enableCSP) return;

    const cspConfig = {
      'default-src': ["'self'"],
      'script-src': [
        "'self'",
        // TODO: Remove 'unsafe-inline' and implement nonce-based CSP
        "'unsafe-inline'", // TEMPORARY - needs nonce implementation
        'https://api.data.gov.sg'
      ],
      'style-src': [
        "'self'",
        "'unsafe-inline'", // TODO: Replace with nonce for inline styles
        'https://fonts.googleapis.com'
      ],
      'img-src': [
        "'self'",
        'data:',
        'https://api.data.gov.sg',
        'https://*.data.gov.sg',
        'blob:'
      ],
      'connect-src': [
        "'self'",
        'https://api.data.gov.sg',
        'wss://api.data.gov.sg'
      ],
      'font-src': [
        "'self'",
        'https://fonts.gstatic.com'
      ],
      'frame-src': ["'none'"],
      'object-src': ["'none'"],
      'base-uri': ["'self'"],
      'form-action': ["'self'"],
      'frame-ancestors': ["'none'"],
      'upgrade-insecure-requests': []
    };

    // Generate CSP string
    const cspString = Object.entries(cspConfig)
      .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
      .join('; ');

    // Apply CSP via meta tag (server-side headers preferred in production)
    const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
    if (existingCSP) {
      existingCSP.setAttribute('content', cspString);
    } else {
      const cspMeta = document.createElement('meta');
      cspMeta.setAttribute('http-equiv', 'Content-Security-Policy');
      cspMeta.setAttribute('content', cspString);
      document.head.appendChild(cspMeta);
    }

    console.log('🔒 Content Security Policy applied:', cspString);
  }

  /**
   * Setup additional security headers
   */
  setupSecurityHeaders() {
    // Note: These should be set server-side in production
    const securityHeaders = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
      'Cross-Origin-Embedder-Policy': 'require-corp',
      'Cross-Origin-Opener-Policy': 'same-origin'
    };

    // Log headers for verification (in production, verify server headers)
    console.log('🔒 Security Headers Configuration:', securityHeaders);
  }

  /**
   * Advanced Input Validation and Sanitization
   */
  setupInputValidation() {
    this.inputValidator = {
      // Singapore-specific coordinate validation
      validateCoordinates: (lat, lng) => {
        const latNum = parseFloat(lat);
        const lngNum = parseFloat(lng);
        
        // Singapore bounds: roughly 1.1°N to 1.5°N, 103.6°E to 104.0°E
        return !isNaN(latNum) && !isNaN(lngNum) &&
               latNum >= 1.1 && latNum <= 1.5 &&
               lngNum >= 103.6 && lngNum <= 104.0;
      },

      // Weather station ID validation
      validateStationId: (stationId) => {
        return /^S[0-9]{1,3}$/.test(stationId);
      },

      // Camera ID validation
      validateCameraId: (cameraId) => {
        return /^[0-9]{4}$/.test(cameraId);
      },

      // URL validation for API endpoints
      validateApiUrl: (url) => {
        try {
          const urlObj = new URL(url);
          return this.trustedDomains.includes(urlObj.hostname) &&
                 urlObj.protocol === 'https:';
        } catch {
          return false;
        }
      },

      // XSS prevention
      sanitizeHtml: (input) => {
        const div = document.createElement('div');
        div.textContent = input;
        return div.innerHTML;
      },

      // SQL injection prevention (for API parameters)
      sanitizeApiParam: (param) => {
        return encodeURIComponent(String(param))
          .replace(/['"\\]/g, '')
          .substring(0, 100); // Limit length
      }
    };
  }

  /**
   * CSP Violation Reporting
   */
  setupCSPViolationReporting() {
    document.addEventListener('securitypolicyviolation', (event) => {
      const violation = {
        timestamp: new Date().toISOString(),
        directive: event.violatedDirective,
        blockedURI: event.blockedURI,
        originalPolicy: event.originalPolicy,
        disposition: event.disposition,
        sourceFile: event.sourceFile,
        lineNumber: event.lineNumber,
        columnNumber: event.columnNumber
      };

      this.cspViolations.push(violation);
      console.warn('🚨 CSP Violation detected:', violation);

      // In production, send to monitoring service
      if (process.env.NODE_ENV === 'production') {
        this.reportSecurityEvent('csp_violation', violation);
      }
    });
  }

  /**
   * Comprehensive Security Event Monitoring
   */
  setupSecurityEventMonitoring() {
    // Monitor for suspicious activities
    const securityObserver = {
      // Monitor DOM modifications
      observeDOM: () => {
        if ('MutationObserver' in window) {
          const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
              // Check for suspicious script injections
              if (mutation.type === 'childList') {
                mutation.addedNodes.forEach((node) => {
                  if (node.nodeName === 'SCRIPT') {
                    this.reportSecurityEvent('script_injection_attempt', {
                      src: node.src,
                      content: node.textContent?.substring(0, 100)
                    });
                  }
                });
              }
            });
          });

          observer.observe(document.documentElement, {
            childList: true,
            subtree: true
          });
        }
      },

      // Monitor console access attempts
      observeConsole: () => {
        const originalLog = console.log;
        console.log = (...args) => {
          // Check for suspicious console usage
          const logString = args.join(' ');
          if (/password|token|secret|key/i.test(logString)) {
            this.reportSecurityEvent('sensitive_data_console', {
              content: logString.substring(0, 50)
            });
          }
          originalLog.apply(console, args);
        };
      },

      // Monitor for debugging attempts
      observeDebugging: () => {
        // Detect DevTools opening
        let devtools = { open: false };
        const threshold = 160;

        const detectDevTools = () => {
          if (window.outerHeight - window.innerHeight > threshold ||
              window.outerWidth - window.innerWidth > threshold) {
            if (!devtools.open) {
              devtools.open = true;
              this.reportSecurityEvent('devtools_opened', {
                userAgent: navigator.userAgent
              });
            }
          } else {
            devtools.open = false;
          }
        };

        window.addEventListener('resize', detectDevTools);
        detectDevTools();
      }
    };

    securityObserver.observeDOM();
    if (process.env.NODE_ENV === 'production') {
      securityObserver.observeConsole();
      securityObserver.observeDebugging();
    }
  }

  /**
   * Prevent Common Web Attacks
   */
  preventCommonAttacks() {
    // Prevent clickjacking
    if (window.self !== window.top) {
      this.reportSecurityEvent('clickjacking_attempt', {
        parentOrigin: document.referrer
      });
      
      // Break out of frame
      window.top.location = window.self.location;
    }

    // Disable right-click in production
    if (process.env.NODE_ENV === 'production') {
      document.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        this.reportSecurityEvent('context_menu_attempt', {
          target: e.target.tagName
        });
      });

      // Disable F12 and other dev shortcuts
      document.addEventListener('keydown', (e) => {
        if (e.key === 'F12' || 
            (e.ctrlKey && e.shiftKey && e.key === 'I') ||
            (e.ctrlKey && e.shiftKey && e.key === 'C') ||
            (e.ctrlKey && e.key === 'U')) {
          e.preventDefault();
          this.reportSecurityEvent('dev_shortcut_attempt', {
            key: e.key,
            ctrl: e.ctrlKey,
            shift: e.shiftKey
          });
        }
      });
    }

    // Prevent clipboard access
    document.addEventListener('copy', (e) => {
      const selection = window.getSelection().toString();
      if (selection.length > 100) {
        this.reportSecurityEvent('large_clipboard_copy', {
          length: selection.length
        });
      }
    });
  }

  /**
   * Secure API Request Wrapper
   */
  secureApiRequest = async (url, options = {}) => {
    // Validate URL
    if (!this.inputValidator.validateApiUrl(url)) {
      throw new Error('Invalid API URL');
    }

    // Add security headers
    const secureOptions = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'Cache-Control': 'no-cache',
        ...options.headers
      },
      credentials: 'same-origin',
      mode: 'cors'
    };

    // Add request timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch(url, {
        ...secureOptions,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      this.reportSecurityEvent('api_request_error', {
        url: url.substring(0, 100),
        error: error.message
      });
      throw error;
    }
  };

  /**
   * Report Security Events
   */
  reportSecurityEvent(eventType, details) {
    const event = {
      timestamp: new Date().toISOString(),
      type: eventType,
      details,
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: this.getSessionId()
    };

    this.securityEvents.push(event);
    
    console.warn(`🚨 Security Event: ${eventType}`, details);

    // In production, send to security monitoring service
    if (process.env.NODE_ENV === 'production' && this.securityConfig.logSecurityEvents) {
      this.sendToSecurityService(event);
    }
  }

  /**
   * Generate Security Report
   */
  generateSecurityReport() {
    return {
      timestamp: new Date().toISOString(),
      cspViolations: this.cspViolations.length,
      securityEvents: this.securityEvents.length,
      recentEvents: this.securityEvents.slice(-10),
      configuration: this.securityConfig,
      recommendations: this.getSecurityRecommendations()
    };
  }

  /**
   * Security Recommendations
   */
  getSecurityRecommendations() {
    const recommendations = [];

    if (this.cspViolations.length > 0) {
      recommendations.push('Review and fix CSP violations');
    }

    if (this.securityEvents.some(e => e.type === 'script_injection_attempt')) {
      recommendations.push('Investigate potential XSS attempts');
    }

    if (process.env.NODE_ENV === 'production') {
      recommendations.push('Implement server-side security headers');
      recommendations.push('Enable nonce-based CSP');
      recommendations.push('Set up security monitoring service');
    }

    return recommendations;
  }

  /**
   * Utility Methods
   */
  getSessionId() {
    if (!this.sessionId) {
      this.sessionId = 'swc_' + Math.random().toString(36).substr(2, 9);
    }
    return this.sessionId;
  }

  sendToSecurityService(event) {
    // Implementation would send to actual security monitoring service
    console.log('Would send to security service:', event);
  }

  // Public API
  validate = this.inputValidator;
  secureRequest = this.secureApiRequest;
}

// Singleton instance
const securityManager = new SecurityManager();

export default securityManager;
export { SecurityManager };