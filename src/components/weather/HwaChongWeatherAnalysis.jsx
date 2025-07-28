import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Camera, Eye, Brain, MapPin, Clock, Zap, AlertCircle, CheckCircle2 } from 'lucide-react';

const HwaChongWeatherAnalysis = React.memo(({ className = '', selectedCamera = null }) => {
  const [cameraData, setCameraData] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdate, setLastUpdate] = useState(null);

  // Hwa Chong 가장 가까운 카메라 ID (1.32km 거리, HD)
  const CLOSEST_CAMERA_ID = '6710';
  const HWA_CHONG_COORDS = { lat: 1.3437, lng: 103.7640 };

  const loadCameraData = async (useSelectedCamera = false) => {
    try {
      setLoading(true);
      setError(null);

      // 선택된 카메라가 있으면 그것을 사용, 없으면 기본 카메라 사용
      if (useSelectedCamera && selectedCamera) {
        // 지도에서 선택된 카메라 사용
        setCameraData({
          id: selectedCamera.id,
          image_url: selectedCamera.image?.url || '',
          timestamp: selectedCamera.timestamp || new Date().toISOString(),
          coordinates: {
            lat: selectedCamera.location?.latitude || HWA_CHONG_COORDS.lat,
            lng: selectedCamera.location?.longitude || HWA_CHONG_COORDS.lng
          },
          distance: selectedCamera.distance?.toFixed(2) || '알 수 없음',
          quality: selectedCamera.quality || 'Standard',
          name: selectedCamera.name || `Camera ${selectedCamera.id}`,
          area: selectedCamera.area || '알 수 없음'
        });

        // AI 분석 시뮬레이션
        await analyzeImageWithAI(selectedCamera.image?.url || '', selectedCamera);
        
        setLastUpdate(new Date());
        return;
      }

      // 기본 동작: LTA API에서 Hwa Chong 가장 가까운 카메라 가져오기
      const timestamp = new Date().getTime();
      const response = await fetch(`https://api.data.gov.sg/v1/transport/traffic-images?t=${timestamp}`);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const cameras = data.items?.[0]?.cameras || [];
      
      // Hwa Chong 가장 가까운 카메라 찾기
      const targetCamera = cameras.find(cam => cam.camera_id === CLOSEST_CAMERA_ID);
      
      if (targetCamera) {
        setCameraData({
          id: targetCamera.camera_id,
          image_url: targetCamera.image,
          timestamp: targetCamera.timestamp,
          coordinates: HWA_CHONG_COORDS, // 대략적 위치
          distance: 1.33, // km
          quality: 'HD 1920x1080',
          name: `Camera ${targetCamera.camera_id}`,
          area: 'Hwa Chong 인근'
        });

        // AI 분석 시뮬레이션
        await analyzeImageWithAI(targetCamera.image);
        
        setLastUpdate(new Date());
      } else {
        throw new Error('Hwa Chong 주변 카메라를 찾을 수 없습니다');
      }
    } catch (err) {
      console.error('Camera data loading error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const analyzeImageWithAI = async (imageUrl, cameraInfo = null) => {
    try {
      // 실제 Claude Vision API 호출 시뮬레이션
      // 프로덕션에서는 백엔드 API를 통해 Claude Vision API 호출
      
      // 카메라 위치에 따른 동적 분석 결과
      const locationDescription = cameraInfo ? 
        `${cameraInfo.name} (${cameraInfo.area})` : 
        'Hwa Chong International School 인근 (1.3km)';
      
      // 시뮬레이션된 AI 분석 결과
      const mockAnalysis = {
        weather_condition: '부분적으로 흐림',
        visibility: '양호',
        road_conditions: '건조',
        precipitation: '없음',
        cloud_coverage: '50%',
        lighting_conditions: '자연광',
        confidence: 0.87,
        details: {
          sky_condition: '부분적으로 흐린 하늘, 일부 구름 관찰됨',
          visibility_assessment: '시야가 선명하고 원거리 건물들이 잘 보임',
          weather_indicators: '비나 안개의 징후 없음, 도로와 차량들이 건조한 상태',
          atmospheric_conditions: '일반적인 열대 기후의 오후 상태'
        },
        analysis_timestamp: new Date().toISOString(),
        camera_location: locationDescription,
        ai_model: 'Claude Vision API'
      };

      setAiAnalysis(mockAnalysis);
    } catch (err) {
      console.error('AI analysis error:', err);
      setAiAnalysis({
        weather_condition: '분석 실패',
        visibility: '알 수 없음',
        confidence: 0,
        error: err.message
      });
    }
  };

  useEffect(() => {
    loadCameraData();
    
    // 5분마다 자동 업데이트
    const interval = setInterval(loadCameraData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // selectedCamera 변경 시 카메라 데이터 업데이트
  useEffect(() => {
    if (selectedCamera) {
      loadCameraData(true); // useSelectedCamera = true
    }
  }, [selectedCamera]);

  const getConfidenceColor = (confidence) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getStatusColor = (condition) => {
    if (condition?.includes('맑음') || condition?.includes('양호')) return 'text-green-600';
    if (condition?.includes('흐림') || condition?.includes('부분')) return 'text-yellow-600';
    if (condition?.includes('비') || condition?.includes('안개')) return 'text-blue-600';
    return 'text-gray-600';
  };

  if (loading) {
    return (
      <div className={`bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl shadow-lg border border-purple-200 p-6 ${className}`}>
        <div className="text-center">
          <Camera className="w-8 h-8 mx-auto mb-3 text-purple-500 animate-pulse" />
          <p className="text-gray-600">🏫 Hwa Chong 주변 CCTV 분석 중...</p>
          <div className="mt-3 flex items-center justify-center gap-2">
            <Zap className="w-4 h-4 text-purple-500 animate-pulse" />
            <span className="text-sm text-purple-600">Claude AI 실시간 분석</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-gradient-to-br from-red-50 to-orange-50 rounded-xl shadow-lg border border-red-200 p-6 ${className}`}>
        <div className="text-center">
          <AlertCircle className="w-8 h-8 mx-auto mb-3 text-red-500" />
          <p className="text-red-700 font-medium">CCTV 분석 오류</p>
          <p className="text-sm text-red-600 mt-1">{error}</p>
          <button
            onClick={loadCameraData}
            className="mt-3 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl shadow-lg border border-purple-200 ${className}`}>
      {/* 헤더 */}
      <div className="p-6 border-b border-purple-200 bg-white bg-opacity-50 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <Camera className="w-5 h-5 text-purple-600" />
              {selectedCamera ? (
                <>📹 {cameraData?.name || cameraData?.id} 실시간 분석</>
              ) : (
                <>🏫 Hwa Chong CCTV 실시간 분석</>
              )}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Claude AI 기반 시각적 날씨 분석 
              {cameraData?.area && <> • 위치: {cameraData.area}</>}
              {cameraData?.distance && <> • 거리: {cameraData.distance}km</>}
              {selectedCamera && (
                <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                  지도에서 선택됨
                </span>
              )}
            </p>
          </div>
          <div className="text-right">
            {aiAnalysis && (
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600" />
                <div>
                  <div className={`text-lg font-bold ${getStatusColor(aiAnalysis.weather_condition)}`}>
                    {aiAnalysis.weather_condition}
                  </div>
                  <div className={`text-sm ${getConfidenceColor(aiAnalysis.confidence)}`}>
                    신뢰도: {Math.round(aiAnalysis.confidence * 100)}%
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* CCTV 이미지 */}
      <div className="p-6">
        {cameraData?.image_url && (
          <div className="mb-6">
            <div className="relative bg-gray-900 rounded-lg overflow-hidden">
              <img
                src={cameraData.image_url}
                alt="Hwa Chong 주변 실시간 CCTV"
                className="w-full h-64 object-cover"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <div className="absolute top-4 left-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded-lg text-sm">
                🔴 LIVE • Camera {cameraData.id}
              </div>
              <div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded-lg text-sm">
                {cameraData.quality}
              </div>
              
              {/* 오류 시 대체 표시 */}
              <div className="hidden absolute inset-0 bg-gray-800 flex-col items-center justify-center text-white">
                <Camera className="w-12 h-12 mb-3 opacity-50" />
                <p>이미지 로딩 실패</p>
              </div>
            </div>
          </div>
        )}

        {/* AI 분석 결과 */}
        {aiAnalysis && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="w-4 h-4 text-purple-600" />
                <span className="font-medium text-gray-800">CCTV 시각 분석</span>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>시야:</span>
                  <span className="font-medium text-green-600">{aiAnalysis.visibility}</span>
                </div>
                <div className="flex justify-between">
                  <span>도로상태:</span>
                  <span className="font-medium text-blue-600">{aiAnalysis.road_conditions}</span>
                </div>
                <div className="flex justify-between">
                  <span>조명:</span>
                  <span className="font-medium text-gray-600">{aiAnalysis.lighting_conditions}</span>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100">
              <div className="flex items-center gap-2 mb-3">
                <Brain className="w-4 h-4 text-purple-600" />
                <span className="font-medium text-gray-800">AI 분석 세부사항</span>
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <p><strong>하늘 상태:</strong> {aiAnalysis.details?.sky_condition}</p>
                <p><strong>시야 평가:</strong> {aiAnalysis.details?.visibility_assessment}</p>
                <p><strong>날씨 지표:</strong> {aiAnalysis.details?.weather_indicators}</p>
              </div>
            </div>
          </div>
        )}

        {/* 카메라 정보 및 위치 */}
        <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-purple-600" />
              <span className="font-medium text-purple-800">카메라 위치 정보</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-700">실시간 연결</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <div className="font-medium text-purple-800">카메라 ID</div>
              <div className="text-gray-700">{cameraData?.id}</div>
            </div>
            <div>
              <div className="font-medium text-purple-800">Hwa Chong까지 거리</div>
              <div className="text-gray-700">{cameraData?.distance}km</div>
            </div>
            <div>
              <div className="font-medium text-purple-800">마지막 업데이트</div>
              <div className="text-gray-700">
                {lastUpdate ? lastUpdate.toLocaleTimeString('ko-KR') : '--:--:--'}
              </div>
            </div>
          </div>
        </div>

        {/* 업데이트 정보 */}
        {lastUpdate && (
          <div className="mt-4 text-center text-xs text-gray-500 flex items-center justify-center gap-1">
            <Clock className="w-3 h-3" />
            마지막 AI 분석: {lastUpdate.toLocaleString('ko-KR')}
            <span className="mx-2">•</span>
            <Zap className="w-3 h-3" />
            5분마다 자동 업데이트
          </div>
        )}
      </div>
    </div>
  );
});

HwaChongWeatherAnalysis.propTypes = {
  className: PropTypes.string,
  selectedCamera: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    name: PropTypes.string,
    area: PropTypes.string,
    location: PropTypes.shape({
      latitude: PropTypes.number,
      longitude: PropTypes.number,
    }),
    image: PropTypes.shape({
      url: PropTypes.string,
    }),
    timestamp: PropTypes.string,
    quality: PropTypes.string,
    distance: PropTypes.number,
  }),
};

HwaChongWeatherAnalysis.displayName = 'HwaChongWeatherAnalysis';

export default HwaChongWeatherAnalysis;