#!/usr/bin/env node

/**
 * Singapore Weather Cam - Weather Data Collector
 * 싱가포르 공식 NEA API와 백업 서비스에서 날씨 데이터를 수집합니다.
 */

import fs from 'fs/promises';
import path from 'path';

// Node.js 내장 fetch (Node 18+) 또는 node-fetch 사용
let fetch;
try {
  fetch = globalThis.fetch;
} catch {
  const { default: nodeFetch } = await import('node-fetch');
  fetch = nodeFetch;
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

// 우선순위 지역 - Hwa Chong International School 중심
const PRIORITY_LOCATIONS = {
  hwa_chong_international_school: {
    name: 'Hwa Chong International School',
    coordinates: { lat: 1.32865, lng: 103.80227 },
    station_preferences: ['S116', 'S121', 'S118'] // Hwa Chong 인근 스테이션 우선순위
  },
  newton: {
    name: 'Newton',
    coordinates: { lat: 1.3138, lng: 103.8420 },
    station_preferences: ['S106', 'S107']
  },
  clementi: {
    name: 'Clementi',
    coordinates: { lat: 1.3162, lng: 103.7649 },
    station_preferences: ['S122', 'S113']
  }
};

/**
 * API에서 데이터를 안전하게 가져오는 함수
 */
async function fetchWithRetry(url, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url, { 
        timeout: 10000,
        headers: {
          'User-Agent': 'Singapore-Weather-Cam/1.0'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.warn(`Attempt ${i + 1} failed for ${url}:`, error.message);
      if (i === retries - 1) throw error;
      
      // 재시도 전 대기 (지수 백오프)
      await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
    }
  }
}

/**
 * 싱가포르 NEA API에서 날씨 데이터 수집
 */
async function collectNeaData() {
  try {
    const [tempData, humidityData, rainfallData, forecastData] = await Promise.allSettled([
      fetchWithRetry(WEATHER_APIS.nea_temperature),
      fetchWithRetry(WEATHER_APIS.nea_humidity),
      fetchWithRetry(WEATHER_APIS.nea_rainfall),
      fetchWithRetry(WEATHER_APIS.nea_forecast)
    ]);

    const result = {
      timestamp: new Date().toISOString(),
      source: 'NEA Singapore',
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
    console.error('Error in weather data collection:', error);
    process.exit(1);
  }
}

// 스크립트 직접 실행 시에만 main 함수 호출
if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  main();
}