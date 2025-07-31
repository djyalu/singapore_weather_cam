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
const MAX_DAILY_CALLS = 20;
const OUTPUT_DIR = 'data/weather-summary';
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'latest.json');
const WEATHER_DATA_FILE = 'data/weather/latest.json';

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
  if (!COHERE_API_KEY || COHERE_API_KEY.trim() === '') {
    console.warn('⚠️ COHERE_API_KEY not set or empty, using simulation');
    console.log('💡 Set COHERE_API_KEY environment variable to use real AI analysis');
    return generateSimulatedSummary(weatherData);
  }

  try {
    console.log('🤖 Calling Cohere AI API for weather analysis...');
    console.log(`🔑 API Key Status: ${COHERE_API_KEY ? 'SET' : 'NOT_SET'} (length: ${COHERE_API_KEY?.length || 0})`);
    console.log(`🚀 Force Analysis: ${FORCE_ANALYSIS}`);
    
    // Prepare weather data summary for AI
    const tempReadings = weatherData.data?.temperature?.readings || [];
    const humidityReadings = weatherData.data?.humidity?.readings || [];
    const rainfallReadings = weatherData.data?.rainfall?.readings || [];
    
    const avgTemp = tempReadings.length > 0 
      ? tempReadings.reduce((sum, r) => sum + r.value, 0) / tempReadings.length 
      : null;
    const avgHumidity = humidityReadings.length > 0 
      ? humidityReadings.reduce((sum, r) => sum + r.value, 0) / humidityReadings.length 
      : null;
    const totalRainfall = rainfallReadings.length > 0 
      ? rainfallReadings.reduce((sum, r) => sum + r.value, 0) 
      : null;

    const prompt = `다음 싱가포르 실시간 날씨 데이터를 분석하여 종합적인 날씨 요약을 한국어로 작성해주세요:

📊 현재 날씨 데이터:
- 평균 기온: ${avgTemp ? avgTemp.toFixed(1) + '°C' : '데이터 없음'}
- 평균 습도: ${avgHumidity ? Math.round(avgHumidity) + '%' : '데이터 없음'}
- 총 강수량: ${totalRainfall !== null ? totalRainfall.toFixed(1) + 'mm' : '데이터 없음'}
- 관측소 수: ${tempReadings.length}개
- 수집 시간: ${weatherData.timestamp}

다음 형식으로 응답해주세요:
1. 전체적인 날씨 상황 (2-3문장으로 요약)
2. 주요 특징 3가지 (짧은 키워드로)
3. 오늘 활동 추천사항 (1문장)

응답은 자연스럽고 정보적이며 도움이 되도록 작성해주세요.`;

    const requestBody = {
      model: 'command',
      prompt: prompt,
      max_tokens: 300,
      temperature: 0.4,
      k: 0,
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
    
    // Parse the AI response into structured data
    const summary = parseAISummary(summaryText, weatherData);
    console.log('✅ AI weather summary parsed and structured successfully');
    
    return summary;
    
  } catch (error) {
    console.error('❌ Cohere AI analysis failed:', error);
    return generateSimulatedSummary(weatherData);
  }
}

function parseAISummary(summaryText, weatherData) {
  // Simple parsing of AI response
  const lines = summaryText.split('\n').filter(line => line.trim());
  
  let summary = '';
  let highlights = [];
  let recommendation = '';
  
  // Extract main summary (usually first few lines)
  const summaryLines = lines.filter(line => 
    !line.includes('1.') && 
    !line.includes('2.') && 
    !line.includes('3.') &&
    line.length > 20
  );
  summary = summaryLines.slice(0, 2).join(' ').trim();
  
  // Extract highlights (look for numbered items or bullet points)
  const highlightLines = lines.filter(line => 
    line.includes('•') || 
    line.match(/^\d\./) ||
    (line.length < 50 && line.length > 5)
  );
  highlights = highlightLines.slice(0, 3).map(line => 
    line.replace(/^\d\.\s*/, '').replace(/^•\s*/, '').trim()
  ).filter(h => h.length > 0);
  
  // Extract recommendation (usually last meaningful line)
  const recommendationLines = lines.filter(line => 
    line.includes('추천') || 
    line.includes('활동') ||
    line.includes('권장')
  );
  recommendation = recommendationLines[0]?.trim() || '현재 날씨에 적합한 활동을 즐겨보세요.';
  
  // Fallbacks
  if (!summary) {
    summary = '싱가포르는 현재 열대기후 특성을 보이고 있습니다. 높은 습도와 따뜻한 기온이 유지되고 있습니다.';
  }
  
  if (highlights.length === 0) {
    const tempReadings = weatherData.data?.temperature?.readings || [];
    const avgTemp = tempReadings.length > 0 
      ? tempReadings.reduce((sum, r) => sum + r.value, 0) / tempReadings.length 
      : 29;
    
    highlights = [
      `평균 기온 ${avgTemp.toFixed(1)}°C`,
      '열대 기후 특성',
      '높은 습도'
    ];
  }
  
  return {
    summary,
    highlights,
    recommendation,
    confidence: 0.85,
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
    
    // Prepare output data
    const outputData = {
      timestamp: new Date().toISOString(),
      source: 'Singapore Weather Cam - AI Summary',
      ai_model: analysis.simulation ? 'Simulation' : 'Cohere Command API',
      analysis_method: analysis.simulation ? 'Rule-based simulation' : 'AI-generated summary',
      weather_data_timestamp: weatherData.timestamp,
      stations_analyzed: weatherData.data?.temperature?.readings?.length || 0,
      
      // AI Summary Results
      summary: analysis.summary,
      highlights: analysis.highlights,
      recommendation: analysis.recommendation,
      confidence: analysis.confidence,
      
      // API Usage Info
      api_calls_today: limitCheck.todayCalls + (analysis.simulation ? 0 : 1),
      api_calls_remaining: limitCheck.remaining - (analysis.simulation ? 0 : 1),
      api_calls_limit: MAX_DAILY_CALLS,
      api_limit_reached: limitCheck.limitReached,
      
      // Raw data for debugging
      raw_analysis: analysis.raw_analysis || null,
      force_analysis_used: FORCE_ANALYSIS
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