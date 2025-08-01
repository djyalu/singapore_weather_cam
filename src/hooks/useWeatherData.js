import { useState, useEffect, useCallback, useMemo } from 'react';
import { transformWeatherData } from '../utils/weatherDataTransformer.js';

/**
 * Enhanced useWeatherData hook with full 59-station support
 * 
 * Features:
 * - Loads all 59 NEA weather stations
 * - Provides station filtering and search
 * - Intelligent data transformation
 * - Comprehensive error handling
 * - Performance optimization with memoization
 */
export const useWeatherData = () => {
  const [rawWeatherData, setRawWeatherData] = useState(null);
  const [weatherData, setWeatherData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedStations, setSelectedStations] = useState(new Set());
  const [filterOptions, setFilterOptions] = useState({
    region: 'all',
    dataType: 'all',
    proximity: null,
    quality: 'all'
  });

  const fetchWeatherData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log('🔄 Fetching comprehensive 59-station weather data...');

      // Try to fetch from data files
      const response = await fetch('/data/weather/latest.json');
      if (response.ok) {
        const data = await response.json();
        
        console.log('✅ Raw 59-station data loaded:', {
          stations_used: data.stations_used?.length || 0,
          data_quality_score: data.data_quality_score,
          station_details: Object.keys(data.station_details || {}).length,
          geographic_coverage: data.geographic_coverage
        });
        
        // Store raw data for direct access
        setRawWeatherData(data);
        
        // Transform data for compatibility with existing components
        const transformedData = transformWeatherData(data);
        transformedData.rawData = data; // Include raw data for enhanced features
        
        setWeatherData(transformedData);
        return;
      } else {
        throw new Error(`Failed to fetch data: ${response.status}`);
      }
    } catch (err) {
      console.warn('⚠️ Local data fetch failed, using enhanced mock data:', err.message);
      
      // Enhanced fallback with 59-station structure simulation
      const enhancedMockData = createEnhanced59StationMock();
      setRawWeatherData(enhancedMockData);
      
      const transformedData = transformWeatherData(enhancedMockData);
      transformedData.rawData = enhancedMockData;
      setWeatherData(transformedData);
      
      setError(`Using mock data: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Filtered station data based on current filter options
  const filteredStations = useMemo(() => {
    if (!rawWeatherData?.station_details) return [];
    
    let stations = Object.values(rawWeatherData.station_details);
    
    // Apply region filter
    if (filterOptions.region !== 'all') {
      const regionStations = rawWeatherData.geographic_coverage?.stations_by_region?.[filterOptions.region] || [];
      stations = stations.filter(station => 
        regionStations.includes(station.station_id)
      );
    }
    
    // Apply data type filter
    if (filterOptions.dataType !== 'all') {
      stations = stations.filter(station => 
        station.data_types?.includes(filterOptions.dataType)
      );
    }
    
    // Apply quality filter
    if (filterOptions.quality !== 'all') {
      const qualityThreshold = filterOptions.quality === 'high' ? 0.8 : 0.5;
      stations = stations.filter(station => 
        (station.reliability_score || 0) >= qualityThreshold
      );
    }
    
    // Apply proximity filter if set
    if (filterOptions.proximity) {
      const { lat, lng, radius } = filterOptions.proximity;
      stations = stations.filter(station => {
        const distance = calculateDistance(
          lat, lng,
          station.coordinates.lat, station.coordinates.lng
        );
        return distance <= radius;
      });
    }
    
    return stations.sort((a, b) => {
      // Sort by priority score (highest first)
      return (b.priority_score || 0) - (a.priority_score || 0);
    });
  }, [rawWeatherData, filterOptions]);
  
  // Individual station data extractor
  const getStationData = useCallback((stationId) => {
    if (!rawWeatherData?.data || !rawWeatherData?.station_details?.[stationId]) {
      return null;
    }
    
    const stationInfo = rawWeatherData.station_details[stationId];
    const stationData = {
      ...stationInfo,
      readings: {}
    };
    
    // Extract readings for this station from all data types
    Object.entries(rawWeatherData.data).forEach(([dataType, typeData]) => {
      const reading = typeData.readings?.find(r => r.station === stationId);
      if (reading) {
        stationData.readings[dataType] = {
          value: reading.value,
          station_name: reading.station_name,
          coordinates: reading.coordinates
        };
      }
    });
    
    return stationData;
  }, [rawWeatherData]);
  
  // Station comparison functionality
  const compareStations = useCallback((stationIds) => {
    return stationIds.map(id => getStationData(id)).filter(Boolean);
  }, [getStationData]);
  
  // Search stations by name or ID
  const searchStations = useCallback((query) => {
    if (!rawWeatherData?.station_details || !query) return [];
    
    const lowerQuery = query.toLowerCase();
    return Object.values(rawWeatherData.station_details).filter(station => 
      station.name.toLowerCase().includes(lowerQuery) ||
      station.station_id.toLowerCase().includes(lowerQuery)
    );
  }, [rawWeatherData]);
  
  // Get stations by proximity to a location
  const getStationsByProximity = useCallback((lat, lng, radiusKm = 10, limit = 10) => {
    if (!rawWeatherData?.station_details) return [];
    
    const stations = Object.values(rawWeatherData.station_details)
      .map(station => ({
        ...station,
        distance: calculateDistance(lat, lng, station.coordinates.lat, station.coordinates.lng)
      }))
      .filter(station => station.distance <= radiusKm)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, limit);
      
    return stations;
  }, [rawWeatherData]);
  
  useEffect(() => {
    fetchWeatherData();
  }, [fetchWeatherData]);

  return {
    // Original API (for compatibility)
    weatherData,
    isLoading,
    error,
    refetch: fetchWeatherData,
    
    // Enhanced 59-station API
    rawWeatherData,
    filteredStations,
    selectedStations,
    setSelectedStations,
    filterOptions,
    setFilterOptions,
    
    // Utility functions
    getStationData,
    compareStations,
    searchStations,
    getStationsByProximity,
    
    // Metadata
    totalStations: rawWeatherData?.stations_used?.length || 0,
    activeStations: filteredStations.length,
    dataQualityScore: rawWeatherData?.data_quality_score || 0,
    geographicCoverage: rawWeatherData?.geographic_coverage || null
  };
};

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Enhanced mock data generator with 59-station structure
function createEnhanced59StationMock() {
  const mockStations = [
    'S109', 'S107', 'S24', 'S104', 'S224', 'S77', 'S216', 'S117', 'S217', 'S64',
    'S90', 'S208', 'S201', 'S50', 'S220', 'S213', 'S215', 'S222', 'S221', 'S33',
    'S229', 'S228', 'S71', 'S43', 'S211', 'S66', 'S112', 'S07', 'S226', 'S40',
    'S223', 'S108', 'S113', 'S44', 'S119', 'S203', 'S29', 'S94', 'S78', 'S106',
    'S81', 'S111', 'S900', 'S102', 'S60', 'S84', 'S79', 'S92', 'S214', 'S88',
    'S123', 'S115', 'S69', 'S08', 'S230', 'S210', 'S227', 'S219', 'S209'
  ];
  
  const mockData = {
    timestamp: new Date().toISOString(),
    source: "NEA Singapore (Mock - Enhanced 59-Station Structure)",
    stations_used: mockStations,
    data_quality_score: 95,
    data: {
      temperature: {
        readings: mockStations.slice(0, 15).map((id, i) => ({
          station: id,
          value: 26 + Math.random() * 6,
          station_name: `Station ${id}`,
          coordinates: { lat: 1.3 + Math.random() * 0.2, lng: 103.7 + Math.random() * 0.3 }
        })),
        total_stations: 15,
        average: 28.5,
        min: 26.1,
        max: 31.2
      },
      humidity: {
        readings: mockStations.slice(0, 12).map((id, i) => ({
          station: id,
          value: 70 + Math.random() * 25,
          station_name: `Station ${id}`,
          coordinates: { lat: 1.3 + Math.random() * 0.2, lng: 103.7 + Math.random() * 0.3 }
        })),
        total_stations: 12,
        average: 82.5,
        min: 72.0,
        max: 92.1
      },
      rainfall: {
        readings: mockStations.slice(0, 20).map((id, i) => ({
          station: id,
          value: Math.random() * 2,
          station_name: `Station ${id}`,
          coordinates: { lat: 1.3 + Math.random() * 0.2, lng: 103.7 + Math.random() * 0.3 }
        })),
        total_stations: 20,
        average: 0.5,
        min: 0,
        max: 1.8
      }
    },
    station_details: {},
    geographic_coverage: {
      regions_covered: 5,
      total_regions: 5,
      coverage_percentage: 100,
      stations_by_region: {
        north: mockStations.slice(0, 12),
        south: mockStations.slice(12, 24),
        east: mockStations.slice(24, 36),
        west: mockStations.slice(36, 48),
        central: mockStations.slice(48, 59)
      }
    }
  };
  
  // Generate station details
  mockStations.forEach((id, index) => {
    mockData.station_details[id] = {
      station_id: id,
      name: `Mock Station ${id}`,
      coordinates: {
        lat: 1.25 + Math.random() * 0.3,
        lng: 103.6 + Math.random() * 0.4,
        source: 'mock_database'
      },
      data_types: ['temperature', 'humidity', 'rainfall'].slice(0, 1 + Math.floor(Math.random() * 3)),
      priority_level: index < 10 ? 'critical' : index < 30 ? 'high' : 'medium',
      priority_score: 100 - index * 1.5,
      reliability_score: 0.8 + Math.random() * 0.2
    };
  });
  
  return mockData;
}

export default {
  useWeatherData,
  calculateDistance
};