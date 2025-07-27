import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import { useDataLoader } from '../hooks/useDataLoader';
import { useI18n } from '../hooks/useI18n';
import { useAccessibility } from '../hooks/useAccessibility';
import { useOfflineMode } from '../hooks/useOfflineMode';

/**
 * App Context for centralized state management
 * Implements advanced state patterns with accessibility and i18n support
 */
const AppContext = createContext(null);

/**
 * Advanced State Reducer with Accessibility Actions
 */
const appReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
        loadingMessage: action.message || state.loadingMessage,
      };

    case 'SET_ERROR':
      return {
        ...state,
        error: action.payload,
        isLoading: false,
      };

    case 'SET_DATA':
      return {
        ...state,
        weatherData: action.payload.weather || state.weatherData,
        webcamData: action.payload.webcam || state.webcamData,
        isLoading: false,
        error: null,
        lastUpdate: new Date().toISOString(),
      };

    case 'SET_LANGUAGE':
      return {
        ...state,
        language: action.payload,
        isRTL: ['ar', 'he', 'fa'].includes(action.payload),
      };

    case 'SET_ACCESSIBILITY_MODE':
      return {
        ...state,
        accessibility: {
          ...state.accessibility,
          [action.feature]: action.enabled,
        },
      };

    case 'SET_OFFLINE_MODE':
      return {
        ...state,
        isOffline: action.payload,
      };

    case 'UPDATE_PREFERENCES':
      return {
        ...state,
        userPreferences: {
          ...state.userPreferences,
          ...action.payload,
        },
      };

    default:
      return state;
  }
};

/**
 * Initial App State with Comprehensive Settings
 */
const initialState = {
  // Data State
  weatherData: null,
  webcamData: null,
  isLoading: true,
  loadingMessage: 'Initializing Singapore Weather Cam...',
  error: null,
  lastUpdate: null,

  // Internationalization
  language: 'ko',
  isRTL: false,

  // Accessibility Features
  accessibility: {
    highContrast: false,
    reducedMotion: false,
    screenReader: false,
    largeText: false,
    keyboardNavigation: true,
  },

  // User Preferences
  userPreferences: {
    theme: 'light',
    temperatureUnit: 'celsius',
    windSpeedUnit: 'kmh',
    timeFormat: '24h',
    autoRefresh: true,
    notifications: false,
    dataQuality: 'balanced', // 'speed' | 'balanced' | 'quality'
    mapStyle: 'standard',
  },

  // System State
  isOffline: false,
  networkStatus: 'online',
  performanceMode: 'auto', // 'low' | 'auto' | 'high'
};

/**
 * App Provider with Advanced Features
 */
export const AppProvider = ({
  children,
  refreshInterval = 5 * 60 * 1000,
  enableOfflineMode = true,
  enableAnalytics = false,
}) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Advanced Hooks Integration
  const { weatherData, webcamData, loading, error, refresh, forceRefresh } = useDataLoader(refreshInterval);
  const { t, changeLanguage, isRTL } = useI18n(state.language);
  const { announceToScreenReader, setFocusManagement } = useAccessibility();
  const { isOffline, queueAction } = useOfflineMode(enableOfflineMode);

  // Sync data from useDataLoader to app state
  useEffect(() => {
    if (weatherData || webcamData) {
      dispatch({
        type: 'SET_DATA',
        payload: { weather: weatherData, webcam: webcamData },
      });
    }
  }, [weatherData, webcamData]);

  // Sync loading state
  useEffect(() => {
    dispatch({
      type: 'SET_LOADING',
      payload: loading,
      message: loading ? t('common.loading') : null,
    });
  }, [loading, t]);

  // Sync error state
  useEffect(() => {
    if (error) {
      dispatch({
        type: 'SET_ERROR',
        payload: error,
      });

      // Announce errors to screen readers
      announceToScreenReader(
        t('errors.dataLoadFailed', { error: error.message }),
        'assertive',
      );
    }
  }, [error, t, announceToScreenReader]);

  // Sync offline status
  useEffect(() => {
    dispatch({
      type: 'SET_OFFLINE_MODE',
      payload: isOffline,
    });
  }, [isOffline]);

  // Detect accessibility preferences from system
  useEffect(() => {
    const detectAccessibilityPreferences = () => {
      // Detect reduced motion preference
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (prefersReducedMotion) {
        dispatch({
          type: 'SET_ACCESSIBILITY_MODE',
          feature: 'reducedMotion',
          enabled: true,
        });
      }

      // Detect high contrast preference
      const prefersHighContrast = window.matchMedia('(prefers-contrast: high)').matches;
      if (prefersHighContrast) {
        dispatch({
          type: 'SET_ACCESSIBILITY_MODE',
          feature: 'highContrast',
          enabled: true,
        });
      }

      // Detect color scheme preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        dispatch({
          type: 'UPDATE_PREFERENCES',
          payload: { theme: 'dark' },
        });
      }
    };

    detectAccessibilityPreferences();

    // Listen for changes
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const contrastQuery = window.matchMedia('(prefers-contrast: high)');
    const colorQuery = window.matchMedia('(prefers-color-scheme: dark)');

    motionQuery.addEventListener('change', detectAccessibilityPreferences);
    contrastQuery.addEventListener('change', detectAccessibilityPreferences);
    colorQuery.addEventListener('change', detectAccessibilityPreferences);

    return () => {
      motionQuery.removeEventListener('change', detectAccessibilityPreferences);
      contrastQuery.removeEventListener('change', detectAccessibilityPreferences);
      colorQuery.removeEventListener('change', detectAccessibilityPreferences);
    };
  }, []);

  // Advanced Action Handlers
  const actions = {
    // Data Actions
    refreshData: useCallback(async (force = false) => {
      try {
        if (isOffline) {
          queueAction('refresh', { force });
          announceToScreenReader(t('offline.actionQueued'), 'polite');
          return;
        }

        if (force) {
          await forceRefresh();
        } else {
          await refresh();
        }

        announceToScreenReader(t('data.refreshed'), 'polite');
      } catch (error) {
        dispatch({
          type: 'SET_ERROR',
          payload: error,
        });
      }
    }, [isOffline, queueAction, forceRefresh, refresh, announceToScreenReader, t]),

    // Language Actions
    setLanguage: useCallback((language) => {
      changeLanguage(language);
      dispatch({
        type: 'SET_LANGUAGE',
        payload: language,
      });

      // Update document language
      document.documentElement.lang = language;
      document.documentElement.dir = ['ar', 'he', 'fa'].includes(language) ? 'rtl' : 'ltr';

      announceToScreenReader(t('accessibility.languageChanged', { language }), 'polite');
    }, [changeLanguage, announceToScreenReader, t]),

    // Accessibility Actions
    toggleAccessibilityFeature: useCallback((feature, enabled) => {
      dispatch({
        type: 'SET_ACCESSIBILITY_MODE',
        feature,
        enabled,
      });

      // Apply DOM changes for accessibility features
      const body = document.body;
      switch (feature) {
        case 'highContrast':
          body.classList.toggle('high-contrast', enabled);
          break;
        case 'reducedMotion':
          body.classList.toggle('reduced-motion', enabled);
          break;
        case 'largeText':
          body.classList.toggle('large-text', enabled);
          break;
        case 'screenReader':
          setFocusManagement(enabled);
          break;
      }

      announceToScreenReader(
        t(`accessibility.${feature}${enabled ? 'Enabled' : 'Disabled'}`),
        'polite',
      );
    }, [announceToScreenReader, t, setFocusManagement]),

    // User Preferences
    updatePreferences: useCallback((preferences) => {
      dispatch({
        type: 'UPDATE_PREFERENCES',
        payload: preferences,
      });

      // Persist to localStorage
      try {
        localStorage.setItem('swc_preferences', JSON.stringify({
          ...state.userPreferences,
          ...preferences,
        }));
      } catch (error) {
        console.warn('Failed to persist preferences:', error);
      }
    }, [state.userPreferences]),

    // Clear all data and reset
    resetApp: useCallback(() => {
      dispatch({ type: 'SET_DATA', payload: { weather: null, webcam: null } });
      dispatch({ type: 'SET_ERROR', payload: null });
      announceToScreenReader(t('app.reset'), 'polite');
    }, [announceToScreenReader, t]),
  };

  // Load persisted preferences on mount
  useEffect(() => {
    try {
      const persistedPreferences = localStorage.getItem('swc_preferences');
      if (persistedPreferences) {
        const preferences = JSON.parse(persistedPreferences);
        dispatch({
          type: 'UPDATE_PREFERENCES',
          payload: preferences,
        });
      }
    } catch (error) {
      console.warn('Failed to load persisted preferences:', error);
    }
  }, []);

  // Context value with comprehensive state and actions
  const contextValue = {
    // State
    ...state,

    // Computed state
    hasData: !!(state.weatherData || state.webcamData),
    isInitialized: !state.isLoading && !state.error,

    // Actions
    ...actions,

    // Utilities
    t,
    isRTL,

    // Data utilities
    getWeatherStations: useCallback(() => {
      return state.weatherData?.locations || [];
    }, [state.weatherData]),

    getCamerasByRegion: useCallback((region) => {
      return state.webcamData?.captures?.filter(camera =>
        camera.region === region,
      ) || [];
    }, [state.webcamData]),
  };

  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

/**
 * Custom Hook to use App Context
 */
export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

/**
 * Selector Hook for Performance Optimization
 */
export const useAppSelector = (selector) => {
  const context = useApp();
  return selector(context);
};

export default AppProvider;