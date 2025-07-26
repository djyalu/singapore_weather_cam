import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import MapView from './MapView.jsx';
import { STATION_MAPPING } from '../../config/weatherStations.js';
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

const RegionalMapView = ({ weatherData, webcamData }) => {
  const [selectedRegion, setSelectedRegion] = useState('all');

  // Filter data based on selected region
  const filteredData = useMemo(() => {
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
        if (!location.coordinates) return false;
        
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
        if (!webcam.coordinates) return false;
        
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
  }, [weatherData, webcamData, selectedRegion]);

  // Calculate region statistics
  const regionStats = useMemo(() => {
    const { weatherData: filteredWeatherData, webcamData: filteredWebcamData } = filteredData;
    
    const weatherCount = filteredWeatherData?.locations?.length || 0;
    const webcamCount = filteredWebcamData?.captures?.length || 0;
    
    // Calculate average temperature for the region
    const avgTemp = filteredWeatherData?.locations?.length > 0 ? 
      filteredWeatherData.locations
        .filter(loc => loc.temperature != null)
        .reduce((sum, loc, _, arr) => sum + loc.temperature / arr.length, 0)
        .toFixed(1) : null;

    return {
      weatherCount,
      webcamCount,
      avgTemp,
      totalStations: weatherCount + webcamCount,
    };
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

  return (
    <div className="space-y-4">
      {/* Region Selection Header */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">Regional Weather & Traffic View</h2>
          <p className="text-sm text-neutral-600">
            Select a region to view detailed weather and traffic information
          </p>
        </div>
        
        {/* Region Selection Buttons - Mobile Optimized */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3 mb-4">
          {Object.entries(REGIONS).map(([key, region]) => (
            <button
              key={key}
              onClick={() => setSelectedRegion(key)}
              className={`
                region-button relative p-3 sm:p-4 rounded-lg border-2 transition-all duration-200
                min-h-[72px] sm:min-h-[80px] touch-manipulation active:scale-95
                focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
                ${selectedRegion === key 
                  ? `${getRegionColorClass(key, 'border')} ${getRegionColorClass(key, 'bgLight')} shadow-md active` 
                  : `border-neutral-200 ${getRegionColorClass(key, 'bgHover')}`
                }
              `}
              aria-pressed={selectedRegion === key}
              aria-label={`Select ${region.name} region: ${region.description}`}
            >
              <div className="text-left h-full flex flex-col justify-center">
                <div className={`
                  font-semibold text-sm sm:text-base mb-1 leading-tight
                  ${selectedRegion === key 
                    ? getRegionColorClass(key, 'text') 
                    : 'text-neutral-700'
                  }
                `}>
                  {region.name}
                </div>
                <div className="text-xs sm:text-xs text-neutral-500 leading-tight line-clamp-2">
                  {region.description}
                </div>
              </div>
              
              {/* Active indicator */}
              {selectedRegion === key && (
                <div className={`
                  active-indicator absolute top-2 right-2 w-3 h-3 sm:w-4 sm:h-4 rounded-full
                  ${getRegionColorClass(key, 'bg')}
                `} />
              )}
            </button>
          ))}
        </div>

        {/* Region Statistics - Mobile Optimized */}
        <div className="region-stats grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 p-3 sm:p-4 bg-neutral-50 rounded-lg">
          <div className="stat-card text-center p-3 sm:p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 touch-manipulation">
            <div className="text-xl sm:text-2xl font-bold text-weather-blue mb-1">
              {regionStats.weatherCount}
            </div>
            <div className="text-xs sm:text-xs text-neutral-600 leading-tight">
              Weather<br className="sm:hidden" /> Stations
            </div>
          </div>
          <div className="stat-card text-center p-3 sm:p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 touch-manipulation">
            <div className="text-xl sm:text-2xl font-bold text-singapore-red mb-1">
              {regionStats.webcamCount}
            </div>
            <div className="text-xs sm:text-xs text-neutral-600 leading-tight">
              Traffic<br className="sm:hidden" /> Cameras
            </div>
          </div>
          <div className="stat-card text-center p-3 sm:p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 touch-manipulation">
            <div className="text-xl sm:text-2xl font-bold text-accent-600 mb-1">
              {regionStats.avgTemp || '--'}°C
            </div>
            <div className="text-xs sm:text-xs text-neutral-600 leading-tight">
              Avg<br className="sm:hidden" /> Temperature
            </div>
          </div>
          <div className="stat-card text-center p-3 sm:p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 touch-manipulation">
            <div className="text-xl sm:text-2xl font-bold text-neutral-700 mb-1">
              {regionStats.totalStations}
            </div>
            <div className="text-xs sm:text-xs text-neutral-600 leading-tight">
              Total<br className="sm:hidden" /> Stations
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Map View */}
      <MapView 
        weatherData={filteredData.weatherData}
        webcamData={filteredData.webcamData}
        selectedRegion={selectedRegion}
        regionConfig={REGIONS[selectedRegion]}
        className="enhanced-regional-map"
      />

      {/* Region Details Panel */}
      {selectedRegion !== 'all' && (
        <div className="region-details-panel card">
          <div className="card-header">
            <h3 className={`card-title ${getRegionColorClass(selectedRegion, 'text')}`}>
              {REGIONS[selectedRegion].name} Region Details
            </h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            {/* Weather Stations in Region - Mobile Optimized */}
            {filteredData.weatherData?.locations?.length > 0 && (
              <div>
                <h4 className="font-semibold text-neutral-700 mb-3 flex items-center gap-2 text-sm sm:text-base">
                  🌡️ Weather Stations ({filteredData.weatherData.locations.length})
                </h4>
                <div className="space-y-2 sm:space-y-3">
                  {filteredData.weatherData.locations.map((location, index) => (
                    <div key={location.id || index} className="flex justify-between items-center p-3 sm:p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors duration-200 touch-manipulation">
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
              <div>
                <h4 className="font-semibold text-neutral-700 mb-3 flex items-center gap-2 text-sm sm:text-base">
                  📷 Traffic Cameras ({filteredData.webcamData.captures.length})
                </h4>
                <div className="space-y-2 sm:space-y-3">
                  {filteredData.webcamData.captures.slice(0, 5).map((webcam, index) => (
                    <div key={webcam.id || index} className="flex justify-between items-center p-3 sm:p-3 bg-neutral-50 rounded-lg hover:bg-neutral-100 transition-colors duration-200 touch-manipulation">
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
    </div>
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
};

RegionalMapView.displayName = 'RegionalMapView';

export default RegionalMapView;