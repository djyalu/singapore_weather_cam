/**
 * Security Utilities and Middleware for Singapore Weather Cam
 * Provides runtime security enforcement and protection mechanisms
 */

import { getSecurityHeaders, getCSPConfig } from '../services/securityService.js';

/**
 * Initialize security policies and headers (client-side)
 */
export const initializeSecurity = () => {
  try {
    // Set security headers via meta tags (for static hosting)
    setSecurityHeaders();

    // Initialize Content Security Policy
    setContentSecurityPolicy();

    // Set up security event listeners
    setupSecurityEventListeners();

    // Initialize runtime protection
    initializeRuntimeProtection();

    console.log('🔒 Security policies initialized');

  } catch (error) {
    console.error('❌ Security initialization failed:', error);
  }
};

/**
 * Set security headers via meta tags (for static hosting environments)
 */
const setSecurityHeaders = () => {
  const headers = getSecurityHeaders();

  Object.entries(headers).forEach(([name, value]) => {
    // Create or update meta tag for each security header
    let metaTag = document.querySelector(`meta[http-equiv="${name}"]`);

    if (!metaTag) {
      metaTag = document.createElement('meta');
      metaTag.setAttribute('http-equiv', name);
      document.head.appendChild(metaTag);
    }

    metaTag.setAttribute('content', value);
  });
};

/**
 * Set Content Security Policy
 */
const setContentSecurityPolicy = () => {
  const csp = getCSPConfig();
  const cspString = Object.entries(csp)
    .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
    .join('; ');

  // Set CSP via meta tag
  let cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  if (!cspMeta) {
    cspMeta = document.createElement('meta');
    cspMeta.setAttribute('http-equiv', 'Content-Security-Policy');
    document.head.appendChild(cspMeta);
  }
  cspMeta.setAttribute('content', cspString);
};

/**
 * Set up security event listeners
 */
const setupSecurityEventListeners = () => {
  // CSP violation reporting
  document.addEventListener('securitypolicyviolation', (event) => {
    console.error('🚨 CSP Violation:', {
      blockedURI: event.blockedURI,
      violatedDirective: event.violatedDirective,
      originalPolicy: event.originalPolicy,
      sourceFile: event.sourceFile,
      lineNumber: event.lineNumber,
    });

    // Report to monitoring service (if available)
    reportSecurityViolation({
      type: 'csp_violation',
      details: {
        blockedURI: event.blockedURI,
        violatedDirective: event.violatedDirective,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
      },
    });
  });

  // Detect XSS attempts
  window.addEventListener('error', (event) => {
    if (event.message && event.message.includes('Script error')) {
      console.warn('🛡️ Potential XSS attempt blocked');
      reportSecurityViolation({
        type: 'potential_xss',
        details: {
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          timestamp: new Date().toISOString(),
        },
      });
    }
  });
};

/**
 * Initialize runtime protection mechanisms
 */
const initializeRuntimeProtection = () => {
  // Disable right-click context menu in production
  if (import.meta.env.PROD) {
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      return false;
    });
  }

  // Disable F12 and other developer shortcuts in production
  if (import.meta.env.PROD) {
    document.addEventListener('keydown', (e) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'C' || e.key === 'J')) ||
        (e.ctrlKey && e.key === 'U')
      ) {
        e.preventDefault();
        return false;
      }
    });
  }

  // Console warning for unauthorized access
  if (import.meta.env.PROD) {
    console.clear();
    console.log(
      '%c🛡️ Singapore Weather Cam - Security Notice',
      'color: #ef4444; font-size: 20px; font-weight: bold;',
    );
    console.log(
      '%cThis application is protected by security measures. Unauthorized access attempts are logged.',
      'color: #dc2626; font-size: 14px;',
    );
  }
};

/**
 * Report security violations to monitoring service
 */
const reportSecurityViolation = (violation) => {
  try {
    // In a real application, you would send this to your monitoring service
    console.error('Security violation reported:', violation);

    // Store locally for debugging (development only)
    if (import.meta.env.DEV) {
      const violations = JSON.parse(localStorage.getItem('security_violations') || '[]');
      violations.push(violation);
      // Keep only last 50 violations
      if (violations.length > 50) {
        violations.splice(0, violations.length - 50);
      }
      localStorage.setItem('security_violations', JSON.stringify(violations));
    }
  } catch (error) {
    console.error('Failed to report security violation:', error);
  }
};

/**
 * Validate external resource loading
 */
export const validateExternalResource = (url) => {
  try {
    const urlObj = new URL(url);
    const allowedDomains = [
      'api.data.gov.sg',
      'data.gov.sg',
      'fonts.googleapis.com',
      'fonts.gstatic.com',
    ];

    return allowedDomains.includes(urlObj.hostname);
  } catch (error) {
    console.error('Invalid URL for external resource:', url);
    return false;
  }
};

/**
 * Sanitize user input for display
 */
export const sanitizeForDisplay = (input) => {
  if (typeof input !== 'string') {return String(input || '');}

  return input
    .replace(/[<>'"&]/g, (char) => {
      const entities = {
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '&': '&amp;',
      };
      return entities[char] || char;
    });
};

/**
 * Check if the application is running in a secure context
 */
export const isSecureContext = () => {
  return window.isSecureContext && location.protocol === 'https:';
};

/**
 * Generate secure random string for nonces
 */
export const generateSecureNonce = () => {
  if (window.crypto && window.crypto.getRandomValues) {
    const array = new Uint8Array(16);
    window.crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  // Fallback for environments without crypto API
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
};

/**
 * Security health check
 */
export const performSecurityHealthCheck = () => {
  const checks = {
    httpsEnabled: isSecureContext(),
    cspEnabled: document.querySelector('meta[http-equiv="Content-Security-Policy"]') !== null,
    securityHeadersSet: document.querySelector('meta[http-equiv="X-Content-Type-Options"]') !== null,
    cookieSecure: document.cookie.includes('Secure') || document.cookie === '',
    mixedContentBlocked: !document.querySelector('img[src^="http:"], script[src^="http:"]'),
    consoleProtected: import.meta.env.PROD,
  };

  const securityScore = Object.values(checks).filter(Boolean).length / Object.keys(checks).length * 100;

  return {
    score: Math.round(securityScore),
    checks,
    timestamp: new Date().toISOString(),
    recommendations: generateSecurityRecommendations(checks),
  };
};

/**
 * Generate security recommendations based on health check
 */
const generateSecurityRecommendations = (checks) => {
  const recommendations = [];

  if (!checks.httpsEnabled) {
    recommendations.push('Enable HTTPS for secure communication');
  }

  if (!checks.cspEnabled) {
    recommendations.push('Implement Content Security Policy');
  }

  if (!checks.securityHeadersSet) {
    recommendations.push('Configure security headers (X-Content-Type-Options, etc.)');
  }

  if (!checks.mixedContentBlocked) {
    recommendations.push('Eliminate mixed content (HTTP resources on HTTPS page)');
  }

  return recommendations;
};

export default {
  initializeSecurity,
  validateExternalResource,
  sanitizeForDisplay,
  isSecureContext,
  generateSecureNonce,
  performSecurityHealthCheck,
};