/**
 * 날씨 데이터 통합 유틸리티
 * 지역별 날씨 정보와 히트맵 데이터의 일치성을 보장
 */

// 표준 지역 정의 - 모든 컴포넌트에서 공통 사용
export const STANDARD_REGIONS = [
  {
    id: 'hwa-chong',
    name: 'Hwa Chong Area',
    displayName: 'Hwa Chong',
    stationIds: ['S109', 'S104'], // Ang Mo Kio & Woodlands
    coordinates: { lat: 1.3437, lng: 103.7640 },
    fallbackTemp: 29.5,
    emoji: '🏫',
    description: 'Hwa Chong International School 지역'
  },
  {
    id: 'newton',
    name: 'Central Singapore', 
    displayName: 'Newton',
    stationIds: ['S109', 'S107'], // Newton & East Coast
    coordinates: { lat: 1.3100, lng: 103.8300 },
    fallbackTemp: 30.2,
    emoji: '🏙️',
    description: 'Newton MRT 및 Central 지역'
  },
  {
    id: 'changi',
    name: 'Eastern Singapore',
    displayName: 'Changi', 
    stationIds: ['S24', 'S107'], // Changi & East Coast
    coordinates: { lat: 1.3600, lng: 103.9600 },
    fallbackTemp: 28.8,
    emoji: '✈️',
    description: 'Changi Airport 및 동부 지역'
  },
  {
    id: 'north',
    name: 'Northern Singapore',
    displayName: 'North',
    stationIds: ['S24', 'S115'], // 북부 지역
    coordinates: { lat: 1.4200, lng: 103.7900 },
    fallbackTemp: 30.1,
    emoji: '🌳',
    description: '북부 주거 및 산업 지역'
  }
];

/**
 * 통합된 지역별 온도 계산 함수
 * @param {Object} weatherData - 날씨 데이터 
 * @param {string} regionId - 지역 ID
 * @returns {number} 해당 지역의 평균 온도
 */
export const getRegionalTemperature = (weatherData, regionId) => {
  const region = STANDARD_REGIONS.find(r => r.id === regionId);
  if (!region) {
    console.warn(`Unknown region: ${regionId}`);
    return 29.0;
  }

  // 실제 날씨 데이터에서 해당 지역 온도 계산
  // 1순위: locations 배열에서 찾기 (RegionalWeatherDashboard용)
  if (weatherData?.locations && Array.isArray(weatherData.locations)) {
    const matchedStations = region.stationIds
      .map(id => weatherData.locations.find(loc => loc.id === id || loc.station_id === id))
      .filter(Boolean);
      
    const temps = matchedStations
      .map(loc => loc.temperature)
      .filter(temp => typeof temp === 'number' && !isNaN(temp));
    
    if (temps.length > 0) {
      const avgTemp = temps.reduce((sum, temp) => sum + temp, 0) / temps.length;
      console.log(`✅ ${region.displayName} 실제 온도 (locations): ${avgTemp.toFixed(1)}°C (Stations: ${region.stationIds.join(', ')})`);
      return avgTemp;
    }
  }

  // 2순위: data.temperature.readings에서 찾기 (DirectMapView용)
  if (weatherData?.data?.temperature?.readings && Array.isArray(weatherData.data.temperature.readings)) {
    const matchedReadings = region.stationIds
      .map(stationId => weatherData.data.temperature.readings.find(reading => reading.station === stationId))
      .filter(Boolean);
      
    const temps = matchedReadings
      .map(reading => reading.value)
      .filter(temp => typeof temp === 'number' && !isNaN(temp));
    
    if (temps.length > 0) {
      const avgTemp = temps.reduce((sum, temp) => sum + temp, 0) / temps.length;
      console.log(`✅ ${region.displayName} 실제 온도 (readings): ${avgTemp.toFixed(1)}°C (Stations: ${region.stationIds.join(', ')})`);
      return avgTemp;
    }
  }

  // Fallback 온도 사용
  console.log(`⚠️ ${region.displayName} fallback 온도: ${region.fallbackTemp}°C`);
  return region.fallbackTemp;
};

/**
 * 전체 싱가포르 평균 온도 계산 (모든 지역 통합)
 * @param {Object} weatherData - 날씨 데이터
 * @returns {Object} 전체 평균 날씨 정보
 */
export const getOverallWeatherData = (weatherData) => {
  if (!weatherData) {
    return {
      temperature: 29.0,
      humidity: 80,
      rainfall: 0,
      forecast: 'Partly Cloudy',
      lastUpdate: new Date().toISOString(),
      stationCount: 0,
      source: 'fallback'
    };
  }

  // 1순위: NEA API 직접 데이터 구조 (data.temperature.readings)
  if (weatherData.data?.temperature?.readings && Array.isArray(weatherData.data.temperature.readings)) {
    const readings = weatherData.data.temperature.readings;
    const stationCount = readings.length;
    
    // stations_used 배열도 확인하여 더 정확한 관측소 수 계산
    const totalStations = Math.max(
      stationCount,
      weatherData.stations_used?.length || 0,
      weatherData.geographic_coverage?.total_stations || 0
    );
    
    console.log(`📊 NEA API 관측소 정보: readings=${stationCount}, stations_used=${weatherData.stations_used?.length}, total=${weatherData.geographic_coverage?.total_stations}`);
    
    return {
      temperature: weatherData.data.temperature.average || 29.0,
      humidity: weatherData.data.humidity?.average || 80,
      rainfall: weatherData.data.rainfall?.total || 0,
      forecast: weatherData.data.forecast?.general?.forecast || 'Partly Cloudy',
      lastUpdate: weatherData.timestamp,
      stationCount: totalStations,
      source: 'nea_api_direct'
    };
  }

  // 2순위: 전체 평균 데이터가 있는 경우 (변환된 데이터)
  if (weatherData.current) {
    return {
      temperature: weatherData.current.temperature || 29.0,
      humidity: weatherData.current.humidity || 80,
      rainfall: weatherData.current.rainfall || 0,
      forecast: weatherData.current.description || 'Partly Cloudy',
      lastUpdate: weatherData.timestamp,
      stationCount: weatherData.meta?.stations || weatherData.stations_used?.length || 0,
      source: 'current_average'
    };
  }

  // 3순위: 지역별 데이터로부터 전체 평균 계산
  if (weatherData.locations && Array.isArray(weatherData.locations)) {
    const allTemps = STANDARD_REGIONS
      .map(region => getRegionalTemperature(weatherData, region.id))
      .filter(temp => typeof temp === 'number' && !isNaN(temp));

    if (allTemps.length > 0) {
      const avgTemp = allTemps.reduce((sum, temp) => sum + temp, 0) / allTemps.length;
      
      // 습도와 강수량도 계산
      const allHumidity = weatherData.locations
        .map(loc => loc.humidity)
        .filter(h => typeof h === 'number' && !isNaN(h));
      const avgHumidity = allHumidity.length > 0 
        ? allHumidity.reduce((sum, h) => sum + h, 0) / allHumidity.length 
        : 80;

      const allRainfall = weatherData.locations
        .map(loc => loc.rainfall)
        .filter(r => typeof r === 'number' && !isNaN(r));
      const avgRainfall = allRainfall.length > 0
        ? allRainfall.reduce((sum, r) => sum + r, 0) / allRainfall.length
        : 0;

      console.log(`📊 전체 평균: ${avgTemp.toFixed(1)}°C (${allTemps.length}개 지역 기준)`);
      
      return {
        temperature: avgTemp,
        humidity: avgHumidity,
        rainfall: avgRainfall,
        forecast: 'Partly Cloudy',
        lastUpdate: weatherData.timestamp,
        stationCount: weatherData.locations.length,
        source: 'regional_average'
      };
    }
  }

  // 4순위: Fallback 데이터
  const fallbackAvg = STANDARD_REGIONS.reduce((sum, region) => sum + region.fallbackTemp, 0) / STANDARD_REGIONS.length;
  
  return {
    temperature: fallbackAvg,
    humidity: 80,
    rainfall: 0,
    forecast: 'Partly Cloudy', 
    lastUpdate: new Date().toISOString(),
    stationCount: 0,
    source: 'fallback_average'
  };
};

/**
 * 온도에 따른 색상 계산 (히트맵용)
 * @param {number} temp - 온도
 * @returns {string} CSS 색상 코드
 */
export const getTemperatureColor = (temp) => {
  if (temp >= 32) return '#EF4444'; // 빨간색 - 매우 더움
  if (temp >= 30) return '#F97316'; // 주황색 - 더움  
  if (temp >= 28) return '#EAB308'; // 노란색 - 따뜻함
  if (temp >= 26) return '#22C55E'; // 초록색 - 쾌적함
  return '#3B82F6'; // 파란색 - 선선함
};

/**
 * 온도에 따른 설명 텍스트
 * @param {number} temp - 온도
 * @returns {string} 온도 설명
 */
export const getTemperatureDescription = (temp) => {
  if (temp >= 32) return '매우 더움';
  if (temp >= 30) return '덥고 습함';
  if (temp >= 28) return '따뜻함';
  if (temp >= 26) return '쾌적함';
  return '선선함';
};

/**
 * 데이터 일치성 검증 함수
 * @param {Object} weatherData - 날씨 데이터
 * @returns {Object} 검증 결과
 */
export const validateDataConsistency = (weatherData) => {
  const results = {
    isConsistent: true,
    issues: [],
    regionalTemps: {},
    overallTemp: null
  };

  // 전체 온도 계산
  const overall = getOverallWeatherData(weatherData);
  results.overallTemp = overall.temperature;

  // 각 지역별 온도 계산
  STANDARD_REGIONS.forEach(region => {
    const regionalTemp = getRegionalTemperature(weatherData, region.id);
    results.regionalTemps[region.id] = {
      temperature: regionalTemp,
      name: region.displayName,
      source: weatherData?.locations ? 'real_data' : 'fallback'
    };

    // 전체 평균과 지역별 온도 차이 검사 (2도 이상 차이나면 경고)
    const tempDiff = Math.abs(regionalTemp - overall.temperature);
    if (tempDiff > 2) {
      results.issues.push(`${region.displayName} 온도(${regionalTemp.toFixed(1)}°C)가 전체 평균(${overall.temperature.toFixed(1)}°C)과 ${tempDiff.toFixed(1)}°C 차이`);
      results.isConsistent = false;
    }
  });

  return results;
};