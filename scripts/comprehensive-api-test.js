#!/usr/bin/env node

/**
 * Comprehensive API Testing and Validation Script
 * Tests all API endpoints, validates camera mappings, and identifies connectivity issues
 */

import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Test configuration
const CONFIG = {
  REQUEST_TIMEOUT: 10000,
  MAX_RETRIES: 3,
  USER_AGENT: 'Singapore-Weather-Cam-Test/1.0'
};

// Failed webcam sources from the capture script
const FAILING_SOURCES = [
  {
    id: 'test_image_1',
    name: 'Test Image 1',
    url: 'https://picsum.photos/800/600?random=1',
    type: 'test'
  },
  {
    id: 'test_image_2', 
    name: 'Test Image 2',
    url: 'https://picsum.photos/800/600?random=2',
    type: 'test'
  },
  {
    id: 'singapore_skyline_1',
    name: 'Singapore Skyline View 1',
    url: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&h=600&fit=crop',
    type: 'public'
  },
  {
    id: 'singapore_skyline_2',
    name: 'Singapore Skyline View 2', 
    url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
    type: 'public'
  }
];

// Traffic camera mappings used in the capture script
const TRAFFIC_CAMERAS = [
  { id: 'marina_bay_traffic', camera_id: '1701' },
  { id: 'orchard_road_traffic', camera_id: '1705' },
  { id: 'sentosa_traffic', camera_id: '4703' },
  { id: 'changi_airport_traffic', camera_id: '6703' },
  { id: 'tuas_checkpoint_traffic', camera_id: '4709' }
];

// Color output functions
const colors = {
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  magenta: (text) => `\x1b[35m${text}\x1b[0m`,
  cyan: (text) => `\x1b[36m${text}\x1b[0m`
};

/**
 * Test URL accessibility with different HTTP methods
 */
async function testURLAccess(url, id) {
  console.log(`\n🔍 Testing ${colors.cyan(id)}: ${url}`);
  
  const results = {
    id,
    url,
    methods: {},
    accessible: false,
    error: null
  };

  // Test HEAD request (what the capture script uses first)
  try {
    console.log('  📡 Testing HEAD request...');
    const headResponse = await fetch(url, {
      method: 'HEAD',
      timeout: CONFIG.REQUEST_TIMEOUT,
      headers: { 'User-Agent': CONFIG.USER_AGENT }
    });
    
    results.methods.HEAD = {
      status: headResponse.status,
      statusText: headResponse.statusText,
      contentType: headResponse.headers.get('content-type'),
      contentLength: headResponse.headers.get('content-length'),
      success: headResponse.ok
    };
    
    if (headResponse.ok) {
      console.log(`    ✅ HEAD: ${headResponse.status} ${headResponse.statusText}`);
      results.accessible = true;
    } else {
      console.log(`    ❌ HEAD: ${headResponse.status} ${headResponse.statusText}`);
    }
  } catch (error) {
    console.log(`    ❌ HEAD: ${error.message}`);
    results.methods.HEAD = { error: error.message, success: false };
  }

  // Test GET request (fallback method)
  try {
    console.log('  📡 Testing GET request...');
    const getResponse = await fetch(url, {
      method: 'GET',
      timeout: CONFIG.REQUEST_TIMEOUT,
      headers: { 'User-Agent': CONFIG.USER_AGENT }
    });
    
    results.methods.GET = {
      status: getResponse.status,
      statusText: getResponse.statusText,
      contentType: getResponse.headers.get('content-type'),
      contentLength: getResponse.headers.get('content-length'),
      success: getResponse.ok
    };
    
    if (getResponse.ok) {
      console.log(`    ✅ GET: ${getResponse.status} ${getResponse.statusText}`);
      results.accessible = true;
      
      // Check if it's actually an image
      const contentType = getResponse.headers.get('content-type');
      if (contentType && contentType.startsWith('image/')) {
        console.log(`    📷 Valid image: ${contentType}`);
      } else {
        console.log(`    ⚠️  Not an image: ${contentType}`);
      }
    } else {
      console.log(`    ❌ GET: ${getResponse.status} ${getResponse.statusText}`);
    }
  } catch (error) {
    console.log(`    ❌ GET: ${error.message}`);
    results.methods.GET = { error: error.message, success: false };
  }

  return results;
}

/**
 * Test LTA Traffic Camera API
 */
async function testLTATrafficAPI() {
  console.log(`\n🚦 ${colors.blue('Testing LTA Traffic Camera API...')}`);
  
  try {
    const response = await fetch('https://api.data.gov.sg/v1/transport/traffic-images', {
      timeout: CONFIG.REQUEST_TIMEOUT,
      headers: { 'User-Agent': CONFIG.USER_AGENT }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const latestData = data.items[0];
    const cameras = latestData.cameras;

    console.log(`✅ API Response: ${response.status} ${response.statusText}`);
    console.log(`📊 Total cameras: ${cameras.length}`);
    console.log(`🕐 Data timestamp: ${latestData.timestamp}`);

    // Test configured camera mappings
    console.log(`\n🎯 Testing configured camera mappings:`);
    const mappingResults = [];
    
    for (const config of TRAFFIC_CAMERAS) {
      const camera = cameras.find(c => c.camera_id === config.camera_id);
      if (camera) {
        console.log(`  ✅ ${config.id} (${config.camera_id}): Found`);
        console.log(`     📍 Location: ${camera.location.latitude}, ${camera.location.longitude}`);
        console.log(`     🖼️  Image: ${camera.image.substring(0, 80)}...`);
        
        // Test image accessibility
        const imageTest = await testURLAccess(camera.image, `${config.id}_image`);
        mappingResults.push({
          ...config,
          found: true,
          camera,
          imageTest
        });
      } else {
        console.log(`  ❌ ${config.id} (${config.camera_id}): NOT FOUND`);
        mappingResults.push({
          ...config,
          found: false,
          camera: null,
          imageTest: null
        });
      }
    }

    return {
      success: true,
      totalCameras: cameras.length,
      timestamp: latestData.timestamp,
      mappingResults,
      allCameras: cameras.map(c => ({
        id: c.camera_id,
        location: c.location,
        image: c.image,
        timestamp: c.timestamp
      }))
    };

  } catch (error) {
    console.log(`❌ LTA API Error: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test failing webcam sources
 */
async function testFailingSources() {
  console.log(`\n🔧 ${colors.red('Testing failing webcam sources...')}`);
  
  const results = [];
  
  for (const source of FAILING_SOURCES) {
    const testResult = await testURLAccess(source.url, source.id);
    results.push({
      ...source,
      ...testResult
    });
  }

  return results;
}

/**
 * Find alternative working camera sources
 */
async function findAlternativeSources() {
  console.log(`\n🔍 ${colors.magenta('Finding alternative working camera sources...')}`);
  
  const alternatives = [
    {
      id: 'test_placeholder_1',
      name: 'Test Placeholder 1',
      url: 'https://via.placeholder.com/800x600/0066cc/ffffff?text=Singapore+Test+1',
      type: 'test'
    },
    {
      id: 'test_placeholder_2', 
      name: 'Test Placeholder 2',
      url: 'https://via.placeholder.com/800x600/009933/ffffff?text=Singapore+Test+2',
      type: 'test'
    },
    {
      id: 'singapore_tourism_1',
      name: 'Singapore Tourism Board Image',
      url: 'https://www.visitsingapore.com/content/dam/desktop/global/browse-our-editors-picks/browse-editors-picks-mbs-skypark-carousel.jpg',
      type: 'public'
    }
  ];

  const results = [];
  
  for (const alt of alternatives) {
    const testResult = await testURLAccess(alt.url, alt.id);
    results.push({
      ...alt,
      ...testResult
    });
  }

  return results;
}

/**
 * Generate comprehensive report
 */
async function generateReport(ltaResults, failingResults, alternativeResults) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      lta_api_status: ltaResults.success ? 'WORKING' : 'FAILED',
      total_cameras: ltaResults.totalCameras || 0,
      failing_sources: failingResults.length,
      accessible_failing_sources: failingResults.filter(r => r.accessible).length,
      working_alternatives: alternativeResults.filter(r => r.accessible).length
    },
    lta_api: ltaResults,
    failing_sources: failingResults,
    alternative_sources: alternativeResults,
    recommendations: []
  };

  // Generate recommendations
  if (ltaResults.success && ltaResults.mappingResults) {
    const workingTrafficCameras = ltaResults.mappingResults.filter(r => r.found && r.imageTest?.accessible);
    report.recommendations.push({
      type: 'traffic_cameras',
      message: `${workingTrafficCameras.length}/5 traffic cameras are working properly`,
      priority: workingTrafficCameras.length >= 4 ? 'low' : 'medium'
    });
  }

  const accessibleFailingSources = failingResults.filter(r => r.accessible);
  if (accessibleFailingSources.length > 0) {
    report.recommendations.push({
      type: 'failed_sources_fix',
      message: `${accessibleFailingSources.length} failing sources can be fixed with HTTP method changes`,
      priority: 'medium',
      details: accessibleFailingSources.map(r => ({
        id: r.id,
        working_method: r.methods.GET?.success ? 'GET' : r.methods.HEAD?.success ? 'HEAD' : 'none'
      }))
    });
  }

  const workingAlternatives = alternativeResults.filter(r => r.accessible);
  if (workingAlternatives.length > 0) {
    report.recommendations.push({
      type: 'alternative_sources', 
      message: `${workingAlternatives.length} alternative sources are available`,
      priority: 'low',
      sources: workingAlternatives.map(r => ({ id: r.id, url: r.url }))
    });
  }

  // Save report
  const reportPath = path.join(__dirname, '..', 'data', 'traffic', 'api-comprehensive-test.json');
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  
  return report;
}

/**
 * Main execution function
 */
async function main() {
  console.log(colors.cyan('🔬 Comprehensive API Testing and Validation'));
  console.log('=' .repeat(60));

  try {
    // Test LTA Traffic Camera API
    const ltaResults = await testLTATrafficAPI();
    
    // Test failing sources
    const failingResults = await testFailingSources();
    
    // Find alternative sources
    const alternativeResults = await findAlternativeSources();
    
    // Generate comprehensive report
    const report = await generateReport(ltaResults, failingResults, alternativeResults);
    
    // Display summary
    console.log(`\n📋 ${colors.green('COMPREHENSIVE TEST SUMMARY')}`);
    console.log('=' .repeat(60));
    console.log(`🚦 LTA API Status: ${report.summary.lta_api_status === 'WORKING' ? colors.green('✅ WORKING') : colors.red('❌ FAILED')}`);
    console.log(`📷 Total LTA Cameras: ${report.summary.total_cameras}`);
    console.log(`❌ Failing Sources: ${report.summary.failing_sources}`);
    console.log(`🔧 Fixable Failed Sources: ${report.summary.accessible_failing_sources}`);
    console.log(`✅ Working Alternatives: ${report.summary.working_alternatives}`);
    
    console.log(`\n💡 ${colors.yellow('RECOMMENDATIONS:')}`);
    report.recommendations.forEach((rec, i) => {
      const priority = rec.priority === 'high' ? colors.red('[HIGH]') : 
                      rec.priority === 'medium' ? colors.yellow('[MEDIUM]') : 
                      colors.green('[LOW]');
      console.log(`${i + 1}. ${priority} ${rec.message}`);
    });
    
    console.log(`\n📁 Full report saved to: data/traffic/api-comprehensive-test.json`);
    console.log('\n✅ Comprehensive API testing completed!');

  } catch (error) {
    console.error(`❌ Error during testing: ${error.message}`);
    process.exit(1);
  }
}

// Run the test
main();