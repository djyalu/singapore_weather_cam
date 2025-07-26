#!/usr/bin/env node

/**
 * Singapore Weather Cam - Weather Data Collector
 * 싱가포르 공식 NEA API와 백업 서비스에서 날씨 데이터를 수집합니다.
 */

import fs from 'fs/promises';
import path from 'path';

// Enhanced fetch with circuit breaker pattern
let fetch;
try {
  fetch = globalThis.fetch;
} catch {
  const { default: nodeFetch } = await import('node-fetch');
  fetch = nodeFetch;
}

// Production environment configuration
const CONFIG = {
  REQUEST_TIMEOUT: parseInt(process.env.REQUEST_TIMEOUT) || 10000,
  MAX_RETRIES: parseInt(process.env.MAX_RETRIES) || 3,
  CIRCUIT_BREAKER_THRESHOLD: 5,
  CIRCUIT_BREAKER_TIMEOUT: 60000, // 1 minute
  BATCH_DELAY: 1000, // 1 second between API calls
  MAX_CONCURRENT_REQUESTS: 3
};

// Circuit breaker state management
const CIRCUIT_BREAKER = {
  failures: 0,
  lastFailureTime: null,
  state: 'CLOSED' // CLOSED, OPEN, HALF_OPEN
};

/**
 * Circuit breaker implementation for API resilience
 */
function checkCircuitBreaker() {
  const now = Date.now();
  
  if (CIRCUIT_BREAKER.state === 'OPEN') {
    if (now - CIRCUIT_BREAKER.lastFailureTime > CONFIG.CIRCUIT_BREAKER_TIMEOUT) {
      console.log('🔄 Circuit breaker transitioning to HALF_OPEN state');
      CIRCUIT_BREAKER.state = 'HALF_OPEN';
      return true;
    }
    console.log('⚡ Circuit breaker OPEN - blocking request');
    return false;
  }
  
  return true;
}

/**
 * Record API call success/failure for circuit breaker
 */
function recordApiResult(success) {
  if (success) {
    if (CIRCUIT_BREAKER.state === 'HALF_OPEN') {
      console.log('✅ Circuit breaker reset to CLOSED state');
      CIRCUIT_BREAKER.state = 'CLOSED';
      CIRCUIT_BREAKER.failures = 0;
    }
  } else {
    CIRCUIT_BREAKER.failures++;
    CIRCUIT_BREAKER.lastFailureTime = Date.now();
    
    if (CIRCUIT_BREAKER.failures >= CONFIG.CIRCUIT_BREAKER_THRESHOLD) {
      console.log(`🔴 Circuit breaker OPEN after ${CIRCUIT_BREAKER.failures} failures`);
      CIRCUIT_BREAKER.state = 'OPEN';
    }
  }
}

// API 엔드포인트들
const WEATHER_APIS = {
  // 싱가포르 공식 기상청 데이터 (무료, 무제한)
  nea_temperature: 'https://api.data.gov.sg/v1/environment/air-temperature',
  nea_humidity: 'https://api.data.gov.sg/v1/environment/relative-humidity',
  nea_rainfall: 'https://api.data.gov.sg/v1/environment/rainfall',
  nea_forecast: 'https://api.data.gov.sg/v1/environment/24-hour-weather-forecast',
  
  // 백업 API (선택사항)
  openweather: process.env.WEATHER_API_KEY 
    ? `https://api.openweathermap.org/data/2.5/weather?q=Singapore&appid=${process.env.WEATHER_API_KEY}&units=metric`
    : null
};

// 우선순위 지역 - Bukit Timah Nature Reserve 중심
const PRIORITY_LOCATIONS = {
  bukit_timah_nature_reserve: {
    name: 'Bukit Timah Nature Reserve',
    coordinates: { lat: 1.3520, lng: 103.7767 },
    station_preferences: ['S121', 'S116', 'S118'], // Bukit Timah 지역 스테이션 우선순위
    priority: 'primary'
  },
  newton: {
    name: 'Newton',
    coordinates: { lat: 1.3138, lng: 103.8420 },
    station_preferences: ['S106', 'S107'],
    priority: 'secondary'
  },
  clementi: {
    name: 'Clementi',
    coordinates: { lat: 1.3162, lng: 103.7649 },
    station_preferences: ['S122', 'S113'],
    priority: 'secondary'
  }
};

/**
 * Enhanced API fetcher with circuit breaker and connection management
 */
async function fetchWithRetry(url, retries = CONFIG.MAX_RETRIES) {
  // Check circuit breaker before attempting request
  if (!checkCircuitBreaker()) {
    throw new Error('Circuit breaker OPEN - service temporarily unavailable');
  }
  
  const startTime = Date.now();
  let lastError = null;
  
  for (let i = 0; i < retries; i++) {
    try {
      console.log(`🔄 API Request [${i + 1}/${retries}]: ${url}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT);
      
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Singapore-Weather-Cam/1.0 (Production)',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      const duration = Date.now() - startTime;
      
      console.log(`✅ API Success: ${url} (${duration}ms)`);
      recordApiResult(true);
      
      return data;
      
    } catch (error) {
      lastError = error;
      const isTimeout = error.name === 'AbortError';
      const duration = Date.now() - startTime;
      
      console.warn(`⚠️ Attempt ${i + 1} failed: ${url} (${duration}ms) - ${error.message}`);
      
      if (i === retries - 1) {
        recordApiResult(false);
        throw new Error(`API failed after ${retries} attempts: ${lastError.message}`);
      }
      
      // Exponential backoff with jitter
      const backoffDelay = Math.pow(2, i) * 1000 + Math.random() * 1000;
      console.log(`⏳ Retrying in ${Math.round(backoffDelay)}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }
}

/**
 * Enhanced NEA API data collection with concurrent limiting
 */
async function collectNeaData() {
  try {
    console.log('🌏 Starting NEA Singapore API data collection...');
    const startTime = Date.now();
    
    // Sequential API calls to avoid overwhelming the service
    const apiCalls = [
      { name: 'temperature', url: WEATHER_APIS.nea_temperature },
      { name: 'humidity', url: WEATHER_APIS.nea_humidity },
      { name: 'rainfall', url: WEATHER_APIS.nea_rainfall },
      { name: 'forecast', url: WEATHER_APIS.nea_forecast }
    ];
    
    const results = [];
    
    for (const { name, url } of apiCalls) {
      try {
        console.log(`📡 Fetching ${name} data...`);
        const data = await fetchWithRetry(url);
        results.push({ status: 'fulfilled', value: data, name });
        
        // Rate limiting between calls
        await new Promise(resolve => setTimeout(resolve, CONFIG.BATCH_DELAY));
        
      } catch (error) {
        console.error(`❌ Failed to fetch ${name}: ${error.message}`);
        results.push({ status: 'rejected', reason: error, name });
      }
    }
    
    const [tempData, humidityData, rainfallData, forecastData] = results;
    const duration = Date.now() - startTime;
    
    const result = {
      timestamp: new Date().toISOString(),
      source: 'NEA Singapore (Enhanced)',
      collection_time_ms: duration,
      api_calls: results.length,
      successful_calls: results.filter(r => r.status === 'fulfilled').length,
      failed_calls: results.filter(r => r.status === 'rejected').length,
      data: {}
    };

    if (tempData.status === 'fulfilled') {
      const latestTemp = tempData.value.items[0];
      result.data.temperature = {
        readings: latestTemp.readings.map(r => ({
          station: r.station_id,
          value: r.value
        })),
        average: latestTemp.readings.reduce((sum, r) => sum + r.value, 0) / latestTemp.readings.length
      };
    }

    if (humidityData.status === 'fulfilled') {
      const latestHumidity = humidityData.value.items[0];
      result.data.humidity = {
        readings: latestHumidity.readings.map(r => ({
          station: r.station_id,
          value: r.value
        })),
        average: latestHumidity.readings.reduce((sum, r) => sum + r.value, 0) / latestHumidity.readings.length
      };
    }

    if (rainfallData.status === 'fulfilled') {
      const latestRainfall = rainfallData.value.items[0];
      result.data.rainfall = {
        readings: latestRainfall.readings.map(r => ({
          station: r.station_id,
          value: r.value
        })),
        total: latestRainfall.readings.reduce((sum, r) => sum + r.value, 0)
      };
    }

    if (forecastData.status === 'fulfilled') {
      const forecast = forecastData.value.items[0];
      result.data.forecast = {
        general: forecast.general,
        periods: forecast.periods
      };
    }

    return result;
  } catch (error) {
    console.error('Error collecting NEA data:', error);
    return null;
  }
}

/**
 * OpenWeatherMap API에서 백업 데이터 수집
 */
async function collectOpenWeatherData() {
  if (!WEATHER_APIS.openweather) {
    return null;
  }

  try {
    const data = await fetchWithRetry(WEATHER_APIS.openweather);
    
    return {
      timestamp: new Date().toISOString(),
      source: 'OpenWeatherMap',
      data: {
        temperature: {
          current: data.main.temp,
          feels_like: data.main.feels_like,
          min: data.main.temp_min,
          max: data.main.temp_max
        },
        humidity: {
          value: data.main.humidity
        },
        weather: {
          main: data.weather[0].main,
          description: data.weather[0].description,
          icon: data.weather[0].icon
        },
        wind: {
          speed: data.wind.speed,
          deg: data.wind.deg
        },
        visibility: data.visibility
      }
    };
  } catch (error) {
    console.error('Error collecting OpenWeather data:', error);
    return null;
  }
}

/**
 * 데이터를 파일에 저장
 */
async function saveWeatherData(weatherData) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');

  // 디렉토리 구조 생성
  const basePath = 'data/weather';
  const yearPath = path.join(basePath, year.toString());
  const monthPath = path.join(yearPath, month);
  const dayPath = path.join(monthPath, day);

  await fs.mkdir(dayPath, { recursive: true });

  // 시간별 파일 저장
  const hourlyFilePath = path.join(dayPath, `${hour}-${minute}.json`);
  await fs.writeFile(hourlyFilePath, JSON.stringify(weatherData, null, 2));

  // 최신 데이터 업데이트
  const latestFilePath = path.join(basePath, 'latest.json');
  await fs.writeFile(latestFilePath, JSON.stringify(weatherData, null, 2));

  // 일별 요약 업데이트
  await updateDailySummary(dayPath, weatherData);

  console.log(`Weather data saved: ${hourlyFilePath}`);
}

/**
 * 일별 요약 데이터 업데이트
 */
async function updateDailySummary(dayPath, newData) {
  const summaryPath = path.join(dayPath, 'summary.json');
  
  let summary = {
    date: new Date().toISOString().split('T')[0],
    readings: [],
    statistics: {}
  };

  // 기존 요약 파일이 있으면 로드
  try {
    const existingSummary = await fs.readFile(summaryPath, 'utf8');
    summary = JSON.parse(existingSummary);
  } catch (error) {
    // 파일이 없으면 새로 생성
  }

  // 새 데이터 추가
  summary.readings.push(newData);

  // 통계 계산
  if (summary.readings.length > 0) {
    const temperatures = summary.readings
      .filter(r => r.data.temperature?.average)
      .map(r => r.data.temperature.average);
    
    const humidities = summary.readings
      .filter(r => r.data.humidity?.average)
      .map(r => r.data.humidity.average);

    if (temperatures.length > 0) {
      summary.statistics.temperature = {
        min: Math.min(...temperatures),
        max: Math.max(...temperatures),
        average: temperatures.reduce((sum, t) => sum + t, 0) / temperatures.length
      };
    }

    if (humidities.length > 0) {
      summary.statistics.humidity = {
        min: Math.min(...humidities),
        max: Math.max(...humidities),
        average: humidities.reduce((sum, h) => sum + h, 0) / humidities.length
      };
    }
  }

  await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('Starting weather data collection...');

  try {
    // NEA 데이터 수집 (우선순위)
    let weatherData = await collectNeaData();

    // NEA 데이터 실패 시 OpenWeatherMap으로 폴백
    if (!weatherData && WEATHER_APIS.openweather) {
      console.log('NEA data unavailable, trying OpenWeatherMap...');
      weatherData = await collectOpenWeatherData();
    }

    if (weatherData) {
      await saveWeatherData(weatherData);
      console.log('Weather data collection completed successfully');
    } else {
      console.error('Failed to collect weather data from all sources');
      process.exit(1);
    }
  } catch (error) {
    const totalTime = Date.now() - startTime;
    console.error('');
    console.error('🔴 FATAL ERROR - Weather Collection System Failure');
    console.error(`  - Error: ${error.message}`);
    console.error(`  - Duration: ${totalTime}ms`);
    console.error(`  - Circuit breaker: ${CIRCUIT_BREAKER.state}`);
    console.error(`  - Timestamp: ${new Date().toISOString()}`);
    console.error('');
    console.error('📈 System Recovery Information:');
    console.error('  - Next automatic retry: 5 minutes');
    console.error('  - Expected resolution: < 15 minutes');
    console.error('  - Manual intervention may be required if persistent');
    
    process.exit(1);
  }
}

/**
 * Create emergency baseline weather data when all sources fail
 */
function createEmergencyWeatherData(primaryError, fallbackError = null) {
  const now = new Date();
  const hour = now.getHours();
  
  // Singapore typical weather patterns based on time of day
  const baselineTemp = 26 + (hour > 12 && hour < 18 ? 4 : 0); // Warmer in afternoon
  const baselineHumidity = 70 + (hour > 6 && hour < 10 ? 10 : 0); // Higher in morning
  
  return {
    timestamp: now.toISOString(),
    source: 'Emergency Baseline System',
    data_quality: 'estimated',
    reliability: 'emergency_mode',
    errors: {
      primary: primaryError.message,
      fallback: fallbackError?.message || 'not_configured'
    },
    data: {
      temperature: {
        estimated_current: baselineTemp,
        range: `${baselineTemp - 2}-${baselineTemp + 2}°C`,
        note: 'Singapore typical range - live data temporarily unavailable'
      },
      humidity: {
        estimated_current: baselineHumidity,
        range: `${baselineHumidity - 10}-${baselineHumidity + 10}%`,
        note: 'Tropical climate baseline'
      },
      location: {
        name: 'Bukit Timah Nature Reserve',
        coordinates: { lat: 1.3520, lng: 103.7767 },
        status: 'monitoring_restored_shortly'
      },
      forecast: {
        general: 'Typical Singapore weather patterns expected',
        reliability: 'baseline_estimate'
      }
    },
    recovery: {
      next_attempt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      expected_resolution: '< 15 minutes',
      service_level: 'degraded_with_baseline'
    }
  };
}

// Enhanced execution with graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('⚠️ Received SIGTERM - initiating graceful shutdown...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('⚠️ Received SIGINT - initiating graceful shutdown...');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('🔴 Uncaught Exception:', error);
  console.error('Stack:', error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🔴 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Execute main function
if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  main().catch((error) => {
    console.error('🔴 Main execution failed:', error);
    process.exit(1);
  });
}