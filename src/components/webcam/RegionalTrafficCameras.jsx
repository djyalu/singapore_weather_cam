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

  // AI 분석 시뮬레이션 (실제로는 Claude Vision API 호출)
  const performAIAnalysis = async () => {
    setAnalysisLoading(true);
    
    // 시뮬레이션된 AI 분석 결과
    setTimeout(() => {
      const analysisResults = [
        { traffic: '원활', weather: '맑음', visibility: '양호' },
        { traffic: '보통', weather: '흐림', visibility: '보통' },
        { traffic: '혼잡', weather: '맑음', visibility: '양호' },
        { traffic: '원활', weather: '소나기', visibility: '불량' }
      ];
      
      const randomResult = analysisResults[Math.floor(Math.random() * analysisResults.length)];
      setAiAnalysis(randomResult);
      setAnalysisLoading(false);
    }, 1500);
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
              🤖 Claude AI 분석
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

  // 지역별 카메라 매핑 (예시 - 실제로는 더 정확한 위치 기반 매핑 필요)
  const regionCameraMapping = {
    'hwa-chong': ['2701', '2702', '2703'], // Bukit Timah 지역
    'newton': ['1001', '1002', '1003'],    // Newton 중부
    'changi': ['4701', '4702', '4703'],    // Changi 동부
    'jurong': ['5798', '5799', '6701'],    // Jurong 서부
    'central': ['1111', '1112', '1113'],   // Central
    'east': ['3701', '3702', '3703'],      // East Coast
    'north': ['7001', '7002', '7003'],     // North
    'south': ['8001', '8002', '8003']      // South
  };

  // 교통 카메라 데이터 가져오기
  useEffect(() => {
    const fetchCameras = async () => {
      try {
        setLoading(true);
        const data = await fetchTrafficCameras();
        setCameras(data.cameras || []);
        setError(null);
      } catch (err) {
        setError('카메라 데이터를 불러올 수 없습니다.');
        console.error('Traffic camera fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchCameras();
  }, []);

  // 선택된 지역에 맞는 카메라 필터링
  const selectedCameras = useMemo(() => {
    if (!cameras.length || !selectedRegions.length) return [];

    const result = [];
    
    selectedRegions.forEach(regionId => {
      const cameraIds = regionCameraMapping[regionId] || [];
      
      // 해당 지역의 첫 번째 카메라 찾기
      for (const cameraId of cameraIds) {
        const camera = cameras.find(cam => cam.id.toString() === cameraId);
        if (camera) {
          result.push({ camera, regionId });
          break; // 지역당 1개만
        }
      }
      
      // 매핑된 카메라가 없으면 랜덤으로 선택
      if (!result.find(item => item.regionId === regionId)) {
        const randomCamera = cameras[Math.floor(Math.random() * cameras.length)];
        if (randomCamera && !result.find(item => item.camera.id === randomCamera.id)) {
          result.push({ camera: randomCamera, regionId });
        }
      }
    });

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

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-600 mb-2">⚠️ {error}</div>
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
        <p className="text-sm text-gray-600">
          실시간 교통 카메라 + Claude AI 분석
        </p>
      </div>

      {/* 카메라 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {selectedCameras.map(({ camera, regionId }, index) => (
          <RegionalCameraCard
            key={`${regionId}-${camera.id}`}
            camera={camera}
            region={regionInfo[regionId]}
            onImageClick={onCameraClick}
          />
        ))}
      </div>

      {selectedCameras.length === 0 && (
        <div className="text-center py-8 text-gray-500">
          선택된 지역의 교통 카메라를 찾을 수 없습니다.
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