#!/usr/bin/env node

/**
 * Enhanced Weather Data Collector with Intelligent Station Selection
 * Utilizes comprehensive NEA stations database for optimal data collection
 * 
 * Features:
 * - Intelligent station prioritization based on proximity and reliability
 * - Comprehensive geographic coverage across Singapore
 * - Station status monitoring and automatic fallbacks
 * - Data quality assessment and validation
 * - Optimized collection routes for efficiency
 * - Real-time station availability tracking
 */

import fs from 'fs/promises';
import path from 'path';

// Enhanced fetch with timeout handling
let fetch;
try {
  fetch = globalThis.fetch;
} catch {
  const { default: nodeFetch } = await import('node-fetch');
  fetch = nodeFetch;
}

const CONFIG = {
  REQUEST_TIMEOUT: 12000,
  MAX_CONCURRENT_REQUESTS: 3,
  MAX_RETRIES: 2,
  BATCH_DELAY: 800,
  STATION_DB_PATH: 'data/stations/nea-stations-complete.json',
  OUTPUT_DIR: 'data/weather',
  MIN_STATIONS_PER_TYPE: 3,
  MAX_STATIONS_PER_TYPE: 8,
  PRIORITY_WEIGHT: 0.4,
  PROXIMITY_WEIGHT: 0.3,
  RELIABILITY_WEIGHT: 0.3
};

// Enhanced NEA API endpoints
const NEA_APIS = {
  temperature: 'https://api.data.gov.sg/v1/environment/air-temperature',
  humidity: 'https://api.data.gov.sg/v1/environment/relative-humidity',
  rainfall: 'https://api.data.gov.sg/v1/environment/rainfall',
  wind_direction: 'https://api.data.gov.sg/v1/environment/wind-direction',
  wind_speed: 'https://api.data.gov.sg/v1/environment/wind-speed',
  pm25: 'https://api.data.gov.sg/v1/environment/pm25',
  psi: 'https://api.data.gov.sg/v1/environment/psi',
  uv_index: 'https://api.data.gov.sg/v1/environment/uv-index',
  forecast: 'https://api.data.gov.sg/v1/environment/24-hour-weather-forecast'
};

class EnhancedWeatherCollector {
  constructor() {
    this.stationsDatabase = null;
    this.selectedStations = new Map();
    this.stationStatus = new Map();
    this.collectionStats = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      stationsUsed: new Set(),
      dataQualityScores: []
    };
  }

  /**
   * Load comprehensive stations database
   */
  async loadStationsDatabase() {
    try {
      console.log('📚 Loading NEA stations database...');
      const dbContent = await fs.readFile(CONFIG.STATION_DB_PATH, 'utf8');
      this.stationsDatabase = JSON.parse(dbContent);
      
      console.log(`✅ Loaded ${this.stationsDatabase.metadata.total_stations} stations`);
      console.log(`📊 Data types: ${Object.keys(this.stationsDatabase.statistics.data_types).join(', ')}`);
      
      return true;
    } catch (error) {
      console.warn(`⚠️ Could not load stations database: ${error.message}`);
      console.warn('📝 Run nea-stations-mapper.js first to generate stations database');
      return false;
    }
  }

  /**
   * Intelligent station selection based on multiple criteria
   */
  selectOptimalStations() {
    console.log('🎯 Selecting optimal stations for data collection...');
    
    if (!this.stationsDatabase) {
      console.warn('⚠️ No stations database available, using fallback selection');
      return this.fallbackStationSelection();
    }

    const stationsByType = {};
    
    // Group stations by data type and calculate selection scores
    for (const [dataType, stations] of Object.entries(this.stationsDatabase.station_types)) {
      if (stations.length === 0) continue;
      
      console.log(`\n🔍 Selecting ${dataType} stations (${stations.length} available)...`);
      
      // Calculate selection scores for each station
      const scoredStations = stations.map(station => {
        const priorityScore = this.calculatePriorityScore(station);
        const proximityScore = this.calculateProximityScore(station);
        const reliabilityScore = station.reliability_score || 1.0;
        
        const totalScore = 
          (priorityScore * CONFIG.PRIORITY_WEIGHT) +
          (proximityScore * CONFIG.PROXIMITY_WEIGHT) +
          (reliabilityScore * CONFIG.RELIABILITY_WEIGHT);
        
        return {
          ...station,
          selection_score: totalScore,
          priority_score: priorityScore,
          proximity_score: proximityScore,
          reliability_score: reliabilityScore
        };
      });
      
      // Sort by selection score and select top stations
      scoredStations.sort((a, b) => b.selection_score - a.selection_score);
      
      const selectedCount = Math.min(
        Math.max(CONFIG.MIN_STATIONS_PER_TYPE, Math.ceil(stations.length * 0.3)),
        CONFIG.MAX_STATIONS_PER_TYPE
      );
      
      stationsByType[dataType] = scoredStations.slice(0, selectedCount);
      
      console.log(`✅ Selected ${selectedCount} ${dataType} stations:`);
      stationsByType[dataType].forEach((station, index) => {
        console.log(`  ${index + 1}. ${station.station_id} - ${station.coordinates?.name || 'Unknown'} (Score: ${station.selection_score.toFixed(2)})`);
      });
    }
    
    this.selectedStations = stationsByType;
    return stationsByType;
  }

  /**
   * Calculate priority score based on station metadata
   */
  calculatePriorityScore(station) {
    const priorityLevels = { critical: 1.0, high: 0.8, medium: 0.6, low: 0.4 };
    return priorityLevels[station.priority_level] || 0.5;
  }

  /**
   * Calculate proximity score to key locations
   */
  calculateProximityScore(station) {
    if (!station.proximities) return 0.5;
    
    // Find closest key location and calculate score
    let bestScore = 0;
    for (const proximity of Object.values(station.proximities)) {
      const distanceScore = Math.max(0, 1 - (proximity.distance_km / 20)); // 20km max distance
      const priorityMultiplier = proximity.priority === 'primary' ? 1.0 : 
                               proximity.priority === 'secondary' ? 0.8 : 0.6;
      const score = distanceScore * priorityMultiplier;
      bestScore = Math.max(bestScore, score);
    }
    
    return bestScore;
  }

  /**
   * Fallback station selection when database is not available
   */
  fallbackStationSelection() {
    console.log('🔄 Using fallback station selection...');
    
    // Hardcoded priority stations based on known good locations
    return {
      temperature: [
        { station_id: 'S60', coordinates: { name: 'Sentosa Island' } },
        { station_id: 'S24', coordinates: { name: 'Choa Chu Kang' } },
        { station_id: 'S107', coordinates: { name: 'East Coast Parkway' } },
        { station_id: 'S104', coordinates: { name: 'Jurong West' } }
      ],
      humidity: [
        { station_id: 'S60', coordinates: { name: 'Sentosa Island' } },
        { station_id: 'S24', coordinates: { name: 'Choa Chu Kang' } },
        { station_id: 'S107', coordinates: { name: 'East Coast Parkway' } },
        { station_id: 'S104', coordinates: { name: 'Jurong West' } }
      ],
      rainfall: [
        { station_id: 'S50', coordinates: { name: 'Clementi Road' } },
        { station_id: 'S117', coordinates: { name: 'Newton Road' } },
        { station_id: 'S106', coordinates: { name: 'Tai Seng' } },
        { station_id: 'S43', coordinates: { name: 'Kim Chuan Road' } }
      ]
    };
  }

  /**
   * Enhanced API fetcher with station status tracking
   */
  async fetchWithRetry(url, dataType, retries = CONFIG.MAX_RETRIES) {
    let lastError = null;
    
    for (let i = 0; i < retries; i++) {
      try {
        this.collectionStats.totalRequests++;
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT);
        
        const response = await fetch(url, {
          signal: controller.signal,
          headers: {
            'User-Agent': 'Singapore-Weather-Cam-Enhanced/1.0',
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          }
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        this.collectionStats.successfulRequests++;
        
        // Update station status based on response
        this.updateStationStatus(data, dataType, 'active');
        
        return data;
        
      } catch (error) {
        lastError = error;
        this.collectionStats.failedRequests++;
        
        console.warn(`⚠️ ${dataType} attempt ${i + 1} failed: ${error.message}`);
        
        if (i < retries - 1) {
          const backoffDelay = Math.pow(2, i) * 1000 + Math.random() * 500;
          await new Promise(resolve => setTimeout(resolve, backoffDelay));
        }
      }
    }
    
    // Mark stations as potentially inactive if API call fails
    this.updateStationStatus(null, dataType, 'inactive');
    throw new Error(`${dataType} API failed after ${retries} attempts: ${lastError.message}`);
  }

  /**
   * Update station status based on API responses
   */
  updateStationStatus(data, dataType, status) {
    if (data && data.items && data.items[0] && data.items[0].readings) {
      for (const reading of data.items[0].readings) {
        const stationId = reading.station_id;
        
        if (!this.stationStatus.has(stationId)) {
          this.stationStatus.set(stationId, {
            station_id: stationId,
            data_types: [],
            last_seen: new Date().toISOString(),
            status: 'active',
            reading_count: 0
          });
        }
        
        const station = this.stationStatus.get(stationId);
        station.last_seen = new Date().toISOString();
        station.status = 'active';
        station.reading_count++;
        
        if (!station.data_types.includes(dataType)) {
          station.data_types.push(dataType);
        }
        
        this.collectionStats.stationsUsed.add(stationId);
      }
    }
  }

  /**
   * Collect weather data from all available APIs
   */
  async collectAllWeatherData() {
    console.log('🌍 Starting enhanced weather data collection...');
    const startTime = Date.now();
    
    // Load stations database
    await this.loadStationsDatabase();
    
    // Select optimal stations
    this.selectOptimalStations();
    
    const results = [];
    
    // Sequential API calls with rate limiting
    for (const [dataType, url] of Object.entries(NEA_APIS)) {
      try {
        console.log(`\n📡 Collecting ${dataType} data...`);
        const data = await this.fetchWithRetry(url, dataType);
        results.push({ 
          status: 'fulfilled', 
          value: data, 
          name: dataType,
          timestamp: new Date().toISOString()
        });
        
        // Rate limiting between API calls
        await new Promise(resolve => setTimeout(resolve, CONFIG.BATCH_DELAY));
        
      } catch (error) {
        console.error(`❌ Failed to collect ${dataType}: ${error.message}`);
        results.push({ 
          status: 'rejected', 
          reason: error, 
          name: dataType,
          timestamp: new Date().toISOString()
        });
      }
    }
    
    const duration = Date.now() - startTime;
    
    // Build comprehensive weather data structure
    const weatherData = await this.buildWeatherDataStructure(results, duration);
    
    // Calculate and save collection statistics
    await this.saveCollectionStatistics(weatherData);
    
    return weatherData;
  }

  /**
   * Build comprehensive weather data structure
   */
  async buildWeatherDataStructure(results, collectionDuration) {
    const weatherData = {
      timestamp: new Date().toISOString(),
      source: 'NEA Singapore (Enhanced with Intelligent Station Selection)',
      collection_time_ms: collectionDuration,
      api_calls: results.length,
      successful_calls: results.filter(r => r.status === 'fulfilled').length,
      failed_calls: results.filter(r => r.status === 'rejected').length,
      stations_used: Array.from(this.collectionStats.stationsUsed),
      data_quality_score: this.calculateDataQualityScore(results),
      data: {},
      station_details: {},
      geographic_coverage: this.calculateGeographicCoverage()
    };

    // Process each data type
    for (const result of results) {
      if (result.status === 'fulfilled') {
        const dataType = result.name;
        const apiData = result.value;
        
        if (apiData.items && apiData.items[0] && apiData.items[0].readings) {
          const readings = apiData.items[0].readings;
          
          // Filter readings to selected stations if available
          const selectedStationIds = this.selectedStations[dataType]?.map(s => s.station_id) || [];
          const filteredReadings = selectedStationIds.length > 0 
            ? readings.filter(r => selectedStationIds.includes(r.station_id))
            : readings;
          
          weatherData.data[dataType] = {
            readings: filteredReadings.map(r => ({
              station: r.station_id,
              value: r.value,
              station_name: this.getStationName(r.station_id),
              coordinates: this.getStationCoordinates(r.station_id)
            })),
            total_stations: filteredReadings.length,
            average: this.calculateAverage(filteredReadings),
            min: Math.min(...filteredReadings.map(r => r.value)),
            max: Math.max(...filteredReadings.map(r => r.value)),
            coverage_area: this.calculateCoverageArea(filteredReadings)
          };
          
          // Store detailed station information
          for (const reading of filteredReadings) {
            const stationId = reading.station_id;
            if (!weatherData.station_details[stationId]) {
              weatherData.station_details[stationId] = this.getDetailedStationInfo(stationId);
            }
          }
        }
      }
    }

    return weatherData;
  }

  /**
   * Calculate data quality score based on multiple factors
   */
  calculateDataQualityScore(results) {
    const successRate = this.collectionStats.successfulRequests / this.collectionStats.totalRequests;
    const stationCoverage = this.collectionStats.stationsUsed.size / 50; // Assume 50 total active stations
    const dataTypesCovered = results.filter(r => r.status === 'fulfilled').length / results.length;
    
    return Math.round((successRate * 0.4 + stationCoverage * 0.3 + dataTypesCovered * 0.3) * 100);
  }

  /**
   * Calculate geographic coverage
   */
  calculateGeographicCoverage() {
    const regions = { north: 0, south: 0, east: 0, west: 0, central: 0 };
    
    for (const stationId of this.collectionStats.stationsUsed) {
      const coordinates = this.getStationCoordinates(stationId);
      if (coordinates) {
        const region = this.determineRegion(coordinates);
        regions[region]++;
      }
    }
    
    return {
      regions_covered: Object.values(regions).filter(count => count > 0).length,
      total_regions: 5,
      coverage_percentage: Math.round((Object.values(regions).filter(count => count > 0).length / 5) * 100),
      stations_by_region: regions
    };
  }

  /**
   * Determine Singapore region based on coordinates
   */
  determineRegion(coordinates) {
    const { lat, lng } = coordinates;
    
    if (lat > 1.38) return 'north';
    if (lat < 1.28) return 'south';
    if (lng > 103.85) return 'east';
    if (lng < 103.75) return 'west';
    return 'central';
  }

  /**
   * Get station name from database or generate default
   */
  getStationName(stationId) {
    if (this.stationsDatabase) {
      const station = this.stationsDatabase.stations.find(s => s.station_id === stationId);
      return station?.coordinates?.name || `Station ${stationId}`;
    }
    return `Station ${stationId}`;
  }

  /**
   * Get station coordinates from database
   */
  getStationCoordinates(stationId) {
    if (this.stationsDatabase) {
      const station = this.stationsDatabase.stations.find(s => s.station_id === stationId);
      return station?.coordinates ? {
        lat: station.coordinates.lat,
        lng: station.coordinates.lng
      } : null;
    }
    return null;
  }

  /**
   * Get detailed station information
   */
  getDetailedStationInfo(stationId) {
    if (this.stationsDatabase) {
      const station = this.stationsDatabase.stations.find(s => s.station_id === stationId);
      return station ? {
        station_id: stationId,
        name: station.coordinates?.name || `Station ${stationId}`,
        coordinates: station.coordinates,
        data_types: station.data_types,
        priority_level: station.priority_level,
        priority_score: station.priority_score,
        proximities: station.proximities,
        reliability_score: station.reliability_score
      } : null;
    }
    return {
      station_id: stationId,
      name: `Station ${stationId}`,
      source: 'fallback'
    };
  }

  /**
   * Calculate average value from readings
   */
  calculateAverage(readings) {
    if (!readings || readings.length === 0) return 0;
    const sum = readings.reduce((acc, r) => acc + (r.value || 0), 0);
    return Math.round((sum / readings.length) * 100) / 100;
  }

  /**
   * Calculate coverage area (simplified)
   */
  calculateCoverageArea(readings) {
    return `${readings.length} stations across Singapore`;
  }

  /**
   * Save collection statistics for monitoring
   */
  async saveCollectionStatistics(weatherData) {
    const stats = {
      timestamp: new Date().toISOString(),
      collection_stats: this.collectionStats,
      data_quality_score: weatherData.data_quality_score,
      geographic_coverage: weatherData.geographic_coverage,
      stations_status: Array.from(this.stationStatus.values()),
      api_performance: {
        total_calls: weatherData.api_calls,
        success_rate: Math.round((weatherData.successful_calls / weatherData.api_calls) * 100),
        average_response_time: weatherData.collection_time_ms / weatherData.api_calls
      }
    };
    
    const statsPath = path.join(CONFIG.OUTPUT_DIR, 'collection-statistics.json');
    await fs.writeFile(statsPath, JSON.stringify(stats, null, 2));
    console.log(`📊 Collection statistics saved: ${statsPath}`);
  }

  /**
   * Save weather data with enhanced structure
   */
  async saveWeatherData(weatherData) {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');

    // Ensure directory structure
    const basePath = CONFIG.OUTPUT_DIR;
    const yearPath = path.join(basePath, year.toString());
    const monthPath = path.join(yearPath, month);
    const dayPath = path.join(monthPath, day);

    await fs.mkdir(dayPath, { recursive: true });

    // Save timestamped file
    const hourlyFilePath = path.join(dayPath, `${hour}-${minute}.json`);
    await fs.writeFile(hourlyFilePath, JSON.stringify(weatherData, null, 2));

    // Update latest data
    const latestFilePath = path.join(basePath, 'latest.json');
    await fs.writeFile(latestFilePath, JSON.stringify(weatherData, null, 2));

    // Save enhanced data structure
    const enhancedFilePath = path.join(basePath, 'latest-enhanced.json');
    await fs.writeFile(enhancedFilePath, JSON.stringify(weatherData, null, 2));

    console.log(`💾 Weather data saved: ${hourlyFilePath}`);
    console.log(`📊 Quality score: ${weatherData.data_quality_score}%`);
    console.log(`🗺️ Geographic coverage: ${weatherData.geographic_coverage.coverage_percentage}%`);
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 Enhanced Weather Data Collection System');
  console.log('==========================================');
  
  try {
    const collector = new EnhancedWeatherCollector();
    const weatherData = await collector.collectAllWeatherData();
    
    if (weatherData) {
      await collector.saveWeatherData(weatherData);
      
      console.log('\n✅ Enhanced weather data collection completed successfully');
      console.log(`📊 Data quality: ${weatherData.data_quality_score}%`);
      console.log(`🌏 Stations used: ${weatherData.stations_used.length}`);
      console.log(`🗺️ Coverage: ${weatherData.geographic_coverage.coverage_percentage}%`);
      
    } else {
      console.error('❌ Failed to collect weather data');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('\n🔴 FATAL ERROR - Enhanced Weather Collection Failed');
    console.error(`  Error: ${error.message}`);
    console.error(`  Stack: ${error.stack}`);
    process.exit(1);
  }
}

// Execute if run directly
if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  main().catch((error) => {
    console.error('🔴 Main execution failed:', error);
    process.exit(1);
  });
}

export { EnhancedWeatherCollector };