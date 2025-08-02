// Enhanced Weather Stations Configuration with Comprehensive NEA Integration

import { stationConfigService } from '../services/stationConfigService.js';

// Legacy station mapping for backward compatibility
export const LEGACY_STATION_MAPPING = {
  'S117': {
    name: 'Newton',
    displayName: 'Newton (Primary)',
    description: 'Central Singapore urban monitoring - closest to Bukit Timah',
    priority: 'primary',
    coordinates: { lat: 1.3138, lng: 103.8420 },
    region: 'central',
  },
  'S50': {
    name: 'Clementi',
    displayName: 'Clementi (Primary)',
    description: 'Western residential area - near Bukit Timah corridor',
    priority: 'primary',
    coordinates: { lat: 1.3162, lng: 103.7649 },
    region: 'west',
  },
  'S106': {
    name: 'Tai Seng',
    displayName: 'Tai Seng (Primary)',
    description: 'Central-eastern business district',
    priority: 'primary',
    coordinates: { lat: 1.3337, lng: 103.8700 },
    region: 'central',
  },
  'S107': {
    name: 'East Coast Parkway',
    displayName: 'East Coast',
    description: 'Coastal weather monitoring',
    priority: 'secondary',
    coordinates: { lat: 1.3048, lng: 103.9318 },
    region: 'east',
  },
  'S43': {
    name: 'Kim Chuan Road',
    displayName: 'Kim Chuan',
    description: 'Eastern industrial area',
    priority: 'secondary',
    coordinates: { lat: 1.3429, lng: 103.8847 },
    region: 'east',
  },
  'S60': {
    name: 'Sentosa',
    displayName: 'Sentosa Island',
    description: 'Southern island resort area',
    priority: 'secondary',
    coordinates: { lat: 1.2494, lng: 103.8303 },
    region: 'south',
  },
  'S104': {
    name: 'Jurong West',
    displayName: 'Jurong West',
    description: 'Western industrial and residential hub',
    priority: 'secondary',
    coordinates: { lat: 1.3496, lng: 103.7063 },
    region: 'west',
  },
  // Additional comprehensive stations
  'S116': {
    name: 'Bukit Timah Road',
    displayName: 'Bukit Timah Road (High Priority)',
    description: 'Near Hwa Chong International School - primary monitoring zone',
    priority: 'high',
    coordinates: { lat: 1.3521, lng: 103.7649 },
    region: 'central',
  },
  'S121': {
    name: 'Bukit Timah Nature Reserve',
    displayName: 'Bukit Timah Nature Reserve (Critical)',
    description: 'Nature reserve weather monitoring - ecological reference',
    priority: 'critical',
    coordinates: { lat: 1.3520, lng: 103.7767 },
    region: 'central',
  },
  'S118': {
    name: 'Bukit Timah West',
    displayName: 'Bukit Timah West',
    description: 'Western Bukit Timah area monitoring',
    priority: 'high',
    coordinates: { lat: 1.3456, lng: 103.7425 },
    region: 'west',
  },
};

/**
 * Enhanced station mapping that integrates with comprehensive database
 */
export const STATION_MAPPING = new Proxy(LEGACY_STATION_MAPPING, {
  get(target, prop) {
    // Try to get from comprehensive database first
    try {
      const stationInfo = stationConfigService.getStationInfo(prop);
      if (stationInfo && stationInfo.source !== 'fallback') {
        return {
          name: stationInfo.coordinates?.name || stationInfo.name,
          displayName: stationInfo.coordinates?.name || `Station ${prop}`,
          description: stationInfo.coordinates?.description || 'NEA weather monitoring station',
          priority: stationInfo.priority_level || 'medium',
          coordinates: stationInfo.coordinates ? {
            lat: stationInfo.coordinates.lat,
            lng: stationInfo.coordinates.lng,
          } : { lat: 1.3521, lng: 103.8198 },
          region: determineRegion(stationInfo.coordinates),
          data_types: stationInfo.data_types || [],
          priority_score: stationInfo.priority_score || 50,
          source: 'comprehensive_database',
        };
      }
    } catch (error) {
      console.warn(`⚠️ Could not get comprehensive data for ${prop}:`, error.message);
    }

    // Fallback to legacy mapping
    return target[prop];
  },
});

/**
 * Determine region based on coordinates
 */
function determineRegion(coordinates) {
  if (!coordinates) {return 'unknown';}

  const { lat, lng } = coordinates;

  if (lat > 1.38) {return 'north';}
  if (lat < 1.28) {return 'south';}
  if (lng > 103.85) {return 'east';}
  if (lng < 103.75) {return 'west';}
  return 'central';
}

/**
 * Enhanced getStationInfo that tries comprehensive database first
 */
export const getStationInfo = (stationId) => {
  try {
    // Try comprehensive database first
    const stationInfo = stationConfigService.getStationInfo(stationId);
    if (stationInfo && stationInfo.source !== 'fallback') {
      return {
        name: stationInfo.coordinates?.name || stationInfo.name,
        displayName: stationInfo.coordinates?.name || `Station ${stationId}`,
        description: stationInfo.coordinates?.description || 'NEA weather monitoring station',
        priority: stationInfo.priority_level || 'medium',
        coordinates: stationInfo.coordinates ? {
          lat: stationInfo.coordinates.lat,
          lng: stationInfo.coordinates.lng,
        } : { lat: 1.3521, lng: 103.8198 },
        region: determineRegion(stationInfo.coordinates),
        data_types: stationInfo.data_types || [],
        priority_score: stationInfo.priority_score || 50,
        reliability_score: stationInfo.reliability_score || 0.8,
        source: 'comprehensive_database',
      };
    }
  } catch (error) {
    console.warn(`⚠️ Could not get comprehensive data for ${stationId}:`, error.message);
  }

  // Fallback to legacy mapping or default
  return STATION_MAPPING[stationId] || {
    name: `Station ${stationId}`,
    displayName: `Weather Station ${stationId}`,
    description: 'Weather monitoring station',
    priority: 'medium',
    coordinates: { lat: 1.3521, lng: 103.8198 }, // Default to Singapore center
    region: 'unknown',
    source: 'fallback',
  };
};

/**
 * Enhanced getStationsByPriority with comprehensive database support
 */
export const getStationsByPriority = (priority = 'all') => {
  try {
    // Try to get from comprehensive database
    const optimalStations = stationConfigService.getOptimalStations({
      dataType: 'all',
      priorityOnly: priority !== 'all',
    });

    if (optimalStations && Object.keys(optimalStations).length > 0) {
      const allStations = [];
      for (const stations of Object.values(optimalStations)) {
        for (const station of stations) {
          if (priority === 'all' || station.priority_level === priority) {
            allStations.push([station.station_id, {
              name: station.coordinates?.name || station.name,
              displayName: station.coordinates?.name || `Station ${station.station_id}`,
              description: station.coordinates?.description || 'NEA weather monitoring station',
              priority: station.priority_level || 'medium',
              coordinates: station.coordinates ? {
                lat: station.coordinates.lat,
                lng: station.coordinates.lng,
              } : { lat: 1.3521, lng: 103.8198 },
              region: determineRegion(station.coordinates),
              data_types: station.data_types || [],
              priority_score: station.priority_score || 50,
              source: 'comprehensive_database',
            }]);
          }
        }
      }

      // Remove duplicates based on station_id
      const uniqueStations = [];
      const seenIds = new Set();
      for (const [id, station] of allStations) {
        if (!seenIds.has(id)) {
          seenIds.add(id);
          uniqueStations.push([id, station]);
        }
      }

      return uniqueStations;
    }
  } catch (error) {
    console.warn('⚠️ Could not get stations from comprehensive database:', error.message);
  }

  // Fallback to legacy method
  if (priority === 'all') {
    return Object.entries(LEGACY_STATION_MAPPING);
  }

  return Object.entries(LEGACY_STATION_MAPPING).filter(
    ([_, station]) => station.priority === priority,
  );
};

/**
 * Get primary/critical priority stations
 */
export const getPrimaryStations = () => {
  try {
    const criticalStations = getStationsByPriority('critical');
    const highStations = getStationsByPriority('high');
    return [...criticalStations, ...highStations];
  } catch (error) {
    console.warn('⚠️ Error getting primary stations:', error.message);
    return getStationsByPriority('primary');
  }
};

/**
 * Get stations by data type
 */
export const getStationsByDataType = (dataType) => {
  try {
    const optimalStations = stationConfigService.getOptimalStations({
      dataType: dataType,
      maxStations: 10,
    });

    if (optimalStations[dataType]) {
      return optimalStations[dataType].map(station => [station.station_id, {
        name: station.coordinates?.name || station.name,
        displayName: station.coordinates?.name || `Station ${station.station_id}`,
        description: station.coordinates?.description || 'NEA weather monitoring station',
        priority: station.priority_level || 'medium',
        coordinates: station.coordinates ? {
          lat: station.coordinates.lat,
          lng: station.coordinates.lng,
        } : { lat: 1.3521, lng: 103.8198 },
        region: determineRegion(station.coordinates),
        data_types: station.data_types || [],
        priority_score: station.priority_score || 50,
        source: 'comprehensive_database',
      }]);
    }
  } catch (error) {
    console.warn(`⚠️ Could not get ${dataType} stations:`, error.message);
  }

  // Fallback to legacy stations that might have this data type
  return Object.entries(LEGACY_STATION_MAPPING).slice(0, 4);
};

/**
 * Get stations by proximity to location
 */
export const getStationsByProximity = (location, radius = 10, dataType = null) => {
  try {
    const nearbyStations = stationConfigService.getStationsByProximity(location, radius, dataType);
    return nearbyStations.map(station => [station.station_id, {
      name: station.coordinates?.name || station.name,
      displayName: station.coordinates?.name || `Station ${station.station_id}`,
      description: station.coordinates?.description || 'NEA weather monitoring station',
      priority: station.priority_level || 'medium',
      coordinates: station.coordinates ? {
        lat: station.coordinates.lat,
        lng: station.coordinates.lng,
      } : { lat: 1.3521, lng: 103.8198 },
      region: determineRegion(station.coordinates),
      data_types: station.data_types || [],
      priority_score: station.priority_score || 50,
      distance_km: stationConfigService.calculateDistance(
        location.lat, location.lng,
        station.coordinates.lat, station.coordinates.lng,
      ),
      source: 'comprehensive_database',
    }]);
  } catch (error) {
    console.warn('⚠️ Could not get stations by proximity:', error.message);
    return Object.entries(LEGACY_STATION_MAPPING).slice(0, 5);
  }
};

// Updated default center to Hwa Chong International School
export const DEFAULT_CENTER = {
  lat: 1.3437, // Hwa Chong International School
  lng: 103.7640,
  zoom: 13,
};

// Key monitoring locations
export const KEY_LOCATIONS = {
  hwa_chong: {
    name: 'Hwa Chong International School',
    coordinates: { lat: 1.3437, lng: 103.7640 },
    priority: 'primary',
  },
  bukit_timah: {
    name: 'Bukit Timah Nature Reserve',
    coordinates: { lat: 1.3520, lng: 103.7767 },
    priority: 'secondary',
  },
  newton: {
    name: 'Newton',
    coordinates: { lat: 1.3138, lng: 103.8420 },
    priority: 'tertiary',
  },
  clementi: {
    name: 'Clementi',
    coordinates: { lat: 1.3162, lng: 103.7649 },
    priority: 'tertiary',
  },
};

export default STATION_MAPPING;