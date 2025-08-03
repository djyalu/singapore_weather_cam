import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { transformWeatherData } from '../utils/weatherDataTransformer';
import neaRealTimeService from '../services/neaRealTimeService';
import weatherValidationService from '../services/weatherValidationService';

// App Data Context
const AppDataContext = createContext(null);

const useSimpleDataLoader = (refreshInterval) => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(new Date());
  const [validationResults, setValidationResults] = useState(null);

  const loadData = async (isBackgroundRefresh = false, forceRealtime = false) => {
    try {
      // 백그라운드 새로고침이 아닌 경우에만 로딩 상태 표시
      if (!isBackgroundRefresh) {
        setLoading(true);
      }
      setError(null);

      console.log('🔄 Loading weather data: Using NEA Real-Time Service...');

      try {
        // Use NEA Real-Time Service as primary data source
        const weatherJson = await neaRealTimeService.getRealTimeWeatherData();

        if (weatherJson) {
          // Store global reference for other components
          window.weatherData = weatherJson;

          // 🔍 데이터 검증 실행
          console.log('🔍 [DataLoader] Starting weather data validation...');
          const validation = await weatherValidationService.validateWeatherData(weatherJson);
          setValidationResults(validation);

          // 검증 결과 로깅
          console.log('📊 [DataLoader] Validation results:', {
            overall: validation.overall,
            score: validation.score,
            checksCount: validation.checks.length,
            alertsCount: validation.alerts.length
          });

          // 검증 결과에 따른 처리
          if (validation.overall === 'error') {
            console.warn('⚠️ [DataLoader] Severe data quality issues detected');
            setError(`데이터 품질 문제 (${validation.score}점): ${validation.alerts[0]?.message || '데이터 검증 실패'}`);
          } else if (validation.overall === 'warning') {
            console.warn('⚠️ [DataLoader] Data quality warnings detected');
            setError(`데이터 주의사항 (${validation.score}점): 일부 관측소 데이터에 이상이 있습니다`);
          } else {
            setError(null); // 검증 통과 시 에러 제거
          }

          // Transform NEA API data to UI-friendly format
          const transformedWeatherData = transformWeatherData(weatherJson);
          setWeatherData(transformedWeatherData);

          console.log('🌤️ [DataLoader] NEA Real-Time data loaded and validated:', {
            source: weatherJson.source,
            temperature: weatherJson.data?.temperature?.average,
            avgTemp: weatherJson.data?.temperature?.average?.toFixed(2),
            locations: transformedWeatherData.locations?.length,
            timestamp: transformedWeatherData.timestamp,
            stations: weatherJson.stations_used?.length,
            validationScore: validation.score,
            validationStatus: validation.overall,
          });

          // Store success in local storage for persistence
          localStorage.setItem('lastSuccessfulWeatherFetch', Date.now().toString());
        }
      } catch (neaError) {
        console.warn('⚠️ NEA Real-Time Service failed, attempting fallback:', neaError.message);

        // Fallback to static data only if real-time fails
        try {
          const basePath = import.meta.env.BASE_URL || '/';
          const timestamp = new Date().getTime();
          const weatherResponse = await fetch(`${basePath}data/weather/latest.json?t=${timestamp}`);
          
          if (weatherResponse.ok) {
            const weatherJson = await weatherResponse.json();
            const transformedWeatherData = transformWeatherData(weatherJson);
            setWeatherData(transformedWeatherData);
            console.log('📁 Fallback to local data successful');
            setError('실시간 데이터 일시 불가 - 최근 데이터 사용 중');
          } else {
            throw new Error(`Local data fetch failed: ${weatherResponse.status}`);
          }
        } catch (fallbackError) {
          console.error('❌ Both real-time API and local data failed:', fallbackError.message);
          setError('날씨 데이터를 불러올 수 없습니다. 네트워크를 확인해주세요.');
        }
      }

      setLastFetch(new Date());
    } catch (err) {
      setError(err.message);
      console.error('Data loading error:', err);
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
    validationResults,
    refresh: () => loadData(false, false), // 수동 새로고침 (캐시된 데이터)
    forceRefresh: () => loadData(false, true), // 강제 새로고침 (실시간 API)
    isInitialLoading: loading && !weatherData,
    isRefreshing: false, // 백그라운드 새로고침은 숨김
  };
};

export const AppDataProvider = React.memo(({ children, refreshInterval = 5 * 60 * 1000 }) => {
  const {
    weatherData,
    loading,
    error,
    lastFetch,
    validationResults,
    refresh,
    forceRefresh,
    isInitialLoading,
    isRefreshing,
  } = useSimpleDataLoader(refreshInterval);

  // Simple system stats with traffic cameras
  const systemStats = useMemo(() => ({
    weatherStations: weatherData?.locations?.length || 0,
    totalWebcams: 90, // Singapore traffic cameras from data.gov.sg API
    totalCameras: 90, // Maintain compatibility
    lastUpdate: lastFetch instanceof Date ? lastFetch.toLocaleString('ko-KR') : lastFetch,
    status: error ? 'error' : 'healthy',
    dataSource: 'Singapore Traffic Cameras (실시간)',
    // Include data for SystemStatus component
    weatherData,
  }), [weatherData, lastFetch, error]);

  const contextValue = useMemo(() => ({
    // Data state
    data: {
      weather: weatherData,
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
      dataFreshness: { weather: 'unknown' },
      reliabilityMetrics: {},
      getReliabilityReport: () => ({}),
    },

    // Actions
    actions: {
      refresh,
      forceRefresh,
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

    // Validation results
    validation: {
      validationResults,
    },
  }), [
    weatherData,
    systemStats,
    isInitialLoading,
    isRefreshing,
    loading,
    error,
    lastFetch,
    refresh,
    forceRefresh,
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
    forceRefresh: context.actions.forceRefresh,
    dataFreshness: context.freshness.dataFreshness,
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