#!/usr/bin/env node

/**
 * LTA Camera Optimizer - 90개 모든 카메라 활용 최적화
 * 
 * @description
 * 싱가포르 LTA API에서 제공하는 모든 90개 카메라를 분석하고
 * 최적의 카메라 선별 및 활용 방안을 제공합니다.
 * 
 * @features
 * - 실시간 90개 카메라 목록 분석
 * - 지역별/품질별 카메라 분류
 * - Bukit Timah 지역 근접 카메라 우선순위
 * - 동적 카메라 선택 알고리즘
 * - 성능 최적화된 배치 처리
 */

import fs from 'fs/promises';
import path from 'path';

// LTA API 엔드포인트
const LTA_API_URL = 'https://api.data.gov.sg/v1/transport/traffic-images';

// Bukit Timah Nature Reserve 중심점 (프로젝트 기준점)
const BUKIT_TIMAH_CENTER = {
  lat: 1.3520,
  lng: 103.7767
};

// 지역 분류 및 우선순위
const REGION_CONFIG = {
  // 핵심 지역 (Bukit Timah 근처)
  core: {
    priority: 1,
    radius: 5, // km
    max_cameras: 15
  },
  // 주요 지역 (싱가포르 중심부)
  major: {
    priority: 2,
    radius: 15, // km
    max_cameras: 25
  },
  // 확장 지역 (전체 싱가포르)
  extended: {
    priority: 3,
    radius: 50, // km
    max_cameras: 50
  }
};

/**
 * 두 지점 간 거리 계산 (Haversine formula)
 */
function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * LTA API에서 최신 카메라 데이터 가져오기
 */
async function fetchAllCameras() {
  console.log('🔍 Fetching all cameras from LTA API...');
  
  try {
    const response = await fetch(LTA_API_URL, {
      headers: {
        'User-Agent': 'Singapore-Weather-Cam-Optimizer/1.0'
      }
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const cameras = data.items[0]?.cameras || [];
    
    console.log(`✅ Found ${cameras.length} live cameras`);
    return cameras;
    
  } catch (error) {
    console.error('❌ Error fetching camera data:', error);
    throw error;
  }
}

/**
 * 카메라들을 지역별로 분류하고 우선순위 부여
 */
function classifyAndPrioritizeCameras(cameras) {
  console.log('📊 Analyzing camera distribution...');
  
  const classified = {
    core: [],
    major: [],
    extended: [],
    total: cameras.length
  };

  cameras.forEach(camera => {
    const distance = calculateDistance(
      BUKIT_TIMAH_CENTER.lat,
      BUKIT_TIMAH_CENTER.lng,
      camera.location.latitude,
      camera.location.longitude
    );

    // 카메라 품질 분석
    const quality = getImageQuality(camera.image_metadata);
    const isHD = quality === 'HD';

    const cameraInfo = {
      id: camera.camera_id,
      coordinates: {
        lat: camera.location.latitude,
        lng: camera.location.longitude
      },
      distance: distance,
      quality: quality,
      isHD: isHD,
      image_url: camera.image,
      timestamp: camera.timestamp,
      metadata: camera.image_metadata,
      score: calculateCameraScore(camera, distance, isHD)
    };

    // 지역별 분류
    if (distance <= REGION_CONFIG.core.radius) {
      classified.core.push(cameraInfo);
    } else if (distance <= REGION_CONFIG.major.radius) {
      classified.major.push(cameraInfo);
    } else if (distance <= REGION_CONFIG.extended.radius) {
      classified.extended.push(cameraInfo);
    }
  });

  // 점수별 정렬 (높은 점수 우선)
  classified.core.sort((a, b) => b.score - a.score);
  classified.major.sort((a, b) => b.score - a.score);
  classified.extended.sort((a, b) => b.score - a.score);

  return classified;
}

/**
 * 카메라 점수 계산 (품질, 거리, 기타 요소 고려)
 */
function calculateCameraScore(camera, distance, isHD) {
  let score = 100; // 기본 점수

  // 거리 점수 (가까울수록 높음)
  score -= distance * 2;

  // 품질 점수
  if (isHD) {
    score += 30;
  } else {
    score += 10;
  }

  // 메타데이터 완성도
  if (camera.image_metadata?.md5) {
    score += 5;
  }

  // 타임스탬프 신선도 (최근일수록 높음)
  const now = new Date();
  const cameraTime = new Date(camera.timestamp);
  const minutesAgo = (now - cameraTime) / (1000 * 60);
  if (minutesAgo < 10) {
    score += 10;
  }

  return Math.max(0, score);
}

/**
 * 이미지 품질 판단
 */
function getImageQuality(metadata) {
  if (!metadata) return 'unknown';

  const { width, height } = metadata;
  if (width >= 1920 && height >= 1080) return 'HD';
  if (width >= 1280 && height >= 720) return 'HD Ready';
  if (width >= 640 && height >= 480) return 'Standard';
  return 'Low';
}

/**
 * 최적화된 카메라 선택
 */
function selectOptimalCameras(classified) {
  console.log('🎯 Selecting optimal camera configuration...');
  
  const selected = [];

  // Core 지역에서 최고 점수 카메라들 선택
  const coreSelection = classified.core
    .slice(0, REGION_CONFIG.core.max_cameras)
    .map(cam => ({ ...cam, region: 'core', priority: 1 }));
  
  // Major 지역에서 추가 선택 (Core와 중복 제거)
  const majorSelection = classified.major
    .filter(cam => !coreSelection.find(c => c.id === cam.id))
    .slice(0, REGION_CONFIG.major.max_cameras)
    .map(cam => ({ ...cam, region: 'major', priority: 2 }));

  // Extended 지역에서 추가 선택
  const extendedSelection = classified.extended
    .filter(cam => 
      !coreSelection.find(c => c.id === cam.id) &&
      !majorSelection.find(c => c.id === cam.id)
    )
    .slice(0, REGION_CONFIG.extended.max_cameras)
    .map(cam => ({ ...cam, region: 'extended', priority: 3 }));

  selected.push(...coreSelection, ...majorSelection, ...extendedSelection);

  // 최종 정렬 (우선순위 → 점수)
  selected.sort((a, b) => {
    if (a.priority !== b.priority) {
      return a.priority - b.priority;
    }
    return b.score - a.score;
  });

  return selected;
}

/**
 * 기존 capture-webcam.js에 맞는 설정 생성
 */
function generateWebcamConfig(selectedCameras) {
  console.log('⚙️ Generating webcam configuration...');
  
  const config = {
    timestamp: new Date().toISOString(),
    total_cameras: selectedCameras.length,
    selection_criteria: {
      bukit_timah_focus: true,
      quality_priority: 'HD preferred',
      max_distance: `${REGION_CONFIG.extended.radius}km`,
      scoring_algorithm: 'distance + quality + freshness'
    },
    traffic_cameras: selectedCameras.slice(0, 20).map((camera, index) => ({
      id: `auto_traffic_${camera.id}`,
      name: `Traffic Camera ${camera.id}`,
      camera_id: camera.id,
      coordinates: camera.coordinates,
      type: 'traffic',
      location: `Region ${camera.region}`,
      description: `Auto-selected camera (${camera.quality}, ${camera.distance.toFixed(1)}km from Bukit Timah)`,
      priority: camera.priority,
      score: Math.round(camera.score),
      region: camera.region,
      distance_km: Math.round(camera.distance * 10) / 10,
      image_quality: camera.quality
    }))
  };

  return config;
}

/**
 * 분석 보고서 생성
 */
function generateAnalysisReport(classified, selected) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total_available: classified.total,
      total_selected: selected.length,
      selection_rate: `${(selected.length / classified.total * 100).toFixed(1)}%`
    },
    distribution: {
      core: {
        available: classified.core.length,
        selected: selected.filter(c => c.region === 'core').length,
        radius: `${REGION_CONFIG.core.radius}km`
      },
      major: {
        available: classified.major.length,
        selected: selected.filter(c => c.region === 'major').length,
        radius: `${REGION_CONFIG.major.radius}km`
      },
      extended: {
        available: classified.extended.length,
        selected: selected.filter(c => c.region === 'extended').length,
        radius: `${REGION_CONFIG.extended.radius}km`
      }
    },
    quality_analysis: {
      hd_cameras: selected.filter(c => c.quality === 'HD').length,
      hd_ready_cameras: selected.filter(c => c.quality === 'HD Ready').length,
      standard_cameras: selected.filter(c => c.quality === 'Standard').length,
      low_cameras: selected.filter(c => c.quality === 'Low').length
    },
    top_cameras: selected.slice(0, 10).map(cam => ({
      id: cam.id,
      score: Math.round(cam.score),
      distance: `${cam.distance.toFixed(1)}km`,
      quality: cam.quality,
      region: cam.region
    }))
  };

  return report;
}

/**
 * 최적화된 설정 파일들 저장
 */
async function saveOptimizedConfigurations(config, report, selectedCameras) {
  const outputDir = 'data/camera-optimization';
  await fs.mkdir(outputDir, { recursive: true });

  // 웹캠 설정 저장
  const configPath = path.join(outputDir, 'optimized-webcam-config.json');
  await fs.writeFile(configPath, JSON.stringify(config, null, 2));

  // 분석 보고서 저장
  const reportPath = path.join(outputDir, 'camera-analysis-report.json');
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

  // 전체 카메라 리스트 저장
  const allCamerasPath = path.join(outputDir, 'all-cameras-data.json');
  await fs.writeFile(allCamerasPath, JSON.stringify(selectedCameras, null, 2));

  // 실행용 JS 설정 생성 (capture-webcam.js에서 import 가능)
  const jsConfigContent = `// Auto-generated optimized camera configuration
// Generated: ${new Date().toISOString()}
// Total cameras: ${selectedCameras.length}

export const OPTIMIZED_TRAFFIC_CAMERAS = ${JSON.stringify(config.traffic_cameras, null, 2)};

export const CAMERA_OPTIMIZATION_REPORT = ${JSON.stringify(report, null, 2)};
`;

  const jsConfigPath = path.join(outputDir, 'optimized-cameras.js');
  await fs.writeFile(jsConfigPath, jsConfigContent);

  console.log(`📁 Configurations saved:`);
  console.log(`  - Config: ${configPath}`);
  console.log(`  - Report: ${reportPath}`);
  console.log(`  - JS Module: ${jsConfigPath}`);
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('🚀 LTA Camera Optimizer Starting...');
  console.log(`🎯 Target: Bukit Timah Nature Reserve (${BUKIT_TIMAH_CENTER.lat}, ${BUKIT_TIMAH_CENTER.lng})`);

  try {
    // 1. 모든 카메라 데이터 가져오기
    const cameras = await fetchAllCameras();

    // 2. 카메라 분류 및 우선순위 부여
    const classified = classifyAndPrioritizeCameras(cameras);

    // 3. 최적 카메라 선택
    const selected = selectOptimalCameras(classified);

    // 4. 웹캠 설정 생성
    const config = generateWebcamConfig(selected);

    // 5. 분석 보고서 생성
    const report = generateAnalysisReport(classified, selected);

    // 6. 결과 저장
    await saveOptimizedConfigurations(config, report, selected);

    // 7. 결과 요약 출력
    console.log('\n📊 Optimization Results:');
    console.log(`  - Available cameras: ${classified.total}`);
    console.log(`  - Selected cameras: ${selected.length}`);
    console.log(`  - Core region (${REGION_CONFIG.core.radius}km): ${classified.core.length} → ${selected.filter(c => c.region === 'core').length}`);
    console.log(`  - Major region (${REGION_CONFIG.major.radius}km): ${classified.major.length} → ${selected.filter(c => c.region === 'major').length}`);
    console.log(`  - Extended region (${REGION_CONFIG.extended.radius}km): ${classified.extended.length} → ${selected.filter(c => c.region === 'extended').length}`);
    console.log(`  - HD cameras: ${selected.filter(c => c.quality === 'HD').length}`);
    console.log(`  - Average distance: ${(selected.reduce((sum, c) => sum + c.distance, 0) / selected.length).toFixed(1)}km`);

    console.log('\n🎉 Camera optimization completed successfully!');
    console.log('\n💡 Next steps:');
    console.log('  1. Review generated configuration in data/camera-optimization/');
    console.log('  2. Import optimized cameras in capture-webcam.js');
    console.log('  3. Test with expanded camera coverage');

  } catch (error) {
    console.error('❌ Error in camera optimization:', error);
    process.exit(1);
  }
}

// 스크립트 직접 실행
if (import.meta.url === new URL(process.argv[1], 'file://').href) {
  main();
}

export {
  fetchAllCameras,
  classifyAndPrioritizeCameras,
  selectOptimalCameras,
  generateWebcamConfig,
  BUKIT_TIMAH_CENTER,
  REGION_CONFIG
};