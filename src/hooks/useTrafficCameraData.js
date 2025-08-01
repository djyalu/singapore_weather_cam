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
    try {
      setError(null);
      const data = await fetchTrafficCameras({
        cacheTTL: 60000, // 1 minute cache
        timeout: 10000,  // 10 second timeout
      });
      
      setTrafficData(data);
      setLastFetch(new Date());
      console.log(`📷 Traffic cameras loaded: ${data.cameras?.length || 0} cameras`);
    } catch (err) {
      console.error('Traffic camera data fetch failed:', err);
      setError(err);
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
    if (!refreshInterval) return;

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