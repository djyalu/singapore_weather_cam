import React, { createContext, useContext, useMemo } from 'react';

/**
 * SAFE VERSION - App Data Context with error boundaries and fallbacks
 * Temporary fix for "TypeError: C is not a function" production error
 */
const AppDataContext = createContext(null);

// Safe hook imports with fallbacks
const useSafeDataLoader = (refreshInterval) => {
  try {
    const { useDataLoader } = require('../hooks/useDataLoader');
    return useDataLoader(refreshInterval);
  } catch (error) {
    console.warn('useDataLoader failed, using fallback:', error);
    return {
      weatherData: null,
      webcamData: null,
      loading: false,
      error: null,
      retryCount: 0,
      isInitialLoading: false,
      isRefreshing: false,
      lastFetch: new Date(),
      refresh: () => {},
      forceRefresh: () => {},
      dataFreshness: { weather: 'unknown', webcam: 'unknown' },
      reliabilityMetrics: {},
      getReliabilityReport: () => ({}),
    };
  }
};

export const AppDataProvider = React.memo(({ children, refreshInterval = 5 * 60 * 1000 }) => {
  const dataLoader = useSafeDataLoader(refreshInterval);

  const {
    weatherData,
    webcamData,
    loading,
    error,
    retryCount,
    isInitialLoading,
    isRefreshing,
    lastFetch,
    refresh,
    forceRefresh,
    dataFreshness,
    reliabilityMetrics,
    getReliabilityReport,
  } = dataLoader;

  // Safe system stats with fallback
  const systemStats = useMemo(() => ({
    totalCameras: webcamData?.cameras?.length || 0,
    activeCameras: webcamData?.cameras?.filter(c => c.image).length || 0,
    weatherStations: weatherData?.stations?.length || 0,
    lastUpdate: lastFetch,
    status: error ? 'error' : 'healthy',
  }), [webcamData, weatherData, lastFetch, error]);

  // Safe service worker fallback
  const serviceWorker = {
    isOnline: navigator?.onLine ?? true,
    isUpdateAvailable: false,
    canInstall: false,
    installPWA: () => {},
    updateServiceWorker: () => {},
    requestNotificationPermission: () => Promise.resolve('default'),
  };

  // Safe metrics fallback
  const metrics = {
    trackPageView: (page, metadata) => console.debug('Page view:', page, metadata),
    trackUserInteraction: (type, element, metadata) => console.debug('User interaction:', type, element, metadata),
  };

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
      retryCount,
    },

    // Data freshness and quality
    freshness: {
      lastFetch,
      dataFreshness,
      reliabilityMetrics,
      getReliabilityReport,
    },

    // Actions
    actions: {
      refresh,
      forceRefresh,
      trackPageView: metrics.trackPageView,
      trackUserInteraction: metrics.trackUserInteraction,
    },

    // PWA functionality
    pwa: serviceWorker,

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
    retryCount,
    lastFetch,
    dataFreshness,
    reliabilityMetrics,
    getReliabilityReport,
    refresh,
    forceRefresh,
    metrics.trackPageView,
    metrics.trackUserInteraction,
    serviceWorker,
  ]);

  return (
    <AppDataContext.Provider value={contextValue}>
      {children}
    </AppDataContext.Provider>
  );
});

AppDataProvider.displayName = 'AppDataProviderSafe';

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