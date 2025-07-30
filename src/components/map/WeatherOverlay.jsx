import React, { useMemo } from 'react';
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
  
  // 지역별 날씨 정보를 지도 표시용으로 변환
  const weatherRegions = useMemo(() => {
    if (!weatherData?.locations) return [];

    // 싱가포르 권역별 온도 히트맵 정의 - 더 큰 영역으로 세분화
    const regions = [
      {
        id: 'north',
        name: 'Northern Singapore',
        stationIds: ['S121', 'S118', 'S104'], // Woodlands, North
        coordinates: { lat: 1.4200, lng: 103.7900 },
        emoji: '🌳',
        radius: 4000
      },
      {
        id: 'northwest',
        name: 'Northwest',
        stationIds: ['S104', 'S116', 'S109'], // Bukit Timah, Hwa Chong 지역
        coordinates: { lat: 1.3500, lng: 103.7600 },
        emoji: '🏫',
        radius: 3500
      },
      {
        id: 'central',
        name: 'Central Singapore',
        stationIds: ['S109', 'S106', 'S107'], // Orchard, Newton, CBD
        coordinates: { lat: 1.3100, lng: 103.8300 },
        emoji: '🏙️',
        radius: 3000
      },
      {
        id: 'west',
        name: 'Western Singapore',
        stationIds: ['S104', 'S60', 'S50'], // Jurong, Tuas
        coordinates: { lat: 1.3300, lng: 103.7000 },
        emoji: '🏭',
        radius: 4500
      },
      {
        id: 'east',
        name: 'Eastern Singapore',
        stationIds: ['S24', 'S107', 'S43'], // Changi, East Coast
        coordinates: { lat: 1.3600, lng: 103.9600 },
        emoji: '✈️',
        radius: 4000
      },
      {
        id: 'southeast',
        name: 'Southeast',
        stationIds: ['S24', 'S43', 'S107'], // Bedok, Tampines
        coordinates: { lat: 1.3200, lng: 103.9200 },
        emoji: '🏘️',
        radius: 3500
      },
      {
        id: 'south',
        name: 'Southern Singapore',
        stationIds: ['S109', 'S106', 'S24'], // Marina Bay, CBD, Sentosa
        coordinates: { lat: 1.2700, lng: 103.8500 },
        emoji: '🌊',
        radius: 3000
      }
    ];

    return regions.map(region => {
      // 해당 지역의 스테이션 데이터 찾기
      const stationData = region.stationIds
        .map(stationId => weatherData.locations.find(loc => loc.station_id === stationId))
        .filter(Boolean);

      if (stationData.length > 0) {
        // 여러 스테이션의 평균값 계산
        const avgTemperature = stationData.reduce((sum, station) => sum + (station.temperature || 0), 0) / stationData.length;
        const avgHumidity = stationData.reduce((sum, station) => sum + (station.humidity || 0), 0) / stationData.length;
        const totalRainfall = stationData.reduce((sum, station) => sum + (station.rainfall || 0), 0);

        const weatherDescription = getWeatherDescription(avgTemperature, totalRainfall);
        const weatherIcon = getWeatherIcon(avgTemperature, totalRainfall);

        return {
          ...region,
          temperature: Math.round(avgTemperature * 10) / 10,
          humidity: Math.round(avgHumidity),
          rainfall: Math.round(totalRainfall * 10) / 10,
          description: weatherDescription,
          icon: weatherIcon,
          stationCount: stationData.length,
          color: getTemperatureColor(avgTemperature),
          radius: getRegionRadius(avgTemperature)
        };
      }

      // 데이터가 없는 경우 기본값
      return {
        ...region,
        temperature: 29.0,
        humidity: 80,
        rainfall: 0,
        description: 'No Data',
        icon: '❓',
        stationCount: 0,
        color: '#9CA3AF',
        radius: 1500
      };
    });
  }, [weatherData]);

  // 온도별 색상 반환
  const getTemperatureColor = (temp) => {
    if (temp >= 32) return '#DC2626'; // 빨간색 (매우 뜨거움)
    if (temp >= 30) return '#EA580C'; // 주황색 (뜨거움)
    if (temp >= 28) return '#D97706'; // 노란색 (따뜻함)
    if (temp >= 26) return '#059669'; // 초록색 (쾌적함)
    return '#0284C7'; // 파란색 (시원함)
  };

  // 온도별 영역 크기 반환
  const getRegionRadius = (temp) => {
    // 온도가 높을수록 큰 원
    const baseRadius = 1500;
    const tempFactor = (temp - 26) * 100; // 26도 기준으로 조정
    return Math.max(baseRadius + tempFactor, 800);
  };

  // 날씨 설명 생성
  const getWeatherDescription = (temperature, rainfall) => {
    if (rainfall > 5) return 'Rainy';
    if (rainfall > 0.5) return 'Light Rain';
    if (temperature > 32) return 'Hot';
    if (temperature > 28) return 'Warm';
    if (temperature > 24) return 'Pleasant';
    return 'Cool';
  };

  // 날씨 아이콘 생성
  const getWeatherIcon = (temperature, rainfall) => {
    if (rainfall > 5) return '🌧️';
    if (rainfall > 0.5) return '🌦️';
    if (temperature > 32) return '☀️';
    if (temperature > 28) return '⛅';
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
      {/* 온도 기반 히트맵 레이어 */}
      {showTemperatureLayer && weatherRegions.map(region => (
        <Circle
          key={`temp-circle-${region.id}`}
          center={[region.coordinates.lat, region.coordinates.lng]}
          radius={region.radius}
          pathOptions={{
            fillColor: region.color,
            fillOpacity: 0.15,
            color: region.color,
            weight: 2,
            opacity: 0.8,
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
          zIndexOffset={1000} // 다른 마커들보다 위에 표시
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