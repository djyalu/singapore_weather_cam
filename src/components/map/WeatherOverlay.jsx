import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Circle, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';

/**
 * 지도 위에 지역별 날씨 정보를 오버레이로 표시하는 컴포넌트
 * - 온도 기반 컬러 서클 (히트맵)
 * - 날씨 상태 아이콘
 * - 인터랙티브 팝업
 */
const WeatherOverlay = React.memo(({ weatherData, showTemperatureLayer = true, showWeatherIcons = true, className = '' }) => {
  const [weatherRegions, setWeatherRegions] = useState([]);

  // 지역 데이터 계산 함수
  const calculateWeatherRegions = useCallback(() => {
    // 안전하게 글로벌 window.weatherData 접근 (티커와 동일한 소스)
    let globalWeatherData = null;
    try {
      globalWeatherData = typeof window !== 'undefined' ? window.weatherData : null;
    } catch (error) {
      console.warn('⚠️ [WeatherOverlay] Global data access failed:', error);
      globalWeatherData = null;
    }
    
    // 강제로 글로벌 데이터만 사용 (티커와 완전 동일한 소스)
    const dataToUse = globalWeatherData;
    
    if (!globalWeatherData) {
      console.warn('🗺️ [WeatherOverlay] 글로벌 데이터 없음 - 지도 표시 안함');
      return [];
    }
    
    console.log('🗺️ [WeatherOverlay] 데이터 소스:', globalWeatherData ? 'GLOBAL (티커와 동일)' : 'PROPS (폴백)');
    console.log('🗺️ [WeatherOverlay] 온도 데이터 확인:', {
      globalTemp: globalWeatherData?.data?.temperature?.average,
      propsTemp: weatherData?.data?.temperature?.average,
      usingTemp: dataToUse?.data?.temperature?.average,
      globalTimestamp: globalWeatherData?.timestamp,
      propsTimestamp: weatherData?.timestamp,
      globalReadings: globalWeatherData?.data?.temperature?.readings?.length,
      propsReadings: weatherData?.data?.temperature?.readings?.length
    });
    
    if (!dataToUse?.locations) {return [];}

    // 실제 데이터 기반 동적 지역 생성 - 좌표를 기준으로 자동 그룹핑
    const regions = [];

    // 실제 사용 가능한 스테이션들을 지역별로 그룹핑 - 티커와 동일한 데이터
    const availableStations = dataToUse.locations.filter(
      loc => loc.coordinates && loc.temperature !== null && loc.temperature !== undefined,
    );

    if (availableStations.length === 0) {return [];}

    // 지리적 위치 기반 지역 정의 (중복 제거된 명확한 경계)
    const regionalGroups = [
      {
        id: 'north',
        name: 'Northern Singapore',
        center: { lat: 1.43, lng: 103.79 },
        emoji: '🌳',
        bounds: { north: 1.50, south: 1.40, east: 103.85, west: 103.68 },
        radius: 4000,
      },
      {
        id: 'northwest',
        name: 'Northwest (Bukit Timah)',
        center: { lat: 1.35, lng: 103.76 },
        emoji: '🏫',
        bounds: { north: 1.40, south: 1.32, east: 103.80, west: 103.68 },
        radius: 3500,
      },
      {
        id: 'west',
        name: 'Western Singapore',
        center: { lat: 1.33, lng: 103.65 },
        emoji: '🏭',
        bounds: { north: 1.40, south: 1.26, east: 103.68, west: 103.60 },
        radius: 4500,
      },
      {
        id: 'central',
        name: 'Central Singapore',
        center: { lat: 1.31, lng: 103.83 },
        emoji: '🏙️',
        bounds: { north: 1.35, south: 1.26, east: 103.88, west: 103.80 },
        radius: 3000,
      },
      {
        id: 'east',
        name: 'Eastern Singapore',
        center: { lat: 1.36, lng: 103.96 },
        emoji: '✈️',
        bounds: { north: 1.42, south: 1.30, east: 104.10, west: 103.88 },
        radius: 4000,
      },
      {
        id: 'south',
        name: 'Southern Singapore',
        center: { lat: 1.25, lng: 103.85 },
        emoji: '🌊',
        bounds: { north: 1.30, south: 1.20, east: 103.95, west: 103.75 },
        radius: 3000,
      },
    ];

    // 각 지역에 해당하는 스테이션 찾기
    return regionalGroups.map(region => {
      const regionStations = availableStations.filter(station => {
        const { lat, lng } = station.coordinates;
        const { bounds } = region;
        return lat >= bounds.south && lat <= bounds.north &&
               lng >= bounds.west && lng <= bounds.east;
      });

      if (regionStations.length > 0) {
        // 실제 데이터 기반 평균값 계산
        const avgTemperature = regionStations.reduce((sum, station) => sum + station.temperature, 0) / regionStations.length;
        const avgHumidity = regionStations.reduce((sum, station) => sum + (station.humidity || 0), 0) / regionStations.length;
        const totalRainfall = regionStations.reduce((sum, station) => sum + (station.rainfall || 0), 0);

        const weatherDescription = getWeatherDescription(avgTemperature, totalRainfall);
        const weatherIcon = getWeatherIcon(avgTemperature, totalRainfall);

        const regionResult = {
          ...region,
          coordinates: region.center,
          temperature: Math.round(avgTemperature * 10) / 10,
          humidity: Math.round(avgHumidity),
          rainfall: Math.round(totalRainfall * 10) / 10,
          description: weatherDescription,
          icon: weatherIcon,
          stationCount: regionStations.length,
          stationIds: regionStations.map(s => s.station_id || s.id),
          color: getTemperatureColor(avgTemperature),
          radius: region.radius,
          intensity: getTemperatureIntensity(avgTemperature),
        };
        
        console.log(`🗺️ [WeatherOverlay] ${region.name} 지역 온도: ${regionResult.temperature}°C (${regionStations.length}개 스테이션)`);
        return regionResult;
      }

      // 해당 지역에 스테이션이 없으면 null 반환 (필터링됨)
      return null;
    }).filter(Boolean); // null 값 제거
    
    return regions;
  }, []);

  // 지역별 날씨 정보를 지도 표시용으로 변환 - Single Source of Truth 사용
  useEffect(() => {
    const regions = calculateWeatherRegions();
    setWeatherRegions(regions);
  }, [calculateWeatherRegions, showTemperatureLayer, showWeatherIcons]); // 레이어 설정 변경 시에도 업데이트

  // 글로벌 데이터 변경 감지 (2초마다 체크)
  useEffect(() => {
    const interval = setInterval(() => {
      const newRegions = calculateWeatherRegions();
      console.log('🗺️ [WeatherOverlay] 정기 체크 - 지역 수:', newRegions.length);
      if (newRegions.length > 0) {
        console.log('🗺️ [WeatherOverlay] 글로벌 데이터 변경 감지 - 히트맵 업데이트');
        setWeatherRegions(newRegions);
      }
    }, 2000); // 2초로 단축

    return () => clearInterval(interval);
  }, [calculateWeatherRegions]);

  // 컴포넌트 마운트 시 즉시 실행
  useEffect(() => {
    console.log('🗺️ [WeatherOverlay] 컴포넌트 마운트 - 즉시 데이터 로드');
    const regions = calculateWeatherRegions();
    setWeatherRegions(regions);
  }, [calculateWeatherRegions]);

  // 온도별 색상 반환 - 더 생동감 있는 색상
  const getTemperatureColor = (temp) => {
    if (temp >= 32) {return '#EF4444';} // 선명한 빨간색 (매우 뜨거움)
    if (temp >= 30) {return '#F97316';} // 활기찬 주황색 (뜨거움)
    if (temp >= 28) {return '#EAB308';} // 따뜻한 노란색 (따뜻함)
    if (temp >= 26) {return '#22C55E';} // 상쾌한 초록색 (쾌적함)
    return '#3B82F6'; // 시원한 파란색 (시원함)
  };

  // 온도별 투명도 반환 - 온도가 극단적일수록 더 진하게
  const getTemperatureIntensity = (temp) => {
    const normalTemp = 28; // 기준 온도
    const deviation = Math.abs(temp - normalTemp);
    const baseIntensity = 0.2;
    const maxIntensity = 0.4;

    // 편차가 클수록 더 진한 색상
    const intensity = baseIntensity + (deviation / 6) * (maxIntensity - baseIntensity);
    return Math.min(Math.max(intensity, 0.15), maxIntensity);
  };

  // 온도별 영역 크기 반환
  const getRegionRadius = (temp) => {
    // 온도가 높을수록 큰 원
    const baseRadius = 2000;
    const tempFactor = (temp - 26) * 150; // 26도 기준으로 조정
    return Math.max(baseRadius + tempFactor, 1000);
  };

  // 날씨 설명 생성
  const getWeatherDescription = (temperature, rainfall) => {
    if (rainfall > 5) {return 'Rainy';}
    if (rainfall > 0.5) {return 'Light Rain';}
    if (temperature > 32) {return 'Hot';}
    if (temperature > 28) {return 'Warm';}
    if (temperature > 24) {return 'Pleasant';}
    return 'Cool';
  };

  // 날씨 아이콘 생성
  const getWeatherIcon = (temperature, rainfall) => {
    if (rainfall > 5) {return '🌧️';}
    if (rainfall > 0.5) {return '🌦️';}
    if (temperature > 32) {return '☀️';}
    if (temperature > 28) {return '⛅';}
    return '🌤️';
  };

  // 날씨 아이콘용 마커 생성 (CSS 안전 버전)
  const createWeatherIconMarker = (region) => {
    return L.divIcon({
      html: `<div style="
               width: 48px; 
               height: 48px; 
               background-color: rgba(255,255,255,0.9); 
               border: 2px solid ${region.color}; 
               border-radius: 50%; 
               display: flex; 
               align-items: center; 
               justify-content: center; 
               font-size: 20px; 
               box-shadow: 0 4px 8px rgba(0,0,0,0.2);
               position: relative;
             ">
               <span>${region.icon}</span>
               <div style="
                 position: absolute; 
                 bottom: -20px; 
                 left: 50%; 
                 transform: translateX(-50%); 
                 background: rgba(0,0,0,0.8); 
                 color: white; 
                 font-size: 10px; 
                 padding: 2px 6px; 
                 border-radius: 3px; 
                 white-space: nowrap;
               ">
                 ${region.temperature}°C
               </div>
             </div>`,
      className: 'weather-icon-div-icon',
      iconSize: [48, 60], // 높이 증가 (온도 라벨 공간)
      iconAnchor: [24, 30],
    });
  };

  if (!weatherData?.locations || weatherRegions.length === 0) {
    return null;
  }

  return (
    <>
      {/* 온도 기반 히트맵 레이어 - 권역별 색상 표현 */}
      {showTemperatureLayer && weatherRegions.map(region => (
        <Circle
          key={`temp-circle-${region.id}`}
          center={[region.coordinates.lat, region.coordinates.lng]}
          radius={region.radius}
          pathOptions={{
            fillColor: region.color,
            fillOpacity: region.intensity || 0.25, // 동적 투명도
            color: region.color,
            weight: 3,
            opacity: 0.7,
            dashArray: '5, 5', // 점선 테두리로 부드러운 느낌
            interactive: false, // 클릭 이벤트 비활성화
          }}
          eventHandlers={{
            click: (e) => {
              // 클릭 이벤트 전파 방지
              e.originalEvent.stopPropagation();
            },
          }}
        >
          <Popup>
            <div className="p-3 min-w-48">
              <h3 className="font-bold text-lg text-gray-800 mb-2 flex items-center gap-2">
                <span>{region.emoji}</span>
                <span>{region.name} 지역</span>
              </h3>

              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="font-medium text-gray-600">온도</div>
                    <div className="text-lg font-bold" style={{ color: region.color }}>
                      {region.temperature}°C
                    </div>
                  </div>
                  <div className="bg-gray-50 p-2 rounded">
                    <div className="font-medium text-gray-600">습도</div>
                    <div className="text-lg font-bold text-blue-600">
                      {region.humidity}%
                    </div>
                  </div>
                </div>

                <div className="bg-gray-50 p-2 rounded">
                  <div className="font-medium text-gray-600">날씨 상태</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xl">{region.icon}</span>
                    <span className="font-medium">{region.description}</span>
                  </div>
                </div>

                {region.rainfall > 0 && (
                  <div className="bg-blue-50 p-2 rounded">
                    <div className="font-medium text-blue-600">강수량</div>
                    <div className="text-lg font-bold text-blue-700">
                      {region.rainfall}mm
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500 pt-2 border-t">
                  데이터 출처: {region.stationCount}개 관측소 평균
                </div>
              </div>
            </div>
          </Popup>
        </Circle>
      ))}

      {/* 날씨 아이콘 레이어 */}
      {showWeatherIcons && weatherRegions.map(region => (
        <Marker
          key={`weather-icon-${region.id}`}
          position={[region.coordinates.lat, region.coordinates.lng]}
          icon={createWeatherIconMarker(region)}
          zIndexOffset={150} // 교통 카메라보다 낮게 설정
          eventHandlers={{
            click: (e) => {
              // 기본 클릭 이벤트 허용 (팝업 표시)
              e.originalEvent.stopPropagation();
            },
          }}
        >
          <Popup>
            <div className="p-3 min-w-48">
              <h3 className="font-bold text-lg text-gray-800 mb-2 flex items-center gap-2">
                <span>{region.emoji}</span>
                <span>{region.name} 실시간 날씨</span>
              </h3>

              <div className="space-y-3">
                {/* 주요 날씨 정보 */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-3 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-3xl">{region.icon}</span>
                    <div className="text-right">
                      <div className="text-2xl font-bold" style={{ color: region.color }}>
                        {region.temperature}°C
                      </div>
                      <div className="text-sm text-gray-600">{region.description}</div>
                    </div>
                  </div>
                </div>

                {/* 상세 정보 */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex justify-between">
                    <span>습도:</span>
                    <span className="font-medium text-blue-600">{region.humidity}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>강수량:</span>
                    <span className="font-medium text-gray-700">{region.rainfall}mm</span>
                  </div>
                </div>

                <div className="text-xs text-gray-500 pt-2 border-t">
                  📡 {region.stationCount}개 기상관측소 실시간 데이터
                </div>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </>
  );
});

WeatherOverlay.propTypes = {
  weatherData: PropTypes.shape({
    locations: PropTypes.arrayOf(PropTypes.shape({
      station_id: PropTypes.string,
      temperature: PropTypes.number,
      humidity: PropTypes.number,
      rainfall: PropTypes.number,
    })),
  }),
  showTemperatureLayer: PropTypes.bool,
  showWeatherIcons: PropTypes.bool,
  className: PropTypes.string,
};

WeatherOverlay.displayName = 'WeatherOverlay';

export default WeatherOverlay;