/**
 * SystemStatus Component
 * Compact horizontal system health indicator for the top of the page
 * Shows key metrics: last update time, weather data status, webcam status
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Clock, CloudSun, Camera, Wifi, AlertTriangle, RefreshCw, Zap } from 'lucide-react';

const SystemStatus = ({ 
  lastFetch = null,
  weatherData = null,
  webcamData = null,
  reliabilityMetrics = {},
  error = null,
  isRefreshing = false,
  onRefresh = null,
  onForceRefresh = null
}) => {
  
  // Calculate time since last update
  const getTimeSinceUpdate = () => {
    if (!lastFetch) return 'No data';
    
    const now = new Date();
    const diffMinutes = Math.floor((now - lastFetch) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours}h ago`;
  };

  // Determine overall system status
  const getSystemStatus = () => {
    if (error) return 'error';
    if (isRefreshing) return 'updating';
    if (!weatherData || !webcamData) return 'loading';
    
    const weatherAge = weatherData?.reliabilityMetadata?.dataAge || 0;
    const webcamAge = webcamData?.reliabilityMetadata?.dataAge || 0;
    const maxAge = Math.max(weatherAge, webcamAge);
    
    if (maxAge > 30 * 60 * 1000) return 'stale'; // > 30 minutes
    if (maxAge > 15 * 60 * 1000) return 'warning'; // > 15 minutes
    
    return 'healthy';
  };

  // Get weather data status
  const getWeatherStatus = () => {
    if (!weatherData) return 'offline';
    
    const quality = reliabilityMetrics.weatherQuality;
    const dataAge = weatherData?.reliabilityMetadata?.dataAge || 0;
    
    if (dataAge > 30 * 60 * 1000) return 'stale';
    if (quality && quality < 0.8) return 'degraded';
    
    return 'online';
  };

  // Get webcam data status
  const getWebcamStatus = () => {
    if (!webcamData) return 'offline';
    
    const quality = reliabilityMetrics.webcamQuality;
    const dataAge = webcamData?.reliabilityMetadata?.dataAge || 0;
    
    if (dataAge > 30 * 60 * 1000) return 'stale';
    if (quality && quality < 0.8) return 'degraded';
    
    return 'online';
  };

  const systemStatus = getSystemStatus();
  const weatherStatus = getWeatherStatus();
  const webcamStatus = getWebcamStatus();
  const timeSinceUpdate = getTimeSinceUpdate();

  // Status indicator component with enhanced mobile support
  const StatusIndicator = ({ status, icon: Icon, label, tooltip }) => {
    const getStatusColor = (status) => {
      switch (status) {
        case 'online':
        case 'healthy':
          return 'text-accent-600 bg-accent-50 hover:bg-accent-100';
        case 'degraded':
        case 'warning':
          return 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100';
        case 'stale':
          return 'text-orange-600 bg-orange-50 hover:bg-orange-100';
        case 'offline':
        case 'error':
          return 'text-red-600 bg-red-50 hover:bg-red-100';
        case 'loading':
        case 'updating':
          return 'text-secondary-600 bg-secondary-50 animate-pulse';
        default:
          return 'text-neutral-500 bg-neutral-50 hover:bg-neutral-100';
      }
    };

    return (
      <div 
        className={`
          flex items-center px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200
          min-h-[44px] min-w-[44px] justify-center sm:justify-start sm:px-2 sm:py-1 sm:min-h-auto sm:min-w-auto
          active:scale-95 touch-manipulation cursor-pointer
          ${getStatusColor(status)}
        `}
        title={tooltip}
        role="button"
        tabIndex="0"
        aria-label={`${label}: ${status}`}
      >
        <Icon className="w-4 h-4 sm:w-3 sm:h-3 sm:mr-1" />
        <span className="hidden sm:inline ml-1">{label}</span>
      </div>
    );
  };

  return (
    <div className="bg-neutral-50 border-b border-neutral-200 px-2 sm:px-4 py-3 sm:py-2">
      <div className="max-w-7xl mx-auto">
        {/* Mobile-first layout */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
          {/* Top row on mobile - System status */}
          <div className="flex items-center justify-between sm:justify-start">
            <div className="flex items-center text-xs text-neutral-600">
              <Clock className="w-4 h-4 sm:w-3 sm:h-3 mr-2 sm:mr-1" />
              <span className="hidden xs:inline text-sm sm:text-xs">Last update:</span>
              <span className="font-mono ml-1 text-sm sm:text-xs font-semibold">{timeSinceUpdate}</span>
            </div>
            
            {/* Error indicator - mobile optimized */}
            {error && (
              <div className="flex items-center px-3 py-2 sm:px-2 sm:py-1 rounded-lg sm:rounded-md bg-red-50 text-red-600 text-xs ml-2 min-h-[44px] sm:min-h-auto">
                <AlertTriangle className="w-4 h-4 sm:w-3 sm:h-3 mr-1" />
                <span className="text-sm sm:text-xs font-medium">System Error</span>
              </div>
            )}
          </div>

          {/* Bottom row on mobile - Service indicators and controls */}
          <div className="flex items-center justify-between sm:justify-end">
            {/* Service status indicators */}
            <div className="flex items-center space-x-2 sm:space-x-2">
              <StatusIndicator
                status={weatherStatus}
                icon={CloudSun}
                label="Weather"
                tooltip={`Weather data: ${weatherStatus} (Quality: ${Math.round((reliabilityMetrics.weatherQuality || 0) * 100)}%)`}
              />
              
              <StatusIndicator
                status={webcamStatus}
                icon={Camera}
                label="Webcam"
                tooltip={`Webcam data: ${webcamStatus} (Quality: ${Math.round((reliabilityMetrics.webcamQuality || 0) * 100)}%)`}
              />

              {/* Network indicator - hidden on extra small screens */}
              <div className="hidden xs:block">
                <StatusIndicator
                  status={reliabilityMetrics.fallbackMode ? 'degraded' : 'online'}
                  icon={Wifi}
                  label="Network"
                  tooltip={reliabilityMetrics.fallbackMode ? 'Using fallback data source' : 'Connected to primary data sources'}
                />
              </div>
            </div>

            {/* Refresh controls - mobile optimized */}
            <div className="flex items-center space-x-1 ml-2">
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  className="
                    flex items-center justify-center px-3 py-2 sm:px-2 sm:py-1 
                    text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 
                    disabled:opacity-50 disabled:cursor-not-allowed rounded-lg sm:rounded-md 
                    transition-all duration-200 active:scale-95 touch-manipulation
                    min-h-[44px] min-w-[44px] sm:min-h-auto sm:min-w-auto
                  "
                  title="Refresh data (respects cache)"
                  aria-label="Refresh data"
                >
                  <RefreshCw className={`w-4 h-4 sm:w-3 sm:h-3 sm:mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">Refresh</span>
                </button>
              )}
              
              {onForceRefresh && (
                <button
                  onClick={onForceRefresh}
                  disabled={isRefreshing}
                  className="
                    flex items-center justify-center px-3 py-2 sm:px-2 sm:py-1 
                    text-xs font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 
                    disabled:opacity-50 disabled:cursor-not-allowed rounded-lg sm:rounded-md 
                    transition-all duration-200 active:scale-95 touch-manipulation
                    min-h-[44px] min-w-[44px] sm:min-h-auto sm:min-w-auto
                  "
                  title="Force refresh (bypasses cache)"
                  aria-label="Force refresh data"
                >
                  <Zap className={`w-4 h-4 sm:w-3 sm:h-3 sm:mr-1 ${isRefreshing ? 'animate-pulse' : ''}`} />
                  <span className="hidden md:inline">Force</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

StatusIndicator.propTypes = {
  status: PropTypes.oneOf([
    'online', 'offline', 'degraded', 'stale', 'loading', 'updating', 'healthy', 'warning', 'error'
  ]).isRequired,
  icon: PropTypes.elementType.isRequired,
  label: PropTypes.string.isRequired,
  tooltip: PropTypes.string.isRequired,
};

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
  onRefresh: PropTypes.func,
  onForceRefresh: PropTypes.func,
};

export default SystemStatus;