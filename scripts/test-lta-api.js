#!/usr/bin/env node

/**
 * Test script for LTA Traffic Images API
 * Run: node scripts/test-lta-api.js
 */

import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Hwa Chong International School coordinates
const HACHONG_COORDS = { lat: 1.32865, lng: 103.80227 };

// Helper function to calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

function toRad(deg) {
  return deg * (Math.PI/180);
}

async function testLTAAPI() {
  console.log('🚦 Testing LTA Traffic Images API...\n');
  
  try {
    // 1. Fetch data from API
    console.log('📡 Fetching data from API...');
    const response = await fetch('https://api.data.gov.sg/v1/transport/traffic-images');
    
    if (!response.ok) {
      throw new Error(`API returned status ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ API Response received\n');
    
    // 2. Analyze the response
    if (data.items && data.items.length > 0) {
      const timestamp = data.items[0].timestamp;
      const cameras = data.items[0].cameras;
      
      console.log('📊 API Statistics:');
      console.log(`- Response timestamp: ${timestamp}`);
      console.log(`- Total cameras: ${cameras.length}`);
      console.log(`- API status: ${data.api_info?.status || 'unknown'}\n`);
      
      // 3. Analyze image resolutions
      const resolutions = {};
      cameras.forEach(cam => {
        const res = `${cam.image_metadata.width}x${cam.image_metadata.height}`;
        resolutions[res] = (resolutions[res] || 0) + 1;
      });
      
      console.log('📷 Camera Resolutions:');
      Object.entries(resolutions).forEach(([res, count]) => {
        console.log(`- ${res}: ${count} cameras`);
      });
      console.log('');
      
      // 4. Find cameras near Hwa Chong
      console.log('📍 Cameras near Hwa Chong International School:');
      console.log(`   Center: ${HACHONG_COORDS.lat}°N, ${HACHONG_COORDS.lng}°E\n`);
      
      const nearbyCameras = cameras
        .map(cam => ({
          ...cam,
          distance: calculateDistance(
            HACHONG_COORDS.lat, HACHONG_COORDS.lng,
            cam.location.latitude, cam.location.longitude
          )
        }))
        .filter(cam => cam.distance <= 5) // Within 5km
        .sort((a, b) => a.distance - b.distance);
      
      console.log(`Found ${nearbyCameras.length} cameras within 5km:\n`);
      
      nearbyCameras.slice(0, 10).forEach((cam, index) => {
        console.log(`${index + 1}. Camera ${cam.camera_id}`);
        console.log(`   Distance: ${cam.distance.toFixed(2)}km`);
        console.log(`   Location: ${cam.location.latitude.toFixed(6)}°N, ${cam.location.longitude.toFixed(6)}°E`);
        console.log(`   Resolution: ${cam.image_metadata.width}x${cam.image_metadata.height}`);
        console.log(`   Last updated: ${cam.timestamp}`);
        console.log(`   Image URL: ${cam.image.substring(0, 80)}...`);
        console.log('');
      });
      
      // 5. Save sample data
      const sampleData = {
        api_test_timestamp: new Date().toISOString(),
        api_response_timestamp: timestamp,
        total_cameras: cameras.length,
        resolutions: resolutions,
        hwa_chong_area: {
          center: HACHONG_COORDS,
          radius_km: 5,
          cameras_found: nearbyCameras.length,
          nearest_cameras: nearbyCameras.slice(0, 5).map(cam => ({
            camera_id: cam.camera_id,
            distance_km: cam.distance.toFixed(2),
            location: cam.location,
            resolution: `${cam.image_metadata.width}x${cam.image_metadata.height}`,
            image_url: cam.image
          }))
        }
      };
      
      // Create directory if not exists
      const outputDir = path.join(__dirname, '..', 'data', 'traffic');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }
      
      // Save test results
      const outputPath = path.join(outputDir, 'api-test-results.json');
      fs.writeFileSync(outputPath, JSON.stringify(sampleData, null, 2));
      console.log(`💾 Test results saved to: ${outputPath}\n`);
      
      // 6. Test image accessibility
      console.log('🖼️  Testing image accessibility...');
      if (nearbyCameras.length > 0) {
        const testCamera = nearbyCameras[0];
        const imageResponse = await fetch(testCamera.image, { method: 'HEAD' });
        
        if (imageResponse.ok) {
          console.log(`✅ Image accessible for camera ${testCamera.camera_id}`);
          console.log(`   Content-Type: ${imageResponse.headers.get('content-type')}`);
          console.log(`   Content-Length: ${imageResponse.headers.get('content-length')} bytes`);
        } else {
          console.log(`❌ Image not accessible: ${imageResponse.status}`);
        }
      }
      
      console.log('\n✅ API test completed successfully!');
      
    } else {
      console.log('❌ No camera data found in API response');
    }
    
  } catch (error) {
    console.error('❌ Error testing API:', error.message);
    process.exit(1);
  }
}

// Run the test
testLTAAPI();