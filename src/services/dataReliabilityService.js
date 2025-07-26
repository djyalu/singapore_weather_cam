/**
 * Data Reliability Service for Singapore Weather Cam
 * Provides comprehensive data pipeline reliability, validation, and recovery
 */

import { healthService } from './healthService.js';
import { metricsService } from './metricsService.js';

/**
 * Data Pipeline Reliability Manager
 */
export class DataReliabilityService {
  constructor() {
    this.config = {
      maxRetries: 3,
      retryDelay: 1000, // Initial delay in ms
      maxRetryDelay: 30000, // Maximum delay in ms
      dataTimeoutThreshold: 10 * 60 * 1000, // 10 minutes
      qualityThresholds: {
        weatherStations: 3, // Minimum weather stations required
        webcamSources: 2, // Minimum webcam sources required
        dataFreshness: 15 * 60 * 1000, // 15 minutes max age
      },
    };

    this.dataCache = {
      weather: new Map(),
      webcam: new Map(),
      lastSuccessful: {
        weather: null,
        webcam: null,
      },
    };

    this.retryState = new Map();
    this.dataQualityMetrics = new Map();

    this.initializeDataMonitoring();
  }

  /**
   * Initialize data monitoring and health checks
   */
  initializeDataMonitoring() {
    // Check data quality every 2 minutes
    setInterval(() => {
      this.performDataQualityCheck();
    }, 2 * 60 * 1000);

    // Cleanup old cache entries every 5 minutes
    setInterval(() => {
      this.cleanupDataCache();
    }, 5 * 60 * 1000);
  }

  /**
   * Enhanced data loading with reliability patterns
   */
  async loadDataWithReliability(dataType, fetchFunction, options = {}) {
    const startTime = Date.now();
    const _cacheKey = `${dataType}_${Date.now()}`; // For future caching implementation

    try {
      // Track the data loading attempt
      metricsService.trackCustomMetric(`data_load_attempt_${dataType}`, 1, 'count', {
        timestamp: new Date().toISOString(),
      });

      // Execute with retry mechanism
      const data = await this.executeWithRetry(
        `${dataType}_load`,
        fetchFunction,
        options,
      );

      // Validate data quality
      const qualityResult = await this.validateDataQuality(dataType, data);

      if (!qualityResult.isValid) {
        throw new Error(`Data quality validation failed: ${qualityResult.issues.join(', ')}`);
      }

      // Cache successful data
      this.cacheSuccessfulData(dataType, data);

      // Track successful load
      const duration = Date.now() - startTime;
      metricsService.trackCustomMetric(`data_load_success_${dataType}`, duration, 'ms', {
        qualityScore: qualityResult.score,
        dataPoints: qualityResult.dataPoints,
      });

      return {
        data,
        metadata: {
          loadTime: duration,
          qualityScore: qualityResult.score,
          dataAge: this.calculateDataAge(data),
          source: 'live',
          cached: false,
        },
      };

    } catch (error) {
      console.error(`Data loading failed for ${dataType}:`, error);

      // Track failed load
      metricsService.trackCustomMetric(`data_load_failure_${dataType}`, 1, 'count', {
        error: error.message,
        duration: Date.now() - startTime,
      });

      // Record error for monitoring
      healthService.recordError(error, {
        type: 'data_load_failure',
        dataType,
        retryAttempts: this.getRetryCount(`${dataType}_load`),
      });

      // Attempt graceful degradation
      return this.handleDataLoadFailure(dataType, error);
    }
  }

  /**
   * Execute function with intelligent retry mechanism
   */
  async executeWithRetry(operationId, fetchFunction, options = {}) {
    const maxRetries = options.maxRetries || this.config.maxRetries;
    let lastError;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        if (attempt > 0) {
          const delay = this.calculateRetryDelay(attempt);
          console.log(`Retry attempt ${attempt}/${maxRetries} for ${operationId} after ${delay}ms`);
          await this.sleep(delay);
        }

        // Track retry attempt
        this.updateRetryState(operationId, attempt);

        const result = await fetchFunction();

        // Reset retry state on success
        this.resetRetryState(operationId);

        return result;

      } catch (error) {
        lastError = error;

        // Check if error is retryable
        if (!this.isRetryableError(error) || attempt === maxRetries) {
          break;
        }
      }
    }

    throw lastError;
  }

  /**
   * Calculate exponential backoff retry delay with jitter
   */
  calculateRetryDelay(attempt) {
    const baseDelay = this.config.retryDelay;
    const exponentialDelay = baseDelay * Math.pow(2, attempt - 1);
    const jitter = Math.random() * 1000; // Add up to 1 second jitter

    return Math.min(exponentialDelay + jitter, this.config.maxRetryDelay);
  }

  /**
   * Check if error is retryable
   */
  isRetryableError(error) {
    const retryablePatterns = [
      /network/i,
      /timeout/i,
      /connection/i,
      /temporary/i,
      /service unavailable/i,
      /rate limit/i,
      /502/,
      /503/,
      /504/,
    ];

    return retryablePatterns.some(pattern => pattern.test(error.message));
  }

  /**
   * Validate data quality with comprehensive checks
   */
  async validateDataQuality(dataType, data) {
    const validationResult = {
      isValid: true,
      score: 100,
      issues: [],
      dataPoints: 0,
    };

    try {
      if (dataType === 'weather') {
        return this.validateWeatherDataQuality(data, validationResult);
      } else if (dataType === 'webcam') {
        return this.validateWebcamDataQuality(data, validationResult);
      }
    } catch (error) {
      validationResult.isValid = false;
      validationResult.score = 0;
      validationResult.issues.push(`Validation error: ${error.message}`);
    }

    return validationResult;
  }

  /**
   * Validate weather data quality
   */
  validateWeatherDataQuality(data, result) {
    // Check data structure
    if (!data || typeof data !== 'object') {
      result.isValid = false;
      result.issues.push('Invalid data structure');
      return result;
    }

    // Check timestamp freshness
    if (data.timestamp) {
      const dataAge = Date.now() - new Date(data.timestamp).getTime();
      if (dataAge > this.config.qualityThresholds.dataFreshness) {
        result.score -= 20;
        result.issues.push(`Data too old: ${Math.round(dataAge / 60000)} minutes`);
      }
    } else {
      result.score -= 30;
      result.issues.push('Missing timestamp');
    }

    // Check weather data completeness
    if (data.data) {
      let stationCount = 0;

      if (data.data.temperature?.readings) {
        stationCount = Math.max(stationCount, data.data.temperature.readings.length);
      }

      if (data.data.humidity?.readings) {
        stationCount = Math.max(stationCount, data.data.humidity.readings.length);
      }

      result.dataPoints = stationCount;

      if (stationCount < this.config.qualityThresholds.weatherStations) {
        result.score -= 25;
        result.issues.push(`Insufficient weather stations: ${stationCount} < ${this.config.qualityThresholds.weatherStations}`);
      }

      // Check for required Singapore weather stations
      const requiredStations = ['S121', 'S116', 'S118']; // Bukit Timah area
      const availableStations = data.data.temperature?.readings?.map(r => r.station_id) || [];
      const missingStations = requiredStations.filter(id => !availableStations.includes(id));

      if (missingStations.length > 0) {
        result.score -= missingStations.length * 10;
        result.issues.push(`Missing key stations: ${missingStations.join(', ')}`);
      }

    } else {
      result.isValid = false;
      result.issues.push('Missing weather data object');
    }

    // Determine if data is acceptable
    if (result.score < 50) {
      result.isValid = false;
    }

    return result;
  }

  /**
   * Validate webcam data quality
   */
  validateWebcamDataQuality(data, result) {
    // Check data structure
    if (!data || typeof data !== 'object') {
      result.isValid = false;
      result.issues.push('Invalid data structure');
      return result;
    }

    // Check captures array
    if (!data.captures || !Array.isArray(data.captures)) {
      result.isValid = false;
      result.issues.push('Missing or invalid captures array');
      return result;
    }

    result.dataPoints = data.captures.length;

    // Check minimum webcam sources
    if (data.captures.length < this.config.qualityThresholds.webcamSources) {
      result.score -= 30;
      result.issues.push(`Insufficient webcam sources: ${data.captures.length} < ${this.config.qualityThresholds.webcamSources}`);
    }

    // Check capture quality
    const validCaptures = data.captures.filter(capture =>
      capture.imageUrl &&
      capture.name &&
      capture.coordinates &&
      typeof capture.coordinates.lat === 'number' &&
      typeof capture.coordinates.lng === 'number',
    );

    const qualityRatio = validCaptures.length / data.captures.length;
    if (qualityRatio < 0.8) {
      result.score -= Math.round((1 - qualityRatio) * 40);
      result.issues.push(`Low quality captures: ${Math.round(qualityRatio * 100)}%`);
    }

    // Check timestamp freshness
    if (data.timestamp) {
      const dataAge = Date.now() - new Date(data.timestamp).getTime();
      if (dataAge > this.config.qualityThresholds.dataFreshness) {
        result.score -= 15;
        result.issues.push(`Webcam data too old: ${Math.round(dataAge / 60000)} minutes`);
      }
    }

    // Determine if data is acceptable
    if (result.score < 40) {
      result.isValid = false;
    }

    return result;
  }

  /**
   * Handle data load failure with graceful degradation
   */
  async handleDataLoadFailure(dataType, error) {
    console.warn(`Handling data load failure for ${dataType}:`, error.message);

    // Try to use cached data
    const cachedData = this.getLastSuccessfulData(dataType);
    if (cachedData) {
      const dataAge = Date.now() - cachedData.timestamp;

      // Use cached data if it's not too old
      if (dataAge < this.config.dataTimeoutThreshold) {
        console.log(`Using cached ${dataType} data (${Math.round(dataAge / 60000)} minutes old)`);

        metricsService.trackCustomMetric(`data_load_cached_fallback_${dataType}`, 1, 'count', {
          cacheAge: dataAge,
          reason: error.message,
        });

        return {
          data: cachedData.data,
          metadata: {
            loadTime: 0,
            qualityScore: cachedData.qualityScore || 70,
            dataAge,
            source: 'cache_fallback',
            cached: true,
            fallbackReason: error.message,
          },
        };
      }
    }

    // Generate fallback data as last resort
    const fallbackData = this.generateFallbackData(dataType);

    metricsService.trackCustomMetric(`data_load_fallback_generated_${dataType}`, 1, 'count', {
      reason: error.message,
    });

    return {
      data: fallbackData,
      metadata: {
        loadTime: 0,
        qualityScore: 30,
        dataAge: 0,
        source: 'fallback_generated',
        cached: false,
        fallbackReason: error.message,
      },
    };
  }

  /**
   * Generate fallback data when all else fails
   */
  generateFallbackData(dataType) {
    const timestamp = new Date().toISOString();

    if (dataType === 'weather') {
      return {
        timestamp,
        source: 'Fallback System',
        status: 'service_degraded',
        data: {
          message: 'Weather data temporarily unavailable',
          temperature: {
            average: 28.5,
            note: 'Singapore typical range: 26-32°C',
          },
          humidity: {
            average: 75,
            note: 'Singapore typical range: 65-85%',
          },
          location: {
            name: 'Bukit Timah Nature Reserve',
            coordinates: { lat: 1.3520, lng: 103.7767 },
          },
        },
      };
    } else if (dataType === 'webcam') {
      return {
        timestamp,
        source: 'Fallback System',
        status: 'service_degraded',
        captures: [
          {
            id: 'fallback_001',
            name: 'Service Temporarily Unavailable',
            location: 'Bukit Timah Nature Reserve',
            coordinates: { lat: 1.3520, lng: 103.7767 },
            imageUrl: null,
            note: 'Webcam feeds will resume shortly',
          },
        ],
      };
    }

    return {
      timestamp,
      source: 'Fallback System',
      status: 'service_degraded',
      message: 'Data temporarily unavailable',
    };
  }

  /**
   * Cache successful data for fallback
   */
  cacheSuccessfulData(dataType, data) {
    const cacheEntry = {
      data,
      timestamp: Date.now(),
      qualityScore: 100, // Assume good quality for successful loads
    };

    this.dataCache[dataType].set(Date.now(), cacheEntry);
    this.dataCache.lastSuccessful[dataType] = cacheEntry;

    // Keep only last 5 successful loads
    if (this.dataCache[dataType].size > 5) {
      const oldestKey = Math.min(...this.dataCache[dataType].keys());
      this.dataCache[dataType].delete(oldestKey);
    }
  }

  /**
   * Get last successful data
   */
  getLastSuccessfulData(dataType) {
    return this.dataCache.lastSuccessful[dataType];
  }

  /**
   * Calculate data age
   */
  calculateDataAge(data) {
    if (!data.timestamp) {return null;}
    return Date.now() - new Date(data.timestamp).getTime();
  }

  /**
   * Perform comprehensive data quality check
   */
  performDataQualityCheck() {
    const now = Date.now();
    const qualityReport = {
      timestamp: new Date().toISOString(),
      overall: 'healthy',
      weather: this.assessDataTypeHealth('weather'),
      webcam: this.assessDataTypeHealth('webcam'),
    };

    // Determine overall health
    const healthScores = [qualityReport.weather.score, qualityReport.webcam.score];
    const avgScore = healthScores.reduce((sum, score) => sum + score, 0) / healthScores.length;

    if (avgScore < 50) {
      qualityReport.overall = 'unhealthy';
    } else if (avgScore < 75) {
      qualityReport.overall = 'degraded';
    }

    // Store quality metrics
    this.dataQualityMetrics.set(now, qualityReport);

    // Clean old metrics (keep last 24 hours)
    const cutoffTime = now - (24 * 60 * 60 * 1000);
    for (const [timestamp] of this.dataQualityMetrics) {
      if (timestamp < cutoffTime) {
        this.dataQualityMetrics.delete(timestamp);
      }
    }

    // Log quality issues
    if (qualityReport.overall !== 'healthy') {
      console.warn('🔍 Data quality issues detected:', qualityReport);

      healthService.recordError(new Error(`Data quality degraded: ${qualityReport.overall}`), {
        type: 'data_quality_issue',
        qualityReport,
      });
    }

    return qualityReport;
  }

  /**
   * Assess health of specific data type
   */
  assessDataTypeHealth(dataType) {
    const lastSuccessful = this.getLastSuccessfulData(dataType);
    const retryInfo = this.retryState.get(`${dataType}_load`);

    let score = 100;
    const issues = [];

    // Check data freshness
    if (lastSuccessful) {
      const dataAge = Date.now() - lastSuccessful.timestamp;
      if (dataAge > this.config.qualityThresholds.dataFreshness) {
        score -= 30;
        issues.push(`Stale data: ${Math.round(dataAge / 60000)} minutes old`);
      }
    } else {
      score -= 50;
      issues.push('No successful data loads');
    }

    // Check retry status
    if (retryInfo && retryInfo.attemptCount > 0) {
      score -= retryInfo.attemptCount * 10;
      issues.push(`Active retries: ${retryInfo.attemptCount}`);
    }

    return {
      score: Math.max(score, 0),
      status: score >= 75 ? 'healthy' : score >= 50 ? 'degraded' : 'unhealthy',
      issues,
      lastSuccessfulLoad: lastSuccessful?.timestamp,
    };
  }

  /**
   * Cleanup old cache entries
   */
  cleanupDataCache() {
    const cutoffTime = Date.now() - this.config.dataTimeoutThreshold;

    ['weather', 'webcam'].forEach(dataType => {
      for (const [timestamp] of this.dataCache[dataType]) {
        if (timestamp < cutoffTime) {
          this.dataCache[dataType].delete(timestamp);
        }
      }
    });
  }

  /**
   * Update retry state tracking
   */
  updateRetryState(operationId, attemptCount) {
    this.retryState.set(operationId, {
      attemptCount,
      lastAttempt: Date.now(),
    });
  }

  /**
   * Reset retry state on success
   */
  resetRetryState(operationId) {
    this.retryState.delete(operationId);
  }

  /**
   * Get current retry count
   */
  getRetryCount(operationId) {
    return this.retryState.get(operationId)?.attemptCount || 0;
  }

  /**
   * Sleep utility for retry delays
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Get comprehensive reliability report
   */
  getReliabilityReport() {
    const recent = Array.from(this.dataQualityMetrics.values()).slice(-1)[0];

    return {
      timestamp: new Date().toISOString(),
      currentQuality: recent || { overall: 'unknown' },
      cacheStatus: {
        weather: {
          entriesCount: this.dataCache.weather.size,
          lastSuccessful: this.dataCache.lastSuccessful.weather?.timestamp,
        },
        webcam: {
          entriesCount: this.dataCache.webcam.size,
          lastSuccessful: this.dataCache.lastSuccessful.webcam?.timestamp,
        },
      },
      activeRetries: Object.fromEntries(this.retryState),
      configuration: this.config,
    };
  }
}

// Create singleton instance
export const dataReliabilityService = new DataReliabilityService();

// Make available globally for cross-service access (avoiding circular dependencies)
if (typeof window !== 'undefined') {
  window.dataReliabilityService = dataReliabilityService;
}

export default dataReliabilityService;