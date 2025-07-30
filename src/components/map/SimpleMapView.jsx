import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { MapPin, Navigation, Zap, AlertTriangle, Camera, Thermometer, Droplets } from 'lucide-react';
import { fetchTrafficCameras } from '../../services/trafficCameraService';

/**
 * 개선된 Singapore 지도 컴포넌트
 * 실제 좌표 기반 교통 카메라와 날씨 스테이션 표시
 */
const SimpleMapView = ({ weatherData, selectedRegion = 'all', className = '', onCameraSelect }) => {
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [trafficCameras, setTrafficCameras] = useState([]);
  const [showTrafficCameras, setShowTrafficCameras] = useState(true);
  const [showWeatherStations, setShowWeatherStations] = useState(true);
  const [isLoadingCameras, setIsLoadingCameras] = useState(false);
  const [mapError, setMapError] = useState(null);

  // Singapore 주요 지역 데이터 (실제 좌표)
  const regions = [
    {
      id: 'hwa-chong',
      name: 'Hwa Chong',
      emoji: '🏫',
      coordinates: { lat: 1.3437, lng: 103.7640 },
      position: { top: '45%', left: '35%' },
      description: 'International School'
    },
    {
      id: 'newton',
      name: 'Newton',
      emoji: '🏢',
      coordinates: { lat: 1.3138, lng: 103.8200 },
      position: { top: '50%', left: '42%' },
      description: 'Business District'
    },
    {
      id: 'orchard',
      name: 'Orchard',
      emoji: '🛍️',
      coordinates: { lat: 1.3048, lng: 103.8318 },
      position: { top: '52%', left: '45%' },
      description: 'Shopping District'
    },
    {
      id: 'marina-bay',
      name: 'Marina Bay',
      emoji: '🏙️',
      coordinates: { lat: 1.2859, lng: 103.8594 },
      position: { top: '55%', left: '50%' },
      description: 'Financial District'
    },
    {
      id: 'changi',
      name: 'Changi',
      emoji: '✈️',
      coordinates: { lat: 1.3644, lng: 103.9915 },
      position: { top: '40%', left: '75%' },
      description: 'Airport Area'
    },
    {
      id: 'jurong',
      name: 'Jurong',
      emoji: '🏭',
      coordinates: { lat: 1.3329, lng: 103.7436 },
      position: { top: '47%', left: '25%' },
      description: 'Industrial Area'
    },
    {
      id: 'woodlands',
      name: 'Woodlands',
      emoji: '🌳',
      coordinates: { lat: 1.4382, lng: 103.7890 },
      position: { top: '25%', left: '38%' },
      description: 'Northern Region'
    },
    {
      id: 'tampines',
      name: 'Tampines',
      emoji: '🏘️',
      coordinates: { lat: 1.3496, lng: 103.9568 },
      position: { top: '43%', left: '70%' },
      description: 'Residential Hub'
    }
  ];

  // 교통 카메라 데이터 로드
  useEffect(() => {
    const loadCameras = async () => {
      if (!showTrafficCameras) return;
      
      setIsLoadingCameras(true);
      try {
        const cameras = await fetchTrafficCameras();
        
        // 실제 좌표를 지도 위치로 변환
        const mappedCameras = cameras.slice(0, 25).map((camera) => {
          const latRange = [1.2, 1.47];
          const lngRange = [103.6, 104.0];
          
          let top, left;
          
          if (camera.location?.latitude && camera.location?.longitude) {
            const lat = camera.location.latitude;
            const lng = camera.location.longitude;
            
            // 좌표를 지도 위치로 변환
            top = `${20 + (latRange[1] - lat) / (latRange[1] - latRange[0]) * 60}%`;
            left = `${15 + (lng - lngRange[0]) / (lngRange[1] - lngRange[0]) * 70}%`;
          } else {
            // 랜덤 위치
            top = `${30 + Math.random() * 40}%`;
            left = `${25 + Math.random() * 50}%`;
          }
          
          return {
            ...camera,
            position: { top, left }
          };
        });
        
        setTrafficCameras(mappedCameras);
      } catch (error) {
        console.error('교통 카메라 로드 실패:', error);
        setMapError('교통 카메라 데이터를 불러올 수 없습니다.');
      } finally {
        setIsLoadingCameras(false);
      }
    };

    loadCameras();
  }, [showTrafficCameras]);

  // 날씨 데이터와 지역 매칭
  const getWeatherForRegion = (regionId) => {
    if (!weatherData?.locations) {
      return { temperature: 29.0, humidity: 80, rainfall: 0 };
    }

    const location = weatherData.locations.find(loc => 
      loc.name?.toLowerCase().includes(regionId.replace('-', ' ')) ||
      loc.station_id === regionId
    );

    return location || { temperature: 29.0, humidity: 80, rainfall: 0 };
  };

  // 온도에 따른 색상
  const getTemperatureColor = (temp) => {
    if (temp >= 32) return 'bg-red-500 border-red-600';
    if (temp >= 30) return 'bg-orange-500 border-orange-600';
    if (temp >= 28) return 'bg-yellow-500 border-yellow-600';
    if (temp >= 26) return 'bg-green-500 border-green-600';
    return 'bg-blue-500 border-blue-600';
  };

  const handleLocationClick = (region) => {
    setSelectedLocation(selectedLocation?.id === region.id ? null : region);
  };

  const handleCameraClick = (camera) => {
    if (onCameraSelect) {
      onCameraSelect(camera);
    }
  };

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Navigation className="w-6 h-6" />
            <div>
              <h3 className="text-lg font-bold">Interactive Singapore Map</h3>
              <p className="text-sm opacity-90">Real-time weather stations & traffic cameras</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm opacity-90">실시간 데이터</div>
            <div className="text-xs opacity-75">
              {new Date().toLocaleTimeString('ko-KR')}
            </div>
          </div>
        </div>
        
        {/* 토글 컨트롤 */}
        <div className="flex items-center gap-6 mt-3">
          <label className="flex items-center gap-2 text-sm text-white/90">
            <input
              type="checkbox"
              checked={showWeatherStations}
              onChange={(e) => setShowWeatherStations(e.target.checked)}
              className="rounded"
            />
            <Thermometer className="w-4 h-4" />
            날씨 스테이션 ({regions.length})
          </label>
          <label className="flex items-center gap-2 text-sm text-white/90">
            <input
              type="checkbox"
              checked={showTrafficCameras}
              onChange={(e) => setShowTrafficCameras(e.target.checked)}
              className="rounded"
            />
            <Camera className="w-4 h-4" />
            교통 카메라 ({trafficCameras.length})
          </label>
          {isLoadingCameras && (
            <div className="text-xs text-white/70">카메라 로딩 중...</div>
          )}
        </div>
      </div>

      {/* 지도 영역 */}
      <div className="h-96 relative bg-gradient-to-br from-blue-50 to-green-50 overflow-hidden">
        {/* 싱가포르 배경 스타일 */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-green-100/50">
          {/* 물 영역 (북쪽) */}
          <div className="absolute top-0 left-0 w-full h-20 bg-gradient-to-b from-blue-200/30 to-transparent"></div>
          {/* 물 영역 (남쪽) */}
          <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-blue-200/30 to-transparent"></div>
          {/* 말레이시아 (북쪽 경계) */}
          <div className="absolute top-0 left-0 w-full h-8 bg-green-200/20"></div>
        </div>

        {/* 날씨 스테이션 마커들 */}
        {showWeatherStations && regions.map((region) => {
          const weather = getWeatherForRegion(region.id);
          const isSelected = selectedLocation?.id === region.id;
          
          return (
            <div
              key={region.id}
              className={`
                absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer
                transition-all duration-300 hover:scale-110 z-20
                ${isSelected ? 'scale-125 z-30' : ''}
              `}
              style={region.position}
              onClick={() => handleLocationClick(region)}
              title={`${region.name} - ${weather.temperature}°C`}
            >
              {/* 날씨 스테이션 마커 */}
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                text-white border-2 shadow-lg hover:shadow-xl transition-all
                ${getTemperatureColor(weather.temperature)}
              `}>
                {Math.round(weather.temperature)}°
              </div>
              
              {/* 지역 이름 라벨 */}
              <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2">
                <div className="bg-white/90 backdrop-blur-sm text-gray-800 text-xs px-2 py-1 rounded shadow-md whitespace-nowrap">
                  {region.emoji} {region.name}
                </div>
              </div>
              
              {/* 선택 시 상세 정보 */}
              {isSelected && (
                <div className="absolute -top-20 left-1/2 transform -translate-x-1/2 z-40">
                  <div className="bg-white rounded-lg shadow-xl p-3 border border-gray-200 min-w-[200px]">
                    <div className="font-semibold text-gray-800 mb-2">{region.name}</div>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Thermometer className="w-4 h-4 text-red-500" />
                        <span>{weather.temperature.toFixed(1)}°C</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Droplets className="w-4 h-4 text-blue-500" />
                        <span>{Math.round(weather.humidity)}%</span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">{region.description}</div>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* 교통 카메라 마커들 */}
        {showTrafficCameras && trafficCameras.map((camera) => (
          <div
            key={camera.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 hover:scale-110 z-15"
            style={camera.position}
            onClick={() => handleCameraClick(camera)}
            title={`${camera.name} - 클릭하여 확대 보기`}
          >
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
              📍 Hwa Chong (Center)
            </div>
          </div>
        </div>

        {/* 에러 표시 */}
        {mapError && (
          <div className="absolute top-4 left-4 right-4 bg-yellow-100 border border-yellow-400 text-yellow-700 px-3 py-2 rounded">
            <AlertTriangle className="w-4 h-4 inline mr-2" />
            {mapError}
          </div>
        )}
      </div>

      {/* 범례 */}
      <div className="p-4 bg-gray-50 border-t">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-4 text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-600 rounded-full"></div>
              <span>중심점 (Hwa Chong)</span>
            </div>
            {showWeatherStations && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span>26°C 이하</span>
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span>26-28°C</span>
                <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                <span>28-30°C</span>
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span>30-32°C</span>
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span>32°C+</span>
              </div>
            )}
            {showTrafficCameras && (
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span>교통 카메라 ({trafficCameras.length})</span>
              </div>
            )}
          </div>
          <div className="text-xs text-gray-500">
            클릭하여 날씨 상세 정보 또는 교통 카메라 확인
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
      name: PropTypes.string,
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