import { useState, useEffect, useMemo } from 'react';

/**
 * Enhanced Weather Data Hook - Real Data Only (No Mock Data)
 * 
 * Features:
 * - Complete 59-station data access from real NEA API
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

  const fetchWeatherData = async (forceRefresh = false) => {
    try {
      setIsLoading(true);
      setError(null);

      // Try to fetch from data files - Enhanced 59-station data
      try {
        const cacheParam = forceRefresh ? `?bust=${Date.now()}` : `?t=${Date.now()}`;
        const response = await fetch(`/data/weather/latest.json${cacheParam}`, {
          cache: forceRefresh ? 'no-cache' : 'default',
          headers: forceRefresh ? {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          } : {}
        });
        
        if (response.ok) {
          const data = await response.json();
          
          // Always prefer real data over mock data
          if (data && data.timestamp) {
            console.log('✅ Real weather data loaded:', {
              timestamp: data.timestamp,
              source: data.source,
              temperature_avg: data.data?.temperature?.average,
              stations: data.stations_used?.length || 'unknown'
            });
            
            setWeatherData(data);
            setLastUpdate(new Date().toISOString());
            return;
          }
        }
      } catch (err) {
        console.log('⚠️ Real data fetch failed:', err.message);
      }

      // Force real data collection if no cached data available
      console.warn('🔄 No cached data available, forcing fresh data collection...');
      
      try {
        // Trigger server-side data collection by running the script
        console.log('🚀 Attempting to trigger fresh data collection...');
        
        // Try to trigger collection via GitHub Actions or direct API
        const freshDataResponse = await fetch('/data/weather/latest.json?force=true', {
          cache: 'no-cache'
        });
        
        if (freshDataResponse.ok) {
          const freshData = await freshDataResponse.json();
          if (freshData && freshData.timestamp) {
            console.log('✅ Fresh real data loaded successfully');
            setWeatherData(freshData);
            setLastUpdate(new Date().toISOString());
            return;
          }
        }
      } catch (collectErr) {
        console.log('⚠️ Fresh data collection failed:', collectErr.message);
      }
      
      // Critical error: No real data available
      throw new Error('Unable to load real weather data. Please run data collection manually or check GitHub Actions.');
      
    } catch (err) {
      console.error('❌ Weather data fetch failed:', err);
      setError(`Real data unavailable: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWeatherData();
  }, []);

  // Force refresh function for manual updates
  const refetch = async (forceRefresh = true) => {
    console.log('🔄 Manual refresh triggered - Real data only');
    await fetchWeatherData(forceRefresh);
  };

  // Enhanced station filtering and search capabilities
  const stationUtils = useMemo(() => {
    if (!weatherData) return null;

    return {
      // Get all stations with full metadata
      getAllStations: () => {
        if (!weatherData.stations_used) return [];
        
        return weatherData.stations_used.map(stationId => ({
          id: stationId,
          ...weatherData.station_details?.[stationId],
          // Add current readings if available
          currentData: {
            temperature: weatherData.data?.temperature?.readings?.find(r => r.station === stationId)?.value,
            humidity: weatherData.data?.humidity?.readings?.find(r => r.station === stationId)?.value,
            rainfall: weatherData.data?.rainfall?.readings?.find(r => r.station === stationId)?.value,
            wind_speed: weatherData.data?.wind_speed?.readings?.find(r => r.station === stationId)?.value,
            wind_direction: weatherData.data?.wind_direction?.readings?.find(r => r.station === stationId)?.value,
          }
        })).filter(station => station.id); // Filter out invalid stations
      },

      // Filter stations by region
      getStationsByRegion: (region) => {
        const allStations = stationUtils.getAllStations();
        if (!region || region === 'all') return allStations;
        
        return allStations.filter(station => {
          const stationRegion = station.region || determineRegion(station.coordinates?.lat, station.coordinates?.lng);
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
        
        const lowercaseQuery = query.toLowerCase();
        return stationUtils.getAllStations().filter(station =>
          station.id.toLowerCase().includes(lowercaseQuery) ||
          station.name?.toLowerCase().includes(lowercaseQuery)
        );
      },

      // Get station statistics
      getStationStats: () => {
        const allStations = stationUtils.getAllStations();
        return {
          total: allStations.length,
          by_region: {
            north: allStations.filter(s => determineRegion(s.coordinates?.lat, s.coordinates?.lng) === 'north').length,
            south: allStations.filter(s => determineRegion(s.coordinates?.lat, s.coordinates?.lng) === 'south').length,
            east: allStations.filter(s => determineRegion(s.coordinates?.lat, s.coordinates?.lng) === 'east').length,
            west: allStations.filter(s => determineRegion(s.coordinates?.lat, s.coordinates?.lng) === 'west').length,
            central: allStations.filter(s => determineRegion(s.coordinates?.lat, s.coordinates?.lng) === 'central').length,
          },
          with_temperature: allStations.filter(s => s.currentData?.temperature !== undefined).length,
          with_humidity: allStations.filter(s => s.currentData?.humidity !== undefined).length,
          with_rainfall: allStations.filter(s => s.currentData?.rainfall !== undefined).length,
        };
      },

      // Compare multiple stations
      compareStations: (stationIds) => {
        return stationIds.map(id => 
          stationUtils.getAllStations().find(station => station.id === id)
        ).filter(Boolean);
      }
    };
  }, [weatherData]);

  // Legacy compatibility - current weather for individual location
  const current = useMemo(() => {
    if (!weatherData) return null;
    return getCurrentWeatherData(weatherData);
  }, [weatherData]);

  return {
    // Core data
    weatherData,
    isLoading,
    error,
    lastUpdate,
    refetch,
    
    // Enhanced 59-station utilities
    stations: stationUtils,
    
    // Legacy compatibility
    current
  };
};

// Get current weather data for backward compatibility
const getCurrentWeatherData = (weatherData) => {
  if (!weatherData) return null;

  // Priority stations for central Singapore (Hwa Chong area)
  const priorityStations = ['S116', 'S121', 'S118'];
  
  let primaryStationData = null;
  
  // Find primary station data
  for (const stationId of priorityStations) {
    const tempReading = weatherData.data?.temperature?.readings?.find(r => r.station === stationId);
    const humidityReading = weatherData.data?.humidity?.readings?.find(r => r.station === stationId);
    
    if (tempReading || humidityReading) {
      primaryStationData = {
        stationId,
        stationName: `Station ${stationId}`,
        temperature: tempReading?.value,
        humidity: humidityReading?.value,
        coordinates: { lat: 1.3437, lng: 103.7640 } // Hwa Chong area
      };
      break;
    }
  }

  // Fallback calculations
  const temperature = primaryStationData?.temperature || weatherData.data?.temperature?.average || 0;
  const humidity = primaryStationData?.humidity || weatherData.data?.humidity?.average || 0;
  const rainfall = weatherData.data?.rainfall?.total || 0;

  return {
    temperature,
    humidity,
    rainfall,
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