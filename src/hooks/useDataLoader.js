import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../services/apiService.js';
import { securityValidator } from '../services/securityService.js';
import { dataReliabilityService } from '../services/dataReliabilityService.js';
import { transformWeatherData } from '../utils/weatherDataTransformer.js';

/**
 * Enhanced custom hook for data loading with comprehensive reliability service integration
 * Features: Intelligent retry, data quality validation, graceful degradation, circuit breaker,
 * advanced caching, security validation, auto-refresh, real-time monitoring
 */
export const useDataLoader = (refreshInterval = 5 * 60 * 1000) => {
  const [weatherData, setWeatherData] = useState(null);
  const [webcamData, setWebcamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastFetch, setLastFetch] = useState(null);

  // Enhanced reliability tracking
  const [reliabilityMetrics, setReliabilityMetrics] = useState({
    weatherQuality: null,
    webcamQuality: null,
    fallbackMode: false,
    dataAge: null,
  });

  // Use ref to track if component is mounted
  const isMountedRef = useRef(true);

  // Enhanced data loading with comprehensive reliability service
  const loadData = useCallback(async () => {
    if (!isMountedRef.current) {return;}

    const startTime = Date.now();

    try {
      setLoading(true);
      setError(null);

      const basePath = import.meta.env.BASE_URL || '/';
      const timestamp = new Date().getTime(); // Cache busting

      // Use data reliability service for enhanced data loading with intelligent retry, validation, and fallback
      const [weatherResult, webcamResult] = await Promise.all([
        dataReliabilityService.loadDataWithReliability(
          'weather',
          () => apiService.fetch(`${basePath}data/weather/latest.json?t=${timestamp}`, {
            cacheTTL: 2 * 60 * 1000, // 2 minute cache for weather data
            timeout: 10000, // 10 second timeout
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
            },
          }),
          { maxRetries: 3 },
        ),
        dataReliabilityService.loadDataWithReliability(
          'webcam',
          () => apiService.fetch(`${basePath}data/webcam/latest.json?t=${timestamp}`, {
            cacheTTL: 60 * 1000, // 1 minute cache for webcam data
            timeout: 15000, // 15 second timeout for larger data
            headers: {
              'Cache-Control': 'no-cache',
              'Pragma': 'no-cache',
            },
          }),
          { maxRetries: 3 },
        ),
      ]);

      if (!isMountedRef.current) {return;}

      // Additional security validation layer (in addition to reliability service validation)
      const weatherValidation = securityValidator.validateWeatherData(weatherResult.data);
      if (!weatherValidation.isValid) {
        console.warn('Security validation failed for weather data:', weatherValidation.errors);
        // Continue with sanitized data from reliability service
      }

      // Transform weather data to standard format
      const transformedWeatherData = transformWeatherData(weatherResult.data);
      
      // Enhanced metadata including reliability metrics
      const enhancedWeatherData = {
        ...transformedWeatherData,
        reliabilityMetadata: {
          ...weatherResult.metadata,
          totalLoadTime: Date.now() - startTime,
          securityValidated: weatherValidation.isValid,
          timestamp: new Date().toISOString(),
        },
      };

      const enhancedWebcamData = {
        ...webcamResult.data,
        reliabilityMetadata: {
          ...webcamResult.metadata,
          totalLoadTime: Date.now() - startTime,
          timestamp: new Date().toISOString(),
        },
      };

      // Update reliability metrics for monitoring
      setReliabilityMetrics({
        weatherQuality: weatherResult.metadata.qualityScore,
        webcamQuality: webcamResult.metadata.qualityScore,
        fallbackMode: weatherResult.metadata.source?.includes('fallback') || webcamResult.metadata.source?.includes('fallback'),
        dataAge: Math.max(weatherResult.metadata.dataAge || 0, webcamResult.metadata.dataAge || 0),
      });

      // Always use the transformed data, but include security validation metadata
      setWeatherData({
        ...enhancedWeatherData,
        securityValidation: {
          isValid: weatherValidation.isValid,
          errors: weatherValidation.errors || []
        }
      });
      setWebcamData(enhancedWebcamData);
      setRetryCount(0); // Reset retry count on success
      setLastFetch(new Date());

      // Log successful data load with reliability info
      console.log('📊 Enhanced data loaded successfully:', {
        weather: {
          qualityScore: weatherResult.metadata.qualityScore,
          source: weatherResult.metadata.source,
          loadTime: weatherResult.metadata.loadTime,
          locationsCount: transformedWeatherData.locations?.length || 0,
          hasCurrentData: !!transformedWeatherData.current
        },
        webcam: {
          qualityScore: webcamResult.metadata.qualityScore,
          source: webcamResult.metadata.source,
          loadTime: webcamResult.metadata.loadTime,
        },
        totalLoadTime: Date.now() - startTime,
      });

    } catch (err) {
      console.error('Enhanced data loading error:', err);

      if (isMountedRef.current) {
        // Categorize error types for better handling
        const errorCategory = categorizeError(err);
        setError({
          message: err.message,
          category: errorCategory,
          timestamp: new Date().toISOString(),
          retryable: isRetryableError(errorCategory),
        });
        setRetryCount(prev => prev + 1);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

  // Enhanced data validation functions (future use)
  const _validateWeatherData = (data) => {
    if (!data || typeof data !== 'object') {
      return { isValid: false, error: 'Invalid data structure' };
    }

    if (!data.timestamp) {
      return { isValid: false, error: 'Missing timestamp' };
    }

    if (!data.data || typeof data.data !== 'object') {
      return { isValid: false, error: 'Missing weather data object' };
    }

    return { isValid: true };
  };

  const _validateWebcamData = (data) => {
    if (!data || typeof data !== 'object') {
      return { isValid: false, error: 'Invalid data structure' };
    }

    if (!data.captures || !Array.isArray(data.captures)) {
      return { isValid: false, error: 'Missing or invalid captures array' };
    }

    return { isValid: true };
  };

  const categorizeError = (error) => {
    const message = error.message.toLowerCase();

    if (message.includes('network') || message.includes('fetch')) {
      return 'network';
    }
    if (message.includes('timeout')) {
      return 'timeout';
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return 'validation';
    }
    if (message.includes('circuit breaker')) {
      return 'circuit_breaker';
    }
    if (message.includes('rate limit')) {
      return 'rate_limit';
    }

    return 'unknown';
  };

  const isRetryableError = (category) => {
    const retryableCategories = ['network', 'timeout', 'circuit_breaker'];
    return retryableCategories.includes(category);
  };

  // Simplified retry for extreme cases (data reliability service handles most retry logic)
  const handleRetry = useCallback(() => {
    const delay = Math.min(1000 * Math.pow(2, retryCount), 30000); // Max 30s delay
    const timer = setTimeout(loadData, delay);
    return () => clearTimeout(timer);
  }, [loadData, retryCount]);

  // Manual refresh function
  const refresh = useCallback(() => {
    setRetryCount(0);
    loadData();
  }, [loadData]);

  // Initial load and periodic refresh
  useEffect(() => {
    loadData();

    // Set up auto-refresh interval
    const interval = setInterval(loadData, refreshInterval);

    return () => {
      clearInterval(interval);
      isMountedRef.current = false;
    };
  }, [loadData, refreshInterval]);

  // Auto-retry only for extreme cases (reliability service handles most failures)
  useEffect(() => {
    if (error && retryCount < 2 && retryCount > 0 && error.retryable) {
      console.log(`🔄 Hook-level retry ${retryCount}/2 for extreme case:`, error.category);
      const cleanup = handleRetry();
      return cleanup;
    }
  }, [error, retryCount, handleRetry]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Calculate loading state more accurately
  const isInitialLoading = loading && !weatherData && !webcamData;
  const isRefreshing = loading && (weatherData || webcamData);

  // Get data freshness indicators
  const getDataFreshness = useCallback(() => {
    if (!lastFetch) {return null;}

    const now = new Date();
    const diffMinutes = Math.floor((now - lastFetch) / (1000 * 60));

    if (diffMinutes < 1) {return 'just now';}
    if (diffMinutes < 60) {return `${diffMinutes}m ago`;}

    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours}h ago`;
  }, [lastFetch]);

  // Get reliability report for monitoring
  const getReliabilityReport = useCallback(() => {
    return dataReliabilityService.getReliabilityReport();
  }, []);

  return {
    weatherData,
    webcamData,
    loading,
    error,
    retryCount,
    isInitialLoading,
    isRefreshing,
    lastFetch,
    refresh,
    dataFreshness: getDataFreshness(),
    reliabilityMetrics,
    getReliabilityReport,
  };
};

export default useDataLoader;