# Development Guidelines Documentation

## Singapore Weather Cam - Development Standards & Best Practices

### Overview

This document establishes comprehensive development guidelines, coding standards, and best practices for the Singapore Weather Cam project. These guidelines ensure code quality, maintainability, team productivity, and long-term project success.

---

## Code Quality Standards

### 1. Code Style and Formatting

#### ESLint Configuration
```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'react-app',
    'react-app/jest',
    'plugin:jsx-a11y/recommended'
  ],
  plugins: ['jsx-a11y'],
  rules: {
    // React specific rules
    'react/prop-types': 'error',
    'react/no-unused-prop-types': 'error',
    'react/jsx-uses-react': 'error',
    'react/jsx-uses-vars': 'error',
    'react/jsx-key': 'error',
    
    // General JavaScript rules
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-unused-vars': 'error',
    'prefer-const': 'error',
    'no-var': 'error',
    
    // Import rules
    'import/order': ['error', {
      'groups': [
        'builtin',
        'external',
        'internal',
        'parent',
        'sibling',
        'index'
      ],
      'newlines-between': 'always'
    }],
    
    // Accessibility rules
    'jsx-a11y/anchor-is-valid': 'error',
    'jsx-a11y/alt-text': 'error',
    'jsx-a11y/aria-props': 'error',
    'jsx-a11y/aria-proptypes': 'error',
    'jsx-a11y/aria-unsupported-elements': 'error',
    'jsx-a11y/role-has-required-aria-props': 'error',
    'jsx-a11y/role-supports-aria-props': 'error'
  }
};
```

#### Prettier Configuration
```javascript
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "avoid",
  "endOfLine": "lf"
}
```

### 2. Naming Conventions

#### File and Directory Naming
```
// Components - PascalCase
WeatherCard.jsx
TrafficCameraGallery.jsx
SystemFooter.jsx

// Hooks - camelCase starting with 'use'
useWeatherData.js
useServiceWorker.js
usePerformanceMonitor.js

// Utilities - camelCase
dataTransformer.js
errorHandler.js
apiService.js

// Constants - SCREAMING_SNAKE_CASE
API_ENDPOINTS.js
WEATHER_STATIONS.js
CONFIG_VALUES.js

// Test files - match source file with .test suffix
WeatherCard.test.jsx
useWeatherData.test.js
apiService.test.js
```

#### Variable and Function Naming
```javascript
// Variables - camelCase, descriptive names
const weatherStationData = fetchWeatherData();
const isLoadingComplete = false;
const maxRetryAttempts = 3;

// Functions - camelCase, verb-noun pattern
const fetchWeatherData = async () => { };
const validateUserInput = (input) => { };
const transformApiResponse = (response) => { };

// Constants - SCREAMING_SNAKE_CASE
const API_BASE_URL = 'https://api.data.gov.sg';
const DEFAULT_REFRESH_INTERVAL = 5 * 60 * 1000;
const WEATHER_STATION_PRIORITIES = {
  PRIMARY: 1,
  SECONDARY: 2,
  TERTIARY: 3
};

// Component props - camelCase
const WeatherCard = ({ 
  weatherData, 
  isLoading, 
  onStationSelect,
  className 
}) => { };

// Event handlers - handle + EventType pattern
const handleButtonClick = (event) => { };
const handleDataLoad = (data) => { };
const handleError = (error) => { };
```

### 3. Component Development Standards

#### Component Structure Template
```javascript
import React, { useState, useEffect, memo, useCallback } from 'react';
import PropTypes from 'prop-types';

import { useWeatherData } from '../../hooks/useWeatherData';
import { ErrorBoundary } from '../common/ErrorBoundary';
import { LoadingSpinner } from '../common/LoadingSpinner';

import './WeatherCard.css';

/**
 * WeatherCard - Displays weather station information
 * 
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.station - Weather station data
 * @param {string} props.className - Additional CSS classes
 * @param {Function} props.onSelect - Station selection callback
 * @returns {JSX.Element} WeatherCard component
 */
const WeatherCard = memo(({ 
  station, 
  className = '', 
  onSelect,
  ...restProps 
}) => {
  // State hooks
  const [isExpanded, setIsExpanded] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  
  // Custom hooks
  const { isLoading, error } = useWeatherData(station.id);
  
  // Event handlers
  const handleCardClick = useCallback(() => {
    onSelect?.(station);
    setIsExpanded(prev => !prev);
  }, [station, onSelect]);
  
  const handleKeyDown = useCallback((event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleCardClick();
    }
  }, [handleCardClick]);
  
  // Effects
  useEffect(() => {
    setLastUpdate(new Date());
  }, [station.temperature, station.humidity]);
  
  // Early returns for error states
  if (error) {
    return (
      <div className={`weather-card weather-card--error ${className}`}>
        <p>Unable to load weather data</p>
      </div>
    );
  }
  
  // Main render
  return (
    <ErrorBoundary>
      <div
        className={`weather-card ${isExpanded ? 'weather-card--expanded' : ''} ${className}`}
        onClick={handleCardClick}
        onKeyDown={handleKeyDown}
        role="button"
        tabIndex={0}
        aria-label={`Weather data for ${station.name}`}
        aria-expanded={isExpanded}
        {...restProps}
      >
        <header className="weather-card__header">
          <h3 className="weather-card__title">{station.name}</h3>
          {station.isPrimary && (
            <span className="weather-card__badge">PRIMARY</span>
          )}
        </header>
        
        <div className="weather-card__content">
          <div className="weather-card__temperature">
            {station.temperature}°C
          </div>
          
          {isExpanded && (
            <div className="weather-card__details">
              <div className="weather-card__metric">
                <span className="weather-card__label">Humidity:</span>
                <span className="weather-card__value">{station.humidity}%</span>
              </div>
              <div className="weather-card__metric">
                <span className="weather-card__label">Wind Speed:</span>
                <span className="weather-card__value">{station.windSpeed} km/h</span>
              </div>
            </div>
          )}
        </div>
        
        {isLoading && <LoadingSpinner size="small" />}
      </div>
    </ErrorBoundary>
  );
});

WeatherCard.displayName = 'WeatherCard';

WeatherCard.propTypes = {
  station: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    temperature: PropTypes.number.isRequired,
    humidity: PropTypes.number.isRequired,
    windSpeed: PropTypes.number.isRequired,
    isPrimary: PropTypes.bool
  }).isRequired,
  className: PropTypes.string,
  onSelect: PropTypes.func
};

WeatherCard.defaultProps = {
  className: '',
  onSelect: null
};

export default WeatherCard;
```

#### Hook Development Standards
```javascript
import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook for managing weather data
 * 
 * @param {string} stationId - Weather station ID
 * @param {Object} options - Hook options
 * @param {number} options.refreshInterval - Refresh interval in milliseconds
 * @param {boolean} options.autoRefresh - Enable auto refresh
 * @returns {Object} Weather data state and actions
 */
export const useWeatherData = (stationId, options = {}) => {
  const {
    refreshInterval = 5 * 60 * 1000,
    autoRefresh = true
  } = options;
  
  // State
  const [state, setState] = useState({
    data: null,
    isLoading: true,
    error: null,
    lastFetch: null
  });
  
  // Refs for cleanup
  const abortControllerRef = useRef();
  const intervalRef = useRef();
  
  // Fetch function
  const fetchData = useCallback(async () => {
    try {
      // Cancel previous request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Create new abort controller
      abortControllerRef.current = new AbortController();
      
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      
      const response = await fetch(
        `/data/weather/stations/${stationId}.json`,
        { signal: abortControllerRef.current.signal }
      );
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      setState({
        data,
        isLoading: false,
        error: null,
        lastFetch: Date.now()
      });
      
    } catch (error) {
      if (error.name !== 'AbortError') {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: error.message
        }));
      }
    }
  }, [stationId]);
  
  // Initial fetch
  useEffect(() => {
    if (stationId) {
      fetchData();
    }
  }, [stationId, fetchData]);
  
  // Auto refresh
  useEffect(() => {
    if (autoRefresh && stationId) {
      intervalRef.current = setInterval(fetchData, refreshInterval);
      
      return () => {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
        }
      };
    }
  }, [autoRefresh, stationId, fetchData, refreshInterval]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
  
  // Return API
  return {
    ...state,
    refetch: fetchData,
    isStale: state.lastFetch && Date.now() - state.lastFetch > refreshInterval
  };
};
```

---

## Testing Standards

### 1. Testing Strategy

#### Testing Pyramid
```
E2E Tests (10%)
├── Critical user journeys
├── Cross-browser compatibility
└── Performance testing

Integration Tests (20%)
├── Component integration
├── API integration
├── State management
└── Service integration

Unit Tests (70%)
├── Component logic
├── Utility functions
├── Custom hooks
└── Service methods
```

#### Test File Organization
```
src/
├── components/
│   ├── WeatherCard/
│   │   ├── WeatherCard.jsx
│   │   ├── WeatherCard.test.jsx
│   │   ├── WeatherCard.stories.jsx
│   │   └── __snapshots__/
├── hooks/
│   ├── useWeatherData.js
│   └── useWeatherData.test.js
├── services/
│   ├── apiService.js
│   └── apiService.test.js
└── tests/
    ├── integration/
    ├── e2e/
    ├── setup.js
    └── helpers/
```

### 2. Unit Testing Standards

#### Component Testing Template
```javascript
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jest } from '@jest/globals';

import WeatherCard from './WeatherCard';
import { WeatherDataFactory } from '../../tests/factories';

// Mock dependencies
jest.mock('../../hooks/useWeatherData');

describe('WeatherCard', () => {
  // Test data setup
  const mockStation = WeatherDataFactory.createStation({
    id: 'S121',
    name: 'Test Station',
    temperature: 28.5,
    humidity: 75,
    windSpeed: 8.3,
    isPrimary: true
  });
  
  const defaultProps = {
    station: mockStation,
    onSelect: jest.fn()
  };
  
  // Reset mocks before each test
  beforeEach(() => {
    jest.clearAllMocks();
  });
  
  describe('Rendering', () => {
    it('renders station name and temperature', () => {
      render(<WeatherCard {...defaultProps} />);
      
      expect(screen.getByText('Test Station')).toBeInTheDocument();
      expect(screen.getByText('28.5°C')).toBeInTheDocument();
    });
    
    it('displays PRIMARY badge for primary stations', () => {
      render(<WeatherCard {...defaultProps} />);
      
      expect(screen.getByText('PRIMARY')).toBeInTheDocument();
    });
    
    it('applies custom className', () => {
      const { container } = render(
        <WeatherCard {...defaultProps} className="custom-class" />
      );
      
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });
  
  describe('Interactions', () => {
    it('calls onSelect when card is clicked', async () => {
      const user = userEvent.setup();
      render(<WeatherCard {...defaultProps} />);
      
      await user.click(screen.getByRole('button'));
      
      expect(defaultProps.onSelect).toHaveBeenCalledWith(mockStation);
    });
    
    it('expands details when clicked', async () => {
      const user = userEvent.setup();
      render(<WeatherCard {...defaultProps} />);
      
      await user.click(screen.getByRole('button'));
      
      expect(screen.getByText('Humidity:')).toBeInTheDocument();
      expect(screen.getByText('75%')).toBeInTheDocument();
    });
    
    it('handles keyboard navigation', async () => {
      const user = userEvent.setup();
      render(<WeatherCard {...defaultProps} />);
      
      const card = screen.getByRole('button');
      card.focus();
      
      await user.keyboard('{Enter}');
      
      expect(defaultProps.onSelect).toHaveBeenCalledWith(mockStation);
    });
  });
  
  describe('Accessibility', () => {
    it('has proper ARIA attributes', () => {
      render(<WeatherCard {...defaultProps} />);
      
      const card = screen.getByRole('button');
      
      expect(card).toHaveAttribute('aria-label', 'Weather data for Test Station');
      expect(card).toHaveAttribute('aria-expanded', 'false');
      expect(card).toHaveAttribute('tabIndex', '0');
    });
    
    it('updates aria-expanded when expanded', async () => {
      const user = userEvent.setup();
      render(<WeatherCard {...defaultProps} />);
      
      const card = screen.getByRole('button');
      await user.click(card);
      
      expect(card).toHaveAttribute('aria-expanded', 'true');
    });
  });
  
  describe('Error Handling', () => {
    it('displays error state when data loading fails', () => {
      const mockUseWeatherData = require('../../hooks/useWeatherData');
      mockUseWeatherData.useWeatherData.mockReturnValue({
        isLoading: false,
        error: 'Network error'
      });
      
      render(<WeatherCard {...defaultProps} />);
      
      expect(screen.getByText('Unable to load weather data')).toBeInTheDocument();
    });
  });
});
```

#### Hook Testing Template
```javascript
import { renderHook, waitFor } from '@testing-library/react';
import { jest } from '@jest/globals';

import { useWeatherData } from './useWeatherData';

// Mock fetch
global.fetch = jest.fn();

describe('useWeatherData', () => {
  beforeEach(() => {
    fetch.mockClear();
  });
  
  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  it('fetches weather data on mount', async () => {
    const mockData = { temperature: 25, humidity: 70 };
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockData
    });
    
    const { result } = renderHook(() => useWeatherData('S121'));
    
    expect(result.current.isLoading).toBe(true);
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.data).toEqual(mockData);
    expect(result.current.error).toBeNull();
  });
  
  it('handles fetch errors', async () => {
    fetch.mockRejectedValueOnce(new Error('Network error'));
    
    const { result } = renderHook(() => useWeatherData('S121'));
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.error).toBe('Network error');
    expect(result.current.data).toBeNull();
  });
  
  it('refetches data when refetch is called', async () => {
    const initialData = { temperature: 25 };
    const updatedData = { temperature: 30 };
    
    fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => initialData
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => updatedData
      });
    
    const { result } = renderHook(() => useWeatherData('S121'));
    
    await waitFor(() => {
      expect(result.current.data).toEqual(initialData);
    });
    
    result.current.refetch();
    
    await waitFor(() => {
      expect(result.current.data).toEqual(updatedData);
    });
  });
});
```

### 3. Integration Testing Standards

```javascript
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import App from '../App';
import { AppProvider } from '../contexts/AppProvider';
import { WeatherDataFactory } from '../tests/factories';

// Mock API calls
global.fetch = jest.fn();

const AppWithProviders = ({ children }) => (
  <AppProvider>
    {children}
  </AppProvider>
);

describe('Weather Data Flow Integration', () => {
  beforeEach(() => {
    fetch.mockClear();
  });
  
  it('loads weather data and displays in dashboard', async () => {
    const mockWeatherData = WeatherDataFactory.createWeatherData();
    
    fetch.mockResolvedValue({
      ok: true,
      json: async () => mockWeatherData
    });
    
    render(
      <AppWithProviders>
        <App />
      </AppWithProviders>
    );
    
    // Initial loading state
    expect(screen.getByText(/데이터를 불러오는 중/)).toBeInTheDocument();
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.queryByText(/데이터를 불러오는 중/)).not.toBeInTheDocument();
    });
    
    // Verify weather stations are displayed
    mockWeatherData.stations.forEach(station => {
      expect(screen.getByText(station.name)).toBeInTheDocument();
    });
  });
  
  it('handles tab navigation between sections', async () => {
    const user = userEvent.setup();
    
    render(
      <AppWithProviders>
        <App />
      </AppWithProviders>
    );
    
    // Click webcam tab
    await user.click(screen.getByText(/웹캠/));
    
    expect(screen.getByText(/교통 카메라/)).toBeInTheDocument();
    
    // Click map tab
    await user.click(screen.getByText(/지도/));
    
    expect(screen.getByText(/지도 뷰/)).toBeInTheDocument();
  });
});
```

---

## State Management Guidelines

### 1. Context API Best Practices

#### Context Structure
```javascript
// src/contexts/AppDataContext.jsx
import React, { createContext, useContext, useReducer, useCallback } from 'react';

// Initial state
const initialState = {
  weather: {
    data: null,
    isLoading: false,
    error: null,
    lastUpdate: null
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
  }
};

// Action types
const ActionTypes = {
  // Weather actions
  WEATHER_LOADING: 'WEATHER_LOADING',
  WEATHER_SUCCESS: 'WEATHER_SUCCESS',
  WEATHER_ERROR: 'WEATHER_ERROR',
  
  // Webcam actions
  WEBCAM_LOADING: 'WEBCAM_LOADING',
  WEBCAM_SUCCESS: 'WEBCAM_SUCCESS',
  WEBCAM_ERROR: 'WEBCAM_ERROR',
  WEBCAM_SELECT_CAMERA: 'WEBCAM_SELECT_CAMERA',
  
  // UI actions
  UI_SET_ACTIVE_TAB: 'UI_SET_ACTIVE_TAB',
  UI_TOGGLE_SIDEBAR: 'UI_TOGGLE_SIDEBAR',
  UI_SET_THEME: 'UI_SET_THEME'
};

// Reducer
const appDataReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.WEATHER_LOADING:
      return {
        ...state,
        weather: { ...state.weather, isLoading: true, error: null }
      };
      
    case ActionTypes.WEATHER_SUCCESS:
      return {
        ...state,
        weather: {
          data: action.payload,
          isLoading: false,
          error: null,
          lastUpdate: Date.now()
        }
      };
      
    case ActionTypes.WEATHER_ERROR:
      return {
        ...state,
        weather: { ...state.weather, isLoading: false, error: action.payload }
      };
      
    default:
      return state;
  }
};

// Context
const AppDataContext = createContext();

// Provider component
export const AppDataProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appDataReducer, initialState);
  
  // Action creators
  const actions = {
    setWeatherLoading: useCallback(() => {
      dispatch({ type: ActionTypes.WEATHER_LOADING });
    }, []),
    
    setWeatherData: useCallback((data) => {
      dispatch({ type: ActionTypes.WEATHER_SUCCESS, payload: data });
    }, []),
    
    setWeatherError: useCallback((error) => {
      dispatch({ type: ActionTypes.WEATHER_ERROR, payload: error });
    }, []),
    
    setActiveTab: useCallback((tab) => {
      dispatch({ type: ActionTypes.UI_SET_ACTIVE_TAB, payload: tab });
    }, [])
  };
  
  const contextValue = {
    state,
    actions
  };
  
  return (
    <AppDataContext.Provider value={contextValue}>
      {children}
    </AppDataContext.Provider>
  );
};

// Custom hook for consuming context
export const useAppData = () => {
  const context = useContext(AppDataContext);
  
  if (!context) {
    throw new Error('useAppData must be used within an AppDataProvider');
  }
  
  return context;
};
```

### 2. Custom Hook Guidelines

#### Hook Composition Pattern
```javascript
// Composite hook that combines multiple concerns
export const useWeatherDashboard = () => {
  // Individual hooks
  const { weatherData, isLoading, error, refetch } = useWeatherData();
  const { selectedStation, setSelectedStation } = useStationSelection();
  const { alerts } = useWeatherAlerts();
  const { isOnline } = useNetworkStatus();
  
  // Derived state
  const hasData = weatherData && weatherData.stations.length > 0;
  const primaryStations = weatherData?.stations.filter(s => s.isPrimary) || [];
  const canRefresh = !isLoading && isOnline;
  
  // Combined actions
  const refreshData = useCallback(async () => {
    if (canRefresh) {
      await refetch();
    }
  }, [canRefresh, refetch]);
  
  const selectStation = useCallback((station) => {
    setSelectedStation(station);
    // Additional logic like analytics tracking
    trackStationSelection(station.id);
  }, [setSelectedStation]);
  
  // Return consolidated API
  return {
    // Data
    weatherData,
    selectedStation,
    primaryStations,
    alerts,
    
    // State
    isLoading,
    error,
    hasData,
    isOnline,
    canRefresh,
    
    // Actions
    refreshData,
    selectStation,
    setSelectedStation
  };
};
```

---

## Performance Best Practices

### 1. Component Optimization

#### Memoization Strategy
```javascript
import React, { memo, useMemo, useCallback } from 'react';

// Memoize expensive calculations
const WeatherChart = memo(({ weatherData, timeRange }) => {
  const chartData = useMemo(() => {
    return processWeatherDataForChart(weatherData, timeRange);
  }, [weatherData, timeRange]);
  
  const chartOptions = useMemo(() => ({
    responsive: true,
    plugins: {
      legend: { position: 'top' },
      title: { display: true, text: 'Weather Trends' }
    }
  }), []);
  
  return <Chart data={chartData} options={chartOptions} />;
});

// Memoize callback functions
const WeatherStationList = ({ stations, onStationSelect }) => {
  const handleStationClick = useCallback((station) => {
    onStationSelect(station);
  }, [onStationSelect]);
  
  return (
    <div className="station-list">
      {stations.map(station => (
        <WeatherCard
          key={station.id}
          station={station}
          onClick={handleStationClick}
        />
      ))}
    </div>
  );
};
```

#### Lazy Loading Implementation
```javascript
import { lazy, Suspense } from 'react';

// Lazy load heavy components
const MapView = lazy(() => import('./components/map/MapView'));
const AnalyticsPanel = lazy(() => import('./components/analytics/AnalyticsPanel'));

// Loading fallback component
const ComponentLoader = ({ message = 'Loading...' }) => (
  <div className="component-loader">
    <div className="spinner" />
    <p>{message}</p>
  </div>
);

// Main app with lazy loading
const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const renderTabContent = () => {
    switch (activeTab) {
      case 'map':
        return (
          <Suspense fallback={<ComponentLoader message="Loading map..." />}>
            <MapView />
          </Suspense>
        );
      case 'analytics':
        return (
          <Suspense fallback={<ComponentLoader message="Loading analytics..." />}>
            <AnalyticsPanel />
          </Suspense>
        );
      default:
        return <Dashboard />;
    }
  };
  
  return (
    <div className="app">
      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />
      {renderTabContent()}
    </div>
  );
};
```

### 2. Bundle Optimization

#### Dynamic Imports
```javascript
// Dynamic imports for code splitting
const loadAnalyticsModule = async () => {
  const { AnalyticsService } = await import('./services/analytics');
  return new AnalyticsService();
};

const loadChartLibrary = async () => {
  const ChartJS = await import('chart.js');
  return ChartJS;
};

// Conditional loading based on features
const WeatherChart = ({ data, chartType }) => {
  const [ChartComponent, setChartComponent] = useState(null);
  
  useEffect(() => {
    const loadChart = async () => {
      const { Chart } = await loadChartLibrary();
      setChartComponent(() => Chart);
    };
    
    if (data && data.length > 0) {
      loadChart();
    }
  }, [data]);
  
  if (!ChartComponent) {
    return <div>Loading chart...</div>;
  }
  
  return <ChartComponent data={data} type={chartType} />;
};
```

---

## Accessibility Guidelines

### 1. Component Accessibility Standards

#### ARIA Implementation
```javascript
const AccessibleButton = ({ 
  children, 
  onClick, 
  disabled = false,
  ariaLabel,
  ariaPressed,
  variant = 'primary',
  ...props 
}) => {
  const buttonRef = useRef();
  
  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onClick?.(event);
    }
  };
  
  return (
    <button
      ref={buttonRef}
      className={`btn btn--${variant}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-pressed={ariaPressed}
      aria-disabled={disabled}
      tabIndex={disabled ? -1 : 0}
      {...props}
    >
      {children}
    </button>
  );
};

const AccessibleModal = ({ isOpen, onClose, title, children }) => {
  const modalRef = useRef();
  const previousFocusRef = useRef();
  
  useEffect(() => {
    if (isOpen) {
      previousFocusRef.current = document.activeElement;
      modalRef.current?.focus();
    } else {
      previousFocusRef.current?.focus();
    }
  }, [isOpen]);
  
  const handleKeyDown = (event) => {
    if (event.key === 'Escape') {
      onClose();
    }
  };
  
  if (!isOpen) return null;
  
  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        ref={modalRef}
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        <header className="modal-header">
          <h2 id="modal-title">{title}</h2>
          <button
            className="modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>
        </header>
        <div className="modal-body">
          {children}
        </div>
      </div>
    </div>
  );
};
```

#### Keyboard Navigation
```javascript
const useKeyboardNavigation = (items, onSelect) => {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const itemRefs = useRef([]);
  
  const handleKeyDown = useCallback((event) => {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        setFocusedIndex(prev => (prev + 1) % items.length);
        break;
        
      case 'ArrowUp':
        event.preventDefault();
        setFocusedIndex(prev => (prev - 1 + items.length) % items.length);
        break;
        
      case 'Home':
        event.preventDefault();
        setFocusedIndex(0);
        break;
        
      case 'End':
        event.preventDefault();
        setFocusedIndex(items.length - 1);
        break;
        
      case 'Enter':
      case ' ':
        event.preventDefault();
        onSelect(items[focusedIndex]);
        break;
        
      case 'Escape':
        setFocusedIndex(-1);
        break;
    }
  }, [items, focusedIndex, onSelect]);
  
  useEffect(() => {
    if (focusedIndex >= 0 && itemRefs.current[focusedIndex]) {
      itemRefs.current[focusedIndex].focus();
    }
  }, [focusedIndex]);
  
  return {
    focusedIndex,
    setFocusedIndex,
    handleKeyDown,
    itemRefs
  };
};
```

---

## Security Best Practices

### 1. Input Validation and Sanitization

```javascript
// Input validation utilities
const validateInput = {
  email: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },
  
  stationId: (id) => {
    const stationIdRegex = /^S\d{3}$/;
    return stationIdRegex.test(id);
  },
  
  temperature: (temp) => {
    const num = parseFloat(temp);
    return !isNaN(num) && num >= -50 && num <= 100;
  },
  
  coordinates: (lat, lng) => {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    return !isNaN(latitude) && !isNaN(longitude) &&
           latitude >= -90 && latitude <= 90 &&
           longitude >= -180 && longitude <= 180;
  }
};

// Sanitization utilities
const sanitizeInput = {
  text: (input) => {
    if (typeof input !== 'string') return '';
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<[^>]*>/g, '')
      .trim()
      .substring(0, 1000);
  },
  
  number: (input, min = -Infinity, max = Infinity) => {
    const num = parseFloat(input);
    if (isNaN(num)) return null;
    return Math.max(min, Math.min(max, num));
  },
  
  url: (input) => {
    try {
      const url = new URL(input);
      return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null;
    } catch {
      return null;
    }
  }
};

// Secure form component
const SecureForm = ({ onSubmit, children }) => {
  const handleSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const sanitizedData = {};
    
    for (const [key, value] of formData.entries()) {
      sanitizedData[key] = sanitizeInput.text(value);
    }
    
    onSubmit(sanitizedData);
  };
  
  return (
    <form onSubmit={handleSubmit} noValidate>
      {children}
    </form>
  );
};
```

### 2. Environment Configuration

```javascript
// Environment configuration
const config = {
  development: {
    apiUrl: 'http://localhost:3001/api',
    logLevel: 'debug',
    enableDevTools: true,
    mockData: true
  },
  
  staging: {
    apiUrl: 'https://staging-api.weathercam.sg/api',
    logLevel: 'info',
    enableDevTools: false,
    mockData: false
  },
  
  production: {
    apiUrl: 'https://api.weathercam.sg/api',
    logLevel: 'error',
    enableDevTools: false,
    mockData: false
  }
};

const getConfig = () => {
  const env = process.env.NODE_ENV || 'development';
  return config[env];
};

export default getConfig();
```

---

## Git Workflow Standards

### 1. Branch Naming Convention

```bash
# Feature branches
feature/weather-alerts-system
feature/mobile-responsive-design
feature/performance-optimization

# Bug fix branches
bugfix/webcam-loading-error
bugfix/temperature-display-issue

# Hotfix branches
hotfix/critical-security-patch
hotfix/production-data-fix

# Release branches
release/v1.2.0
release/v1.3.0-beta
```

### 2. Commit Message Standards

```bash
# Format: <type>(<scope>): <description>

# Types:
feat: Add new weather alert system
fix: Resolve webcam image loading issue
docs: Update API documentation
style: Format code with prettier
refactor: Simplify weather data processing
test: Add unit tests for WeatherCard component
chore: Update dependencies
perf: Optimize bundle size
security: Fix XSS vulnerability

# Examples with scope:
feat(weather): Add temperature trend analysis
fix(webcam): Handle camera offline state
docs(api): Document webhook endpoints
test(components): Add accessibility tests
```

### 3. Pull Request Guidelines

#### PR Template
```markdown
## Description
Brief description of changes and motivation.

## Type of Change
- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Testing
- [ ] Unit tests pass
- [ ] Integration tests pass
- [ ] Manual testing completed
- [ ] Accessibility testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Code is commented where needed
- [ ] Documentation updated
- [ ] No console errors
- [ ] Performance impact assessed

## Screenshots
(If applicable)

## Related Issues
Closes #123
```

---

*This document is part of the Singapore Weather Cam technical documentation suite. For system architecture details, see SYSTEM_ARCHITECTURE.md. For component patterns, see COMPONENT_ARCHITECTURE.md and DESIGN_PATTERNS.md.*