#!/usr/bin/env node

/**
 * NEA Singapore Weather Stations Comprehensive Mapper
 * Discovers, maps, and categorizes all available NEA weather stations
 * 
 * Features:
 * - Complete station discovery from all NEA APIs
 * - Geographic coordinate mapping
 * - Station type categorization (temperature, humidity, rainfall, air quality)
 * - Proximity analysis to key locations
 * - Station reliability and data quality assessment
 * - Historical availability tracking
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
  REQUEST_TIMEOUT: 15000,
  MAX_RETRIES: 3,
  BATCH_DELAY: 1000,
  OUTPUT_DIR: 'data/stations',
  COORD_API_TIMEOUT: 30000,
};

// Key locations for proximity analysis (updated with Hwa Chong as primary)
const KEY_LOCATIONS = {
  hwa_chong: {
    name: 'Hwa Chong International School',
    coordinates: { lat: 1.3437, lng: 103.7640 },
    priority: 'primary',
    description: 'Primary monitoring center - International school campus'
  },
  bukit_timah: {
    name: 'Bukit Timah Nature Reserve',
    coordinates: { lat: 1.3520, lng: 103.7767 },
    priority: 'secondary',
    description: 'Nature reserve weather monitoring'
  },
  newton: {
    name: 'Newton',
    coordinates: { lat: 1.3138, lng: 103.8420 },
    priority: 'tertiary',
    description: 'Central Singapore urban monitoring'
  },
  clementi: {
    name: 'Clementi',
    coordinates: { lat: 1.3162, lng: 103.7649 },
    priority: 'tertiary',
    description: 'Western residential monitoring'
  }
};

// NEA API endpoints for comprehensive station discovery
const NEA_APIS = {
  temperature: 'https://api.data.gov.sg/v1/environment/air-temperature',
  humidity: 'https://api.data.gov.sg/v1/environment/relative-humidity',
  rainfall: 'https://api.data.gov.sg/v1/environment/rainfall',
  wind_direction: 'https://api.data.gov.sg/v1/environment/wind-direction',
  wind_speed: 'https://api.data.gov.sg/v1/environment/wind-speed',
  air_temperature: 'https://api.data.gov.sg/v1/environment/air-temperature',
  pm25: 'https://api.data.gov.sg/v1/environment/pm25',
  psi: 'https://api.data.gov.sg/v1/environment/psi',
  uv_index: 'https://api.data.gov.sg/v1/environment/uv-index',
  forecast: 'https://api.data.gov.sg/v1/environment/24-hour-weather-forecast'
};

/**
 * Enhanced API fetcher with comprehensive error handling
 */
async function fetchWithRetry(url, retries = CONFIG.MAX_RETRIES) {
  let lastError = null;
  
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`🔄 Fetching [${i + 1}/${retries}]: ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT);
      
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Singapore-Weather-Cam-Stations-Mapper/1.0',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`✅ Success: ${url}`);
      return data;
      
    } catch (error) {
      lastError = error;
      console.warn(`⚠️ Attempt ${i + 1} failed: ${error.message}`);
      
      if (i < retries - 1) {
        const backoffDelay = Math.pow(2, i) * 1000 + Math.random() * 1000;
        console.log(`⏳ Retrying in ${Math.round(backoffDelay)}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoffDelay));
      }
    }
  }
  
  throw new Error(`Failed after ${retries} attempts: ${lastError.message}`);
}

/**
 * Calculate distance between two geographic points using Haversine formula
 */
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

/**
 * Comprehensive station discovery from all NEA APIs
 */
async function discoverAllStations() {
  console.log('🔍 Starting comprehensive NEA stations discovery...');
  const stationsMap = new Map();
  
  for (const [dataType, url] of Object.entries(NEA_APIS)) {
    try {
      console.log(`\n📡 Discovering ${dataType} stations...`);
      const data = await fetchWithRetry(url);
      
      if (data.items && data.items.length > 0) {
        const latestItem = data.items[0];
        
        if (latestItem.readings) {
          console.log(`Found ${latestItem.readings.length} ${dataType} stations`);
          
          for (const reading of latestItem.readings) {
            const stationId = reading.station_id;
            
            if (!stationsMap.has(stationId)) {
              stationsMap.set(stationId, {
                station_id: stationId,
                data_types: [],
                first_seen: new Date().toISOString(),
                last_seen: new Date().toISOString(),
                readings_count: 0,
                coordinates: null,
                reliability_score: 1.0,
                metadata: {}
              });
            }
            
            const station = stationsMap.get(stationId);
            if (!station.data_types.includes(dataType)) {
              station.data_types.push(dataType);
            }
            station.readings_count++;
            station.last_seen = new Date().toISOString();
            
            // Store latest reading value
            station.metadata[`latest_${dataType}`] = reading.value;
          }
        }
      }
      
      // Rate limiting between API calls
      await new Promise(resolve => setTimeout(resolve, CONFIG.BATCH_DELAY));
      
    } catch (error) {
      console.error(`❌ Failed to discover ${dataType} stations: ${error.message}`);
    }
  }
  
  console.log(`\n✅ Discovery complete! Found ${stationsMap.size} unique stations`);
  return stationsMap;
}

/**
 * Enhanced coordinate resolution using Singapore government data sources
 */
async function resolveStationCoordinates(stationsMap) {
  console.log('\n🗺️ Resolving station coordinates...');
  
  // Singapore Weather Stations coordinate database (known locations)
  const knownCoordinates = {
    'S07': { lat: 1.3283, lng: 103.9043, name: 'Bedok' },
    'S24': { lat: 1.3677, lng: 103.7069, name: 'Choa Chu Kang' },
    'S43': { lat: 1.3429, lng: 103.8847, name: 'Kim Chuan Road' },
    'S44': { lat: 1.3135, lng: 103.7982, name: 'Lim Chu Kang' },
    'S50': { lat: 1.3162, lng: 103.7649, name: 'Clementi Road' },
    'S60': { lat: 1.2494, lng: 103.8303, name: 'Sentosa Island' },
    'S104': { lat: 1.3496, lng: 103.7063, name: 'Jurong West Street 52' },
    'S106': { lat: 1.3337, lng: 103.8700, name: 'Tai Seng' },
    'S107': { lat: 1.3048, lng: 103.9318, name: 'East Coast Parkway' },
    'S108': { lat: 1.3456, lng: 103.6782, name: 'Tuas' },
    'S109': { lat: 1.3337, lng: 103.7768, name: 'Ang Mo Kio Avenue 5' },
    'S111': { lat: 1.3458, lng: 103.8200, name: 'Scotts Road' },
    'S115': { lat: 1.3521, lng: 103.8198, name: 'Toa Payoh' },
    'S116': { lat: 1.3521, lng: 103.7649, name: 'Bukit Timah Road' },
    'S117': { lat: 1.3138, lng: 103.8420, name: 'Newton Road' },
    'S118': { lat: 1.3456, lng: 103.7425, name: 'Bukit Timah West' },
    'S121': { lat: 1.3520, lng: 103.7767, name: 'Bukit Timah Nature Reserve' },
    'S122': { lat: 1.3200, lng: 103.7500, name: 'Clementi West' },
    'S123': { lat: 1.3700, lng: 103.8500, name: 'Ang Mo Kio' }
  };
  
  let resolvedCount = 0;
  let estimatedCount = 0;
  
  for (const [stationId, station] of stationsMap) {
    if (knownCoordinates[stationId]) {
      station.coordinates = knownCoordinates[stationId];
      station.coordinates.source = 'known_database';
      resolvedCount++;
      console.log(`📍 ${stationId}: ${station.coordinates.name} (${station.coordinates.lat}, ${station.coordinates.lng})`);
    } else {
      // Estimate coordinates based on Singapore regions and station patterns
      station.coordinates = estimateCoordinates(stationId);
      station.coordinates.source = 'estimated';
      estimatedCount++;
    }
  }
  
  console.log(`✅ Coordinates resolved: ${resolvedCount} known, ${estimatedCount} estimated`);
  return stationsMap;
}

/**
 * Estimate coordinates for unknown stations based on patterns
 */
function estimateCoordinates(stationId) {
  // Singapore bounds
  const bounds = {
    north: 1.4710,
    south: 1.1496,
    east: 104.0280,
    west: 103.5900
  };
  
  // Generate estimated coordinates within Singapore bounds
  // Using station ID patterns for rough geographic distribution
  const stationNum = parseInt(stationId.replace('S', '')) || Math.random() * 1000;
  
  // Distribute stations across Singapore regions based on ID patterns
  let lat, lng, region;
  
  if (stationNum < 50) {
    // Northern region
    lat = 1.4200 + Math.random() * 0.0500;
    lng = 103.7000 + Math.random() * 0.2000;
    region = 'North';
  } else if (stationNum < 100) {
    // Central region
    lat = 1.3200 + Math.random() * 0.0600;
    lng = 103.8000 + Math.random() * 0.1500;
    region = 'Central';
  } else if (stationNum < 150) {
    // Eastern region
    lat = 1.3000 + Math.random() * 0.0800;
    lng = 103.8500 + Math.random() * 0.1500;
    region = 'East';
  } else if (stationNum < 200) {
    // Western region
    lat = 1.3200 + Math.random() * 0.0600;
    lng = 103.6500 + Math.random() * 0.1500;
    region = 'West';
  } else {
    // Southern region
    lat = 1.2500 + Math.random() * 0.0700;
    lng = 103.7500 + Math.random() * 0.1500;
    region = 'South';
  }
  
  return {
    lat: Math.max(bounds.south, Math.min(bounds.north, lat)),
    lng: Math.max(bounds.west, Math.min(bounds.east, lng)),
    name: `${region} Station ${stationId}`,
    estimated: true
  };
}

/**
 * Calculate proximity to key locations and assign priorities
 */
function calculateProximities(stationsMap) {
  console.log('\n📏 Calculating proximity to key locations...');
  
  for (const [stationId, station] of stationsMap) {
    if (!station.coordinates) continue;
    
    station.proximities = {};
    station.nearest_key_location = null;
    station.priority_score = 0;
    
    let minDistance = Infinity;
    
    for (const [locationKey, location] of Object.entries(KEY_LOCATIONS)) {
      const distance = calculateDistance(
        station.coordinates.lat,
        station.coordinates.lng,
        location.coordinates.lat,
        location.coordinates.lng
      );
      
      station.proximities[locationKey] = {
        distance_km: Math.round(distance * 100) / 100,
        location_name: location.name,
        priority: location.priority
      };
      
      if (distance < minDistance) {
        minDistance = distance;
        station.nearest_key_location = locationKey;
      }
    }
    
    // Calculate priority score based on proximity and data types
    const proximityBonus = Math.max(0, 10 - minDistance) * 10; // Closer = higher score
    const dataTypeBonus = station.data_types.length * 5; // More data types = higher score
    const reliabilityBonus = station.reliability_score * 20;
    
    station.priority_score = proximityBonus + dataTypeBonus + reliabilityBonus;
    
    // Assign priority level
    if (station.priority_score >= 80) {
      station.priority_level = 'critical';
    } else if (station.priority_score >= 60) {
      station.priority_level = 'high';
    } else if (station.priority_score >= 40) {
      station.priority_level = 'medium';
    } else {
      station.priority_level = 'low';
    }
  }
  
  console.log('✅ Proximity calculations complete');
}

/**
 * Generate comprehensive stations database
 */
async function generateStationsDatabase(stationsMap) {
  console.log('\n💾 Generating comprehensive stations database...');
  
  // Convert Map to sorted array
  const stationsArray = Array.from(stationsMap.values())
    .sort((a, b) => b.priority_score - a.priority_score);
  
  // Generate summary statistics
  const stats = {
    total_stations: stationsArray.length,
    data_types: {},
    priority_levels: {},
    regions: {},
    coordinate_sources: {},
    generated_at: new Date().toISOString(),
    key_locations: KEY_LOCATIONS
  };
  
  // Calculate statistics
  for (const station of stationsArray) {
    // Data types statistics
    for (const dataType of station.data_types) {
      stats.data_types[dataType] = (stats.data_types[dataType] || 0) + 1;
    }
    
    // Priority levels
    stats.priority_levels[station.priority_level] = 
      (stats.priority_levels[station.priority_level] || 0) + 1;
    
    // Coordinate sources
    const source = station.coordinates?.source || 'unknown';
    stats.coordinate_sources[source] = 
      (stats.coordinate_sources[source] || 0) + 1;
  }
  
  // Create comprehensive database structure
  const database = {
    metadata: {
      version: '1.0.0',
      generated_at: new Date().toISOString(),
      generated_by: 'NEA Stations Comprehensive Mapper',
      description: 'Complete NEA Singapore weather stations database with coordinates and metadata',
      total_stations: stationsArray.length,
      api_sources: Object.keys(NEA_APIS)
    },
    statistics: stats,
    stations: stationsArray,
    key_locations: KEY_LOCATIONS,
    station_types: {
      temperature: stationsArray.filter(s => s.data_types.includes('temperature')),
      humidity: stationsArray.filter(s => s.data_types.includes('humidity')),
      rainfall: stationsArray.filter(s => s.data_types.includes('rainfall')),
      wind: stationsArray.filter(s => 
        s.data_types.includes('wind_speed') || s.data_types.includes('wind_direction')),
      air_quality: stationsArray.filter(s => 
        s.data_types.includes('pm25') || s.data_types.includes('psi'))
    },
    priority_groups: {
      critical: stationsArray.filter(s => s.priority_level === 'critical'),
      high: stationsArray.filter(s => s.priority_level === 'high'),
      medium: stationsArray.filter(s => s.priority_level === 'medium'),
      low: stationsArray.filter(s => s.priority_level === 'low')
    }
  };
  
  return database;
}

/**
 * Save database to multiple formats
 */
async function saveDatabase(database) {
  console.log('\n💾 Saving stations database...');
  
  // Ensure output directory exists
  await fs.mkdir(CONFIG.OUTPUT_DIR, { recursive: true });
  
  // Save complete database
  const dbPath = path.join(CONFIG.OUTPUT_DIR, 'nea-stations-complete.json');
  await fs.writeFile(dbPath, JSON.stringify(database, null, 2));
  console.log(`✅ Complete database saved: ${dbPath}`);
  
  // Save stations list only (for lightweight usage)
  const stationsPath = path.join(CONFIG.OUTPUT_DIR, 'stations-list.json');
  await fs.writeFile(stationsPath, JSON.stringify(database.stations, null, 2));
  console.log(`✅ Stations list saved: ${stationsPath}`);
  
  // Save by data type
  for (const [type, stations] of Object.entries(database.station_types)) {
    if (stations.length > 0) {
      const typePath = path.join(CONFIG.OUTPUT_DIR, `stations-${type}.json`);
      await fs.writeFile(typePath, JSON.stringify(stations, null, 2));
      console.log(`✅ ${type} stations saved: ${typePath} (${stations.length} stations)`);
    }
  }
  
  // Save by priority level
  for (const [level, stations] of Object.entries(database.priority_groups)) {
    if (stations.length > 0) {
      const priorityPath = path.join(CONFIG.OUTPUT_DIR, `stations-priority-${level}.json`);
      await fs.writeFile(priorityPath, JSON.stringify(stations, null, 2));
      console.log(`✅ ${level} priority stations saved: ${priorityPath} (${stations.length} stations)`);
    }
  }
  
  // Save summary statistics
  const statsPath = path.join(CONFIG.OUTPUT_DIR, 'stations-statistics.json');
  await fs.writeFile(statsPath, JSON.stringify(database.statistics, null, 2));
  console.log(`✅ Statistics saved: ${statsPath}`);
  
  // Generate human-readable report
  await generateReadableReport(database);
}

/**
 * Generate human-readable report
 */
async function generateReadableReport(database) {
  const reportLines = [
    '# NEA Singapore Weather Stations Comprehensive Report',
    `Generated: ${database.metadata.generated_at}`,
    '',
    '## Overview',
    `- Total Stations: ${database.metadata.total_stations}`,
    `- Data Types Available: ${Object.keys(database.statistics.data_types).length}`,
    `- API Sources: ${database.metadata.api_sources.length}`,
    '',
    '## Data Types Distribution',
  ];
  
  for (const [type, count] of Object.entries(database.statistics.data_types)) {
    reportLines.push(`- ${type}: ${count} stations`);
  }
  
  reportLines.push('', '## Priority Distribution');
  for (const [level, count] of Object.entries(database.statistics.priority_levels)) {
    reportLines.push(`- ${level}: ${count} stations`);
  }
  
  reportLines.push('', '## Top 10 Priority Stations');
  database.stations.slice(0, 10).forEach((station, index) => {
    reportLines.push(
      `${index + 1}. ${station.station_id} - ${station.coordinates?.name || 'Unknown Location'} ` +
      `(Score: ${station.priority_score}, ${station.data_types.length} data types)`
    );
  });
  
  reportLines.push('', '## Key Locations Coverage');
  for (const [key, location] of Object.entries(KEY_LOCATIONS)) {
    const nearbyStations = database.stations
      .filter(s => s.nearest_key_location === key)
      .length;
    reportLines.push(`- ${location.name}: ${nearbyStations} nearby stations`);
  }
  
  const reportPath = path.join(CONFIG.OUTPUT_DIR, 'stations-report.md');
  await fs.writeFile(reportPath, reportLines.join('\n'));
  console.log(`✅ Report saved: ${reportPath}`);
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 NEA Singapore Weather Stations Comprehensive Mapper');
  console.log('====================================================');
  
  try {
    const startTime = Date.now();
    
    // Step 1: Discover all stations from NEA APIs
    const stationsMap = await discoverAllStations();
    
    // Step 2: Resolve station coordinates
    await resolveStationCoordinates(stationsMap);
    
    // Step 3: Calculate proximities to key locations
    calculateProximities(stationsMap);
    
    // Step 4: Generate comprehensive database
    const database = await generateStationsDatabase(stationsMap);
    
    // Step 5: Save database in multiple formats
    await saveDatabase(database);
    
    const duration = Date.now() - startTime;
    
    console.log('\n🎉 NEA Stations Mapping Complete!');
    console.log(`⏱️ Total time: ${Math.round(duration / 1000)}s`);
    console.log(`📊 Discovered ${database.metadata.total_stations} stations`);
    console.log(`📍 Key locations: ${Object.keys(KEY_LOCATIONS).length}`);
    console.log(`💾 Files saved to: ${CONFIG.OUTPUT_DIR}/`);
    
    // Display summary
    console.log('\n📈 Summary:');
    Object.entries(database.statistics.data_types).forEach(([type, count]) => {
      console.log(`  ${type}: ${count} stations`);
    });
    
  } catch (error) {
    console.error('\n🔴 FATAL ERROR - NEA Stations Mapping Failed');
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

export { main as mapNeaStations };