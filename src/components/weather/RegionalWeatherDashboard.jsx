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
  // 3개 주요 지역 설정 (Hwa Chong 우선)
  const PRIORITY_REGIONS = [
    {
      id: 'hwa-chong',
      name: 'Hwa Chong',
      stationIds: ['S116', 'S121'], // Bukit Timah 지역
      description: 'Hwa Chong International School 지역'
    },
    {
      id: 'newton',
      name: 'Newton',
      stationIds: ['S117', 'S109'], // Newton 지역
      description: 'Newton MRT 및 Orchard 인근'
    },
    {
      id: 'changi',
      name: 'Changi',
      stationIds: ['S24', 'S107'], // East 지역
      description: 'Changi Airport 및 동부 지역'
    }
  ];

  // 지역별 날씨 데이터 가져오기
  const getRegionalWeatherData = useMemo(() => {
    if (!weatherData?.locations) return {};

    const regionalData = {};

    PRIORITY_REGIONS.forEach(region => {
      // 해당 지역의 스테이션 데이터 찾기
      const stationData = region.stationIds
        .map(stationId => weatherData.locations.find(loc => loc.station_id === stationId))
        .filter(Boolean);

      if (stationData.length > 0) {
        // 여러 스테이션의 평균값 계산
        const avgTemperature = stationData.reduce((sum, station) => sum + (station.temperature || 0), 0) / stationData.length;
        const avgHumidity = stationData.reduce((sum, station) => sum + (station.humidity || 0), 0) / stationData.length;
        const totalRainfall = stationData.reduce((sum, station) => sum + (station.rainfall || 0), 0);

        // 대표 스테이션 정보
        const primaryStation = stationData[0];
        const stationInfo = getStationInfo(primaryStation.station_id);

        regionalData[region.id] = {
          region: region.name,
          temperature: avgTemperature,
          humidity: avgHumidity,
          rainfall: totalRainfall,
          windDirection: weatherData.current?.windDirection,
          stationName: stationInfo?.name || primaryStation.name,
          stationCount: stationData.length,
          lastUpdate: weatherData.timestamp
        };
      } else {
        // 데이터가 없는 경우 평균 데이터 사용
        regionalData[region.id] = {
          region: region.name,
          temperature: weatherData.current?.temperature,
          humidity: weatherData.current?.humidity,
          rainfall: weatherData.current?.rainfall || 0,
          windDirection: weatherData.current?.windDirection,
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