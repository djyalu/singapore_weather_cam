import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { transformWeatherData } from '../utils/weatherDataTransformer';

// App Data Context
const AppDataContext = createContext(null);

const useSimpleDataLoader = (refreshInterval) => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(new Date());

  const loadData = async (isBackgroundRefresh = false) => {
    try {
      // 백그라운드 새로고침이 아닌 경우에만 로딩 상태 표시
      if (!isBackgroundRefresh) {
        setLoading(true);
      }
      setError(null);

      const basePath = import.meta.env.BASE_URL || '/';
      const timestamp = new Date().getTime();

      // Load weather data
      try {
        const weatherResponse = await fetch(`${basePath}data/weather/latest.json?t=${timestamp}`);
        if (weatherResponse.ok) {
          const weatherJson = await weatherResponse.json();
          // Transform NEA API data to UI-friendly format
          const transformedWeatherData = transformWeatherData(weatherJson);
          setWeatherData(transformedWeatherData);
          
          // 개발 모드에서만 로깅
          if (import.meta.env.MODE === 'development') {
            console.log('🌤️ Weather data loaded and transformed:', {
              temperature: transformedWeatherData.current?.temperature,
              locations: transformedWeatherData.locations?.length,
              timestamp: transformedWeatherData.timestamp
            });
          }
        }
      } catch (err) {
        // Only log in development mode
        if (import.meta.env.MODE === 'development') {
          console.warn('Weather data load failed:', err);
        }
      }


      setLastFetch(new Date());
    } catch (err) {
      setError(err.message);
      // Only log in development mode
      if (import.meta.env.MODE === 'development') {
        console.error('Data loading error:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData(); // 초기 로딩
    
    // 백그라운드 자동 새로고침 (스피너 없이)
    const interval = setInterval(() => {
      loadData(true); // 백그라운드 새로고침 플래그
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [refreshInterval]);

  return {
    weatherData,
    loading,
    error,
    lastFetch,
    refresh: () => loadData(false), // 수동 새로고침은 스피너 표시
    isInitialLoading: loading && !weatherData,
    isRefreshing: false // 백그라운드 새로고침은 숨김
  };
};

export const AppDataProvider = React.memo(({ children, refreshInterval = 5 * 60 * 1000 }) => {
  const {
    weatherData,
    loading,
    error,
    lastFetch,
    refresh,
    isInitialLoading,
    isRefreshing
  } = useSimpleDataLoader(refreshInterval);

  // Simple system stats
  const systemStats = useMemo(() => ({
    weatherStations: weatherData?.locations?.length || 0,
    lastUpdate: lastFetch instanceof Date ? lastFetch.toLocaleString('ko-KR') : lastFetch,
    status: error ? 'error' : 'healthy',
    // Include data for SystemStatus component
    weatherData
  }), [weatherData, lastFetch, error]);

  const contextValue = useMemo(() => ({
    // Data state
    data: {
      weather: weatherData,
      webcam: webcamData,
      systemStats,
    },

    // Loading states
    loading: {
      isInitialLoading,
      isRefreshing,
      loading,
    },

    // Error handling
    error: {
      error,
      retryCount: 0,
    },

    // Data freshness
    freshness: {
      lastFetch,
      dataFreshness: { weather: 'unknown', webcam: 'unknown' },
      reliabilityMetrics: {},
      getReliabilityReport: () => ({}),
    },

    // Actions
    actions: {
      refresh,
      forceRefresh: refresh,
      trackPageView: () => {},
      trackUserInteraction: () => {},
    },

    // PWA functionality
    pwa: {
      isOnline: navigator?.onLine ?? true,
      isUpdateAvailable: false,
      canInstall: false,
      installPWA: () => {},
      updateServiceWorker: () => {},
      requestNotificationPermission: () => Promise.resolve('default'),
    },

    // Performance metadata
    performance: {
      contextPerformance: {},
    },
  }), [
    weatherData,
    webcamData,
    systemStats,
    isInitialLoading,
    isRefreshing,
    loading,
    error,
    lastFetch,
    refresh,
  ]);

  return (
    <AppDataContext.Provider value={contextValue}>
      {children}
    </AppDataContext.Provider>
  );
});

AppDataProvider.displayName = 'AppDataProviderSimple';

export const useAppData = (selector) => {
  const context = useContext(AppDataContext);

  if (!context) {
    throw new Error('useAppData must be used within AppDataProvider');
  }

  if (!selector) {
    return context;
  }

  return useMemo(() => selector(context), [context, selector]);
};

// Specialized hooks
export const useWeatherData = () => {
  return useAppData(context => ({
    weatherData: context.data.weather,
    isLoading: context.loading.isInitialLoading,
    error: context.error.error,
    refresh: context.actions.refresh,
    dataFreshness: context.freshness.dataFreshness,
  }));
};

export const useWebcamData = () => {
  return useAppData(context => ({
    webcamData: context.data.webcam,
    isLoading: context.loading.isInitialLoading,
    error: context.error.error,
    refresh: context.actions.refresh,
  }));
};

export const useSystemStatus = () => {
  return useAppData(context => ({
    systemStats: context.data.systemStats,
    lastFetch: context.freshness.lastFetch,
    reliabilityMetrics: context.freshness.reliabilityMetrics,
    isRefreshing: context.loading.isRefreshing,
    error: context.error.error,
    refresh: context.actions.refresh,
    forceRefresh: context.actions.forceRefresh,
  }));
};

export const usePWAStatus = () => {
  return useAppData(context => context.pwa);
};

export const useAppMetrics = () => {
  return useAppData(context => ({
    trackPageView: context.actions.trackPageView,
    trackUserInteraction: context.actions.trackUserInteraction,
    performance: context.performance.contextPerformance,
  }));
};

export default AppDataProvider;