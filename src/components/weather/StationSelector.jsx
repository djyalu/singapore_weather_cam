import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Search, MapPin, Filter, Star, X, Info } from 'lucide-react';

/**
 * Advanced Station Selector Component - 59-Station NEA Integration
 *
 * Features:
 * - Search and filter through all 59 NEA weather stations
 * - Multiple filtering options (region, data type, priority)
 * - Favorites system with local storage
 * - Accessibility compliant (WCAG 2.1 AA)
 * - Performance optimized for large datasets
 */
const StationSelector = React.memo(({
  stations = [],
  selectedStations = [],
  onStationSelect,
  onStationDeselect,
  maxSelections = 5,
  className = '',
  allowMultiple = true,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [selectedDataType, setSelectedDataType] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [favorites, setFavorites] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('weather-station-favorites')) || [];
    } catch {
      return [];
    }
  });

  // Memoized filtered stations for performance
  const filteredStations = useMemo(() => {
    let filtered = stations.filter(station => station && station.name);

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(station =>
        station.name.toLowerCase().includes(query) ||
        station.station_id.toLowerCase().includes(query),
      );
    }

    // Region filter
    if (selectedRegion !== 'all') {
      filtered = filtered.filter(station => {
        const lat = station.coordinates?.lat;
        const lng = station.coordinates?.lng;
        if (!lat || !lng) {return false;}

        const region = determineRegion(lat, lng);
        return region === selectedRegion;
      });
    }

    // Data type filter
    if (selectedDataType !== 'all') {
      filtered = filtered.filter(station =>
        station.data_types && station.data_types.includes(selectedDataType),
      );
    }

    // Priority filter
    if (selectedPriority !== 'all') {
      filtered = filtered.filter(station =>
        station.priority_level === selectedPriority,
      );
    }

    // Sort by: favorites first, then by priority score, then by name
    return filtered.sort((a, b) => {
      const aFavorite = favorites.includes(a.station_id);
      const bFavorite = favorites.includes(b.station_id);

      if (aFavorite && !bFavorite) {return -1;}
      if (!aFavorite && bFavorite) {return 1;}

      const aPriority = a.priority_score || 0;
      const bPriority = b.priority_score || 0;
      if (aPriority !== bPriority) {return bPriority - aPriority;}

      return a.name.localeCompare(b.name);
    });
  }, [stations, searchQuery, selectedRegion, selectedDataType, selectedPriority, favorites]);

  // Station selection handlers
  const handleStationClick = (station) => {
    const isSelected = selectedStations.some(s => s.station_id === station.station_id);

    if (isSelected) {
      onStationDeselect?.(station);
    } else {
      if (!allowMultiple) {
        // Single selection mode - deselect all others first
        selectedStations.forEach(s => onStationDeselect?.(s));
      } else if (selectedStations.length >= maxSelections) {
        // Max selections reached
        return;
      }
      onStationSelect?.(station);
    }
  };

  // Favorites management
  const toggleFavorite = (stationId) => {
    const newFavorites = favorites.includes(stationId)
      ? favorites.filter(id => id !== stationId)
      : [...favorites, stationId];

    setFavorites(newFavorites);
    try {
      localStorage.setItem('weather-station-favorites', JSON.stringify(newFavorites));
    } catch (error) {
      console.warn('Failed to save favorites:', error);
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery('');
    setSelectedRegion('all');
    setSelectedDataType('all');
    setSelectedPriority('all');
  };

  // Get station display info
  const getStationDisplayInfo = (station) => {
    const region = station.coordinates?.lat && station.coordinates?.lng
      ? determineRegion(station.coordinates.lat, station.coordinates.lng)
      : 'unknown';

    const distance = station.proximities?.hwa_chong?.distance_km;
    const dataTypes = station.data_types || [];
    const priority = station.priority_level || 'unknown';

    return { region, distance, dataTypes, priority };
  };

  // Determine if station is selected
  const isStationSelected = (station) => {
    return selectedStations.some(s => s.station_id === station.station_id);
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Weather Stations ({filteredStations.length})
          </h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
            aria-label={showFilters ? 'Hide filters' : 'Show filters'}
          >
            <Filter className="w-4 h-4" />
            Filters
          </button>
        </div>

        {/* Search */}
        <div className="mt-3 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search stations by name or ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
            aria-label="Search weather stations"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Region Filter */}
            <div>
              <label htmlFor="region-select" className="block text-xs font-medium text-gray-700 mb-1">
                Region
              </label>
              <select
                id="region-select"
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 py-1 px-2"
              >
                <option value="all">All Regions</option>
                <option value="north">North</option>
                <option value="south">South</option>
                <option value="east">East</option>
                <option value="west">West</option>
                <option value="central">Central</option>
              </select>
            </div>

            {/* Data Type Filter */}
            <div>
              <label htmlFor="data-type-select" className="block text-xs font-medium text-gray-700 mb-1">
                Data Type
              </label>
              <select
                id="data-type-select"
                value={selectedDataType}
                onChange={(e) => setSelectedDataType(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 py-1 px-2"
              >
                <option value="all">All Types</option>
                <option value="temperature">Temperature</option>
                <option value="humidity">Humidity</option>
                <option value="rainfall">Rainfall</option>
                <option value="wind_speed">Wind Speed</option>
                <option value="wind_direction">Wind Direction</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label htmlFor="priority-select" className="block text-xs font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                id="priority-select"
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="w-full text-sm border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 py-1 px-2"
              >
                <option value="all">All Priorities</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>

          <div className="mt-3 flex justify-between items-center">
            <button
              onClick={clearFilters}
              className="text-xs text-gray-600 hover:text-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-500 rounded px-2 py-1"
            >
              Clear all filters
            </button>
            <div className="text-xs text-gray-500">
              {allowMultiple && `${selectedStations.length}/${maxSelections} selected`}
            </div>
          </div>
        </div>
      )}

      {/* Station List */}
      <div className="max-h-96 overflow-y-auto">
        {filteredStations.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <Info className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p>No stations found matching your criteria</p>
            <button
              onClick={clearFilters}
              className="mt-2 text-sm text-blue-600 hover:text-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-2 py-1"
            >
              Clear filters to see all stations
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredStations.map((station) => {
              const { region, distance, dataTypes, priority } = getStationDisplayInfo(station);
              const isSelected = isStationSelected(station);
              const isFavorite = favorites.includes(station.station_id);
              const canSelect = allowMultiple ? selectedStations.length < maxSelections : true;

              return (
                <div
                  key={station.station_id}
                  className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-50 border-r-4 border-blue-500' : ''
                  } ${!canSelect && !isSelected ? 'opacity-50' : ''}`}
                  onClick={() => (canSelect || isSelected) && handleStationClick(station)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      (canSelect || isSelected) && handleStationClick(station);
                    }
                  }}
                  aria-label={`${isSelected ? 'Deselect' : 'Select'} ${station.name} weather station`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-gray-900 truncate">
                          {station.name}
                        </h4>
                        {isFavorite && (
                          <Star className="w-4 h-4 text-yellow-500 fill-current flex-shrink-0" />
                        )}
                        {isSelected && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {station.station_id}
                        </span>
                        <span className="capitalize">{region}</span>
                        {distance && (
                          <span>{distance.toFixed(1)}km from Hwa Chong</span>
                        )}
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          priority === 'critical' ? 'bg-red-100 text-red-800' :
                            priority === 'high' ? 'bg-orange-100 text-orange-800' :
                              priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                        }`}>
                          {priority}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {dataTypes.slice(0, 3).map(type => (
                          <span
                            key={type}
                            className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            {type === 'wind_speed' ? 'wind' :
                              type === 'wind_direction' ? 'direction' : type}
                          </span>
                        ))}
                        {dataTypes.length > 3 && (
                          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                            +{dataTypes.length - 3} more
                          </span>
                        )}
                      </div>

                      {/* Current data preview */}
                      {station.currentData && (
                        <div className="flex gap-3 mt-2 text-xs text-gray-600">
                          {station.currentData.temperature && (
                            <span>🌡️ {station.currentData.temperature.toFixed(1)}°C</span>
                          )}
                          {station.currentData.humidity && (
                            <span>💧 {Math.round(station.currentData.humidity)}%</span>
                          )}
                          {station.currentData.rainfall > 0 && (
                            <span>🌧️ {station.currentData.rainfall}mm</span>
                          )}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(station.station_id);
                      }}
                      className="ml-2 p-1 text-gray-400 hover:text-yellow-500 focus:outline-none focus:ring-2 focus:ring-yellow-500 rounded"
                      aria-label={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                    >
                      <Star className={`w-4 h-4 ${isFavorite ? 'fill-current text-yellow-500' : ''}`} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer */}
      {selectedStations.length > 0 && (
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {allowMultiple ? (
                `${selectedStations.length} station${selectedStations.length !== 1 ? 's' : ''} selected`
              ) : (
                `${selectedStations[0]?.name || 'Station'} selected`
              )}
            </div>
            <button
              onClick={() => selectedStations.forEach(station => onStationDeselect?.(station))}
              className="text-sm text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 rounded px-2 py-1"
            >
              Clear selection
            </button>
          </div>
        </div>
      )}
    </div>
  );
});

// Helper function to determine region based on coordinates
const determineRegion = (lat, lng) => {
  // Singapore regional boundaries (approximate)
  if (lat > 1.38) {return 'north';}
  if (lat < 1.28) {return 'south';}
  if (lng > 103.87) {return 'east';}
  if (lng < 103.75) {return 'west';}
  return 'central';
};

StationSelector.propTypes = {
  stations: PropTypes.arrayOf(
    PropTypes.shape({
      station_id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      coordinates: PropTypes.shape({
        lat: PropTypes.number,
        lng: PropTypes.number,
      }),
      data_types: PropTypes.array,
      priority_level: PropTypes.string,
      priority_score: PropTypes.number,
      proximities: PropTypes.object,
      currentData: PropTypes.object,
    }),
  ),
  selectedStations: PropTypes.array,
  onStationSelect: PropTypes.func,
  onStationDeselect: PropTypes.func,
  maxSelections: PropTypes.number,
  className: PropTypes.string,
  allowMultiple: PropTypes.bool,
};

StationSelector.displayName = 'StationSelector';

export default StationSelector;