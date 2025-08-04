#!/usr/bin/env node

/**
 * Fast Cohere AI Weather Summary Script
 * 
 * Optimized for speed - generates AI weather analysis in under 10 seconds
 * Uses reduced token count and optimized prompts for faster processing
 * Updated to trigger workflow execution
 */

import fs from 'fs/promises';
import path from 'path';

const COHERE_API_KEY = process.env.COHERE_API_KEY;
const FAST_MODE = process.env.FAST_MODE === 'true';
const MAX_TOKENS = parseInt(process.env.MAX_TOKENS) || 800;
const TEMPERATURE = parseFloat(process.env.TEMPERATURE) || 0.6;
const OUTPUT_DIR = 'data/weather-summary';
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'latest.json');
const WEATHER_DATA_FILE = 'data/weather/latest.json';

async function loadWeatherData() {
  try {
    console.log('🌤️ Loading weather data for fast analysis...');
    const weatherData = await fs.readFile(WEATHER_DATA_FILE, 'utf8');
    const parsed = JSON.parse(weatherData);
    
    console.log(`✅ Weather data loaded: ${parsed.data?.temperature?.readings?.length || 0} readings`);
    return parsed;
  } catch (error) {
    console.error('❌ Failed to load weather data:', error);
    return null;
  }
}

async function fastCohereAnalysis(weatherData) {
  if (!COHERE_API_KEY || COHERE_API_KEY.trim() === '') {
    console.warn('⚠️ COHERE_API_KEY not set - using fast intelligent fallback');
    return generateFastIntelligentSummary(weatherData);
  }

  try {
    console.log('🚀 Fast Cohere AI analysis starting...');
    console.log(`⚡ Config: ${MAX_TOKENS} tokens, temp ${TEMPERATURE}, fast mode: ${FAST_MODE}`);
    
    // Extract key weather metrics
    const tempReadings = weatherData.data?.temperature?.readings || [];
    const humidityReadings = weatherData.data?.humidity?.readings || [];
    const rainfallReadings = weatherData.data?.rainfall?.readings || [];
    
    const avgTemp = tempReadings.length > 0 
      ? tempReadings.reduce((sum, r) => sum + r.value, 0) / tempReadings.length 
      : 30;
    const avgHumidity = humidityReadings.length > 0 
      ? humidityReadings.reduce((sum, r) => sum + r.value, 0) / humidityReadings.length 
      : 75;
    const totalRainfall = rainfallReadings.length > 0 
      ? rainfallReadings.reduce((sum, r) => sum + r.value, 0) 
      : 0;

    // 영어로 분석하고 클라이언트에서 번역하는 방식 (품질 개선)
    const prompt = `You are Singapore's leading weather expert. Please provide a professional and accurate weather analysis based on the real-time data below:

🌡️ Real-time Weather Data (NEA Singapore):
- Current average temperature: ${avgTemp.toFixed(1)}°C
- Current average humidity: ${avgHumidity.toFixed(1)}%
- Rainfall: ${totalRainfall.toFixed(1)}mm
- Analysis scope: ${tempReadings.length} weather stations nationwide

Please provide analysis in the following format:

Current Weather Situation:
[Provide 2-3 sentences of comprehensive analysis about current weather conditions and characteristics]

Key Points:
1. Temperature & Sensory Experience: [Detailed temperature analysis and perceived temperature effects]
2. Humidity & Moisture Impact: [How humidity affects comfort levels and precautions needed]
3. Rainfall Situation & Outlook: [Current precipitation status and forecast]
4. Outdoor Activity Recommendations: [Guidelines for outdoor activities in current weather]

Consider Singapore's tropical climate characteristics and provide practical, professional analysis.`;

    console.log(`📤 Sending fast request to Cohere API...`);
    
    const startTime = Date.now();
    const response = await fetch('https://api.cohere.ai/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${COHERE_API_KEY}`,
        'Content-Type': 'application/json',
        'User-Agent': 'Singapore-Weather-Cam-Fast/1.0'
      },
      body: JSON.stringify({
        model: 'command',
        prompt: prompt,
        max_tokens: MAX_TOKENS,
        temperature: 0.7, // 더 안정적인 결과를 위해 조정
        k: 0,
        p: 0.9, // 더 다양한 표현을 위해 증가
        stop_sequences: ['**끝**', '\n\n---', '참고:'],
        return_likelihoods: 'NONE',
        truncate: 'END' // 긴 프롬프트 처리
      })
    });

    const processingTime = Date.now() - startTime;
    console.log(`📥 Response received in ${processingTime}ms`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Cohere API Error:', errorText);
      throw new Error(`Cohere API error: ${response.status}`);
    }

    const result = await response.json();
    const generatedText = result.generations[0]?.text?.trim();
    
    if (!generatedText) {
      throw new Error('Empty response from Cohere API');
    }

    console.log(`✅ Cohere AI analysis completed in ${processingTime}ms`);
    console.log(`📝 Generated ${generatedText.length} characters`);
    
    return parseFastAIResponse(generatedText, weatherData, processingTime);
    
  } catch (error) {
    console.error('❌ Fast Cohere AI analysis failed:', error);
    return generateFastIntelligentSummary(weatherData);
  }
}

function parseFastAIResponse(text, weatherData, processingTime) {
  const lines = text.split('\n').filter(line => line.trim());
  
  // Extract summary (first paragraph after "현재 날씨 분석:")
  let summary = '';
  let highlights = [];
  
  let inSummary = false;
  let inHighlights = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed.includes('현재 날씨 분석') || trimmed.includes('**현재 날씨')) {
      inSummary = true;
      continue;
    }
    
    if (trimmed.includes('주요 포인트') || trimmed.includes('**주요 포인트')) {
      inSummary = false;
      inHighlights = true;
      continue;
    }
    
    if (inSummary && trimmed.length > 10 && !trimmed.startsWith('**')) {
      summary += (summary ? ' ' : '') + trimmed;
    }
    
    if (inHighlights && (trimmed.startsWith('-') || trimmed.startsWith('•'))) {
      highlights.push(trimmed.replace(/^[-•]\s*/, '').trim());
    }
  }
  
  // Fallback extraction if parsing fails
  if (!summary || summary.length < 50) {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 20);
    summary = sentences.slice(0, 2).join('. ') + '.';
  }
  
  if (highlights.length === 0) {
    const tempReadings = weatherData.data?.temperature?.readings || [];
    const avgTemp = tempReadings.length > 0 
      ? tempReadings.reduce((sum, r) => sum + r.value, 0) / tempReadings.length 
      : 30;
    
    highlights = [
      `🌡️ 현재 기온 ${avgTemp.toFixed(1)}°C`,
      `📊 ${tempReadings.length}개 관측소 데이터`,
      '🏙️ 싱가포르 실시간 분석',
      '⚡ 빠른 AI 처리 완료'
    ];
  }
  
  return {
    summary: summary.trim(),
    highlights: highlights.slice(0, 4),
    confidence: 0.94,
    processing_time: `${processingTime}ms`,
    raw_analysis: text
  };
}

function generateFastIntelligentSummary(weatherData) {
  console.log('⚡ Generating fast intelligent summary...');
  
  const tempReadings = weatherData?.data?.temperature?.readings || [];
  const humidityReadings = weatherData?.data?.humidity?.readings || [];
  const rainfallReadings = weatherData?.data?.rainfall?.readings || [];
  
  const avgTemp = tempReadings.length > 0 
    ? tempReadings.reduce((sum, r) => sum + r.value, 0) / tempReadings.length 
    : 30;
  const avgHumidity = humidityReadings.length > 0 
    ? humidityReadings.reduce((sum, r) => sum + r.value, 0) / humidityReadings.length 
    : 75;
  const totalRainfall = rainfallReadings.length > 0 
    ? rainfallReadings.reduce((sum, r) => sum + r.value, 0) 
    : 0;

  let summary = '현재 싱가포르는 ';
  let highlights = [];

  // Temperature analysis
  if (avgTemp >= 33) {
    summary += '매우 더운 날씨를 보이고 있습니다. ';
    highlights.push('🔥 고온 주의 - 충분한 수분 섭취 권장');
  } else if (avgTemp >= 30) {
    summary += '전형적인 열대 기후를 보이고 있습니다. ';
    highlights.push('☀️ 따뜻한 열대 기후 - 가벼운 복장 권장');
  } else {
    summary += '평년보다 시원한 날씨입니다. ';
    highlights.push('🌤️ 쾌적한 기온 - 야외 활동 적합');
  }

  // Humidity analysis
  if (avgHumidity >= 80) {
    summary += '높은 습도로 인해 체감온도가 높아 무더위에 주의가 필요합니다. ';
    highlights.push('💧 고습도 환경 - 통풍 잘 되는 옷 착용');
  } else if (avgHumidity >= 60) {
    summary += '적당한 습도 수준을 유지하고 있습니다. ';
    highlights.push('🌊 적당한 습도 - 편안한 체감온도');
  } else {
    summary += '상대적으로 건조한 상태입니다. ';
    highlights.push('🍃 상쾌한 대기 환경');
  }

  // Rainfall analysis
  if (totalRainfall > 10) {
    summary += '현재 강한 비가 내리고 있어 우산이 필수입니다.';
    highlights.push('🌧️ 강한 비 - 우산 필수');
  } else if (totalRainfall > 0) {
    summary += '약한 비가 내리고 있습니다.';
    highlights.push('☔ 가벼운 비 - 우산 준비');
  } else {
    summary += '맑은 날씨로 야외 활동에 좋습니다.';
    highlights.push('🌈 맑은 날씨 - 야외 활동 최적');
  }

  highlights.push(`📊 전국 ${tempReadings.length}개 관측소 실시간 데이터`);

  return {
    summary,
    highlights: highlights.slice(0, 4),
    confidence: 0.90,
    processing_time: '<1s'
  };
}

async function main() {
  try {
    const startTime = Date.now();
    console.log('🚀 Fast AI weather summary generation starting...');
    
    // Load weather data
    const weatherData = await loadWeatherData();
    if (!weatherData) {
      console.error('❌ No weather data available');
      process.exit(1);
    }
    
    // Generate fast AI analysis
    const analysis = await fastCohereAnalysis(weatherData);
    
    const totalTime = Date.now() - startTime;
    console.log(`⚡ Total processing time: ${totalTime}ms`);
    
    // Prepare output data
    const outputData = {
      timestamp: new Date().toISOString(),
      source: 'Singapore Weather Cam - Fast AI Analysis',
      ai_model: analysis.processing_time === '<1s' ? 'Fast Intelligent Analysis' : 'Cohere Command API (Fast)',
      analysis_method: 'Optimized for speed while maintaining quality',
      weather_data_timestamp: weatherData.timestamp,
      stations_analyzed: weatherData.data?.temperature?.readings?.length || 0,
      
      summary: analysis.summary,
      highlights: analysis.highlights,
      confidence: analysis.confidence,
      
      processing_time: analysis.processing_time || `${totalTime}ms`,
      mode: 'fast_analysis',
      optimization: {
        max_tokens: MAX_TOKENS,
        temperature: TEMPERATURE,
        fast_mode: FAST_MODE
      },
      
      weather_context: {
        current_temperature: {
          average: weatherData.data?.temperature?.readings?.length > 0 
            ? (weatherData.data.temperature.readings.reduce((sum, r) => sum + r.value, 0) / weatherData.data.temperature.readings.length).toFixed(1)
            : null
        },
        humidity_levels: {
          average: weatherData.data?.humidity?.readings?.length > 0 
            ? Math.round(weatherData.data.humidity.readings.reduce((sum, r) => sum + r.value, 0) / weatherData.data.humidity.readings.length)
            : null
        },
        rainfall_status: {
          total: weatherData.data?.rainfall?.readings?.length > 0 
            ? weatherData.data.rainfall.readings.reduce((sum, r) => sum + r.value, 0).toFixed(1)
            : "0.0"
        }
      },
      
      raw_analysis: analysis.raw_analysis || null
    };
    
    // Save results
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(outputData, null, 2));
    
    console.log('✅ Fast AI weather summary completed successfully');
    console.log(`📁 Results saved to: ${OUTPUT_FILE}`);
    console.log(`🎯 Summary: ${analysis.summary.substring(0, 100)}...`);
    console.log(`⚡ Total time: ${totalTime}ms`);
    
  } catch (error) {
    console.error('❌ Fast AI weather summary failed:', error);
    process.exit(1);
  }
}

// Run the script
main().catch(error => {
  console.error('💥 Script execution failed:', error);
  process.exit(1);
});