// Weather Data Transformer

import { STATION_MAPPING } from '../config/weatherStations.js';

export function transformWeatherData(rawData) {
  if (!rawData || !rawData.data) {
    console.warn('⚠️ Invalid weather data structure');
    return createFallbackData();
  }

  try {
    const { data } = rawData;

    // 현재 날씨 정보 추출
    const current = extractCurrentWeather(data);

    // 지역별 정보 변환
    const locations = transformLocations(data);

    // 예보 정보 (현재는 기본값)
    const forecast = generateBasicForecast(current);

    const transformedData = {
      timestamp: rawData.timestamp || new Date().toISOString(),
      source: rawData.source || 'NEA Singapore',
      current,
      locations,
      forecast,
      meta: {
        stations: data.temperature?.readings?.length || 0,
        lastUpdate: rawData.timestamp,
        dataQuality: assessDataQuality(data),
      },
      // 원본 NEA API 데이터도 포함 (DirectMapView 히트맵용)
      data: rawData.data,
    };


    return transformedData;
  } catch (error) {
    console.error('❌ Data transformation error:', error);
    return createFallbackData();
  }
}

function extractCurrentWeather(data) {
  const temperature = calculateAverage(data.temperature?.readings);
  const humidity = calculateAverage(data.humidity?.readings);
  const rainfall = calculateAverage(data.rainfall?.readings);
  const windSpeed = calculateAverage(data.wind_speed?.readings);

  return {
    temperature: temperature ? Math.round(temperature * 10) / 10 : null,
    humidity: humidity ? Math.round(humidity) : null,
    rainfall: rainfall ? Math.round(rainfall * 10) / 10 : 0,
    windSpeed: windSpeed ? Math.round(windSpeed * 10) / 10 : null,
    windDirection: formatWindDirection(getAverageWindDirection(data.wind_direction?.readings) || data.forecast?.general?.wind?.direction) || '🌪️ 다양함',
    feelsLike: temperature ? Math.round(temperature * 10) / 10 + 2.0 : null, // 체감온도: 실제온도 + 2.0°C (고정)
    uvIndex: '--', // NEA에서 제공하지 않음
    visibility: '--', // NEA에서 제공하지 않음
    location: 'Singapore',
    description: getWeatherDescription(temperature, rainfall),
    icon: getWeatherIcon(temperature, rainfall),
  };
}

function transformLocations(data) {
  const locations = [];

  // 전체 평균 정보
  locations.push({
    id: 'all',
    name: 'All Singapore',
    displayName: 'Singapore Average',
    description: 'Average across all weather stations',
    station_id: 'avg',
    priority: 'primary',
    coordinates: { lat: 1.3521, lng: 103.8198 },
    temperature: calculateAverage(data.temperature?.readings),
    humidity: calculateAverage(data.humidity?.readings),
    rainfall: calculateAverage(data.rainfall?.readings),
  });

  const primaryStations = ['S117', 'S50', 'S106'];
  primaryStations.forEach(stationId => {
    const stationData = extractStationData(data, stationId);
    if (stationData) {
      locations.push(stationData);
    }
  });

  // 나머지 secondary 스테이션들
  const tempReadings = data.temperature?.readings || [];
  const processedStations = new Set([...primaryStations, 'avg']);

  tempReadings.forEach(reading => {
    if (!processedStations.has(reading.station)) {
      const stationData = extractStationData(data, reading.station);
      if (stationData) {
        locations.push(stationData);
        processedStations.add(reading.station);
      }
    }
  });

  return locations;
}

function extractStationData(data, stationId) {
  const stationInfo = STATION_MAPPING[stationId];
  if (!stationInfo) {
    return null;
  }

  const temperature = findStationValue(data.temperature?.readings, stationId);
  const humidity = findStationValue(data.humidity?.readings, stationId);
  const rainfall = findStationValue(data.rainfall?.readings, stationId);

  return {
    id: stationId,
    name: stationInfo.name,
    displayName: stationInfo.displayName || stationInfo.name,
    description: stationInfo.description,
    station_id: stationId,
    priority: stationInfo.priority || 'secondary',
    coordinates: stationInfo.coordinates,
    temperature: temperature !== null ? Math.round(temperature * 10) / 10 : null,
    humidity: humidity !== null ? Math.round(humidity) : null,
    rainfall: rainfall !== null ? Math.round(rainfall * 10) / 10 : null,
  };
}

function findStationValue(readings, stationId) {
  if (!readings || !Array.isArray(readings)) {return null;}
  const reading = readings.find(r => r.station === stationId);
  return reading ? reading.value : null;
}

function calculateAverage(readings) {
  if (!readings || !Array.isArray(readings) || readings.length === 0) {
    return null;
  }

  const validValues = readings
    .map(r => r.value)
    .filter(v => v !== null && v !== undefined && !isNaN(v));

  if (validValues.length === 0) {return null;}

  return validValues.reduce((sum, val) => sum + val, 0) / validValues.length;
}

function getAverageWindDirection(readings) {
  if (!readings || !Array.isArray(readings) || readings.length === 0) {
    return null; // fallback 로직이 작동하도록 null 반환
  }

  // 가장 흔한 풍향 반환
  const directions = readings.map(r => r.value).filter(v => v);
  if (directions.length === 0) {
    return null; // fallback 로직이 작동하도록 null 반환
  }

  const directionCounts = {};
  directions.forEach(dir => {
    directionCounts[dir] = (directionCounts[dir] || 0) + 1;
  });

  return Object.entries(directionCounts)
    .sort(([,a], [,b]) => b - a)[0][0];
}

// 바람 방향을 화살표와 한글로 변환하는 함수
function formatWindDirection(direction) {
  if (!direction) return null;
  
  const windDirections = {
    'N': '↓ 북풍',
    'NNE': '↙ 북북동풍', 
    'NE': '↙ 북동풍',
    'ENE': '↙ 동북동풍',
    'E': '← 동풍',
    'ESE': '↖ 동남동풍',
    'SE': '↖ 남동풍', 
    'SSE': '↖ 남남동풍',
    'S': '↑ 남풍',
    'SSW': '↗ 남남서풍',
    'SW': '↗ 남서풍',
    'WSW': '↗ 서남서풍', 
    'W': '→ 서풍',
    'WNW': '↘ 서북서풍',
    'NW': '↘ 북서풍',
    'NNW': '↘ 북북서풍'
  };

  return windDirections[direction.toUpperCase()] || `🧭 ${direction}`;
}

function getWeatherDescription(temperature, rainfall) {
  if (rainfall > 5) {return 'Rainy';}
  if (rainfall > 0.5) {return 'Light Rain';}
  if (temperature > 32) {return 'Hot';}
  if (temperature > 28) {return 'Warm';}
  if (temperature > 24) {return 'Pleasant';}
  return 'Cool';
}

function getWeatherIcon(temperature, rainfall) {
  if (rainfall > 5) {return '🌧️';}
  if (rainfall > 0.5) {return '🌦️';}
  if (temperature > 32) {return '☀️';}
  if (temperature > 28) {return '⛅';}
  return '🌤️';
}

function generateBasicForecast(current) {
  return [
    {
      time: 'Today',
      temperature: current.temperature,
      description: current.description,
      icon: current.icon,
    },
    {
      time: 'Tomorrow',
      temperature: current.temperature ? current.temperature + 1 : null,
      description: 'Partly Cloudy',
      icon: '⛅',
    },
  ];
}

function assessDataQuality(data) {
  const hasTemp = data.temperature?.readings?.length > 0;
  const hasHumidity = data.humidity?.readings?.length > 0;
  const hasRainfall = data.rainfall?.readings?.length > 0;

  const qualityScore = [hasTemp, hasHumidity, hasRainfall].filter(Boolean).length;

  if (qualityScore >= 3) {return 'high';}
  if (qualityScore >= 2) {return 'medium';}
  return 'low';
}

function createFallbackData() {
  return {
    timestamp: new Date().toISOString(),
    source: 'Fallback Data',
    current: {
      temperature: null,
      humidity: null,
      rainfall: 0,
      windSpeed: null,
      windDirection: 'Variable',
      feelsLike: null,
      uvIndex: '--',
      visibility: '--',
      location: 'Singapore',
      description: 'Data Unavailable',
      icon: '❓',
    },
    locations: [
      {
        id: 'fallback',
        name: 'Singapore',
        displayName: 'Singapore (Fallback)',
        description: 'Weather data temporarily unavailable',
        station_id: 'fallback',
        priority: 'primary',
        coordinates: { lat: 1.3521, lng: 103.8198 },
        temperature: null,
        humidity: null,
        rainfall: null,
      },
    ],
    forecast: [],
    meta: {
      stations: 0,
      lastUpdate: new Date().toISOString(),
      dataQuality: 'unavailable',
    },
    // 빈 원본 데이터 구조
    data: {
      temperature: { readings: [] },
      humidity: { readings: [] },
      rainfall: { readings: [] }
    },
  };
}

export default {
  transformWeatherData,
  createFallbackData,
};