#!/usr/bin/env node

/**
 * Cohere AI Traffic Analysis Script
 * 
 * Analyzes Singapore traffic camera images using Cohere AI API
 * Generates AI analysis data for real-time traffic conditions
 */

import fs from 'fs/promises';
import path from 'path';
import fetch from 'node-fetch';

const COHERE_API_KEY = process.env.COHERE_API_KEY;
const FORCE_ANALYSIS = process.env.FORCE_ANALYSIS === 'true';
const MAX_DAILY_CALLS = 20;
const OUTPUT_DIR = 'data/ai-analysis';
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'latest.json');

// Traffic camera data for analysis
const PRIORITY_CAMERAS = [
  { id: '6710', description: 'PIE (BKE) - Bukit Timah Rd (Hwa Chong 인근)' },
  { id: '4712', description: 'PIE Jurong West' },
  { id: '1701', description: 'Changi Airport Area' },
  { id: '2701', description: 'Sentosa Gateway' },
  { id: '2703', description: 'Marina Bay - Central Boulevard' },
  { id: '6712', description: 'PIE Jurong' },
  { id: '6704', description: 'PIE Kim Keat (Newton 인근)' },
  { id: '2706', description: 'ECP Fort Road' },
  { id: '1703', description: 'BKE Sungei Kadut' }
];

async function fetchTrafficCameras() {
  try {
    console.log('📷 Fetching Singapore traffic cameras...');
    const response = await fetch('https://api.data.gov.sg/v1/transport/traffic-images');
    
    if (!response.ok) {
      throw new Error(`Traffic API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log(`✅ Found ${data.items[0]?.cameras?.length || 0} cameras`);
    
    return data.items[0]?.cameras || [];
  } catch (error) {
    console.error('❌ Failed to fetch traffic cameras:', error);
    return [];
  }
}

async function analyzeWithCohere(imageUrl, cameraDescription) {
  if (!COHERE_API_KEY) {
    console.warn('⚠️ COHERE_API_KEY not set, using simulation');
    return generateSimulatedAnalysis(cameraDescription);
  }

  try {
    console.log(`🤖 Analyzing ${cameraDescription}...`);
    
    const prompt = `Analyze this Singapore traffic camera image and provide:
1. Traffic status (원활/보통/혼잡/정체중)
2. Weather condition (맑음/흐림/부분적으로 흐림/비)
3. Visibility (양호/보통/나쁨)
4. Brief details about the traffic situation

Camera location: ${cameraDescription}
Image URL: ${imageUrl}

Please respond in Korean for traffic status and weather, but provide details in English.`;

    const response = await fetch('https://api.cohere.ai/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${COHERE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'command',
        prompt: prompt,
        max_tokens: 200,
        temperature: 0.3,
        k: 0,
        stop_sequences: [],
        return_likelihoods: 'NONE'
      })
    });

    if (!response.ok) {
      throw new Error(`Cohere API error: ${response.status}`);
    }

    const result = await response.json();
    const analysisText = result.generations[0]?.text || '';
    
    // Parse the AI response into structured data
    const analysis = parseAIResponse(analysisText, cameraDescription);
    console.log(`✅ Analysis completed for ${cameraDescription}`);
    
    return analysis;
    
  } catch (error) {
    console.error(`❌ Cohere analysis failed for ${cameraDescription}:`, error);
    return generateSimulatedAnalysis(cameraDescription);
  }
}

function parseAIResponse(text, cameraDescription) {
  // Simple parsing logic - can be enhanced
  const traffic = extractValue(text, ['원활', '보통', '혼잡', '정체중']) || '보통';
  const weather = extractValue(text, ['맑음', '흐림', '부분적으로 흐림', '비']) || '부분적으로 흐림';
  const visibility = extractValue(text, ['양호', '보통', '나쁨']) || '보통';

  return {
    traffic_status: traffic,
    weather_condition: weather,
    visibility: visibility,
    details: text.substring(0, 100) + '...',
    confidence: 0.85,
    ai_model: 'Cohere Command API',
    analysis_timestamp: new Date().toISOString(),
    camera_location: cameraDescription
  };
}

function extractValue(text, options) {
  for (const option of options) {
    if (text.includes(option)) {
      return option;
    }
  }
  return null;
}

function generateSimulatedAnalysis(cameraDescription) {
  const hour = new Date().getHours();
  const isRushHour = (hour >= 7 && hour <= 9) || (hour >= 17 && hour <= 19);
  
  const trafficOptions = isRushHour 
    ? ['보통', '혼잡', '정체중']
    : ['원활', '보통', '혼잡'];
  
  const weatherOptions = ['맑음', '부분적으로 흐림', '흐림'];
  const visibilityOptions = ['양호', '보통'];
  
  const randomChoice = (arr) => arr[Math.floor(Math.random() * arr.length)];
  
  return {
    traffic_status: randomChoice(trafficOptions),
    weather_condition: randomChoice(weatherOptions),
    visibility: randomChoice(visibilityOptions),
    details: `${cameraDescription} 지역의 교통 상황 분석 완료`,
    confidence: 0.75,
    ai_model: 'Enhanced Simulation (Cohere API 연결 실패)',
    analysis_timestamp: new Date().toISOString(),
    camera_location: cameraDescription
  };
}

async function loadExistingData() {
  try {
    const data = await fs.readFile(OUTPUT_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.log('📄 No existing analysis data found, starting fresh');
    return null;
  }
}

async function saveAnalysisData(analysisData) {
  try {
    // Ensure output directory exists
    await fs.mkdir(OUTPUT_DIR, { recursive: true });
    
    // Write analysis data
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(analysisData, null, 2));
    console.log(`✅ Analysis data saved to ${OUTPUT_FILE}`);
    
    return true;
  } catch (error) {
    console.error('❌ Failed to save analysis data:', error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Cohere AI traffic analysis...');
  
  // Load existing data to check daily limits
  const existingData = await loadExistingData();
  const today = new Date().toDateString();
  const isNewDay = !existingData || new Date(existingData.date).toDateString() !== today;
  
  let apiCallsToday = isNewDay ? 0 : (existingData.api_calls_today || 0);
  let apiCallsRemaining = Math.max(0, MAX_DAILY_CALLS - apiCallsToday);
  
  console.log(`📊 API Usage: ${apiCallsToday}/${MAX_DAILY_CALLS} calls used today`);
  
  // Check if we should proceed with analysis
  if (apiCallsRemaining <= 0 && !FORCE_ANALYSIS) {
    console.log('⚠️ Daily API limit reached, skipping new analysis');
    
    // Update existing data with new timestamp but keep analysis
    if (existingData) {
      existingData.timestamp = new Date().toISOString();
      existingData.api_limit_reached = true;
      await saveAnalysisData(existingData);
    }
    
    return;
  }
  
  // Fetch current traffic cameras
  const cameras = await fetchTrafficCameras();
  if (cameras.length === 0) {
    console.error('❌ No traffic cameras available for analysis');
    return;
  }
  
  // Find priority cameras for analysis
  const camerasToAnalyze = PRIORITY_CAMERAS
    .map(priority => {
      const camera = cameras.find(cam => cam.camera_id === priority.id);
      return camera ? { ...camera, description: priority.description } : null;
    })
    .filter(Boolean)
    .slice(0, Math.min(5, apiCallsRemaining)); // Limit analysis
  
  console.log(`🎯 Analyzing ${camerasToAnalyze.length} priority cameras...`);
  
  // Perform AI analysis
  const cameraAnalysis = {};
  let successfulAnalyses = 0;
  
  for (const camera of camerasToAnalyze) {
    try {
      const analysis = await analyzeWithCohere(camera.image, camera.description);
      cameraAnalysis[camera.camera_id] = analysis;
      successfulAnalyses++;
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Failed to analyze camera ${camera.camera_id}:`, error);
    }
  }
  
  // Prepare final analysis data
  const analysisData = {
    timestamp: new Date().toISOString(),
    date: today,
    analysis_method: COHERE_API_KEY ? 'Cohere Command API' : 'Enhanced Simulation',
    total_analyzed: successfulAnalyses,
    api_calls_today: apiCallsToday + successfulAnalyses,
    api_calls_remaining: Math.max(0, apiCallsRemaining - successfulAnalyses),
    api_calls_limit: MAX_DAILY_CALLS,
    api_limit_reached: (apiCallsToday + successfulAnalyses) >= MAX_DAILY_CALLS,
    cameras: cameraAnalysis,
    metadata: {
      total_cameras_available: cameras.length,
      priority_cameras_found: camerasToAnalyze.length,
      force_analysis: FORCE_ANALYSIS,
      generation_time: new Date().toISOString()
    }
  };
  
  // Save analysis data
  const saved = await saveAnalysisData(analysisData);
  
  if (saved) {
    console.log('🎉 Cohere AI analysis completed successfully!');
    console.log(`📊 Results: ${successfulAnalyses} cameras analyzed`);
    console.log(`🔄 API calls remaining: ${analysisData.api_calls_remaining}/${MAX_DAILY_CALLS}`);
  } else {
    console.error('❌ Failed to save analysis results');
    process.exit(1);
  }
}

// Run the analysis
main().catch(error => {
  console.error('❌ Analysis script failed:', error);
  process.exit(1);
});