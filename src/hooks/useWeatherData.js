import { useState, useEffect, useMemo } from 'react';

/**
 * Enhanced Weather Data Hook - Full 59-Station NEA Integration
 * 
 * Features:
 * - Complete 59-station data access
 * - Advanced filtering and search
 * - Station comparison capabilities
 * - Performance optimization
 * - Real-time data updates
 */
export const useWeatherData = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  const fetchWeatherData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Try to fetch from data files - Enhanced 59-station data
      try {
        const response = await fetch('/data/weather/latest.json?t=' + Date.now());
        if (response.ok) {
          const data = await response.json();
          
          // Validate 59-station data structure
          if (data.stations_used && data.station_details && data.geographic_coverage) {
            console.log('✅ Enhanced 59-station data loaded successfully:', {
              total_stations: data.stations_used.length,
              data_quality: data.data_quality_score,
              geographic_coverage: data.geographic_coverage.coverage_percentage
            });
            
            setWeatherData(data);
            setLastUpdate(new Date().toISOString());
            return;
          }
        }
      } catch (err) {
        console.log('⚠️ Enhanced data not available, generating 59-station mock data');
      }

      // Enhanced Fallback: Generate comprehensive 59-station mock data
      const enhanced59StationMockData = generateEnhanced59StationMockData();
      console.log('🔄 Using enhanced 59-station mock data with', enhanced59StationMockData.stations_used.length, 'stations');
      
      setWeatherData(enhanced59StationMockData);
      setLastUpdate(new Date().toISOString());
      
    } catch (err) {
      console.error('❌ Weather data fetch failed:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWeatherData();
  }, []);

  // Enhanced station filtering and search capabilities
  const stationUtils = useMemo(() => {
    if (!weatherData) return null;

    return {
      // Get all stations with full metadata
      getAllStations: () => {
        return weatherData.stations_used.map(stationId => ({
          id: stationId,
          ...weatherData.station_details[stationId],
          // Add current readings if available
          currentData: {
            temperature: weatherData.data.temperature?.readings?.find(r => r.station === stationId)?.value,
            humidity: weatherData.data.humidity?.readings?.find(r => r.station === stationId)?.value,
            rainfall: weatherData.data.rainfall?.readings?.find(r => r.station === stationId)?.value,
            wind_speed: weatherData.data.wind_speed?.readings?.find(r => r.station === stationId)?.value,
            wind_direction: weatherData.data.wind_direction?.readings?.find(r => r.station === stationId)?.value,
          }
        })).filter(station => station.name); // Filter out stations without names
      },

      // Filter stations by region
      getStationsByRegion: (region) => {
        const allStations = stationUtils.getAllStations();
        if (!region || region === 'all') return allStations;
        
        return allStations.filter(station => {
          const stationRegion = determineRegion(station.coordinates?.lat, station.coordinates?.lng);
          return stationRegion.toLowerCase() === region.toLowerCase();
        });
      },

      // Filter stations by data type availability
      getStationsByDataType: (dataType) => {
        const allStations = stationUtils.getAllStations();
        if (!dataType || dataType === 'all') return allStations;
        
        return allStations.filter(station => 
          station.data_types && station.data_types.includes(dataType)
        );
      },

      // Search stations by name or ID
      searchStations: (query) => {
        if (!query) return stationUtils.getAllStations();
        
        const searchTerm = query.toLowerCase();
        return stationUtils.getAllStations().filter(station =>
          station.name.toLowerCase().includes(searchTerm) ||
          station.station_id.toLowerCase().includes(searchTerm)
        );
      },

      // Get stations by priority level
      getStationsByPriority: (priority) => {
        const allStations = stationUtils.getAllStations();
        if (!priority || priority === 'all') return allStations;
        
        return allStations.filter(station => 
          station.priority_level === priority
        );
      },

      // Get nearest stations to a coordinate
      getNearestStations: (lat, lng, limit = 10) => {
        const allStations = stationUtils.getAllStations();
        
        return allStations
          .map(station => ({
            ...station,
            distance: calculateDistance(lat, lng, station.coordinates?.lat, station.coordinates?.lng)
          }))
          .sort((a, b) => a.distance - b.distance)
          .slice(0, limit);
      },

      // Get stations near key locations (Hwa Chong, Bukit Timah, etc.)
      getStationsNearLocation: (locationKey) => {
        const locations = {
          hwa_chong: { lat: 1.32865, lng: 103.80227 },
          bukit_timah: { lat: 1.3520, lng: 103.7767 },
          newton: { lat: 1.3138, lng: 103.8420 },
          clementi: { lat: 1.3162, lng: 103.7649 }
        };
        
        const location = locations[locationKey];
        if (!location) return [];
        
        return stationUtils.getNearestStations(location.lat, location.lng, 10);
      },

      // Compare multiple stations
      compareStations: (stationIds) => {
        const allStations = stationUtils.getAllStations();
        return stationIds.map(id => 
          allStations.find(station => station.station_id === id)
        ).filter(Boolean);
      },

      // Get station statistics
      getStationStats: () => {
        const allStations = stationUtils.getAllStations();
        
        return {
          total: allStations.length,
          byRegion: {
            north: allStations.filter(s => determineRegion(s.coordinates?.lat, s.coordinates?.lng) === 'north').length,
            south: allStations.filter(s => determineRegion(s.coordinates?.lat, s.coordinates?.lng) === 'south').length,
            east: allStations.filter(s => determineRegion(s.coordinates?.lat, s.coordinates?.lng) === 'east').length,
            west: allStations.filter(s => determineRegion(s.coordinates?.lat, s.coordinates?.lng) === 'west').length,
            central: allStations.filter(s => determineRegion(s.coordinates?.lat, s.coordinates?.lng) === 'central').length,
          },
          byPriority: {
            critical: allStations.filter(s => s.priority_level === 'critical').length,
            high: allStations.filter(s => s.priority_level === 'high').length,
            medium: allStations.filter(s => s.priority_level === 'medium').length,
            low: allStations.filter(s => s.priority_level === 'low').length,
          },
          byDataType: {
            temperature: allStations.filter(s => s.data_types?.includes('temperature')).length,
            humidity: allStations.filter(s => s.data_types?.includes('humidity')).length,
            rainfall: allStations.filter(s => s.data_types?.includes('rainfall')).length,
            wind_speed: allStations.filter(s => s.data_types?.includes('wind_speed')).length,
            wind_direction: allStations.filter(s => s.data_types?.includes('wind_direction')).length,
          }
        };
      }
    };
  }, [weatherData]);

  return {
    // Core data
    weatherData,
    isLoading,
    error,
    lastUpdate,
    refetch: fetchWeatherData,
    
    // Enhanced 59-station utilities
    stations: stationUtils,
    
    // Legacy compatibility - Use primary station data instead of averages
    current: weatherData ? getCurrentWeatherFromPrimaryStation(weatherData) : null
  };
};

// Get current weather from primary station (not average)
const getCurrentWeatherFromPrimaryStation = (weatherData) => {
  if (!weatherData?.data) return null;

  // Priority order for primary station selection
  const priorityStations = ['S109', 'S24', 'S104', 'S115', 'S50'];
  let primaryStationData = null;

  // Find first available priority station with temperature data
  for (const stationId of priorityStations) {
    const tempReading = weatherData.data.temperature?.readings?.find(r => r.station === stationId);
    if (tempReading) {
      primaryStationData = {
        stationId: stationId,
        temperature: tempReading.value,
        stationName: tempReading.station_name,
        coordinates: tempReading.coordinates
      };
      break;
    }
  }

  // If no priority station found, use first available station
  if (!primaryStationData && weatherData.data.temperature?.readings?.length > 0) {
    const firstReading = weatherData.data.temperature.readings[0];
    primaryStationData = {
      stationId: firstReading.station,
      temperature: firstReading.value,
      stationName: firstReading.station_name,
      coordinates: firstReading.coordinates
    };
  }

  // Add other data from the same station if available
  const humidity = weatherData.data.humidity?.readings?.find(r => r.station === primaryStationData?.stationId)?.value;
  const rainfall = weatherData.data.rainfall?.readings?.find(r => r.station === primaryStationData?.stationId)?.value;

  return {
    temperature: primaryStationData?.temperature || weatherData.data?.temperature?.average || 0,
    humidity: humidity || weatherData.data?.humidity?.average || 0,
    rainfall: rainfall || weatherData.data?.rainfall?.total || 0,
    description: weatherData.data?.forecast?.general?.forecast || 'Unknown',
    stationId: primaryStationData?.stationId,
    stationName: primaryStationData?.stationName,
    location: primaryStationData?.stationName || 'Singapore',
    coordinates: primaryStationData?.coordinates
  };
};

// Helper function to determine region based on coordinates
const determineRegion = (lat, lng) => {
  if (!lat || !lng) return 'unknown';
  
  // Singapore regional boundaries (approximate)
  if (lat > 1.38) return 'north';
  if (lat < 1.28) return 'south';
  if (lng > 103.87) return 'east';
  if (lng < 103.75) return 'west';
  return 'central';
};

// Helper function to calculate distance between coordinates
const calculateDistance = (lat1, lng1, lat2, lng2) => {
  if (!lat1 || !lng1 || !lat2 || !lng2) return Infinity;
  
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Generate enhanced 59-station mock data for development/fallback
const generateEnhanced59StationMockData = () => {
  const mockStations = [
    'S109', 'S107', 'S115', 'S24', 'S104', 'S50', 'S106', 'S117', 'S43', 'S60',
    'S224', 'S77', 'S216', 'S217', 'S64', 'S90', 'S208', 'S201', 'S220', 'S213',
    'S215', 'S222', 'S221', 'S33', 'S229', 'S228', 'S71', 'S211', 'S66', 'S112',
    'S07', 'S226', 'S40', 'S223', 'S108', 'S113', 'S44', 'S119', 'S203', 'S29',
    'S94', 'S78', 'S81', 'S111', 'S900', 'S102', 'S84', 'S79', 'S92', 'S214',
    'S88', 'S123', 'S69', 'S08', 'S230', 'S210', 'S227', 'S219', 'S209'
  ];

  const station_details = {};
  const temperatureReadings = [];
  const humidityReadings = [];
  const rainfallReadings = [];

  mockStations.forEach((stationId, index) => {
    const lat = 1.2 + Math.random() * 0.3; // Singapore latitude range
    const lng = 103.6 + Math.random() * 0.5; // Singapore longitude range
    
    station_details[stationId] = {
      station_id: stationId,
      name: `Station ${stationId}`,
      coordinates: { lat, lng },
      data_types: ['temperature', 'humidity', 'rainfall'],
      priority_level: index < 20 ? 'critical' : index < 35 ? 'high' : index < 50 ? 'medium' : 'low',
      priority_score: 100 - index,
      proximities: {
        hwa_chong: {
          distance_km: Math.random() * 20,
          location_name: 'Hwa Chong International School',
          priority: 'primary'
        }
      },
      reliability_score: 0.8 + Math.random() * 0.2
    };

    // Generate realistic weather readings
    if (index < 10) { // Temperature stations
      temperatureReadings.push({
        station: stationId,
        value: 25 + Math.random() * 8,
        station_name: `Station ${stationId}`,
        coordinates: { lat, lng }
      });
    }

    if (index < 10) { // Humidity stations
      humidityReadings.push({
        station: stationId,
        value: 60 + Math.random() * 35,
        station_name: `Station ${stationId}`,
        coordinates: { lat, lng }
      });
    }

    // Rainfall stations (most stations)
    rainfallReadings.push({
      station: stationId,
      value: Math.random() < 0.8 ? 0 : Math.random() * 5,
      station_name: `Station ${stationId}`,
      coordinates: { lat, lng }
    });
  });

  return {
    timestamp: new Date().toISOString(),
    source: "Enhanced 59-Station Mock Data (Development Mode)",
    stations_used: mockStations,
    data_quality_score: 95,
    data: {
      temperature: {
        readings: temperatureReadings,
        total_stations: temperatureReadings.length,
        average: temperatureReadings.reduce((sum, r) => sum + r.value, 0) / temperatureReadings.length
      },
      humidity: {
        readings: humidityReadings,
        total_stations: humidityReadings.length,
        average: humidityReadings.reduce((sum, r) => sum + r.value, 0) / humidityReadings.length
      },
      rainfall: {
        readings: rainfallReadings,
        total_stations: rainfallReadings.length,
        total: rainfallReadings.reduce((sum, r) => sum + r.value, 0)
      },
      forecast: {
        general: {
          forecast: "Partly Cloudy",
          temperature: { low: 26, high: 33 },
          relative_humidity: { low: 60, high: 95 }
        }
      }
    },
    station_details,
    geographic_coverage: {
      regions_covered: 5,
      total_regions: 5,
      coverage_percentage: 100,
      stations_by_region: {
        north: Math.floor(mockStations.length * 0.2),
        south: Math.floor(mockStations.length * 0.2),
        east: Math.floor(mockStations.length * 0.2),
        west: Math.floor(mockStations.length * 0.2),
        central: Math.floor(mockStations.length * 0.2)
      }
    }
  };
};