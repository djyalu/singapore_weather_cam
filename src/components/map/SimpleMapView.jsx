import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { MapPin, Navigation, Zap, AlertTriangle, Camera } from 'lucide-react';
import { COORDINATES } from '../../config/constants';
import { fetchTrafficCameras } from '../../services/trafficCameraService';

/**
 * 간단하고 안정적인 지도 대체 컴포넌트
 * Leaflet 라이브러리 없이 순수 HTML/CSS로 구현
 */
const SimpleMapView = ({ weatherData, selectedRegion = 'all', className = '', onCameraSelect }) => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [mapError, setMapError] = useState(null);
  const [trafficCameras, setTrafficCameras] = useState([]);
  const [showTrafficCameras, setShowTrafficCameras] = useState(true);
  const [isLoadingCameras, setIsLoadingCameras] = useState(false);

  // 디버깅을 위한 로그
  console.log('🗺️ SimpleMapView rendering:', {
    hasWeatherData: !!weatherData,
    selectedRegion,
    weatherDataStructure: weatherData ? Object.keys(weatherData) : null,
    camerasCount: trafficCameras.length,
    isLoadingCameras,
    mapError,
    regionsLength: regions.length
  });

  // 싱가포르 주요 지역 데이터
  const regions = [
    {
      id: 'hwa-chong',
      name: 'Hwa Chong',
      emoji: '🏫',
      coordinates: { lat: 1.3437, lng: 103.7640 },
      position: { top: '45%', left: '35%' },
      description: 'International School Area'
    },
    {
      id: 'newton',
      name: 'Newton',
      emoji: '🏙️',
      coordinates: { lat: 1.3138, lng: 103.8420 },
      position: { top: '55%', left: '50%' },
      description: 'Central Business District'
    },
    {
      id: 'changi',
      name: 'Changi',
      emoji: '✈️',
      coordinates: { lat: 1.3644, lng: 103.9915 },
      position: { top: '40%', left: '80%' },
      description: 'Airport & Eastern Region'
    },
    {
      id: 'jurong',
      name: 'Jurong',
      emoji: '🏭',
      coordinates: { lat: 1.3496, lng: 103.7063 },
      position: { top: '50%', left: '15%' },
      description: 'Industrial & Western Region'
    },
    {
      id: 'central',
      name: 'Central',
      emoji: '🌆',
      coordinates: { lat: 1.3048, lng: 103.8318 },
      position: { top: '60%', left: '55%' },
      description: 'City Center & Orchard'
    },
    {
      id: 'sentosa',
      name: 'Sentosa',
      emoji: '🏖️',
      coordinates: { lat: 1.2494, lng: 103.8303 },
      position: { top: '75%', left: '52%' },
      description: 'Resort Island'
    }
  ];

  // 교통 카메라 데이터 로드
  useEffect(() => {
    const loadCameras = async () => {
      setIsLoadingCameras(true);
      try {
        const cameras = await fetchTrafficCameras();
        
        // 모든 90개 교통 카메라 표시 - 실제 좌표 기반 위치 계산
        const filteredCameras = cameras.map((camera, index) => {
          // 싱가포르 실제 좌표 범위를 지도 비율로 변환
          // 위도: 1.2 ~ 1.47, 경도: 103.6 ~ 104.0
          const latRange = [1.2, 1.47];
          const lngRange = [103.6, 104.0];
          
          let top, left;
          
          if (camera.location?.latitude && camera.location?.longitude) {
            // 실제 좌표가 있는 경우 비례 계산
            const lat = camera.location.latitude;
            const lng = camera.location.longitude;
            
            // 위도를 top 위치로 변환 (위도가 높을수록 북쪽이므로 top은 작아짐)
            top = `${20 + (latRange[1] - lat) / (latRange[1] - latRange[0]) * 60}%`;
            // 경도를 left 위치로 변환
            left = `${15 + (lng - lngRange[0]) / (lngRange[1] - lngRange[0]) * 70}%`;
          } else {
            // 좌표가 없는 경우 그리드 기반 배치
            const cols = 10;
            const rows = Math.ceil(cameras.length / cols);
            const row = Math.floor(index / cols);
            const col = index % cols;
            
            top = `${25 + (row / rows) * 50}%`;
            left = `${20 + (col / cols) * 60}%`;
          }
          
          return {
            ...camera,
            position: { top, left }
          };
        });
        
        setTrafficCameras(filteredCameras);
      } catch (error) {
        console.error('교통 카메라 로드 실패:', error);
        setMapError('교통 카메라 데이터를 불러올 수 없습니다.');
      } finally {
        setIsLoadingCameras(false);
      }
    };

    loadCameras();
  }, []);

  // 날씨 데이터와 지역 매칭
  const getWeatherForRegion = (regionId) => {
    // weatherData가 없거나 locations가 없는 경우 기본값 반환
    if (!weatherData?.locations) {
      return {
        temperature: 29.0,
        humidity: 80,
        rainfall: 0,
        description: 'No Data Available',
        color: 'bg-gray-400 text-white'
      };
    }
    
    // 지역별 기상 관측소 매핑 (WeatherOverlay와 동일한 매핑 사용)
    const stationMapping = {
      'hwa-chong': ['S109', 'S104'],
      'newton': ['S109', 'S107'],
      'changi': ['S24', 'S107'],
      'jurong': ['S104', 'S60'],
      'central': ['S109', 'S106'],
      'sentosa': ['S107', 'S43'] // 동쪽 지역과 통합
    };

    const stationIds = stationMapping[regionId] || [];
    const stationData = stationIds
      .map(id => weatherData.locations.find(loc => loc.station_id === id))
      .filter(Boolean);

    if (stationData.length === 0) return null;

    // 평균값 계산
    const avgTemp = stationData.reduce((sum, station) => sum + (station.temperature || 29), 0) / stationData.length;
    const avgHumidity = stationData.reduce((sum, station) => sum + (station.humidity || 80), 0) / stationData.length;
    const totalRainfall = stationData.reduce((sum, station) => sum + (station.rainfall || 0), 0);

    return {
      temperature: Math.round(avgTemp * 10) / 10,
      humidity: Math.round(avgHumidity),
      rainfall: Math.round(totalRainfall * 10) / 10,
      description: getWeatherDescription(avgTemp, totalRainfall),
      color: getTemperatureColor(avgTemp)
    };
  };

  const getTemperatureColor = (temp) => {
    if (temp >= 32) return 'bg-red-500 text-white';
    if (temp >= 30) return 'bg-orange-500 text-white';
    if (temp >= 28) return 'bg-yellow-500 text-white';
    if (temp >= 26) return 'bg-green-500 text-white';
    return 'bg-blue-500 text-white';
  };

  const getWeatherDescription = (temperature, rainfall) => {
    if (rainfall > 5) return 'Heavy Rain';
    if (rainfall > 0.5) return 'Light Rain';
    if (temperature > 32) return 'Very Hot';
    if (temperature > 28) return 'Hot';
    if (temperature > 24) return 'Warm';
    return 'Pleasant';
  };

  const handleLocationClick = (region) => {
    setSelectedLocation(selectedLocation?.id === region.id ? null : region);
  };

  const handleCameraClick = (camera) => {
    if (onCameraSelect) {
      onCameraSelect(camera);
    }
    console.log('교통 카메라 선택:', camera.name);
  };

  // 컴포넌트가 렌더링되는지 확인
  console.log('🔍 SimpleMapView 상태 체크:', {
    regionsExists: !!regions,
    regionsLength: regions?.length,
    isArray: Array.isArray(regions)
  });

  if (!regions || regions.length === 0) {
    return (
      <div className={`bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded ${className}`}>
        <strong>Error:</strong> 지역 데이터를 로드할 수 없습니다.
        <div className="text-sm mt-2">
          regions: {JSON.stringify(regions)} (length: {regions?.length})
        </div>
      </div>
    );
  }

  // 강제로 기본 렌더링 테스트
  if (mapError) {
    return (
      <div className={`bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded ${className}`}>
        <strong>Map Error:</strong> {mapError}
      </div>
    );
  }

  // 컴포넌트가 렌더링되는지 확인하기 위한 간단한 테스트
  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      {/* 테스트 헤더 */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-4">
        <h2 className="text-xl font-bold">🗺️ SimpleMapView 테스트</h2>
        <p className="text-sm">
          지역: {regions.length}개 | 카메라: {trafficCameras.length}개 | 로딩: {isLoadingCameras ? 'Y' : 'N'}
        </p>
      </div>
      
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Navigation className="w-6 h-6" />
            <div>
              <h3 className="text-lg font-bold">Singapore Weather Map</h3>
              <p className="text-sm opacity-90">Interactive regional weather view</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-90">실시간 데이터</div>
            <div className="text-xs opacity-75">
              {new Date().toLocaleTimeString('ko-KR')}
            </div>
          </div>
        </div>
        
        {/* 교통 카메라 토글 */}
        <div className="flex items-center gap-4 mt-3">
          <label className="flex items-center gap-2 text-sm text-white/90">
            <input
              type="checkbox"
              checked={showTrafficCameras}
              onChange={(e) => setShowTrafficCameras(e.target.checked)}
              className="rounded"
            />
            <Camera className="w-4 h-4" />
            교통 카메라 표시 ({trafficCameras.length})
          </label>
          {isLoadingCameras && (
            <div className="text-xs text-white/70">카메라 로딩 중...</div>
          )}
        </div>
      </div>

      {/* 지도 영역 */}
      <div className="h-96 relative bg-gradient-to-br from-blue-50 to-green-50 overflow-hidden">
        {/* 싱가포르 배경 이미지 스타일 */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-green-100/50">
          {/* 물 영역 표시 */}
          <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-blue-200/30 to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-blue-200/30 to-transparent"></div>
          <div className="absolute top-0 left-0 w-20 h-full bg-gradient-to-r from-blue-200/30 to-transparent"></div>
          <div className="absolute top-0 right-0 w-20 h-full bg-gradient-to-l from-blue-200/30 to-transparent"></div>
          
          {/* 육지 영역 */}
          <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-green-100/30 rounded-full"></div>
        </div>

        {/* 지역 마커들 */}
        {regions.map((region) => {
          const weather = getWeatherForRegion(region.id);
          const isSelected = selectedLocation?.id === region.id;
          
          return (
            <div
              key={region.id}
              className={`
                absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer
                transition-all duration-300 hover:scale-110 z-10
                ${isSelected ? 'scale-125 z-20' : ''}
              `}
              style={{
                top: region.position.top,
                left: region.position.left,
              }}
              onClick={() => handleLocationClick(region)}
              title={`${region.name} - 클릭하여 날씨 정보 보기`}
            >
              {/* 날씨 원형 표시기 */}
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center text-xl
                border-3 border-white shadow-lg transition-all duration-300
                ${weather ? weather.color : 'bg-gray-400 text-white'}
                ${isSelected ? 'ring-4 ring-blue-400 ring-opacity-50' : ''}
              `}>
                {region.emoji}
              </div>
              
              {/* 온도 라벨 */}
              {weather && (
                <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
                  <div className="bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                    {weather.temperature}°C
                  </div>
                </div>
              )}
              
              {/* 호버 툴팁 */}
              <div className="absolute -top-16 left-1/2 transform -translate-x-1/2 opacity-0 hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                <div className="bg-black/90 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap">
                  <div className="font-medium">{region.name}</div>
                  <div className="opacity-75">{region.description}</div>
                </div>
              </div>
            </div>
          );
        })}

        {/* 교통 카메라 마커들 */}
        {showTrafficCameras && trafficCameras.map((camera) => (
          <div
            key={camera.id}
            className={`
              absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer
              transition-all duration-300 hover:scale-110 z-15
            `}
            style={camera.position}
            onClick={() => handleCameraClick(camera)}
            title={`${camera.name} - 클릭하여 상세 보기`}
          >
            {/* 교통 카메라 아이콘 */}
            <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs border-2 border-white shadow-lg bg-orange-500 text-white hover:bg-orange-600 transition-colors">
              📹
            </div>
            
            {/* 카메라 이름 라벨 */}
            <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2">
              <div className="bg-orange-600/90 text-white text-xs px-1.5 py-0.5 rounded whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity">
                {camera.name}
              </div>
            </div>
          </div>
        ))}

        {/* 중심점 표시 (Hwa Chong) */}
        <div 
          className="absolute transform -translate-x-1/2 -translate-y-1/2 z-30"
          style={{ top: '45%', left: '35%' }}
        >
          <div className="w-3 h-3 bg-red-600 rounded-full border-2 border-white shadow-lg animate-pulse"></div>
          <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
            <div className="bg-red-600 text-white text-xs px-2 py-1 rounded font-medium whitespace-nowrap">
              중심점
            </div>
          </div>
        </div>
      </div>

      {/* 선택된 지역 상세 정보 */}
      {selectedLocation && (
        <div className="p-4 bg-blue-50 border-t border-blue-200">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <div className="text-2xl">{selectedLocation.emoji}</div>
              <div>
                <h4 className="font-bold text-lg text-gray-800">{selectedLocation.name}</h4>
                <p className="text-sm text-gray-600">{selectedLocation.description}</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedLocation(null)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              ✕
            </button>
          </div>

          {(() => {
            const weather = getWeatherForRegion(selectedLocation.id);
            if (!weather) {
              return (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-yellow-800">
                    <AlertTriangle className="w-4 h-4" />
                    <span className="text-sm">이 지역의 날씨 데이터를 불러올 수 없습니다.</span>
                  </div>
                </div>
              );
            }

            return (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-orange-500" />
                    <span className="font-medium text-gray-700">온도</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-600">
                    {weather.temperature}°C
                  </div>
                  <div className="text-sm text-gray-500">{weather.description}</div>
                </div>

                <div className="bg-white rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                    <span className="font-medium text-gray-700">습도</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {weather.humidity}%
                  </div>
                  <div className="text-sm text-gray-500">
                    {weather.humidity > 80 ? '높음' : weather.humidity > 60 ? '보통' : '낮음'}
                  </div>
                </div>

                <div className="bg-white rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-4 h-4 rounded-full bg-cyan-500"></div>
                    <span className="font-medium text-gray-700">강수량</span>
                  </div>
                  <div className="text-2xl font-bold text-cyan-600">
                    {weather.rainfall}mm
                  </div>
                  <div className="text-sm text-gray-500">
                    {weather.rainfall > 0 ? '비 내림' : '맑음'}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* 좌표 정보 */}
          <div className="mt-3 pt-3 border-t border-blue-200">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4" />
              <span>
                위치: {selectedLocation.coordinates.lat.toFixed(4)}°N, {selectedLocation.coordinates.lng.toFixed(4)}°E
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 범례 */}
      <div className="p-4 bg-gray-50 border-t">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4 text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-600 rounded-full"></div>
              <span>중심점 (Hwa Chong)</span>
            </div>
            {showTrafficCameras && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span>교통 카메라 ({trafficCameras.length})</span>
              </div>
            )}
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>26°C 이하</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
              <span>26-28°C</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span>28-30°C</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span>30-32°C</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>32°C 이상</span>
            </div>
          </div>
          <div className="text-xs text-gray-500">
            클릭하여 지역별 날씨 또는 교통 카메라 확인
          </div>
        </div>
      </div>
    </div>
  );
};

SimpleMapView.propTypes = {
  weatherData: PropTypes.shape({
    locations: PropTypes.arrayOf(PropTypes.shape({
      station_id: PropTypes.string,
      temperature: PropTypes.number,
      humidity: PropTypes.number,
      rainfall: PropTypes.number,
    })),
  }),
  selectedRegion: PropTypes.string,
  className: PropTypes.string,
  onCameraSelect: PropTypes.func,
};

SimpleMapView.displayName = 'SimpleMapView';

export default SimpleMapView;