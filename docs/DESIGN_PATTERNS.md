# Design Patterns Documentation

## Singapore Weather Cam - Technical Design Patterns & Code Organization

### Overview

This document outlines the comprehensive design patterns, architectural decisions, and code organization strategies implemented in the Singapore Weather Cam application. These patterns ensure maintainable, scalable, and robust code while providing excellent developer experience and system reliability.

---

## Architectural Design Patterns

### 1. Model-View-ViewModel (MVVM) Pattern

The application follows an MVVM pattern adapted for React, where:
- **Model**: Data services and API integrations
- **View**: React components (presentational)
- **ViewModel**: Custom hooks and context providers

```javascript
// Model Layer (src/services/apiService.js)
class WeatherApiService {
  async fetchWeatherData() {
    try {
      const response = await fetch('/data/weather/latest.json');
      return await response.json();
    } catch (error) {
      throw new WeatherApiError(error.message);
    }
  }
  
  async fetchHistoricalData(date) {
    const response = await fetch(`/data/weather/${date}.json`);
    return await response.json();
  }
}

// ViewModel Layer (src/hooks/useWeatherData.js)
export const useWeatherData = () => {
  const [state, setState] = useState({
    data: null,
    isLoading: true,
    error: null
  });
  
  const weatherService = useMemo(() => new WeatherApiService(), []);
  
  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true }));
    try {
      const data = await weatherService.fetchWeatherData();
      setState({ data, isLoading: false, error: null });
    } catch (error) {
      setState(prev => ({ ...prev, error: error.message, isLoading: false }));
    }
  }, [weatherService]);
  
  return { ...state, refetch: fetchData };
};

// View Layer (src/components/weather/WeatherDashboard.jsx)
const WeatherDashboard = () => {
  const { data, isLoading, error } = useWeatherData();
  
  if (isLoading) return <LoadingSpinner />;
  if (error) return <ErrorDisplay error={error} />;
  
  return (
    <div className="weather-dashboard">
      {data.stations.map(station => (
        <WeatherCard key={station.id} station={station} />
      ))}
    </div>
  );
};
```

### 2. Observer Pattern

Implemented through React Context and custom event systems for component communication.

```javascript
// Event Observer System (src/utils/eventSystem.js)
class EventObserver {
  constructor() {
    this.observers = new Map();
  }
  
  subscribe(event, callback) {
    if (!this.observers.has(event)) {
      this.observers.set(event, []);
    }
    this.observers.get(event).push(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.observers.get(event);
      if (callbacks) {
        const index = callbacks.indexOf(callback);
        if (index > -1) {
          callbacks.splice(index, 1);
        }
      }
    };
  }
  
  notify(event, data) {
    const callbacks = this.observers.get(event);
    if (callbacks) {
      callbacks.forEach(callback => callback(data));
    }
  }
}

// Global event system
export const globalEvents = new EventObserver();

// Usage in components
const WeatherAlerts = () => {
  const [alerts, setAlerts] = useState([]);
  
  useEffect(() => {
    const unsubscribe = globalEvents.subscribe('weather:alert', (alert) => {
      setAlerts(prev => [...prev, alert]);
    });
    
    return unsubscribe;
  }, []);
  
  return (
    <div className="weather-alerts">
      {alerts.map(alert => (
        <AlertCard key={alert.id} alert={alert} />
      ))}
    </div>
  );
};
```

### 3. Factory Pattern

Used for creating different types of components and services based on configuration.

```javascript
// Component Factory (src/utils/componentFactory.js)
class ComponentFactory {
  static createWeatherCard(type, data) {
    switch (type) {
      case 'primary':
        return <PrimaryWeatherCard data={data} />;
      case 'secondary':
        return <SecondaryWeatherCard data={data} />;
      case 'compact':
        return <CompactWeatherCard data={data} />;
      default:
        return <DefaultWeatherCard data={data} />;
    }
  }
  
  static createChart(chartType, data, options = {}) {
    const chartConfig = {
      temperature: () => new TemperatureChart(data, options),
      humidity: () => new HumidityChart(data, options),
      wind: () => new WindChart(data, options),
      combined: () => new CombinedChart(data, options)
    };
    
    const createChart = chartConfig[chartType];
    if (!createChart) {
      throw new Error(`Unknown chart type: ${chartType}`);
    }
    
    return createChart();
  }
}

// Service Factory (src/services/serviceFactory.js)
class ServiceFactory {
  static createApiService(type) {
    switch (type) {
      case 'weather':
        return new WeatherApiService();
      case 'webcam':
        return new WebcamApiService();
      case 'traffic':
        return new TrafficApiService();
      default:
        throw new Error(`Unknown service type: ${type}`);
    }
  }
}
```

### 4. Strategy Pattern

Used for different caching strategies, data fetching strategies, and rendering strategies.

```javascript
// Caching Strategies (src/strategies/cachingStrategies.js)
class CachingStrategy {
  constructor() {
    this.cache = new Map();
  }
}

class NetworkFirstStrategy extends CachingStrategy {
  async fetch(key, fetchFn) {
    try {
      const data = await fetchFn();
      this.cache.set(key, { data, timestamp: Date.now() });
      return data;
    } catch (error) {
      const cached = this.cache.get(key);
      if (cached) {
        return cached.data;
      }
      throw error;
    }
  }
}

class CacheFirstStrategy extends CachingStrategy {
  async fetch(key, fetchFn, maxAge = 5 * 60 * 1000) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < maxAge) {
      return cached.data;
    }
    
    const data = await fetchFn();
    this.cache.set(key, { data, timestamp: Date.now() });
    return data;
  }
}

// Data Fetching Strategy Context
class DataFetcher {
  constructor(strategy) {
    this.strategy = strategy;
  }
  
  setStrategy(strategy) {
    this.strategy = strategy;
  }
  
  async fetchData(key, fetchFn) {
    return this.strategy.fetch(key, fetchFn);
  }
}

// Usage in hooks
const useDataWithStrategy = (key, fetchFn, strategyType = 'network-first') => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const strategy = useMemo(() => {
    switch (strategyType) {
      case 'cache-first':
        return new CacheFirstStrategy();
      case 'network-first':
      default:
        return new NetworkFirstStrategy();
    }
  }, [strategyType]);
  
  const fetcher = useMemo(() => new DataFetcher(strategy), [strategy]);
  
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        const result = await fetcher.fetchData(key, fetchFn);
        setData(result);
      } catch (error) {
        console.error('Data fetch failed:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [key, fetchFn, fetcher]);
  
  return { data, isLoading };
};
```

---

## Code Organization Patterns

### 1. Feature-Based Directory Structure

```
src/
├── components/           # Reusable UI components
│   ├── common/          # Shared components
│   ├── weather/         # Weather-specific components
│   ├── webcam/          # Webcam-specific components
│   └── layout/          # Layout components
├── hooks/               # Custom React hooks
├── contexts/            # React Context providers
├── services/            # API and business logic services
├── utils/               # Utility functions and helpers
├── strategies/          # Strategy pattern implementations
├── config/              # Configuration files
├── styles/              # Global styles and themes
└── tests/               # Test files organized by type
```

### 2. Barrel Exports Pattern

```javascript
// src/components/index.js - Central export point
export { WeatherCard } from './weather/WeatherCard';
export { WeatherDashboard } from './weather/WeatherDashboard';
export { WebcamGallery } from './webcam/WebcamGallery';
export { MapView } from './map/MapView';
export { ErrorBoundary } from './common/ErrorBoundary';
export { LoadingSpinner } from './common/LoadingSpinner';

// src/hooks/index.js
export { useWeatherData } from './useWeatherData';
export { useWebcamData } from './useWebcamData';
export { useServiceWorker } from './useServiceWorker';
export { usePerformanceMonitor } from './usePerformanceMonitor';

// Usage
import { WeatherCard, ErrorBoundary } from '../components';
import { useWeatherData } from '../hooks';
```

### 3. Configuration-Driven Development

```javascript
// src/config/appConfig.js
export const APP_CONFIG = {
  api: {
    baseUrl: process.env.REACT_APP_API_BASE_URL || '',
    timeout: 10000,
    retryAttempts: 3,
    retryDelay: 1000
  },
  
  features: {
    enableOfflineMode: true,
    enablePerformanceMonitoring: true,
    enableAccessibilityFeatures: true,
    enableAnalytics: false
  },
  
  ui: {
    theme: 'modern',
    defaultTab: 'dashboard',
    animationsEnabled: true,
    autoRefreshInterval: 5 * 60 * 1000 // 5 minutes
  },
  
  performance: {
    enableServiceWorker: true,
    enableCodeSplitting: true,
    enableLazyLoading: true,
    bundleAnalysis: process.env.NODE_ENV === 'development'
  }
};

// src/config/weatherStations.js
export const WEATHER_STATIONS = {
  primary: [
    {
      id: 'S121',
      name: 'Bukit Timah Nature Reserve',
      coordinates: [1.3520, 103.7767],
      priority: 1,
      region: 'Central'
    },
    {
      id: 'S116',
      name: 'Bukit Timah Road',
      coordinates: [1.3138, 103.8420],
      priority: 2,
      region: 'Central'
    }
  ],
  
  secondary: [
    // Additional stations
  ]
};

// Usage in components
const WeatherStationSelector = () => {
  const stations = [...WEATHER_STATIONS.primary, ...WEATHER_STATIONS.secondary];
  
  return (
    <select>
      {stations.map(station => (
        <option key={station.id} value={station.id}>
          {station.name}
        </option>
      ))}
    </select>
  );
};
```

---

## Data Management Patterns

### 1. Repository Pattern

Abstraction layer between data sources and business logic.

```javascript
// src/repositories/WeatherRepository.js
class WeatherRepository {
  constructor(apiService, cacheService) {
    this.apiService = apiService;
    this.cacheService = cacheService;
  }
  
  async getCurrentWeather() {
    const cacheKey = 'current-weather';
    const cached = await this.cacheService.get(cacheKey);
    
    if (cached && !this.isStale(cached.timestamp)) {
      return cached.data;
    }
    
    const data = await this.apiService.fetchCurrentWeather();
    await this.cacheService.set(cacheKey, {
      data,
      timestamp: Date.now()
    });
    
    return data;
  }
  
  async getHistoricalWeather(startDate, endDate) {
    const data = await this.apiService.fetchHistoricalWeather(startDate, endDate);
    return this.processHistoricalData(data);
  }
  
  async getWeatherAlerts() {
    const data = await this.apiService.fetchWeatherAlerts();
    return this.filterActiveAlerts(data);
  }
  
  isStale(timestamp, maxAge = 5 * 60 * 1000) {
    return Date.now() - timestamp > maxAge;
  }
  
  processHistoricalData(data) {
    return data.map(entry => ({
      ...entry,
      temperature: this.convertTemperature(entry.temperature),
      timestamp: new Date(entry.timestamp)
    }));
  }
  
  filterActiveAlerts(alerts) {
    return alerts.filter(alert => 
      alert.isActive && new Date(alert.expiryDate) > new Date()
    );
  }
  
  convertTemperature(temp) {
    // Temperature conversion logic
    return temp;
  }
}

// Repository factory
class RepositoryFactory {
  static createWeatherRepository() {
    const apiService = new WeatherApiService();
    const cacheService = new CacheService();
    return new WeatherRepository(apiService, cacheService);
  }
}
```

### 2. Data Transformation Pipeline

```javascript
// src/utils/dataTransformers.js
class DataTransformer {
  static transform(data, transformations) {
    return transformations.reduce((result, transformer) => {
      return transformer(result);
    }, data);
  }
}

// Weather data transformers
const weatherTransformers = {
  normalizeStationData: (data) => ({
    ...data,
    stations: data.stations.map(station => ({
      ...station,
      temperature: parseFloat(station.temperature),
      humidity: parseInt(station.humidity),
      windSpeed: parseFloat(station.windSpeed),
      isPrimary: station.priority <= 2
    }))
  }),
  
  addCalculatedFields: (data) => ({
    ...data,
    stations: data.stations.map(station => ({
      ...station,
      heatIndex: calculateHeatIndex(station.temperature, station.humidity),
      comfortLevel: calculateComfortLevel(station)
    }))
  }),
  
  sortByPriority: (data) => ({
    ...data,
    stations: data.stations.sort((a, b) => a.priority - b.priority)
  })
};

// Usage
const processWeatherData = (rawData) => {
  return DataTransformer.transform(rawData, [
    weatherTransformers.normalizeStationData,
    weatherTransformers.addCalculatedFields,
    weatherTransformers.sortByPriority
  ]);
};
```

### 3. State Management Pattern

```javascript
// src/contexts/AppStateContext.js
const initialState = {
  weather: {
    data: null,
    isLoading: false,
    error: null,
    lastUpdated: null
  },
  webcam: {
    data: null,
    isLoading: false,
    error: null,
    selectedCamera: null
  },
  ui: {
    activeTab: 'dashboard',
    sidebarOpen: false,
    theme: 'light'
  },
  system: {
    isOnline: navigator.onLine,
    serviceWorkerStatus: 'not-registered',
    performanceMetrics: {}
  }
};

const appStateReducer = (state, action) => {
  switch (action.type) {
    case 'WEATHER_LOADING':
      return {
        ...state,
        weather: { ...state.weather, isLoading: true, error: null }
      };
      
    case 'WEATHER_SUCCESS':
      return {
        ...state,
        weather: {
          data: action.payload,
          isLoading: false,
          error: null,
          lastUpdated: Date.now()
        }
      };
      
    case 'WEATHER_ERROR':
      return {
        ...state,
        weather: { ...state.weather, isLoading: false, error: action.payload }
      };
      
    case 'UI_SET_ACTIVE_TAB':
      return {
        ...state,
        ui: { ...state.ui, activeTab: action.payload }
      };
      
    default:
      return state;
  }
};

export const AppStateProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appStateReducer, initialState);
  
  const actions = {
    setWeatherLoading: () => dispatch({ type: 'WEATHER_LOADING' }),
    setWeatherData: (data) => dispatch({ type: 'WEATHER_SUCCESS', payload: data }),
    setWeatherError: (error) => dispatch({ type: 'WEATHER_ERROR', payload: error }),
    setActiveTab: (tab) => dispatch({ type: 'UI_SET_ACTIVE_TAB', payload: tab })
  };
  
  return (
    <AppStateContext.Provider value={{ state, actions }}>
      {children}
    </AppStateContext.Provider>
  );
};
```

---

## Error Handling Patterns

### 1. Centralized Error Handling

```javascript
// src/utils/errorHandler.js
class ErrorHandler {
  static handle(error, context = {}) {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context,
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Application Error:', errorInfo);
    }
    
    // Send to monitoring service in production
    if (process.env.NODE_ENV === 'production') {
      this.sendToMonitoringService(errorInfo);
    }
    
    // Store locally for debugging
    this.storeLocalError(errorInfo);
    
    return errorInfo;
  }
  
  static sendToMonitoringService(errorInfo) {
    // Implementation for error monitoring service
    fetch('/api/errors', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorInfo)
    }).catch(() => {
      // Silently fail if monitoring service is unavailable
    });
  }
  
  static storeLocalError(errorInfo) {
    try {
      const errors = JSON.parse(localStorage.getItem('app-errors') || '[]');
      errors.push(errorInfo);
      
      // Keep only last 10 errors
      if (errors.length > 10) {
        errors.splice(0, errors.length - 10);
      }
      
      localStorage.setItem('app-errors', JSON.stringify(errors));
    } catch (e) {
      // Ignore localStorage errors
    }
  }
}

// Custom error classes
class WeatherApiError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.name = 'WeatherApiError';
    this.statusCode = statusCode;
  }
}

class NetworkError extends Error {
  constructor(message) {
    super(message);
    this.name = 'NetworkError';
  }
}
```

### 2. Retry Pattern with Exponential Backoff

```javascript
// src/utils/retryPattern.js
class RetryHandler {
  static async withRetry(fn, options = {}) {
    const {
      maxAttempts = 3,
      baseDelay = 1000,
      maxDelay = 10000,
      backoffFactor = 2,
      shouldRetry = () => true
    } = options;
    
    let lastError;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        if (attempt === maxAttempts || !shouldRetry(error)) {
          throw error;
        }
        
        const delay = Math.min(
          baseDelay * Math.pow(backoffFactor, attempt - 1),
          maxDelay
        );
        
        await this.delay(delay);
      }
    }
    
    throw lastError;
  }
  
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Usage in API services
const fetchWithRetry = async (url) => {
  return RetryHandler.withRetry(
    () => fetch(url).then(response => {
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return response.json();
    }),
    {
      maxAttempts: 3,
      shouldRetry: (error) => {
        // Retry on network errors and 5xx status codes
        return error.name === 'NetworkError' || 
               (error.message.includes('HTTP 5'));
      }
    }
  );
};
```

---

## Performance Optimization Patterns

### 1. Memoization Pattern

```javascript
// src/utils/memoization.js
class MemoizationCache {
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }
  
  get(key) {
    if (this.cache.has(key)) {
      // Move to end (LRU)
      const value = this.cache.get(key);
      this.cache.delete(key);
      this.cache.set(key, value);
      return value;
    }
    return undefined;
  }
  
  set(key, value) {
    if (this.cache.has(key)) {
      this.cache.delete(key);
    } else if (this.cache.size >= this.maxSize) {
      // Remove least recently used
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }
    this.cache.set(key, value);
  }
  
  clear() {
    this.cache.clear();
  }
}

const memoize = (fn, keyGenerator) => {
  const cache = new MemoizationCache();
  
  return (...args) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);
    
    let result = cache.get(key);
    if (result === undefined) {
      result = fn(...args);
      cache.set(key, result);
    }
    
    return result;
  };
};

// Usage
const calculateHeatIndex = memoize((temp, humidity) => {
  // Expensive calculation
  const heatIndex = -42.379 + 
    2.04901523 * temp + 
    10.14333127 * humidity - 
    0.22475541 * temp * humidity;
  return Math.round(heatIndex * 10) / 10;
}, (temp, humidity) => `${temp}-${humidity}`);
```

### 2. Virtual Scrolling Pattern

```javascript
// src/components/common/VirtualList.jsx
const VirtualList = ({ 
  items, 
  itemHeight, 
  containerHeight, 
  renderItem,
  overscan = 3 
}) => {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef();
  
  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + overscan,
    items.length
  );
  
  const visibleItems = items.slice(
    Math.max(0, visibleStart - overscan),
    visibleEnd
  );
  
  const totalHeight = items.length * itemHeight;
  const offsetY = Math.max(0, visibleStart - overscan) * itemHeight;
  
  const handleScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);
  
  return (
    <div
      ref={containerRef}
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((item, index) => (
            <div key={item.id || index} style={{ height: itemHeight }}>
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
```

### 3. Lazy Loading Pattern

```javascript
// src/utils/lazyLoading.js
const createLazyComponent = (importFn, fallback = null) => {
  const LazyComponent = lazy(importFn);
  
  return (props) => (
    <Suspense fallback={fallback}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

// Pre-loading pattern
const preloadComponent = (importFn) => {
  const componentImport = importFn();
  return componentImport;
};

// Usage
const LazyMapView = createLazyComponent(
  () => import('../components/map/MapView'),
  <div className="loading">Loading map...</div>
);

// Preload on hover
const NavigationTab = ({ to, children, onHover }) => {
  const handleMouseEnter = () => {
    if (to === 'map') {
      preloadComponent(() => import('../components/map/MapView'));
    }
    onHover?.();
  };
  
  return (
    <button onMouseEnter={handleMouseEnter}>
      {children}
    </button>
  );
};
```

---

## Security Patterns

### 1. Input Sanitization Pattern

```javascript
// src/utils/sanitization.js
class InputSanitizer {
  static sanitizeText(input) {
    if (typeof input !== 'string') {
      return '';
    }
    
    return input
      .replace(/[<>]/g, '') // Remove potential HTML tags
      .replace(/javascript:/gi, '') // Remove javascript: URLs
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim()
      .substring(0, 1000); // Limit length
  }
  
  static sanitizeNumber(input, min = -Infinity, max = Infinity) {
    const num = parseFloat(input);
    if (isNaN(num)) {
      return null;
    }
    return Math.max(min, Math.min(max, num));
  }
  
  static sanitizeUrl(url) {
    try {
      const urlObj = new URL(url);
      // Only allow http and https protocols
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return null;
      }
      return urlObj.toString();
    } catch {
      return null;
    }
  }
}

// Usage in components
const SearchInput = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  
  const handleSubmit = (e) => {
    e.preventDefault();
    const sanitizedQuery = InputSanitizer.sanitizeText(query);
    onSearch(sanitizedQuery);
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        maxLength={100}
      />
      <button type="submit">Search</button>
    </form>
  );
};
```

### 2. Content Security Policy Pattern

```javascript
// src/utils/cspHelper.js
class CSPHelper {
  static generateNonce() {
    const array = new Uint8Array(16);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array));
  }
  
  static createCSPHeader(nonce) {
    const directives = [
      "default-src 'self'",
      `script-src 'self' 'nonce-${nonce}' https://apis.google.com`,
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https:",
      "connect-src 'self' https://api.data.gov.sg https://api.openweathermap.org",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ];
    
    return directives.join('; ');
  }
}
```

---

## Testing Patterns

### 1. Test Data Factory Pattern

```javascript
// src/tests/factories/weatherDataFactory.js
class WeatherDataFactory {
  static createStation(overrides = {}) {
    return {
      id: `S${Math.floor(Math.random() * 1000)}`,
      name: 'Test Station',
      temperature: 25.0,
      humidity: 70,
      windSpeed: 5.5,
      rainfall: 0.0,
      lat: 1.3521,
      lng: 103.8198,
      isPrimary: false,
      area: 'Central',
      ...overrides
    };
  }
  
  static createWeatherData(stationCount = 3) {
    return {
      stations: Array.from({ length: stationCount }, (_, i) =>
        this.createStation({ 
          id: `S${i + 1}`,
          isPrimary: i < 2 
        })
      ),
      lastUpdate: new Date().toISOString(),
      source: 'test'
    };
  }
  
  static createHistoricalData(days = 7) {
    return Array.from({ length: days }, (_, i) => ({
      date: new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString(),
      stations: this.createWeatherData(3).stations
    }));
  }
}

// Usage in tests
describe('WeatherCard', () => {
  it('displays primary station with special styling', () => {
    const station = WeatherDataFactory.createStation({ isPrimary: true });
    
    render(<WeatherCard station={station} />);
    
    expect(screen.getByText('PRIMARY')).toBeInTheDocument();
  });
});
```

### 2. Mock Service Pattern

```javascript
// src/tests/mocks/mockApiService.js
class MockApiService {
  constructor() {
    this.responses = new Map();
    this.delays = new Map();
    this.errorConditions = new Map();
  }
  
  setResponse(endpoint, response) {
    this.responses.set(endpoint, response);
    return this;
  }
  
  setDelay(endpoint, delay) {
    this.delays.set(endpoint, delay);
    return this;
  }
  
  setError(endpoint, error) {
    this.errorConditions.set(endpoint, error);
    return this;
  }
  
  async fetch(endpoint) {
    const delay = this.delays.get(endpoint) || 0;
    if (delay > 0) {
      await new Promise(resolve => setTimeout(resolve, delay));
    }
    
    if (this.errorConditions.has(endpoint)) {
      throw new Error(this.errorConditions.get(endpoint));
    }
    
    if (this.responses.has(endpoint)) {
      return this.responses.get(endpoint);
    }
    
    throw new Error(`No mock response for ${endpoint}`);
  }
}

// Test setup
const mockApi = new MockApiService()
  .setResponse('/weather/latest', WeatherDataFactory.createWeatherData())
  .setDelay('/weather/latest', 100);
```

---

*This document is part of the Singapore Weather Cam technical documentation suite. For component architecture details, see COMPONENT_ARCHITECTURE.md. For development guidelines and best practices, see DEVELOPMENT_GUIDELINES.md.*