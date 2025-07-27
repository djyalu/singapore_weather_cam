# Component Architecture Documentation

## Singapore Weather Cam - React Component Architecture

### Overview

The Singapore Weather Cam application follows a **hierarchical component architecture** built on React 18 with modern hooks patterns, Context API for state management, and a comprehensive error boundary system. The architecture emphasizes modularity, reusability, and maintainability while providing excellent developer experience.

---

## Component Hierarchy

### Application Structure

```
App (Root)
├── AppProvider (Context Wrapper)
├── ErrorBoundary (Error Isolation)
├── AppLayout (Main Layout)
│   ├── Header / LiveHeader
│   ├── HeroSection
│   ├── Main Content Router
│   │   ├── AnalysisSection
│   │   ├── WebcamSection
│   │   ├── MapSection
│   │   └── TrafficSection
│   └── SystemFooter
└── PWAStatus (Service Worker Status)
```

### Component Organization

```
src/components/
├── admin/           # Administrative interfaces
├── analysis/        # Weather analysis components  
├── common/          # Shared/utility components
├── dashboard/       # System monitoring components
├── examples/        # Component examples and demos
├── layout/          # Layout and structural components
├── map/             # Interactive map components
├── navigation/      # Navigation-related components
├── performance/     # Performance monitoring components
├── sections/        # Page section components
├── system/          # System health components
├── ui/              # Basic UI building blocks
├── weather/         # Weather-specific components
└── webcam/          # Webcam and camera components
```

---

## Core Component Patterns

### 1. Container/Presentational Pattern

#### Weather Components Example
```javascript
// Container Component (src/components/weather/WeatherDashboard.jsx)
const WeatherDashboard = () => {
  const { weatherData, isLoading, error } = useWeatherData();
  
  if (isLoading) return <SkeletonLoader />;
  if (error) return <ErrorState message={error} />;
  
  return (
    <div className="weather-dashboard">
      {weatherData.stations.map(station => (
        <WeatherCard key={station.id} station={station} />
      ))}
    </div>
  );
};

// Presentational Component (src/components/weather/WeatherCard.jsx)
const WeatherCard = ({ station, className, onClick }) => {
  return (
    <div className={`weather-card ${className}`} onClick={onClick}>
      <WeatherCardHeader station={station} />
      <WeatherInfoSection station={station} />
      <WeatherCardBadges station={station} />
    </div>
  );
};
```

### 2. Higher-Order Component (HOC) Pattern

#### Error Handling HOC
```javascript
// src/components/common/withErrorHandling.jsx
export const withErrorHandling = (Component, fallbackComponent) => {
  return function ErrorWrappedComponent(props) {
    return (
      <ComponentErrorBoundary fallback={fallbackComponent}>
        <Component {...props} />
      </ComponentErrorBoundary>
    );
  };
};

// Usage
const SafeWeatherCard = withErrorHandling(WeatherCard, ErrorState);
```

### 3. Render Props Pattern

#### Progressive Disclosure
```javascript
// src/components/common/ProgressiveDisclosure.jsx
const ProgressiveDisclosure = ({ children, threshold = 1000 }) => {
  const [isVisible, setIsVisible] = useState(false);
  
  return (
    <div>
      {children({ isVisible, setIsVisible, threshold })}
    </div>
  );
};

// Usage
<ProgressiveDisclosure threshold={500}>
  {({ isVisible, setIsVisible }) => (
    isVisible ? <ComplexComponent /> : <SimplifiedView />
  )}
</ProgressiveDisclosure>
```

### 4. Compound Component Pattern

#### Traffic Camera Gallery
```javascript
// src/components/webcam/TrafficCameraGallery.jsx
const TrafficCameraGallery = ({ children, cameras, ...props }) => {
  return (
    <div className="camera-gallery" {...props}>
      {children}
    </div>
  );
};

TrafficCameraGallery.Header = ({ title, subtitle }) => (
  <div className="gallery-header">
    <h2>{title}</h2>
    <p>{subtitle}</p>
  </div>
);

TrafficCameraGallery.Grid = ({ children }) => (
  <div className="camera-grid">
    {children}
  </div>
);

TrafficCameraGallery.Card = WebcamCard;

// Usage
<TrafficCameraGallery cameras={cameras}>
  <TrafficCameraGallery.Header 
    title="Traffic Cameras"
    subtitle="Real-time traffic monitoring"
  />
  <TrafficCameraGallery.Grid>
    {cameras.map(camera => (
      <TrafficCameraGallery.Card key={camera.id} camera={camera} />
    ))}
  </TrafficCameraGallery.Grid>
</TrafficCameraGallery>
```

---

## State Management Architecture

### Context API Implementation

#### Application Data Context
```javascript
// src/contexts/AppDataContext.jsx
const AppDataContext = createContext();

export const AppDataProvider = ({ children }) => {
  const [weatherData, setWeatherData] = useState(null);
  const [webcamData, setWebcamData] = useState(null);
  const [systemStatus, setSystemStatus] = useState('healthy');
  
  const contextValue = {
    // Data state
    weatherData,
    webcamData,
    systemStatus,
    
    // Actions
    updateWeatherData: setWeatherData,
    updateWebcamData: setWebcamData,
    updateSystemStatus: setSystemStatus,
    
    // Computed values
    isDataLoaded: weatherData && webcamData,
    hasErrors: systemStatus === 'error'
  };
  
  return (
    <AppDataContext.Provider value={contextValue}>
      {children}
    </AppDataContext.Provider>
  );
};
```

#### Error Context for Global Error Handling
```javascript
// src/contexts/ErrorContext.jsx
export const ErrorProvider = ({ children }) => {
  const [errors, setErrors] = useState([]);
  
  const addError = useCallback((error) => {
    const errorObj = {
      id: Date.now(),
      message: error.message,
      component: error.component,
      timestamp: new Date(),
      severity: error.severity || 'medium'
    };
    setErrors(prev => [...prev, errorObj]);
  }, []);
  
  const clearError = useCallback((id) => {
    setErrors(prev => prev.filter(error => error.id !== id));
  }, []);
  
  return (
    <ErrorContext.Provider value={{ errors, addError, clearError }}>
      {children}
    </ErrorContext.Provider>
  );
};
```

### Custom Hooks Architecture

#### Data Fetching Hooks
```javascript
// src/hooks/useWeatherData.js
export const useWeatherData = () => {
  const [state, setState] = useState({
    data: null,
    isLoading: true,
    error: null,
    lastFetch: null
  });
  
  const fetchData = useCallback(async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await fetch('/data/weather/latest.json');
      const data = await response.json();
      
      setState({
        data,
        isLoading: false,
        error: null,
        lastFetch: Date.now()
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message
      }));
    }
  }, []);
  
  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5 * 60 * 1000); // 5 minutes
    return () => clearInterval(interval);
  }, [fetchData]);
  
  return {
    weatherData: state.data,
    isLoading: state.isLoading,
    error: state.error,
    lastFetch: state.lastFetch,
    refetch: fetchData
  };
};
```

#### Performance Monitoring Hook
```javascript
// src/hooks/useComponentPerformance.js
export const useComponentPerformance = (componentName) => {
  const [metrics, setMetrics] = useState({
    renderCount: 0,
    averageRenderTime: 0,
    lastRenderTime: 0
  });
  
  const startTime = useRef();
  
  useEffect(() => {
    startTime.current = performance.now();
  });
  
  useEffect(() => {
    const endTime = performance.now();
    const renderTime = endTime - startTime.current;
    
    setMetrics(prev => ({
      renderCount: prev.renderCount + 1,
      lastRenderTime: renderTime,
      averageRenderTime: (prev.averageRenderTime * prev.renderCount + renderTime) / (prev.renderCount + 1)
    }));
  });
  
  return metrics;
};
```

---

## Component Communication Patterns

### 1. Parent-Child Communication

#### Props Down, Events Up
```javascript
// Parent Component
const WeatherSection = () => {
  const [selectedStation, setSelectedStation] = useState(null);
  
  const handleStationSelect = (station) => {
    setSelectedStation(station);
  };
  
  return (
    <div>
      <WeatherStationList 
        stations={stations}
        onStationSelect={handleStationSelect}
        selectedStation={selectedStation}
      />
      {selectedStation && (
        <WeatherStationDetail station={selectedStation} />
      )}
    </div>
  );
};

// Child Component
const WeatherStationList = ({ stations, onStationSelect, selectedStation }) => {
  return (
    <div className="station-list">
      {stations.map(station => (
        <StationCard
          key={station.id}
          station={station}
          isSelected={station.id === selectedStation?.id}
          onClick={() => onStationSelect(station)}
        />
      ))}
    </div>
  );
};
```

### 2. Sibling Communication via Context

```javascript
// Context for sibling communication
const NavigationContext = createContext();

// Parent component providing context
const App = () => {
  const [activeSection, setActiveSection] = useState('dashboard');
  
  return (
    <NavigationContext.Provider value={{ activeSection, setActiveSection }}>
      <Header />
      <MainContent />
    </NavigationContext.Provider>
  );
};

// Sibling components using context
const Header = () => {
  const { activeSection, setActiveSection } = useContext(NavigationContext);
  
  return (
    <nav>
      {sections.map(section => (
        <button
          key={section.id}
          className={activeSection === section.id ? 'active' : ''}
          onClick={() => setActiveSection(section.id)}
        >
          {section.name}
        </button>
      ))}
    </nav>
  );
};
```

### 3. Event-Driven Communication

```javascript
// Event system for loosely coupled components
const useEventEmitter = () => {
  const listeners = useRef({});
  
  const emit = useCallback((event, data) => {
    if (listeners.current[event]) {
      listeners.current[event].forEach(callback => callback(data));
    }
  }, []);
  
  const on = useCallback((event, callback) => {
    if (!listeners.current[event]) {
      listeners.current[event] = [];
    }
    listeners.current[event].push(callback);
    
    return () => {
      listeners.current[event] = listeners.current[event].filter(cb => cb !== callback);
    };
  }, []);
  
  return { emit, on };
};

// Usage in components
const WeatherAlert = () => {
  const { emit } = useEventEmitter();
  
  useEffect(() => {
    if (temperature > 35) {
      emit('weather:alert', { type: 'high-temperature', value: temperature });
    }
  }, [temperature, emit]);
};

const NotificationCenter = () => {
  const { on } = useEventEmitter();
  const [alerts, setAlerts] = useState([]);
  
  useEffect(() => {
    const unsubscribe = on('weather:alert', (alert) => {
      setAlerts(prev => [...prev, alert]);
    });
    
    return unsubscribe;
  }, [on]);
};
```

---

## Error Boundary Architecture

### Hierarchical Error Boundaries

```javascript
// Global Error Boundary (src/components/common/ErrorBoundary.jsx)
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true };
  }
  
  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });
    
    // Log to monitoring service
    this.logErrorToService(error, errorInfo);
  }
  
  logErrorToService = (error, errorInfo) => {
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };
    
    // Send to monitoring service or store locally
    console.error('Application Error:', errorData);
  };
  
  render() {
    if (this.state.hasError) {
      return this.props.fallback ? (
        <this.props.fallback error={this.state.error} />
      ) : (
        <ErrorFallback error={this.state.error} />
      );
    }
    
    return this.props.children;
  }
}

// Component-specific Error Boundary
const ComponentErrorBoundary = ({ children, fallback, onError }) => {
  return (
    <ErrorBoundary 
      fallback={fallback} 
      onError={onError}
    >
      {children}
    </ErrorBoundary>
  );
};
```

### Error Recovery Strategies

```javascript
// Self-healing component with retry logic
const useErrorRecovery = (maxRetries = 3) => {
  const [retryCount, setRetryCount] = useState(0);
  const [lastError, setLastError] = useState(null);
  
  const handleError = useCallback((error) => {
    setLastError(error);
    
    if (retryCount < maxRetries) {
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setLastError(null);
      }, 1000 * Math.pow(2, retryCount)); // Exponential backoff
    }
  }, [retryCount, maxRetries]);
  
  const reset = useCallback(() => {
    setRetryCount(0);
    setLastError(null);
  }, []);
  
  return {
    retryCount,
    lastError,
    handleError,
    reset,
    canRetry: retryCount < maxRetries
  };
};
```

---

## Performance Optimization Patterns

### 1. Component Memoization

```javascript
// Memoized weather card component
const WeatherCard = memo(({ station, ...props }) => {
  const { temperature, humidity, windSpeed } = station;
  
  return (
    <div className="weather-card" {...props}>
      <div className="temperature">{temperature}°C</div>
      <div className="humidity">{humidity}%</div>
      <div className="wind-speed">{windSpeed} km/h</div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for complex objects
  return (
    prevProps.station.id === nextProps.station.id &&
    prevProps.station.temperature === nextProps.station.temperature &&
    prevProps.station.humidity === nextProps.station.humidity &&
    prevProps.station.windSpeed === nextProps.station.windSpeed
  );
});
```

### 2. Lazy Loading and Code Splitting

```javascript
// Lazy loaded components
const MapView = lazy(() => import('./map/MapView'));
const AdminPanel = lazy(() => import('./admin/AdminPanels'));
const PerformanceDashboard = lazy(() => import('./performance/PerformanceDashboard'));

// Suspense wrapper with loading state
const LazyComponentWrapper = ({ children }) => (
  <Suspense fallback={<SkeletonLoader />}>
    {children}
  </Suspense>
);

// Usage in routing
const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const renderContent = () => {
    switch (activeTab) {
      case 'map':
        return (
          <LazyComponentWrapper>
            <MapView />
          </LazyComponentWrapper>
        );
      case 'admin':
        return (
          <LazyComponentWrapper>
            <AdminPanel />
          </LazyComponentWrapper>
        );
      default:
        return <Dashboard />;
    }
  };
  
  return renderContent();
};
```

### 3. Virtual Scrolling for Large Lists

```javascript
// Virtual scrolling hook for large camera lists
const useVirtualScrolling = (items, itemHeight, containerHeight) => {
  const [scrollTop, setScrollTop] = useState(0);
  
  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight) + 1,
    items.length
  );
  
  const visibleItems = items.slice(visibleStart, visibleEnd);
  const totalHeight = items.length * itemHeight;
  const offsetY = visibleStart * itemHeight;
  
  return {
    visibleItems,
    totalHeight,
    offsetY,
    setScrollTop
  };
};

// Virtual camera list component
const VirtualCameraList = ({ cameras }) => {
  const containerRef = useRef();
  const { visibleItems, totalHeight, offsetY, setScrollTop } = useVirtualScrolling(
    cameras,
    200, // item height
    600  // container height
  );
  
  const handleScroll = (e) => {
    setScrollTop(e.target.scrollTop);
  };
  
  return (
    <div 
      ref={containerRef}
      style={{ height: 600, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map(camera => (
            <CameraCard key={camera.id} camera={camera} />
          ))}
        </div>
      </div>
    </div>
  );
};
```

---

## Testing Architecture

### Component Testing Strategy

```javascript
// Component test example (src/components/weather/WeatherCard.test.jsx)
import { render, screen, fireEvent } from '@testing-library/react';
import { WeatherCard } from './WeatherCard';

const mockStation = {
  id: 'S121',
  name: 'Bukit Timah Nature Reserve',
  temperature: 28.5,
  humidity: 75,
  windSpeed: 8.3
};

describe('WeatherCard', () => {
  it('renders station data correctly', () => {
    render(<WeatherCard station={mockStation} />);
    
    expect(screen.getByText('Bukit Timah Nature Reserve')).toBeInTheDocument();
    expect(screen.getByText('28.5°C')).toBeInTheDocument();
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByText('8.3 km/h')).toBeInTheDocument();
  });
  
  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<WeatherCard station={mockStation} onClick={handleClick} />);
    
    fireEvent.click(screen.getByRole('button', { name: /weather card/i }));
    expect(handleClick).toHaveBeenCalledWith(mockStation);
  });
  
  it('applies accessibility attributes', () => {
    render(<WeatherCard station={mockStation} />);
    
    const card = screen.getByRole('button');
    expect(card).toHaveAttribute('aria-label', expect.stringContaining('Bukit Timah Nature Reserve'));
    expect(card).toHaveAttribute('tabIndex', '0');
  });
});
```

### Integration Testing

```javascript
// Integration test for weather data flow
import { render, screen, waitFor } from '@testing-library/react';
import { AppDataProvider } from '../contexts/AppDataContext';
import { WeatherDashboard } from './WeatherDashboard';

// Mock API responses
global.fetch = jest.fn();

describe('Weather Data Integration', () => {
  beforeEach(() => {
    fetch.mockClear();
  });
  
  it('loads and displays weather data', async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        stations: [mockStation]
      })
    });
    
    render(
      <AppDataProvider>
        <WeatherDashboard />
      </AppDataProvider>
    );
    
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
    
    await waitFor(() => {
      expect(screen.getByText('Bukit Timah Nature Reserve')).toBeInTheDocument();
    });
    
    expect(fetch).toHaveBeenCalledWith('/data/weather/latest.json');
  });
});
```

---

## Accessibility Architecture

### Accessible Component Patterns

```javascript
// Accessible button component
const AccessibleButton = ({ 
  children, 
  onClick, 
  disabled = false, 
  ariaLabel, 
  variant = 'primary',
  ...props 
}) => {
  const buttonRef = useRef();
  
  // Focus management
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.(e);
    }
  };
  
  return (
    <button
      ref={buttonRef}
      className={`accessible-button accessible-button--${variant}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      {...props}
    >
      {children}
    </button>
  );
};

// ARIA live region for dynamic updates
const LiveRegion = ({ children, politeness = 'polite' }) => {
  return (
    <div
      aria-live={politeness}
      aria-atomic="true"
      className="sr-only"
    >
      {children}
    </div>
  );
};

// Usage in weather updates
const WeatherUpdates = ({ weatherData }) => {
  const [lastUpdate, setLastUpdate] = useState('');
  
  useEffect(() => {
    if (weatherData) {
      const updateMessage = `Weather data updated at ${new Date().toLocaleTimeString()}`;
      setLastUpdate(updateMessage);
    }
  }, [weatherData]);
  
  return (
    <LiveRegion politeness="polite">
      {lastUpdate}
    </LiveRegion>
  );
};
```

### Keyboard Navigation

```javascript
// Keyboard navigation hook
const useKeyboardNavigation = (items, onSelect) => {
  const [focusedIndex, setFocusedIndex] = useState(0);
  
  const handleKeyDown = useCallback((e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setFocusedIndex(prev => (prev + 1) % items.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setFocusedIndex(prev => (prev - 1 + items.length) % items.length);
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        onSelect(items[focusedIndex]);
        break;
      case 'Escape':
        setFocusedIndex(0);
        break;
    }
  }, [items, focusedIndex, onSelect]);
  
  return {
    focusedIndex,
    setFocusedIndex,
    handleKeyDown
  };
};
```

---

## Service Integration Patterns

### Service Worker Integration

```javascript
// Service Worker React hook
const useServiceWorker = () => {
  const [registration, setRegistration] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [updateAvailable, setUpdateAvailable] = useState(false);
  
  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then(reg => setRegistration(reg))
        .catch(err => console.error('SW registration failed:', err));
    }
    
    // Listen for online/offline events
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  const updateServiceWorker = () => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    }
  };
  
  return {
    registration,
    isOnline,
    updateAvailable,
    updateServiceWorker
  };
};

// PWA Status Component
const PWAStatus = () => {
  const { isOnline, updateAvailable, updateServiceWorker } = useServiceWorker();
  
  return (
    <div className="pwa-status">
      <div className={`status-indicator ${isOnline ? 'online' : 'offline'}`}>
        {isOnline ? '🟢 Online' : '🔴 Offline'}
      </div>
      
      {updateAvailable && (
        <button 
          onClick={updateServiceWorker}
          className="update-button"
        >
          Update Available - Click to Refresh
        </button>
      )}
    </div>
  );
};
```

---

## Component Documentation Standards

### Component Documentation Template

```javascript
/**
 * WeatherCard - Displays weather station information in a card layout
 * 
 * @component
 * @param {Object} station - Weather station data object
 * @param {string} station.id - Unique station identifier
 * @param {string} station.name - Display name of the station
 * @param {number} station.temperature - Temperature in Celsius
 * @param {number} station.humidity - Humidity percentage
 * @param {number} station.windSpeed - Wind speed in km/h
 * @param {boolean} [station.isPrimary=false] - Whether this is a primary station
 * @param {string} [className] - Additional CSS classes
 * @param {Function} [onClick] - Click handler function
 * @param {Object} [style] - Inline styles object
 * 
 * @example
 * const station = {
 *   id: 'S121',
 *   name: 'Bukit Timah Nature Reserve',
 *   temperature: 28.5,
 *   humidity: 75,
 *   windSpeed: 8.3,
 *   isPrimary: true
 * };
 * 
 * return (
 *   <WeatherCard 
 *     station={station} 
 *     onClick={handleStationClick}
 *     className="custom-weather-card"
 *   />
 * );
 * 
 * @since 1.0.0
 * @author Singapore Weather Cam Team
 */
const WeatherCard = ({ station, className, onClick, style, ...props }) => {
  // Component implementation
};
```

### PropTypes and TypeScript Integration

```javascript
import PropTypes from 'prop-types';

WeatherCard.propTypes = {
  station: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    temperature: PropTypes.number.isRequired,
    humidity: PropTypes.number.isRequired,
    windSpeed: PropTypes.number.isRequired,
    isPrimary: PropTypes.bool,
    lat: PropTypes.number,
    lng: PropTypes.number
  }).isRequired,
  className: PropTypes.string,
  onClick: PropTypes.func,
  style: PropTypes.object
};

WeatherCard.defaultProps = {
  className: '',
  onClick: null,
  style: {}
};
```

---

*This document is part of the Singapore Weather Cam technical documentation suite. For system architecture overview, see SYSTEM_ARCHITECTURE.md. For design patterns and development guidelines, see DESIGN_PATTERNS.md and DEVELOPMENT_GUIDELINES.md.*