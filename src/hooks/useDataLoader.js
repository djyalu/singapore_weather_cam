import { useState, useEffect, useCallback, useRef } from 'react';
import { apiService } from '../services/apiService.js';
import { securityValidator } from '../services/securityService.js';
import { dataReliabilityService } from '../services/dataReliabilityService.js';

/**
 * Enhanced custom hook for data loading with advanced reliability patterns
 * Features: Circuit breaker, intelligent caching, retry logic, auto-refresh
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

  // Enhanced data loading with circuit breaker and intelligent caching
  const loadData = useCallback(async () => {
    if (!isMountedRef.current) {return;}

    const startTime = Date.now();

    try {
      setLoading(true);
      setError(null);

      const basePath = import.meta.env.BASE_URL || '/';
      const timestamp = new Date().getTime(); // Cache busting

      // Use enhanced API service for parallel fetching with reliability patterns
      const [weatherJson, webcamJson] = await Promise.all([
        apiService.fetch(`${basePath}data/weather/latest.json?t=${timestamp}`, {
          cacheTTL: 2 * 60 * 1000, // 2 minute cache for weather data
          timeout: 10000, // 10 second timeout
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
        }),
        apiService.fetch(`${basePath}data/webcam/latest.json?t=${timestamp}`, {
          cacheTTL: 60 * 1000, // 1 minute cache for webcam data
          timeout: 15000, // 15 second timeout for larger data
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache',
          },
        }),
      ]);

      if (!isMountedRef.current) {return;}

      // Enhanced security validation with comprehensive checks
      const weatherValidation = securityValidator.validateWeatherData(weatherJson);
      if (!weatherValidation.isValid) {
        throw new Error(`Weather data security validation failed: ${weatherValidation.errors.join(', ')}`);
      }

      const webcamValidation = validateWebcamData(webcamJson);
      if (!webcamValidation.isValid) {
        throw new Error(`Webcam data validation failed: ${webcamValidation.error}`);
      }

      // Add metadata for monitoring
      const metadata = {
        loadTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        weatherStations: weatherJson.data?.temperature?.readings?.length || 0,
        webcamCameras: webcamJson.captures?.length || 0,
      };

      // Use sanitized data from security validation
      setWeatherData({ ...weatherValidation.sanitized, metadata });
      setWebcamData({ ...webcamJson, metadata });
      setRetryCount(0); // Reset retry count on success
      setLastFetch(new Date());

      // Log successful data load
      console.log('📊 Data loaded successfully:', metadata);

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

  // Enhanced data validation functions
  const validateWeatherData = (data) => {
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

  const validateWebcamData = (data) => {
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

  // Auto-retry with exponential backoff
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

  // Auto-retry failed requests
  useEffect(() => {
    if (error && retryCount < 3 && retryCount > 0) {
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
  };
};

export default useDataLoader;