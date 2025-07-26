/**
 * SystemStatus Component
 * Compact horizontal system health indicator for the top of the page
 * Shows key metrics: last update time, weather data status, webcam status
 */

import React from 'react';
import PropTypes from 'prop-types';
import { Clock, CloudSun, Camera, Wifi, AlertTriangle } from 'lucide-react';

const SystemStatus = ({ 
  lastFetch = null,
  weatherData = null,
  webcamData = null,
  reliabilityMetrics = {},
  error = null,
  isRefreshing = false 
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

  // Status indicator component
  const StatusIndicator = ({ status, icon: Icon, label, tooltip }) => {
    const getStatusColor = (status) => {
      switch (status) {
        case 'online':
        case 'healthy':
          return 'text-accent-600 bg-accent-50';
        case 'degraded':
        case 'warning':
          return 'text-yellow-600 bg-yellow-50';
        case 'stale':
          return 'text-orange-600 bg-orange-50';
        case 'offline':
        case 'error':
          return 'text-red-600 bg-red-50';
        case 'loading':
        case 'updating':
          return 'text-secondary-600 bg-secondary-50 animate-pulse';
        default:
          return 'text-neutral-500 bg-neutral-50';
      }
    };

    return (
      <div 
        className={`flex items-center px-2 py-1 rounded-md text-xs font-medium transition-colors ${getStatusColor(status)}`}
        title={tooltip}
      >
        <Icon className="w-3 h-3 mr-1" />
        <span className="hidden sm:inline">{label}</span>
      </div>
    );
  };

  return (
    <div className="bg-neutral-50 border-b border-neutral-200 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left side - System status */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center text-xs text-neutral-600">
            <Clock className="w-3 h-3 mr-1" />
            <span className="hidden xs:inline">Last update:</span>
            <span className="font-mono ml-1">{timeSinceUpdate}</span>
          </div>
          
          {/* Overall system indicator */}
          {error && (
            <div className="flex items-center px-2 py-1 rounded-md bg-red-50 text-red-600 text-xs">
              <AlertTriangle className="w-3 h-3 mr-1" />
              <span>System Error</span>
            </div>
          )}
        </div>

        {/* Right side - Service status indicators */}
        <div className="flex items-center space-x-2">
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

          {/* Network/connectivity indicator */}
          <StatusIndicator
            status={reliabilityMetrics.fallbackMode ? 'degraded' : 'online'}
            icon={Wifi}
            label="Network"
            tooltip={reliabilityMetrics.fallbackMode ? 'Using fallback data source' : 'Connected to primary data sources'}
          />
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
};

export default SystemStatus;