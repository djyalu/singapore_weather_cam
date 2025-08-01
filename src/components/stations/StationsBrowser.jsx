import React, { useState, useEffect, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { stationConfigService } from '../../services/stationConfigService.js';
import { KEY_LOCATIONS } from '../../config/weatherStations.js';

const StationsBrowser = ({ 
  onStationSelect = null,
  showFilters = true,
  compact = false 
}) => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDataType, setSelectedDataType] = useState('all');
  const [selectedPriority, setSelectedPriority] = useState('all');
  const [selectedRegion, setSelectedRegion] = useState('all');
  const [sortBy, setSortBy] = useState('priority_score');
  const [sortOrder, setSortOrder] = useState('desc');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'

  // Load all stations
  const loadStations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      await stationConfigService.loadStationsDatabase();
      
      // Get all available stations
      const optimalStations = stationConfigService.getOptimalStations({
        dataType: 'all',
        maxStations: 100
      });
      
      // Flatten and deduplicate stations
      const allStations = [];
      const seenIds = new Set();
      
      for (const [dataType, stationsList] of Object.entries(optimalStations)) {
        for (const station of stationsList) {
          if (!seenIds.has(station.station_id)) {
            seenIds.add(station.station_id);
            allStations.push({
              ...station,
              region: determineRegion(station.coordinates)
            });
          }
        }
      }
      
      setStations(allStations);
      
    } catch (err) {
      console.error('Error loading stations:', err);
      setError(err.message);
      
      // Fallback to empty array to prevent crashes
      setStations([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStations();
  }, [loadStations]);

  // Determine region based on coordinates
  const determineRegion = useCallback((coordinates) => {
    if (!coordinates) return 'unknown';
    
    const { lat, lng } = coordinates;
    
    if (lat > 1.38) return 'north';
    if (lat < 1.28) return 'south';
    if (lng > 103.85) return 'east';
    if (lng < 103.75) return 'west';
    return 'central';
  }, []);

  // Calculate distance to nearest key location
  const calculateNearestKeyLocation = useCallback((station) => {
    if (!station.coordinates) return null;
    
    let nearest = null;
    let minDistance = Infinity;
    
    for (const [key, location] of Object.entries(KEY_LOCATIONS)) {
      const distance = stationConfigService.calculateDistance(
        station.coordinates.lat,
        station.coordinates.lng,
        location.coordinates.lat,
        location.coordinates.lng
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        nearest = {
          key,
          name: location.name,
          distance: distance
        };
      }
    }
    
    return nearest;
  }, []);

  // Filter and sort stations
  const filteredAndSortedStations = useMemo(() => {
    let filtered = stations.filter(station => {
      // Search filter
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesId = station.station_id.toLowerCase().includes(searchLower);
        const matchesName = station.coordinates?.name?.toLowerCase().includes(searchLower) || false;
        if (!matchesId && !matchesName) return false;
      }
      
      // Data type filter
      if (selectedDataType !== 'all') {
        if (!station.data_types || !station.data_types.includes(selectedDataType)) {
          return false;
        }
      }
      
      // Priority filter
      if (selectedPriority !== 'all') {
        if (station.priority_level !== selectedPriority) {
          return false;
        }
      }
      
      // Region filter
      if (selectedRegion !== 'all') {
        if (station.region !== selectedRegion) {
          return false;
        }
      }
      
      return true;
    });
    
    // Sort stations
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'station_id':
          aValue = a.station_id;
          bValue = b.station_id;
          break;
        case 'priority_score':
          aValue = a.priority_score || 0;
          bValue = b.priority_score || 0;
          break;
        case 'priority_level':
          const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
          aValue = priorityOrder[a.priority_level] || 0;
          bValue = priorityOrder[b.priority_level] || 0;
          break;
        case 'data_types':
          aValue = a.data_types?.length || 0;
          bValue = b.data_types?.length || 0;
          break;
        case 'name':
          aValue = a.coordinates?.name || a.station_id;
          bValue = b.coordinates?.name || b.station_id;
          break;
        default:
          aValue = a.priority_score || 0;
          bValue = b.priority_score || 0;
      }
      
      if (typeof aValue === 'string') {
        return sortOrder === 'asc' ? aValue.localeCompare(bValue) : bValue.localeCompare(aValue);
      } else {
        return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
      }
    });
    
    return filtered;
  }, [stations, searchTerm, selectedDataType, selectedPriority, selectedRegion, sortBy, sortOrder]);

  // Get unique values for filters
  const uniqueDataTypes = useMemo(() => {
    const types = new Set();
    stations.forEach(station => {
      station.data_types?.forEach(type => types.add(type));
    });
    return Array.from(types).sort();
  }, [stations]);

  const uniquePriorities = useMemo(() => {
    const priorities = new Set();
    stations.forEach(station => {
      if (station.priority_level) priorities.add(station.priority_level);
    });
    return Array.from(priorities).sort((a, b) => {
      const order = { critical: 4, high: 3, medium: 2, low: 1 };
      return (order[b] || 0) - (order[a] || 0);
    });
  }, [stations]);

  const uniqueRegions = useMemo(() => {
    const regions = new Set();
    stations.forEach(station => {
      if (station.region) regions.add(station.region);
    });
    return Array.from(regions).sort();
  }, [stations]);

  // Handle station selection
  const handleStationClick = useCallback((station) => {
    if (onStationSelect) {
      onStationSelect(station);
    }
  }, [onStationSelect]);

  // Get data type emoji
  const getDataTypeEmoji = (dataType) => {
    const emojis = {
      temperature: '🌡️',
      humidity: '💧',
      rainfall: '🌧️',
      wind_speed: '💨',
      wind_direction: '🧭',
      pm25: '🏭',
      psi: '📊',
      uv_index: '☀️'
    };
    return emojis[dataType] || '📊';
  };

  // Get priority badge color
  const getPriorityColor = (priority) => {
    const colors = {
      critical: 'bg-red-100 text-red-800 border-red-200',
      high: 'bg-orange-100 text-orange-800 border-orange-200',
      medium: 'bg-blue-100 text-blue-800 border-blue-200',
      low: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return colors[priority] || colors.medium;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading stations database...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="text-red-600 mb-4">
          <p className="text-lg mb-2">⚠️ Error loading stations</p>
          <p className="text-sm">{error}</p>
        </div>
        <button 
          onClick={loadStations}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Retry Loading
        </button>
      </div>
    );
  }

  return (
    <div className={`stations-browser ${compact ? 'compact' : ''}`}>
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          NEA Weather Stations
        </h2>
        <p className="text-gray-600">
          Browse {stations.length} comprehensive weather monitoring stations across Singapore
        </p>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search
              </label>
              <input
                type="text"
                placeholder="Station ID or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Data Type Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Data Type
              </label>
              <select
                value={selectedDataType}
                onChange={(e) => setSelectedDataType(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                {uniqueDataTypes.map(type => (
                  <option key={type} value={type}>
                    {getDataTypeEmoji(type)} {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Priority
              </label>
              <select
                value={selectedPriority}
                onChange={(e) => setSelectedPriority(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Priorities</option>
                {uniquePriorities.map(priority => (
                  <option key={priority} value={priority}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Region Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Region
              </label>
              <select
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Regions</option>
                {uniqueRegions.map(region => (
                  <option key={region} value={region}>
                    {region.charAt(0).toUpperCase() + region.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Sort and View Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              {/* Sort By */}
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="priority_score">Priority Score</option>
                  <option value="priority_level">Priority Level</option>
                  <option value="station_id">Station ID</option>
                  <option value="name">Name</option>
                  <option value="data_types">Data Types Count</option>
                </select>
              </div>

              {/* Sort Order */}
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
              </button>
            </div>

            {/* View Mode */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1 text-sm rounded ${
                  viewMode === 'grid' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 text-sm rounded ${
                  viewMode === 'list' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                List
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Summary */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Showing {filteredAndSortedStations.length} of {stations.length} stations
        </p>
        
        {filteredAndSortedStations.length > 0 && (
          <div className="text-sm text-gray-500">
            {filteredAndSortedStations.filter(s => s.priority_level === 'critical').length} Critical •{' '}
            {filteredAndSortedStations.filter(s => s.priority_level === 'high').length} High •{' '}
            {filteredAndSortedStations.filter(s => s.priority_level === 'medium').length} Medium •{' '}
            {filteredAndSortedStations.filter(s => s.priority_level === 'low').length} Low
          </div>
        )}
      </div>

      {/* Stations Grid/List */}
      {filteredAndSortedStations.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-2">No stations found</p>
          <p className="text-gray-400 text-sm">Try adjusting your filters</p>
        </div>
      ) : (
        <div className={
          viewMode === 'grid' 
            ? `grid gap-4 ${compact ? 'grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`
            : 'space-y-2'
        }>
          {filteredAndSortedStations.map((station) => {
            const nearestLocation = calculateNearestKeyLocation(station);
            
            return (
              <div
                key={station.station_id}
                onClick={() => handleStationClick(station)}
                className={`
                  bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer
                  ${viewMode === 'list' ? 'flex items-center justify-between' : ''}
                  ${onStationSelect ? 'hover:border-blue-300' : ''}
                `}
              >
                {viewMode === 'grid' ? (
                  <>
                    {/* Grid View */}
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-lg text-gray-900 truncate">
                        {station.coordinates?.name || `Station ${station.station_id}`}
                      </h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded border ${getPriorityColor(station.priority_level)}`}>
                        {station.priority_level}
                      </span>
                    </div>
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">ID:</span>
                        <span className="font-mono">{station.station_id}</span>
                      </div>
                      
                      {station.priority_score && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Score:</span>
                          <span className="font-medium">{station.priority_score.toFixed(1)}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between">
                        <span className="text-gray-600">Region:</span>
                        <span className="capitalize">{station.region}</span>
                      </div>
                      
                      {nearestLocation && (
                        <div className="text-xs text-gray-500">
                          📍 {nearestLocation.distance.toFixed(1)}km from {nearestLocation.name}
                        </div>
                      )}
                    </div>
                    
                    {station.data_types && station.data_types.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex flex-wrap gap-1">
                          {station.data_types.slice(0, 4).map(type => (
                            <span 
                              key={type} 
                              className="inline-flex items-center px-2 py-1 bg-green-50 text-green-700 rounded text-xs"
                              title={type}
                            >
                              {getDataTypeEmoji(type)}
                            </span>
                          ))}
                          {station.data_types.length > 4 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                              +{station.data_types.length - 4}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* List View */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold text-gray-900">
                          {station.coordinates?.name || `Station ${station.station_id}`}
                        </h3>
                        <span className="font-mono text-sm text-gray-600">
                          {station.station_id}
                        </span>
                        <span className={`px-2 py-1 text-xs font-medium rounded border ${getPriorityColor(station.priority_level)}`}>
                          {station.priority_level}
                        </span>
                        
                        {station.data_types && (
                          <div className="flex gap-1">
                            {station.data_types.slice(0, 3).map(type => (
                              <span key={type} title={type} className="text-sm">
                                {getDataTypeEmoji(type)}
                              </span>
                            ))}
                            {station.data_types.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{station.data_types.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      {nearestLocation && (
                        <p className="text-sm text-gray-500 mt-1">
                          📍 {nearestLocation.distance.toFixed(1)}km from {nearestLocation.name} • {station.region}
                        </p>
                      )}
                    </div>
                    
                    <div className="text-right">
                      {station.priority_score && (
                        <div className="text-sm font-medium text-gray-900">
                          Score: {station.priority_score.toFixed(1)}
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

StationsBrowser.propTypes = {
  onStationSelect: PropTypes.func,
  showFilters: PropTypes.bool,
  compact: PropTypes.bool
};

export default StationsBrowser;