/**
 * Enhanced API Service with Advanced Circuit Breaker and Caching
 * Backend Infrastructure Improvement - Reliability First
 */

import { securityValidator } from './securityService.js';
import { metricsService } from './metricsService.js';

class CircuitBreaker {
  constructor(options = {}) {
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.failureThreshold = options.failureThreshold || 5;
    this.timeout = options.timeout || 60000; // 1 minute
    this.monitor = options.monitor || (() => {});
    this.lastFailureTime = null;
    this.nextAttempt = null;

    // Enhanced monitoring
    this.metrics = {
      totalRequests: 0,
      failedRequests: 0,
      successfulRequests: 0,
      averageResponseTime: 0,
      stateChanges: [],
    };
  }

  async execute(request) {
    this.metrics.totalRequests++;

    if (this.state === 'OPEN') {
      if (this.nextAttempt && Date.now() < this.nextAttempt) {
        throw new CircuitBreakerError('Circuit breaker is OPEN', this.getStatus());
      }
      this.state = 'HALF_OPEN';
      this.logStateChange('HALF_OPEN');
    }

    try {
      const startTime = Date.now();
      const result = await request();
      const responseTime = Date.now() - startTime;

      this.onSuccess(responseTime);
      return result;
    } catch (error) {
      this.onFailure(error);
      throw error;
    }
  }

  onSuccess(responseTime) {
    this.metrics.successfulRequests++;
    this.updateAverageResponseTime(responseTime);

    if (this.state === 'HALF_OPEN') {
      this.state = 'CLOSED';
      this.failureCount = 0;
      this.logStateChange('CLOSED');
    }

    this.monitor('success', this.getStatus());
  }

  onFailure(error) {
    this.metrics.failedRequests++;
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
      this.nextAttempt = this.lastFailureTime + this.timeout;
      this.logStateChange('OPEN');
    }

    this.monitor('failure', { error: error.message, ...this.getStatus() });
  }

  updateAverageResponseTime(responseTime) {
    const total = this.metrics.averageResponseTime * (this.metrics.successfulRequests - 1);
    this.metrics.averageResponseTime = (total + responseTime) / this.metrics.successfulRequests;
  }

  logStateChange(newState) {
    this.metrics.stateChanges.push({
      timestamp: new Date().toISOString(),
      from: this.state,
      to: newState,
      failureCount: this.failureCount,
    });
  }

  getStatus() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      failureThreshold: this.failureThreshold,
      metrics: this.metrics,
      uptime: this.calculateUptime(),
    };
  }

  calculateUptime() {
    const totalRequests = this.metrics.totalRequests;
    if (totalRequests === 0) {return 100;}

    return ((this.metrics.successfulRequests / totalRequests) * 100).toFixed(2);
  }

  reset() {
    this.state = 'CLOSED';
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.nextAttempt = null;
  }
}

class CircuitBreakerError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'CircuitBreakerError';
    this.status = status;
  }
}

/**
 * Enhanced Caching Service with TTL and Intelligent Invalidation
 */
class CacheService {
  constructor() {
    this.cache = new Map();
    this.ttl = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes
    this.maxSize = 100; // Maximum cache entries

    // Cache statistics
    this.stats = {
      hits: 0,
      misses: 0,
      evictions: 0,
      sets: 0,
    };
  }

  set(key, value, ttl = this.defaultTTL) {
    // Implement LRU eviction if cache is full
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU();
    }

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      accessCount: 0,
    });

    this.ttl.set(key, Date.now() + ttl);
    this.stats.sets++;
  }

  get(key) {
    const item = this.cache.get(key);
    const expiry = this.ttl.get(key);

    if (!item || (expiry && Date.now() > expiry)) {
      this.cache.delete(key);
      this.ttl.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update access tracking for LRU
    item.accessCount++;
    item.timestamp = Date.now();
    this.stats.hits++;

    return item.value;
  }

  evictLRU() {
    let oldestKey = null;
    let oldestTime = Infinity;

    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      this.ttl.delete(oldestKey);
      this.stats.evictions++;
    }
  }

  clear() {
    this.cache.clear();
    this.ttl.clear();
  }

  getStats() {
    const hitRate = this.stats.hits + this.stats.misses > 0
      ? (this.stats.hits / (this.stats.hits + this.stats.misses) * 100).toFixed(2)
      : 0;

    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      size: this.cache.size,
      maxSize: this.maxSize,
    };
  }
}

/**
 * API Rate Limiter for protecting against abuse
 */
class RateLimiter {
  constructor(options = {}) {
    this.requests = new Map();
    this.windowSize = options.windowSize || 60000; // 1 minute
    this.maxRequests = options.maxRequests || 100;
  }

  isAllowed(identifier) {
    const now = Date.now();
    const windowStart = now - this.windowSize;

    if (!this.requests.has(identifier)) {
      this.requests.set(identifier, []);
    }

    const requestTimes = this.requests.get(identifier);

    // Clean old requests outside the window
    const validRequests = requestTimes.filter(time => time > windowStart);
    this.requests.set(identifier, validRequests);

    if (validRequests.length >= this.maxRequests) {
      return false;
    }

    validRequests.push(now);
    return true;
  }

  getStatus(identifier) {
    const requests = this.requests.get(identifier) || [];
    const now = Date.now();
    const windowStart = now - this.windowSize;
    const validRequests = requests.filter(time => time > windowStart);

    return {
      requestCount: validRequests.length,
      maxRequests: this.maxRequests,
      resetTime: validRequests.length > 0 ? validRequests[0] + this.windowSize : now,
    };
  }
}

/**
 * Enhanced API Service with all improvements
 */
export class APIService {
  constructor() {
    this.cache = new CacheService();
    this.rateLimiter = new RateLimiter({
      windowSize: 60000, // 1 minute
      maxRequests: 50, // Per minute per endpoint
    });

    // Circuit breakers for different endpoints
    this.circuitBreakers = {
      weather: new CircuitBreaker({
        failureThreshold: 3,
        timeout: 30000,
        monitor: this.logCircuitBreakerEvent.bind(this),
      }),
      traffic: new CircuitBreaker({
        failureThreshold: 5,
        timeout: 60000,
        monitor: this.logCircuitBreakerEvent.bind(this),
      }),
    };

    // Request queue for handling bursts
    this.requestQueue = [];
    this.isProcessingQueue = false;
    this.maxConcurrentRequests = 3;
    this.activeRequests = 0;
  }

  logCircuitBreakerEvent(type, data) {
    console.log(`[Circuit Breaker] ${type}:`, data);

    // Could send to monitoring service
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'circuit_breaker', {
        event_category: 'api',
        event_label: type,
        custom_map: { data: JSON.stringify(data) },
      });
    }
  }

  async fetch(url, options = {}) {
    // Security validation: Validate URL before any processing
    const urlValidation = securityValidator.validateApiUrl(url);
    if (!urlValidation.isValid) {
      throw new Error(`Security validation failed: ${urlValidation.error}`);
    }

    const identifier = this.getRequestIdentifier(url);

    // Enhanced rate limiting check with security validator
    const rateLimitCheck = securityValidator.checkRateLimit(identifier, 50, 60000);
    if (!rateLimitCheck.allowed) {
      throw new Error(`Rate limit exceeded for ${identifier}. Reset in ${rateLimitCheck.reset} seconds`);
    }

    // Check cache first
    const cacheKey = this.getCacheKey(url, options);
    const cachedResponse = this.cache.get(cacheKey);
    if (cachedResponse) {
      // Track cache hit
      metricsService.trackAPICall(
        this.getEndpointName(url),
        options.method || 'GET',
        200,
        0, // Cache hits are instant
        {
          cached: true,
          cacheHit: true,
          cacheKey,
        },
      );
      return cachedResponse;
    }

    // Determine which circuit breaker to use
    const circuitBreaker = this.getCircuitBreaker(url);

    // Queue request if too many concurrent requests
    if (this.activeRequests >= this.maxConcurrentRequests) {
      return this.queueRequest(url, options, circuitBreaker, cacheKey);
    }

    return this.executeRequest(url, options, circuitBreaker, cacheKey);
  }

  async executeRequest(url, options, circuitBreaker, cacheKey) {
    const startTime = Date.now();
    this.activeRequests++;

    try {
      const response = await circuitBreaker.execute(async () => {
        const fetchOptions = this.buildFetchOptions(options);
        
        // Implement proper timeout for fetch
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options.timeout || 10000);
        
        try {
          const response = await fetch(url, {
            ...fetchOptions,
            signal: controller.signal
          });

          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          return response.json();
        } finally {
          clearTimeout(timeoutId);
        }
      });

      const duration = Date.now() - startTime;

      // Track successful API call
      metricsService.trackAPICall(
        this.getEndpointName(url),
        options.method || 'GET',
        200,
        duration,
        {
          cached: false,
          circuitBreakerState: circuitBreaker.state,
          cacheKey,
        },
      );

      // Cache successful responses
      this.cache.set(cacheKey, response, options.cacheTTL);
      return response;

    } catch (error) {
      const duration = Date.now() - startTime;

      // Track failed API call
      metricsService.trackAPICall(
        this.getEndpointName(url),
        options.method || 'GET',
        error.message.includes('HTTP') ? parseInt(error.message.match(/\d+/)[0]) : 0,
        duration,
        {
          error: error.message,
          circuitBreakerState: circuitBreaker.state,
          cacheKey,
        },
      );

      throw error;
    } finally {
      this.activeRequests--;
      this.processQueue();
    }
  }

  async queueRequest(url, options, circuitBreaker, cacheKey) {
    return new Promise((resolve, reject) => {
      this.requestQueue.push({
        url,
        options,
        circuitBreaker,
        cacheKey,
        resolve,
        reject,
      });

      this.processQueue();
    });
  }

  async processQueue() {
    if (this.isProcessingQueue || this.requestQueue.length === 0) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0 && this.activeRequests < this.maxConcurrentRequests) {
      const request = this.requestQueue.shift();

      this.executeRequest(
        request.url,
        request.options,
        request.circuitBreaker,
        request.cacheKey,
      ).then(request.resolve).catch(request.reject);
    }

    this.isProcessingQueue = false;
  }

  buildFetchOptions(options) {
    return {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Singapore-Weather-Cam/1.0',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        ...options.headers,
      },
      mode: 'cors', // Enable CORS
      ...options,
    };
  }

  getRequestIdentifier(url) {
    return new URL(url).hostname;
  }

  getEndpointName(url) {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;

      // Extract meaningful endpoint names
      if (pathname.includes('weather') || pathname.includes('temperature')) {
        return 'weather-api';
      }
      if (pathname.includes('traffic') || pathname.includes('transport')) {
        return 'traffic-api';
      }
      if (pathname.includes('humidity')) {
        return 'humidity-api';
      }
      if (pathname.includes('rainfall')) {
        return 'rainfall-api';
      }

      return pathname.split('/').filter(Boolean).join('-') || 'unknown-endpoint';
    } catch (error) {
      return 'invalid-url';
    }
  }

  getCacheKey(url, options) {
    return `${url}_${JSON.stringify(options.headers || {})}`;
  }

  getCircuitBreaker(url) {
    if (url.includes('weather') || url.includes('temperature') || url.includes('humidity')) {
      return this.circuitBreakers.weather;
    }
    if (url.includes('traffic')) {
      return this.circuitBreakers.traffic;
    }
    return this.circuitBreakers.weather; // Default
  }

  // Health check and diagnostics
  getHealthStatus() {
    return {
      circuitBreakers: Object.fromEntries(
        Object.entries(this.circuitBreakers).map(([key, cb]) => [key, cb.getStatus()]),
      ),
      cache: this.cache.getStats(),
      rateLimiter: {
        activeRequests: this.activeRequests,
        queueLength: this.requestQueue.length,
        maxConcurrentRequests: this.maxConcurrentRequests,
      },
      timestamp: new Date().toISOString(),
    };
  }

  // Reset all services (useful for testing)
  reset() {
    Object.values(this.circuitBreakers).forEach(cb => cb.reset());
    this.cache.clear();
    this.requestQueue = [];
    this.activeRequests = 0;
  }
}

// Singleton instance
export const apiService = new APIService();
export default apiService;