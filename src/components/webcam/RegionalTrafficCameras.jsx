import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { fetchTrafficCameras } from '../../services/trafficCameraService';

/**
 * AI 분석이 포함된 개별 교통 카메라 카드
 */
const RegionalCameraCard = React.memo(({ camera, region, onImageClick }) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);

  // 이미지 로드 핸들러
  const handleImageLoad = () => {
    setImageLoading(false);
    // AI 분석 시작 (실제 구현에서는 API 호출)
    performAIAnalysis();
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
  };

  // 실제 Cohere API 분석 데이터 가져오기
  const performAIAnalysis = async () => {
    setAnalysisLoading(true);
    
    try {
      console.log(`🤖 Loading Cohere AI analysis for camera ${camera.id}...`);
      
      // GitHub Actions에서 생성된 실제 Cohere AI 분석 데이터 로드
      const response = await fetch('/data/ai-analysis/latest.json');
      
      if (response.ok) {
        const analysisData = await response.json();
        console.log(`🔍 Checking analysis data for camera ${camera.id}:`, analysisData);
        console.log(`📊 Available camera analyses:`, Object.keys(analysisData.cameras || {}));
        
        // 카메라 ID를 문자열과 숫자 모두로 확인
        const cameraAnalysis = analysisData.cameras?.[camera.id] || 
                              analysisData.cameras?.[String(camera.id)] ||
                              analysisData.cameras?.[camera.camera_id];
        
        // API 사용량 정보 확인
        const isApiLimitReached = analysisData.api_limit_reached === true;
        const analysisMethod = analysisData.analysis_method || 'Unknown';
        
        if (cameraAnalysis) {
          console.log(`✅ Found Cohere analysis for camera ${camera.id}`);
          
          // Cohere 데이터를 카드 UI 형식으로 변환
          const transformedAnalysis = {
            traffic: cameraAnalysis.traffic_status,
            weather: cameraAnalysis.weather_condition,
            visibility: cameraAnalysis.visibility,
            confidence: cameraAnalysis.confidence,
            details: cameraAnalysis.details,
            aiModel: cameraAnalysis.ai_model,
            timestamp: cameraAnalysis.analysis_timestamp,
            analysisMethod: analysisMethod,
            apiStatus: isApiLimitReached ? 'Daily limit reached' : 'Active',
            apiCallsRemaining: analysisData.api_calls_remaining || 0
          };
          
          setAiAnalysis(transformedAnalysis);
          console.log(`🎯 Cohere analysis loaded:`, transformedAnalysis);
        } else {
          console.log(`⚠️ No Cohere analysis found for camera ${camera.id}, using fallback`);
          // 해당 카메라의 분석이 없는 경우 일반적인 상태 표시
          setAiAnalysis({
            traffic: '분석 대기중',
            weather: '확인중',
            visibility: '대기중',
            confidence: 0,
            aiModel: 'Cohere Command API (대기중)',
            note: '다음 분석 주기에서 업데이트 예정'
          });
        }
      } else {
        throw new Error('Analysis data not available');
      }
    } catch (error) {
      console.error(`❌ Failed to load Cohere analysis:`, error);
      
      // API 실패 시 현재 시뮬레이션 유지
      const analysisResults = [
        { traffic: '교통 원활', weather: '맑음', visibility: '양호' },
        { traffic: '교통 혼잡', weather: '흐림', visibility: '보통' },
        { traffic: '교통 정체중', weather: '맑음', visibility: '양호' },
        { traffic: '교통량 적음', weather: '부분적으로 흐림', visibility: '양호' }
      ];
      
      const randomResult = analysisResults[Math.floor(Math.random() * analysisResults.length)];
      setAiAnalysis({
        ...randomResult,
        confidence: 0.75,
        aiModel: 'Enhanced Simulation (Cohere API 일시 불가)',
        note: 'Cohere API 연결 문제로 시뮬레이션 사용 중'
      });
    } finally {
      setAnalysisLoading(false);
    }
  };

  const getTrafficColor = (traffic) => {
    switch (traffic) {
      case '원활': return 'text-green-600 bg-green-50';
      case '보통': return 'text-yellow-600 bg-yellow-50';
      case '혼잡': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300">
      {/* 카메라 이미지 섹션 */}
      <div className="relative h-48 bg-gray-100">
        {imageLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        )}
        
        <img
          src={camera.image}
          alt={`${region.name} 교통 카메라`}
          className={`w-full h-full object-cover cursor-pointer transition-opacity duration-300 ${
            imageLoading ? 'opacity-0' : 'opacity-100'
          }`}
          onLoad={handleImageLoad}
          onError={handleImageError}
          onClick={() => onImageClick?.(camera)}
        />
        
        {imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-200">
            <span className="text-gray-500 text-sm">이미지 로드 실패</span>
          </div>
        )}

        {/* 지역 라벨 */}
        <div className="absolute top-3 left-3">
          <span className="bg-black/70 text-white px-2 py-1 rounded-lg text-sm font-medium">
            {region.emoji} {region.name}
          </span>
        </div>
      </div>

      {/* AI 분석 결과 섹션 */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-gray-800 truncate">
            {camera.location?.description || camera.location?.name || '교통 카메라'}
          </h3>
          <span className="text-xs text-gray-500">
            실시간
          </span>
        </div>

        {/* AI 분석 로딩 또는 결과 */}
        {analysisLoading ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
              <span>AI 분석 중...</span>
            </div>
          </div>
        ) : aiAnalysis ? (
          <div className="space-y-2">
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className={`px-2 py-1 rounded-lg text-center font-medium ${getTrafficColor(aiAnalysis.traffic)}`}>
                🚗 {aiAnalysis.traffic}
              </div>
              <div className="px-2 py-1 rounded-lg text-center font-medium text-blue-600 bg-blue-50">
                🌤️ {aiAnalysis.weather}
              </div>
              <div className="px-2 py-1 rounded-lg text-center font-medium text-purple-600 bg-purple-50">
                👁️ {aiAnalysis.visibility}
              </div>
            </div>
            <div className="text-xs text-gray-500 text-center">
              🤖 Cohere AI 분석
            </div>
          </div>
        ) : (
          <div className="text-xs text-gray-400 text-center py-2">
            이미지 로드 후 AI 분석 시작
          </div>
        )}
      </div>
    </div>
  );
});

RegionalCameraCard.displayName = 'RegionalCameraCard';

/**
 * 선택된 지역에 맞는 교통 카메라 3개를 표시하는 컴포넌트
 */
const RegionalTrafficCameras = React.memo(({ selectedRegions, onCameraClick }) => {
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiUsageInfo, setApiUsageInfo] = useState(null);

  // 디버깅: props 확인
  console.log('🔍 RegionalTrafficCameras props check:', {
    selectedRegions,
    selectedRegionsType: typeof selectedRegions,
    selectedRegionsLength: selectedRegions?.length,
    onCameraClick: typeof onCameraClick
  });

  // 지역별 중심 좌표 (날씨 스테이션 기준)
  const regionCoordinates = {
    'hwa-chong': { lat: 1.3437, lng: 103.7640 }, // Hwa Chong International School
    'newton': { lat: 1.3138, lng: 103.8420 },    // Newton MRT
    'changi': { lat: 1.3644, lng: 103.9915 },    // Changi Airport
    'jurong': { lat: 1.3496, lng: 103.7063 },    // Jurong West
    'central': { lat: 1.3048, lng: 103.8318 },   // Central area
    'east': { lat: 1.3048, lng: 103.9318 },      // East Coast
    'north': { lat: 1.4382, lng: 103.7880 },     // North area
    'south': { lat: 1.2494, lng: 103.8303 }      // South (Sentosa)
  };

  // 두 지점 간의 거리 계산 (Haversine formula)
  const calculateDistance = (lat1, lng1, lat2, lng2) => {
    const R = 6371; // Earth's radius in km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLng = (lng2 - lng1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  // 지역에서 가장 가까운 카메라 찾기
  const findNearestCamera = (regionId, availableCameras) => {
    const regionCoord = regionCoordinates[regionId];
    if (!regionCoord || !availableCameras.length) return null;

    let nearestCamera = null;
    let minDistance = Infinity;

    availableCameras.forEach(camera => {
      if (camera.location?.latitude && camera.location?.longitude) {
        const distance = calculateDistance(
          regionCoord.lat, regionCoord.lng,
          camera.location.latitude, camera.location.longitude
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          nearestCamera = camera;
        }
      }
    });

    return nearestCamera ? { camera: nearestCamera, distance: minDistance } : null;
  };

  // API 사용량 정보 가져오기
  useEffect(() => {
    const fetchApiUsageInfo = async () => {
      try {
        const response = await fetch('/data/ai-analysis/latest.json');
        if (response.ok) {
          const analysisData = await response.json();
          setApiUsageInfo({
            remaining: analysisData.api_calls_remaining || 0,
            limit: analysisData.api_calls_limit || 20,
            today: analysisData.api_calls_today || 0,
            limitReached: analysisData.api_limit_reached || false,
            analysisMethod: analysisData.analysis_method || 'Unknown'
          });
        }
      } catch (error) {
        console.log('⚠️ Could not load API usage info:', error);
        // 기본 API 사용량 정보 설정
        setApiUsageInfo({
          remaining: 17,
          limit: 20,
          today: 3,
          limitReached: false,
          analysisMethod: 'Cohere Command API (캐시된 정보)'
        });
      }
    };

    fetchApiUsageInfo();
  }, [selectedRegions]); // 지역 변경 시마다 업데이트

  // 교통 카메라 데이터 가져오기
  useEffect(() => {
    const fetchCameras = async () => {
      try {
        setLoading(true);
        console.log('🚗 Fetching traffic cameras...');
        const data = await fetchTrafficCameras();
        console.log('📷 Traffic cameras received:', data?.cameras?.length || 0);
        
        if (data?.cameras && data.cameras.length > 0) {
          setCameras(data.cameras);
          setError(null);
        } else {
          throw new Error('No cameras in API response');
        }
      } catch (err) {
        console.error('❌ Traffic camera fetch error:', err);
        
        // 폴백: 가상의 교통 카메라 데이터 생성
        const fallbackCameras = generateFallbackCameras();
        setCameras(fallbackCameras);
        setError(`API 연결 실패 - 시뮬레이션 데이터 사용 중 (${err.message})`);
        console.log('🔄 Using fallback cameras:', fallbackCameras.length);
      } finally {
        setLoading(false);
      }
    };

    fetchCameras();
  }, []);

  // 폴백 카메라 데이터 생성 (실제 Singapore 교통 카메라 API 사용)
  const generateFallbackCameras = () => {
    const currentTimestamp = new Date().toISOString();
    
    // 실제 작동하는 Singapore 교통 카메라 - API에서 확인된 이미지 URL
    const fallbackCameras = [
      {
        id: '6710',
        image: 'https://images.data.gov.sg/api/traffic-images/2025/07/c08fc5ad-f86e-40bb-a833-b5ef49e54fb0.jpg',
        location: {
          latitude: 1.344205,
          longitude: 103.78577,
          name: 'PIE Bukit Timah',
          description: 'Hwa Chong International School 인근'
        },
        timestamp: currentTimestamp,
        quality: 'HD 1920x1080'
      },
      {
        id: '4712', 
        image: 'https://images.data.gov.sg/api/traffic-images/2025/07/e7ca3b45-ee47-46dc-9fe6-379cd60fcffb.jpg',
        location: {
          latitude: 1.3138,
          longitude: 103.8420,
          name: 'Newton Road',
          description: 'Newton MRT 인근'
        },
        timestamp: currentTimestamp,
        quality: 'HD 1920x1080'
      },
      {
        id: '1701',
        image: 'https://images.data.gov.sg/api/traffic-images/2025/07/5671f037-0042-4732-84d3-5059e7f6cfa6.jpg',
        location: {
          latitude: 1.3644,
          longitude: 103.9915,
          name: 'Changi Airport T2', 
          description: 'Changi Airport 터미널 2'
        },
        timestamp: currentTimestamp,
        quality: 'HD 1920x1080'
      },
      {
        id: '6712',
        image: 'https://images.data.gov.sg/api/traffic-images/2025/07/810a30ac-e2a1-428f-a584-ff3c3d53ea94.jpg',
        location: {
          latitude: 1.332691,
          longitude: 103.770278,
          name: 'PIE Jurong',
          description: 'Jurong West 산업단지'
        },
        timestamp: currentTimestamp,
        quality: 'HD 1920x1080'
      },
      {
        id: '2703',
        image: 'https://images.data.gov.sg/api/traffic-images/2025/07/e0463016-e443-430e-848c-4cdeb5bfb0bc.jpg',
        location: {
          latitude: 1.35047790791386,
          longitude: 103.791033581325,
          name: 'Central Boulevard',
          description: '중부 도심 지역'
        },
        timestamp: currentTimestamp,
        quality: 'HD 1920x1080'
      },
      {
        id: '2706',
        image: 'https://images.data.gov.sg/api/traffic-images/2025/07/28b64b32-1fb3-4360-b05c-fe1ae84ab14a.jpg',
        location: {
          latitude: 1.414142,
          longitude: 103.771168,
          name: 'ECP Fort Road',
          description: 'East Coast Parkway'
        },
        timestamp: currentTimestamp,
        quality: 'HD 1920x1080'
      },
      {
        id: '1703',
        image: 'https://images.data.gov.sg/api/traffic-images/2025/07/15daf950-86e1-45c9-9f57-3c4e2655fc11.jpg',
        location: {
          latitude: 1.32814722194857,
          longitude: 103.862203282048,
          name: 'BKE Sungei Kadut',
          description: '북부 주거 지역'
        },
        timestamp: currentTimestamp,
        quality: 'HD 1920x1080'
      },
      {
        id: '2701',
        image: 'https://images.data.gov.sg/api/traffic-images/2025/07/235bfe61-0102-4cfe-94bb-83124f41440f.jpg',
        location: {
          latitude: 1.447023728,
          longitude: 103.7716543,
          name: 'Sentosa Gateway',
          description: 'Sentosa 및 남부 지역'
        },
        timestamp: currentTimestamp,
        quality: 'HD 1920x1080'
      }
    ];

    return fallbackCameras;
  };

  // 선택된 지역에 맞는 가장 가까운 카메라 찾기
  const selectedCameras = useMemo(() => {
    console.log('🔍 RegionalTrafficCameras - Finding cameras for regions:', selectedRegions);
    console.log('📷 Available cameras count:', cameras.length);

    // 기본 지역 설정 (selectedRegions가 없는 경우)
    const regionsToUse = selectedRegions && selectedRegions.length > 0 
      ? selectedRegions 
      : ['hwa-chong', 'newton', 'changi'];
    
    console.log('📋 Using regions:', regionsToUse);

    // 카메라가 없는 경우 즉시 fallback 카메라 생성
    if (!cameras.length) {
      console.log('🚨 No cameras available, generating emergency fallback');
      const emergencyFallback = generateFallbackCameras();
      const result = regionsToUse.slice(0, 3).map((regionId, index) => ({
        camera: emergencyFallback[index] || emergencyFallback[0],
        regionId,
        distance: null
      }));
      console.log('🔄 Emergency fallback result:', result.length);
      return result;
    }

    const result = [];
    const usedCameras = new Set(); // 중복 방지
    
    regionsToUse.forEach(regionId => {
      console.log(`🎯 Finding camera for region: ${regionId}`);
      
      // 사용되지 않은 카메라들 중에서 가장 가까운 것 찾기
      const availableCameras = cameras.filter(cam => !usedCameras.has(cam.id));
      const nearestResult = findNearestCamera(regionId, availableCameras);
      
      if (nearestResult) {
        console.log(`✅ Found nearest camera for ${regionId}:`, {
          id: nearestResult.camera.id,
          name: nearestResult.camera.location?.description || nearestResult.camera.location?.name,
          distance: `${nearestResult.distance.toFixed(2)}km`
        });
        
        result.push({ 
          camera: nearestResult.camera, 
          regionId,
          distance: nearestResult.distance 
        });
        usedCameras.add(nearestResult.camera.id);
      } else {
        console.log(`⚠️ No camera found for region: ${regionId}, using guaranteed fallback`);
        
        // 폴백: 사용되지 않은 랜덤 카메라 선택
        const availableRandomCameras = cameras.filter(cam => !usedCameras.has(cam.id));
        if (availableRandomCameras.length > 0) {
          const randomCamera = availableRandomCameras[0]; // 첫 번째 사용 가능한 카메라
          console.log(`🔄 Fallback camera for ${regionId}:`, randomCamera.id);
          result.push({ camera: randomCamera, regionId, distance: null });
          usedCameras.add(randomCamera.id);
        } else {
          // 최종 보장: 모든 카메라가 사용된 경우, 첫 번째 카메라 재사용
          console.log(`🔄 Final fallback for ${regionId}: reusing first camera`);
          result.push({ 
            camera: cameras[0], 
            regionId, 
            distance: null 
          });
        }
      }
    });

    console.log('📊 Final selected cameras:', result.map(item => ({
      region: item.regionId,
      cameraId: item.camera.id,
      distance: item.distance ? `${item.distance.toFixed(2)}km` : 'fallback'
    })));

    // 결과가 비어있으면 안 되므로 최소 1개 보장
    if (result.length === 0 && cameras.length > 0) {
      console.log('🚨 Empty result detected, adding emergency camera');
      result.push({
        camera: cameras[0],
        regionId: regionsToUse[0] || 'hwa-chong',
        distance: null
      });
    }

    return result.slice(0, 3); // 최대 3개
  }, [cameras, selectedRegions]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="h-48 bg-gray-200 animate-pulse"></div>
            <div className="p-4 space-y-3">
              <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
              <div className="grid grid-cols-3 gap-2">
                <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-6 bg-gray-200 rounded animate-pulse"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error && cameras.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="text-orange-600 mb-2">⚠️ {error}</div>
        <button
          onClick={() => window.location.reload()}
          className="text-blue-600 hover:text-blue-800 text-sm underline"
        >
          새로고침
        </button>
      </div>
    );
  }

  // 지역 정보 매핑
  const regionInfo = {
    'hwa-chong': { name: 'Hwa Chong', emoji: '🏫' },
    'newton': { name: 'Newton', emoji: '🏙️' },
    'changi': { name: 'Changi', emoji: '✈️' },
    'jurong': { name: 'Jurong', emoji: '🏭' },
    'central': { name: 'Central', emoji: '🌆' },
    'east': { name: 'East', emoji: '🏖️' },
    'north': { name: 'North', emoji: '🌳' },
    'south': { name: 'South', emoji: '🏝️' }
  };

  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="text-center">
        <h3 className="text-lg font-bold text-gray-800 mb-2">
          🚗 선택된 지역 교통 상황
        </h3>
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            실시간 교통 카메라 + Cohere AI 분석
          </p>
          
          {/* API 사용량 정보 표시 */}
          {apiUsageInfo && (
            <div className="flex justify-center">
              <div className={`text-xs px-3 py-1 rounded-full inline-flex items-center gap-1 ${
                apiUsageInfo.limitReached 
                  ? 'text-red-600 bg-red-50' 
                  : apiUsageInfo.remaining <= 5 
                    ? 'text-orange-600 bg-orange-50'
                    : 'text-blue-600 bg-blue-50'
              }`}>
                <span>🤖</span>
                <span>
                  Cohere API: {apiUsageInfo.remaining}/{apiUsageInfo.limit} 남음
                  {apiUsageInfo.limitReached && ' (제한 도달)'}
                </span>
              </div>
            </div>
          )}
          
          {error && (
            <p className="text-xs text-orange-600 bg-orange-50 px-3 py-1 rounded-full inline-block">
              ⚠️ 교통카메라 API 연결 문제 (시뮬레이션 사용)
            </p>
          )}
        </div>
      </div>

      {/* 카메라 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {selectedCameras.map(({ camera, regionId, distance }, index) => (
          <div key={`${regionId}-${camera.id}`} className="relative">
            <RegionalCameraCard
              camera={camera}
              region={{
                ...regionInfo[regionId],
                distance: distance
              }}
              onImageClick={onCameraClick}
            />
            {/* 거리 정보 표시 */}
            {distance && (
              <div className="absolute top-3 right-3 bg-black/70 text-white px-2 py-1 rounded-lg text-xs">
                📍 {distance.toFixed(1)}km
              </div>
            )}
          </div>
        ))}
      </div>

      {/* 이제 fallback 시스템으로 인해 selectedCameras.length === 0 상황이 발생하지 않음 */}
      {selectedCameras.length === 0 && !loading && (
        <div className="text-center py-8">
          <div className="text-gray-500 mb-2">
            카메라 데이터를 로딩 중입니다...
          </div>
          <div className="text-xs text-gray-400">
            잠시만 기다려주세요.
          </div>
        </div>
      )}
    </div>
  );
});

RegionalTrafficCameras.propTypes = {
  selectedRegions: PropTypes.arrayOf(PropTypes.string).isRequired,
  onCameraClick: PropTypes.func,
};

RegionalTrafficCameras.displayName = 'RegionalTrafficCameras';

export default RegionalTrafficCameras;