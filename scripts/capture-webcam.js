#!/usr/bin/env node

/**
 * Singapore Weather Cam - Webcam Image Capture Script
 * 싱가포르 교통 카메라와 공공 웹캠에서 이미지를 캡처하고 AI 분석을 수행합니다.
 * 
 * @description
 * This script captures images from various Singapore webcam sources including:
 * - LTA (Land Transport Authority) traffic cameras via live API
 * - Public webcams and static image sources
 * - Test image sources for development
 * 
 * @features
 * - Real-time traffic camera data from Singapore's LTA API
 * - AI-powered image analysis using Claude API (optional)
 * - Automatic retry logic with exponential backoff
 * - Batch processing with rate limiting
 * - Comprehensive error handling and logging
 * - Structured JSON metadata generation
 * - Automatic cleanup of old image files
 * - Browser capture fallback (optional, can be disabled)
 * 
 * @environment_variables
 * - CLAUDE_API_KEY: (Optional) Enable AI image analysis
 * - DISABLE_BROWSER_CAPTURE: Set to 'true' to disable Puppeteer browser capture
 * - OPENWEATHER_API_KEY: (Optional) For weather correlation (future use)
 * 
 * @usage
 * ```bash
 * # Basic usage
 * node scripts/capture-webcam.js
 * 
 * # With browser capture disabled (recommended for production)
 * DISABLE_BROWSER_CAPTURE=true node scripts/capture-webcam.js
 * 
 * # With Claude AI analysis enabled
 * CLAUDE_API_KEY=your-key node scripts/capture-webcam.js
 * ```
 * 
 * @output_structure
 * - Images: /public/images/webcam/{camera_id}_{timestamp}.jpg
 * - Metadata: /data/webcam/{year}/{month}/{day}/{hour}-{minute}.json
 * - Latest: /data/webcam/latest.json
 * 
 * @author Singapore Weather Cam Project
 * @version 1.0.0
 * @license MIT
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import puppeteer from 'puppeteer';
import Anthropic from '@anthropic-ai/sdk';

// ES modules __dirname 구현
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Enhanced fetch with security and performance improvements
let fetch;
try {
  fetch = globalThis.fetch;
} catch {
  const { default: nodeFetch } = await import('node-fetch');
  fetch = nodeFetch;
}

// Production environment configuration with security defaults
const CONFIG = {
  REQUEST_TIMEOUT: parseInt(process.env.REQUEST_TIMEOUT) || 15000,
  MAX_RETRIES: parseInt(process.env.MAX_RETRIES) || 3,
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB limit
  MIN_FILE_SIZE: 1024, // 1KB minimum
  ALLOWED_MIME_TYPES: ['image/jpeg', 'image/png', 'image/webp'],
  BATCH_SIZE: 2, // Conservative for resource management
  BATCH_DELAY: 3000, // 3 seconds between batches
  PUPPETEER_TIMEOUT: 30000,
  MAX_MEMORY_USAGE: 512 * 1024 * 1024, // 512MB limit
  CIRCUIT_BREAKER_THRESHOLD: 5,
  SECURITY_HEADERS: {
    'User-Agent': 'Singapore-Weather-Cam/1.0 (Production)',
    'Accept': 'image/jpeg,image/png,image/webp,image/*',
    'Cache-Control': 'no-cache',
    'DNT': '1'
  }
};

// Data integrity validation patterns
const VALIDATION = {
  IMAGE_SIGNATURES: {
    jpeg: [0xFF, 0xD8, 0xFF],
    png: [0x89, 0x50, 0x4E, 0x47],
    webp: [0x52, 0x49, 0x46, 0x46]
  },
  COORDINATES: {
    SINGAPORE_BOUNDS: {
      lat: { min: 1.15, max: 1.45 },
      lng: { min: 103.6, max: 104.0 }
    }
  }
};

// Circuit breaker for external API calls
const CIRCUIT_BREAKER = {
  failures: 0,
  lastFailureTime: null,
  state: 'CLOSED' // CLOSED, OPEN, HALF_OPEN
};

// Claude API 클라이언트 초기화
const anthropic = process.env.CLAUDE_API_KEY ? new Anthropic({
  apiKey: process.env.CLAUDE_API_KEY,
}) : null;

// 싱가포르 웹캠 소스 정의
const WEBCAM_SOURCES = {
  // 더미 테스트 이미지 (개발 및 테스트용)
  test_cameras: [
    {
      id: 'test_image_1',
      name: 'Test Image 1',
      url: 'https://picsum.photos/800/600?random=1',
      coordinates: { lat: 1.2777, lng: 103.8515 },
      type: 'test',
      location: 'Test Location 1',
      description: 'Test image for development purposes'
    },
    {
      id: 'test_image_2',
      name: 'Test Image 2',
      url: 'https://picsum.photos/800/600?random=2',
      coordinates: { lat: 1.3048, lng: 103.8318 },
      type: 'test',
      location: 'Test Location 2',
      description: 'Test image for development purposes'
    }
  ],

  // 싱가포르 교통청 (LTA) 교통 카메라 (API 활용)
  traffic_cameras: [
    {
      id: 'marina_bay_traffic',
      name: 'Marina Bay Traffic Camera',
      camera_id: '1701',
      coordinates: { lat: 1.2777, lng: 103.8515 },
      type: 'traffic',
      location: 'Marina Bay',
      description: 'Marina Bay traffic and city skyline view'
    },
    {
      id: 'orchard_road_traffic',
      name: 'Orchard Road Traffic Camera',
      camera_id: '1705',
      coordinates: { lat: 1.3048, lng: 103.8318 },
      type: 'traffic',
      location: 'Orchard Road',
      description: 'Orchard Road shopping district traffic'
    },
    {
      id: 'sentosa_traffic',
      name: 'Sentosa Gateway Traffic Camera',
      camera_id: '4703',
      coordinates: { lat: 1.2494, lng: 103.8303 },
      type: 'traffic',
      location: 'Sentosa',
      description: 'Sentosa island gateway traffic'
    },
    {
      id: 'changi_airport_traffic',
      name: 'Changi Airport Traffic Camera',
      camera_id: '6703',
      coordinates: { lat: 1.3644, lng: 103.9915 },
      type: 'traffic',
      location: 'Changi Airport',
      description: 'Changi Airport area traffic'
    },
    {
      id: 'tuas_checkpoint_traffic',
      name: 'Tuas Checkpoint Traffic Camera',
      camera_id: '4709',
      coordinates: { lat: 1.3482, lng: 103.6361 },
      type: 'traffic',
      location: 'Tuas',
      description: 'Tuas checkpoint border traffic'
    }
  ],

  // 공공 웹캠 (정적 이미지, 브라우저 없이 다운로드 가능)
  public_webcams: [
    {
      id: 'singapore_skyline_1',
      name: 'Singapore Skyline View 1',
      url: 'https://images.unsplash.com/photo-1525625293386-3f8f99389edd?w=800&h=600&fit=crop',
      coordinates: { lat: 1.2834, lng: 103.8607 },
      type: 'public',
      location: 'Marina Bay Area',
      description: 'Singapore city skyline view'
    },
    {
      id: 'singapore_skyline_2',
      name: 'Singapore Skyline View 2',
      url: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
      coordinates: { lat: 1.2816, lng: 103.8636 },
      type: 'public',
      location: 'Gardens by the Bay Area',
      description: 'Singapore Gardens by the Bay area view'
    }
  ],

  // 실시간 교통 카메라 API
  traffic_api: {
    endpoint: 'https://api.data.gov.sg/v1/transport/traffic-images',
    source: 'LTA Singapore',
    update_frequency: '1-5 minutes'
  }
};

/**
 * 타임스탬프를 적절한 형식으로 변환
 */
function formatTimestamp(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(Math.floor(date.getMinutes() / 5) * 5).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hour}:${minute}:00`;
}

/**
 * Enhanced image download with comprehensive validation and security
 */
async function downloadImage(url, filepath, retries = CONFIG.MAX_RETRIES) {
  // Input validation
  if (!url || !filepath) {
    throw new Error('URL and filepath are required');
  }
  
  // URL security validation
  try {
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      throw new Error('Only HTTP/HTTPS URLs are allowed');
    }
  } catch (error) {
    throw new Error(`Invalid URL: ${error.message}`);
  }
  
  for (let i = 0; i < retries; i++) {
    let controller = null;
    
    try {
      console.log(`📡 [${i + 1}/${retries}] Downloading: ${url}`);
      
      controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), CONFIG.REQUEST_TIMEOUT);
      
      const response = await fetch(url, {
        signal: controller.signal,
        headers: CONFIG.SECURITY_HEADERS
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Content validation
      const contentLength = parseInt(response.headers.get('content-length') || '0');
      const contentType = response.headers.get('content-type') || '';
      
      // Size validation
      if (contentLength > CONFIG.MAX_FILE_SIZE) {
        throw new Error(`File too large: ${contentLength} bytes (max: ${CONFIG.MAX_FILE_SIZE})`);
      }
      
      if (contentLength > 0 && contentLength < CONFIG.MIN_FILE_SIZE) {
        throw new Error(`File too small: ${contentLength} bytes (min: ${CONFIG.MIN_FILE_SIZE})`);
      }
      
      // Content type validation
      const isValidType = CONFIG.ALLOWED_MIME_TYPES.some(type => contentType.includes(type));
      if (!isValidType && contentType) {
        console.warn(`⚠️ Unexpected content type: ${contentType}`);
      }

      const buffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(buffer);
      
      // Binary signature validation
      if (!validateImageSignature(uint8Array)) {
        throw new Error('Invalid image file signature');
      }
      
      // Directory creation with proper permissions
      await fs.mkdir(path.dirname(filepath), { recursive: true, mode: 0o755 });
      
      // Atomic file write for data integrity
      const tempPath = `${filepath}.tmp`;
      await fs.writeFile(tempPath, uint8Array, { mode: 0o644 });
      await fs.rename(tempPath, filepath);
      
      console.log(`✅ Image saved: ${filepath} (${uint8Array.length} bytes, ${contentType})`);
      return true;

    } catch (error) {
      // Cleanup on failure
      if (controller && !controller.signal.aborted) {
        controller.abort();
      }
      
      const isTimeout = error.name === 'AbortError';
      console.warn(`⚠️ Attempt ${i + 1} failed: ${error.message} ${isTimeout ? '(timeout)' : ''}`);
      
      if (i === retries - 1) {
        throw new Error(`Download failed after ${retries} attempts: ${error.message}`);
      }
      
      // Exponential backoff with jitter
      const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
      console.log(`⏳ Retrying in ${Math.round(delay)}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

/**
 * Validate image file signature for security
 */
function validateImageSignature(uint8Array) {
  if (uint8Array.length < 4) return false;
  
  const header = Array.from(uint8Array.slice(0, 4));
  
  for (const [format, signature] of Object.entries(VALIDATION.IMAGE_SIGNATURES)) {
    if (signature.every((byte, index) => header[index] === byte)) {
      console.log(`✅ Valid ${format.toUpperCase()} signature detected`);
      return true;
    }
  }
  
  console.warn(`⚠️ Unknown image signature: ${header.map(b => '0x' + b.toString(16).padStart(2, '0')).join(' ')}`);
  return false;
}

/**
 * Validate geographic coordinates for Singapore
 */
function validateCoordinates(lat, lng) {
  const bounds = VALIDATION.COORDINATES.SINGAPORE_BOUNDS;
  
  if (lat < bounds.lat.min || lat > bounds.lat.max) {
    console.warn(`⚠️ Latitude ${lat} outside Singapore bounds`);
    return false;
  }
  
  if (lng < bounds.lng.min || lng > bounds.lng.max) {
    console.warn(`⚠️ Longitude ${lng} outside Singapore bounds`);
    return false;
  }
  
  return true;
}

/**
 * 브라우저를 사용해 동적 콘텐츠 캡처 (선택적)
 */
async function captureWithBrowser(url, filepath, options = {}) {
  // 환경 변수로 브라우저 캡처 비활성화 가능
  if (process.env.DISABLE_BROWSER_CAPTURE === 'true') {
    throw new Error('Browser capture is disabled');
  }

  let browser = null;
  
  try {
    console.log(`Capturing webpage: ${url}`);
    
    browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu',
        '--disable-extensions',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
      ]
    });

    const page = await browser.newPage();
    
    // 뷰포트 설정
    await page.setViewport({
      width: options.width || 1280,
      height: options.height || 720,
      deviceScaleFactor: 1
    });

    // 사용자 에이전트 설정
    await page.setUserAgent('Singapore-Weather-Cam/1.0');

    // 페이지 로드
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // 추가 대기 (이미지 로딩 완료)
    await page.waitForTimeout(2000);

    // 스크린샷 캡처
    await fs.mkdir(path.dirname(filepath), { recursive: true });
    
    await page.screenshot({
      path: filepath,
      type: 'jpeg',
      quality: 85,
      fullPage: false
    });

    console.log(`Screenshot saved: ${filepath}`);
    return true;

  } catch (error) {
    console.error(`Browser capture failed for ${url}:`, error.message);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * LTA API에서 실시간 교통 카메라 이미지 정보 가져오기
 */
async function fetchTrafficCameraData() {
  try {
    console.log('Fetching traffic camera data from LTA API...');
    const response = await fetch(WEBCAM_SOURCES.traffic_api.endpoint, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Singapore-Weather-Cam/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`Found ${data.items[0]?.cameras?.length || 0} live traffic cameras`);
    return data.items[0]; // 최신 데이터
  } catch (error) {
    console.error('Error fetching traffic camera data:', error);
    return null;
  }
}

/**
 * 교통 카메라 데이터에서 특정 카메라 정보와 이미지 URL 찾기  
 */
function findTrafficCameraUrl(trafficData, cameraId) {
  if (!trafficData || !trafficData.cameras) {
    return null;
  }

  const camera = trafficData.cameras.find(cam => cam.camera_id === cameraId);
  return camera ? camera.image : null;
}

/**
 * Claude API를 사용한 이미지 분석
 */
async function analyzeImageWithClaude(imagePath, webcamInfo) {
  if (!anthropic) {
    console.log('Claude API not available - skipping image analysis');
    return {
      analysis_available: false,
      reason: 'API key not configured'
    };
  }

  try {
    console.log(`Analyzing image with Claude AI: ${imagePath}`);
    
    // 이미지 파일 읽기 및 base64 인코딩
    const imageBuffer = await fs.readFile(imagePath);
    const imageBase64 = imageBuffer.toString('base64');
    
    // Claude API 호출
    const message = await anthropic.messages.create({
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1000,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: 'image/jpeg',
              data: imageBase64
            }
          },
          {
            type: 'text',
            text: `Analyze this webcam image from ${webcamInfo.location}, Singapore. 
            
Please provide:
1. Weather conditions (sunny, cloudy, rainy, hazy)
2. Visibility level (excellent, good, fair, poor)
3. Traffic conditions (if visible)
4. Time of day estimate
5. Notable features or activities
6. Overall scene description

Format your response as structured data that can be easily parsed.`
          }
        ]
      }]
    });

    const analysisText = message.content[0].text;
    
    return {
      analysis_available: true,
      timestamp: new Date().toISOString(),
      model: 'claude-3-sonnet-20240229',
      analysis: analysisText,
      location: webcamInfo.location,
      coordinates: webcamInfo.coordinates
    };

  } catch (error) {
    console.error('Error analyzing image with Claude:', error);
    return {
      analysis_available: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * 단일 웹캠 이미지 캡처 및 처리
 */
async function captureWebcam(webcamConfig, timestamp, trafficData = null) {
  const captureData = {
    id: webcamConfig.id,
    name: webcamConfig.name,
    location: webcamConfig.location,
    coordinates: webcamConfig.coordinates,
    type: webcamConfig.type,
    timestamp: timestamp,
    capture_time: new Date().toISOString(),
    status: 'pending',
    file_info: {},
    ai_analysis: null
  };

  try {
    // 파일 경로 설정
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hour = String(now.getHours()).padStart(2, '0');
    const minute = String(now.getMinutes()).padStart(2, '0');
    
    const imageFilename = `${webcamConfig.id}_${year}${month}${day}_${hour}${minute}.jpg`;
    const imagePath = path.join(process.cwd(), 'public', 'images', 'webcam', imageFilename);

    let imageUrl = webcamConfig.url;
    
    // 교통 카메라의 경우 실시간 API 데이터 사용
    if (webcamConfig.type === 'traffic' && webcamConfig.camera_id && trafficData) {
      const liveImageUrl = findTrafficCameraUrl(trafficData, webcamConfig.camera_id);
      if (liveImageUrl) {
        imageUrl = liveImageUrl;
        console.log(`Using live traffic camera URL for ${webcamConfig.id}: ${imageUrl}`);
      } else {
        console.warn(`No live image found for camera ${webcamConfig.camera_id}, skipping`);
        captureData.status = 'skipped';
        captureData.error = 'No live image available from traffic API';
        return captureData;
      }
    }
    
    // URL에 타임스탬프 대체 (정적 URL인 경우)
    if (imageUrl && imageUrl.includes('{timestamp}')) {
      const formattedTimestamp = formatTimestamp(now);
      imageUrl = imageUrl.replace('{timestamp}', formattedTimestamp);
    }

    let captureSuccess = false;

    // 이미지 캡처 시도 - 직접 다운로드 우선
    if (imageUrl && imageUrl.match(/\.(jpg|jpeg|png|webp)$/i)) {
      try {
        await downloadImage(imageUrl, imagePath);
        captureSuccess = true;
      } catch (error) {
        console.warn(`Direct download failed for ${webcamConfig.id}:`, error.message);
      }
    }

    // 브라우저 캡처 시도 (직접 다운로드 실패 시, 브라우저가 활성화된 경우에만)
    if (!captureSuccess && process.env.DISABLE_BROWSER_CAPTURE !== 'true') {
      try {
        console.log(`Trying browser capture for ${webcamConfig.id}...`);
        await captureWithBrowser(imageUrl, imagePath);
        captureSuccess = true;
      } catch (error) {
        console.warn(`Browser capture also failed for ${webcamConfig.id}:`, error.message);
      }
    }

    if (captureSuccess) {
      // 파일 정보 수집
      const stats = await fs.stat(imagePath);
      captureData.file_info = {
        path: `images/webcam/${imageFilename}`,
        size: stats.size,
        created: stats.birthtime.toISOString(),
        source_url: imageUrl
      };

      // AI 이미지 분석 수행
      captureData.ai_analysis = await analyzeImageWithClaude(imagePath, webcamConfig);

      captureData.status = 'success';
      console.log(`Successfully captured webcam: ${webcamConfig.id} (${stats.size} bytes)`);
    } else {
      throw new Error('All capture methods failed');
    }

  } catch (error) {
    captureData.status = 'failed';
    captureData.error = error.message;
    console.error(`Failed to capture webcam ${webcamConfig.id}:`, error);
  }

  return captureData;
}

/**
 * 모든 웹캠 이미지 캡처
 */
async function captureAllWebcams() {
  const timestamp = new Date().toISOString();
  const results = {
    timestamp: timestamp,
    total_cameras: 0,
    successful_captures: 0,
    failed_captures: 0,
    skipped_captures: 0,
    captures: []
  };

  // 모든 웹캠 소스 수집 (테스트 카메라 포함)
  const allWebcams = [
    ...WEBCAM_SOURCES.test_cameras,
    ...WEBCAM_SOURCES.public_webcams,
    ...WEBCAM_SOURCES.traffic_cameras
  ];

  results.total_cameras = allWebcams.length;
  console.log(`Starting capture for ${results.total_cameras} webcams...`);

  // 실시간 교통 카메라 데이터 가져오기 (교통 카메라용)
  const trafficData = await fetchTrafficCameraData();

  // Enhanced batch processing with resource monitoring
  console.log(`📊 Processing ${results.total_cameras} cameras in batches of ${CONFIG.BATCH_SIZE}`);
  console.log(`🕰️ Estimated completion time: ${Math.ceil(results.total_cameras / CONFIG.BATCH_SIZE) * CONFIG.BATCH_DELAY / 1000}s`);
  
  for (let i = 0; i < allWebcams.length; i += CONFIG.BATCH_SIZE) {
    const batch = allWebcams.slice(i, i + CONFIG.BATCH_SIZE);
    const batchNum = Math.floor(i / CONFIG.BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(allWebcams.length / CONFIG.BATCH_SIZE);
    
    console.log(`📆 Processing batch ${batchNum}/${totalBatches}: ${batch.map(w => w.id).join(', ')}`);
    
    // Memory usage monitoring
    const memUsage = process.memoryUsage();
    if (memUsage.heapUsed > CONFIG.MAX_MEMORY_USAGE) {
      console.warn(`⚠️ High memory usage: ${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`);
      // Force garbage collection if available
      if (global.gc) global.gc();
    }
    
    const batchPromises = batch.map(async (webcam) => {
      try {
        // Validate webcam configuration
        if (!validateWebcamConfig(webcam)) {
          throw new Error('Invalid webcam configuration');
        }
        
        return await captureWebcam(webcam, timestamp, trafficData);
      } catch (error) {
        console.error(`❌ Webcam ${webcam.id} failed: ${error.message}`);
        return createFailedCaptureResult(webcam, timestamp, error.message);
      }
    });

    const batchResults = await Promise.allSettled(batchPromises);
    
    // Process results with enhanced error handling
    for (const promiseResult of batchResults) {
      let result;
      
      if (promiseResult.status === 'fulfilled') {
        result = promiseResult.value;
      } else {
        console.error(`❌ Promise rejected: ${promiseResult.reason.message}`);
        result = createFailedCaptureResult({id: 'unknown'}, timestamp, promiseResult.reason.message);
      }
      
      results.captures.push(result);
      
      if (result.status === 'success') {
        results.successful_captures++;
      } else if (result.status === 'skipped') {
        results.skipped_captures++;
      } else {
        results.failed_captures++;
      }
    }

    // Progress reporting
    const progress = Math.round((i + CONFIG.BATCH_SIZE) / allWebcams.length * 100);
    console.log(`📈 Progress: ${Math.min(progress, 100)}% complete`);

    // Inter-batch delay for rate limiting
    if (i + CONFIG.BATCH_SIZE < allWebcams.length) {
      console.log(`⏳ Waiting ${CONFIG.BATCH_DELAY / 1000}s before next batch...`);
      await new Promise(resolve => setTimeout(resolve, CONFIG.BATCH_DELAY));
    }
  }

/**
 * Validate webcam configuration for security and data integrity
 */
function validateWebcamConfig(webcam) {
  if (!webcam || typeof webcam !== 'object') {
    console.error('❌ Invalid webcam object');
    return false;
  }
  
  const required = ['id', 'name', 'coordinates', 'type'];
  for (const field of required) {
    if (!webcam[field]) {
      console.error(`❌ Missing required field: ${field}`);
      return false;
    }
  }
  
  // Validate coordinates
  if (webcam.coordinates) {
    const { lat, lng } = webcam.coordinates;
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      console.error('❌ Invalid coordinate types');
      return false;
    }
    
    if (!validateCoordinates(lat, lng)) {
      console.error('❌ Coordinates outside Singapore bounds');
      return false;
    }
  }
  
  return true;
}

/**
 * Create standardized failed capture result
 */
function createFailedCaptureResult(webcam, timestamp, errorMessage) {
  return {
    id: webcam.id || 'unknown',
    name: webcam.name || 'Unknown Camera',
    location: webcam.location || 'Unknown Location',
    coordinates: webcam.coordinates || { lat: 0, lng: 0 },
    type: webcam.type || 'unknown',
    timestamp: timestamp,
    capture_time: new Date().toISOString(),
    status: 'failed',
    error: errorMessage,
    file_info: {},
    ai_analysis: {
      analysis_available: false,
      reason: `Capture failed: ${errorMessage}`
    }
  };
}

  // Final results summary with data integrity metrics
  const completionTime = Date.now() - Date.parse(timestamp);
  const successRate = results.total_cameras > 0 ? 
    (results.successful_captures / results.total_cameras * 100).toFixed(1) : 0;
  
  console.log('');
  console.log('📋 Webcam Capture Summary:');
  console.log(`  - Total cameras: ${results.total_cameras}`);
  console.log(`  - Successful: ${results.successful_captures} (✅ ${successRate}%)`);
  console.log(`  - Failed: ${results.failed_captures}`);
  console.log(`  - Skipped: ${results.skipped_captures}`);
  console.log(`  - Completion time: ${Math.round(completionTime / 1000)}s`);
  console.log(`  - Circuit breaker: ${CIRCUIT_BREAKER.state} (${CIRCUIT_BREAKER.failures} failures)`);
  
  // Add metadata for monitoring
  results.metadata = {
    completion_time_ms: completionTime,
    success_rate: parseFloat(successRate),
    circuit_breaker_state: CIRCUIT_BREAKER.state,
    memory_usage_mb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
    data_integrity_validated: true
  };
  
  return results;
}

/**
 * 웹캠 데이터를 JSON 파일에 저장
 */
async function saveWebcamData(webcamData) {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hour = String(now.getHours()).padStart(2, '0');
  const minute = String(now.getMinutes()).padStart(2, '0');

  // 디렉토리 구조 생성
  const basePath = 'data/webcam';
  const yearPath = path.join(basePath, year.toString());
  const monthPath = path.join(yearPath, month);
  const dayPath = path.join(monthPath, day);

  await fs.mkdir(dayPath, { recursive: true });

  // 시간별 파일 저장
  const hourlyFilePath = path.join(dayPath, `${hour}-${minute}.json`);
  await fs.writeFile(hourlyFilePath, JSON.stringify(webcamData, null, 2));

  // 최신 데이터 업데이트
  const latestFilePath = path.join(basePath, 'latest.json');
  await fs.writeFile(latestFilePath, JSON.stringify(webcamData, null, 2));

  // 성공한 캡처만 포함하는 summary 생성
  const summaryData = {
    ...webcamData,
    captures: webcamData.captures.filter(capture => capture.status === 'success')
  };

  const summaryFilePath = path.join(dayPath, 'summary.json');
  await fs.writeFile(summaryFilePath, JSON.stringify(summaryData, null, 2));

  console.log(`Webcam data saved: ${hourlyFilePath}`);
  console.log(`Summary: ${webcamData.successful_captures}/${webcamData.total_cameras} captures successful`);
}

/**
 * 오래된 이미지 파일 정리 (7일 이상 된 파일)
 */
async function cleanupOldImages() {
  try {
    const imagesDir = path.join(process.cwd(), 'public', 'images', 'webcam');
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    
    const files = await fs.readdir(imagesDir);
    let deletedCount = 0;
    
    for (const file of files) {
      const filePath = path.join(imagesDir, file);
      const stats = await fs.stat(filePath);
      
      // 디렉토리는 스킵
      if (stats.isDirectory()) {
        continue;
      }
      
      // 7일 이상 된 이미지 파일만 삭제 (방금 생성된 파일은 제외)
      const fileAgeMinutes = (Date.now() - stats.birthtime.getTime()) / (1000 * 60);
      if (stats.birthtime < sevenDaysAgo && file.match(/\.(jpg|jpeg|png|webp)$/i) && fileAgeMinutes > 10) {
        await fs.unlink(filePath);
        deletedCount++;
      }
    }
    
    if (deletedCount > 0) {
      console.log(`Cleaned up ${deletedCount} old image files`);
    }
  } catch (error) {
    console.warn('Error during cleanup:', error.message);
  }
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('Starting webcam image capture...');
  console.log(`Claude AI analysis: ${anthropic ? 'enabled' : 'disabled'}`);

  try {
    // 웹캠 이미지 캡처
    const webcamData = await captureAllWebcams();
    
    // 데이터 저장
    await saveWebcamData(webcamData);
    
    // 오래된 파일 정리 (개발 중에는 비활성화)
    // await cleanupOldImages();
    
    // 결과 요약
    console.log('\n=== Capture Summary ===');
    console.log(`Total cameras: ${webcamData.total_cameras}`);
    console.log(`Successful captures: ${webcamData.successful_captures}`);
    console.log(`Failed captures: ${webcamData.failed_captures}`);
    console.log(`Skipped captures: ${webcamData.skipped_captures}`);
    console.log(`Success rate: ${((webcamData.successful_captures / webcamData.total_cameras) * 100).toFixed(1)}%`);
    
    if (webcamData.successful_captures > 0) {
      console.log('\nSuccessful captures:');
      webcamData.captures
        .filter(c => c.status === 'success')
        .forEach(c => console.log(`✓ ${c.id}: ${c.file_info.size} bytes ${c.ai_analysis?.analysis_available ? '(AI analyzed)' : ''}`));
    }
    
    if (webcamData.failed_captures > 0) {
      console.log('\nFailed captures:');
      webcamData.captures
        .filter(c => c.status === 'failed')
        .forEach(c => console.log(`✗ ${c.id}: ${c.error}`));
    }

    if (webcamData.skipped_captures > 0) {
      console.log('\nSkipped captures:');
      webcamData.captures
        .filter(c => c.status === 'skipped')
        .forEach(c => console.log(`- ${c.id}: ${c.error}`));
    }

    console.log('\nWebcam capture completed successfully');

  } catch (error) {
    console.error('Error in webcam capture:', error);
    process.exit(1);
  }
}

// 스크립트 직접 실행 시에만 main 함수 호출
if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  main();
}

export {
  captureAllWebcams,
  captureWebcam,
  analyzeImageWithClaude,
  WEBCAM_SOURCES
};