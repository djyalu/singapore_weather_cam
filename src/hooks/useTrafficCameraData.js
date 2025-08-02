import { useState, useEffect, useCallback } from 'react';
import { fetchTrafficCameras } from '../services/trafficCameraService';

/**
 * Custom hook for managing traffic camera data
 * Provides centralized traffic camera data for system statistics
 */
export const useTrafficCameraData = (refreshInterval = 60000) => {
  const [trafficData, setTrafficData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);

  const fetchData = useCallback(async () => {
    console.log('🔄 Starting traffic camera data fetch...');
    try {
      setError(null);
      setLoading(true);

      const data = await fetchTrafficCameras({
        cacheTTL: 60000, // 1 minute cache
        timeout: 15000,  // 15 second timeout (increased)
      });

      console.log('✅ Traffic cameras data received:', {
        totalCameras: data.totalCameras || data.cameras?.length || 0,
        timestamp: data.timestamp,
        dataKeys: Object.keys(data),
      });

      setTrafficData(data);
      setLastFetch(new Date());
      console.log(`📷 Traffic cameras loaded successfully: ${data.cameras?.length || 0} cameras`);
    } catch (err) {
      console.error('❌ Traffic camera data fetch failed:', {
        error: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString(),
      });
      setError(err);

      // Set fallback data to prevent 0 cameras display
      setTrafficData({
        totalCameras: 90,
        cameras: [],
        timestamp: new Date().toISOString(),
        metadata: {
          source: 'Fallback (API Error)',
          error: err.message,
        },
      });
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Set up refresh interval
  useEffect(() => {
    if (!refreshInterval) {return;}

    const interval = setInterval(fetchData, refreshInterval);
    return () => clearInterval(interval);
  }, [fetchData, refreshInterval]);

  return {
    trafficData,
    loading,
    error,
    lastFetch,
    refresh: fetchData,
  };
};

export default useTrafficCameraData;