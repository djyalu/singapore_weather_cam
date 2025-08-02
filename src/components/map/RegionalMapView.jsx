import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import MapView from './MapView.jsx';
import { STATION_MAPPING } from '../../config/weatherStations.js';
import SkeletonLoader from '../common/SkeletonLoader.jsx';
import { ErrorDisplay, DataError, PartialError, NetworkError, ErrorUtils } from '../common/ErrorComponents.jsx';
import ComponentErrorBoundary from '../common/ComponentErrorBoundary.jsx';
import { RefreshCw, AlertTriangle, MapPin } from 'lucide-react';
import { announceToScreenReader, keyboardUtils, ariaUtils } from '../../utils/accessibility.js';
import './RegionalMapView.css';

// Region definitions with their bounds and styling
const REGIONS = {
  'all': {
    name: 'All Singapore',
    description: 'Complete island coverage',
    center: { lat: 1.3521, lng: 103.8198 },
    zoom: 11,
    color: 'secondary',
    bounds: null, // Show all
  },
  'central': {
    name: 'Central',
    description: 'Newton & city area',
    center: { lat: 1.3138, lng: 103.8420 },
    zoom: 13,
    color: 'primary',
    bounds: {
      north: 1.35,
      south: 1.28,
      east: 103.88,
      west: 103.80,
    },
  },
  'west': {
    name: 'West',
    description: 'Clementi & Jurong area',
    center: { lat: 1.3329, lng: 103.7356 },
    zoom: 13,
    color: 'accent',
    bounds: {
      north: 1.37,
      south: 1.30,
      east: 103.78,
      west: 103.68,
    },
  },
  'east': {
    name: 'East',
    description: 'Tai Seng & coastal area',
    center: { lat: 1.3208, lng: 103.9083 },
    zoom: 13,
    color: 'secondary',
    bounds: {
      north: 1.36,
      south: 1.28,
      east: 103.95,
      west: 103.86,
    },
  },
  'south': {
    name: 'South',
    description: 'Sentosa & southern islands',
    center: { lat: 1.2494, lng: 103.8303 },
    zoom: 13,
    color: 'neutral',
    bounds: {
      north: 1.28,
      south: 1.22,
      east: 103.87,
      west: 103.79,
    },
  },
};

const RegionalMapView = ({
  weatherData,
  webcamData,
  isLoading = false,
  error = null,
  onRetry = null,
  networkStatus = 'online',
  dataQuality = null,
}) => {
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [mapError, setMapError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [focusedRegionIndex, setFocusedRegionIndex] = useState(0);
  const [regionAnnouncement, setRegionAnnouncement] = useState('');

  // Refs for accessibility
  const regionButtonsRef = useRef([]);
  const mapContainerRef = useRef(null);
  const regionSelectorRef = useRef(null);

  // Enhanced error handling for region switching with accessibility
  const handleRegionChange = useCallback((newRegion, fromKeyboard = false) => {
    try {
      setSelectedRegion(newRegion);
      setMapError(null);

      // Announce region change to screen readers
      const regionName = REGIONS[newRegion]?.name || newRegion;
      const message = `Selected ${regionName} region`;
      setRegionAnnouncement(message);
      announceToScreenReader(message, 'polite');

      // Focus management for keyboard users
      if (fromKeyboard && regionButtonsRef.current) {
        const regionKeys = Object.keys(REGIONS);
        const newIndex = regionKeys.indexOf(newRegion);
        if (newIndex >= 0) {
          setFocusedRegionIndex(newIndex);
        }
      }
    } catch (error) {
      console.error('Error switching region:', error);
      setMapError(error);
      announceToScreenReader('Error switching region', 'assertive');
    }
  }, []);

  // Keyboard navigation for region buttons
  const handleRegionKeydown = useCallback((event, regionKey, index) => {
    const regionKeys = Object.keys(REGIONS);

    switch (event.key) {
      case 'ArrowRight':
      case 'ArrowDown':
        event.preventDefault();
        const nextIndex = (index + 1) % regionKeys.length;
        const nextRegion = regionKeys[nextIndex];
        regionButtonsRef.current[nextIndex]?.focus();
        setFocusedRegionIndex(nextIndex);
        break;
      case 'ArrowLeft':
      case 'ArrowUp':
        event.preventDefault();
        const prevIndex = index === 0 ? regionKeys.length - 1 : index - 1;
        const prevRegion = regionKeys[prevIndex];
        regionButtonsRef.current[prevIndex]?.focus();
        setFocusedRegionIndex(prevIndex);
        break;
      case 'Home':
        event.preventDefault();
        regionButtonsRef.current[0]?.focus();
        setFocusedRegionIndex(0);
        break;
      case 'End':
        event.preventDefault();
        const lastIndex = regionKeys.length - 1;
        regionButtonsRef.current[lastIndex]?.focus();
        setFocusedRegionIndex(lastIndex);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        handleRegionChange(regionKey, true);
        break;
      default:
        break;
    }
  }, [handleRegionChange]);

  // Retry handler with exponential backoff
  const handleRetry = useCallback(() => {
    const newRetryCount = retryCount + 1;
    setRetryCount(newRetryCount);
    setMapError(null);

    if (onRetry) {
      onRetry();
    }
  }, [retryCount, onRetry]);

  // Filter data based on selected region with error handling
  const filteredData = useMemo(() => {
    try {
      if (selectedRegion === 'all') {
        return { weatherData, webcamData };
      }

      const region = REGIONS[selectedRegion];
      if (!region || !region.bounds) {
        return { weatherData, webcamData };
      }

      // Filter weather data
      const filteredWeatherData = weatherData ? {
        ...weatherData,
        locations: weatherData.locations?.filter(location => {
          if (!location.coordinates) {return false;}

          const { lat, lng } = location.coordinates;
          const { bounds } = region;

          return lat >= bounds.south &&
               lat <= bounds.north &&
               lng >= bounds.west &&
               lng <= bounds.east;
        }),
      } : null;

      // Filter webcam data
      const filteredWebcamData = webcamData ? {
        ...webcamData,
        captures: webcamData.captures?.filter(webcam => {
          if (!webcam.coordinates) {return false;}

          const { lat, lng } = webcam.coordinates;
          const { bounds } = region;

          return lat >= bounds.south &&
               lat <= bounds.north &&
               lng >= bounds.west &&
               lng <= bounds.east;
        }),
      } : null;

      return {
        weatherData: filteredWeatherData,
        webcamData: filteredWebcamData,
      };
    } catch (error) {
      console.error('Error filtering regional data:', error);
      setMapError(error);
      return { weatherData: null, webcamData: null };
    }
  }, [weatherData, webcamData, selectedRegion]);

  // Calculate region statistics with error handling
  const regionStats = useMemo(() => {
    try {
      const { weatherData: filteredWeatherData, webcamData: filteredWebcamData } = filteredData;

      const weatherCount = filteredWeatherData?.locations?.length || 0;
      const webcamCount = filteredWebcamData?.captures?.length || 0;

      // Calculate average temperature for the region
      const avgTemp = filteredWeatherData?.locations?.length > 0 ?
        (() => {
          const validTemps = filteredWeatherData.locations
            .filter(loc => loc.temperature !== null && loc.temperature !== undefined);
          if (validTemps.length === 0) return null;
          const sum = validTemps.reduce((acc, loc) => acc + loc.temperature, 0);
          return (sum / validTemps.length).toFixed(1);
        })() : null;

      return {
        weatherCount,
        webcamCount,
        avgTemp,
        totalStations: weatherCount + webcamCount,
        hasData: weatherCount > 0 || webcamCount > 0,
      };
    } catch (error) {
      console.error('Error calculating region statistics:', error);
      return {
        weatherCount: 0,
        webcamCount: 0,
        avgTemp: null,
        totalStations: 0,
        hasData: false,
        error: true,
      };
    }
  }, [filteredData]);

  // Get color scheme for selected region
  const getRegionColorClass = (regionKey, type = 'bg') => {
    const region = REGIONS[regionKey];
    const colorMap = {
      'primary': {
        bg: 'bg-primary-500',
        text: 'text-primary-500',
        border: 'border-primary-500',
        bgLight: 'bg-primary-50',
        bgHover: 'hover:bg-primary-100',
      },
      'secondary': {
        bg: 'bg-secondary-500',
        text: 'text-secondary-500',
        border: 'border-secondary-500',
        bgLight: 'bg-secondary-50',
        bgHover: 'hover:bg-secondary-100',
      },
      'accent': {
        bg: 'bg-accent-500',
        text: 'text-accent-500',
        border: 'border-accent-500',
        bgLight: 'bg-accent-50',
        bgHover: 'hover:bg-accent-100',
      },
      'neutral': {
        bg: 'bg-neutral-500',
        text: 'text-neutral-500',
        border: 'border-neutral-500',
        bgLight: 'bg-neutral-50',
        bgHover: 'hover:bg-neutral-100',
      },
    };

    return colorMap[region.color]?.[type] || colorMap.primary[type];
  };

  // Data quality assessment
  const getDataQualityStatus = () => {
    if (!dataQuality) {return null;}

    const weatherQuality = dataQuality.weather || 0;
    const webcamQuality = dataQuality.webcam || 0;
    const overallQuality = (weatherQuality + webcamQuality) / 2;

    if (overallQuality < 0.5) {return { level: 'poor', color: 'text-red-600' };}
    if (overallQuality < 0.8) {return { level: 'fair', color: 'text-yellow-600' };}
    return { level: 'good', color: 'text-green-600' };
  };

  const qualityStatus = getDataQualityStatus();

  // Error state - show comprehensive error information
  if (error && !weatherData && !webcamData) {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="card">
          <div className="card-header">
            <h2 className="card-title flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              Regional Map Unavailable
            </h2>
          </div>

          <div className="p-6">
            {networkStatus === 'offline' ? (
              <NetworkError
                isOnline={false}
                onRetry={handleRetry}
                className="mb-4"
              />
            ) : (
              <DataError
                message={ErrorUtils.getFriendlyMessage(error)}
                dataType="regional map data"
                onRetry={ErrorUtils.isRecoverable(error) ? handleRetry : null}
                hasCachedData={false}
              />
            )}

            {retryCount > 2 && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm text-amber-800">
                  Multiple retry attempts have failed. This may indicate a service outage.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Show loading skeleton while data is loading
  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Header skeleton */}
        <div className="card animate-scale-in">
          <div className="card-header">
            <SkeletonLoader.Element height="1.5rem" width="16rem" delay={0} />
            <SkeletonLoader.Element height="0.875rem" width="20rem" delay={50} />
          </div>

          {/* Region buttons skeleton */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3 mb-4 animate-stagger-in">
            {Array.from({ length: 5 }, (_, index) => (
              <div
                key={index}
                className="relative p-3 sm:p-4 rounded-lg border-2 border-neutral-200 min-h-[72px] sm:min-h-[80px] animate-pulse-gentle"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <SkeletonLoader.Element height="1rem" width="4rem" delay={index * 100} />
                <SkeletonLoader.Element height="0.75rem" width="6rem" delay={index * 100 + 50} />
              </div>
            ))}
          </div>

          {/* Stats skeleton */}
          <SkeletonLoader.Patterns.RegionStats delay={500} />
        </div>

        {/* Map skeleton */}
        <SkeletonLoader.Patterns.MapView delay={600} />

        {/* Loading announcement for accessibility */}
        <div
          className="sr-only"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          Loading regional weather and traffic information...
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-4 animate-fade-in" aria-label="Regional weather and traffic view">
      {/* Live region for announcements */}
      {regionAnnouncement && (
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {regionAnnouncement}
        </div>
      )}

      {/* Region Selection Header */}
      <div className="card animate-scale-in">
        <header className="card-header">
          <h2 className="card-title" id="regional-view-title">
            Regional Weather & Traffic View
          </h2>
          <p className="text-sm text-neutral-600" id="regional-view-description">
            Select a region to view detailed weather and traffic information. Use arrow keys to navigate between regions.
          </p>
        </header>

        {/* Region Selection Buttons with Enhanced Mobile Accessibility */}
        <div
          ref={regionSelectorRef}
          className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-3 mb-4 animate-stagger-in"
          role="radiogroup"
          aria-labelledby="regional-view-title"
          aria-describedby="regional-view-description"
        >
          {Object.entries(REGIONS).map(([key, region], index) => (
            <button
              key={key}
              ref={(el) => { regionButtonsRef.current[index] = el; }}
              onClick={() => handleRegionChange(key, false)}
              onKeyDown={(e) => handleRegionKeydown(e, key, index)}
              className={`
                region-button relative p-4 sm:p-4 rounded-xl border-2 
                status-transition hover-lift
                min-h-[80px] sm:min-h-[80px] touch-manipulation active:scale-95
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                animate-fade-in transition-all duration-200
                ${selectedRegion === key
              ? `${getRegionColorClass(key, 'border')} ${getRegionColorClass(key, 'bgLight')} shadow-lg active animate-scale-in transform scale-105`
              : `border-neutral-200 ${getRegionColorClass(key, 'bgHover')} hover:shadow-md`
            }
              `}
              style={{ animationDelay: `${index * 100}ms` }}
              role="radio"
              aria-checked={selectedRegion === key}
              aria-describedby={`region-${key}-desc`}
              aria-label={`${region.name} region`}
              tabIndex={selectedRegion === key ? 0 : -1}
            >
              <div className="text-center sm:text-left h-full flex flex-col justify-center">
                <div className={`
                  font-bold text-base sm:text-base mb-2 leading-tight
                  ${selectedRegion === key
              ? getRegionColorClass(key, 'text')
              : 'text-neutral-700'
            }
                `}>
                  {region.name}
                </div>
                <div
                  id={`region-${key}-desc`}
                  className="text-xs sm:text-xs text-neutral-500 leading-relaxed line-clamp-2"
                >
                  {region.description}
                </div>
              </div>

              {/* Active indicator with screen reader support */}
              {selectedRegion === key && (
                <div
                  className={`
                    active-indicator absolute top-3 right-3 w-4 h-4 sm:w-4 sm:h-4 rounded-full
                    animate-scale-in animate-pulse-slow
                    ${getRegionColorClass(key, 'bg')}
                  `}
                  aria-hidden="true"
                />
              )}

              {/* Screen reader only selected indicator */}
              {selectedRegion === key && (
                <span className="sr-only">Currently selected</span>
              )}
            </button>
          ))}
        </div>

        {/* Region Statistics with Enhanced Mobile Accessibility */}
        <div
          className="region-stats grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 p-4 sm:p-4 bg-neutral-50 rounded-xl animate-fade-in delay-500"
          role="group"
          aria-label="Regional statistics summary"
        >
          <div
            className="stat-card text-center p-4 sm:p-4 bg-white rounded-xl shadow-sm hover-lift touch-manipulation animate-scale-in delay-600 min-h-[80px] flex flex-col justify-center"
            role="group"
            aria-labelledby="weather-count-label"
          >
            <div
              className="text-2xl sm:text-2xl font-bold text-weather-blue mb-2 animate-fade-in delay-700"
              aria-label={`${regionStats.weatherCount} weather stations in selected region`}
            >
              {regionStats.weatherCount}
            </div>
            <div
              id="weather-count-label"
              className="text-xs sm:text-sm text-neutral-600 leading-tight font-medium"
            >
              Weather<br className="xs:hidden" /><span className="xs:inline"> </span>Stations
            </div>
          </div>
          <div
            className="stat-card text-center p-4 sm:p-4 bg-white rounded-xl shadow-sm hover-lift touch-manipulation animate-scale-in delay-650 min-h-[80px] flex flex-col justify-center"
            role="group"
            aria-labelledby="webcam-count-label"
          >
            <div
              className="text-2xl sm:text-2xl font-bold text-singapore-red mb-2 animate-fade-in delay-750"
              aria-label={`${regionStats.webcamCount} traffic cameras in selected region`}
            >
              {regionStats.webcamCount}
            </div>
            <div
              id="webcam-count-label"
              className="text-xs sm:text-sm text-neutral-600 leading-tight font-medium"
            >
              Traffic<br className="xs:hidden" /><span className="xs:inline"> </span>Cameras
            </div>
          </div>
          <div
            className="stat-card text-center p-4 sm:p-4 bg-white rounded-xl shadow-sm hover-lift touch-manipulation animate-scale-in delay-700 min-h-[80px] flex flex-col justify-center"
            role="group"
            aria-labelledby="avg-temp-label"
          >
            <div
              className="text-2xl sm:text-2xl font-bold text-accent-600 mb-2 animate-fade-in delay-800"
              aria-label={`Average temperature: ${regionStats.avgTemp || 'not available'} degrees Celsius`}
            >
              {regionStats.avgTemp || '--'}°C
            </div>
            <div
              id="avg-temp-label"
              className="text-xs sm:text-sm text-neutral-600 leading-tight font-medium"
            >
              Avg<br className="xs:hidden" /><span className="xs:inline"> </span>Temperature
            </div>
          </div>
          <div
            className="stat-card text-center p-4 sm:p-4 bg-white rounded-xl shadow-sm hover-lift touch-manipulation animate-scale-in delay-750 min-h-[80px] flex flex-col justify-center"
            role="group"
            aria-labelledby="total-stations-label"
          >
            <div
              className="text-2xl sm:text-2xl font-bold text-neutral-700 mb-2 animate-fade-in delay-850"
              aria-label={`Total stations: ${regionStats.totalStations} monitoring stations in selected region`}
            >
              {regionStats.totalStations}
            </div>
            <div
              id="total-stations-label"
              className="text-xs sm:text-sm text-neutral-600 leading-tight font-medium"
            >
              Total<br className="xs:hidden" /><span className="xs:inline"> </span>Stations
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Map View with Accessibility */}
      <div
        ref={mapContainerRef}
        className="animate-fade-in delay-900"
        role="img"
        aria-label={`Interactive map showing weather and traffic data for ${REGIONS[selectedRegion]?.name || selectedRegion} region`}
        aria-describedby="map-instructions"
      >
        <div id="map-instructions" className="sr-only">
          Interactive map displaying weather stations and traffic cameras.
          Use the region selector buttons above to change the map view.
          Map markers show current data for weather stations and traffic cameras in the selected region.
        </div>
        <MapView
          weatherData={filteredData.weatherData}
          webcamData={filteredData.webcamData}
          selectedRegion={selectedRegion}
          regionConfig={REGIONS[selectedRegion]}
          className="enhanced-regional-map loading-to-loaded loaded"
        />
      </div>

      {/* Region Details Panel */}
      {selectedRegion !== 'all' && (
        <div className="region-details-panel card animate-scale-in delay-1000">
          <div className="card-header">
            <h3 className={`card-title ${getRegionColorClass(selectedRegion, 'text')} animate-fade-in delay-1100`}>
              {REGIONS[selectedRegion].name} Region Details
            </h3>
          </div>

          <div className="grid md:grid-cols-2 gap-4 animate-fade-in delay-1200">
            {/* Weather Stations in Region - Mobile Optimized */}
            {filteredData.weatherData?.locations?.length > 0 && (
              <div className="animate-slide-in-left delay-1300">
                <h4 className="font-semibold text-neutral-700 mb-3 flex items-center gap-2 text-sm sm:text-base">
                  🌡️ Weather Stations ({filteredData.weatherData.locations.length})
                </h4>
                <div className="space-y-2 sm:space-y-3 animate-stagger-in">
                  {filteredData.weatherData.locations.map((location, index) => (
                    <div key={location.id || index} className="flex justify-between items-center p-3 sm:p-3 bg-neutral-50 rounded-lg hover-lift touch-manipulation animate-fade-in"
                      style={{ animationDelay: `${1400 + (index * 50)}ms` }}>
                      <div className="flex-1 min-w-0 mr-3">
                        <div className="font-medium text-sm sm:text-sm truncate">{location.name}</div>
                        <div className="text-xs sm:text-xs text-neutral-500 truncate">
                          {location.coordinates ?
                            `${location.coordinates.lat.toFixed(4)}, ${location.coordinates.lng.toFixed(4)}` :
                            'No coordinates'
                          }
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-bold text-weather-blue text-sm sm:text-base">
                          {location.temperature || '--'}°C
                        </div>
                        <div className="text-xs sm:text-xs text-neutral-500">
                          {location.humidity || '--'}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Traffic Cameras in Region - Mobile Optimized */}
            {filteredData.webcamData?.captures?.length > 0 && (
              <div className="animate-slide-in-right delay-1300">
                <h4 className="font-semibold text-neutral-700 mb-3 flex items-center gap-2 text-sm sm:text-base">
                  📷 Traffic Cameras ({filteredData.webcamData.captures.length})
                </h4>
                <div className="space-y-2 sm:space-y-3 animate-stagger-in">
                  {filteredData.webcamData.captures.slice(0, 5).map((webcam, index) => (
                    <div key={webcam.id || index} className="flex justify-between items-center p-3 sm:p-3 bg-neutral-50 rounded-lg hover-lift touch-manipulation animate-fade-in"
                      style={{ animationDelay: `${1400 + (index * 50)}ms` }}>
                      <div className="flex-1 min-w-0 mr-3">
                        <div className="font-medium text-sm sm:text-sm truncate">{webcam.name}</div>
                        <div className="text-xs sm:text-xs text-neutral-500 truncate">{webcam.location}</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className={`
                          text-xs px-2 py-1 rounded-full font-medium
                          ${webcam.status === 'success' ? 'bg-accent-100 text-accent-700' : 'bg-neutral-200 text-neutral-600'}
                        `}>
                          {webcam.status || 'unknown'}
                        </div>
                      </div>
                    </div>
                  ))}
                  {filteredData.webcamData.captures.length > 5 && (
                    <div className="text-xs sm:text-xs text-neutral-500 text-center py-2 font-medium">
                      And {filteredData.webcamData.captures.length - 5} more cameras...
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
};

RegionalMapView.propTypes = {
  weatherData: PropTypes.shape({
    timestamp: PropTypes.string,
    locations: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      coordinates: PropTypes.shape({
        lat: PropTypes.number,
        lng: PropTypes.number,
      }),
      temperature: PropTypes.number,
      humidity: PropTypes.number,
      rainfall: PropTypes.number,
      description: PropTypes.string,
      priority: PropTypes.string,
    })),
  }),
  webcamData: PropTypes.shape({
    timestamp: PropTypes.string,
    total_cameras: PropTypes.number,
    successful_captures: PropTypes.number,
    failed_captures: PropTypes.number,
    captures: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      coordinates: PropTypes.shape({
        lat: PropTypes.number,
        lng: PropTypes.number,
      }),
      type: PropTypes.string,
      status: PropTypes.string,
      location: PropTypes.string,
      file_info: PropTypes.shape({
        url: PropTypes.string,
      }),
      ai_analysis: PropTypes.object,
      priority: PropTypes.string,
    })),
  }),
  isLoading: PropTypes.bool,
  error: PropTypes.object,
  onRetry: PropTypes.func,
  networkStatus: PropTypes.oneOf(['online', 'offline', 'slow']),
  dataQuality: PropTypes.shape({
    weather: PropTypes.number,
    webcam: PropTypes.number,
  }),
};

RegionalMapView.displayName = 'RegionalMapView';

export default RegionalMapView;