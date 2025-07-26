import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';

const TrafficCameraSelector = ({ 
  onCameraSelectionChange, 
  selectedCameras = [], 
  maxSelection = 20,
  className = '' 
}) => {
  const [allCameras, setAllCameras] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('distance'); // distance, quality, name, region
  const [filterRegion, setFilterRegion] = useState('all');
  const [showOnlySelected, setShowOnlySelected] = useState(false);

  // Bukit Timah Nature Reserve coordinates
  const BUKIT_TIMAH_CENTER = { lat: 1.3520, lng: 103.7767 };

  // Calculate distance between two points
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // Get image quality from metadata
  const getImageQuality = (metadata) => {
    if (!metadata) return 'unknown';
    const { width, height } = metadata;
    if (width >= 1920 && height >= 1080) return 'HD';
    if (width >= 1280 && height >= 720) return 'HD Ready';
    if (width >= 640 && height >= 480) return 'Standard';
    return 'Low';
  };

  // Classify region based on distance
  const classifyRegion = (distance) => {
    if (distance <= 5) return 'core';
    if (distance <= 15) return 'major';
    return 'extended';
  };

  // Fetch live camera data from LTA API
  const fetchLiveCameras = async () => {
    setLoading(true);
    try {
      console.log('🔍 Fetching live cameras from LTA API...');
      
      const response = await fetch('https://api.data.gov.sg/v1/transport/traffic-images', {
        headers: {
          'User-Agent': 'Singapore-Weather-Cam/1.0'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const cameras = data.items[0]?.cameras || [];

      // Process and enhance camera data
      const processedCameras = cameras.map(camera => {
        const distance = calculateDistance(
          BUKIT_TIMAH_CENTER.lat,
          BUKIT_TIMAH_CENTER.lng,
          camera.location.latitude,
          camera.location.longitude
        );

        const quality = getImageQuality(camera.image_metadata);
        const region = classifyRegion(distance);

        return {
          id: camera.camera_id,
          name: `Camera ${camera.camera_id}`,
          coordinates: {
            lat: camera.location.latitude,
            lng: camera.location.longitude
          },
          distance: Math.round(distance * 10) / 10,
          quality: quality,
          region: region,
          image_url: camera.image,
          timestamp: camera.timestamp,
          metadata: camera.image_metadata,
          isOnline: true,
          lastUpdate: new Date(camera.timestamp).toLocaleString()
        };
      });

      // Sort by distance initially
      processedCameras.sort((a, b) => a.distance - b.distance);

      setAllCameras(processedCameras);
      console.log(`✅ Loaded ${processedCameras.length} live cameras`);

    } catch (error) {
      console.error('❌ Error fetching cameras:', error);
      // Show error state but don't break the component
    } finally {
      setLoading(false);
    }
  };

  // Load cameras on component mount
  useEffect(() => {
    fetchLiveCameras();
  }, []);

  // Filter and sort cameras based on current settings
  const filteredAndSortedCameras = useMemo(() => {
    let filtered = allCameras;

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(camera => 
        camera.id.toLowerCase().includes(search) ||
        camera.name.toLowerCase().includes(search) ||
        camera.region.toLowerCase().includes(search) ||
        camera.quality.toLowerCase().includes(search)
      );
    }

    // Apply region filter
    if (filterRegion !== 'all') {
      filtered = filtered.filter(camera => camera.region === filterRegion);
    }

    // Apply selection filter
    if (showOnlySelected) {
      filtered = filtered.filter(camera => selectedCameras.includes(camera.id));
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'distance':
          return a.distance - b.distance;
        case 'quality':
          const qualityOrder = { 'HD': 4, 'HD Ready': 3, 'Standard': 2, 'Low': 1, 'unknown': 0 };
          return qualityOrder[b.quality] - qualityOrder[a.quality];
        case 'name':
          return a.name.localeCompare(b.name);
        case 'region':
          const regionOrder = { 'core': 1, 'major': 2, 'extended': 3 };
          return regionOrder[a.region] - regionOrder[b.region];
        default:
          return 0;
      }
    });

    return filtered;
  }, [allCameras, searchTerm, sortBy, filterRegion, showOnlySelected, selectedCameras]);

  // Handle camera selection
  const handleCameraToggle = (cameraId) => {
    const newSelection = selectedCameras.includes(cameraId)
      ? selectedCameras.filter(id => id !== cameraId)
      : [...selectedCameras, cameraId].slice(0, maxSelection);
    
    onCameraSelectionChange(newSelection);
  };

  // Handle select all visible cameras
  const handleSelectAllVisible = () => {
    const visibleCameraIds = filteredAndSortedCameras
      .slice(0, maxSelection - selectedCameras.length)
      .map(camera => camera.id)
      .filter(id => !selectedCameras.includes(id));
    
    const newSelection = [...selectedCameras, ...visibleCameraIds].slice(0, maxSelection);
    onCameraSelectionChange(newSelection);
  };

  // Handle clear all selection
  const handleClearAll = () => {
    onCameraSelectionChange([]);
  };

  // Get region badge color
  const getRegionBadgeColor = (region) => {
    const colors = {
      core: 'bg-red-100 text-red-800',
      major: 'bg-blue-100 text-blue-800',
      extended: 'bg-gray-100 text-gray-800'
    };
    return colors[region] || colors.extended;
  };

  // Get quality badge color
  const getQualityBadgeColor = (quality) => {
    const colors = {
      'HD': 'bg-green-100 text-green-800',
      'HD Ready': 'bg-yellow-100 text-yellow-800',
      'Standard': 'bg-orange-100 text-orange-800',
      'Low': 'bg-red-100 text-red-800',
      'unknown': 'bg-gray-100 text-gray-800'
    };
    return colors[quality] || colors.unknown;
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            🚗 Traffic Camera Selector
          </h3>
          <button
            onClick={fetchLiveCameras}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors"
            disabled={loading}
          >
            🔄 Refresh
          </button>
        </div>
        
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div className="bg-gray-50 rounded p-2 text-center">
            <div className="font-semibold text-gray-900">{allCameras.length}</div>
            <div className="text-gray-600">Total Cameras</div>
          </div>
          <div className="bg-blue-50 rounded p-2 text-center">
            <div className="font-semibold text-blue-900">{selectedCameras.length}</div>
            <div className="text-blue-600">Selected</div>
          </div>
          <div className="bg-green-50 rounded p-2 text-center">
            <div className="font-semibold text-green-900">
              {allCameras.filter(c => c.quality === 'HD').length}
            </div>
            <div className="text-green-600">HD Quality</div>
          </div>
          <div className="bg-red-50 rounded p-2 text-center">
            <div className="font-semibold text-red-900">
              {allCameras.filter(c => c.region === 'core').length}
            </div>
            <div className="text-red-600">Core Region</div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 border-b border-gray-200 space-y-4">
        {/* Search */}
        <div>
          <input
            type="text"
            placeholder="Search cameras by ID, name, region, or quality..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Filters and Sort */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="distance">Sort by Distance</option>
            <option value="quality">Sort by Quality</option>
            <option value="name">Sort by Name</option>
            <option value="region">Sort by Region</option>
          </select>

          <select
            value={filterRegion}
            onChange={(e) => setFilterRegion(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Regions</option>
            <option value="core">Core (≤5km)</option>
            <option value="major">Major (≤15km)</option>
            <option value="extended">Extended (≤50km)</option>
          </select>

          <label className="flex items-center px-3 py-2">
            <input
              type="checkbox"
              checked={showOnlySelected}
              onChange={(e) => setShowOnlySelected(e.target.checked)}
              className="mr-2"
            />
            Show Only Selected
          </label>
        </div>

        {/* Bulk Actions */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleSelectAllVisible}
            disabled={filteredAndSortedCameras.length === 0 || selectedCameras.length >= maxSelection}
            className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:bg-gray-300 transition-colors"
          >
            Select Visible ({Math.min(filteredAndSortedCameras.length, maxSelection - selectedCameras.length)})
          </button>
          <button
            onClick={handleClearAll}
            disabled={selectedCameras.length === 0}
            className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:bg-gray-300 transition-colors"
          >
            Clear All
          </button>
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm">
            {selectedCameras.length}/{maxSelection} selected
          </span>
        </div>
      </div>

      {/* Camera List */}
      <div className="max-h-96 overflow-y-auto">
        {filteredAndSortedCameras.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchTerm ? 'No cameras match your search criteria' : 'No cameras available'}
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {filteredAndSortedCameras.map((camera) => {
              const isSelected = selectedCameras.includes(camera.id);
              const canSelect = !isSelected && selectedCameras.length < maxSelection;
              
              return (
                <div
                  key={camera.id}
                  className={`
                    flex items-center p-3 rounded-lg border transition-all cursor-pointer
                    ${isSelected 
                      ? 'border-blue-500 bg-blue-50' 
                      : canSelect 
                        ? 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        : 'border-gray-200 bg-gray-50 opacity-50 cursor-not-allowed'
                    }
                  `}
                  onClick={() => canSelect || isSelected ? handleCameraToggle(camera.id) : null}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => {}}
                    disabled={!canSelect && !isSelected}
                    className="mr-3"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900">
                        Camera {camera.id}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRegionBadgeColor(camera.region)}`}>
                        {camera.region}
                      </span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getQualityBadgeColor(camera.quality)}`}>
                        {camera.quality}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600">
                      📍 {camera.distance}km from Bukit Timah • 
                      🕐 {camera.lastUpdate}
                    </div>
                  </div>

                  <div className="text-right text-sm text-gray-500">
                    <div>📐 {camera.coordinates.lat.toFixed(4)}, {camera.coordinates.lng.toFixed(4)}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

TrafficCameraSelector.propTypes = {
  onCameraSelectionChange: PropTypes.func.isRequired,
  selectedCameras: PropTypes.arrayOf(PropTypes.string),
  maxSelection: PropTypes.number,
  className: PropTypes.string
};

export default TrafficCameraSelector;