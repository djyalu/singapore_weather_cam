/**
 * Mobile-Specific Data Loading Hook for Singapore Weather Cam
 * Addresses mobile caching, connectivity, and performance issues
 * Optimized for iOS Safari, Android Chrome mobile browsers
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import neaRealTimeService from '../services/neaRealTimeService';
import { transformWeatherData } from '../utils/weatherDataTransformer';

export const useMobileDataLoader = (refreshInterval = 30 * 60 * 1000) => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [mobileMetrics, setMobileMetrics] = useState({
    networkType: null,
    connectionEffective: null,
    cacheClears: 0,
    forcedRefreshes: 0,
    lastDataUpdateTime: null,
  });

  // Mobile-specific refs
  const isMountedRef = useRef(true);
  const lastForceRefreshRef = useRef(0);
  const mobileIntervalRef = useRef(null);
  const networkInfoRef = useRef(null);

  // Mobile network detection
  const detectMobileNetwork = useCallback(() => {
    if ('connection' in navigator) {
      const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      return {
        effectiveType: conn?.effectiveType || 'unknown',
        saveData: conn?.saveData || false,
        rtt: conn?.rtt || 0,
        downlink: conn?.downlink || 0,
      };
    }
    return { effectiveType: 'unknown', saveData: false, rtt: 0, downlink: 0 };
  }, []);

  // Aggressive mobile cache clearing
  const clearMobileCaches = useCallback(async () => {
    console.log('🧹 [Mobile] Starting aggressive cache clearing...');
    
    let cachesClearedCount = 0;
    
    try {
      // Clear Service Worker caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        console.log(`📦 [Mobile] Found ${cacheNames.length} caches to clear`);
        
        await Promise.all(
          cacheNames.map(async (cacheName) => {
            try {
              await caches.delete(cacheName);
              cachesClearedCount++;
              console.log(`✅ [Mobile] Cleared cache: ${cacheName}`);
            } catch (cacheError) {
              console.warn(`⚠️ [Mobile] Failed to clear cache ${cacheName}:`, cacheError);
            }
          })
        );
      }

      // Clear browser storage
      try {
        // Clear localStorage specific to weather data
        Object.keys(localStorage).forEach(key => {
          if (key.includes('weather') || key.includes('data') || key.includes('cache')) {
            localStorage.removeItem(key);
            console.log(`🗑️ [Mobile] Cleared localStorage: ${key}`);
          }
        });

        // Clear sessionStorage
        sessionStorage.clear();
        console.log('🗑️ [Mobile] Cleared sessionStorage');
      } catch (storageError) {
        console.warn('⚠️ [Mobile] Storage clear failed:', storageError);
      }

      // Update mobile metrics
      setMobileMetrics(prev => ({
        ...prev,
        cacheClears: prev.cacheClears + 1,
        lastDataUpdateTime: new Date().toISOString(),
      }));

      console.log(`✅ [Mobile] Cache clearing completed: ${cachesClearedCount} caches cleared`);
      return { success: true, cachesClearedCount };
    } catch (error) {
      console.error('❌ [Mobile] Cache clearing failed:', error);
      return { success: false, error: error.message };
    }
  }, []);

  // Mobile-optimized data loading with aggressive cache busting
  const loadMobileData = useCallback(async (options = {}) => {
    const {
      forceRefresh = false,
      clearCache = false,
      showLoading = true,
      isManualRefresh = false
    } = options;

    if (!isMountedRef.current) return;

    try {
      if (isManualRefresh) {
        setIsRefreshing(true);
        console.log('📱 [Mobile] Manual refresh initiated');
      }

      if (showLoading && !isManualRefresh) {
        setLoading(true);
      }
      setError(null);

      // Clear caches if requested or on force refresh
      if (clearCache || forceRefresh) {
        await clearMobileCaches();
      }

      // Detect mobile network conditions
      const networkInfo = detectMobileNetwork();
      networkInfoRef.current = networkInfo;
      
      console.log('📱 [Mobile] Network conditions:', {
        effectiveType: networkInfo.effectiveType,
        saveData: networkInfo.saveData,
        rtt: networkInfo.rtt,
        downlink: networkInfo.downlink
      });

      const startTime = Date.now();

      // Mobile-specific timeout based on network conditions
      const timeoutDuration = networkInfo.effectiveType === 'slow-2g' || networkInfo.effectiveType === '2g' 
        ? 15000 // 15s for slow connections
        : networkInfo.effectiveType === '3g' 
        ? 10000 // 10s for 3G
        : 8000; // 8s for 4G/fast connections

      // Load data with timeout handling
      const loadPromise = neaRealTimeService.getRealTimeWeatherData();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Mobile network timeout')), timeoutDuration)
      );

      const weatherJson = await Promise.race([loadPromise, timeoutPromise]);

      if (!isMountedRef.current) return;

      if (weatherJson) {
        // Store global reference with mobile timestamp
        window.weatherData = {
          ...weatherJson,
          mobileLoadTime: Date.now() - startTime,
          mobileNetworkInfo: networkInfo,
          mobileTimestamp: new Date().toISOString(),
        };

        // Transform data
        const transformedWeatherData = transformWeatherData(weatherJson);
        setWeatherData(transformedWeatherData);
        setLastFetch(new Date());

        // Update mobile metrics
        setMobileMetrics(prev => ({
          ...prev,
          networkType: networkInfo.effectiveType,
          connectionEffective: networkInfo.downlink,
          forcedRefreshes: forceRefresh ? prev.forcedRefreshes + 1 : prev.forcedRefreshes,
          lastDataUpdateTime: new Date().toISOString(),
        }));

        // Store mobile success indicator
        localStorage.setItem('mobileLastSuccessfulFetch', Date.now().toString());
        localStorage.setItem('mobileWeatherDataTimestamp', new Date().toISOString());

        console.log('✅ [Mobile] Data loaded successfully:', {
          loadTime: Date.now() - startTime + 'ms',
          networkType: networkInfo.effectiveType,
          temperature: weatherJson.data?.temperature?.average?.toFixed(2),
          stations: weatherJson.stations_used?.length,
          forced: forceRefresh
        });

      } else {
        throw new Error('No weather data received from mobile API call');
      }

    } catch (err) {
      console.error('❌ [Mobile] Data loading failed:', err.message);
      
      if (isMountedRef.current) {
        setError(`Mobile loading failed: ${err.message}`);
        
        // Try to load cached data on mobile error
        try {
          const cachedTimestamp = localStorage.getItem('mobileWeatherDataTimestamp');
          if (cachedTimestamp) {
            const cacheAge = Date.now() - new Date(cachedTimestamp).getTime();
            const cacheAgeMinutes = Math.floor(cacheAge / (1000 * 60));
            
            if (cacheAgeMinutes < 60) { // Use cache if less than 1 hour old
              console.log(`📱 [Mobile] Using cached data (${cacheAgeMinutes}m old)`);
              setError(`Using cached data (${cacheAgeMinutes}m old) - Network issue detected`);
            }
          }
        } catch (cacheError) {
          console.warn('⚠️ [Mobile] Cache fallback failed:', cacheError);
        }
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
        if (isManualRefresh) {
          setIsRefreshing(false);
        }
      }
    }
  }, [clearMobileCaches, detectMobileNetwork]);

  // Mobile-specific force refresh with rate limiting
  const mobileForceRefresh = useCallback(async () => {
    const now = Date.now();
    const timeSinceLastForce = now - lastForceRefreshRef.current;
    
    // Rate limit to prevent mobile battery drain (minimum 30s between force refreshes)
    if (timeSinceLastForce < 30000) {
      console.log('⏳ [Mobile] Force refresh rate limited, using regular refresh');
      return await loadMobileData({ isManualRefresh: true });
    }

    lastForceRefreshRef.current = now;
    console.log('🔄 [Mobile] Force refresh with cache clearing...');
    
    return await loadMobileData({
      forceRefresh: true,
      clearCache: true,
      isManualRefresh: true
    });
  }, [loadMobileData]);

  // Mobile lifecycle event handlers
  useEffect(() => {
    // Initial load
    loadMobileData({ showLoading: true });

    // Mobile-specific event handlers
    const handleMobileRefresh = () => {
      console.log('📱 [Mobile] Page focus/visibility change detected');
      loadMobileData({ showLoading: false });
    };

    const handleMobileNetworkChange = () => {
      console.log('📱 [Mobile] Network change detected');
      setTimeout(() => loadMobileData({ showLoading: false }), 1000);
    };

    const handleMobileOnline = () => {
      console.log('📱 [Mobile] Device came online');
      loadMobileData({ clearCache: true, showLoading: false });
    };

    // Set up mobile interval with network-aware timing
    const setMobileInterval = () => {
      if (mobileIntervalRef.current) {
        clearInterval(mobileIntervalRef.current);
      }

      const networkInfo = detectMobileNetwork();
      // Adjust refresh interval based on network conditions
      const adjustedInterval = networkInfo.saveData 
        ? refreshInterval * 2 // Double interval for data saver mode
        : networkInfo.effectiveType === '2g' || networkInfo.effectiveType === 'slow-2g'
        ? refreshInterval * 1.5 // Slower refresh for slow connections
        : refreshInterval;

      console.log(`📱 [Mobile] Setting refresh interval: ${adjustedInterval/1000/60}min (network: ${networkInfo.effectiveType})`);

      mobileIntervalRef.current = setInterval(() => {
        console.log('⏰ [Mobile] Background refresh');
        loadMobileData({ showLoading: false });
      }, adjustedInterval);
    };

    setMobileInterval();

    // Event listeners
    window.addEventListener('focus', handleMobileRefresh);
    window.addEventListener('online', handleMobileOnline);
    document.addEventListener('visibilitychange', handleMobileRefresh);
    
    // Mobile-specific network change detection
    if ('connection' in navigator) {
      navigator.connection.addEventListener('change', handleMobileNetworkChange);
    }

    return () => {
      isMountedRef.current = false;
      if (mobileIntervalRef.current) {
        clearInterval(mobileIntervalRef.current);
      }
      window.removeEventListener('focus', handleMobileRefresh);
      window.removeEventListener('online', handleMobileOnline);
      document.addEventListener('visibilitychange', handleMobileRefresh);
      
      if ('connection' in navigator && navigator.connection) {
        navigator.connection.removeEventListener('change', handleMobileNetworkChange);
      }
    };
  }, [refreshInterval, loadMobileData, detectMobileNetwork]);

  // Mobile data freshness calculation
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
    loading,
    error,
    isRefreshing,
    lastFetch,
    dataFreshness: getDataFreshness(),
    mobileMetrics,
    actions: {
      refresh: () => loadMobileData({ isManualRefresh: true }),
      forceRefresh: mobileForceRefresh,
      clearCaches: clearMobileCaches,
    },
    mobile: {
      networkInfo: networkInfoRef.current,
      isSlowConnection: networkInfoRef.current?.effectiveType === '2g' || networkInfoRef.current?.effectiveType === 'slow-2g',
      dataSaverMode: networkInfoRef.current?.saveData || false,
    }
  };
};

export default useMobileDataLoader;