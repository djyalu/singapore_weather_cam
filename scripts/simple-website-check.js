#!/usr/bin/env node

/**
 * Simple Website Check Script
 * Alternative to Playwright for basic website accessibility testing
 */

import fetch from 'node-fetch';
import { promises as fs } from 'fs';

const TARGET_URL = 'https://djyalu.github.io/singapore_weather_cam/';

async function checkWebsite() {
  console.log('🔍 싱가포르 날씨캠 웹사이트 점검 시작...');
  console.log(`📍 대상 URL: ${TARGET_URL}`);
  
  const results = {
    timestamp: new Date().toISOString(),
    url: TARGET_URL,
    tests: []
  };

  // Test 1: Basic HTML loading
  try {
    console.log('\n📄 1. HTML 페이지 로딩 테스트...');
    const response = await fetch(TARGET_URL);
    const html = await response.text();
    
    const test1 = {
      name: 'HTML Loading',
      status: response.ok ? 'PASS' : 'FAIL',
      statusCode: response.status,
      details: {
        size: html.length,
        hasTitle: html.includes('<title>Singapore Weather Cam'),
        hasReactRoot: html.includes('<div id="root">'),
        hasServiceWorker: html.includes('serviceWorker'),
        hasCorrectPaths: html.includes('/singapore_weather_cam/assets/')
      }
    };
    
    results.tests.push(test1);
    console.log(`   ✅ 상태: ${test1.status} (${test1.statusCode})`);
    console.log(`   📏 크기: ${test1.details.size} bytes`);
    console.log(`   🏷️  제목: ${test1.details.hasTitle ? '✅' : '❌'}`);
    console.log(`   ⚛️  React Root: ${test1.details.hasReactRoot ? '✅' : '❌'}`);
    console.log(`   🔧 Service Worker: ${test1.details.hasServiceWorker ? '✅' : '❌'}`);
    console.log(`   📁 올바른 경로: ${test1.details.hasCorrectPaths ? '✅' : '❌'}`);
    
  } catch (error) {
    const test1 = {
      name: 'HTML Loading',
      status: 'ERROR',
      error: error.message
    };
    results.tests.push(test1);
    console.log(`   ❌ 오류: ${error.message}`);
  }

  // Test 2: Main JavaScript file
  try {
    console.log('\n📜 2. JavaScript 파일 로딩 테스트...');
    const jsResponse = await fetch(`${TARGET_URL}assets/index-f2e3e4b0.js`);
    
    const test2 = {
      name: 'JavaScript Loading',
      status: jsResponse.ok ? 'PASS' : 'FAIL',
      statusCode: jsResponse.status,
      details: {
        size: jsResponse.headers.get('content-length'),
        contentType: jsResponse.headers.get('content-type')
      }
    };
    
    results.tests.push(test2);
    console.log(`   ✅ 상태: ${test2.status} (${test2.statusCode})`);
    console.log(`   📏 크기: ${test2.details.size} bytes`);
    console.log(`   🏷️  타입: ${test2.details.contentType}`);
    
  } catch (error) {
    const test2 = {
      name: 'JavaScript Loading',
      status: 'ERROR',
      error: error.message
    };
    results.tests.push(test2);
    console.log(`   ❌ 오류: ${error.message}`);
  }

  // Test 3: Service Worker
  try {
    console.log('\n⚙️ 3. Service Worker 파일 테스트...');
    const swResponse = await fetch(`${TARGET_URL}sw.js`);
    const swContent = await swResponse.text();
    
    const test3 = {
      name: 'Service Worker',
      status: swResponse.ok ? 'PASS' : 'FAIL',
      statusCode: swResponse.status,
      details: {
        hasBasePath: swContent.includes('BASE_PATH = \'/singapore_weather_cam\''),
        hasCorrectCacheVersion: swContent.includes('v1.1.1'),
        size: swContent.length
      }
    };
    
    results.tests.push(test3);
    console.log(`   ✅ 상태: ${test3.status} (${test3.statusCode})`);
    console.log(`   📁 올바른 기본 경로: ${test3.details.hasBasePath ? '✅' : '❌'}`);
    console.log(`   🔄 올바른 캐시 버전: ${test3.details.hasCorrectCacheVersion ? '✅' : '❌'}`);
    console.log(`   📏 크기: ${test3.details.size} bytes`);
    
  } catch (error) {
    const test3 = {
      name: 'Service Worker',
      status: 'ERROR',
      error: error.message
    };
    results.tests.push(test3);
    console.log(`   ❌ 오류: ${error.message}`);
  }

  // Test 4: Weather Data API
  try {
    console.log('\n🌤️ 4. 날씨 데이터 API 테스트...');
    const weatherResponse = await fetch(`${TARGET_URL}data/weather/latest.json`);
    const weatherData = await weatherResponse.json();
    
    const test4 = {
      name: 'Weather Data API',
      status: weatherResponse.ok ? 'PASS' : 'FAIL',
      statusCode: weatherResponse.status,
      details: {
        hasTimestamp: !!weatherData.timestamp,
        hasLocations: Array.isArray(weatherData.locations),
        locationCount: weatherData.locations?.length || 0,
        hasCurrent: !!weatherData.current
      }
    };
    
    results.tests.push(test4);
    console.log(`   ✅ 상태: ${test4.status} (${test4.statusCode})`);
    console.log(`   ⏰ 타임스탬프: ${test4.details.hasTimestamp ? '✅' : '❌'}`);
    console.log(`   📍 위치 데이터: ${test4.details.hasLocations ? '✅' : '❌'} (${test4.details.locationCount}개)`);
    console.log(`   🌡️  현재 날씨: ${test4.details.hasCurrent ? '✅' : '❌'}`);
    
  } catch (error) {
    const test4 = {
      name: 'Weather Data API',
      status: 'ERROR',
      error: error.message
    };
    results.tests.push(test4);
    console.log(`   ❌ 오류: ${error.message}`);
  }

  // Test 5: Webcam Data API
  try {
    console.log('\n📷 5. 웹캠 데이터 API 테스트...');
    const webcamResponse = await fetch(`${TARGET_URL}data/webcam/latest.json`);
    const webcamData = await webcamResponse.json();
    
    const test5 = {
      name: 'Webcam Data API',
      status: webcamResponse.ok ? 'PASS' : 'FAIL',
      statusCode: webcamResponse.status,
      details: {
        hasTimestamp: !!webcamData.timestamp,
        hasCaptures: Array.isArray(webcamData.captures),
        captureCount: webcamData.captures?.length || 0,
        hasStats: !!webcamData.total_cameras
      }
    };
    
    results.tests.push(test5);
    console.log(`   ✅ 상태: ${test5.status} (${test5.statusCode})`);
    console.log(`   ⏰ 타임스탬프: ${test5.details.hasTimestamp ? '✅' : '❌'}`);
    console.log(`   📸 캡처 데이터: ${test5.details.hasCaptures ? '✅' : '❌'} (${test5.details.captureCount}개)`);
    console.log(`   📊 통계: ${test5.details.hasStats ? '✅' : '❌'}`);
    
  } catch (error) {
    const test5 = {
      name: 'Webcam Data API',
      status: 'ERROR',
      error: error.message
    };
    results.tests.push(test5);
    console.log(`   ❌ 오류: ${error.message}`);
  }

  // Summary
  const passCount = results.tests.filter(t => t.status === 'PASS').length;
  const failCount = results.tests.filter(t => t.status === 'FAIL').length;
  const errorCount = results.tests.filter(t => t.status === 'ERROR').length;
  const total = results.tests.length;

  console.log('\n📊 테스트 결과 요약:');
  console.log(`   ✅ 통과: ${passCount}/${total}`);
  console.log(`   ❌ 실패: ${failCount}/${total}`);
  console.log(`   🚨 오류: ${errorCount}/${total}`);
  
  const overallStatus = passCount === total ? 'ALL_PASS' : 
                       (passCount > 0 ? 'PARTIAL_PASS' : 'ALL_FAIL');
  
  console.log(`   🎯 전체 상태: ${overallStatus}`);

  results.summary = {
    total,
    pass: passCount,
    fail: failCount,
    error: errorCount,
    overallStatus
  };

  // Save results
  try {
    await fs.mkdir('test-results', { recursive: true });
    await fs.writeFile(
      'test-results/simple-website-check.json',
      JSON.stringify(results, null, 2)
    );
    console.log('\n💾 결과가 test-results/simple-website-check.json에 저장되었습니다.');
  } catch (error) {
    console.log(`\n⚠️  결과 저장 실패: ${error.message}`);
  }

  if (overallStatus === 'ALL_PASS') {
    console.log('\n🎉 모든 테스트 통과! 웹사이트가 정상적으로 작동하고 있습니다.');
  } else if (overallStatus === 'PARTIAL_PASS') {
    console.log('\n⚠️  일부 문제가 발견되었습니다. 세부 내용을 확인해주세요.');
  } else {
    console.log('\n🚨 심각한 문제가 발견되었습니다. 웹사이트 접근에 문제가 있을 수 있습니다.');
  }

  return results;
}

// Run the check
checkWebsite().catch((error) => {
  console.error('🚨 테스트 실행 중 오류 발생:', error);
  process.exit(1);
});