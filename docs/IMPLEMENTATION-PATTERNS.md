# 🎯 Singapore Weather Cam - 구현 패턴 및 베스트 프랙티스

## 📋 목차

1. [React 패턴 가이드](#react-패턴-가이드)
2. [상태 관리 패턴](#상태-관리-패턴)
3. [API 통합 패턴](#api-통합-패턴)
4. [에러 처리 패턴](#에러-처리-패턴)
5. [성능 최적화 패턴](#성능-최적화-패턴)
6. [테스팅 패턴](#테스팅-패턴)
7. [접근성 패턴](#접근성-패턴)

---

## ⚛️ React 패턴 가이드

### 1. 컴포넌트 설계 패턴

#### **컴포넌트 분류 및 구조**

```javascript
/**
 * 컴포넌트 분류 체계
 * 
 * 1. Presentational Components (순수 표현 컴포넌트)
 * 2. Container Components (비즈니스 로직 컴포넌트)
 * 3. Higher-Order Components (고차 컴포넌트)
 * 4. Custom Hooks (커스텀 훅)
 */

// ✅ 좋은 예: Presentational Component
const WeatherCard = React.memo(({ 
  location, 
  temperature, 
  humidity, 
  onRefresh,
  isLoading = false 
}) => {
  return (
    <div className="weather-card" role="region" aria-labelledby={`weather-${location.id}`}>
      <h3 id={`weather-${location.id}`}>{location.displayName}</h3>
      <div className="weather-data">
        <span aria-label={`Temperature ${temperature} degrees celsius`}>
          {temperature}°C
        </span>
        <span aria-label={`Humidity ${humidity} percent`}>
          {humidity}%
        </span>
      </div>
      {isLoading ? (
        <div aria-live="polite">Updating...</div>
      ) : (
        <button 
          onClick={onRefresh}
          aria-label={`Refresh weather data for ${location.displayName}`}
        >
          Refresh
        </button>
      )}
    </div>
  );
});

// Props 타입 검증
WeatherCard.propTypes = {
  location: PropTypes.shape({
    id: PropTypes.string.isRequired,
    displayName: PropTypes.string.isRequired
  }).isRequired,
  temperature: PropTypes.number.isRequired,
  humidity: PropTypes.number.isRequired,
  onRefresh: PropTypes.func.isRequired,
  isLoading: PropTypes.bool
};

// ✅ 좋은 예: Container Component
const WeatherCardContainer = ({ locationId }) => {
  const { weatherData, loading, error, refresh } = useWeatherData(locationId);
  const { trackUserInteraction } = useMetrics();
  
  const handleRefresh = useCallback(() => {
    trackUserInteraction('refresh', 'weather-card', { locationId });
    refresh();
  }, [locationId, refresh, trackUserInteraction]);

  if (error) {
    return <ErrorDisplay error={error} onRetry={handleRefresh} />;
  }

  if (!weatherData) {
    return <WeatherCardSkeleton />;
  }

  return (
    <WeatherCard
      location={weatherData.location}
      temperature={weatherData.temperature}
      humidity={weatherData.humidity}
      onRefresh={handleRefresh}
      isLoading={loading}
    />
  );
};
```

#### **커스텀 훅 패턴**

```javascript
/**
 * 커스텀 훅 설계 원칙
 * 
 * 1. Single Responsibility: 하나의 책임만 가짐
 * 2. Composable: 다른 훅과 조합 가능
 * 3. Reusable: 재사용 가능한 로직
 * 4. Testable: 독립적으로 테스트 가능
 */

// ✅ 좋은 예: 특정 기능에 집중된 훅
export const useWeatherData = (locationId, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastFetch, setLastFetch] = useState(null);
  
  const {
    refreshInterval = 5 * 60 * 1000,
    enableAutoRefresh = true,
    retryAttempts = 3
  } = options;

  // 데이터 페칭 로직
  const fetchData = useCallback(async () => {
    if (!locationId) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiService.fetch(`/weather/${locationId}`, {
        cacheTTL: 2 * 60 * 1000 // 2분 캐시
      });
      
      // 보안 검증
      const validation = securityValidator.validateWeatherData(result);
      if (!validation.isValid) {
        throw new Error(`Data validation failed: ${validation.errors.join(', ')}`);
      }
      
      setData(validation.sanitized);
      setLastFetch(new Date());
      
    } catch (err) {
      console.error('Weather data fetch error:', err);
      setError(err);
      
      // 에러 메트릭 기록
      metricsService.trackError('weather_fetch_error', {
        locationId,
        error: err.message
      });
      
    } finally {
      setLoading(false);
    }
  }, [locationId]);

  // 자동 새로고침
  useEffect(() => {
    fetchData();
    
    if (enableAutoRefresh) {
      const interval = setInterval(fetchData, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchData, enableAutoRefresh, refreshInterval]);

  // 수동 새로고침
  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // 데이터 신선도 계산
  const dataFreshness = useMemo(() => {
    if (!lastFetch) return null;
    
    const now = new Date();
    const diffMinutes = Math.floor((now - lastFetch) / (1000 * 60));
    
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours}h ago`;
  }, [lastFetch]);

  return {
    data,
    loading,
    error,
    refresh,
    lastFetch,
    dataFreshness,
    isStale: lastFetch && (Date.now() - lastFetch) > refreshInterval
  };
};

// ✅ 좋은 예: 조합 가능한 훅
export const useWeatherLocations = () => {
  const [selectedLocation, setSelectedLocation] = useState('bukit_timah_nature_reserve');
  const [favoriteLocations, setFavoriteLocations] = useState(() => {
    return JSON.parse(localStorage.getItem('favoriteLocations') || '[]');
  });

  // 즐겨찾기 관리
  const toggleFavorite = useCallback((locationId) => {
    setFavoriteLocations(prev => {
      const updated = prev.includes(locationId)
        ? prev.filter(id => id !== locationId)
        : [...prev, locationId];
      
      localStorage.setItem('favoriteLocations', JSON.stringify(updated));
      return updated;
    });
  }, []);

  // 위치 변경
  const selectLocation = useCallback((locationId) => {
    setSelectedLocation(locationId);
    
    // 메트릭 추적
    metricsService.trackUserInteraction('location_select', locationId);
  }, []);

  return {
    selectedLocation,
    favoriteLocations,
    selectLocation,
    toggleFavorite,
    isFavorite: (locationId) => favoriteLocations.includes(locationId)
  };
};

// ✅ 훅 조합 사용 예제
const WeatherLocationCard = ({ locationId }) => {
  const { data, loading, error, refresh } = useWeatherData(locationId);
  const { isFavorite, toggleFavorite } = useWeatherLocations();
  
  return (
    <WeatherCard
      data={data}
      loading={loading}
      error={error}
      onRefresh={refresh}
      isFavorite={isFavorite(locationId)}
      onToggleFavorite={() => toggleFavorite(locationId)}
    />
  );
};
```

### 2. 고급 React 패턴

#### **Compound Components 패턴**

```javascript
/**
 * Compound Components 패턴
 * 여러 컴포넌트가 함께 작동하여 하나의 기능을 제공
 */

// ✅ 좋은 예: Weather Dashboard Compound Component
const WeatherDashboard = ({ children, data, onLocationChange }) => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [viewMode, setViewMode] = useState('cards');

  const contextValue = {
    data,
    selectedLocation,
    viewMode,
    onLocationSelect: (locationId) => {
      setSelectedLocation(locationId);
      onLocationChange?.(locationId);
    },
    onViewModeChange: setViewMode
  };

  return (
    <WeatherDashboardContext.Provider value={contextValue}>
      <div className="weather-dashboard">
        {children}
      </div>
    </WeatherDashboardContext.Provider>
  );
};

// 서브 컴포넌트들
WeatherDashboard.Header = ({ title, children }) => {
  const { viewMode, onViewModeChange } = useContext(WeatherDashboardContext);
  
  return (
    <div className="dashboard-header">
      <h2>{title}</h2>
      <div className="view-controls">
        <button 
          className={viewMode === 'cards' ? 'active' : ''}
          onClick={() => onViewModeChange('cards')}
        >
          Cards
        </button>
        <button 
          className={viewMode === 'chart' ? 'active' : ''}
          onClick={() => onViewModeChange('chart')}
        >
          Chart
        </button>
      </div>
      {children}
    </div>
  );
};

WeatherDashboard.LocationSelector = ({ locations }) => {
  const { selectedLocation, onLocationSelect } = useContext(WeatherDashboardContext);
  
  return (
    <div className="location-selector">
      {locations.map(location => (
        <button
          key={location.id}
          className={selectedLocation === location.id ? 'selected' : ''}
          onClick={() => onLocationSelect(location.id)}
        >
          {location.displayName}
        </button>
      ))}
    </div>
  );
};

WeatherDashboard.Content = () => {
  const { data, viewMode, selectedLocation } = useContext(WeatherDashboardContext);
  
  const filteredData = selectedLocation 
    ? data.filter(item => item.id === selectedLocation)
    : data;

  if (viewMode === 'cards') {
    return (
      <div className="weather-cards">
        {filteredData.map(item => (
          <WeatherCard key={item.id} data={item} />
        ))}
      </div>
    );
  }

  return <WeatherChart data={filteredData} />;
};

// 사용 예제
const App = () => {
  const { weatherData } = useWeatherData();
  
  return (
    <WeatherDashboard data={weatherData} onLocationChange={trackLocationChange}>
      <WeatherDashboard.Header title="Weather Overview">
        <RefreshButton />
      </WeatherDashboard.Header>
      
      <WeatherDashboard.LocationSelector locations={availableLocations} />
      
      <WeatherDashboard.Content />
    </WeatherDashboard>
  );
};
```

#### **Render Props 패턴**

```javascript
/**
 * Render Props 패턴
 * 컴포넌트 간 로직 공유를 위한 패턴
 */

// ✅ 좋은 예: Data Fetcher with Render Props
const DataFetcher = ({ 
  url, 
  children,
  fallback = null,
  errorComponent: ErrorComponent = DefaultErrorComponent 
}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const result = await apiService.fetch(url);
        setData(result);
        
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [url]);

  if (loading) return fallback || <LoadingSpinner />;
  if (error) return <ErrorComponent error={error} />;

  return children({ data, loading, error, refetch: fetchData });
};

// 사용 예제
const WeatherDisplay = () => (
  <DataFetcher 
    url="/api/weather"
    fallback={<WeatherSkeleton />}
    errorComponent={WeatherErrorDisplay}
  >
    {({ data, refetch }) => (
      <div>
        <WeatherCards data={data} />
        <button onClick={refetch}>Refresh</button>
      </div>
    )}
  </DataFetcher>
);
```

---

## 📊 상태 관리 패턴

### 1. 로컬 상태 관리

#### **useState 최적화 패턴**

```javascript
/**
 * useState 최적화 기법
 */

// ✅ 좋은 예: Lazy Initial State
const useExpensiveState = () => {
  const [data, setData] = useState(() => {
    // 비용이 큰 초기화 로직
    return processLargeDataset();
  });

  return [data, setData];
};

// ✅ 좋은 예: Functional State Updates
const useCounter = (initialValue = 0) => {
  const [count, setCount] = useState(initialValue);

  const increment = useCallback(() => {
    setCount(prevCount => prevCount + 1);
  }, []);

  const decrement = useCallback(() => {
    setCount(prevCount => prevCount - 1);
  }, []);

  const reset = useCallback(() => {
    setCount(initialValue);
  }, [initialValue]);

  return { count, increment, decrement, reset };
};

// ✅ 좋은 예: 복잡한 상태를 위한 useReducer
const weatherDashboardReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        loading: action.payload,
        error: null
      };

    case 'SET_DATA':
      return {
        ...state,
        data: action.payload,
        loading: false,
        error: null,
        lastUpdate: new Date()
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        loading: false
      };

    case 'SET_FILTER':
      return {
        ...state,
        filters: {
          ...state.filters,
          [action.payload.key]: action.payload.value
        }
      };

    case 'RESET_FILTERS':
      return {
        ...state,
        filters: initialFilters
      };

    default:
      return state;
  }
};

const useWeatherDashboard = () => {
  const [state, dispatch] = useReducer(weatherDashboardReducer, {
    data: null,
    loading: true,
    error: null,
    filters: initialFilters,
    lastUpdate: null
  });

  const setData = useCallback((data) => {
    dispatch({ type: 'SET_DATA', payload: data });
  }, []);

  const setError = useCallback((error) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  }, []);

  const setFilter = useCallback((key, value) => {
    dispatch({ type: 'SET_FILTER', payload: { key, value } });
  }, []);

  return {
    ...state,
    setData,
    setError,
    setFilter,
    resetFilters: () => dispatch({ type: 'RESET_FILTERS' })
  };
};
```

### 2. 전역 상태 관리

#### **Context + useReducer 패턴**

```javascript
/**
 * 전역 상태 관리를 위한 Context + useReducer
 */

// 앱 전역 상태 정의
const AppStateContext = createContext();
const AppDispatchContext = createContext();

const appReducer = (state, action) => {
  switch (action.type) {
    case 'SET_USER_PREFERENCES':
      return {
        ...state,
        userPreferences: {
          ...state.userPreferences,
          ...action.payload
        }
      };

    case 'SET_THEME':
      return {
        ...state,
        theme: action.payload
      };

    case 'ADD_NOTIFICATION':
      return {
        ...state,
        notifications: [
          ...state.notifications,
          {
            id: Date.now(),
            ...action.payload
          }
        ]
      };

    case 'REMOVE_NOTIFICATION':
      return {
        ...state,
        notifications: state.notifications.filter(
          notification => notification.id !== action.payload
        )
      };

    default:
      return state;
  }
};

// Provider 컴포넌트
export const AppStateProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, {
    userPreferences: {
      language: 'ko',
      units: 'metric',
      refreshInterval: 5 * 60 * 1000
    },
    theme: 'light',
    notifications: []
  });

  return (
    <AppStateContext.Provider value={state}>
      <AppDispatchContext.Provider value={dispatch}>
        {children}
      </AppDispatchContext.Provider>
    </AppStateContext.Provider>
  );
};

// 커스텀 훅으로 편리한 사용
export const useAppState = () => {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error('useAppState must be used within AppStateProvider');
  }
  return context;
};

export const useAppDispatch = () => {
  const context = useContext(AppDispatchContext);
  if (!context) {
    throw new Error('useAppDispatch must be used within AppStateProvider');
  }
  return context;
};

// 액션 크리에이터
export const useAppActions = () => {
  const dispatch = useAppDispatch();

  return {
    setUserPreferences: (preferences) => 
      dispatch({ type: 'SET_USER_PREFERENCES', payload: preferences }),
    
    setTheme: (theme) => 
      dispatch({ type: 'SET_THEME', payload: theme }),
    
    addNotification: (notification) => 
      dispatch({ type: 'ADD_NOTIFICATION', payload: notification }),
    
    removeNotification: (id) => 
      dispatch({ type: 'REMOVE_NOTIFICATION', payload: id })
  };
};
```

---

## 🔌 API 통합 패턴

### 1. API 클라이언트 패턴

#### **타입 안전 API 클라이언트**

```javascript
/**
 * 타입 안전하고 확장 가능한 API 클라이언트
 */

class WeatherAPIClient {
  constructor(baseURL, options = {}) {
    this.baseURL = baseURL;
    this.defaultOptions = {
      timeout: 10000,
      retries: 3,
      ...options
    };
    
    this.interceptors = {
      request: [],
      response: []
    };
  }

  // 요청 인터셉터 추가
  addRequestInterceptor(interceptor) {
    this.interceptors.request.push(interceptor);
  }

  // 응답 인터셉터 추가
  addResponseInterceptor(interceptor) {
    this.interceptors.response.push(interceptor);
  }

  // 기본 요청 메서드
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      ...this.defaultOptions,
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...this.defaultOptions.headers,
        ...options.headers
      }
    };

    // 요청 인터셉터 실행
    let finalConfig = config;
    for (const interceptor of this.interceptors.request) {
      finalConfig = await interceptor(finalConfig);
    }

    try {
      let response = await fetch(url, finalConfig);
      
      // 응답 인터셉터 실행
      for (const interceptor of this.interceptors.response) {
        response = await interceptor(response);
      }

      if (!response.ok) {
        throw new APIError(
          `HTTP ${response.status}: ${response.statusText}`,
          response.status,
          response
        );
      }

      return await response.json();
      
    } catch (error) {
      if (error instanceof APIError) {
        throw error;
      }
      
      throw new APIError(
        `Network error: ${error.message}`,
        0,
        null,
        error
      );
    }
  }

  // 편의 메서드들
  async get(endpoint, params = {}) {
    const queryString = new URLSearchParams(params).toString();
    const url = queryString ? `${endpoint}?${queryString}` : endpoint;
    
    return this.request(url, { method: 'GET' });
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // 특화된 API 메서드들
  async getWeatherData(locationId, options = {}) {
    const response = await this.get(`/weather/${locationId}`, {
      include: 'forecast,alerts',
      units: 'metric',
      ...options
    });

    // 응답 검증
    const validation = securityValidator.validateWeatherData(response);
    if (!validation.isValid) {
      throw new ValidationError('Invalid weather data', validation.errors);
    }

    return validation.sanitized;
  }

  async getTrafficCameras(area = null) {
    const params = area ? { area } : {};
    const response = await this.get('/traffic/cameras', params);

    // 카메라 데이터 검증 및 정제
    const validatedCameras = response.cameras
      .map(camera => {
        const validation = securityValidator.validateCameraData(camera);
        return validation.isValid ? validation.sanitized : null;
      })
      .filter(Boolean);

    return {
      ...response,
      cameras: validatedCameras,
      totalValid: validatedCameras.length
    };
  }
}

// 에러 클래스들
class APIError extends Error {
  constructor(message, status, response, originalError = null) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.response = response;
    this.originalError = originalError;
  }
}

class ValidationError extends Error {
  constructor(message, validationErrors) {
    super(message);
    this.name = 'ValidationError';
    this.validationErrors = validationErrors;
  }
}

// API 클라이언트 인스턴스 생성
const weatherAPI = new WeatherAPIClient('https://api.data.gov.sg/v1', {
  timeout: 15000,
  retries: 3
});

// 인터셉터 설정
weatherAPI.addRequestInterceptor(async (config) => {
  // 요청 메트릭 추적
  metricsService.trackAPICall('request_start', config.url);
  
  // 보안 헤더 추가
  config.headers['X-Client-Version'] = process.env.REACT_APP_VERSION;
  config.headers['X-Request-ID'] = generateRequestId();
  
  return config;
});

weatherAPI.addResponseInterceptor(async (response) => {
  // 응답 메트릭 추적
  metricsService.trackAPICall('response_received', response.url, {
    status: response.status,
    size: response.headers.get('content-length')
  });
  
  return response;
});
```

### 2. 반응형 데이터 패턴

#### **Real-time Data Synchronization**

```javascript
/**
 * 실시간 데이터 동기화 패턴
 */

class DataSynchronizer {
  constructor() {
    this.subscriptions = new Map();
    this.cache = new Map();
    this.syncInterval = 30000; // 30초
    this.isOnline = navigator.onLine;
    
    this.setupNetworkListeners();
  }

  setupNetworkListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.resumeSync();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.pauseSync();
    });
  }

  subscribe(key, fetcher, options = {}) {
    const subscription = {
      key,
      fetcher,
      options: {
        interval: this.syncInterval,
        priority: 'normal',
        ...options
      },
      lastFetch: null,
      intervalId: null,
      subscribers: new Set()
    };

    this.subscriptions.set(key, subscription);
    this.startSync(key);
    
    return {
      unsubscribe: () => this.unsubscribe(key),
      getData: () => this.cache.get(key),
      forceRefresh: () => this.fetchData(key)
    };
  }

  addSubscriber(key, callback) {
    const subscription = this.subscriptions.get(key);
    if (subscription) {
      subscription.subscribers.add(callback);
    }
  }

  removeSubscriber(key, callback) {
    const subscription = this.subscriptions.get(key);
    if (subscription) {
      subscription.subscribers.delete(callback);
    }
  }

  async fetchData(key) {
    const subscription = this.subscriptions.get(key);
    if (!subscription || !this.isOnline) return;

    try {
      const startTime = Date.now();
      const data = await subscription.fetcher();
      const fetchTime = Date.now() - startTime;
      
      // 캐시 업데이트
      this.cache.set(key, {
        data,
        timestamp: new Date(),
        fetchTime
      });
      
      subscription.lastFetch = new Date();
      
      // 구독자들에게 알림
      subscription.subscribers.forEach(callback => {
        try {
          callback(data, null);
        } catch (error) {
          console.error('Subscriber callback error:', error);
        }
      });
      
      // 메트릭 기록
      metricsService.trackDataSync(key, fetchTime, 'success');
      
    } catch (error) {
      console.error(`Data sync error for ${key}:`, error);
      
      // 구독자들에게 에러 알림
      subscription.subscribers.forEach(callback => {
        try {
          callback(null, error);
        } catch (callbackError) {
          console.error('Subscriber error callback error:', callbackError);
        }
      });
      
      // 메트릭 기록
      metricsService.trackDataSync(key, 0, 'error', error.message);
    }
  }

  startSync(key) {
    const subscription = this.subscriptions.get(key);
    if (!subscription) return;

    // 즉시 한 번 실행
    this.fetchData(key);
    
    // 주기적 실행 설정
    subscription.intervalId = setInterval(() => {
      this.fetchData(key);
    }, subscription.options.interval);
  }

  stopSync(key) {
    const subscription = this.subscriptions.get(key);
    if (subscription && subscription.intervalId) {
      clearInterval(subscription.intervalId);
      subscription.intervalId = null;
    }
  }

  unsubscribe(key) {
    this.stopSync(key);
    this.subscriptions.delete(key);
    this.cache.delete(key);
  }

  pauseSync() {
    this.subscriptions.forEach((_, key) => {
      this.stopSync(key);
    });
  }

  resumeSync() {
    this.subscriptions.forEach((_, key) => {
      this.startSync(key);
    });
  }
}

// 사용을 위한 React 훅
export const useRealtimeData = (key, fetcher, options = {}) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const dataSynchronizer = useMemo(() => {
    return new DataSynchronizer();
  }, []);

  useEffect(() => {
    const subscription = dataSynchronizer.subscribe(key, fetcher, options);
    
    const handleDataUpdate = (newData, error) => {
      if (error) {
        setError(error);
        setLoading(false);
      } else {
        setData(newData);
        setError(null);
        setLoading(false);
        setLastUpdate(new Date());
      }
    };

    dataSynchronizer.addSubscriber(key, handleDataUpdate);

    return () => {
      dataSynchronizer.removeSubscriber(key, handleDataUpdate);
      subscription.unsubscribe();
    };
  }, [key, fetcher, options, dataSynchronizer]);

  const refresh = useCallback(() => {
    setLoading(true);
    dataSynchronizer.fetchData(key);
  }, [key, dataSynchronizer]);

  return {
    data,
    loading,
    error,
    lastUpdate,
    refresh
  };
};

// 사용 예제
const WeatherDataComponent = () => {
  const { data, loading, error, lastUpdate, refresh } = useRealtimeData(
    'weather-bukit-timah',
    () => weatherAPI.getWeatherData('bukit_timah_nature_reserve'),
    {
      interval: 2 * 60 * 1000, // 2분 간격
      priority: 'high'
    }
  );

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} onRetry={refresh} />;

  return (
    <div>
      <WeatherDisplay data={data} />
      <div className="last-update">
        Last updated: {lastUpdate?.toLocaleTimeString()}
      </div>
    </div>
  );
};
```

---

## 🚨 에러 처리 패턴

### 1. Error Boundary 패턴

#### **계층적 에러 처리**

```javascript
/**
 * 계층적 에러 처리 시스템
 */

// 기본 Error Boundary
class BaseErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error) {
    return { 
      hasError: true, 
      errorId: generateErrorId()
    };
  }

  componentDidCatch(error, errorInfo) {
    const errorData = {
      error,
      errorInfo,
      errorId: this.state.errorId,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      componentStack: errorInfo.componentStack
    };

    this.setState({ error, errorInfo });
    
    // 에러 리포팅
    this.reportError(errorData);
  }

  reportError(errorData) {
    // 헬스 서비스에 에러 기록
    if (window.healthService) {
      window.healthService.recordError(errorData.error, {
        type: 'react_error_boundary',
        errorId: errorData.errorId,
        componentStack: errorData.errorInfo.componentStack
      });
    }

    // 메트릭 서비스에 에러 추적
    if (window.metricsService) {
      window.metricsService.trackError('react_component_error', {
        errorId: errorData.errorId,
        message: errorData.error.message,
        stack: errorData.error.stack
      });
    }

    // 개발 환경에서는 콘솔에 상세 정보 출력
    if (process.env.NODE_ENV === 'development') {
      console.group('🚨 React Error Boundary');
      console.error('Error ID:', errorData.errorId);
      console.error('Error:', errorData.error);
      console.error('Component Stack:', errorData.errorInfo.componentStack);
      console.groupEnd();
    }
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      const { fallback: Fallback, onRetry } = this.props;
      
      if (Fallback) {
        return (
          <Fallback 
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            errorId={this.state.errorId}
            onRetry={onRetry || this.handleRetry}
          />
        );
      }

      return this.renderDefaultFallback();
    }

    return this.props.children;
  }

  renderDefaultFallback() {
    return (
      <div className="error-boundary-fallback" role="alert">
        <h2>문제가 발생했습니다</h2>
        <details>
          <summary>에러 상세 정보</summary>
          <p>Error ID: {this.state.errorId}</p>
          <pre>{this.state.error?.message}</pre>
        </details>
        <button onClick={this.handleRetry}>
          다시 시도
        </button>
      </div>
    );
  }
}

// 특화된 Error Boundary들
class WeatherErrorBoundary extends BaseErrorBoundary {
  renderDefaultFallback() {
    return (
      <div className="weather-error-fallback">
        <h3>날씨 정보를 불러올 수 없습니다</h3>
        <p>잠시 후 다시 시도해주세요.</p>
        <button onClick={this.handleRetry}>
          날씨 정보 새로고침
        </button>
      </div>
    );
  }
}

class NetworkErrorBoundary extends BaseErrorBoundary {
  renderDefaultFallback() {
    return (
      <div className="network-error-fallback">
        <h3>네트워크 연결 문제</h3>
        <p>인터넷 연결을 확인하고 다시 시도해주세요.</p>
        <button onClick={this.handleRetry}>
          연결 다시 시도
        </button>
      </div>
    );
  }
}

// 사용 예제
const App = () => (
  <BaseErrorBoundary fallback={AppErrorFallback}>
    <Header />
    
    <WeatherErrorBoundary>
      <WeatherSection />
    </WeatherErrorBoundary>
    
    <NetworkErrorBoundary>
      <TrafficCameraSection />
    </NetworkErrorBoundary>
    
    <Footer />
  </BaseErrorBoundary>
);
```

### 2. 비동기 에러 처리

#### **Promise 및 async/await 에러 처리**

```javascript
/**
 * 비동기 작업 에러 처리 패턴
 */

// 재시도 로직이 포함된 비동기 함수
const withRetry = async (asyncFn, maxRetries = 3, delay = 1000) => {
  let lastError;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await asyncFn();
    } catch (error) {
      lastError = error;
      
      // 재시도 불가능한 에러는 즉시 throw
      if (error.status === 404 || error.status === 403) {
        throw error;
      }
      
      // 마지막 시도가 아니면 대기 후 재시도
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }
  
  throw lastError;
};

// 타임아웃이 포함된 비동기 함수
const withTimeout = (asyncFn, timeoutMs = 10000) => {
  return Promise.race([
    asyncFn(),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error(`Timeout after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
};

// 안전한 비동기 호출을 위한 커스텀 훅
export const useSafeAsync = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const execute = useCallback(async (asyncFn, options = {}) => {
    const {
      maxRetries = 3,
      timeout = 10000,
      onSuccess,
      onError
    } = options;

    try {
      if (!isMountedRef.current) return;
      
      setLoading(true);
      setError(null);

      const result = await withTimeout(
        () => withRetry(asyncFn, maxRetries),
        timeout
      );

      if (!isMountedRef.current) return;

      setLoading(false);
      
      if (onSuccess) {
        onSuccess(result);
      }
      
      return result;

    } catch (err) {
      if (!isMountedRef.current) return;

      setLoading(false);
      setError(err);
      
      if (onError) {
        onError(err);
      } else {
        // 기본 에러 처리
        console.error('Async operation failed:', err);
      }
      
      throw err;
    }
  }, []);

  const reset = useCallback(() => {
    setLoading(false);
    setError(null);
  }, []);

  return {
    loading,
    error,
    execute,
    reset
  };
};

// 사용 예제
const WeatherDataComponent = () => {
  const [weatherData, setWeatherData] = useState(null);
  const { loading, error, execute } = useSafeAsync();

  const fetchWeatherData = useCallback(async () => {
    await execute(
      () => weatherAPI.getWeatherData('bukit_timah'),
      {
        maxRetries: 3,
        timeout: 15000,
        onSuccess: setWeatherData,
        onError: (error) => {
          // 사용자 친화적 에러 메시지
          const userMessage = error.status === 404 
            ? '해당 지역의 날씨 정보를 찾을 수 없습니다.'
            : '날씨 정보를 불러오는 중 문제가 발생했습니다.';
          
          showNotification(userMessage, 'error');
        }
      }
    );
  }, [execute]);

  useEffect(() => {
    fetchWeatherData();
  }, [fetchWeatherData]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} onRetry={fetchWeatherData} />;
  if (!weatherData) return <EmptyState />;

  return <WeatherDisplay data={weatherData} />;
};
```

---

## ⚡ 성능 최적화 패턴

### 1. 메모이제이션 패턴

#### **지능형 메모이제이션**

```javascript
/**
 * 지능형 메모이제이션 패턴
 */

// 깊은 비교를 위한 커스텀 메모이제이션
const useDeepMemo = (factory, deps) => {
  const ref = useRef();
  
  if (!ref.current || !deepEqual(deps, ref.current.deps)) {
    ref.current = {
      deps,
      value: factory()
    };
  }
  
  return ref.current.value;
};

// 조건부 메모이제이션
const useConditionalMemo = (factory, deps, condition = true) => {
  const memoizedValue = useMemo(factory, deps);
  const [cachedValue, setCachedValue] = useState(memoizedValue);
  
  useEffect(() => {
    if (condition) {
      setCachedValue(memoizedValue);
    }
  }, [memoizedValue, condition]);
  
  return condition ? memoizedValue : cachedValue;
};

// 실제 사용 예제
const WeatherAnalysisCard = React.memo(({ location, preferences }) => {
  // 무거운 계산을 메모이제이션
  const analysisData = useMemo(() => {
    console.log('Calculating weather analysis for', location.id);
    
    return {
      comfort: calculateComfortIndex(location.temperature, location.humidity),
      activities: analyzeActivitySuitability(location),
      alerts: generateWeatherAlerts(location),
      forecast: processForecastData(location.forecast)
    };
  }, [
    location.temperature,
    location.humidity, 
    location.condition,
    location.forecast
  ]);

  // 사용자 설정에 따른 조건부 메모이제이션
  const personalizedData = useConditionalMemo(
    () => personalizeWeatherData(analysisData, preferences),
    [analysisData, preferences],
    preferences.enablePersonalization
  );

  // 렌더링 최적화
  const cardStyle = useMemo(() => ({
    '--temperature-color': getTemperatureColor(location.temperature),
    '--humidity-opacity': location.humidity / 100,
    animationDelay: `${Math.random() * 200}ms`
  }), [location.temperature, location.humidity]);

  return (
    <div className="weather-analysis-card" style={cardStyle}>
      <WeatherCardHeader location={location} />
      <WeatherMetrics data={personalizedData} />
      <ActivityRecommendations activities={analysisData.activities} />
    </div>
  );
}, (prevProps, nextProps) => {
  // 커스텀 비교 함수로 리렌더링 최적화
  return (
    prevProps.location.id === nextProps.location.id &&
    prevProps.location.temperature === nextProps.location.temperature &&
    prevProps.location.humidity === nextProps.location.humidity &&
    prevProps.location.condition === nextProps.location.condition &&
    shallowEqual(prevProps.preferences, nextProps.preferences)
  );
});
```

### 2. 가상 스크롤링 패턴

#### **무한 스크롤 + 가상 스크롤링**

```javascript
/**
 * 효율적인 대용량 리스트 렌더링
 */

const useVirtualScroll = ({ 
  items, 
  itemHeight, 
  containerHeight, 
  overscan = 5 
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + overscan,
      items.length
    );
    
    return {
      startIndex: Math.max(0, startIndex - overscan),
      endIndex
    };
  }, [scrollTop, itemHeight, containerHeight, overscan, items.length]);
  
  const visibleItems = useMemo(() => {
    return items.slice(visibleRange.startIndex, visibleRange.endIndex)
      .map((item, index) => ({
        ...item,
        index: visibleRange.startIndex + index
      }));
  }, [items, visibleRange]);
  
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleRange.startIndex * itemHeight;
  
  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop
  };
};

// 무한 스크롤 훅
const useInfiniteScroll = ({ 
  fetchMore, 
  hasMore, 
  threshold = 200 
}) => {
  const [loading, setLoading] = useState(false);
  const observerRef = useRef();
  
  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    try {
      await fetchMore();
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, fetchMore]);
  
  const lastElementRef = useCallback((node) => {
    if (loading) return;
    
    if (observerRef.current) observerRef.current.disconnect();
    
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMore();
      }
    }, { threshold: 0.1 });
    
    if (node) observerRef.current.observe(node);
  }, [loading, hasMore, loadMore]);
  
  return { loading, lastElementRef };
};

// 조합된 무한 가상 스크롤 컴포넌트
const VirtualizedTrafficCameraList = ({ 
  initialCameras, 
  fetchMoreCameras 
}) => {
  const [cameras, setCameras] = useState(initialCameras);
  const [hasMore, setHasMore] = useState(true);
  const containerRef = useRef();
  const [containerHeight, setContainerHeight] = useState(600);
  
  const ITEM_HEIGHT = 200;
  
  const { visibleItems, totalHeight, offsetY, setScrollTop } = useVirtualScroll({
    items: cameras,
    itemHeight: ITEM_HEIGHT,
    containerHeight,
    overscan: 3
  });
  
  const { loading, lastElementRef } = useInfiniteScroll({
    fetchMore: async () => {
      const newCameras = await fetchMoreCameras();
      if (newCameras.length === 0) {
        setHasMore(false);
      } else {
        setCameras(prev => [...prev, ...newCameras]);
      }
    },
    hasMore
  });
  
  // 컨테이너 크기 감지
  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      if (entries[0]) {
        setContainerHeight(entries[0].contentRect.height);
      }
    });
    
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    return () => observer.disconnect();
  }, []);
  
  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, [setScrollTop]);
  
  return (
    <div
      ref={containerRef}
      className="virtual-scroll-container"
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.map((camera, index) => {
            const isLast = index === visibleItems.length - 1;
            
            return (
              <div
                key={camera.id}
                ref={isLast ? lastElementRef : null}
                style={{ height: ITEM_HEIGHT }}
              >
                <CameraCard camera={camera} />
              </div>
            );
          })}
          
          {loading && (
            <div className="loading-more" style={{ height: ITEM_HEIGHT }}>
              <LoadingSpinner />
              <span>더 많은 카메라를 불러오는 중...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
```

---

## 🧪 테스팅 패턴

### 1. 컴포넌트 테스팅

#### **종합적인 컴포넌트 테스트**

```javascript
/**
 * React Testing Library를 활용한 컴포넌트 테스트
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';

// 테스트 유틸리티
const renderWithProviders = (component, options = {}) => {
  const {
    initialState = {},
    theme = 'light',
    ...renderOptions
  } = options;

  const AllTheProviders = ({ children }) => (
    <AppStateProvider initialState={initialState}>
      <ThemeProvider theme={theme}>
        {children}
      </ThemeProvider>
    </AppStateProvider>
  );

  return render(component, { wrapper: AllTheProviders, ...renderOptions });
};

// 모킹 함수들
const mockWeatherAPI = {
  getWeatherData: jest.fn(),
  getTrafficCameras: jest.fn()
};

const mockMetricsService = {
  trackUserInteraction: jest.fn(),
  trackAPICall: jest.fn()
};

// WeatherCard 컴포넌트 테스트
describe('WeatherCard', () => {
  const mockLocation = {
    id: 'bukit_timah',
    displayName: 'Bukit Timah Nature Reserve',
    temperature: 28.5,
    humidity: 75,
    condition: 'partly_cloudy'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders weather information correctly', () => {
    renderWithProviders(
      <WeatherCard 
        location={mockLocation}
        onRefresh={() => {}}
      />
    );

    expect(screen.getByText('Bukit Timah Nature Reserve')).toBeInTheDocument();
    expect(screen.getByLabelText(/temperature 28.5 degrees/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/humidity 75 percent/i)).toBeInTheDocument();
  });

  it('calls onRefresh when refresh button is clicked', async () => {
    const user = userEvent.setup();
    const mockRefresh = jest.fn();

    renderWithProviders(
      <WeatherCard 
        location={mockLocation}
        onRefresh={mockRefresh}
      />
    );

    const refreshButton = screen.getByRole('button', { 
      name: /refresh weather data for bukit timah/i 
    });
    
    await user.click(refreshButton);
    
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it('shows loading state correctly', () => {
    renderWithProviders(
      <WeatherCard 
        location={mockLocation}
        onRefresh={() => {}}
        isLoading={true}
      />
    );

    expect(screen.getByText('Updating...')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('handles keyboard navigation properly', async () => {
    const user = userEvent.setup();
    const mockRefresh = jest.fn();

    renderWithProviders(
      <WeatherCard 
        location={mockLocation}
        onRefresh={mockRefresh}
      />
    );

    const refreshButton = screen.getByRole('button');
    
    // 탭으로 포커스 이동
    await user.tab();
    expect(refreshButton).toHaveFocus();
    
    // 엔터키로 클릭
    await user.keyboard('{Enter}');
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });
});

// 커스텀 훅 테스트
describe('useWeatherData', () => {
  beforeEach(() => {
    mockWeatherAPI.getWeatherData.mockResolvedValue({
      location: mockLocation,
      temperature: 28.5,
      humidity: 75
    });
  });

  it('fetches data on mount', async () => {
    const { result } = renderHook(() => 
      useWeatherData('bukit_timah')
    );

    expect(result.current.loading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.data).toBeDefined();
    expect(mockWeatherAPI.getWeatherData).toHaveBeenCalledWith('bukit_timah');
  });

  it('handles errors correctly', async () => {
    const errorMessage = 'Network error';
    mockWeatherAPI.getWeatherData.mockRejectedValue(new Error(errorMessage));

    const { result } = renderHook(() => 
      useWeatherData('bukit_timah')
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });
    
    expect(result.current.error).toBeDefined();
    expect(result.current.error.message).toBe(errorMessage);
  });

  it('refreshes data when refresh is called', async () => {
    const { result } = renderHook(() => 
      useWeatherData('bukit_timah', { enableAutoRefresh: false })
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(mockWeatherAPI.getWeatherData).toHaveBeenCalledTimes(1);
    
    act(() => {
      result.current.refresh();
    });

    await waitFor(() => {
      expect(mockWeatherAPI.getWeatherData).toHaveBeenCalledTimes(2);
    });
  });
});
```

### 2. 통합 테스트

#### **E2E 테스트 패턴**

```javascript
/**
 * Playwright를 활용한 E2E 테스트
 */

import { test, expect } from '@playwright/test';

// 페이지 객체 모델
class WeatherAppPage {
  constructor(page) {
    this.page = page;
    this.weatherCards = page.locator('[data-testid="weather-card"]');
    this.refreshButton = page.locator('[data-testid="refresh-all"]');
    this.locationSelector = page.locator('[data-testid="location-selector"]');
    this.mapContainer = page.locator('[data-testid="map-container"]');
  }

  async goto() {
    await this.page.goto('/');
    await this.waitForLoad();
  }

  async waitForLoad() {
    await expect(this.weatherCards.first()).toBeVisible();
    await this.page.waitForLoadState('networkidle');
  }

  async selectLocation(locationName) {
    await this.locationSelector.selectOption(locationName);
    await this.waitForLoad();
  }

  async refreshWeatherData() {
    await this.refreshButton.click();
    await this.waitForLoad();
  }

  async getWeatherCardData(index = 0) {
    const card = this.weatherCards.nth(index);
    const temperature = await card.locator('[data-testid="temperature"]').textContent();
    const humidity = await card.locator('[data-testid="humidity"]').textContent();
    const location = await card.locator('[data-testid="location-name"]').textContent();
    
    return { temperature, humidity, location };
  }
}

test.describe('Weather App E2E Tests', () => {
  let weatherPage;

  test.beforeEach(async ({ page }) => {
    weatherPage = new WeatherAppPage(page);
    await weatherPage.goto();
  });

  test('displays weather data correctly', async () => {
    const weatherData = await weatherPage.getWeatherCardData(0);
    
    expect(weatherData.location).toBeTruthy();
    expect(weatherData.temperature).toMatch(/\d+\.?\d*°C/);
    expect(weatherData.humidity).toMatch(/\d+%/);
  });

  test('refreshes data when refresh button is clicked', async ({ page }) => {
    // 초기 데이터 가져오기
    const initialData = await weatherPage.getWeatherCardData(0);
    
    // API 요청 모니터링
    const apiPromise = page.waitForResponse(
      response => response.url().includes('/weather') && response.status() === 200
    );
    
    await weatherPage.refreshWeatherData();
    await apiPromise;
    
    // 데이터가 업데이트되었는지 확인 (타임스탬프 등으로)
    const lastUpdate = await page.locator('[data-testid="last-update"]').textContent();
    expect(lastUpdate).toContain('ago');
  });

  test('handles network errors gracefully', async ({ page }) => {
    // 네트워크 차단
    await page.route('**/api/weather/**', route => {
      route.abort('failed');
    });

    await weatherPage.refreshWeatherData();
    
    // 에러 메시지 확인
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible();
    
    // 재시도 버튼 확인
    const retryButton = page.locator('[data-testid="retry-button"]');
    await expect(retryButton).toBeVisible();
  });

  test('supports keyboard navigation', async ({ page }) => {
    // 첫 번째 카드로 포커스 이동
    await page.keyboard.press('Tab');
    
    const focusedElement = await page.evaluate(() => document.activeElement.getAttribute('data-testid'));
    expect(focusedElement).toBe('weather-card');
    
    // 엔터키로 상세 정보 토글
    await page.keyboard.press('Enter');
    await expect(page.locator('[data-testid="weather-details"]')).toBeVisible();
  });

  test('works offline', async ({ page, context }) => {
    // 온라인 상태에서 데이터 로드
    await weatherPage.waitForLoad();
    const onlineData = await weatherPage.getWeatherCardData(0);
    
    // 오프라인 모드 활성화
    await context.setOffline(true);
    await page.reload();
    
    // 캐시된 데이터 확인
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
    
    const offlineData = await weatherPage.getWeatherCardData(0);
    expect(offlineData.location).toBe(onlineData.location);
  });

  test('responsive design on mobile', async ({ page }) => {
    // 모바일 뷰포트로 변경
    await page.setViewportSize({ width: 375, height: 667 });
    
    // 카드가 세로로 정렬되는지 확인
    const cards = await page.locator('[data-testid="weather-card"]').all();
    
    for (let i = 0; i < cards.length - 1; i++) {
      const currentCard = cards[i];
      const nextCard = cards[i + 1];
      
      const currentBox = await currentCard.boundingBox();
      const nextBox = await nextCard.boundingBox();
      
      // 다음 카드가 현재 카드 아래에 있는지 확인
      expect(nextBox.y).toBeGreaterThan(currentBox.y + currentBox.height - 10);
    }
  });
});
```

---

## ♿ 접근성 패턴

### 1. 키보드 네비게이션

#### **포괄적인 키보드 지원**

```javascript
/**
 * 키보드 네비게이션 패턴
 */

// 키보드 트랩 훅
const useFocusTrap = (isActive) => {
  const containerRef = useRef();
  
  useEffect(() => {
    if (!isActive || !containerRef.current) return;
    
    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];
    
    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return;
      
      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };
    
    const handleEscapeKey = (e) => {
      if (e.key === 'Escape') {
        // 모달이나 드롭다운 닫기
        if (typeof onEscape === 'function') {
          onEscape();
        }
      }
    };
    
    container.addEventListener('keydown', handleTabKey);
    container.addEventListener('keydown', handleEscapeKey);
    
    // 초기 포커스 설정
    firstElement?.focus();
    
    return () => {
      container.removeEventListener('keydown', handleTabKey);
      container.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isActive]);
  
  return containerRef;
};

// 접근 가능한 모달 컴포넌트
const AccessibleModal = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  closeButtonLabel = "닫기"
}) => {
  const modalRef = useFocusTrap(isOpen);
  const titleId = useId();
  
  // 모달이 열릴 때 body 스크롤 방지
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = 'unset';
      };
    }
  }, [isOpen]);
  
  // 스크린 리더를 위한 라이브 리전 업데이트
  useEffect(() => {
    if (isOpen) {
      announceToScreenReader(`모달이 열렸습니다: ${title}`);
    }
  }, [isOpen, title]);
  
  if (!isOpen) return null;
  
  return createPortal(
    <div 
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      ref={modalRef}
    >
      <div className="modal-content">
        <header className="modal-header">
          <h2 id={titleId}>{title}</h2>
          <button 
            type="button"
            onClick={onClose}
            aria-label={closeButtonLabel}
            className="close-button"
          >
            ✕
          </button>
        </header>
        
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
};

// 접근 가능한 드롭다운 메뉴
const AccessibleDropdown = ({ 
  trigger, 
  children, 
  placement = 'bottom-start' 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef();
  const menuRef = useFocusTrap(isOpen);
  const menuId = useId();
  
  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
      case 'ArrowDown':
        e.preventDefault();
        setIsOpen(true);
        break;
      case 'Escape':
        setIsOpen(false);
        triggerRef.current?.focus();
        break;
    }
  };
  
  const handleMenuKeyDown = (e) => {
    const menuItems = menuRef.current?.querySelectorAll('[role="menuitem"]');
    const currentIndex = Array.from(menuItems || []).indexOf(e.target);
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        const nextIndex = (currentIndex + 1) % menuItems.length;
        menuItems[nextIndex]?.focus();
        break;
        
      case 'ArrowUp':
        e.preventDefault();
        const prevIndex = currentIndex === 0 ? menuItems.length - 1 : currentIndex - 1;
        menuItems[prevIndex]?.focus();
        break;
        
      case 'Home':
        e.preventDefault();
        menuItems[0]?.focus();
        break;
        
      case 'End':
        e.preventDefault();
        menuItems[menuItems.length - 1]?.focus();
        break;
        
      case 'Escape':
        setIsOpen(false);
        triggerRef.current?.focus();
        break;
    }
  };
  
  return (
    <div className="dropdown">
      <button
        ref={triggerRef}
        type="button"
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-controls={isOpen ? menuId : undefined}
        onKeyDown={handleKeyDown}
        onClick={() => setIsOpen(!isOpen)}
      >
        {trigger}
      </button>
      
      {isOpen && (
        <div
          ref={menuRef}
          id={menuId}
          role="menu"
          className={`dropdown-menu placement-${placement}`}
          onKeyDown={handleMenuKeyDown}
        >
          {children}
        </div>
      )}
    </div>
  );
};
```

### 2. 스크린 리더 지원

#### **ARIA 및 시멘틱 마크업**

```javascript
/**
 * 스크린 리더 친화적 컴포넌트
 */

// 라이브 리전 관리
const useLiveRegion = () => {
  const announceRef = useRef();
  
  useEffect(() => {
    // 라이브 리전 생성
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    document.body.appendChild(liveRegion);
    announceRef.current = liveRegion;
    
    return () => {
      if (announceRef.current) {
        document.body.removeChild(announceRef.current);
      }
    };
  }, []);
  
  const announce = useCallback((message, priority = 'polite') => {
    if (announceRef.current) {
      announceRef.current.setAttribute('aria-live', priority);
      announceRef.current.textContent = message;
      
      // 메시지 클리어
      setTimeout(() => {
        if (announceRef.current) {
          announceRef.current.textContent = '';
        }
      }, 1000);
    }
  }, []);
  
  return { announce };
};

// 접근 가능한 데이터 테이블
const AccessibleDataTable = ({ 
  data, 
  columns, 
  caption,
  sortable = false 
}) => {
  const [sortConfig, setSortConfig] = useState(null);
  const { announce } = useLiveRegion();
  const tableId = useId();
  
  const sortedData = useMemo(() => {
    if (!sortConfig) return data;
    
    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  }, [data, sortConfig]);
  
  const handleSort = (columnKey, columnLabel) => {
    let direction = 'asc';
    
    if (sortConfig?.key === columnKey && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    
    setSortConfig({ key: columnKey, direction });
    
    // 스크린 리더에 정렬 상태 알림
    announce(
      `테이블이 ${columnLabel} 기준으로 ${direction === 'asc' ? '오름차순' : '내림차순'} 정렬되었습니다.`
    );
  };
  
  return (
    <div className="table-container" role="region" aria-labelledby={`${tableId}-caption`}>
      <table 
        id={tableId}
        className="accessible-table"
        aria-describedby={sortable ? `${tableId}-sort-info` : undefined}
      >
        <caption id={`${tableId}-caption`}>
          {caption}
          {sortable && (
            <div id={`${tableId}-sort-info`} className="sr-only">
              정렬 가능한 테이블입니다. 열 머리글을 클릭하거나 엔터키를 누르면 해당 열을 기준으로 정렬됩니다.
            </div>
          )}
        </caption>
        
        <thead>
          <tr>
            {columns.map(column => (
              <th
                key={column.key}
                scope="col"
                className={sortable ? 'sortable' : ''}
                tabIndex={sortable ? 0 : undefined}
                role={sortable ? 'button' : undefined}
                aria-sort={
                  sortConfig?.key === column.key 
                    ? sortConfig.direction === 'asc' ? 'ascending' : 'descending'
                    : 'none'
                }
                onClick={sortable ? () => handleSort(column.key, column.label) : undefined}
                onKeyDown={sortable ? (e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleSort(column.key, column.label);
                  }
                } : undefined}
              >
                {column.label}
                {sortable && (
                  <span className="sort-indicator" aria-hidden="true">
                    {sortConfig?.key === column.key 
                      ? (sortConfig.direction === 'asc' ? ' ↑' : ' ↓')
                      : ' ↕'
                    }
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        
        <tbody>
          {sortedData.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map(column => (
                <td key={column.key}>
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

// 접근 가능한 프로그레스 바
const AccessibleProgressBar = ({ 
  value, 
  max = 100, 
  label,
  showPercentage = true 
}) => {
  const progressId = useId();
  const percentage = Math.round((value / max) * 100);
  
  return (
    <div className="progress-container">
      <div className="progress-label" id={`${progressId}-label`}>
        {label}
        {showPercentage && (
          <span className="progress-percentage" aria-hidden="true">
            {percentage}%
          </span>
        )}
      </div>
      
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-labelledby={`${progressId}-label`}
        aria-valuetext={`${percentage}% 완료`}
        className="progress-bar"
      >
        <div 
          className="progress-fill"
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      <div className="sr-only" aria-live="polite">
        {label} {percentage}% 완료
      </div>
    </div>
  );
};
```

이 구현 패턴 가이드는 Singapore Weather Cam 프로젝트에서 사용된 실제 패턴들을 기반으로 작성되었으며, 각 패턴은 프로덕션 환경에서 검증된 베스트 프랙티스를 따릅니다. 이러한 패턴들을 활용하여 확장 가능하고 유지보수가 용이한 React 애플리케이션을 구축할 수 있습니다.