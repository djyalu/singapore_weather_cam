import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import RegionalWeatherCard from './RegionalWeatherCard';
import { getStationInfo } from '../../config/weatherStations';

/**
 * 지역별 날씨 대시보드 컴포넌트
 * 3개 주요 지역의 날씨 정보를 카드보드 형태로 표시
 */
const RegionalWeatherDashboard = React.memo(({
  weatherData,
  onRegionSelect,
  activeRegion = 'hwa-chong',
  className = ''
}) => {
  // 3개 주요 지역 설정 (실제 온도 데이터가 있는 스테이션 기준)
  const PRIORITY_REGIONS = [
    {
      id: 'hwa-chong',
      name: 'Hwa Chong',
      stationIds: ['S50', 'S115'], // Clementi & West 지역 (Bukit Timah 인근)
      description: 'Hwa Chong International School 지역'
    },
    {
      id: 'newton',
      name: 'Newton',
      stationIds: ['S109', 'S102'], // Newton & Central 지역
      description: 'Newton MRT 및 Central 지역'
    },
    {
      id: 'changi',
      name: 'Changi',
      stationIds: ['S24', 'S107'], // East Coast & Airport 지역
      description: 'Changi Airport 및 동부 지역'
    }
  ];

  // 지역별 날씨 데이터 가져오기 (NEA 데이터 구조에 맞춤)
  const getRegionalWeatherData = useMemo(() => {
    if (!weatherData?.data) return {};

    const regionalData = {};
    const tempReadings = weatherData.data.temperature?.readings || [];
    const humidityReadings = weatherData.data.humidity?.readings || [];
    const rainfallReadings = weatherData.data.rainfall?.readings || [];

    PRIORITY_REGIONS.forEach(region => {
      // 해당 지역의 스테이션 온도 데이터 찾기
      const stationTemps = region.stationIds
        .map(stationId => tempReadings.find(reading => reading.station === stationId))
        .filter(Boolean);
      
      // 해당 지역의 스테이션 습도 데이터 찾기
      const stationHumidity = region.stationIds
        .map(stationId => humidityReadings.find(reading => reading.station === stationId))
        .filter(Boolean);

      // 해당 지역의 스테이션 강우량 데이터 찾기
      const stationRainfall = region.stationIds
        .map(stationId => rainfallReadings.find(reading => reading.station === stationId))
        .filter(Boolean);

      if (stationTemps.length > 0 || stationHumidity.length > 0) {
        // 여러 스테이션의 평균값 계산
        const avgTemperature = stationTemps.length > 0 
          ? stationTemps.reduce((sum, reading) => sum + (reading.value || 0), 0) / stationTemps.length
          : weatherData.data.temperature?.average || null;

        const avgHumidity = stationHumidity.length > 0
          ? stationHumidity.reduce((sum, reading) => sum + (reading.value || 0), 0) / stationHumidity.length
          : weatherData.data.humidity?.average || null;

        const totalRainfall = stationRainfall.length > 0
          ? stationRainfall.reduce((sum, reading) => sum + (reading.value || 0), 0)
          : 0;

        // 대표 스테이션 정보
        const primaryStationId = stationTemps.length > 0 ? stationTemps[0].station : region.stationIds[0];
        const stationInfo = getStationInfo(primaryStationId);

        regionalData[region.id] = {
          region: region.name,
          temperature: avgTemperature,
          humidity: avgHumidity,
          rainfall: totalRainfall,
          windDirection: weatherData.data.forecast?.general?.wind?.direction || '--',
          stationName: stationInfo?.name || `Station ${primaryStationId}`,
          stationCount: Math.max(stationTemps.length, stationHumidity.length),
          lastUpdate: weatherData.timestamp
        };
      } else {
        // 데이터가 없는 경우 전체 평균 데이터 사용
        regionalData[region.id] = {
          region: region.name,
          temperature: weatherData.data.temperature?.average || null,
          humidity: weatherData.data.humidity?.average || null,
          rainfall: weatherData.data.rainfall?.total || 0,
          windDirection: weatherData.data.forecast?.general?.wind?.direction || '--',
          stationName: '평균 데이터',
          stationCount: 0,
          lastUpdate: weatherData.timestamp
        };
      }
    });

    return regionalData;
  }, [weatherData]);

  // 업데이트 시간 포맷팅
  const formatLastUpdate = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const updateTime = new Date(timestamp);
      const now = new Date();
      const diffMinutes = Math.floor((now - updateTime) / (1000 * 60));
      
      if (diffMinutes < 1) return '방금 전';
      if (diffMinutes < 60) return `${diffMinutes}분 전`;
      
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours}시간 전`;
      
      return updateTime.toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return '';
    }
  };

  const handleRegionClick = (regionId) => {
    onRegionSelect?.(regionId);
  };

  return (
    <div className={`${className}`}>
      {/* 헤더 */}
      <div className="mb-4">
        <h2 className="text-lg font-bold text-gray-800 mb-1">
          🌏 주요 지역 날씨
        </h2>
        <p className="text-sm text-gray-600">
          실시간 기상 관측 데이터 (Hwa Chong 중심)
        </p>
      </div>

      {/* 지역별 날씨 카드 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PRIORITY_REGIONS.map(region => {
          const data = getRegionalWeatherData[region.id];
          
          if (!data) return null;

          return (
            <RegionalWeatherCard
              key={region.id}
              region={data.region}
              temperature={data.temperature}
              humidity={data.humidity}
              rainfall={data.rainfall}
              windDirection={data.windDirection}
              stationName={data.stationName}
              isActive={activeRegion === region.id}
              onClick={() => handleRegionClick(region.id)}
              lastUpdate={formatLastUpdate(data.lastUpdate)}
              className="min-h-[200px]"
            />
          );
        })}
      </div>

      {/* 추가 정보 */}
      <div className="mt-4 p-3 bg-blue-50/50 rounded-lg border border-blue-200/50">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-blue-700">
            <span>ℹ️</span>
            <span>지역을 클릭하면 상세 정보를 볼 수 있습니다</span>
          </div>
          <div className="text-blue-600 text-xs">
            NEA Singapore 공식 데이터
          </div>
        </div>
      </div>
    </div>
  );
});

RegionalWeatherDashboard.propTypes = {
  weatherData: PropTypes.shape({
    locations: PropTypes.array,
    current: PropTypes.object,
    timestamp: PropTypes.string,
  }),
  onRegionSelect: PropTypes.func,
  activeRegion: PropTypes.string,
  className: PropTypes.string,
};

RegionalWeatherDashboard.displayName = 'RegionalWeatherDashboard';

export default RegionalWeatherDashboard;