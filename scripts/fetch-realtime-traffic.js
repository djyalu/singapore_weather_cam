#!/usr/bin/env node

/**
 * Real-time Traffic Camera Fetcher
 * 
 * Fetches current traffic camera images from Singapore data.gov.sg API
 * and saves them for the web application to use
 */

import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';

const OUTPUT_DIR = 'data/traffic-cameras';
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'latest.json');

async function fetchTrafficCameras() {
  try {
    console.log('📷 Fetching real-time Singapore traffic cameras...');
    
    const response = await fetch('https://api.data.gov.sg/v1/transport/traffic-images', {
      headers: {
        'User-Agent': 'Singapore Weather Cam/1.0',
        'Accept': 'application/json'
      }
    });
    
    if (!response.ok) {
      throw new Error(`Traffic API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    const cameras = data.items[0]?.cameras || [];
    
    console.log(`✅ Fetched ${cameras.length} real-time traffic cameras`);
    
    // Process camera data for web application
    const processedCameras = cameras.map(camera => ({
      id: camera.camera_id,
      image: camera.image,
      location: {
        latitude: camera.location.latitude,
        longitude: camera.location.longitude,
        name: camera.location.name || `Camera ${camera.camera_id}`,
        description: camera.location.name || `Traffic Camera ${camera.camera_id}`
      },
      timestamp: camera.timestamp,
      quality: 'Real-time HD',
      isRealTime: true
    }));
    
    // Create output data structure
    const outputData = {
      timestamp: new Date().toISOString(),
      source: 'Singapore data.gov.sg API',
      totalCameras: processedCameras.length,
      cameras: processedCameras,
      apiStatus: 'success',
      fetchMethod: 'GitHub Actions',
      cacheExpiry: new Date(Date.now() + 5 * 60 * 1000).toISOString() // 5 minutes
    };
    
    // Save to output directory
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(outputData, null, 2));
    
    console.log(`✅ Real-time traffic data saved to ${OUTPUT_FILE}`);
    console.log(`📊 Statistics: ${processedCameras.length} cameras processed`);
    
    return outputData;
    
  } catch (error) {
    console.error('❌ Failed to fetch traffic cameras:', error);
    
    // Create error fallback data
    const errorData = {
      timestamp: new Date().toISOString(),
      source: 'Fallback Data',
      totalCameras: 0,
      cameras: [],
      apiStatus: 'error',
      error: error.message,
      fetchMethod: 'GitHub Actions (Failed)'
    };
    
    try {
      await fs.mkdir(OUTPUT_DIR, { recursive: true });
      await fs.writeFile(OUTPUT_FILE, JSON.stringify(errorData, null, 2));
      console.log('💾 Error fallback data saved');
    } catch (saveError) {
      console.error('❌ Failed to save error data:', saveError);
    }
    
    throw error;
  }
}

// Region-specific camera selection
function selectRegionalCameras(cameras) {
  const regionCameras = {
    'hwa-chong': [],
    'newton': [],
    'changi': [],
    'jurong': [],
    'central': [],
    'east': [],
    'north': [],
    'south': []
  };
  
  // Define region coordinates
  const regionCoords = {
    'hwa-chong': { lat: 1.3437, lng: 103.7640 },
    'newton': { lat: 1.3138, lng: 103.8420 },
    'changi': { lat: 1.3644, lng: 103.9915 },
    'jurong': { lat: 1.3496, lng: 103.7063 },
    'central': { lat: 1.3048, lng: 103.8318 },
    'east': { lat: 1.3048, lng: 103.9318 },
    'north': { lat: 1.4382, lng: 103.7880 },
    'south': { lat: 1.2494, lng: 103.8303 }
  };
  
  // Calculate distance function
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };
  
  // Assign cameras to regions based on proximity
  cameras.forEach(camera => {
    if (camera.location?.latitude && camera.location?.longitude) {
      let closestRegion = null;
      let minDistance = Infinity;
      
      Object.entries(regionCoords).forEach(([regionId, coords]) => {
        const distance = calculateDistance(
          coords.lat, coords.lng,
          camera.location.latitude, camera.location.longitude
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          closestRegion = regionId;
        }
      });
      
      if (closestRegion && minDistance < 15) { // Within 15km
        regionCameras[closestRegion].push({
          ...camera,
          distanceFromRegion: minDistance.toFixed(2)
        });
      }
    }
  });
  
  return regionCameras;
}

async function main() {
  console.log('🚀 Starting real-time traffic camera fetch...');
  
  try {
    const trafficData = await fetchTrafficCameras();
    
    // Also save region-specific camera assignments
    const regionalCameras = selectRegionalCameras(trafficData.cameras);
    const regionalFile = path.join(OUTPUT_DIR, 'regional.json');
    
    const regionalData = {
      timestamp: trafficData.timestamp,
      regions: regionalCameras,
      metadata: {
        totalCameras: trafficData.totalCameras,
        regionsWithCameras: Object.entries(regionalCameras)
          .filter(([, cameras]) => cameras.length > 0).length,
        averageCamerasPerRegion: Object.values(regionalCameras)
          .reduce((sum, cameras) => sum + cameras.length, 0) / 8
      }
    };
    
    await fs.writeFile(regionalFile, JSON.stringify(regionalData, null, 2));
    console.log(`📊 Regional camera data saved to ${regionalFile}`);
    
    console.log('🎉 Real-time traffic fetch completed successfully!');
    
  } catch (error) {
    console.error('❌ Traffic fetch failed:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error('❌ Script execution failed:', error);
  process.exit(1);
});