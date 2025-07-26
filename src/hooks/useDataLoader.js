import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for data loading with retry logic and auto-refresh
 * Extracted from App.jsx to improve reusability and testing
 */
export const useDataLoader = (refreshInterval = 5 * 60 * 1000) => {
  const [weatherData, setWeatherData] = useState(null);
  const [webcamData, setWebcamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastFetch, setLastFetch] = useState(null);

  // Use ref to track if component is mounted
  const isMountedRef = useRef(true);

  // Data loading function with improved error handling
  const loadData = useCallback(async () => {
    if (!isMountedRef.current) return;

    try {
      setLoading(true);
      setError(null);

      const basePath = import.meta.env.BASE_URL || '/';
      const timestamp = new Date().getTime(); // Cache busting

      // Parallel data fetching for better performance
      const [weatherResponse, webcamResponse] = await Promise.all([
        fetch(`${basePath}data/weather/latest.json?t=${timestamp}`, {
          headers: { 
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
        }),
        fetch(`${basePath}data/webcam/latest.json?t=${timestamp}`, {
          headers: { 
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          },
        }),
      ]);

      if (!weatherResponse.ok) {
        throw new Error(`Weather data fetch failed: ${weatherResponse.status} ${weatherResponse.statusText}`);
      }
      if (!webcamResponse.ok) {
        throw new Error(`Webcam data fetch failed: ${webcamResponse.status} ${webcamResponse.statusText}`);
      }

      const [weatherJson, webcamJson] = await Promise.all([
        weatherResponse.json(),
        webcamResponse.json(),
      ]);

      if (!isMountedRef.current) return;

      // Validate data structure
      if (!weatherJson || typeof weatherJson !== 'object') {
        throw new Error('Invalid weather data format');
      }
      if (!webcamJson || typeof webcamJson !== 'object') {
        throw new Error('Invalid webcam data format');
      }

      setWeatherData(weatherJson);
      setWebcamData(webcamJson);
      setRetryCount(0); // Reset retry count on success
      setLastFetch(new Date());

    } catch (err) {
      console.error('Data loading error:', err);
      if (isMountedRef.current) {
        setError(err.message);
        setRetryCount(prev => prev + 1);
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
    }
  }, []);

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
    if (!lastFetch) return null;
    
    const now = new Date();
    const diffMinutes = Math.floor((now - lastFetch) / (1000 * 60));
    
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
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
    dataFreshness: getDataFreshness()
  };
};

export default useDataLoader;