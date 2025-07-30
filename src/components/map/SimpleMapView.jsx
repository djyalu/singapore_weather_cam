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

  // Singapore 권역별 히트맵 데이터 (WeatherOverlay와 동일)
  const weatherRegions = [
    {
      id: 'north',
      name: 'Northern Singapore',
      stationIds: ['S121', 'S118', 'S104'],
      coordinates: { lat: 1.4200, lng: 103.7900 },
      position: { top: '20%', left: '38%' },
      emoji: '🌳',
      radius: '25%',
      description: 'Woodlands, North'
    },
    {
      id: 'northwest',
      name: 'Northwest',
      stationIds: ['S104', 'S116', 'S109'],
      coordinates: { lat: 1.3500, lng: 103.7600 },
      position: { top: '40%', left: '28%' },
      emoji: '🏫',
      radius: '22%',
      description: 'Bukit Timah, Hwa Chong'
    },
    {
      id: 'central',
      name: 'Central Singapore',
      stationIds: ['S109', 'S106', 'S107'],
      coordinates: { lat: 1.3100, lng: 103.8300 },
      position: { top: '48%', left: '45%' },
      emoji: '🏙️',
      radius: '20%',
      description: 'Orchard, Newton, CBD'
    },
    {
      id: 'west',
      name: 'Western Singapore',
      stationIds: ['S104', 'S60', 'S50'],
      coordinates: { lat: 1.3300, lng: 103.7000 },
      position: { top: '45%', left: '15%' },
      emoji: '🏭',
      radius: '28%',
      description: 'Jurong, Tuas'
    },
    {
      id: 'east',
      name: 'Eastern Singapore',
      stationIds: ['S24', 'S107', 'S43'],
      coordinates: { lat: 1.3600, lng: 103.9600 },
      position: { top: '38%', left: '75%' },
      emoji: '✈️',
      radius: '25%',
      description: 'Changi, East Coast'
    },
    {
      id: 'southeast',
      name: 'Southeast',
      stationIds: ['S24', 'S43', 'S107'],
      coordinates: { lat: 1.3200, lng: 103.9200 },
      position: { top: '50%', left: '70%' },
      emoji: '🏘️',
      radius: '22%',
      description: 'Bedok, Tampines'
    },
    {
      id: 'south',
      name: 'Southern Singapore',
      stationIds: ['S109', 'S106', 'S24'],
      coordinates: { lat: 1.2700, lng: 103.8500 },
      position: { top: '62%', left: '48%' },
      emoji: '🌊',
      radius: '20%',
      description: 'Marina Bay, Sentosa'
    }
  ];

  // 교통 카메라 데이터 로드
  useEffect(() => {
    const loadCameras = async () => {
      if (!showTrafficCameras) return;
      
      setIsLoadingCameras(true);
      setMapError(null);
      
      try {
        console.log('🚗 교통 카메라 데이터 로딩 시작...');
        
        // 직접 API 호출로 단순화 + 캐시 무효화
        const cacheBuster = Date.now();
        const apiUrl = `https://api.data.gov.sg/v1/transport/traffic-images?_=${cacheBuster}`;
        console.log('🌐 API 요청 URL:', apiUrl);
        
        const response = await fetch(apiUrl, {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Singapore-Weather-Cam/1.0'
          }
        });
        
        if (!response.ok) {
          throw new Error(`API 응답 오류: ${response.status} - ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('🔍 API 응답 데이터:', data);
        
        if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
          throw new Error('교통 카메라 데이터가 없습니다');
        }
        
        const latestItem = data.items[0];
        if (!latestItem.cameras || !Array.isArray(latestItem.cameras)) {
          throw new Error('유효하지 않은 카메라 데이터 구조');
        }
        
        const cameras = latestItem.cameras;
        console.log(`📊 총 ${cameras.length}개 카메라 발견`);
        
        // ✅ 전체 90개 카메라를 지도 위치로 변환 (제한 없음)
        console.log(`🎯 처리 시작: 전체 ${cameras.length}개 카메라 매핑 (제한 없음)`);
        
        const mappedCameras = cameras.map((camera, index) => {
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
            id: camera.camera_id,
            name: `Camera ${camera.camera_id}`,
            image_url: camera.image,
            location: camera.location,
            timestamp: camera.timestamp,
            position: { top, left }
          };
        });
        
        console.log(`✅ 매핑 성공: ${mappedCameras.length}개 카메라 매핑 완료 (전체 ${cameras.length}개 중)`);
        console.log('🎉 첫 5개 카메라 샘플:', mappedCameras.slice(0, 5).map(c => c.id));
        console.log('🎉 마지막 5개 카메라 샘플:', mappedCameras.slice(-5).map(c => c.id));
        
        setTrafficCameras(mappedCameras);
        
      } catch (error) {
        console.error('🚨 교통 카메라 로드 실패:', error);
        setMapError(`교통 카메라 데이터 로드 실패: ${error.message}`);
      } finally {
        setIsLoadingCameras(false);
      }
    };

    loadCameras();
  }, [showTrafficCameras]);

  // 권역별 날씨 데이터 매칭 - 개선된 로직
  const getWeatherForRegion = (region) => {
    if (!weatherData?.locations || !Array.isArray(weatherData.locations)) {
      console.log(`❌ ${region.name}: 날씨 데이터 없음`);
      return { temperature: 29.0, humidity: 80, rainfall: 0, stationCount: 0 };
    }

    console.log(`🔍 ${region.name} 분석 시작:`, region.stationIds);

    // 해당 지역의 스테이션 데이터 찾기
    const foundStations = region.stationIds
      .map(stationId => {
        const station = weatherData.locations.find(loc => 
          loc.station_id === stationId || 
          loc.id === stationId ||
          loc.name?.includes(stationId)
        );
        if (station) {
          console.log(`📍 ${stationId} 매칭됨:`, {
            id: station.station_id || station.id,
            temp: station.temperature,
            name: station.name
          });
        } else {
          console.log(`❌ ${stationId} 매칭 실패`);
        }
        return station;
      })
      .filter(Boolean);

    // 온도 유효성 검사 (더 관대한 범위: 15-40도)
    const stationData = foundStations.filter(station => {
      const temp = parseFloat(station.temperature);
      
      // null, undefined, 0 체크
      if (station.temperature === null || station.temperature === undefined || temp === 0) {
        console.warn(`🚫 ${station.station_id || station.id}: null/undefined/0 온도값 제외`);
        return false;
      }

      // 극단적으로 비정상적인 값만 제외 (15-40도 범위)
      const isValidTemp = temp >= 15 && temp <= 40;
      
      if (!isValidTemp) {
        console.warn(`🌡️ ${station.station_id || station.id}: 비정상 온도값 제외 ${station.temperature}°C`);
      }
      
      return isValidTemp;
    });

    console.log(`📊 ${region.name}: ${stationData.length}개 유효한 스테이션 (총 ${region.stationIds.length}개 중)`);

    if (stationData.length > 0) {
      // 여러 스테이션의 평균값 계산 (유효한 값들만)
      const avgTemperature = stationData.reduce((sum, station) => sum + parseFloat(station.temperature), 0) / stationData.length;
      const avgHumidity = stationData.reduce((sum, station) => sum + (parseFloat(station.humidity) || 80), 0) / stationData.length;
      const totalRainfall = stationData.reduce((sum, station) => sum + (parseFloat(station.rainfall) || 0), 0);

      return {
        temperature: Math.round(avgTemperature * 10) / 10,
        humidity: Math.round(avgHumidity),
        rainfall: Math.round(totalRainfall * 10) / 10,
        stationCount: stationData.length
      };
    }

    // 매칭된 스테이션이 없으면 전체 데이터에서 유효한 값 찾기
    console.log(`⚠️ ${region.name}: 매칭된 스테이션 없음, 전체 데이터에서 유효한 값 검색`);
    
    const validLocations = weatherData.locations.filter(loc => {
      const temp = parseFloat(loc.temperature);
      return temp >= 15 && temp <= 40 && temp !== 0; // 더 관대한 범위
    });

    console.log(`🔍 전체 데이터 검색 결과: ${validLocations.length}개 유효 스테이션`);

    if (validLocations.length > 0) {
      const avgTemp = validLocations.reduce((sum, loc) => sum + parseFloat(loc.temperature), 0) / validLocations.length;
      console.log(`✅ ${region.name}: 전체 ${validLocations.length}개 유효 스테이션 평균 ${avgTemp.toFixed(1)}°C 사용`);
      
      return {
        temperature: Math.round(avgTemp * 10) / 10,
        humidity: 80,
        rainfall: 0,
        stationCount: 0
      };
    }

    // 마지막 대안: 전체 데이터 중 0이 아닌 값 아무거나
    const anyValidLocation = weatherData.locations.find(loc => {
      const temp = parseFloat(loc.temperature);
      return temp > 0 && !isNaN(temp);
    });

    if (anyValidLocation) {
      console.log(`🆘 ${region.name}: 임시값 사용 ${anyValidLocation.temperature}°C (스테이션: ${anyValidLocation.station_id || anyValidLocation.id})`);
      return {
        temperature: parseFloat(anyValidLocation.temperature),
        humidity: 80,
        rainfall: 0,
        stationCount: 0
      };
    }

    console.log(`🔄 ${region.name}: 기본값 29.0°C 사용`);
    return { temperature: 29.0, humidity: 80, rainfall: 0, stationCount: 0 };
  };

  // 온도별 색상 - WeatherOverlay와 동일
  const getTemperatureColor = (temp) => {
    if (temp >= 32) return '#EF4444'; // 선명한 빨간색
    if (temp >= 30) return '#F97316'; // 활기찬 주황색
    if (temp >= 28) return '#EAB308'; // 따뜻한 노란색
    if (temp >= 26) return '#22C55E'; // 상쾌한 초록색
    return '#3B82F6'; // 시원한 파란색
  };

  // 온도별 투명도
  const getTemperatureIntensity = (temp) => {
    const normalTemp = 28;
    const deviation = Math.abs(temp - normalTemp);
    const baseIntensity = 0.2;
    const maxIntensity = 0.4;
    
    const intensity = baseIntensity + (deviation / 6) * (maxIntensity - baseIntensity);
    return Math.min(Math.max(intensity, 0.15), maxIntensity);
  };

  // 날씨 설명
  const getWeatherDescription = (temperature, rainfall) => {
    if (rainfall > 5) return 'Rainy';
    if (rainfall > 0.5) return 'Light Rain';
    if (temperature > 32) return 'Hot';
    if (temperature > 28) return 'Warm';
    if (temperature > 24) return 'Pleasant';
    return 'Cool';
  };

  // 날씨 아이콘
  const getWeatherIcon = (temperature, rainfall) => {
    if (rainfall > 5) return '🌧️';
    if (rainfall > 0.5) return '🌦️';
    if (temperature > 32) return '☀️';
    if (temperature > 28) return '⛅';
    return '🌤️';
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
            권역별 히트맵 ({weatherRegions.length}개 권역)
          </label>
          <label className="flex items-center gap-2 text-sm text-white/90">
            <input
              type="checkbox"
              checked={showTrafficCameras}
              onChange={(e) => setShowTrafficCameras(e.target.checked)}
              className="rounded"
            />
            <Camera className="w-4 h-4" />
            교통 카메라 ({trafficCameras.length}개)
          </label>
          {isLoadingCameras && (
            <div className="text-xs text-white/70">카메라 로딩 중...</div>
          )}
        </div>
      </div>

      {/* 지도 영역 - 더 큰 크기와 명확한 배경 */}
      <div className="h-[500px] relative bg-gradient-to-br from-blue-100 to-green-100 overflow-hidden border-2 border-gray-200">
        {/* 싱가포르 배경 스타일 - 더 명확한 시각화 */}
        <div className="absolute inset-0">
          {/* 기본 배경 - 연한 회색 (육지) */}
          <div className="absolute inset-0 bg-gray-100"></div>
          
          {/* 물 영역 (북쪽 - 조호르 해협) */}
          <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-blue-300/60 to-blue-200/30"></div>
          
          {/* 물 영역 (남쪽 - 싱가포르 해협) */}
          <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-t from-blue-300/60 to-blue-200/30"></div>
          
          {/* 말레이시아 (북쪽 경계) */}
          <div className="absolute top-0 left-0 w-full h-12 bg-green-300/40"></div>
          
          {/* 싱가포르 본섬 강조 */}
          <div className="absolute top-1/4 left-1/4 w-1/2 h-1/2 bg-green-100/60 rounded-lg"></div>
          
          {/* 격자 패턴으로 지도 느낌 추가 */}
          <div className="absolute inset-0 opacity-10" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(0,0,0,0.3) 1px, transparent 0)',
            backgroundSize: '20px 20px'
          }}></div>
        </div>

        {/* 권역별 히트맵 레이어 */}
        {showWeatherStations && weatherRegions.map((region) => {
          const weather = getWeatherForRegion(region);
          const color = getTemperatureColor(weather.temperature);
          const intensity = getTemperatureIntensity(weather.temperature);
          const description = getWeatherDescription(weather.temperature, weather.rainfall);
          const icon = getWeatherIcon(weather.temperature, weather.rainfall);
          const isSelected = selectedLocation?.id === region.id;
          
          return (
            <div key={region.id}>
              {/* 히트맵 원형 레이어 */}
              <div
                className="absolute transform -translate-x-1/2 -translate-y-1/2 rounded-full border-2 transition-all duration-300 hover:scale-105"
                style={{
                  ...region.position,
                  width: region.radius,
                  height: region.radius,
                  backgroundColor: color,
                  opacity: intensity,
                  borderColor: color,
                  borderStyle: 'dashed',
                  zIndex: 10
                }}
              />
              
              {/* 중심 온도 표시 아이콘 */}
              <div
                className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 hover:scale-110 z-20 ${isSelected ? 'scale-125 z-30' : ''}`}
                style={region.position}
                onClick={() => handleLocationClick(region)}
                title={`${region.name} - ${weather.temperature}°C`}
              >
                {/* 날씨 아이콘과 온도 */}
                <div 
                  className="w-12 h-12 rounded-full flex flex-col items-center justify-center text-white border-2 shadow-lg hover:shadow-xl transition-all"
                  style={{ backgroundColor: color, borderColor: color }}
                >
                  <span className="text-lg">{icon}</span>
                  <span className="text-xs font-bold">{Math.round(weather.temperature)}°</span>
                </div>
                
                {/* 지역 이름 라벨 */}
                <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2">
                  <div className="bg-white/90 backdrop-blur-sm text-gray-800 text-xs px-2 py-1 rounded shadow-md whitespace-nowrap">
                    {region.emoji} {region.name}
                  </div>
                </div>
                
                {/* 선택 시 상세 정보 */}
                {isSelected && (
                  <div className="absolute -top-32 left-1/2 transform -translate-x-1/2 z-40">
                    <div className="bg-white rounded-lg shadow-xl p-4 border border-gray-200 min-w-[240px]">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xl">{region.emoji}</span>
                        <div className="font-semibold text-gray-800">{region.name}</div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <div className="bg-gray-50 p-2 rounded">
                          <div className="font-medium text-gray-600 text-xs">Temperature</div>
                          <div className="text-lg font-bold" style={{ color }}>
                            {weather.temperature}°C
                          </div>
                        </div>
                        <div className="bg-gray-50 p-2 rounded">
                          <div className="font-medium text-gray-600 text-xs">Humidity</div>
                          <div className="text-lg font-bold text-blue-600">
                            {weather.humidity}%
                          </div>
                        </div>
                      </div>
                      
                      <div className="bg-gray-50 p-2 rounded mb-2">
                        <div className="font-medium text-gray-600 text-xs">Weather</div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-lg">{icon}</span>
                          <span className="font-medium">{description}</span>
                        </div>
                      </div>

                      {weather.rainfall > 0 && (
                        <div className="bg-blue-50 p-2 rounded mb-2">
                          <div className="font-medium text-blue-600 text-xs">Rainfall</div>
                          <div className="text-lg font-bold text-blue-700">
                            {weather.rainfall}mm
                          </div>
                        </div>
                      )}

                      <div className="text-xs text-gray-500 pt-2 border-t">
                        📡 {weather.stationCount} weather station{weather.stationCount !== 1 ? 's' : ''} • {region.description}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* 교통 카메라 마커들 - 90개 모두 표시 */}
        {showTrafficCameras && trafficCameras.map((camera) => (
          <div
            key={camera.id}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-200 hover:scale-125 z-15"
            style={camera.position}
            onClick={() => handleCameraClick(camera)}
            title={`카메라 ${camera.id} - 클릭하여 확대 보기`}
          >
            {/* 더 작은 카메라 아이콘 */}
            <div className="w-4 h-4 rounded-full flex items-center justify-center text-xs border border-white shadow-md bg-orange-500 text-white hover:bg-orange-600 transition-all hover:w-5 hover:h-5">
              📹
            </div>
            
            {/* 호버 시에만 카메라 ID 표시 */}
            <div className="absolute -bottom-5 left-1/2 transform -translate-x-1/2">
              <div className="bg-orange-600/90 text-white text-xs px-1 py-0.5 rounded whitespace-nowrap opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                {camera.id}
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

      {/* 범례 및 컨트롤 */}
      <div className="p-4 bg-gray-50 border-t">
        <div className="space-y-3">
          {/* 온도 범례 */}
          {showWeatherStations && (
            <div className="bg-white rounded-lg p-3 border border-gray-200">
              <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                <Thermometer className="w-4 h-4 text-red-500" />
                온도별 색상 범례
              </h4>
              <div className="flex items-center gap-4 text-sm flex-wrap">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#3B82F6' }}></div>
                  <span>26°C 이하 (시원함)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#22C55E' }}></div>
                  <span>26-28°C (쾌적함)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#EAB308' }}></div>
                  <span>28-30°C (따뜻함)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#F97316' }}></div>
                  <span>30-32°C (뜨거움)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-full" style={{ backgroundColor: '#EF4444' }}></div>
                  <span>32°C+ (매우 뜨거움)</span>
                </div>
              </div>
            </div>
          )}

          {/* 기능 설명 */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-600 rounded-full animate-pulse"></div>
                <span>중심점 (Hwa Chong)</span>
              </div>
              {showTrafficCameras && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                  <span>교통 카메라 ({trafficCameras.length}개)</span>
                </div>
              )}
              {showWeatherStations && (
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-red-500 rounded-full"></div>
                  <span>권역별 히트맵 ({weatherRegions.length}개 권역)</span>
                </div>
              )}
            </div>
            <div className="text-xs text-gray-500">
              히트맵 클릭 → 상세 날씨 정보 | 카메라 클릭 → 실시간 영상
            </div>
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