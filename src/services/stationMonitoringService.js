/**
 * Station Monitoring and Reliability Tracking Service
 * Monitors NEA weather station performance, availability, and data quality
 * 
 * Features:
 * - Real-time station status monitoring
 * - Historical reliability tracking
 * - Data quality assessment
 * - Automatic failover recommendations
 * - Performance analytics and reporting
 * - Alert system for station outages
 */

import { apiService } from './apiService.js';
import { stationConfigService } from './stationConfigService.js';

class StationMonitoringService {
  constructor() {
    this.stationStatus = new Map();
    this.reliabilityHistory = new Map();
    this.performanceMetrics = new Map();
    this.alertThresholds = {
      reliability: 0.8, // 80% minimum reliability
      responseTime: 5000, // 5 seconds max response time
      dataAge: 3600000, // 1 hour max data age (ms)
      consecutiveFailures: 3 // Alert after 3 consecutive failures
    };
    
    this.isMonitoring = false;
    this.monitoringInterval = null;
    this.monitoringFrequency = 5 * 60 * 1000; // 5 minutes
    
    // Initialize monitoring
    this.initialize();
  }

  /**
   * Initialize the monitoring service
   */
  async initialize() {
    try {
      console.log('🔍 Initializing station monitoring service...');
      
      // Load existing monitoring data from localStorage
      this.loadMonitoringData();
      
      // Start monitoring if enabled
      if (this.shouldAutoStart()) {
        await this.startMonitoring();
      }
      
      console.log('✅ Station monitoring service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize station monitoring:', error);
    }
  }

  /**
   * Start real-time station monitoring
   */
  async startMonitoring() {
    if (this.isMonitoring) {
      console.log('⚠️ Station monitoring already active');
      return;
    }

    console.log('🚀 Starting station monitoring...');
    this.isMonitoring = true;
    
    // Perform initial monitoring check
    await this.performMonitoringCycle();
    
    // Set up periodic monitoring
    this.monitoringInterval = setInterval(async () => {
      try {
        await this.performMonitoringCycle();
      } catch (error) {
        console.error('❌ Monitoring cycle failed:', error);
      }
    }, this.monitoringFrequency);
    
    console.log(`✅ Station monitoring started (${this.monitoringFrequency / 1000}s intervals)`);
  }

  /**
   * Stop station monitoring
   */
  stopMonitoring() {
    if (!this.isMonitoring) {
      console.log('⚠️ Station monitoring not active');
      return;
    }

    console.log('🛑 Stopping station monitoring...');
    this.isMonitoring = false;
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    
    // Save monitoring data
    this.saveMonitoringData();
    
    console.log('✅ Station monitoring stopped');
  }

  /**
   * Perform a complete monitoring cycle
   */
  async performMonitoringCycle() {
    const startTime = Date.now();
    console.log('🔄 Starting monitoring cycle...');
    
    try {
      // Get latest weather data
      const weatherData = await this.fetchLatestWeatherData();
      
      if (weatherData) {
        // Analyze station performance
        await this.analyzeStationPerformance(weatherData);
        
        // Update reliability scores
        this.updateReliabilityScores();
        
        // Check for alerts
        this.checkAlerts();
        
        // Update performance metrics
        this.updatePerformanceMetrics();
      }
      
      const duration = Date.now() - startTime;
      console.log(`✅ Monitoring cycle completed in ${duration}ms`);
      
      // Save data periodically
      if (Math.random() < 0.1) { // 10% chance to save
        this.saveMonitoringData();
      }
      
    } catch (error) {
      console.error('❌ Monitoring cycle failed:', error);
      this.recordMonitoringError(error);
    }
  }

  /**
   * Fetch latest weather data from APIs
   */
  async fetchLatestWeatherData() {
    try {
      // Try to get data from local cache first
      const localData = await this.getLocalWeatherData();
      if (localData && this.isDataFresh(localData)) {
        return localData;
      }
      
      // Fallback to API calls for monitoring
      const apis = [
        'https://api.data.gov.sg/v1/environment/air-temperature',
        'https://api.data.gov.sg/v1/environment/relative-humidity',
        'https://api.data.gov.sg/v1/environment/rainfall'
      ];
      
      const results = await Promise.allSettled(
        apis.map(url => apiService.fetch(url, { timeout: 10000 }))
      );
      
      // Combine results
      const combinedData = {
        timestamp: new Date().toISOString(),
        apis: results.map((result, index) => ({
          url: apis[index],
          status: result.status,
          data: result.status === 'fulfilled' ? result.value : null,
          error: result.status === 'rejected' ? result.reason.message : null
        }))
      };
      
      return combinedData;
      
    } catch (error) {
      console.error('Error fetching weather data for monitoring:', error);
      return null;
    }
  }

  /**
   * Get local weather data
   */
  async getLocalWeatherData() {
    try {
      const response = await fetch('/data/weather/latest.json');
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      // Ignore local data errors
    }
    return null;
  }

  /**
   * Check if data is fresh enough for monitoring
   */
  isDataFresh(data) {
    if (!data || !data.timestamp) return false;
    
    const dataAge = Date.now() - new Date(data.timestamp).getTime();
    return dataAge < this.alertThresholds.dataAge;
  }

  /**
   * Analyze station performance from weather data
   */
  async analyzeStationPerformance(weatherData) {
    const now = new Date().toISOString();
    
    // Analyze API-based data
    if (weatherData.apis) {
      for (const apiResult of weatherData.apis) {
        if (apiResult.status === 'fulfilled' && apiResult.data) {
          await this.analyzeApiStations(apiResult.data, apiResult.url, now);
        } else {
          // Record API failure
          this.recordApiFailure(apiResult.url, apiResult.error, now);
        }
      }
    }
    
    // Analyze local data stations
    if (weatherData.data) {
      await this.analyzeLocalDataStations(weatherData, now);
    }
  }

  /**
   * Analyze stations from API response
   */
  async analyzeApiStations(apiData, apiUrl, timestamp) {
    if (!apiData.items || !apiData.items[0] || !apiData.items[0].readings) {
      return;
    }
    
    const readings = apiData.items[0].readings;
    const dataType = this.extractDataTypeFromUrl(apiUrl);
    
    for (const reading of readings) {
      const stationId = reading.station_id;
      
      // Update station status
      this.updateStationStatus(stationId, {
        last_seen: timestamp,
        status: 'active',
        data_types: [dataType],
        latest_value: reading.value,
        source: 'api_monitoring'
      });
      
      // Record successful reading
      this.recordStationReading(stationId, dataType, reading.value, timestamp, true);
    }
  }

  /**
   * Analyze stations from local weather data
   */
  async analyzeLocalDataStations(weatherData, timestamp) {
    const dataTypes = ['temperature', 'humidity', 'rainfall'];
    
    for (const dataType of dataTypes) {
      if (weatherData.data && weatherData.data[dataType] && weatherData.data[dataType].readings) {
        const readings = weatherData.data[dataType].readings;
        
        for (const reading of readings) {
          const stationId = reading.station;
          
          // Update station status
          this.updateStationStatus(stationId, {
            last_seen: timestamp,
            status: 'active',
            data_types: [dataType],
            latest_value: reading.value,
            station_name: reading.station_name,
            coordinates: reading.coordinates,
            source: 'local_data'
          });
          
          // Record successful reading
          this.recordStationReading(stationId, dataType, reading.value, timestamp, true);
        }
      }
    }
  }

  /**
   * Extract data type from API URL
   */
  extractDataTypeFromUrl(url) {
    if (url.includes('air-temperature')) return 'temperature';
    if (url.includes('relative-humidity')) return 'humidity';
    if (url.includes('rainfall')) return 'rainfall';
    if (url.includes('wind-speed')) return 'wind_speed';
    if (url.includes('wind-direction')) return 'wind_direction';
    return 'unknown';
  }

  /**
   * Update station status
   */
  updateStationStatus(stationId, statusUpdate) {
    const currentStatus = this.stationStatus.get(stationId) || {
      station_id: stationId,
      status: 'unknown',
      first_seen: statusUpdate.last_seen,
      last_seen: null,
      data_types: [],
      reading_count: 0,
      consecutive_failures: 0,
      consecutive_successes: 0,
      reliability_score: 1.0
    };
    
    // Merge status update
    const updatedStatus = {
      ...currentStatus,
      ...statusUpdate,
      data_types: this.mergeDataTypes(currentStatus.data_types, statusUpdate.data_types || []),
      reading_count: currentStatus.reading_count + 1
    };
    
    // Update consecutive counters
    if (statusUpdate.status === 'active') {
      updatedStatus.consecutive_successes++;
      updatedStatus.consecutive_failures = 0;
    } else if (statusUpdate.status === 'inactive') {
      updatedStatus.consecutive_failures++;
      updatedStatus.consecutive_successes = 0;
    }
    
    this.stationStatus.set(stationId, updatedStatus);
  }

  /**
   * Merge data types arrays
   */
  mergeDataTypes(existing, newTypes) {
    const merged = [...existing];
    for (const type of newTypes) {
      if (!merged.includes(type)) {
        merged.push(type);
      }
    }
    return merged;
  }

  /**
   * Record station reading for reliability tracking
   */
  recordStationReading(stationId, dataType, value, timestamp, success) {
    const key = `${stationId}_${dataType}`;
    
    if (!this.reliabilityHistory.has(key)) {
      this.reliabilityHistory.set(key, {
        station_id: stationId,
        data_type: dataType,
        readings: [],
        success_count: 0,
        total_count: 0,
        reliability_score: 1.0
      });
    }
    
    const history = this.reliabilityHistory.get(key);
    
    // Add reading to history (keep last 100 readings)
    history.readings.push({
      timestamp,
      value,
      success
    });
    
    if (history.readings.length > 100) {
      history.readings.shift();
    }
    
    // Update counters
    history.total_count++;
    if (success) {
      history.success_count++;
    }
    
    // Calculate reliability score
    history.reliability_score = history.success_count / history.total_count;
    
    this.reliabilityHistory.set(key, history);
  }

  /**
   * Record API failure
   */
  recordApiFailure(apiUrl, error, timestamp) {
    const dataType = this.extractDataTypeFromUrl(apiUrl);
    
    // This affects all stations for this data type
    // We'll mark them as potentially inactive
    for (const [stationId, status] of this.stationStatus.entries()) {
      if (status.data_types.includes(dataType)) {
        this.recordStationReading(stationId, dataType, null, timestamp, false);
      }
    }
  }

  /**
   * Update reliability scores for all stations
   */
  updateReliabilityScores() {
    for (const [stationId, status] of this.stationStatus.entries()) {
      let totalReliability = 0;
      let dataTypeCount = 0;
      
      for (const dataType of status.data_types) {
        const key = `${stationId}_${dataType}`;
        const history = this.reliabilityHistory.get(key);
        
        if (history) {
          totalReliability += history.reliability_score;
          dataTypeCount++;
        }
      }
      
      if (dataTypeCount > 0) {
        status.reliability_score = totalReliability / dataTypeCount;
      }
      
      this.stationStatus.set(stationId, status);
    }
  }

  /**
   * Check for alerts based on thresholds
   */
  checkAlerts() {
    const alerts = [];
    const now = Date.now();
    
    for (const [stationId, status] of this.stationStatus.entries()) {
      // Check reliability threshold
      if (status.reliability_score < this.alertThresholds.reliability) {
        alerts.push({
          type: 'low_reliability',
          station_id: stationId,
          severity: 'warning',
          message: `Station ${stationId} reliability dropped to ${(status.reliability_score * 100).toFixed(1)}%`,
          timestamp: new Date().toISOString(),
          data: { reliability_score: status.reliability_score }
        });
      }
      
      // Check consecutive failures
      if (status.consecutive_failures >= this.alertThresholds.consecutiveFailures) {
        alerts.push({
          type: 'consecutive_failures',
          station_id: stationId,
          severity: 'error',
          message: `Station ${stationId} has ${status.consecutive_failures} consecutive failures`,
          timestamp: new Date().toISOString(),
          data: { consecutive_failures: status.consecutive_failures }
        });
      }
      
      // Check data age
      if (status.last_seen) {
        const dataAge = now - new Date(status.last_seen).getTime();
        if (dataAge > this.alertThresholds.dataAge) {
          alerts.push({
            type: 'stale_data',
            station_id: stationId,
            severity: 'warning',
            message: `Station ${stationId} data is ${Math.round(dataAge / 60000)} minutes old`,
            timestamp: new Date().toISOString(),
            data: { data_age_minutes: Math.round(dataAge / 60000) }
          });
        }
      }
    }
    
    // Process alerts
    if (alerts.length > 0) {
      this.processAlerts(alerts);
    }
  }

  /**
   * Process alerts (log, notify, etc.)
   */
  processAlerts(alerts) {
    for (const alert of alerts) {
      console.warn(`🚨 Station Alert [${alert.severity.toUpperCase()}]: ${alert.message}`);
      
      // Could send to external monitoring service here
      // Could trigger notifications here
      // Could update UI notification system here
    }
    
    // Store alerts for later retrieval
    const alertsKey = 'station_alerts';
    const existingAlerts = this.getStoredData(alertsKey, []);
    
    // Keep only recent alerts (last 24 hours)
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const recentAlerts = existingAlerts.filter(alert => 
      new Date(alert.timestamp).getTime() > oneDayAgo
    );
    
    // Add new alerts
    recentAlerts.push(...alerts);
    
    // Store updated alerts
    this.storeData(alertsKey, recentAlerts);
  }

  /**
   * Update performance metrics
   */
  updatePerformanceMetrics() {
    const now = new Date().toISOString();
    
    const metrics = {
      timestamp: now,
      total_stations: this.stationStatus.size,
      active_stations: Array.from(this.stationStatus.values()).filter(s => s.status === 'active').length,
      average_reliability: this.calculateAverageReliability(),
      data_type_coverage: this.calculateDataTypeCoverage(),
      monitoring_uptime: this.calculateMonitoringUptime()
    };
    
    this.performanceMetrics.set(now, metrics);
    
    // Keep only recent metrics (last 7 days)
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    for (const [timestamp, _] of this.performanceMetrics.entries()) {
      if (new Date(timestamp).getTime() < sevenDaysAgo) {
        this.performanceMetrics.delete(timestamp);
      }
    }
  }

  /**
   * Calculate average reliability across all stations
   */
  calculateAverageReliability() {
    const reliabilityScores = Array.from(this.stationStatus.values())
      .map(status => status.reliability_score)
      .filter(score => !isNaN(score));
    
    if (reliabilityScores.length === 0) return 1.0;
    
    return reliabilityScores.reduce((sum, score) => sum + score, 0) / reliabilityScores.length;
  }

  /**
   * Calculate data type coverage
   */
  calculateDataTypeCoverage() {
    const dataTypes = ['temperature', 'humidity', 'rainfall', 'wind_speed', 'wind_direction'];
    const coverage = {};
    
    for (const dataType of dataTypes) {
      const stationsWithType = Array.from(this.stationStatus.values())
        .filter(status => status.data_types.includes(dataType)).length;
      
      coverage[dataType] = stationsWithType;
    }
    
    return coverage;
  }

  /**
   * Calculate monitoring uptime
   */
  calculateMonitoringUptime() {
    // Simplified uptime calculation
    // In practice, you'd track monitoring start time and failures
    return this.isMonitoring ? 100 : 0;
  }

  /**
   * Record monitoring error
   */
  recordMonitoringError(error) {
    console.error('Monitoring error recorded:', error.message);
    
    // Store error for analysis
    const errorsKey = 'monitoring_errors';
    const existingErrors = this.getStoredData(errorsKey, []);
    
    existingErrors.push({
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack
    });
    
    // Keep only recent errors (last 24 hours)
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    const recentErrors = existingErrors.filter(err => 
      new Date(err.timestamp).getTime() > oneDayAgo
    );
    
    this.storeData(errorsKey, recentErrors);
  }

  /**
   * Get monitoring status and statistics
   */
  getMonitoringStatus() {
    const activeStations = Array.from(this.stationStatus.values()).filter(s => s.status === 'active');
    const totalStations = this.stationStatus.size;
    
    return {
      monitoring_active: this.isMonitoring,
      monitoring_frequency: this.monitoringFrequency,
      total_stations: totalStations,
      active_stations: activeStations.length,
      inactive_stations: totalStations - activeStations.length,
      average_reliability: this.calculateAverageReliability(),
      data_type_coverage: this.calculateDataTypeCoverage(),
      last_monitoring_cycle: this.getLastMonitoringTime(),
      recent_alerts: this.getRecentAlerts(),
      alert_thresholds: this.alertThresholds
    };
  }

  /**
   * Get station reliability report
   */
  getStationReliabilityReport() {
    const stations = Array.from(this.stationStatus.entries()).map(([id, status]) => ({
      station_id: id,
      reliability_score: status.reliability_score,
      status: status.status,
      last_seen: status.last_seen,
      data_types: status.data_types,
      reading_count: status.reading_count,
      consecutive_failures: status.consecutive_failures,
      consecutive_successes: status.consecutive_successes
    }));
    
    // Sort by reliability score (descending)
    stations.sort((a, b) => b.reliability_score - a.reliability_score);
    
    return {
      timestamp: new Date().toISOString(),
      total_stations: stations.length,
      stations: stations,
      summary: {
        excellent: stations.filter(s => s.reliability_score >= 0.95).length,
        good: stations.filter(s => s.reliability_score >= 0.8 && s.reliability_score < 0.95).length,
        fair: stations.filter(s => s.reliability_score >= 0.6 && s.reliability_score < 0.8).length,
        poor: stations.filter(s => s.reliability_score < 0.6).length
      }
    };
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(hours = 24) {
    const alertsKey = 'station_alerts';
    const alerts = this.getStoredData(alertsKey, []);
    
    const cutoffTime = Date.now() - hours * 60 * 60 * 1000;
    return alerts.filter(alert => 
      new Date(alert.timestamp).getTime() > cutoffTime
    );
  }

  /**
   * Get last monitoring time
   */
  getLastMonitoringTime() {
    const timestamps = Array.from(this.performanceMetrics.keys());
    if (timestamps.length === 0) return null;
    
    return timestamps[timestamps.length - 1];
  }

  /**
   * Check if monitoring should auto-start
   */
  shouldAutoStart() {
    // Check if monitoring was previously enabled
    const config = this.getStoredData('monitoring_config', {});
    return config.auto_start !== false; // Default to true
  }

  /**
   * Load monitoring data from storage
   */
  loadMonitoringData() {
    try {
      // Load station status
      const statusData = this.getStoredData('station_status', {});
      this.stationStatus = new Map(Object.entries(statusData));
      
      // Load reliability history
      const reliabilityData = this.getStoredData('reliability_history', {});
      this.reliabilityHistory = new Map(Object.entries(reliabilityData));
      
      console.log(`📊 Loaded monitoring data: ${this.stationStatus.size} stations, ${this.reliabilityHistory.size} reliability records`);
    } catch (error) {
      console.warn('⚠️ Failed to load monitoring data:', error);
    }
  }

  /**
   * Save monitoring data to storage
   */
  saveMonitoringData() {
    try {
      // Save station status
      const statusData = Object.fromEntries(this.stationStatus);
      this.storeData('station_status', statusData);
      
      // Save reliability history
      const reliabilityData = Object.fromEntries(this.reliabilityHistory);
      this.storeData('reliability_history', reliabilityData);
      
      console.log(`💾 Saved monitoring data: ${this.stationStatus.size} stations, ${this.reliabilityHistory.size} reliability records`);
    } catch (error) {
      console.error('❌ Failed to save monitoring data:', error);
    }
  }

  /**
   * Store data in localStorage
   */
  storeData(key, data) {
    try {
      localStorage.setItem(`station_monitoring_${key}`, JSON.stringify(data));
    } catch (error) {
      console.warn(`Failed to store ${key}:`, error);
    }
  }

  /**
   * Get data from localStorage
   */
  getStoredData(key, defaultValue = null) {
    try {
      const stored = localStorage.getItem(`station_monitoring_${key}`);
      return stored ? JSON.parse(stored) : defaultValue;
    } catch (error) {
      console.warn(`Failed to get stored ${key}:`, error);
      return defaultValue;
    }
  }

  /**
   * Clear all monitoring data
   */
  clearMonitoringData() {
    this.stationStatus.clear();
    this.reliabilityHistory.clear();
    this.performanceMetrics.clear();
    
    // Clear localStorage
    const keys = ['station_status', 'reliability_history', 'monitoring_config', 'station_alerts', 'monitoring_errors'];
    for (const key of keys) {
      localStorage.removeItem(`station_monitoring_${key}`);
    }
    
    console.log('🧹 Monitoring data cleared');
  }

  /**
   * Update monitoring configuration
   */
  updateConfig(config) {
    const currentConfig = this.getStoredData('monitoring_config', {});
    const newConfig = { ...currentConfig, ...config };
    
    this.storeData('monitoring_config', newConfig);
    
    // Apply config changes
    if (config.monitoring_frequency && config.monitoring_frequency !== this.monitoringFrequency) {
      this.monitoringFrequency = config.monitoring_frequency;
      
      // Restart monitoring with new frequency
      if (this.isMonitoring) {
        this.stopMonitoring();
        await this.startMonitoring();
      }
    }
    
    if (config.alert_thresholds) {
      this.alertThresholds = { ...this.alertThresholds, ...config.alert_thresholds };
    }
    
    console.log('⚙️ Monitoring configuration updated');
  }

  /**
   * Get service health status
   */
  getServiceHealth() {
    return {
      service_active: this.isMonitoring,
      last_cycle: this.getLastMonitoringTime(),
      stations_monitored: this.stationStatus.size,
      average_reliability: this.calculateAverageReliability(),
      recent_alerts: this.getRecentAlerts(1).length, // Last 1 hour
      storage_usage: this.getStorageUsage()
    };
  }

  /**
   * Get storage usage statistics
   */
  getStorageUsage() {
    try {
      const keys = ['station_status', 'reliability_history', 'monitoring_config', 'station_alerts', 'monitoring_errors'];
      let totalSize = 0;
      
      for (const key of keys) {
        const data = localStorage.getItem(`station_monitoring_${key}`);
        if (data) {
          totalSize += data.length;
        }
      }
      
      return {
        total_bytes: totalSize,
        total_kb: Math.round(totalSize / 1024),
        estimated_records: this.stationStatus.size + this.reliabilityHistory.size
      };
    } catch (error) {
      return { error: error.message };
    }
  }
}

// Create singleton instance
export const stationMonitoringService = new StationMonitoringService();
export default stationMonitoringService;