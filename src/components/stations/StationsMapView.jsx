import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { MapContainer, TileLayer, Marker, Popup, LayersControl, Circle } from 'react-leaflet';
import L from 'leaflet';
import { stationConfigService } from '../../services/stationConfigService.js';
import { KEY_LOCATIONS } from '../../config/weatherStations.js';

// Custom marker icons for different station types and priorities
const createStationIcon = (dataTypes, priority, status = 'active') => {
  let iconColor = '#6b7280'; // Default gray
  let iconSymbol = '📊'; // Default data icon

  // Determine color based on priority
  switch (priority) {
    case 'critical':
      iconColor = '#dc2626'; // Red
      break;
    case 'high':
      iconColor = '#ea580c'; // Orange
      break;
    case 'medium':
      iconColor = '#0ea5e9'; // Blue
      break;
    case 'low':
      iconColor = '#6b7280'; // Gray
      break;
  }

  // Determine symbol based on primary data type
  if (dataTypes.includes('temperature')) {
    iconSymbol = '🌡️';
  } else if (dataTypes.includes('humidity')) {
    iconSymbol = '💧';
  } else if (dataTypes.includes('rainfall')) {
    iconSymbol = '🌧️';
  } else if (dataTypes.includes('wind_speed')) {
    iconSymbol = '💨';
  } else if (dataTypes.includes('pm25')) {
    iconSymbol = '🏭';
  }

  // Add status indicator
  const statusColor = status === 'active' ? '#10b981' : '#ef4444';

  return L.divIcon({
    html: `
      <div style="
        position: relative;
        width: 32px;
        height: 32px;
        background: ${iconColor};
        border: 2px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 14px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      ">
        ${iconSymbol}
        <div style="
          position: absolute;
          bottom: -2px;
          right: -2px;
          width: 8px;
          height: 8px;
          background: ${statusColor};
          border: 1px solid white;
          border-radius: 50%;
        "></div>
      </div>
    `,
    className: 'custom-station-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -16],
  });
};

// Key location marker icon
const createKeyLocationIcon = (priority) => {
  const colors = {
    primary: '#dc2626',
    secondary: '#ea580c',
    tertiary: '#0ea5e9',
  };

  return L.divIcon({
    html: `
      <div style="
        width: 24px;
        height: 24px;
        background: ${colors[priority] || '#6b7280'};
        border: 2px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 12px;
        color: white;
        font-weight: bold;
        box-shadow: 0 2px 6px rgba(0,0,0,0.4);
      ">
        📍
      </div>
    `,
    className: 'key-location-marker',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
    popupAnchor: [0, -12],
  });
};

const StationsMapView = ({
  selectedDataTypes = ['all'],
  selectedPriorities = ['all'],
  showKeyLocations = true,
  showCoverage = false,
  onStationSelect = null,
  height = '500px',
}) => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStation, setSelectedStation] = useState(null);

  // Load stations data
  const loadStations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load comprehensive stations database
      await stationConfigService.loadStationsDatabase();

      // Get optimal stations based on filters
      const optimalStations = stationConfigService.getOptimalStations({
        dataType: selectedDataTypes.includes('all') ? 'all' : selectedDataTypes[0],
        maxStations: 50,
        priorityOnly: !selectedPriorities.includes('all'),
      });

      // Flatten stations from all data types
      const allStations = [];
      const seenIds = new Set();

      for (const [dataType, stationsList] of Object.entries(optimalStations)) {
        for (const station of stationsList) {
          if (!seenIds.has(station.station_id)) {
            seenIds.add(station.station_id);

            // Filter by priority if specified
            if (selectedPriorities.includes('all') ||
                selectedPriorities.includes(station.priority_level)) {
              allStations.push(station);
            }
          }
        }
      }

      setStations(allStations);

    } catch (err) {
      console.error('Error loading stations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [selectedDataTypes, selectedPriorities]);

  useEffect(() => {
    loadStations();
  }, [loadStations]);

  // Handle station selection
  const handleStationClick = useCallback((station) => {
    setSelectedStation(station);
    if (onStationSelect) {
      onStationSelect(station);
    }
  }, [onStationSelect]);

  // Filter stations based on selected data types
  const filteredStations = useMemo(() => {
    if (selectedDataTypes.includes('all')) {
      return stations;
    }

    return stations.filter(station =>
      station.data_types &&
      station.data_types.some(type => selectedDataTypes.includes(type)),
    );
  }, [stations, selectedDataTypes]);

  // Calculate map center based on available stations
  const mapCenter = useMemo(() => {
    if (filteredStations.length === 0) {
      return [1.3437, 103.7640]; // Default to Hwa Chong
    }

    // Calculate centroid of all stations
    const avgLat = filteredStations.reduce((sum, s) => sum + (s.coordinates?.lat || 1.3521), 0) / filteredStations.length;
    const avgLng = filteredStations.reduce((sum, s) => sum + (s.coordinates?.lng || 103.8198), 0) / filteredStations.length;

    return [avgLat, avgLng];
  }, [filteredStations]);

  if (loading) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading weather stations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center" style={{ height }}>
        <div className="text-center text-red-600">
          <p className="mb-2">⚠️ Error loading stations</p>
          <p className="text-sm">{error}</p>
          <button
            onClick={loadStations}
            className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="stations-map-container" style={{ height }}>
      <MapContainer
        center={mapCenter}
        zoom={12}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="OpenStreetMap">
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            />
          </LayersControl.BaseLayer>

          <LayersControl.BaseLayer name="Satellite">
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              attribution='&copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
            />
          </LayersControl.BaseLayer>

          {/* Weather Stations Layer */}
          <LayersControl.Overlay checked name="Weather Stations">
            <>
              {filteredStations.map((station) => {
                if (!station.coordinates) {return null;}

                return (
                  <Marker
                    key={station.station_id}
                    position={[station.coordinates.lat, station.coordinates.lng]}
                    icon={createStationIcon(
                      station.data_types || [],
                      station.priority_level || 'medium',
                      'active', // Could get from real-time status
                    )}
                    eventHandlers={{
                      click: () => handleStationClick(station),
                    }}
                  >
                    <Popup maxWidth={300}>
                      <div className="p-2">
                        <h3 className="font-bold text-lg mb-2">
                          {station.coordinates?.name || `Station ${station.station_id}`}
                        </h3>

                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="font-medium">Station ID:</span> {station.station_id}
                          </div>

                          <div>
                            <span className="font-medium">Priority:</span>{' '}
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              station.priority_level === 'critical' ? 'bg-red-100 text-red-800' :
                                station.priority_level === 'high' ? 'bg-orange-100 text-orange-800' :
                                  station.priority_level === 'medium' ? 'bg-blue-100 text-blue-800' :
                                    'bg-gray-100 text-gray-800'
                            }`}>
                              {station.priority_level || 'medium'}
                            </span>
                          </div>

                          {station.data_types && station.data_types.length > 0 && (
                            <div>
                              <span className="font-medium">Data Types:</span>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {station.data_types.map(type => (
                                  <span
                                    key={type}
                                    className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs"
                                  >
                                    {type}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {station.priority_score && (
                            <div>
                              <span className="font-medium">Priority Score:</span> {station.priority_score.toFixed(1)}
                            </div>
                          )}

                          <div>
                            <span className="font-medium">Coordinates:</span>{' '}
                            {station.coordinates.lat.toFixed(4)}, {station.coordinates.lng.toFixed(4)}
                          </div>

                          {station.proximities && Object.keys(station.proximities).length > 0 && (
                            <div>
                              <span className="font-medium">Nearest Key Location:</span>
                              {Object.entries(station.proximities)
                                .sort((a, b) => a[1].distance_km - b[1].distance_km)
                                .slice(0, 1)
                                .map(([key, proximity]) => (
                                  <div key={key} className="text-xs text-gray-600">
                                    {proximity.location_name} ({proximity.distance_km}km)
                                  </div>
                                ))
                              }
                            </div>
                          )}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                );
              })}
            </>
          </LayersControl.Overlay>

          {/* Key Locations Layer */}
          {showKeyLocations && (
            <LayersControl.Overlay checked name="Key Locations">
              <>
                {Object.entries(KEY_LOCATIONS).map(([key, location]) => (
                  <Marker
                    key={key}
                    position={[location.coordinates.lat, location.coordinates.lng]}
                    icon={createKeyLocationIcon(location.priority)}
                  >
                    <Popup>
                      <div className="p-2">
                        <h3 className="font-bold">{location.name}</h3>
                        <p className="text-sm text-gray-600">Priority: {location.priority}</p>
                        <p className="text-xs text-gray-500">
                          {location.coordinates.lat.toFixed(4)}, {location.coordinates.lng.toFixed(4)}
                        </p>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </>
            </LayersControl.Overlay>
          )}

          {/* Coverage Areas Layer */}
          {showCoverage && (
            <LayersControl.Overlay name="Coverage Areas">
              <>
                {Object.values(KEY_LOCATIONS).map((location, index) => (
                  <Circle
                    key={index}
                    center={[location.coordinates.lat, location.coordinates.lng]}
                    radius={location.priority === 'primary' ? 8000 :
                      location.priority === 'secondary' ? 6000 : 4000}
                    fillColor={location.priority === 'primary' ? '#dc2626' :
                      location.priority === 'secondary' ? '#ea580c' : '#0ea5e9'}
                    fillOpacity={0.1}
                    color={location.priority === 'primary' ? '#dc2626' :
                      location.priority === 'secondary' ? '#ea580c' : '#0ea5e9'}
                    weight={2}
                  />
                ))}
              </>
            </LayersControl.Overlay>
          )}
        </LayersControl>
      </MapContainer>

      {/* Map Legend */}
      <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg shadow-lg text-xs">
        <h4 className="font-bold mb-2">Legend</h4>

        <div className="space-y-1">
          <div className="flex items-center">
            <span className="w-4 h-4 bg-red-500 rounded-full mr-2"></span>
            Critical Priority
          </div>
          <div className="flex items-center">
            <span className="w-4 h-4 bg-orange-500 rounded-full mr-2"></span>
            High Priority
          </div>
          <div className="flex items-center">
            <span className="w-4 h-4 bg-blue-500 rounded-full mr-2"></span>
            Medium Priority
          </div>
          <div className="flex items-center">
            <span className="w-4 h-4 bg-gray-500 rounded-full mr-2"></span>
            Low Priority
          </div>
        </div>

        <div className="mt-3 pt-2 border-t border-gray-200">
          <div className="text-xs text-gray-600">
            Total Stations: {filteredStations.length}
          </div>
        </div>
      </div>

      {/* Station Info Panel */}
      {selectedStation && (
        <div className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-lg max-w-sm">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-lg">
              {selectedStation.coordinates?.name || `Station ${selectedStation.station_id}`}
            </h3>
            <button
              onClick={() => setSelectedStation(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Station ID:</span>
              <span className="font-medium">{selectedStation.station_id}</span>
            </div>

            <div className="flex justify-between">
              <span className="text-gray-600">Priority:</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                selectedStation.priority_level === 'critical' ? 'bg-red-100 text-red-800' :
                  selectedStation.priority_level === 'high' ? 'bg-orange-100 text-orange-800' :
                    selectedStation.priority_level === 'medium' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
              }`}>
                {selectedStation.priority_level || 'medium'}
              </span>
            </div>

            {selectedStation.data_types && selectedStation.data_types.length > 0 && (
              <div>
                <span className="text-gray-600">Data Types:</span>
                <div className="mt-1 flex flex-wrap gap-1">
                  {selectedStation.data_types.map(type => (
                    <span
                      key={type}
                      className="px-2 py-1 bg-green-100 text-green-800 rounded text-xs"
                    >
                      {type}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedStation.priority_score && (
              <div className="flex justify-between">
                <span className="text-gray-600">Score:</span>
                <span className="font-medium">{selectedStation.priority_score.toFixed(1)}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

StationsMapView.propTypes = {
  selectedDataTypes: PropTypes.arrayOf(PropTypes.string),
  selectedPriorities: PropTypes.arrayOf(PropTypes.string),
  showKeyLocations: PropTypes.bool,
  showCoverage: PropTypes.bool,
  onStationSelect: PropTypes.func,
  height: PropTypes.string,
};

export default StationsMapView;