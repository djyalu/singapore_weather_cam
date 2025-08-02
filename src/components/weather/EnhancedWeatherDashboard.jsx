import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import WeatherCard from './WeatherCard';
import WeatherChart from './WeatherChart';
import StationsMapView from '../stations/StationsMapView';
import StationsBrowser from '../stations/StationsBrowser';
import { stationConfigService } from '../../services/stationConfigService.js';
import { getStationsByDataType, getStationsByProximity, KEY_LOCATIONS } from '../../config/weatherStations.js';

const EnhancedWeatherDashboard = ({ data }) => {
  const [selectedLocation, setSelectedLocation] = useState('all');
  const [selectedStation, setSelectedStation] = useState(null);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'stations', 'map'
  const [stationData, setStationData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('comprehensive'); // 'basic' or 'comprehensive'

  console.log('🌤️ EnhancedWeatherDashboard: Received data:', {
    data: data ? 'present' : 'missing',
    current: data?.current ? 'present' : 'missing',
    locations: data?.locations?.length || 0,
    forecast: data?.forecast?.length || 0,
    stations_used: data?.stations_used?.length || 0,
    data_quality_score: data?.data_quality_score || 'unknown',
  });

  // Load enhanced station data
  const loadStationData = useCallback(async () => {
    try {
      setLoading(true);
      await stationConfigService.loadStationsDatabase();

      // Get comprehensive station information
      const healthStatus = stationConfigService.getHealthStatus();
      setStationData(healthStatus);

    } catch (error) {
      console.error('Error loading station data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStationData();
  }, [loadStationData]);

  // Enhanced location filtering with comprehensive stations data
  const getFilteredData = useCallback(() => {
    if (!data) {return null;}

    if (selectedLocation === 'all') {
      return {
        current: data.current || data.data,
        forecast: data.forecast,
        locationData: null,
        stationDetails: data.station_details || {},
        dataQuality: data.data_quality_score || null,
        geographicCoverage: data.geographic_coverage || null,
      };
    }

    // Check if selectedLocation is a key location
    const keyLocation = KEY_LOCATIONS[selectedLocation];
    if (keyLocation) {
      // Get stations near this key location
      const nearbyStations = stationConfigService.getStationsByProximity(
        keyLocation.coordinates,
        8, // 8km radius
        null, // all data types
      );

      // Filter data to only include readings from nearby stations
      const filteredData = { ...data };
      if (filteredData.data) {
        for (const [dataType, typeData] of Object.entries(filteredData.data)) {
          if (typeData.readings && Array.isArray(typeData.readings)) {
            const nearbyStationIds = nearbyStations.map(s => s.station_id);
            typeData.readings = typeData.readings.filter(reading =>
              nearbyStationIds.includes(reading.station),
            );

            // Recalculate averages
            if (typeData.readings.length > 0) {
              typeData.average = typeData.readings.reduce((sum, r) => sum + r.value, 0) / typeData.readings.length;
              typeData.min = Math.min(...typeData.readings.map(r => r.value));
              typeData.max = Math.max(...typeData.readings.map(r => r.value));
            }
          }
        }
      }

      return {
        current: filteredData.data || filteredData.current,
        forecast: data.forecast,
        locationData: {
          ...keyLocation,
          id: selectedLocation,
          station_count: nearbyStations.length,
          nearest_stations: nearbyStations.slice(0, 3),
        },
        stationDetails: data.station_details || {},
        dataQuality: data.data_quality_score || null,
        geographicCoverage: data.geographic_coverage || null,
      };
    }

    // Check if selectedLocation is a specific station
    if (selectedStation) {
      const stationInfo = stationConfigService.getStationInfo(selectedStation.station_id);

      return {
        current: data.current || data.data,
        forecast: data.forecast,
        locationData: {
          ...stationInfo,
          id: selectedStation.station_id,
          station_count: 1,
          coordinates: selectedStation.coordinates,
        },
        stationDetails: { [selectedStation.station_id]: selectedStation },
        dataQuality: data.data_quality_score || null,
        geographicCoverage: data.geographic_coverage || null,
      };
    }

    // Legacy compatibility - check locations array
    const selectedLocationData = data.locations?.find(loc => loc.id === selectedLocation);
    if (selectedLocationData) {
      return {
        current: {
          temperature: selectedLocationData.temperature,
          humidity: selectedLocationData.humidity,
          rainfall: selectedLocationData.rainfall,
          feelsLike: data.current?.feelsLike,
          windSpeed: data.current?.windSpeed,
          windDirection: data.current?.windDirection,
          uvIndex: data.current?.uvIndex,
          visibility: data.current?.visibility,
        },
        forecast: data.forecast,
        locationData: selectedLocationData,
        stationDetails: data.station_details || {},
        dataQuality: data.data_quality_score || null,
        geographicCoverage: data.geographic_coverage || null,
      };
    }

    return {
      current: data.current || data.data,
      forecast: data.forecast,
      locationData: null,
      stationDetails: data.station_details || {},
      dataQuality: data.data_quality_score || null,
      geographicCoverage: data.geographic_coverage || null,
    };
  }, [data, selectedLocation, selectedStation]);

  // Handle station selection from map or browser
  const handleStationSelect = useCallback((station) => {
    setSelectedStation(station);
    setSelectedLocation('station');
  }, []);

  // Convert data structure for weather cards
  const convertDataForCards = useCallback((filteredData) => {
    if (!filteredData) {return null;}

    const { current } = filteredData;

    if (!current) {return null;}

    // Handle new comprehensive data format
    if (current.temperature && typeof current.temperature === 'object') {
      return {
        temperature: current.temperature.average || current.temperature.value || current.temperature,
        humidity: current.humidity?.average || current.humidity?.value || current.humidity,
        rainfall: current.rainfall?.total || current.rainfall?.average || current.rainfall?.value || current.rainfall,
        windSpeed: current.wind_speed?.average || current.windSpeed,
        windDirection: current.wind_direction?.value || current.windDirection,
        uvIndex: current.uv_index?.value || current.uvIndex,
        visibility: current.visibility,
        feelsLike: current.feelsLike,
      };
    }

    // Handle legacy data format
    return {
      temperature: current.temperature,
      humidity: current.humidity,
      rainfall: current.rainfall,
      windSpeed: current.windSpeed,
      windDirection: current.windDirection,
      uvIndex: current.uvIndex,
      visibility: current.visibility,
      feelsLike: current.feelsLike,
    };
  }, []);

  const filteredData = getFilteredData();
  const weatherCardData = convertDataForCards(filteredData);

  if (!data) {
    return (
      <div className="card">
        <p className="text-gray-500 text-center">No weather data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header with Quality Indicators */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Singapore Weather Monitoring
            </h2>
            <p className="text-gray-600 mt-1">
              Comprehensive NEA weather station network analysis
            </p>
          </div>

          {/* Data Quality Indicators */}
          <div className="flex flex-wrap items-center gap-4 text-sm">
            {filteredData?.dataQuality && (
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Data Quality:</span>
                <span className={`px-2 py-1 rounded font-medium ${
                  filteredData.dataQuality >= 90 ? 'bg-green-100 text-green-800' :
                    filteredData.dataQuality >= 70 ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                }`}>
                  {filteredData.dataQuality}%
                </span>
              </div>
            )}

            {data.stations_used && (
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Stations:</span>
                <span className="font-medium text-blue-600">
                  {Array.isArray(data.stations_used) ? data.stations_used.length : data.stations_used}
                </span>
              </div>
            )}

            {filteredData?.geographicCoverage && (
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Coverage:</span>
                <span className="font-medium text-green-600">
                  {filteredData.geographicCoverage.coverage_percentage}%
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'overview'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          📊 Weather Overview
        </button>
        <button
          onClick={() => setActiveTab('stations')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'stations'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          🏢 Stations Browser
        </button>
        <button
          onClick={() => setActiveTab('map')}
          className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'map'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          🗺️ Interactive Map
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Location Selector */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => { setSelectedLocation('all'); setSelectedStation(null); }}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedLocation === 'all'
                  ? 'bg-singapore-red text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              🇸🇬 All Singapore
            </button>

            {Object.entries(KEY_LOCATIONS).map(([key, location]) => (
              <button
                key={key}
                onClick={() => { setSelectedLocation(key); setSelectedStation(null); }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedLocation === key
                    ? 'bg-singapore-red text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                📍 {location.name}
              </button>
            ))}

            {selectedStation && (
              <button
                onClick={() => { setSelectedLocation('station'); }}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  selectedLocation === 'station'
                    ? 'bg-singapore-red text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                🏢 {selectedStation.coordinates?.name || `Station ${selectedStation.station_id}`}
              </button>
            )}
          </div>

          {/* Selected Location Info */}
          {filteredData?.locationData && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="text-2xl mr-3">
                  {filteredData.locationData.priority === 'primary' ? '🎯' :
                    filteredData.locationData.id?.startsWith('S') ? '🏢' : '📍'}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900">
                    {filteredData.locationData.name || filteredData.locationData.displayName}
                  </h3>
                  <p className="text-sm text-blue-700 mt-1">
                    {filteredData.locationData.description}
                  </p>

                  <div className="flex flex-wrap gap-4 mt-2 text-xs text-blue-600">
                    {filteredData.locationData.station_count && (
                      <span>📊 {filteredData.locationData.station_count} stations</span>
                    )}
                    {filteredData.locationData.priority && (
                      <span>⭐ {filteredData.locationData.priority} priority</span>
                    )}
                    {filteredData.locationData.coordinates && (
                      <span>
                        📍 {filteredData.locationData.coordinates.lat?.toFixed(4)}, {filteredData.locationData.coordinates.lng?.toFixed(4)}
                      </span>
                    )}
                  </div>

                  {filteredData.locationData.nearest_stations && (
                    <div className="mt-2">
                      <p className="text-xs text-blue-600 font-medium">Nearby Stations:</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {filteredData.locationData.nearest_stations.map(station => (
                          <span
                            key={station.station_id}
                            className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                          >
                            {station.station_id} ({station.distance?.toFixed(1)}km)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Current Weather Cards */}
          {weatherCardData && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <WeatherCard
                title="Temperature"
                value={`${weatherCardData.temperature?.toFixed(1) || '--'}°C`}
                icon="🌡️"
                description={weatherCardData.feelsLike ? `Feels like ${weatherCardData.feelsLike}°C` : 'Current temperature'}
                trend={weatherCardData.temperature > 30 ? 'up' : weatherCardData.temperature < 25 ? 'down' : 'stable'}
              />
              <WeatherCard
                title="Humidity"
                value={`${weatherCardData.humidity?.toFixed(0) || '--'}%`}
                icon="💧"
                description={
                  weatherCardData.humidity > 80 ? 'Very humid' :
                    weatherCardData.humidity > 70 ? 'High humidity' :
                      weatherCardData.humidity > 60 ? 'Moderate humidity' : 'Low humidity'
                }
                trend={weatherCardData.humidity > 80 ? 'up' : 'stable'}
              />
              <WeatherCard
                title="Rainfall"
                value={`${weatherCardData.rainfall?.toFixed(1) || '0'} mm`}
                icon="🌧️"
                description={
                  weatherCardData.rainfall > 10 ? 'Heavy rain' :
                    weatherCardData.rainfall > 2.5 ? 'Moderate rain' :
                      weatherCardData.rainfall > 0 ? 'Light rain' : 'No rain'
                }
                trend={weatherCardData.rainfall > 0 ? 'up' : 'stable'}
              />
              <WeatherCard
                title="Wind"
                value={`${weatherCardData.windSpeed?.toFixed(1) || '--'} km/h`}
                icon="💨"
                description={`Direction: ${weatherCardData.windDirection || 'Variable'}`}
                trend={weatherCardData.windSpeed > 20 ? 'up' : 'stable'}
              />
            </div>
          )}

          {/* Forecast Chart */}
          {filteredData?.forecast && (
            <div className="card">
              <h3 className="text-lg font-semibold mb-4">24-Hour Weather Forecast</h3>
              <WeatherChart data={filteredData.forecast} />
            </div>
          )}

          {/* Additional Weather Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* UV Index & Visibility */}
            <div className="card bg-gradient-to-br from-yellow-50 to-orange-50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-orange-700 font-medium">UV Index</p>
                  <p className="text-3xl font-bold text-orange-900">
                    {weatherCardData?.uvIndex || '--'}
                  </p>
                  <p className="text-sm text-orange-600 mt-1">
                    {(weatherCardData?.uvIndex || 0) > 7 ? 'Very High' :
                      (weatherCardData?.uvIndex || 0) > 5 ? 'High' :
                        (weatherCardData?.uvIndex || 0) > 2 ? 'Moderate' : 'Low'} exposure
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-orange-700 font-medium">Visibility</p>
                  <p className="text-3xl font-bold text-orange-900">
                    {weatherCardData?.visibility || '--'} km
                  </p>
                  <p className="text-sm text-orange-600 mt-1">
                    {(weatherCardData?.visibility || 0) > 10 ? 'Excellent' :
                      (weatherCardData?.visibility || 0) > 5 ? 'Good' : 'Limited'}
                  </p>
                </div>
              </div>
            </div>

            {/* Data Source Information */}
            <div className="card bg-gradient-to-br from-green-50 to-blue-50">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Data Source</span>
                  <span className="text-sm font-medium text-gray-900">
                    {data.source || 'NEA Singapore'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Last Updated</span>
                  <span className="text-sm font-medium text-gray-900">
                    {new Date(data.timestamp).toLocaleTimeString()}
                  </span>
                </div>

                {data.collection_time_ms && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Collection Time</span>
                    <span className="text-sm font-medium text-gray-900">
                      {Math.round(data.collection_time_ms / 1000)}s
                    </span>
                  </div>
                )}

                {filteredData?.geographicCoverage && (
                  <div className="pt-2 border-t border-gray-200">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Regions Covered</span>
                      <span className="text-sm font-medium text-gray-900">
                        {filteredData.geographicCoverage.regions_covered}/5
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stations Browser Tab */}
      {activeTab === 'stations' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <StationsBrowser
            onStationSelect={handleStationSelect}
            showFilters={true}
            compact={false}
          />
        </div>
      )}

      {/* Interactive Map Tab */}
      {activeTab === 'map' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
            <StationsMapView
              selectedDataTypes={['all']}
              selectedPriorities={['all']}
              showKeyLocations={true}
              showCoverage={false}
              onStationSelect={handleStationSelect}
              height="600px"
            />
          </div>

          {selectedStation && (
            <div className="bg-white rounded-lg shadow-sm border p-4">
              <h3 className="font-semibold text-lg mb-2">
                Selected Station: {selectedStation.coordinates?.name || `Station ${selectedStation.station_id}`}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Station ID:</span>
                  <div className="font-mono font-medium">{selectedStation.station_id}</div>
                </div>
                <div>
                  <span className="text-gray-600">Priority:</span>
                  <div className="font-medium capitalize">{selectedStation.priority_level}</div>
                </div>
                <div>
                  <span className="text-gray-600">Data Types:</span>
                  <div className="font-medium">{selectedStation.data_types?.length || 0}</div>
                </div>
                <div>
                  <span className="text-gray-600">Score:</span>
                  <div className="font-medium">{selectedStation.priority_score?.toFixed(1) || '--'}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

EnhancedWeatherDashboard.propTypes = {
  data: PropTypes.shape({
    current: PropTypes.object,
    data: PropTypes.object,
    forecast: PropTypes.array,
    locations: PropTypes.array,
    timestamp: PropTypes.string,
    source: PropTypes.string,
    collection_time_ms: PropTypes.number,
    stations_used: PropTypes.oneOfType([PropTypes.array, PropTypes.number]),
    data_quality_score: PropTypes.number,
    geographic_coverage: PropTypes.object,
    station_details: PropTypes.object,
  }),
};

export default EnhancedWeatherDashboard;