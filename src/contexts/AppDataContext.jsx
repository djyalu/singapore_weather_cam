import React, { createContext, useContext, useMemo } from 'react';
import { useDataLoader } from '../hooks/useDataLoader';
import { useSystemStats } from '../hooks/useSystemStats';
import { useTrafficCameraData } from '../hooks/useTrafficCameraData';
import { useServiceWorker } from '../hooks/useServiceWorker';
import { useMetrics } from '../services/metricsService';
import { useComponentPerformance } from '../hooks/useComponentPerformance';

/**
 * App Data Context - Centralized data management and state sharing
 * Eliminates prop drilling and provides unified data access across components
 */
const AppDataContext = createContext(null);

/**
 * Performance-optimized context provider for app-wide data
 * Implements intelligent memoization and selective re-renders
 */
export const AppDataProvider = React.memo(({ children, refreshInterval = 5 * 60 * 1000 }) => {
  // Core data loading with reliability metrics and safety checks
  let dataLoader;
  try {
    dataLoader = useDataLoader(refreshInterval);
  } catch (error) {
    console.error('useDataLoader failed:', error);
    // Provide fallback data structure
    dataLoader = {
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

  // Traffic camera data for system statistics
  const { trafficData, loading: trafficLoading, error: trafficError } = useTrafficCameraData(60000);

  // System statistics calculation (now includes traffic camera data)
  const systemStats = useSystemStats(webcamData, trafficData);

  // PWA service worker functionality
  const serviceWorker = useServiceWorker();
  const {
    isOnline,
    isUpdateAvailable,
    canInstall,
    installPWA,
    updateServiceWorker,
    requestNotificationPermission,
  } = serviceWorker;

  // Metrics and analytics tracking with safe fallback
  let metricsHook;
  try {
    metricsHook = useMetrics();
  } catch (error) {
    console.warn('useMetrics failed:', error);
    metricsHook = {
      trackPageView: () => {},
      trackUserInteraction: () => {},
    };
  }
  const { trackPageView, trackUserInteraction } = metricsHook;

  // Performance monitoring for data context with safe fallback
  let contextPerformance;
  try {
    contextPerformance = useComponentPerformance('AppDataContext', {
      weatherDataAvailable: !!weatherData,
      webcamDataAvailable: !!webcamData,
      isLoading: isInitialLoading,
      systemStatsCount: systemStats?.totalCameras || systemStats?.totalWebcams || 0,
    }, {
      trackRenders: true,
      trackProps: true,
      trackMemory: false, // Reduce overhead for context
      threshold: 10, // Fast updates expected for context
    });
  } catch (error) {
    console.warn('useComponentPerformance failed:', error);
    contextPerformance = { renderCount: 0, averageRenderTime: 0 };
  }

  // Memoized context value to prevent unnecessary re-renders
  // Split into logical groups for selective consumption
  const contextValue = useMemo(() => ({
    // Data state
    data: {
      weather: weatherData,
      webcam: webcamData,
      trafficCameras: trafficData,
      systemStats,
    },

    // Loading states
    loading: {
      isInitialLoading,
      isRefreshing,
      loading,
      trafficLoading,
    },

    // Error handling
    error: {
      error,
      retryCount,
      trafficError,
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
      trackPageView,
      trackUserInteraction,
    },

    // PWA functionality
    pwa: {
      isOnline,
      isUpdateAvailable,
      canInstall,
      installPWA,
      updateServiceWorker,
      requestNotificationPermission,
    },

    // Performance metadata
    performance: {
      contextPerformance,
    },
  }), [
    weatherData,
    webcamData,
    trafficData,
    systemStats,
    isInitialLoading,
    isRefreshing,
    loading,
    trafficLoading,
    error,
    retryCount,
    trafficError,
    lastFetch,
    dataFreshness,
    reliabilityMetrics,
    getReliabilityReport,
    refresh,
    forceRefresh,
    trackPageView,
    trackUserInteraction,
    isOnline,
    isUpdateAvailable,
    canInstall,
    installPWA,
    updateServiceWorker,
    requestNotificationPermission,
    contextPerformance,
  ]);

  return (
    <AppDataContext.Provider value={contextValue}>
      {children}
    </AppDataContext.Provider>
  );
});

AppDataProvider.displayName = 'AppDataProvider';

/**
 * Optimized context consumption hook with selective access
 * Allows components to subscribe to only needed data slices
 */
export const useAppData = (selector) => {
  const context = useContext(AppDataContext);

  if (!context) {
    throw new Error('useAppData must be used within AppDataProvider');
  }

  // If no selector provided, return full context
  if (!selector) {
    return context;
  }

  // Apply selector for performance optimization
  return useMemo(() => selector(context), [context, selector]);
};

/**
 * Specialized hooks for common data access patterns
 * Reduces component complexity and improves performance
 */

// Weather data hook
export const useWeatherData = () => {
  return useAppData(context => ({
    weatherData: context.data.weather,
    isLoading: context.loading.isInitialLoading,
    error: context.error.error,
    refresh: context.actions.refresh,
    dataFreshness: context.freshness.dataFreshness,
  }));
};

// Webcam data hook
export const useWebcamData = () => {
  return useAppData(context => ({
    webcamData: context.data.webcam,
    isLoading: context.loading.isInitialLoading,
    error: context.error.error,
    refresh: context.actions.refresh,
  }));
};

// Traffic camera data hook
export const useTrafficCameraDataContext = () => {
  return useAppData(context => ({
    trafficData: context.data.trafficCameras,
    isLoading: context.loading.trafficLoading,
    error: context.error.trafficError,
  }));
};

// System status hook
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

// PWA status hook
export const usePWAStatus = () => {
  return useAppData(context => context.pwa);
};

// Metrics hook
export const useAppMetrics = () => {
  return useAppData(context => ({
    trackPageView: context.actions.trackPageView,
    trackUserInteraction: context.actions.trackUserInteraction,
    performance: context.performance.contextPerformance,
  }));
};

export default AppDataProvider;