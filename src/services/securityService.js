/**
 * Security Service for Singapore Weather Cam
 * Provides comprehensive security validation, sanitization, and protection mechanisms
 */

/**
 * Input Validation and Sanitization Service
 */
export class SecurityValidator {
  constructor() {
    this.patterns = {
      // API endpoint validation
      apiUrl: /^https:\/\/api\.data\.gov\.sg\/v1\/(environment|transport)\/.+$/,

      // Coordinate validation for Singapore bounds
      latitude: /^1\.[0-9]+$/,
      longitude: /^103\.[0-9]+$/,

      // ID patterns
      cameraId: /^[0-9]{4}$/,
      stationId: /^S[0-9]{1,3}$/,

      // Safe filename patterns
      filename: /^[a-zA-Z0-9._-]+\.(json|jpg|jpeg|png)$/i,

      // ISO timestamp
      timestamp: /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?$/,
    };

    this.securityConfig = {
      maxFileSize: 10 * 1024 * 1024, // 10MB
      allowedDomains: [
        'api.data.gov.sg',
        'data.gov.sg',
        'djyalu.github.io',
        'localhost',
      ],
      allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp'],
      maxStringLength: 1000,
      maxArrayLength: 1000,
    };
  }

  /**
   * Validate API endpoint URL
   */
  validateApiUrl(url) {
    try {
      const urlObj = new URL(url);

      // Check if domain is allowed
      if (!this.securityConfig.allowedDomains.includes(urlObj.hostname)) {
        throw new Error(`Unauthorized domain: ${urlObj.hostname}`);
      }

      // Validate URL pattern for government APIs
      if (urlObj.hostname === 'api.data.gov.sg' && !this.patterns.apiUrl.test(url)) {
        throw new Error('Invalid API endpoint pattern');
      }

      // Ensure HTTPS
      if (urlObj.protocol !== 'https:') {
        throw new Error('Only HTTPS URLs are allowed');
      }

      return { isValid: true, sanitizedUrl: url };
    } catch (error) {
      return {
        isValid: false,
        error: `URL validation failed: ${error.message}`,
        sanitizedUrl: null,
      };
    }
  }

  /**
   * Validate and sanitize coordinates
   */
  validateCoordinates(lat, lng) {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    // Singapore bounds validation
    const isValidLatitude = latitude >= 1.1 && latitude <= 1.5;
    const isValidLongitude = longitude >= 103.6 && longitude <= 104.0;

    if (!isValidLatitude || !isValidLongitude) {
      return {
        isValid: false,
        error: 'Coordinates outside Singapore bounds',
        sanitized: null,
      };
    }

    return {
      isValid: true,
      sanitized: {
        latitude: Math.round(latitude * 10000) / 10000, // 4 decimal places
        longitude: Math.round(longitude * 10000) / 10000,
      },
    };
  }

  /**
   * Validate weather data structure
   */
  validateWeatherData(data) {
    const errors = [];

    try {
      // Structure validation
      if (!data || typeof data !== 'object') {
        errors.push('Invalid data structure');
      }

      // Required fields
      if (!data.timestamp || !this.patterns.timestamp.test(data.timestamp)) {
        errors.push('Invalid or missing timestamp');
      }

      if (!data.data || typeof data.data !== 'object') {
        errors.push('Missing weather data object');
      }

      // Validate nested data if present
      if (data.data) {
        if (data.data.temperature) {
          if (!this.validateTemperatureData(data.data.temperature)) {
            errors.push('Invalid temperature data structure');
          }
        }

        if (data.data.humidity) {
          if (!this.validateHumidityData(data.data.humidity)) {
            errors.push('Invalid humidity data structure');
          }
        }
      }

      // Check for XSS attempts in string fields
      if (data.source && this.containsSuspiciousContent(data.source)) {
        errors.push('Suspicious content detected in source field');
      }

    } catch (error) {
      errors.push(`Validation error: ${error.message}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized: this.sanitizeWeatherData(data),
    };
  }

  /**
   * Validate temperature data
   */
  validateTemperatureData(tempData) {
    if (!tempData || typeof tempData !== 'object') {return false;}

    // Check for reasonable temperature ranges (Singapore: 20-40°C)
    const validateTemp = (temp) => {
      const value = parseFloat(temp);
      return !isNaN(value) && value >= 15 && value <= 45;
    };

    if (tempData.average && !validateTemp(tempData.average)) {return false;}
    if (tempData.minimum && !validateTemp(tempData.minimum)) {return false;}
    if (tempData.maximum && !validateTemp(tempData.maximum)) {return false;}

    return true;
  }

  /**
   * Validate humidity data
   */
  validateHumidityData(humidityData) {
    if (!humidityData || typeof humidityData !== 'object') {return false;}

    // Check for reasonable humidity ranges (0-100%)
    const validateHumidity = (humidity) => {
      const value = parseFloat(humidity);
      return !isNaN(value) && value >= 0 && value <= 100;
    };

    if (humidityData.average && !validateHumidity(humidityData.average)) {return false;}
    if (humidityData.minimum && !validateHumidity(humidityData.minimum)) {return false;}
    if (humidityData.maximum && !validateHumidity(humidityData.maximum)) {return false;}

    return true;
  }

  /**
   * Validate webcam/camera data
   */
  validateCameraData(data) {
    const errors = [];

    try {
      if (!data || typeof data !== 'object') {
        errors.push('Invalid camera data structure');
      }

      // Camera ID validation
      if (!data.id || !this.patterns.cameraId.test(data.id)) {
        errors.push('Invalid camera ID format');
      }

      // Location validation
      if (data.location) {
        const coordValidation = this.validateCoordinates(
          data.location.latitude,
          data.location.longitude,
        );
        if (!coordValidation.isValid) {
          errors.push(coordValidation.error);
        }
      }

      // Image URL validation
      if (data.image && data.image.url) {
        const urlValidation = this.validateImageUrl(data.image.url);
        if (!urlValidation.isValid) {
          errors.push(urlValidation.error);
        }
      }

      // String length validation
      if (data.name && data.name.length > this.securityConfig.maxStringLength) {
        errors.push('Camera name exceeds maximum length');
      }

    } catch (error) {
      errors.push(`Camera validation error: ${error.message}`);
    }

    return {
      isValid: errors.length === 0,
      errors,
      sanitized: this.sanitizeCameraData(data),
    };
  }

  /**
   * Validate image URL
   */
  validateImageUrl(url) {
    try {
      const urlValidation = this.validateApiUrl(url);
      if (!urlValidation.isValid) {
        return urlValidation;
      }

      // Additional image-specific validation
      const urlObj = new URL(url);

      // Check file extension
      const path = urlObj.pathname.toLowerCase();
      if (!path.match(/\.(jpg|jpeg|png|webp)$/)) {
        throw new Error('Invalid image file extension');
      }

      return { isValid: true, sanitizedUrl: url };

    } catch (error) {
      return {
        isValid: false,
        error: `Image URL validation failed: ${error.message}`,
        sanitizedUrl: null,
      };
    }
  }

  /**
   * Check for suspicious content (XSS, injection attempts)
   */
  containsSuspiciousContent(input) {
    if (typeof input !== 'string') {return false;}

    const suspiciousPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
      /eval\s*\(/i,
      /expression\s*\(/i,
      /vbscript:/i,
      /data:text\/html/i,
    ];

    return suspiciousPatterns.some(pattern => pattern.test(input));
  }

  /**
   * Sanitize weather data
   */
  sanitizeWeatherData(data) {
    if (!data || typeof data !== 'object') {return null;}

    return {
      timestamp: this.sanitizeString(data.timestamp),
      source: this.sanitizeString(data.source),
      status: this.sanitizeString(data.status),
      data: data.data ? this.sanitizeObjectProperties(data.data) : null,
    };
  }

  /**
   * Sanitize camera data
   */
  sanitizeCameraData(data) {
    if (!data || typeof data !== 'object') {return null;}

    return {
      id: this.sanitizeString(data.id),
      name: this.sanitizeString(data.name),
      area: this.sanitizeString(data.area),
      location: data.location ? {
        latitude: this.sanitizeNumber(data.location.latitude),
        longitude: this.sanitizeNumber(data.location.longitude),
      } : null,
      image: data.image ? {
        url: this.sanitizeString(data.image.url),
        width: this.sanitizeNumber(data.image.width),
        height: this.sanitizeNumber(data.image.height),
      } : null,
      timestamp: this.sanitizeString(data.timestamp),
      status: this.sanitizeString(data.status),
    };
  }

  /**
   * Sanitize string input
   */
  sanitizeString(input) {
    if (typeof input !== 'string') {return String(input || '');}

    return input
      .slice(0, this.securityConfig.maxStringLength)
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
  }

  /**
   * Sanitize numeric input
   */
  sanitizeNumber(input) {
    const num = parseFloat(input);
    return isNaN(num) ? 0 : num;
  }

  /**
   * Sanitize object properties recursively
   */
  sanitizeObjectProperties(obj, depth = 0) {
    if (depth > 5) {return null;} // Prevent deep recursion
    if (!obj || typeof obj !== 'object') {return obj;}

    const sanitized = {};

    for (const [key, value] of Object.entries(obj)) {
      const sanitizedKey = this.sanitizeString(key);

      if (typeof value === 'string') {
        sanitized[sanitizedKey] = this.sanitizeString(value);
      } else if (typeof value === 'number') {
        sanitized[sanitizedKey] = this.sanitizeNumber(value);
      } else if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          sanitized[sanitizedKey] = value
            .slice(0, this.securityConfig.maxArrayLength)
            .map(item => this.sanitizeObjectProperties(item, depth + 1));
        } else {
          sanitized[sanitizedKey] = this.sanitizeObjectProperties(value, depth + 1);
        }
      } else {
        sanitized[sanitizedKey] = value;
      }
    }

    return sanitized;
  }

  /**
   * Rate limiting check per client
   */
  checkRateLimit(clientId, maxRequests = 100, windowMs = 60000) {
    const now = Date.now();
    const key = `rate_limit_${clientId}`;

    if (!this._rateLimitStore) {
      this._rateLimitStore = new Map();
    }

    let requests = this._rateLimitStore.get(key) || [];

    // Clean old requests
    requests = requests.filter(timestamp => now - timestamp < windowMs);

    if (requests.length >= maxRequests) {
      return {
        allowed: false,
        reset: Math.ceil((requests[0] + windowMs - now) / 1000),
        remaining: 0,
      };
    }

    requests.push(now);
    this._rateLimitStore.set(key, requests);

    return {
      allowed: true,
      remaining: maxRequests - requests.length,
      reset: Math.ceil(windowMs / 1000),
    };
  }
}

/**
 * Content Security Policy configuration
 */
export const getCSPConfig = () => {
  return {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // For inline scripts (consider removing in production)
      'https://api.data.gov.sg',
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // For Tailwind CSS
      'https://fonts.googleapis.com',
    ],
    'img-src': [
      "'self'",
      'data:',
      'https://api.data.gov.sg',
      'https://data.gov.sg',
    ],
    'connect-src': [
      "'self'",
      'https://api.data.gov.sg',
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com',
    ],
    'frame-src': ["'none'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
  };
};

/**
 * Security headers configuration
 */
export const getSecurityHeaders = () => {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
    'Content-Security-Policy': Object.entries(getCSPConfig())
      .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
      .join('; '),
  };
};

// Singleton instance
export const securityValidator = new SecurityValidator();

export default securityValidator;