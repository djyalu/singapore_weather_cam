#!/usr/bin/env node

/**
 * Cohere AI Weather Summary Script
 * 
 * Analyzes Singapore weather data using Cohere AI API
 * Generates AI summaries for overall weather conditions across Singapore
 * Server execution test - API key verified working
 */

import fs from 'fs/promises';
import path from 'path';
// Using built-in fetch API (Node.js 18+)

const COHERE_API_KEY = process.env.COHERE_API_KEY;
const FORCE_ANALYSIS = process.env.FORCE_ANALYSIS === 'true';
const MAX_DAILY_CALLS = 100; // Cohere Trial: 1000/month, 현재 사용량: ~250/month
const OUTPUT_DIR = 'data/weather-summary';
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'latest.json');
const WEATHER_DATA_FILE = 'data/weather/latest.json';

/**
 * Enhanced 59-Station Regional Analysis
 */
function generateRegionalAnalysis(weatherData) {
  const regionData = {};
  const dataTypes = ['temperature', 'humidity', 'rainfall', 'wind_speed', 'wind_direction'];
  
  // Check if enhanced 59-station data is available
  const hasEnhancedData = weatherData.stations_used && weatherData.station_details;
  
  if (hasEnhancedData) {
    console.log(`🎯 Enhanced analysis using ${weatherData.stations_used.length} stations`);
    
    // Use enhanced station metadata for better analysis
    weatherData.stations_used.forEach(stationId => {
      const stationDetail = weatherData.station_details[stationId];
      if (stationDetail) {
        const region = stationDetail.region || determineRegionFromCoordinates(stationDetail.coordinates);
        if (!regionData[region]) {
          regionData[region] = { 
            temperature: [], humidity: [], rainfall: [], 
            wind_speed: [], wind_direction: [], stations: new Set() 
          };
        }
        regionData[region].stations.add(stationDetail.name || stationId);
      }
    });
  }
  
  // Process data readings
  dataTypes.forEach(dataType => {
    const readings = weatherData.data?.[dataType]?.readings || [];
    readings.forEach(reading => {
      const region = hasEnhancedData && weatherData.station_details[reading.station] 
        ? weatherData.station_details[reading.station].region || determineRegionFromCoordinates(weatherData.station_details[reading.station].coordinates)
        : determineRegionFromCoordinates(reading.coordinates);
        
      if (!regionData[region]) {
        regionData[region] = { 
          temperature: [], humidity: [], rainfall: [], 
          wind_speed: [], wind_direction: [], stations: new Set() 
        };
      }
      
      if (reading.value !== null && reading.value !== undefined) {
        regionData[region][dataType].push(reading.value);
        regionData[region].stations.add(reading.station_name || reading.station);
      }
    });
  });
  
  // Enhanced regional summary generation
  let analysis = `📊 **전체 관측소 현황** ${hasEnhancedData ? weatherData.stations_used.length : '정보 수집 중'}개 관측소`;
  
  // Add detailed statistics if available
  if (hasEnhancedData && weatherData.geographic_coverage) {
    analysis += ` (coverage: ${weatherData.geographic_coverage.coverage_percentage}%)`;
  }
  
  Object.entries(regionData).forEach(([region, data]) => {
    // 온도 분석
    const temperatures = data.temperature;
    const tempInfo = temperatures.length > 0 
      ? `온도 ${(temperatures.reduce((sum, t) => sum + t, 0) / temperatures.length).toFixed(1)}°C (${Math.min(...temperatures).toFixed(1)}°C~${Math.max(...temperatures).toFixed(1)}°C)`
      : '온도 N/A';
    
    // 습도 분석  
    const humidity = data.humidity;
    const humidityInfo = humidity.length > 0
      ? `습도 ${Math.round(humidity.reduce((sum, h) => sum + h, 0) / humidity.length)}%`
      : '습도 N/A';
    
    // 강수량 분석
    const rainfall = data.rainfall;
    const rainfallInfo = rainfall.length > 0
      ? `강수 ${rainfall.reduce((sum, r) => sum + r, 0).toFixed(1)}mm`
      : '강수 N/A';
    
    // 풍속 분석
    const windSpeed = data.wind_speed;
    const windInfo = windSpeed.length > 0
      ? `풍속 ${(windSpeed.reduce((sum, w) => sum + w, 0) / windSpeed.length).toFixed(1)}km/h`
      : '풍속 N/A';
    
    analysis += `- **${region}**: ${tempInfo} | ${humidityInfo} | ${rainfallInfo} | ${windInfo} | ${data.stations.size}개 관측소\n`;
  });
  
  // 전체 관측소 현황 추가
  const totalStations = weatherData.stations_used?.length || 0;
  const dataTypeStats = dataTypes.map(type => {
    const count = weatherData.data?.[type]?.readings?.length || 0;
    return `${type.replace('_', ' ')}: ${count}개`;
  }).join(', ');
  
  analysis += `\n📊 **전체 관측소 현황**: ${totalStations}개 관측소 (${dataTypeStats})\n`;
  
  return analysis || '- 지역별 분석 데이터 처리 중';
}

/**
 * 좌표 기반 지역 분류
 */
function determineRegionFromCoordinates(coordinates) {
  if (!coordinates?.lat || !coordinates?.lng) return 'Unknown';
  
  const { lat, lng } = coordinates;
  
  // 싱가포르 지역 분류 (대략적 경계)
  if (lat > 1.38) return 'North';
  if (lat < 1.28) return 'South';  
  if (lng > 103.87) return 'East';
  if (lng < 103.75) return 'West';
  return 'Central';
}

/**
 * 실시간 기상경보 데이터 가져오기 (NEA 알림 시스템 연동)
 */
async function getWeatherAlertsData() {
  try {
    // NEA 기상경보 API 호출 시뮬레이션 (실제 구현 시 NEA API 연동)
    const response = await fetch('https://api.data.gov.sg/v1/environment/2-hour-weather-forecast');
    if (response.ok) {
      const data = await response.json();
      const alerts = [];
      
      // 예보 데이터에서 경보 상황 추출
      if (data.items && data.items[0]?.forecasts) {
        const forecasts = data.items[0].forecasts;
        
        forecasts.forEach(forecast => {
          const condition = forecast.forecast.toLowerCase();
          if (condition.includes('thundery') || condition.includes('heavy')) {
            alerts.push({
              type: 'warning',
              priority: 'high',
              message: `${forecast.area} 지역 뇌우 또는 폭우 예상`,
              timestamp: data.items[0].timestamp
            });
          } else if (condition.includes('shower')) {
            alerts.push({
              type: 'info',
              priority: 'medium',
              message: `${forecast.area} 지역 소나기 가능성`,
              timestamp: data.items[0].timestamp
            });
          }
        });
      }
      
      return alerts.slice(0, 3); // 최대 3개 경보만 반환
    }
  } catch (error) {
    console.warn('⚠️ Failed to fetch weather alerts:', error.message);
  }
  
  return []; // 경보 없음 또는 실패 시 빈 배열 반환
}

// Load usage tracking
async function loadUsageTracking() {
  const trackingFile = path.join(OUTPUT_DIR, 'usage-tracking.json');
  
  try {
    const data = await fs.readFile(trackingFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    // Initialize tracking if file doesn't exist
    return {
      daily_calls: {},
      total_calls: 0,
      last_reset: new Date().toISOString().split('T')[0]
    };
  }
}

async function saveUsageTracking(tracking) {
  const trackingFile = path.join(OUTPUT_DIR, 'usage-tracking.json');
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  await fs.writeFile(trackingFile, JSON.stringify(tracking, null, 2));
}

async function checkDailyLimit() {
  const tracking = await loadUsageTracking();
  const today = new Date().toISOString().split('T')[0];
  
  // Reset daily counter if it's a new day
  if (tracking.last_reset !== today) {
    tracking.daily_calls = {};
    tracking.last_reset = today;
    await saveUsageTracking(tracking);
  }
  
  const todayCalls = tracking.daily_calls[today] || 0;
  return {
    canMakeCall: todayCalls < MAX_DAILY_CALLS || FORCE_ANALYSIS,
    todayCalls,
    remaining: Math.max(0, MAX_DAILY_CALLS - todayCalls),
    limitReached: todayCalls >= MAX_DAILY_CALLS
  };
}

async function incrementUsageCounter() {
  const tracking = await loadUsageTracking();
  const today = new Date().toISOString().split('T')[0];
  
  tracking.daily_calls[today] = (tracking.daily_calls[today] || 0) + 1;
  tracking.total_calls = (tracking.total_calls || 0) + 1;
  
  await saveUsageTracking(tracking);
}

async function loadWeatherData() {
  try {
    console.log('🌤️ Loading latest weather data...');
    const weatherData = await fs.readFile(WEATHER_DATA_FILE, 'utf8');
    const parsed = JSON.parse(weatherData);
    
    console.log(`✅ Weather data loaded: ${parsed.data?.temperature?.readings?.length || 0} temperature readings`);
    return parsed;
  } catch (error) {
    console.error('❌ Failed to load weather data:', error);
    return null;
  }
}

async function analyzeWeatherWithCohere(weatherData) {
  // Enhanced API key validation
  if (!COHERE_API_KEY || COHERE_API_KEY.trim() === '' || COHERE_API_KEY === 'undefined') {
    console.warn('⚠️ COHERE_API_KEY not set, empty, or undefined - using simulation');
    console.log('💡 Set COHERE_API_KEY environment variable to use real AI analysis');
    console.log(`🔍 Debug - COHERE_API_KEY value: "${COHERE_API_KEY}" (type: ${typeof COHERE_API_KEY})`);
    return generateSimulatedSummary(weatherData);
  }

  try {
    console.log('🤖 Calling Cohere AI API for enhanced weather analysis...');
    console.log(`🔑 API Key Status: SET (length: ${COHERE_API_KEY?.length || 0})`);
    console.log(`🚀 Force Analysis: ${FORCE_ANALYSIS}`);
    
    // Enhanced weather data validation
    if (!weatherData || !weatherData.data) {
      console.error('❌ Invalid weather data structure');
      return generateSimulatedSummary(weatherData);
    }
    
    // Prepare comprehensive weather data for AI analysis
    const tempReadings = weatherData.data?.temperature?.readings || [];
    const humidityReadings = weatherData.data?.humidity?.readings || [];
    const rainfallReadings = weatherData.data?.rainfall?.readings || [];
    const forecast = weatherData.data?.forecast || {};
    
    console.log(`📊 Data summary: ${tempReadings.length} temp, ${humidityReadings.length} humidity, ${rainfallReadings.length} rainfall readings`);
    
    // Calculate detailed statistics
    const avgTemp = tempReadings.length > 0 
      ? tempReadings.reduce((sum, r) => sum + r.value, 0) / tempReadings.length 
      : null;
    const maxTemp = tempReadings.length > 0 
      ? Math.max(...tempReadings.map(r => r.value))
      : null;
    const minTemp = tempReadings.length > 0 
      ? Math.min(...tempReadings.map(r => r.value))
      : null;
    
    const avgHumidity = humidityReadings.length > 0 
      ? humidityReadings.reduce((sum, r) => sum + r.value, 0) / humidityReadings.length 
      : null;
    const maxHumidity = humidityReadings.length > 0 
      ? Math.max(...humidityReadings.map(r => r.value))
      : null;
    
    const totalRainfall = rainfallReadings.length > 0 
      ? rainfallReadings.reduce((sum, r) => sum + r.value, 0) 
      : null;
    const activeRainStations = rainfallReadings.filter(r => r.value > 0).length;
    
    // Get forecast information
    const generalForecast = forecast.general?.forecast || '정보없음';
    const tempRange = forecast.general?.temperature ? 
      `${forecast.general.temperature.low}°C - ${forecast.general.temperature.high}°C` : '정보없음';
    const humidityRange = forecast.general?.relative_humidity ?
      `${forecast.general.relative_humidity.low}% - ${forecast.general.relative_humidity.high}%` : '정보없음';
    const windInfo = forecast.general?.wind ?
      `${forecast.general.wind.direction} ${forecast.general.wind.speed.low}-${forecast.general.wind.speed.high}km/h` : '정보없음';

    // Get weather alerts data for context
    const weatherAlerts = await getWeatherAlertsData();
    const alertContext = weatherAlerts && weatherAlerts.length > 0 
      ? `\n🚨 실시간 기상 경보 상황:\n${weatherAlerts.map(alert => `- ${alert.message}`).join('\n')}`
      : '\n✅ 현재 특별한 기상 경보 없음';

    const prompt = `당신은 싱가포르 최고의 기상 전문가이자 창의적인 날씨 스토리텔러입니다. 아래 실시간 기상 데이터를 바탕으로 가장 풍부하고 흥미진진한 날씨 분석을 창작해주세요. 창의성과 전문성을 최대한 발휘하여 독자들이 몰입할 수 있는 생생하고 매력적인 분석을 제공해주세요:

📊 **현재 실시간 관측 데이터**:
- 평균 기온: ${avgTemp ? avgTemp.toFixed(1) + '°C' : '데이터 없음'} (최고: ${maxTemp ? maxTemp.toFixed(1) + '°C' : 'N/A'}, 최저: ${minTemp ? minTemp.toFixed(1) + '°C' : 'N/A'})
- 평균 습도: ${avgHumidity ? Math.round(avgHumidity) + '%' : '데이터 없음'} (최고: ${maxHumidity ? Math.round(maxHumidity) + '%' : 'N/A'})
- 총 강수량: ${totalRainfall !== null ? totalRainfall.toFixed(1) + 'mm' : '데이터 없음'} (강수 지역: ${activeRainStations}/${rainfallReadings.length}개소)
- 분석 관측소: 온도 ${tempReadings.length}개, 습도 ${humidityReadings.length}개, 강수량 ${rainfallReadings.length}개 (전체 ${weatherData.stations_used?.length || 0}개 관측소)
- 데이터 수집 시간: ${weatherData.timestamp}

🏛️ **지역별 상세 분석 데이터**:
${generateRegionalAnalysis(weatherData)}

🌤️ **NEA 공식 예보 정보**:
- 일반 예보: ${generalForecast}
- 예상 기온 범위: ${tempRange}
- 예상 습도 범위: ${humidityRange}
- 바람: ${windInfo}
${alertContext}

📝 **요청사항**: 다음 8개 섹션으로 상세 분석해주세요:

1. **🌡️ 현재 기온 상황 분석** (2-3문장)
   - 평균/최고/최저 기온의 의미와 지역별 편차 분석
   - 계절적 특성 및 일반적인 싱가포르 기후와의 비교

2. **💧 습도 및 체감온도 분석** (2-3문장)  
   - 습도가 체감온도에 미치는 영향 상세 설명
   - 열지수(Heat Index) 관점에서의 건강 영향 분석

3. **🌧️ 강수 패턴 및 예측** (2-3문장)
   - 현재 강수 분포와 향후 예상 패턴
   - 지역별 강수 차이 및 이동 방향 예측

4. **⛅ 종합 기상 패턴 해석** (2-3문장)
   - NEA 예보와 실시간 데이터의 일치성 분석
   - 현재 기상 상황의 전형성/특이성 평가

5. **🏃‍♀️ 시간대별 활동 권장사항** (3-4개 시간대별)
   - 오전/낮/오후/저녁 각 시간대별 최적 활동 제안
   - 구체적인 운동/레저/업무 활동별 권장도

6. **⚠️ 건강 및 안전 주의사항** (2-3문장)
   - 현재 날씨 조건에서의 건강 리스크
   - 취약 계층(고령자, 어린이, 야외 근로자) 대상 특별 권고

7. **🌟 오늘의 날씨 하이라이트** (3개 핵심 포인트)
   - 오늘 날씨의 가장 중요한 특징 3가지
   - 각 포인트별 구체적인 설명과 영향

8. **🎯 내일 전망 및 준비사항** (2문장)
   - 현재 데이터를 바탕으로 한 내일 날씨 예상
   - 미리 준비하면 좋을 사항들

**💡 창작 가이드라인:**
- 최소 6-8개 문단으로 풍부한 내용 제공 (분량 제한 없음)
- 과학적 정확성과 창의적 표현의 완벽한 균형
- 독자가 마치 현장에 있는 것처럼 느낄 수 있는 생생한 묘사
- 전문가다운 깊이있는 통찰과 일반인도 이해하기 쉬운 설명
- 싱가포르의 문화적, 지리적 특성을 자연스럽게 녹여낸 분석
- 매력적이고 읽기 즐거운 문체로 작성
- 현재 날씨를 생생하게 표현하는 창의적 비유나 은유 자유롭게 사용
- 날씨의 예술적, 철학적 의미까지 포함하여 풍부하게 표현

자유롭게 창의력을 최대한 발휘하여 독자들이 감탄할 만한 최고 품질의 날씨 분석을 작성해주세요! 분량과 표현에 제한을 두지 말고 가장 매력적이고 유익한 내용으로 가득 채워주세요.`;

    const requestBody = {
      model: 'command',
      prompt: prompt,
      max_tokens: 2000, // 대폭 증가 - 풍부한 내용을 위해
      temperature: 0.8, // 높은 창의성과 자유도를 위해
      k: 0,
      p: 0.9, // 다양한 표현을 위한 nucleus sampling
      stop_sequences: [],
      return_likelihoods: 'NONE'
    };

    console.log('📤 Sending request to Cohere API...');
    console.log(`📊 Prompt length: ${prompt.length} characters`);
    
    const response = await fetch('https://api.cohere.ai/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${COHERE_API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Singapore-Weather-Cam/1.0'
      },
      body: JSON.stringify(requestBody)
    });

    console.log(`📥 Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Cohere API Error Response:', errorText);
      throw new Error(`Cohere API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log('✅ Cohere API call successful');
    console.log(`📝 Generated ${result.generations?.length || 0} response(s)`);
    
    const summaryText = result.generations[0]?.text || '';
    console.log(`📄 AI Response Preview: ${summaryText.substring(0, 150)}...`);
    
    if (!summaryText.trim()) {
      console.warn('⚠️ Empty response from Cohere API, falling back to simulation');
      return generateSimulatedSummary(weatherData);
    }
    
    // Parse the enhanced AI response into structured data
    const summary = parseEnhancedAISummary(summaryText, weatherData);
    console.log('✅ Enhanced AI weather summary parsed and structured successfully');
    
    return summary;
    
  } catch (error) {
    console.error('❌ Cohere AI analysis failed:', error);
    return generateSimulatedSummary(weatherData);
  }
}

/**
 * 향상된 AI 분석 응답 파싱 함수
 */
function parseEnhancedAISummary(summaryText, weatherData) {
  const lines = summaryText.split('\n').filter(line => line.trim());
  
  // 섹션별 내용 추출
  const sections = {
    temperature: '',
    humidity: '',
    rainfall: '',
    pattern: '',
    activities: '',
    health: '',
    highlights: [],
    tomorrow: ''
  };
  
  let currentSection = '';
  let summary = '';
  let recommendation = '';
  
  // 섹션별로 내용 파싱
  lines.forEach(line => {
    const trimmed = line.trim();
    
    if (trimmed.includes('🌡️') || trimmed.includes('기온 상황')) {
      currentSection = 'temperature';
    } else if (trimmed.includes('💧') || trimmed.includes('습도') || trimmed.includes('체감온도')) {
      currentSection = 'humidity';
    } else if (trimmed.includes('🌧️') || trimmed.includes('강수')) {
      currentSection = 'rainfall';
    } else if (trimmed.includes('⛅') || trimmed.includes('기상 패턴')) {
      currentSection = 'pattern';
    } else if (trimmed.includes('🏃‍♀️') || trimmed.includes('활동 권장')) {
      currentSection = 'activities';
    } else if (trimmed.includes('⚠️') || trimmed.includes('건강') || trimmed.includes('안전')) {
      currentSection = 'health';
    } else if (trimmed.includes('🌟') || trimmed.includes('하이라이트')) {
      currentSection = 'highlights';
    } else if (trimmed.includes('🎯') || trimmed.includes('내일') || trimmed.includes('전망')) {
      currentSection = 'tomorrow';
    } else if (currentSection && trimmed.length > 10 && !trimmed.match(/^\d+\./)) {
      // 현재 섹션에 내용 추가
      if (currentSection === 'highlights') {
        if (trimmed.includes('-') || trimmed.includes('•')) {
          sections.highlights.push(trimmed.replace(/^[-•]\s*/, '').trim());
        }
      } else {
        sections[currentSection] += (sections[currentSection] ? ' ' : '') + trimmed;
      }
    }
  });
  
  // 전체 요약 생성 (온도 + 습도 섹션 조합)
  summary = [sections.temperature, sections.humidity]
    .filter(s => s.length > 0)
    .join(' ')
    .substring(0, 300) || '싱가포르는 현재 전형적인 열대기후 특성을 보이고 있습니다.';
  
  // 활동 권장사항
  recommendation = sections.activities.substring(0, 200) || 
    sections.tomorrow.substring(0, 200) || 
    '현재 날씨 조건에 맞는 적절한 활동을 선택하여 즐겨보세요.';
  
  // 하이라이트 추출 (최대 5개)
  let highlights = sections.highlights.slice(0, 5);
  
  // 하이라이트가 부족하면 다른 섹션에서 추출
  if (highlights.length < 3) {
    const tempReadings = weatherData.data?.temperature?.readings || [];
    const avgTemp = tempReadings.length > 0 
      ? tempReadings.reduce((sum, r) => sum + r.value, 0) / tempReadings.length 
      : 29;
    const avgHumidity = weatherData.data?.humidity?.readings.length > 0
      ? weatherData.data.humidity.readings.reduce((sum, r) => sum + r.value, 0) / weatherData.data.humidity.readings.length
      : 80;
    
    highlights = [
      `현재 평균 기온 ${avgTemp.toFixed(1)}°C`,
      `습도 ${Math.round(avgHumidity)}% (체감온도 상승)`,
      '열대기후 특성에 따른 높은 습도',
      sections.rainfall.includes('강수') ? '강수 활동 감지' : '건조한 날씨',
      '야외활동 시 수분 보충 필요'
    ].slice(0, 5);
  }
  
  return {
    summary: summary.trim(),
    highlights: highlights.filter(h => h && h.length > 0),
    recommendation: recommendation.trim(),
    confidence: 0.92, // 상세 분석으로 높은 신뢰도
    detailed_analysis: {
      temperature_analysis: sections.temperature,
      humidity_analysis: sections.humidity,
      rainfall_analysis: sections.rainfall,
      pattern_analysis: sections.pattern,
      health_safety: sections.health,
      tomorrow_outlook: sections.tomorrow
    },
    raw_analysis: summaryText
  };
}

function generateSimulatedSummary(weatherData) {
  console.log('🔄 Generating simulated weather summary...');
  
  const tempReadings = weatherData?.data?.temperature?.readings || [];
  const humidityReadings = weatherData?.data?.humidity?.readings || [];
  const rainfallReadings = weatherData?.data?.rainfall?.readings || [];
  
  const avgTemp = tempReadings.length > 0 
    ? tempReadings.reduce((sum, r) => sum + r.value, 0) / tempReadings.length 
    : 29;
  const avgHumidity = humidityReadings.length > 0 
    ? humidityReadings.reduce((sum, r) => sum + r.value, 0) / humidityReadings.length 
    : 80;
  const totalRainfall = rainfallReadings.length > 0 
    ? rainfallReadings.reduce((sum, r) => sum + r.value, 0) 
    : 0;

  let summary = '싱가포르는 현재 ';
  let highlights = [];
  let recommendation = '';

  if (avgTemp >= 32) {
    summary += '매우 더운 날씨를 보이고 있습니다. 높은 기온과 습도로 인해 체감온도가 높습니다.';
    highlights = ['매우 높은 기온', '높은 체감온도', '수분 보충 필요'];
    recommendation = '실내 활동을 권장하며, 외출 시 충분한 수분 섭취와 그늘에서 휴식을 취하세요.';
  } else if (totalRainfall > 5) {
    summary += '비가 내리고 있는 상황입니다. 강수량이 많아 우산이 필요합니다.';
    highlights = ['강수 지속', '높은 습도', '우산 필수'];
    recommendation = '외출 시 우산을 챙기고, 교통 상황을 미리 확인하세요.';
  } else if (avgHumidity >= 85) {
    summary += '높은 습도로 인해 무더운 날씨를 보이고 있습니다. 전형적인 열대기후 특성입니다.';
    highlights = ['높은 습도', '무더운 날씨', '열대기후'];
    recommendation = '통풍이 잘 되는 옷을 입고, 에어컨이 있는 실내에서 활동하세요.';
  } else {
    summary += '비교적 쾌적한 날씨를 보이고 있습니다. 야외 활동하기 좋은 조건입니다.';
    highlights = ['쾌적한 기온', '적절한 습도', '야외활동 적합'];
    recommendation = '산책이나 야외 활동을 즐기기 좋은 날씨입니다.';
  }

  return {
    summary,
    highlights,
    recommendation,
    confidence: 0.75,
    simulation: true
  };
}

async function main() {
  try {
    console.log('🚀 Starting AI weather summary generation...');
    console.log(`🔧 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔑 API Key Status: ${COHERE_API_KEY ? 'SET' : 'NOT_SET'}`);
    console.log(`⚡ Force Analysis: ${FORCE_ANALYSIS}`);
    
    // Check daily API limit
    const limitCheck = await checkDailyLimit();
    console.log(`📊 API Usage: ${limitCheck.todayCalls}/${MAX_DAILY_CALLS} calls today, ${limitCheck.remaining} remaining`);
    
    if (!limitCheck.canMakeCall) {
      console.log('⚠️ Daily API limit reached. Use FORCE_ANALYSIS=true to override.');
      process.exit(0);
    }
    
    // Load weather data
    const weatherData = await loadWeatherData();
    if (!weatherData) {
      console.error('❌ No weather data available for analysis');
      process.exit(1);
    }
    
    // Generate AI summary
    const analysis = await analyzeWeatherWithCohere(weatherData);
    
    // Increment usage counter if real API was used
    if (COHERE_API_KEY && !analysis.simulation) {
      await incrementUsageCounter();
    }
    
    // Prepare enhanced output data
    const outputData = {
      timestamp: new Date().toISOString(),
      source: 'Singapore Weather Cam - Enhanced AI Summary',
      ai_model: analysis.simulation ? 'Simulation' : 'Cohere Command API (Enhanced)',
      analysis_method: analysis.simulation ? 'Rule-based simulation' : 'Comprehensive AI-generated analysis',
      weather_data_timestamp: weatherData.timestamp,
      stations_analyzed: weatherData.stations_used?.length || weatherData.data?.temperature?.readings?.length || 0,
      
      // Enhanced AI Summary Results
      summary: analysis.summary,
      highlights: analysis.highlights,
      recommendation: analysis.recommendation,
      confidence: analysis.confidence,
      
      // Detailed Analysis Sections (새로 추가)
      detailed_analysis: analysis.detailed_analysis || {
        temperature_analysis: '기온 데이터 분석 중...',
        humidity_analysis: '습도 데이터 분석 중...',
        rainfall_analysis: '강수 데이터 분석 중...',
        pattern_analysis: '기상 패턴 분석 중...',
        health_safety: '건강 및 안전 권고사항 생성 중...',
        tomorrow_outlook: '내일 전망 분석 중...'
      },
      
      // Weather Context (새로 추가)
      weather_context: {
        current_temperature: {
          average: weatherData.data?.temperature?.readings?.length > 0 
            ? (weatherData.data.temperature.readings.reduce((sum, r) => sum + r.value, 0) / weatherData.data.temperature.readings.length).toFixed(1)
            : null,
          max: weatherData.data?.temperature?.readings?.length > 0 
            ? Math.max(...weatherData.data.temperature.readings.map(r => r.value)).toFixed(1)
            : null,
          min: weatherData.data?.temperature?.readings?.length > 0 
            ? Math.min(...weatherData.data.temperature.readings.map(r => r.value)).toFixed(1)
            : null
        },
        humidity_levels: {
          average: weatherData.data?.humidity?.readings?.length > 0 
            ? Math.round(weatherData.data.humidity.readings.reduce((sum, r) => sum + r.value, 0) / weatherData.data.humidity.readings.length)
            : null,
          max: weatherData.data?.humidity?.readings?.length > 0 
            ? Math.max(...weatherData.data.humidity.readings.map(r => r.value))
            : null
        },
        rainfall_status: {
          total: weatherData.data?.rainfall?.readings?.length > 0 
            ? weatherData.data.rainfall.readings.reduce((sum, r) => sum + r.value, 0).toFixed(1)
            : null,
          active_stations: weatherData.data?.rainfall?.readings ? 
            weatherData.data.rainfall.readings.filter(r => r.value > 0).length : 0,
          total_stations: weatherData.data?.rainfall?.readings?.length || 0
        },
        forecast_summary: weatherData.data?.forecast?.general?.forecast || 'N/A'
      },
      
      // API Usage Info
      api_calls_today: limitCheck.todayCalls + (analysis.simulation ? 0 : 1),
      api_calls_remaining: limitCheck.remaining - (analysis.simulation ? 0 : 1),
      api_calls_limit: MAX_DAILY_CALLS,
      api_limit_reached: limitCheck.limitReached,
      
      // Raw data for debugging
      raw_analysis: analysis.raw_analysis || null,
      force_analysis_used: FORCE_ANALYSIS,
      
      // Analysis Metadata (새로 추가)
      analysis_version: '2.0',
      enhancement_features: [
        'detailed_sectional_analysis',
        'weather_alerts_integration', 
        'comprehensive_data_context',
        'enhanced_parsing_system'
      ]
    };
    
    // Save results
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(outputData, null, 2));
    
    console.log('✅ AI weather summary generation completed successfully');
    console.log(`📁 Results saved to: ${OUTPUT_FILE}`);
    console.log(`🎯 Summary: ${analysis.summary.substring(0, 100)}...`);
    
  } catch (error) {
    console.error('❌ AI weather summary generation failed:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error('💥 Script execution failed:', error);
  process.exit(1);
});