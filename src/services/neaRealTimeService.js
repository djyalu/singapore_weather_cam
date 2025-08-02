/**
 * NEA Singapore Real-Time API Service
 * Direct integration with NEA APIs for live weather data
 * Eliminates dependency on static JSON files
 */

class NEARealTimeService {
  constructor() {
    this.apiBaseUrl = 'https://api.data.gov.sg/v1/environment';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes cache
    this.requestTimeout = 10000; // 10 seconds timeout
    
    // API endpoints
    this.endpoints = {
      temperature: '/air-temperature',
      humidity: '/relative-humidity', 
      rainfall: '/rainfall',
      windSpeed: '/wind-speed',
      forecast: '/2-hour-weather-forecast',
      psi: '/psi'
    };
  }

  /**
   * Get comprehensive real-time weather data from NEA APIs
   * @returns {Promise<Object>} Formatted weather data matching expected structure
   */
  async getRealTimeWeatherData() {
    console.log('🌡️ [NEA Real-Time] Starting comprehensive data fetch...');
    
    try {
      // Check cache first
      const cacheKey = 'comprehensive_weather_data';
      const cached = this.getCachedData(cacheKey);
      if (cached) {
        console.log('📋 [NEA Real-Time] Using cached data');
        return cached;
      }

      const startTime = Date.now();

      // Fetch all required data in parallel
      const apiCalls = [
        this.fetchEndpoint('temperature'),
        this.fetchEndpoint('humidity'),
        this.fetchEndpoint('rainfall'),
        this.fetchEndpoint('windSpeed'),
        this.fetchEndpoint('forecast'),
      ];

      const results = await Promise.allSettled(apiCalls);
      const [tempResult, humidityResult, rainfallResult, windResult, forecastResult] = results;

      let allTemperatureReadings = [];
      let allHumidityReadings = [];
      let allRainfallReadings = [];
      let allWindReadings = [];
      let forecastData = null;
      let successfulCalls = 0;

      // Process temperature data
      if (tempResult.status === 'fulfilled' && tempResult.value) {
        allTemperatureReadings = tempResult.value.items?.[0]?.readings?.map(reading => ({
          station: reading.station_id,
          value: reading.value,
        })) || [];
        successfulCalls++;
        console.log('✅ Temperature data:', allTemperatureReadings.length, 'stations');
      }

      // Process humidity data
      if (humidityResult.status === 'fulfilled' && humidityResult.value) {
        allHumidityReadings = humidityResult.value.items?.[0]?.readings?.map(reading => ({
          station: reading.station_id,
          value: reading.value,
        })) || [];
        successfulCalls++;
        console.log('✅ Humidity data:', allHumidityReadings.length, 'stations');
      }

      // Process rainfall data
      if (rainfallResult.status === 'fulfilled' && rainfallResult.value) {
        allRainfallReadings = rainfallResult.value.items?.[0]?.readings?.map(reading => ({
          station: reading.station_id,
          value: reading.value,
        })) || [];
        successfulCalls++;
        console.log('✅ Rainfall data:', allRainfallReadings.length, 'stations');
      }

      // Process wind data
      if (windResult.status === 'fulfilled' && windResult.value) {
        allWindReadings = windResult.value.items?.[0]?.readings?.map(reading => ({
          station: reading.station_id,
          value: reading.value,
        })) || [];
        successfulCalls++;
        console.log('✅ Wind data:', allWindReadings.length, 'stations');
      }

      // Process forecast data
      if (forecastResult.status === 'fulfilled' && forecastResult.value) {
        forecastData = forecastResult.value.items?.[0];
        successfulCalls++;
        console.log('✅ Forecast data available');
      }

      // Validate we have at least temperature data
      if (allTemperatureReadings.length === 0) {
        throw new Error('No temperature data available from NEA API');
      }

      // Collect all unique station IDs
      const allStationIds = new Set([
        ...allTemperatureReadings.map(r => r.station),
        ...allHumidityReadings.map(r => r.station),
        ...allRainfallReadings.map(r => r.station),
        ...allWindReadings.map(r => r.station),
      ]);

      // Calculate averages
      const avgTemperature = allTemperatureReadings.length > 0 
        ? allTemperatureReadings.reduce((sum, r) => sum + r.value, 0) / allTemperatureReadings.length
        : null;

      const avgHumidity = allHumidityReadings.length > 0
        ? allHumidityReadings.reduce((sum, r) => sum + r.value, 0) / allHumidityReadings.length
        : null;

      const totalRainfall = allRainfallReadings.length > 0
        ? allRainfallReadings.reduce((sum, r) => sum + r.value, 0)
        : 0;

      // Format response to match expected structure
      const formattedData = {
        timestamp: new Date().toISOString(),
        source: `NEA Singapore (Real-time - ${allStationIds.size} stations)`,
        collection_time_ms: Date.now() - startTime,
        api_calls: 5,
        successful_calls: successfulCalls,
        failed_calls: 5 - successfulCalls,
        data: {
          temperature: {
            readings: allTemperatureReadings,
            average: avgTemperature,
          },
          humidity: {
            readings: allHumidityReadings,
            average: avgHumidity,
          },
          rainfall: {
            readings: allRainfallReadings,
            total: totalRainfall,
          },
          wind: {
            readings: allWindReadings,
          },
          forecast: forecastData ? {
            general: {
              forecast: forecastData.forecasts?.[0]?.forecast || 'No forecast available',
              temperature: {
                low: 25,
                high: 34
              },
              relative_humidity: {
                low: 60,
                high: 95
              }
            }
          } : null,
        },
        stations_used: Array.from(allStationIds),
        station_details: Array.from(allStationIds).reduce((acc, stationId) => {
          const tempReading = allTemperatureReadings.find(r => r.station === stationId);
          const humidityReading = allHumidityReadings.find(r => r.station === stationId);
          const rainfallReading = allRainfallReadings.find(r => r.station === stationId);
          const windReading = allWindReadings.find(r => r.station === stationId);

          acc[stationId] = {
            id: stationId,
            temperature: tempReading?.value || null,
            humidity: humidityReading?.value || null,
            rainfall: rainfallReading?.value || null,
            wind_speed: windReading?.value || null,
            status: 'active',
            data_available: [
              tempReading && 'temperature',
              humidityReading && 'humidity',
              rainfallReading && 'rainfall',
              windReading && 'wind',
            ].filter(Boolean),
          };
          return acc;
        }, {}),
        geographic_coverage: {
          total_stations: allStationIds.size,
          coverage_percentage: Math.min(100, (allStationIds.size / 59) * 100),
          regions_covered: ['singapore'],
          data_completeness: {
            temperature: (allTemperatureReadings.length / allStationIds.size) * 100,
            humidity: (allHumidityReadings.length / allStationIds.size) * 100,
            rainfall: (allRainfallReadings.length / allStationIds.size) * 100,
            wind: (allWindReadings.length / allStationIds.size) * 100,
          },
        },
        data_quality_score: Math.min(1.0, successfulCalls / 5),
      };

      console.log('🎯 [NEA Real-Time] Complete data fetch successful:', {
        totalStations: allStationIds.size,
        avgTemperature: avgTemperature?.toFixed(2),
        avgHumidity: avgHumidity?.toFixed(1),
        successfulCalls: successfulCalls,
        collectionTime: formattedData.collection_time_ms + 'ms'
      });

      // Cache the result
      this.setCachedData(cacheKey, formattedData);

      return formattedData;

    } catch (error) {
      console.error('❌ [NEA Real-Time] Failed to fetch comprehensive data:', error);
      throw error;
    }
  }

  /**
   * Fetch data from a specific NEA endpoint
   * @param {string} endpointKey - Key from this.endpoints
   * @returns {Promise<Object>} API response data
   */
  async fetchEndpoint(endpointKey) {
    const endpoint = this.endpoints[endpointKey];
    if (!endpoint) {
      throw new Error(`Unknown endpoint: ${endpointKey}`);
    }

    const url = `${this.apiBaseUrl}${endpoint}`;
    console.log(`📡 [NEA Real-Time] Fetching ${endpointKey} from: ${url}`);

    try {
      // Create AbortController for timeout (cross-browser compatible)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.requestTimeout);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Singapore-Weather-Cam/1.0',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ [NEA Real-Time] ${endpointKey} data received successfully`);
      return data;

    } catch (error) {
      console.error(`❌ [NEA Real-Time] Failed to fetch ${endpointKey}:`, error.message);
      throw error;
    }
  }

  /**
   * Get current temperature from NEA API
   * @returns {Promise<number>} Current average temperature in Celsius
   */
  async getCurrentTemperature() {
    try {
      const data = await this.fetchEndpoint('temperature');
      const readings = data.items?.[0]?.readings || [];
      
      if (readings.length === 0) {
        throw new Error('No temperature readings available');
      }

      const avgTemperature = readings.reduce((sum, r) => sum + r.value, 0) / readings.length;
      console.log(`🌡️ [NEA Real-Time] Current temperature: ${avgTemperature.toFixed(2)}°C (${readings.length} stations)`);
      
      return avgTemperature;
    } catch (error) {
      console.error('❌ [NEA Real-Time] Failed to get current temperature:', error);
      throw error;
    }
  }

  /**
   * Get current humidity from NEA API
   * @returns {Promise<number>} Current average humidity percentage
   */
  async getCurrentHumidity() {
    try {
      const data = await this.fetchEndpoint('humidity');
      const readings = data.items?.[0]?.readings || [];
      
      if (readings.length === 0) {
        throw new Error('No humidity readings available');
      }

      const avgHumidity = readings.reduce((sum, r) => sum + r.value, 0) / readings.length;
      console.log(`💧 [NEA Real-Time] Current humidity: ${avgHumidity.toFixed(1)}% (${readings.length} stations)`);
      
      return avgHumidity;
    } catch (error) {
      console.error('❌ [NEA Real-Time] Failed to get current humidity:', error);
      throw error;
    }
  }

  /**
   * Get current rainfall data from NEA API
   * @returns {Promise<Object>} Rainfall information
   */
  async getCurrentRainfall() {
    try {
      const data = await this.fetchEndpoint('rainfall');
      const readings = data.items?.[0]?.readings || [];
      
      const activeRain = readings.filter(r => r.value > 0);
      const totalRainfall = readings.reduce((sum, r) => sum + r.value, 0);
      
      console.log(`🌧️ [NEA Real-Time] Current rainfall: ${activeRain.length}/${readings.length} stations active, total: ${totalRainfall}mm`);
      
      return {
        activeStations: activeRain.length,
        totalStations: readings.length,
        totalRainfall: totalRainfall,
        readings: readings
      };
    } catch (error) {
      console.error('❌ [NEA Real-Time] Failed to get current rainfall:', error);
      throw error;
    }
  }

  /**
   * Get cached data if still valid
   * @param {string} key - Cache key
   * @returns {Object|null} Cached data or null if expired/missing
   */
  getCachedData(key) {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const now = Date.now();
    if (now - cached.timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  /**
   * Set data in cache
   * @param {string} key - Cache key
   * @param {Object} data - Data to cache
   */
  setCachedData(key, data) {
    this.cache.set(key, {
      data: data,
      timestamp: Date.now()
    });
  }

  /**
   * Clear all cached data
   */
  clearCache() {
    this.cache.clear();
    console.log('🗑️ [NEA Real-Time] Cache cleared');
  }

  /**
   * Get service health status
   * @returns {Promise<Object>} Service health information
   */
  async getHealthStatus() {
    try {
      const startTime = Date.now();
      const temperature = await this.getCurrentTemperature();
      const responseTime = Date.now() - startTime;

      return {
        status: 'healthy',
        responseTime: responseTime,
        currentTemperature: temperature,
        cacheSize: this.cache.size,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        cacheSize: this.cache.size,
        timestamp: new Date().toISOString()
      };
    }
  }
}

// Create singleton instance
const neaRealTimeService = new NEARealTimeService();

export default neaRealTimeService;