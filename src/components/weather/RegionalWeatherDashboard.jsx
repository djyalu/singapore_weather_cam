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
  // 사용 가능한 모든 지역 (실제 온도 데이터가 있는 스테이션 기준)
  const AVAILABLE_REGIONS = [
    {
      id: 'hwa-chong',
      name: 'Hwa Chong',
      stationIds: ['S50', 'S115'], // Clementi & West 지역 (Bukit Timah 인근)
      description: 'Hwa Chong International School 지역',
      emoji: '🏫'
    },
    {
      id: 'newton',
      name: 'Newton',
      stationIds: ['S109', 'S102'], // Newton & Central 지역
      description: 'Newton MRT 및 Central 지역',
      emoji: '🏙️'
    },
    {
      id: 'changi',
      name: 'Changi',
      stationIds: ['S24', 'S107'], // East Coast & Airport 지역
      description: 'Changi Airport 및 동부 지역',
      emoji: '✈️'
    },
    {
      id: 'jurong',
      name: 'Jurong',
      stationIds: ['S104', 'S60'], // Jurong West & Sentosa
      description: 'Jurong 산업단지 및 서부 지역',
      emoji: '🏭'
    },
    {
      id: 'central',
      name: 'Central',
      stationIds: ['S43', 'S109'], // Kim Chuan & Newton
      description: 'Central Singapore 도심 지역',
      emoji: '🌆'
    }
  ];

  // 선택된 지역 상태 (기본값: Hwa Chong, Newton, Changi)
  const [selectedRegions, setSelectedRegions] = useState(['hwa-chong', 'newton', 'changi']);

  // 지역별 날씨 데이터 가져오기 (변환된 데이터 구조에 맞춤)
  const getRegionalWeatherData = useMemo(() => {
    console.log('RegionalWeatherDashboard - weatherData:', weatherData);
    console.log('RegionalWeatherDashboard - weatherData structure:', {
      hasLocations: !!weatherData?.locations,
      locationsLength: weatherData?.locations?.length,
      hasCurrent: !!weatherData?.current,
      currentTemp: weatherData?.current?.temperature
    });

    if (!weatherData?.locations || !weatherData?.current) {
      console.log('RegionalWeatherDashboard - No weatherData.locations found, using fallback');
      // 기본 데이터가 없을 때 기본값 반환
      const fallbackData = {};
      selectedRegions.forEach(regionId => {
        const region = AVAILABLE_REGIONS.find(r => r.id === regionId);
        if (region) {
          fallbackData[regionId] = {
            region: region.name,
            temperature: weatherData?.current?.temperature || 29,
            humidity: weatherData?.current?.humidity || 75,
            rainfall: 0,
            windDirection: '--',
            stationName: '데이터 로딩 중...',
            stationCount: 0,
            lastUpdate: weatherData?.timestamp || new Date().toISOString()
          };
        }
      });
      return fallbackData;
    }

    const regionalData = {};

    // 선택된 지역만 처리
    const selectedRegionConfigs = AVAILABLE_REGIONS.filter(region => 
      selectedRegions.includes(region.id)
    );

    selectedRegionConfigs.forEach(region => {
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
          windDirection: weatherData.current?.windDirection || '--',
          stationName: stationInfo?.name || primaryStation.name,
          stationCount: stationData.length,
          lastUpdate: weatherData.timestamp
        };
      } else {
        // 데이터가 없는 경우 전체 평균 데이터 사용
        regionalData[region.id] = {
          region: region.name,
          temperature: weatherData.current?.temperature || null,
          humidity: weatherData.current?.humidity || null,
          rainfall: weatherData.current?.rainfall || 0,
          windDirection: weatherData.current?.windDirection || '--',
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

  // 선택된 지역 설정 가져오기
  const selectedRegionConfigs = useMemo(() => 
    AVAILABLE_REGIONS.filter(region => selectedRegions.includes(region.id)),
    [selectedRegions]
  );

  return (
    <div className={`${className}`}>
      {/* 헤더 */}
      <div className="mb-6">
        <h2 className="text-lg font-bold text-gray-800 mb-2">
          🌏 선택된 지역 날씨
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          실시간 기상 관측 데이터 - 지역 버튼을 클릭하여 3개 지역을 선택하세요
        </p>
        
        {/* 지역 선택 버튼들 */}
        <div className="flex flex-wrap gap-2 mb-4">
          {AVAILABLE_REGIONS.map(region => (
            <button
              key={region.id}
              onClick={() => {
                if (!selectedRegions.includes(region.id)) {
                  // 새 지역 선택 - 항상 3개 유지, 가장 오래된 것 교체
                  setSelectedRegions(prev => [...prev.slice(1), region.id]);
                }
              }}
              className={`
                px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                flex items-center gap-2 cursor-pointer
                ${selectedRegions.includes(region.id)
                  ? 'bg-blue-500 text-white shadow-md ring-2 ring-blue-300'
                  : 'bg-gray-100 text-gray-700 hover:bg-blue-100 hover:text-blue-700'
                }
              `}
            >
              <span>{region.emoji}</span>
              <span>{region.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 지역별 날씨 카드 그리드 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {selectedRegionConfigs.map(region => {
          const data = getRegionalWeatherData[region.id];
          
          // 데이터가 없어도 기본 카드 표시
          const cardData = data || {
            region: region.name,
            temperature: 29,
            humidity: 75,
            rainfall: 0,
            windDirection: '--',
            stationName: '데이터 로딩 중...',
            stationCount: 0,
            lastUpdate: new Date().toISOString()
          };

          return (
            <RegionalWeatherCard
              key={region.id}
              region={cardData.region}
              temperature={cardData.temperature}
              humidity={cardData.humidity}
              rainfall={cardData.rainfall}
              windDirection={cardData.windDirection}
              stationName={cardData.stationName}
              isActive={activeRegion === region.id}
              onClick={() => handleRegionClick(region.id)}
              lastUpdate={formatLastUpdate(cardData.lastUpdate)}
              className={`min-h-[200px] ${activeRegion === region.id ? 'lg:col-span-2' : ''}`}
            />
          );
        })}
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