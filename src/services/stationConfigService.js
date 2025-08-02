/**
 * Station Configuration Management Service
 * Manages comprehensive NEA weather stations database and configuration
 *
 * Features:
 * - Dynamic station database loading and caching
 * - Intelligent station selection algorithms
 * - Real-time station status monitoring
 * - Fallback configuration management
 * - Geographic and priority-based filtering
 * - Station reliability tracking
 */

import { apiService } from './apiService.js';

class StationConfigService {
  constructor() {
    this.stationsDatabase = null;
    this.stationCache = new Map();
    this.stationStatus = new Map();
    this.lastDatabaseUpdate = null;
    this.isLoading = false;

    // Configuration parameters
    this.config = {
      databaseUrl: '/data/stations/nea-stations-complete.json',
      fallbackUrl: '/data/stations/stations-list.json',
      cacheTTL: 30 * 60 * 1000, // 30 minutes
      maxStationsPerType: 8,
      minStationsPerType: 3,
      priorityWeights: {
        distance: 0.4,
        reliability: 0.3,
        dataTypes: 0.2,
        priority: 0.1,
      },
    };

    // Key monitoring locations (updated with Hwa Chong as primary)
    this.keyLocations = {
      hwa_chong: {
        name: 'Hwa Chong International School',
        coordinates: { lat: 1.3437, lng: 103.7640 },
        priority: 'primary',
        weight: 1.0,
      },
      bukit_timah: {
        name: 'Bukit Timah Nature Reserve',
        coordinates: { lat: 1.3520, lng: 103.7767 },
        priority: 'secondary',
        weight: 0.8,
      },
      newton: {
        name: 'Newton',
        coordinates: { lat: 1.3138, lng: 103.8420 },
        priority: 'tertiary',
        weight: 0.6,
      },
      clementi: {
        name: 'Clementi',
        coordinates: { lat: 1.3162, lng: 103.7649 },
        priority: 'tertiary',
        weight: 0.6,
      },
    };

    // Initialize service
    this.initialize();
  }

  /**
   * Initialize the service
   */
  async initialize() {
    try {
      await this.loadStationsDatabase();
      this.setupPeriodicUpdates();
    } catch (error) {
      console.warn('⚠️ Station config service initialization failed:', error.message);
    }
  }

  /**
   * Load comprehensive stations database
   */
  async loadStationsDatabase() {
    if (this.isLoading) {
      console.log('📚 Database loading in progress...');
      return this.waitForDatabaseLoad();
    }

    const cacheKey = 'stations_database';
    const cachedData = this.stationCache.get(cacheKey);

    if (cachedData && this.isCacheValid(cachedData.timestamp)) {
      console.log('📋 Using cached stations database');
      this.stationsDatabase = cachedData.data;
      return this.stationsDatabase;
    }

    this.isLoading = true;

    try {
      console.log('📚 Loading NEA stations database...');

      // Try to load comprehensive database first
      let databaseData = null;
      try {
        databaseData = await apiService.fetch(this.config.databaseUrl, {
          cacheTTL: this.config.cacheTTL,
        });
      } catch (error) {
        console.warn('⚠️ Failed to load comprehensive database, trying fallback...');

        // Fallback to basic stations list
        try {
          const fallbackData = await apiService.fetch(this.config.fallbackUrl, {
            cacheTTL: this.config.cacheTTL,
          });
          databaseData = this.convertFallbackData(fallbackData);
        } catch (fallbackError) {
          console.warn('⚠️ Fallback also failed, using hardcoded stations');
          databaseData = this.getHardcodedStations();
        }
      }

      if (databaseData) {
        this.stationsDatabase = databaseData;
        this.lastDatabaseUpdate = new Date().toISOString();

        // Cache the data
        this.stationCache.set(cacheKey, {
          data: databaseData,
          timestamp: Date.now(),
        });

        console.log(`✅ Stations database loaded: ${this.getTotalStationsCount()} stations`);
        this.logDatabaseSummary();

        return this.stationsDatabase;
      } else {
        throw new Error('No stations data available');
      }

    } catch (error) {
      console.error('❌ Failed to load stations database:', error.message);
      throw error;
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Wait for database loading to complete
   */
  async waitForDatabaseLoad() {
    const maxWait = 10000; // 10 seconds
    const checkInterval = 100;
    let waited = 0;

    while (this.isLoading && waited < maxWait) {
      await new Promise(resolve => setTimeout(resolve, checkInterval));
      waited += checkInterval;
    }

    if (this.isLoading) {
      throw new Error('Database loading timeout');
    }

    return this.stationsDatabase;
  }

  /**
   * Convert fallback data to comprehensive format
   */
  convertFallbackData(fallbackData) {
    const stations = Array.isArray(fallbackData) ? fallbackData : fallbackData.stations || [];

    return {
      metadata: {
        version: '1.0.0-fallback',
        generated_at: new Date().toISOString(),
        total_stations: stations.length,
        source: 'fallback',
      },
      stations: stations,
      station_types: this.categorizeStations(stations),
      key_locations: this.keyLocations,
    };
  }

  /**
   * Get hardcoded stations as last resort
   */
  getHardcodedStations() {
    const hardcodedStations = [
      {
        station_id: 'S60',
        coordinates: { lat: 1.2494, lng: 103.8303, name: 'Sentosa Island' },
        data_types: ['temperature', 'humidity', 'rainfall'],
        priority_level: 'high',
        priority_score: 75,
      },
      {
        station_id: 'S24',
        coordinates: { lat: 1.3677, lng: 103.7069, name: 'Choa Chu Kang' },
        data_types: ['temperature', 'humidity', 'rainfall'],
        priority_level: 'high',
        priority_score: 70,
      },
      {
        station_id: 'S107',
        coordinates: { lat: 1.3048, lng: 103.9318, name: 'East Coast Parkway' },
        data_types: ['temperature', 'humidity', 'rainfall'],
        priority_level: 'medium',
        priority_score: 65,
      },
      {
        station_id: 'S104',
        coordinates: { lat: 1.3496, lng: 103.7063, name: 'Jurong West' },
        data_types: ['temperature', 'humidity', 'rainfall'],
        priority_level: 'medium',
        priority_score: 60,
      },
      {
        station_id: 'S117',
        coordinates: { lat: 1.3138, lng: 103.8420, name: 'Newton Road' },
        data_types: ['rainfall'],
        priority_level: 'high',
        priority_score: 80,
      },
      {
        station_id: 'S50',
        coordinates: { lat: 1.3162, lng: 103.7649, name: 'Clementi Road' },
        data_types: ['rainfall'],
        priority_level: 'high',
        priority_score: 75,
      },
    ];

    return {
      metadata: {
        version: '1.0.0-hardcoded',
        generated_at: new Date().toISOString(),
        total_stations: hardcodedStations.length,
        source: 'hardcoded',
      },
      stations: hardcodedStations,
      station_types: this.categorizeStations(hardcodedStations),
      key_locations: this.keyLocations,
    };
  }

  /**
   * Categorize stations by data types
   */
  categorizeStations(stations) {
    const categories = {
      temperature: [],
      humidity: [],
      rainfall: [],
      wind: [],
      air_quality: [],
    };

    for (const station of stations) {
      if (station.data_types) {
        if (station.data_types.includes('temperature')) {
          categories.temperature.push(station);
        }
        if (station.data_types.includes('humidity')) {
          categories.humidity.push(station);
        }
        if (station.data_types.includes('rainfall')) {
          categories.rainfall.push(station);
        }
        if (station.data_types.includes('wind_speed') || station.data_types.includes('wind_direction')) {
          categories.wind.push(station);
        }
        if (station.data_types.includes('pm25') || station.data_types.includes('psi')) {
          categories.air_quality.push(station);
        }
      }
    }

    return categories;
  }

  /**
   * Get optimal stations for data collection
   */
  getOptimalStations(options = {}) {
    const {
      dataType = 'all',
      maxStations = this.config.maxStationsPerType,
      minStations = this.config.minStationsPerType,
      location = null,
      priorityOnly = false,
    } = options;

    if (!this.stationsDatabase) {
      console.warn('⚠️ No stations database available');
      return this.getFallbackStations(dataType);
    }

    const result = {};

    if (dataType === 'all') {
      // Get optimal stations for all data types
      for (const [type, stations] of Object.entries(this.stationsDatabase.station_types || {})) {
        if (stations && stations.length > 0) {
          result[type] = this.selectOptimalStationsForType(stations, {
            maxStations,
            minStations,
            location,
            priorityOnly,
          });
        }
      }
    } else if (this.stationsDatabase.station_types && this.stationsDatabase.station_types[dataType]) {
      // Get optimal stations for specific data type
      result[dataType] = this.selectOptimalStationsForType(
        this.stationsDatabase.station_types[dataType],
        { maxStations, minStations, location, priorityOnly },
      );
    }

    return result;
  }

  /**
   * Select optimal stations for a specific data type
   */
  selectOptimalStationsForType(stations, options) {
    const { maxStations, minStations, location, priorityOnly } = options;

    if (!stations || stations.length === 0) {
      return [];
    }

    // Filter by priority if requested
    let candidateStations = priorityOnly
      ? stations.filter(s => s.priority_level === 'critical' || s.priority_level === 'high')
      : stations;

    if (candidateStations.length === 0) {
      candidateStations = stations; // Fallback to all stations
    }

    // Calculate selection scores
    const scoredStations = candidateStations.map(station => ({
      ...station,
      selection_score: this.calculateSelectionScore(station, location),
    }));

    // Sort by selection score
    scoredStations.sort((a, b) => b.selection_score - a.selection_score);

    // Select appropriate number of stations
    const selectedCount = Math.min(
      Math.max(minStations, Math.ceil(scoredStations.length * 0.4)),
      maxStations,
    );

    return scoredStations.slice(0, selectedCount);
  }

  /**
   * Calculate selection score for a station
   */
  calculateSelectionScore(station, targetLocation = null) {
    let score = 0;

    // Distance score
    const distanceScore = this.calculateDistanceScore(station, targetLocation);
    score += distanceScore * this.config.priorityWeights.distance;

    // Reliability score
    const reliabilityScore = station.reliability_score || 0.8;
    score += reliabilityScore * this.config.priorityWeights.reliability;

    // Data types score
    const dataTypesScore = (station.data_types?.length || 1) / 5; // Normalize to 0-1
    score += dataTypesScore * this.config.priorityWeights.dataTypes;

    // Priority score
    const priorityLevels = { critical: 1.0, high: 0.8, medium: 0.6, low: 0.4 };
    const priorityScore = priorityLevels[station.priority_level] || 0.5;
    score += priorityScore * this.config.priorityWeights.priority;

    return Math.min(score, 1.0); // Cap at 1.0
  }

  /**
   * Calculate distance-based score
   */
  calculateDistanceScore(station, targetLocation = null) {
    if (!station.coordinates) {
      return 0.5; // Neutral score for unknown coordinates
    }

    let bestScore = 0;

    // If specific target location provided
    if (targetLocation && targetLocation.lat && targetLocation.lng) {
      const distance = this.calculateDistance(
        station.coordinates.lat,
        station.coordinates.lng,
        targetLocation.lat,
        targetLocation.lng,
      );
      return Math.max(0, 1 - (distance / 30)); // 30km max distance
    }

    // Calculate score based on proximity to key locations
    for (const [key, location] of Object.entries(this.keyLocations)) {
      const distance = this.calculateDistance(
        station.coordinates.lat,
        station.coordinates.lng,
        location.coordinates.lat,
        location.coordinates.lng,
      );

      const distanceScore = Math.max(0, 1 - (distance / 25)); // 25km max distance
      const weightedScore = distanceScore * location.weight;
      bestScore = Math.max(bestScore, weightedScore);
    }

    return bestScore;
  }

  /**
   * Calculate distance between two points (Haversine formula)
   */
  calculateDistance(lat1, lng1, lat2, lng2) {
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

  /**
   * Get fallback stations when database is unavailable
   */
  getFallbackStations(dataType) {
    const fallbackConfig = {
      temperature: [
        { station_id: 'S60', name: 'Sentosa Island' },
        { station_id: 'S24', name: 'Choa Chu Kang' },
        { station_id: 'S107', name: 'East Coast Parkway' },
        { station_id: 'S104', name: 'Jurong West' },
      ],
      humidity: [
        { station_id: 'S60', name: 'Sentosa Island' },
        { station_id: 'S24', name: 'Choa Chu Kang' },
        { station_id: 'S107', name: 'East Coast Parkway' },
        { station_id: 'S104', name: 'Jurong West' },
      ],
      rainfall: [
        { station_id: 'S117', name: 'Newton Road' },
        { station_id: 'S50', name: 'Clementi Road' },
        { station_id: 'S106', name: 'Tai Seng' },
        { station_id: 'S43', name: 'Kim Chuan Road' },
      ],
    };

    if (dataType === 'all') {
      return fallbackConfig;
    }

    return { [dataType]: fallbackConfig[dataType] || [] };
  }

  /**
   * Get station information by ID
   */
  getStationInfo(stationId) {
    if (!this.stationsDatabase || !this.stationsDatabase.stations) {
      return this.getFallbackStationInfo(stationId);
    }

    const station = this.stationsDatabase.stations.find(s => s.station_id === stationId);
    return station || this.getFallbackStationInfo(stationId);
  }

  /**
   * Get fallback station information
   */
  getFallbackStationInfo(stationId) {
    return {
      station_id: stationId,
      name: `Station ${stationId}`,
      coordinates: { lat: 1.3521, lng: 103.8198, name: `Station ${stationId}` },
      data_types: ['unknown'],
      priority_level: 'medium',
      source: 'fallback',
    };
  }

  /**
   * Update station status based on real-time data
   */
  updateStationStatus(stationId, status, dataType = null) {
    const currentStatus = this.stationStatus.get(stationId) || {
      station_id: stationId,
      status: 'unknown',
      last_seen: null,
      data_types: [],
      reading_count: 0,
    };

    currentStatus.status = status;
    currentStatus.last_seen = new Date().toISOString();
    currentStatus.reading_count++;

    if (dataType && !currentStatus.data_types.includes(dataType)) {
      currentStatus.data_types.push(dataType);
    }

    this.stationStatus.set(stationId, currentStatus);
  }

  /**
   * Get stations by proximity to location
   */
  getStationsByProximity(location, radius = 10, dataType = null) {
    if (!this.stationsDatabase || !this.stationsDatabase.stations) {
      return [];
    }

    let stations = this.stationsDatabase.stations.filter(station => {
      if (!station.coordinates) {return false;}

      const distance = this.calculateDistance(
        location.lat,
        location.lng,
        station.coordinates.lat,
        station.coordinates.lng,
      );

      return distance <= radius;
    });

    if (dataType) {
      stations = stations.filter(station =>
        station.data_types && station.data_types.includes(dataType),
      );
    }

    // Sort by distance
    stations.sort((a, b) => {
      const distanceA = this.calculateDistance(
        location.lat, location.lng,
        a.coordinates.lat, a.coordinates.lng,
      );
      const distanceB = this.calculateDistance(
        location.lat, location.lng,
        b.coordinates.lat, b.coordinates.lng,
      );
      return distanceA - distanceB;
    });

    return stations;
  }

  /**
   * Check if cache is valid
   */
  isCacheValid(timestamp) {
    return Date.now() - timestamp < this.config.cacheTTL;
  }

  /**
   * Get total stations count
   */
  getTotalStationsCount() {
    return this.stationsDatabase?.metadata?.total_stations ||
           this.stationsDatabase?.stations?.length || 0;
  }

  /**
   * Log database summary
   */
  logDatabaseSummary() {
    if (!this.stationsDatabase) {return;}

    console.log('📊 Stations Database Summary:');
    if (this.stationsDatabase.statistics?.data_types) {
      Object.entries(this.stationsDatabase.statistics.data_types).forEach(([type, count]) => {
        console.log(`  - ${type}: ${count} stations`);
      });
    }

    if (this.stationsDatabase.statistics?.priority_levels) {
      console.log('📈 Priority Distribution:');
      Object.entries(this.stationsDatabase.statistics.priority_levels).forEach(([level, count]) => {
        console.log(`  - ${level}: ${count} stations`);
      });
    }
  }

  /**
   * Setup periodic database updates
   */
  setupPeriodicUpdates() {
    // Update database every 2 hours
    setInterval(() => {
      console.log('🔄 Updating stations database...');
      this.loadStationsDatabase().catch(error => {
        console.warn('⚠️ Periodic database update failed:', error.message);
      });
    }, 2 * 60 * 60 * 1000);
  }

  /**
   * Get service health status
   */
  getHealthStatus() {
    return {
      database_loaded: !!this.stationsDatabase,
      last_update: this.lastDatabaseUpdate,
      total_stations: this.getTotalStationsCount(),
      cache_size: this.stationCache.size,
      active_stations: this.stationStatus.size,
      database_source: this.stationsDatabase?.metadata?.source || 'unknown',
    };
  }

  /**
   * Clear all caches
   */
  clearCaches() {
    this.stationCache.clear();
    this.stationStatus.clear();
    console.log('🧹 Station configuration caches cleared');
  }
}

// Create singleton instance
export const stationConfigService = new StationConfigService();
export default stationConfigService;