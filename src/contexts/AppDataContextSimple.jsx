import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { transformWeatherData } from '../utils/weatherDataTransformer';

// App Data Context
const AppDataContext = createContext(null);

const useSimpleDataLoader = (refreshInterval) => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(new Date());

  const loadData = async (isBackgroundRefresh = false, forceRealtime = false) => {
    try {
      // 백그라운드 새로고침이 아닌 경우에만 로딩 상태 표시
      if (!isBackgroundRefresh) {
        setLoading(true);
      }
      setError(null);

      const basePath = import.meta.env.BASE_URL || '/';
      const timestamp = new Date().getTime();

      // Load weather data - 항상 실시간 NEA API 우선 호출
      try {
        let weatherJson = null;
        
        console.log('🔄 Loading weather data: Attempting real-time NEA API call...');
        
        // 1순위: NEA Singapore API 직접 호출 (항상 시도)
        try {
          const neaApiUrl = 'https://api.data.gov.sg/v1/environment/air-temperature';
          const neaResponse = await fetch(neaApiUrl, {
            headers: {
              'Accept': 'application/json',
              'User-Agent': 'Singapore-Weather-Cam/1.0'
            },
            timeout: 10000
          });
          
          if (neaResponse.ok) {
            const neaData = await neaResponse.json();
            console.log('✅ Real-time NEA data fetched successfully');
            
            // NEA API 응답을 우리 형식으로 변환
            const temperatureReadings = neaData.items?.[0]?.readings?.map(reading => ({
              station: reading.station_id,
              value: reading.value
            })) || [];
            
            console.log('📊 Real-time NEA API response details:', {
              totalItems: neaData.items?.length,
              latestItemTimestamp: neaData.items?.[0]?.timestamp,
              totalStations: temperatureReadings.length,
              sampleStations: temperatureReadings.slice(0, 3),
              allStationIds: temperatureReadings.map(r => r.station),
              avgTemperature: temperatureReadings.reduce((sum, r) => sum + r.value, 0) / temperatureReadings.length
            });
            
            // 실시간 NEA API 데이터를 완전한 형식으로 변환
            weatherJson = {
              timestamp: new Date().toISOString(),
              source: "NEA Singapore (Real-time)",
              collection_time_ms: Date.now() - timestamp,
              api_calls: 1,
              successful_calls: 1,
              failed_calls: 0,
              data: {
                temperature: {
                  readings: temperatureReadings
                },
                humidity: { readings: [] },
                rainfall: { readings: [] },
                wind: { readings: [] }
              },
              // 변환 함수가 필요로 하는 메타데이터 추가
              stations_used: temperatureReadings.map(r => r.station),
              station_details: temperatureReadings.reduce((acc, reading) => {
                acc[reading.station] = {
                  id: reading.station,
                  temperature: reading.value,
                  status: 'active',
                  data_available: ['temperature']
                };
                return acc;
              }, {}),
              geographic_coverage: {
                total_stations: temperatureReadings.length,
                coverage_percentage: Math.min(100, (temperatureReadings.length / 59) * 100),
                regions_covered: ['singapore'] // 전체 싱가포르
              }
            };
          } else {
            throw new Error(`NEA API responded with ${neaResponse.status}`);
          }
        } catch (neaError) {
          console.warn('⚠️ Real-time NEA API failed, falling back to local data:', neaError.message);
          
          // 2순위: 로컬 파일 폴백 (실시간 API 실패 시에만)
          try {
            const weatherResponse = await fetch(`${basePath}data/weather/latest.json?t=${timestamp}`);
            if (weatherResponse.ok) {
              weatherJson = await weatherResponse.json();
              console.log('📁 Fallback to local data successful');
            } else {
              throw new Error(`Local data fetch failed: ${weatherResponse.status}`);
            }
          } catch (localError) {
            console.error('❌ Both real-time API and local data failed:', localError.message);
            throw new Error('All data sources failed');
          }
        }
        
        if (weatherJson) {
          // Transform NEA API data to UI-friendly format
          const transformedWeatherData = transformWeatherData(weatherJson);
          setWeatherData(transformedWeatherData);
          
          // 개발 모드에서만 로깅
          if (import.meta.env.MODE === 'development') {
            console.log('🌤️ Weather data loaded and transformed:', {
              source: weatherJson.source,
              temperature: transformedWeatherData.current?.temperature,
              locations: transformedWeatherData.locations?.length,
              timestamp: transformedWeatherData.timestamp,
              isRealtime: forceRealtime
            });
          }
        }
      } catch (err) {
        // 실시간 API 실패 시 로컬 파일로 폴백
        if (forceRealtime) {
          console.log('🔄 Real-time API failed, falling back to cached data...');
          try {
            const fallbackResponse = await fetch(`${basePath}data/weather/latest.json?t=${timestamp}`);
            if (fallbackResponse.ok) {
              const fallbackJson = await fallbackResponse.json();
              const transformedWeatherData = transformWeatherData(fallbackJson);
              setWeatherData(transformedWeatherData);
              setError('실시간 데이터 가져오기 실패 - 캐시된 데이터 사용 중');
            }
          } catch (fallbackErr) {
            console.warn('Fallback data load also failed:', fallbackErr);
            setError('날씨 데이터를 불러올 수 없습니다');
          }
        } else {
          // Only log in development mode
          if (import.meta.env.MODE === 'development') {
            console.warn('Weather data load failed:', err);
          }
          setError('날씨 데이터 로딩 실패');
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
    refresh: () => loadData(false, false), // 수동 새로고침 (캐시된 데이터)
    forceRefresh: () => loadData(false, true), // 강제 새로고침 (실시간 API)
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
    forceRefresh,
    isInitialLoading,
    isRefreshing
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
    weatherData
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