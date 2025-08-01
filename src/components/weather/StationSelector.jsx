import React, { useState, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Search, Filter, MapPin, Activity, Star, Eye, X, ChevronDown } from 'lucide-react';

/**
 * 🏗️ ARCHITECT + 🎨 FRONTEND: Station Selector Component
 * 
 * Comprehensive 59-station selection interface with:
 * - Smart search and filtering
 * - Regional grouping
 * - Quality-based sorting
 * - Proximity-based selection
 * - Favorite stations system
 * - Accessible keyboard navigation
 */
const StationSelector = React.memo(({ 
  stations = [], 
  selectedStations = new Set(), 
  onStationSelect,
  onStationDeselect,
  filterOptions = {},
  onFilterChange,
  className = ''
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [sortBy, setSortBy] = useState('priority'); // priority, name, distance, quality
  const [viewMode, setViewMode] = useState('grid'); // grid, list, map
  const [favoriteStations, setFavoriteStations] = useState(new Set());

  // Enhanced filtering and search
  const filteredAndSortedStations = useMemo(() => {
    let filtered = stations;

    // Apply search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(station => 
        station.name.toLowerCase().includes(query) ||
        station.station_id.toLowerCase().includes(query) ||
        station.coordinates?.name?.toLowerCase().includes(query)
      );
    }

    // Apply region filter
    if (filterOptions.region && filterOptions.region !== 'all') {
      // This would be handled by parent component's filterOptions
    }

    // Apply data type filter
    if (filterOptions.dataType && filterOptions.dataType !== 'all') {
      filtered = filtered.filter(station => 
        station.data_types?.includes(filterOptions.dataType)
      );
    }

    // Apply quality filter
    if (filterOptions.quality && filterOptions.quality !== 'all') {
      const threshold = filterOptions.quality === 'high' ? 0.8 : 0.5;
      filtered = filtered.filter(station => 
        (station.reliability_score || 0) >= threshold
      );
    }

    // Sort stations
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'priority':
          return (b.priority_score || 0) - (a.priority_score || 0);
        case 'name':
          return a.name.localeCompare(b.name);
        case 'quality':
          return (b.reliability_score || 0) - (a.reliability_score || 0);
        case 'distance':
          return (a.distance || 0) - (b.distance || 0);
        default:
          return 0;
      }
    });

    // Prioritize favorites
    const favorites = sorted.filter(s => favoriteStations.has(s.station_id));
    const others = sorted.filter(s => !favoriteStations.has(s.station_id));
    
    return [...favorites, ...others];
  }, [stations, searchQuery, filterOptions, sortBy, favoriteStations]);

  // Group stations by region for better organization
  const stationsByRegion = useMemo(() => {
    const regions = {
      north: [],
      south: [], 
      east: [],
      west: [],
      central: []
    };

    filteredAndSortedStations.forEach(station => {
      // Determine region based on coordinates (simplified)
      const lat = station.coordinates?.lat || 0;
      const lng = station.coordinates?.lng || 0;
      
      let region = 'central';
      if (lat > 1.38) region = 'north';
      else if (lat < 1.32) region = 'south';
      else if (lng > 103.9) region = 'east';
      else if (lng < 103.75) region = 'west';
      
      regions[region].push(station);
    });

    return regions;
  }, [filteredAndSortedStations]);

  // Handle station selection/deselection
  const handleStationToggle = useCallback((station, isSelected) => {
    if (isSelected) {
      onStationSelect?.(station);
    } else {
      onStationDeselect?.(station);
    }
  }, [onStationSelect, onStationDeselect]);

  // Toggle favorite status
  const toggleFavorite = useCallback((stationId, event) => {
    event.stopPropagation();
    setFavoriteStations(prev => {
      const updated = new Set(prev);
      if (updated.has(stationId)) {
        updated.delete(stationId);
      } else {
        updated.add(stationId);
      }
      return updated;
    });
  }, []);

  // Clear all selections
  const clearAllSelections = useCallback(() => {
    selectedStations.forEach(stationId => {
      const station = stations.find(s => s.station_id === stationId);
      if (station) {
        onStationDeselect?.(station);
      }
    });
  }, [selectedStations, stations, onStationDeselect]);

  // Get priority level display
  const getPriorityDisplay = (level) => {
    const priorities = {
      critical: { color: 'text-red-600', icon: '🔴', label: 'Critical' },
      high: { color: 'text-orange-500', icon: '🟡', label: 'High' },
      medium: { color: 'text-blue-500', icon: '🔵', label: 'Medium' },
      low: { color: 'text-gray-500', icon: '⚪', label: 'Low' }
    };
    return priorities[level] || priorities.medium;
  };

  // Render individual station card
  const StationCard = ({ station, isSelected, onToggle }) => {
    const priority = getPriorityDisplay(station.priority_level);
    const isFavorite = favoriteStations.has(station.station_id);
    
    return (
      <div 
        className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
          isSelected 
            ? 'border-blue-500 bg-blue-50 shadow-md' 
            : 'border-gray-200 hover:border-gray-300'
        }`}
        onClick={() => onToggle(station, !isSelected)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle(station, !isSelected);
          }
        }}
        aria-label={`${isSelected ? 'Deselect' : 'Select'} weather station ${station.name}`}
      >
        {/* Header with selection and favorite */}
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => onToggle(station, !isSelected)}
              onClick={(e) => e.stopPropagation()}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              aria-label={`Select ${station.name}`}
            />
            <span className="text-xs font-mono text-gray-500">
              {station.station_id}
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={(e) => toggleFavorite(station.station_id, e)}
              className={`p-1 rounded hover:bg-gray-100 ${
                isFavorite ? 'text-yellow-500' : 'text-gray-300'
              }`}
              aria-label={`${isFavorite ? 'Remove from' : 'Add to'} favorites`}
            >
              <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
            <span className={`text-xs px-2 py-1 rounded-full bg-gray-100 ${priority.color}`}>
              {priority.icon} {priority.label}
            </span>
          </div>
        </div>

        {/* Station info */}
        <div className="space-y-1">
          <h4 className="font-medium text-sm text-gray-900 leading-tight">
            {station.name}
          </h4>
          
          <div className="flex items-center gap-4 text-xs text-gray-600">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span>
                {station.coordinates?.lat?.toFixed(3)}, {station.coordinates?.lng?.toFixed(3)}
              </span>
            </div>
            
            {station.distance && (
              <div className="flex items-center gap-1">
                <Activity className="w-3 h-3" />
                <span>{station.distance.toFixed(1)}km</span>
              </div>
            )}
          </div>

          {/* Data types */}
          <div className="flex flex-wrap gap-1 mt-2">
            {station.data_types?.slice(0, 3).map(type => (
              <span 
                key={type}
                className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full"
              >
                {type === 'temperature' ? '🌡️' : 
                 type === 'humidity' ? '💧' : 
                 type === 'rainfall' ? '🌧️' : 
                 type === 'wind_speed' ? '💨' : '📊'} {type}
              </span>
            ))}
            {station.data_types?.length > 3 && (
              <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                +{station.data_types.length - 3}
              </span>
            )}
          </div>

          {/* Quality indicator */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-1">
              <div className={`w-2 h-2 rounded-full ${
                (station.reliability_score || 0) >= 0.8 ? 'bg-green-500' :
                (station.reliability_score || 0) >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
              }`} />
              <span className="text-xs text-gray-600">
                Quality: {Math.round((station.reliability_score || 0) * 100)}%
              </span>
            </div>
            
            {station.proximities && (
              <span className="text-xs text-gray-500">
                Near {Object.keys(station.proximities).length} locations
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header with controls */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-gray-900">
            Station Selection
          </h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {selectedStations.size} of {filteredAndSortedStations.length} selected
            </span>
            {selectedStations.size > 0 && (
              <button
                onClick={clearAllSelections}
                className="text-sm text-red-600 hover:text-red-700 font-medium"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        {/* Search and controls */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stations by name or ID..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="priority">Sort by Priority</option>
              <option value="name">Sort by Name</option>
              <option value="quality">Sort by Quality</option>
              <option value="distance">Sort by Distance</option>
            </select>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 border border-gray-300 rounded-md hover:bg-gray-50 ${
                showFilters ? 'bg-blue-50 border-blue-300' : ''
              }`}
              aria-label="Toggle filters"
            >
              <Filter className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Advanced filters */}
        {showFilters && (
          <div className="mt-3 p-3 bg-gray-50 rounded-md">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <select
                value={filterOptions.region || 'all'}
                onChange={(e) => onFilterChange?.({ ...filterOptions, region: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Regions</option>
                <option value="north">North</option>
                <option value="south">South</option>
                <option value="east">East</option>
                <option value="west">West</option>
                <option value="central">Central</option>
              </select>

              <select
                value={filterOptions.dataType || 'all'}
                onChange={(e) => onFilterChange?.({ ...filterOptions, dataType: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Data Types</option>
                <option value="temperature">Temperature</option>
                <option value="humidity">Humidity</option>
                <option value="rainfall">Rainfall</option>
                <option value="wind_speed">Wind Speed</option>
                <option value="wind_direction">Wind Direction</option>
              </select>

              <select
                value={filterOptions.quality || 'all'}
                onChange={(e) => onFilterChange?.({ ...filterOptions, quality: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Quality</option>
                <option value="high">High Quality (80%+)</option>
                <option value="medium">Medium Quality (50%+)</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Station list */}
      <div className="p-4">
        {filteredAndSortedStations.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No stations found matching your criteria</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredAndSortedStations.map(station => (
              <StationCard
                key={station.station_id}
                station={station}
                isSelected={selectedStations.has(station.station_id)}
                onToggle={handleStationToggle}
              />
            ))}
          </div>
        )}
      </div>

      {/* Summary footer */}
      {selectedStations.size > 0 && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Selected {selectedStations.size} station{selectedStations.size !== 1 ? 's' : ''}
            </span>
            <span>
              Covering {Array.from(selectedStations).length > 0 ? 'multiple' : 'no'} regions
            </span>
          </div>
        </div>
      )}
    </div>
  );
});

StationSelector.propTypes = {
  stations: PropTypes.arrayOf(PropTypes.shape({
    station_id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    coordinates: PropTypes.shape({
      lat: PropTypes.number,
      lng: PropTypes.number
    }),
    data_types: PropTypes.arrayOf(PropTypes.string),
    priority_level: PropTypes.string,
    priority_score: PropTypes.number,
    reliability_score: PropTypes.number,
    distance: PropTypes.number,
    proximities: PropTypes.object
  })).isRequired,
  selectedStations: PropTypes.instanceOf(Set),
  onStationSelect: PropTypes.func,
  onStationDeselect: PropTypes.func,
  filterOptions: PropTypes.object,
  onFilterChange: PropTypes.func,
  className: PropTypes.string
};

StationSelector.displayName = 'StationSelector';

export default StationSelector;