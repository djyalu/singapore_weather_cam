// Weather Stations

import { WEATHER_STATIONS } from './constants';

export const STATION_MAPPING = {
  'S117': {
    name: 'Newton',
    displayName: 'Newton (Primary)',
    description: 'Central Singapore urban monitoring - closest to Bukit Timah',
    priority: 'primary',
    coordinates: WEATHER_STATIONS.COORDINATES.S117,
    region: 'central',
  },
  'S50': {
    name: 'Clementi',
    displayName: 'Clementi (Primary)',
    description: 'Western residential area - near Bukit Timah corridor',
    priority: 'primary',
    coordinates: WEATHER_STATIONS.COORDINATES.S50,
    region: 'west',
  },
  'S106': {
    name: 'Tai Seng',
    displayName: 'Tai Seng (Primary)',
    description: 'Central-eastern business district',
    priority: 'primary',
    coordinates: WEATHER_STATIONS.COORDINATES.S106,
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
};

export const getStationInfo = (stationId) => {
  return STATION_MAPPING[stationId] || {
    name: `Station ${stationId}`,
    displayName: `Weather Station ${stationId}`,
    description: 'Weather monitoring station',
    priority: 'secondary',
    coordinates: { lat: 1.3521, lng: 103.8198 }, // Default to Singapore center
    region: 'unknown',
  };
};

export const getStationsByPriority = (priority = 'all') => {
  if (priority === 'all') {
    return Object.entries(STATION_MAPPING);
  }

  return Object.entries(STATION_MAPPING).filter(
    ([_, station]) => station.priority === priority,
  );
};

export const getPrimaryStations = () => {
  return getStationsByPriority('primary');
};

export const DEFAULT_CENTER = {
  lat: 1.3520,
  lng: 103.7767,
  zoom: 12,
};

export default STATION_MAPPING;