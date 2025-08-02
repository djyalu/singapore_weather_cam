/**
 * Safe Logging Utility
 * Handles console output securely in production environments
 */

const isDevelopment = import.meta.env.MODE === 'development';
const isTest = import.meta.env.MODE === 'test';

/**
 * Safe logger that sanitizes messages and respects environment settings
 */
export const logger = {
  /**
   * Log information - only in development
   */
  info: (message, ...args) => {
    if (isDevelopment || isTest) {
      console.info(`[INFO] ${sanitizeMessage(message)}`, ...sanitizeArgs(args));
    }
  },

  /**
   * Log warnings - always shown but sanitized in production
   */
  warn: (message, ...args) => {
    const sanitizedMessage = sanitizeMessage(message);
    const sanitizedArgs = sanitizeArgs(args);

    if (isDevelopment || isTest) {
      console.warn(`[WARN] ${sanitizedMessage}`, ...sanitizedArgs);
    } else {
      // In production, log to a structured error tracking service
      // For now, use console.warn with sanitized content
      console.warn(`[WARN] ${sanitizedMessage}`);
    }
  },

  /**
   * Log errors - always shown but sanitized in production
   */
  error: (message, error, ...args) => {
    const sanitizedMessage = sanitizeMessage(message);
    const sanitizedArgs = sanitizeArgs(args);

    if (isDevelopment || isTest) {
      console.error(`[ERROR] ${sanitizedMessage}`, error, ...sanitizedArgs);
    } else {
      // In production, log minimal error info
      const errorInfo = error instanceof Error ? {
        name: error.name,
        message: sanitizeMessage(error.message),
      } : 'Unknown error';

      console.error(`[ERROR] ${sanitizedMessage}`, errorInfo);
    }
  },

  /**
   * Debug logging - only in development
   */
  debug: (message, ...args) => {
    if (isDevelopment) {
      console.debug(`[DEBUG] ${sanitizeMessage(message)}`, ...sanitizeArgs(args));
    }
  },
};

/**
 * Sanitize log messages to remove sensitive information
 */
function sanitizeMessage(message) {
  if (typeof message !== 'string') {
    return String(message);
  }

  // Remove potential sensitive patterns
  return message
    .replace(/api[_-]?key[=:\s]+[a-zA-Z0-9-_]+/gi, 'api_key=***')
    .replace(/token[=:\s]+[a-zA-Z0-9-_.]+/gi, 'token=***')
    .replace(/password[=:\s]+\S+/gi, 'password=***')
    .replace(/secret[=:\s]+\S+/gi, 'secret=***')
    .replace(/authorization[:\s]+\S+/gi, 'authorization=***');
}

/**
 * Sanitize arguments to remove sensitive data
 */
function sanitizeArgs(args) {
  if (!isDevelopment) {
    return []; // Don't log additional args in production
  }

  return args.map(arg => {
    if (typeof arg === 'object' && arg !== null) {
      // Deep clone and sanitize object
      try {
        const sanitized = JSON.parse(JSON.stringify(arg));
        return sanitizeObject(sanitized);
      } catch {
        return '[Object - could not serialize]';
      }
    }
    return arg;
  });
}

/**
 * Recursively sanitize object properties
 */
function sanitizeObject(obj) {
  if (typeof obj !== 'object' || obj === null) {
    return obj;
  }

  const sensitiveKeys = ['apikey', 'api_key', 'token', 'password', 'secret', 'authorization'];

  for (const key in obj) {
    if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
      obj[key] = '***';
    } else if (typeof obj[key] === 'object') {
      obj[key] = sanitizeObject(obj[key]);
    }
  }

  return obj;
}

/**
 * Safe Date validation and formatting
 */
export const safeDateUtils = {
  /**
   * Safely format a date for display
   */
  formatDate: (date, locale = 'ko-KR', options = {}) => {
    try {
      if (!date) {return 'No date';}

      if (typeof date === 'string') {
        date = new Date(date);
      }

      if (!(date instanceof Date) || isNaN(date.getTime())) {
        return 'Invalid date';
      }

      return date.toLocaleString(locale, {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        ...options,
      });
    } catch (error) {
      logger.warn('Date formatting error:', error);
      return 'Date format error';
    }
  },

  /**
   * Safely parse a date from various inputs
   */
  parseDate: (input) => {
    try {
      if (!input) {return null;}

      if (input instanceof Date) {
        return isNaN(input.getTime()) ? null : input;
      }

      if (typeof input === 'string' || typeof input === 'number') {
        const parsed = new Date(input);
        return isNaN(parsed.getTime()) ? null : parsed;
      }

      return null;
    } catch (error) {
      logger.warn('Date parsing error:', error);
      return null;
    }
  },

  /**
   * Check if a value is a valid date
   */
  isValidDate: (date) => {
    return date instanceof Date && !isNaN(date.getTime());
  },
};

export default logger;