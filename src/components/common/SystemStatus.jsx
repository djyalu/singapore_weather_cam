/**
 * SystemStatus Component
 * Compact horizontal system health indicator for the top of the page
 * Shows key metrics: last update time, weather data status, webcam status
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { Clock, CloudSun, Camera, Wifi, AlertTriangle, RefreshCw, Zap, X } from 'lucide-react';
import { INTERVALS, TIMEOUTS, UI_CONFIG, LIMITS, A11Y_CONFIG } from '../../config/constants';
import { getLocalizedString, UI_STRINGS } from '../../config/localization';
import SkeletonLoader from './SkeletonLoader.jsx';
import { NetworkError, DataError, ErrorUtils } from './ErrorComponents.jsx';
import { announceToScreenReader } from '../../utils/accessibility.js';

const SystemStatus = React.memo(({
  lastFetch = null,
  weatherData = null,
  webcamData = null,
  reliabilityMetrics = {},
  error = null,
  isRefreshing = false,
  isLoading = false,
  onRefresh = null,
  onForceRefresh = null,
  retryAttempts = 0,
  maxRetries = 3,
}) => {
  // Debug logging in development
  if (import.meta.env.MODE === 'development') {
    console.log('🚦 SystemStatus props:', {
      lastFetch,
      hasWeatherData: !!weatherData,
      hasWebcamData: !!webcamData,
      weatherDataKeys: weatherData ? Object.keys(weatherData) : [],
      webcamDataKeys: webcamData ? Object.keys(webcamData) : [],
      reliabilityMetrics,
      error,
      isRefreshing,
      isLoading
    });
  }

  const [dismissedErrors, setDismissedErrors] = useState(new Set());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastOnlineTime, setLastOnlineTime] = useState(Date.now());
  const [statusAnnouncement, setStatusAnnouncement] = useState('');
  const [focusedStatusIndex, setFocusedStatusIndex] = useState(-1);

  // Refs for focus management
  const statusContainerRef = useRef(null);
  const refreshButtonRef = useRef(null);
  const statusIndicatorsRef = useRef([]);

  // Monitor network status with accessibility announcements
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setLastOnlineTime(Date.now());
      announceToScreenReader('Connection restored', 'polite');
      setStatusAnnouncement('Connection restored');
    };

    const handleOffline = () => {
      setIsOnline(false);
      announceToScreenReader('Connection lost', 'assertive');
      setStatusAnnouncement('Connection lost');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Announce status changes to screen readers
  useEffect(() => {
    if (error) {
      announceToScreenReader(`System error: ${ErrorUtils.getFriendlyMessage(error)}`, 'assertive');
      setStatusAnnouncement(`Error: ${ErrorUtils.getFriendlyMessage(error)}`);
    } else if (isRefreshing) {
      announceToScreenReader('Refreshing data', 'polite');
      setStatusAnnouncement('Refreshing system data');
    }
  }, [error, isRefreshing]);

  // Auto-retry with exponential backoff - memoized
  const createRetryHandler = useCallback((originalHandler) => {
    if (!originalHandler) {return null;}

    return ErrorUtils.createRetryFunction(originalHandler, maxRetries);
  }, [maxRetries]);

  // Calculate time since last update - memoized
  const getTimeSinceUpdate = useMemo(() => {
    if (!lastFetch) {return 'No data';}

    const now = new Date();
    const diffMinutes = Math.floor((now - lastFetch) / (1000 * 60));

    if (diffMinutes < 1) {return 'Just now';}
    if (diffMinutes < 60) {return `${diffMinutes}m ago`;}

    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours}h ago`;
  }, [lastFetch]);

  // Determine overall system status
  const getSystemStatus = () => {
    if (error) {return 'error';}
    if (isRefreshing) {return 'updating';}
    if (!weatherData || !webcamData) {return 'loading';}

    const weatherAge = weatherData?.reliabilityMetadata?.dataAge || 0;
    const webcamAge = webcamData?.reliabilityMetadata?.dataAge || 0;
    const maxAge = Math.max(weatherAge, webcamAge);

    if (maxAge > INTERVALS.SYSTEM_HEALTH_CHECK * 6) {return 'stale';} // > 30 minutes
    if (maxAge > INTERVALS.SYSTEM_HEALTH_CHECK * 3) {return 'warning';} // > 15 minutes

    return 'healthy';
  };

  // Get weather data status - with safety checks
  const getWeatherStatus = useCallback(() => {
    try {
      if (!weatherData) {
        // Debug logging in development
        if (import.meta.env.MODE === 'development') {
          console.log('🌤️ WeatherStatus: No weatherData provided', { weatherData });
        }
        return 'offline';
      }

      const quality = reliabilityMetrics?.weatherQuality;
      const dataAge = weatherData?.reliabilityMetadata?.dataAge || 0;

      if (dataAge > INTERVALS.SYSTEM_HEALTH_CHECK * 6) {return 'stale';}
      if (quality && quality < LIMITS.MIN_DATA_QUALITY) {return 'degraded';}

      // Debug logging in development
      if (import.meta.env.MODE === 'development') {
        console.log('🌤️ WeatherStatus: online', { 
          hasData: !!weatherData, 
          dataAge, 
          quality,
          locations: weatherData?.locations?.length
        });
      }

      return 'online';
    } catch (error) {
      // Use safe logging for production
      if (import.meta.env.MODE === 'development') {
        console.warn('getWeatherStatus error:', error);
      }
      return 'offline';
    }
  }, [weatherData, reliabilityMetrics]);

  // Get webcam data status - with safety checks
  const getWebcamStatus = useCallback(() => {
    try {
      if (!webcamData) {
        // Debug logging in development
        if (import.meta.env.MODE === 'development') {
          console.log('📷 WebcamStatus: No webcamData provided', { webcamData });
        }
        return 'offline';
      }

      const quality = reliabilityMetrics?.webcamQuality;
      const dataAge = webcamData?.reliabilityMetadata?.dataAge || 0;

      if (dataAge > INTERVALS.SYSTEM_HEALTH_CHECK * 6) {return 'stale';}
      if (quality && quality < LIMITS.MIN_DATA_QUALITY) {return 'degraded';}

      // Debug logging in development
      if (import.meta.env.MODE === 'development') {
        console.log('📷 WebcamStatus: online', { 
          hasData: !!webcamData, 
          dataAge, 
          quality,
          captures: webcamData?.captures?.length
        });
      }

      return 'online';
    } catch (error) {
      // Use safe logging for production
      if (import.meta.env.MODE === 'development') {
        console.warn('getWebcamStatus error:', error);
      }
      return 'offline';
    }
  }, [webcamData, reliabilityMetrics]);

  // Enhanced error handling - memoized
  const handleDismissError = useCallback((errorId) => {
    setDismissedErrors(prev => new Set([...prev, errorId]));
  }, []);

  const shouldShowError = (errorId) => {
    return !dismissedErrors.has(errorId);
  };

  const enhancedOnRefresh = createRetryHandler(onRefresh);
  const enhancedOnForceRefresh = createRetryHandler(onForceRefresh);

  // Determine error state
  const getErrorState = () => {
    if (!isOnline) {
      return {
        type: 'network',
        severity: 'error',
        message: 'Device is offline',
        showRetry: false,
      };
    }

    if (error) {
      const errorCategory = ErrorUtils.categorizeError(error);
      return {
        type: errorCategory,
        severity: errorCategory === 'network' ? 'warning' : 'error',
        message: ErrorUtils.getFriendlyMessage(error),
        showRetry: ErrorUtils.isRecoverable(error),
      };
    }

    if (retryAttempts > 0 && retryAttempts < maxRetries) {
      return {
        type: 'retry',
        severity: 'warning',
        message: `Attempting to reconnect... (${retryAttempts}/${maxRetries})`,
        showRetry: false,
      };
    }

    if (retryAttempts >= maxRetries) {
      return {
        type: 'max_retries',
        severity: 'error',
        message: 'Maximum retry attempts exceeded',
        showRetry: true,
      };
    }

    return null;
  };

  // Enhanced keyboard navigation for status indicators - moved before early returns
  const handleStatusKeydown = useCallback((event, index) => {
    const indicators = statusIndicatorsRef.current.filter(Boolean);

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown': {
        event.preventDefault();
        const nextIndex = (index + 1) % indicators.length;
        indicators[nextIndex]?.focus();
        setFocusedStatusIndex(nextIndex);
        break;
      }
      case 'ArrowLeft':
      case 'ArrowUp': {
        event.preventDefault();
        const prevIndex = index === 0 ? indicators.length - 1 : index - 1;
        indicators[prevIndex]?.focus();
        setFocusedStatusIndex(prevIndex);
        break;
      }
      case 'Home': {
        event.preventDefault();
        indicators[0]?.focus();
        setFocusedStatusIndex(0);
        break;
      }
      case 'End': {
        event.preventDefault();
        const lastIndex = indicators.length - 1;
        indicators[lastIndex]?.focus();
        setFocusedStatusIndex(lastIndex);
        break;
      }
      default:
        break;
    }
  }, []);

  const errorState = getErrorState();
  const weatherStatus = getWeatherStatus();
  const webcamStatus = getWebcamStatus();
  const timeSinceUpdate = getTimeSinceUpdate;

  // Show loading skeleton if initial loading
  if (isLoading) {
    return (
      <div className="bg-neutral-50 border-b border-neutral-200 px-2 sm:px-4 py-3 sm:py-2">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
            {/* Time skeleton */}
            <div className="flex items-center justify-between sm:justify-start">
              <div className="flex items-center text-xs text-neutral-600">
                <Clock className="w-4 h-4 sm:w-3 sm:h-3 mr-2 sm:mr-1 animate-pulse-slow" />
                <SkeletonLoader.Element height="0.875rem" width="6rem" delay={0} />
              </div>
            </div>

            {/* Status indicators skeleton */}
            <div className="flex items-center justify-between sm:justify-end">
              <div className="flex items-center space-x-2 sm:space-x-2 animate-stagger-in">
                <SkeletonLoader.Patterns.StatusIndicator delay={0} />
                <SkeletonLoader.Patterns.StatusIndicator delay={50} />
                <div className="hidden xs:block">
                  <SkeletonLoader.Patterns.StatusIndicator delay={100} />
                </div>
              </div>

              {/* Refresh controls skeleton */}
              <div className="flex items-center space-x-1 ml-2">
                <SkeletonLoader.Button size="sm" width="3rem" delay={150} />
                <SkeletonLoader.Button size="sm" width="3rem" delay={200} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Status indicator component with enhanced accessibility
  const StatusIndicator = ({ status, icon: Icon, label, tooltip, index }) => {
    const getStatusColor = (status) => {
      switch (status) {
        case 'online':
        case 'healthy':
          return 'text-green-600 bg-green-50 hover:bg-green-100 focus:bg-green-100';
        case 'degraded':
        case 'warning':
          return 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100 focus:bg-yellow-100';
        case 'stale':
          return 'text-orange-600 bg-orange-50 hover:bg-orange-100 focus:bg-orange-100';
        case 'offline':
        case 'error':
          return 'text-red-600 bg-red-50 hover:bg-red-100 focus:bg-red-100';
        case 'loading':
        case 'updating':
          return 'text-blue-600 bg-blue-50 animate-pulse-gentle';
        default:
          return 'text-gray-500 bg-gray-50 hover:bg-gray-100 focus:bg-gray-100';
      }
    };

    const getStatusDescription = (status) => {
      switch (status) {
        case 'online':
        case 'healthy':
          return getLocalizedString('STATUS_OPERATING_NORMALLY');
        case 'degraded':
        case 'warning':
          return getLocalizedString('STATUS_EXPERIENCING_ISSUES');
        case 'stale':
          return getLocalizedString('STATUS_DATA_OUTDATED');
        case 'offline':
        case 'error':
          return getLocalizedString('STATUS_NOT_AVAILABLE');
        case 'loading':
        case 'updating':
          return getLocalizedString('STATUS_CURRENTLY_UPDATING');
        default:
          return getLocalizedString('STATUS_UNKNOWN');
      }
    };

    return (
      <div
        ref={(el) => { statusIndicatorsRef.current[index] = el; }}
        className={`
          flex items-center px-3 py-2 rounded-lg text-xs font-medium 
          status-transition hover-lift
          justify-center sm:justify-start sm:px-2 sm:py-1 sm:min-h-auto sm:min-w-auto
          active:scale-95 touch-manipulation cursor-pointer
          animate-fade-in
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          ${getStatusColor(status)}
        `}
        style={{
          minHeight: `${UI_CONFIG.MIN_TOUCH_TARGET}px`,
          minWidth: `${UI_CONFIG.MIN_TOUCH_TARGET}px`,
        }}
        title={tooltip}
        role="button"
        tabIndex="0"
        aria-label={`${label} status: ${status}. ${getStatusDescription(status)}`}
        aria-describedby={`status-${label.toLowerCase()}-desc`}
        onKeyDown={(e) => handleStatusKeydown(e, index)}
        onClick={() => {
          announceToScreenReader(`${label} status: ${status}`, 'polite');
        }}
      >
        <Icon
          className={`
            w-4 h-4 sm:w-3 sm:h-3 sm:mr-1 transition-transform duration-200
            ${(status === 'loading' || status === 'updating') ? 'animate-pulse-slow' : ''}
          `}
          aria-hidden="true"
        />
        <span className="hidden sm:inline ml-1">{label}</span>

        {/* Hidden description for screen readers */}
        <span id={`status-${label.toLowerCase()}-desc`} className="sr-only">
          {getStatusDescription(status)}
        </span>
      </div>
    );
  };

  // PropTypes for StatusIndicator component
  StatusIndicator.propTypes = {
    status: PropTypes.oneOf(['online', 'offline', 'healthy', 'degraded', 'warning', 'error', 'loading', 'updating', 'stale']).isRequired,
    icon: PropTypes.elementType.isRequired,
    label: PropTypes.string.isRequired,
    tooltip: PropTypes.string,
    index: PropTypes.number.isRequired,
  };

  return (
    <section
      ref={statusContainerRef}
      className="bg-neutral-50 border-b border-neutral-200 px-2 sm:px-4 py-3 sm:py-2 loading-to-loaded loaded"
      aria-label="System status information"
    >
      <div className="max-w-7xl mx-auto">
        {/* Live region for status announcements */}
        {statusAnnouncement && (
          <div
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="sr-only"
          >
            {statusAnnouncement}
          </div>
        )}

        {/* Mobile-first layout */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
          {/* Top row on mobile - System status */}
          <div className="flex items-center justify-between sm:justify-start animate-slide-in-left">
            <div className="flex items-center text-xs text-neutral-600">
              <Clock className={`
                w-4 h-4 sm:w-3 sm:h-3 mr-2 sm:mr-1 transition-all duration-200
                ${isRefreshing ? 'animate-spin-smooth' : ''}
              `} />
              <span className="hidden xs:inline text-sm sm:text-xs">Last update:</span>
              <span className="font-mono ml-1 text-sm sm:text-xs font-semibold animate-fade-in delay-100">
                {timeSinceUpdate}
              </span>
            </div>

            {/* Enhanced error indicator - mobile optimized */}
            {errorState && shouldShowError(errorState.type) && (
              <div className={`
                flex items-center px-3 py-2 sm:px-2 sm:py-1 rounded-lg sm:rounded-md text-xs ml-2 min-h-[44px] sm:min-h-auto animate-scale-in
                ${errorState.severity === 'error' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'}
              `}>
                <AlertTriangle className={`w-4 h-4 sm:w-3 sm:h-3 mr-1 ${errorState.severity === 'error' ? 'animate-bounce-custom' : 'animate-pulse-slow'}`} />
                <span className="text-sm sm:text-xs font-medium truncate" title={errorState.message}>
                  {errorState.type === 'network' ? 'Offline' :
                    errorState.type === 'retry' ? 'Reconnecting' :
                      errorState.type === 'max_retries' ? 'Connection Failed' :
                        'System Error'}
                </span>
                <button
                  onClick={() => {
                    handleDismissError(errorState.type);
                    announceToScreenReader('Error dismissed', 'polite');
                  }}
                  className="ml-2 p-0.5 hover:bg-black/10 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-1"
                  aria-label={`Dismiss ${errorState.type} error`}
                  title="Dismiss this error notification"
                >
                  <X className="w-3 h-3" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>

          {/* Bottom row on mobile - Service indicators and controls */}
          <div className="flex items-center justify-between sm:justify-end gap-2 animate-slide-in-right">
            {/* Service status indicators with enhanced accessibility */}
            <div
              className="flex items-center space-x-2 sm:space-x-2 animate-stagger-in"
              role="group"
              aria-label="System service status indicators"
            >
              <StatusIndicator
                status={weatherStatus}
                icon={CloudSun}
                label="Weather"
                tooltip={`Weather data: ${weatherStatus} (Quality: ${Math.round((reliabilityMetrics.weatherQuality || 0) * 100)}%)`}
                index={0}
              />

              <StatusIndicator
                status={webcamStatus}
                icon={Camera}
                label="Webcam"
                tooltip={`Webcam data: ${webcamStatus} (Quality: ${Math.round((reliabilityMetrics.webcamQuality || 0) * 100)}%)`}
                index={1}
              />

              {/* Network indicator - hidden on extra small screens */}
              <div className="hidden xs:block">
                <StatusIndicator
                  status={reliabilityMetrics.fallbackMode ? 'degraded' : 'online'}
                  icon={Wifi}
                  label="Network"
                  tooltip={reliabilityMetrics.fallbackMode ? 'Using fallback data source' : 'Connected to primary data sources'}
                  index={2}
                />
              </div>
            </div>

            {/* Refresh controls with enhanced accessibility */}
            <div
              className="flex items-center space-x-1 animate-stagger-in"
              role="group"
              aria-label="Data refresh controls"
            >
              {enhancedOnRefresh && (
                <button
                  ref={refreshButtonRef}
                  onClick={() => {
                    enhancedOnRefresh();
                    announceToScreenReader('Refreshing data', 'polite');
                  }}
                  disabled={isRefreshing || !isOnline}
                  className="
                    flex items-center justify-center px-3 py-2 sm:px-2 sm:py-1
                    text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100
                    disabled:opacity-50 disabled:cursor-not-allowed rounded-lg sm:rounded-md
                    status-transition hover-lift active:scale-95 touch-manipulation
                    min-h-[44px] min-w-[44px] sm:min-h-auto sm:min-w-auto
                    animate-fade-in delay-300
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                    disabled:focus:ring-0
                  "
                  title={!isOnline ? 'Cannot refresh while offline' : 'Refresh data (respects cache)'}
                  aria-label={isRefreshing ? 'Refreshing data' : 'Refresh system data'}
                  aria-describedby="refresh-help"
                >
                  <RefreshCw
                    className={`
                      w-4 h-4 sm:w-3 sm:h-3 sm:mr-1 transition-transform duration-200
                      ${isRefreshing ? 'animate-spin-smooth' : ''}
                    `}
                    aria-hidden="true"
                  />
                  <span className="hidden md:inline">Refresh</span>
                  <span id="refresh-help" className="sr-only">
                    {!isOnline ? 'Cannot refresh while offline' :
                      isRefreshing ? 'Currently refreshing data' :
                        'Refresh weather and camera data from cache'}
                  </span>
                </button>
              )}

              {enhancedOnForceRefresh && (
                <button
                  onClick={() => {
                    enhancedOnForceRefresh();
                    announceToScreenReader('Force refreshing data', 'polite');
                  }}
                  disabled={isRefreshing || !isOnline}
                  className="
                    flex items-center justify-center px-3 py-2 sm:px-2 sm:py-1
                    text-xs font-medium text-orange-600 bg-orange-50 hover:bg-orange-100
                    disabled:opacity-50 disabled:cursor-not-allowed rounded-lg sm:rounded-md
                    status-transition hover-lift active:scale-95 touch-manipulation
                    min-h-[44px] min-w-[44px] sm:min-h-auto sm:min-w-auto
                    animate-fade-in delay-500
                    focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
                    disabled:focus:ring-0
                  "
                  title={!isOnline ? 'Cannot force refresh while offline' : 'Force refresh (bypasses cache)'}
                  aria-label={isRefreshing ? 'Force refreshing data' : 'Force refresh system data'}
                  aria-describedby="force-refresh-help"
                >
                  <Zap
                    className={`
                      w-4 h-4 sm:w-3 sm:h-3 sm:mr-1 transition-transform duration-200
                      ${isRefreshing ? 'animate-pulse-gentle' : ''}
                    `}
                    aria-hidden="true"
                  />
                  <span className="hidden md:inline">Force</span>
                  <span id="force-refresh-help" className="sr-only">
                    {!isOnline ? 'Cannot force refresh while offline' :
                      isRefreshing ? 'Currently force refreshing data' :
                        'Force refresh weather and camera data, bypassing cache'}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Detailed error information panel */}
        {errorState && errorState.type !== 'retry' && shouldShowError(`${errorState.type}-detail`) && (
          <div className="mt-2 animate-slide-down">
            {errorState.type === 'network' ? (
              <NetworkError
                isOnline={isOnline}
                lastSuccessTime={lastOnlineTime}
                onRetry={errorState.showRetry ? enhancedOnRefresh : null}
                className="mx-2 sm:mx-4"
              />
            ) : (
              <DataError
                message={errorState.message}
                dataType="system status"
                onRetry={errorState.showRetry ? enhancedOnRefresh : null}
                hasCachedData={Boolean(weatherData || webcamData)}
                className="mx-2 sm:mx-4"
              />
            )}
          </div>
        )}
      </div>
    </section>
  );
}, (prevProps, nextProps) => {
  // Optimized comparison for React.memo - avoid expensive operations
  if (prevProps.lastFetch !== nextProps.lastFetch ||
      prevProps.isRefreshing !== nextProps.isRefreshing ||
      prevProps.isLoading !== nextProps.isLoading ||
      prevProps.retryAttempts !== nextProps.retryAttempts) {
    return false;
  }

  // Compare object references first, then key properties if needed
  if (prevProps.error !== nextProps.error || 
      prevProps.weatherData !== nextProps.weatherData ||
      prevProps.webcamData !== nextProps.webcamData) {
    return false;
  }

  // Simple reliability metrics comparison - avoid JSON.stringify
  const prevMetrics = prevProps.reliabilityMetrics || {};
  const nextMetrics = nextProps.reliabilityMetrics || {};
  
  return (
    prevMetrics.weatherQuality === nextMetrics.weatherQuality &&
    prevMetrics.webcamQuality === nextMetrics.webcamQuality &&
    prevMetrics.fallbackMode === nextMetrics.fallbackMode
  );
});

SystemStatus.propTypes = {
  lastFetch: PropTypes.instanceOf(Date),
  weatherData: PropTypes.object,
  webcamData: PropTypes.object,
  reliabilityMetrics: PropTypes.shape({
    weatherQuality: PropTypes.number,
    webcamQuality: PropTypes.number,
    fallbackMode: PropTypes.bool,
    dataAge: PropTypes.number,
  }),
  error: PropTypes.object,
  isRefreshing: PropTypes.bool,
  isLoading: PropTypes.bool,
  onRefresh: PropTypes.func,
  onForceRefresh: PropTypes.func,
  networkStatus: PropTypes.oneOf(['online', 'offline', 'slow']),
  retryAttempts: PropTypes.number,
  maxRetries: PropTypes.number,
};

export default SystemStatus;