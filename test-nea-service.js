/**
 * Test script for NEA Real-Time Service
 * Run with: node test-nea-service.js
 */

// Simple fetch polyfill for Node.js
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

class NEARealTimeServiceTest {
  constructor() {
    this.apiBaseUrl = 'https://api.data.gov.sg/v1/environment';
    this.requestTimeout = 10000;
  }

  async testCurrentTemperature() {
    try {
      console.log('🌡️ Testing NEA Temperature API...');
      
      const response = await fetch(`${this.apiBaseUrl}/air-temperature`, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Singapore-Weather-Cam-Test/1.0',
        },
        timeout: this.requestTimeout,
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      const readings = data.items?.[0]?.readings || [];
      
      if (readings.length === 0) {
        throw new Error('No temperature readings available');
      }

      const avgTemperature = readings.reduce((sum, r) => sum + r.value, 0) / readings.length;
      const minTemp = Math.min(...readings.map(r => r.value));
      const maxTemp = Math.max(...readings.map(r => r.value));
      
      console.log('✅ Temperature Test Results:');
      console.log(`   Average: ${avgTemperature.toFixed(2)}°C`);
      console.log(`   Range: ${minTemp}°C - ${maxTemp}°C`);
      console.log(`   Stations: ${readings.length}`);
      console.log(`   Timestamp: ${data.items[0].timestamp}`);
      
      return { success: true, avgTemperature, readings: readings.length };
    } catch (error) {
      console.error('❌ Temperature Test Failed:', error.message);
      return { success: false, error: error.message };
    }
  }

  async testAllEndpoints() {
    console.log('🚀 Testing NEA Real-Time Service...\n');
    
    const endpoints = [
      'air-temperature',
      'relative-humidity', 
      'rainfall',
      'wind-speed'
    ];

    const results = {};
    
    for (const endpoint of endpoints) {
      try {
        console.log(`📡 Testing ${endpoint}...`);
        
        const response = await fetch(`${this.apiBaseUrl}/${endpoint}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Singapore-Weather-Cam-Test/1.0',
          },
          timeout: this.requestTimeout,
        });

        if (response.ok) {
          const data = await response.json();
          const readings = data.items?.[0]?.readings || [];
          results[endpoint] = { success: true, stations: readings.length };
          console.log(`   ✅ ${readings.length} stations`);
        } else {
          results[endpoint] = { success: false, error: `HTTP ${response.status}` };
          console.log(`   ❌ HTTP ${response.status}`);
        }
      } catch (error) {
        results[endpoint] = { success: false, error: error.message };
        console.log(`   ❌ ${error.message}`);
      }
    }

    return results;
  }

  async runComprehensiveTest() {
    console.log('🧪 Comprehensive NEA Service Test\n');
    
    // Test temperature specifically (main requirement)
    const tempTest = await this.testCurrentTemperature();
    
    console.log('\n' + '='.repeat(50));
    
    // Test all endpoints
    const allTests = await this.testAllEndpoints();
    
    console.log('\n📊 Summary:');
    const successful = Object.values(allTests).filter(r => r.success).length;
    const total = Object.keys(allTests).length;
    
    console.log(`   API Health: ${successful}/${total} endpoints working`);
    
    if (tempTest.success) {
      console.log(`   Current Temp: ${tempTest.avgTemperature.toFixed(2)}°C`);
      console.log(`   Expected ~29.42°C: ${Math.abs(tempTest.avgTemperature - 29.42) < 2 ? '✅ Close' : '⚠️ Different'}`);
    }
    
    return {
      temperature: tempTest,
      endpoints: allTests,
      healthScore: successful / total
    };
  }
}

// Run the test
async function main() {
  const tester = new NEARealTimeServiceTest();
  const results = await tester.runComprehensiveTest();
  
  console.log('\n🎯 Test Complete!');
  process.exit(results.healthScore >= 0.5 ? 0 : 1);
}

main().catch(console.error);