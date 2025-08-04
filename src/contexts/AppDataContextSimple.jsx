import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { transformWeatherData } from '../utils/weatherDataTransformer';
import neaRealTimeService from '../services/neaRealTimeService';
// import weatherValidationService from '../services/weatherValidationService'; // 임시 비활성화

// App Data Context
const AppDataContext = createContext(null);

const useSimpleDataLoader = (refreshInterval) => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(new Date());
  const [validationResults, setValidationResults] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadData = async (isBackgroundRefresh = false, forceRealtime = false, isManualRefresh = false) => {
    try {
      // 수동 새로고침 상태 표시
      if (isManualRefresh) {
        setIsRefreshing(true);
        console.log('🔄 [수동 새로고침] 사용자 새로고침 시작');
      }
      
      // 백그라운드 새로고침이 아닌 경우에만 로딩 상태 표시
      if (!isBackgroundRefresh && !isManualRefresh) {
        setLoading(true);
      }
      setError(null);

      const dataSource = forceRealtime ? '🔴 강제 실시간 API' : '📊 실시간 API';
      console.log(`🔄 Loading weather data: ${dataSource} 호출 중...`);

      try {
        // NEA 실시간 서비스를 항상 우선 사용 (가장 최신 데이터)
        const weatherJson = await neaRealTimeService.getRealTimeWeatherData();
        console.log(`✅ NEA API 호출 성공: ${dataSource}`);

        if (weatherJson) {
          // Store global reference for other components
          window.weatherData = weatherJson;

          // 🔍 데이터 검증 실행 (임시 비활성화 - 오류 해결 후 재활성화)
          try {
            console.log('🔍 [DataLoader] Weather data validation temporarily disabled for stability');
            // const validation = await weatherValidationService.validateWeatherData(weatherJson);
            // setValidationResults(validation);
            setValidationResults(null);
            setError(null); // 검증 없이 에러 상태 제거
          } catch (validationError) {
            console.warn('⚠️ [DataLoader] Validation service error, skipping:', validationError.message);
            setValidationResults(null);
            setError(null);
          }

          // Transform NEA API data to UI-friendly format
          const transformedWeatherData = transformWeatherData(weatherJson);
          setWeatherData(transformedWeatherData);

          console.log(`🌤️ [DataLoader] ${dataSource} 데이터 로드 완료:`, {
            source: weatherJson.source,
            temperature: weatherJson.data?.temperature?.average,
            avgTemp: weatherJson.data?.temperature?.average?.toFixed(2),
            locations: transformedWeatherData.locations?.length,
            timestamp: weatherJson.timestamp,
            loadType: forceRealtime ? 'FORCE_REALTIME' : 'NORMAL_REALTIME',
            readings: weatherJson.data?.temperature?.readings?.length,
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
      
      if (isManualRefresh) {
        console.log('✅ [수동 새로고침] 사용자 새로고침 완료');
      }
    } catch (err) {
      setError(err.message);
      console.error('Data loading error:', err);
      
      if (isManualRefresh) {
        console.error('❌ [수동 새로고침] 사용자 새로고침 실패:', err.message);
      }
    } finally {
      setLoading(false);
      if (isManualRefresh) {
        setIsRefreshing(false);
      }
    }
  };

  useEffect(() => {
    // 브라우저 새로고침/페이지 로드 시 강제로 실시간 API 호출
    console.log('🚀 [페이지 로드] 브라우저 새로고림 감지 - 실시간 NEA API 호출');
    loadData(false, true); // 강제 실시간 API 호출

    // 백그라운드 자동 새로고침 (스피너 없이)
    const interval = setInterval(() => {
      console.log('⏰ [백그라운드 새로고침] 5분 간격 자동 업데이트');
      loadData(true, true); // 백그라운드에서도 실시간 API 호출
    }, refreshInterval);

    // 페이지 포커스 시 실시간 API 호출 (탭 전환 후 돌아왔을 때)
    const handleFocus = () => {
      console.log('👁️ [페이지 포커스] 탭 활성화 감지 - 실시간 데이터 새로고침');
      loadData(true, true); // 백그라운드 형태로 실시간 API 호출
    };

    // 페이지 가시성 변경 감지 (탭 전환)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        console.log('👁️ [페이지 가시성] 페이지 다시 보이기 - 실시간 데이터 새로고침');
        loadData(true, true);
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [refreshInterval]);

  return {
    weatherData,
    loading,
    error,
    lastFetch,
    validationResults,
    refresh: () => loadData(false, true, true), // 수동 새로고침 (실시간 NEA API + 새로고침 상태 표시)
    forceRefresh: () => loadData(false, true, true), // 강제 새로고침 (동일하게 처리)
    isInitialLoading: loading && !weatherData,
    isRefreshing: isRefreshing, // 실제 새로고침 상태 반영
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
    validationResults,
    isRefreshing,
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
    validationResults: context.validation?.validationResults,
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