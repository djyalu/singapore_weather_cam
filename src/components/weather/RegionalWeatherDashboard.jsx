import React, { useState, useMemo, useEffect } from 'react';
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
  onSelectedRegionsChange,
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
      stationIds: ['S109', 'S102'], // Newton & Central 지역
      description: 'Newton MRT 및 중부 도심 지역',
      emoji: '🌆'
    },
    {
      id: 'east',
      name: 'East',
      stationIds: ['S107', 'S43'], // East Coast & Kim Chuan 동부 지역
      description: 'East Coast Parkway 및 동부 산업 지역',
      emoji: '🏖️'
    },
    {
      id: 'north',
      name: 'North',
      stationIds: ['S24', 'S115'], // 북부 지역 (실제 북부 스테이션)
      description: '북부 주거 및 산업 지역',
      emoji: '🌳'
    },
    {
      id: 'south',
      name: 'South',
      stationIds: ['S60', 'S104'], // Sentosa & Jurong (남서부)
      description: 'Sentosa 및 남서부 지역',
      emoji: '🏝️'
    }
  ];

  // 선택된 지역 상태 (기본값: Hwa Chong, Newton, Changi)
  const [selectedRegions, setSelectedRegions] = useState(['hwa-chong', 'newton', 'changi']);

  // 컴포넌트 마운트 시 초기 선택된 지역들을 App.jsx에 알림
  useEffect(() => {
    if (onSelectedRegionsChange) {
      onSelectedRegionsChange(selectedRegions);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // 지역별 날씨 데이터 가져오기 (변환된 데이터 구조에 맞춤)
  const getRegionalWeatherData = useMemo(() => {
    console.log('🔍 RegionalWeatherDashboard - Debug Info:');
    console.log('- weatherData exists:', !!weatherData);
    console.log('- weatherData.locations exists:', !!weatherData?.locations);
    console.log('- weatherData.locations length:', weatherData?.locations?.length);
    console.log('- weatherData.current exists:', !!weatherData?.current);
    console.log('- full weatherData structure:', weatherData);
    
    if (weatherData?.locations) {
      console.log('- First location sample:', weatherData.locations[0]);
      console.log('- Available station IDs:', weatherData.locations.map(loc => loc.station_id));
    }

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
      console.log(`🔍 Processing region: ${region.name}, looking for stations:`, region.stationIds);
      
      // 해당 지역의 스테이션 데이터 찾기
      const stationData = region.stationIds
        .map(stationId => {
          const found = weatherData.locations.find(loc => loc.station_id === stationId);
          console.log(`  - Station ${stationId}: ${found ? 'found' : 'not found'}`);
          if (found) {
            console.log(`    Temperature: ${found.temperature}, Humidity: ${found.humidity}`);
          }
          return found;
        })
        .filter(Boolean);

      console.log(`  - Total stations found for ${region.name}: ${stationData.length}`);

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
          temperature: Math.round(avgTemperature * 10) / 10, // 소수점 1자리
          humidity: Math.round(avgHumidity),
          rainfall: Math.round(totalRainfall * 10) / 10,
          windDirection: weatherData.current?.windDirection || '--',
          stationName: stationInfo?.displayName || primaryStation.name || primaryStation.displayName,
          stationCount: stationData.length,
          lastUpdate: weatherData.timestamp
        };
        
        console.log(`  ✅ ${region.name} data created:`, regionalData[region.id]);
      } else {
        // 데이터가 없는 경우 전체 평균 데이터 사용
        console.log(`  ⚠️ No stations found for ${region.name}, using fallback`);
        regionalData[region.id] = {
          region: region.name,
          temperature: weatherData.current?.temperature || 29,
          humidity: weatherData.current?.humidity || 75,
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
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      {/* 헤더 */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          🌏 <span>주요 지역 날씨</span>
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          실시간 기상 관측 데이터 - 지역 버튼을 클릭하여 3개 지역을 선택하세요
        </p>
        
        {/* 지역 선택 버튼들 - 개선된 레이아웃 */}
        <div className="bg-gray-50 p-4 rounded-lg mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
            {AVAILABLE_REGIONS.map(region => (
              <button
                key={region.id}
                onClick={() => {
                  if (!selectedRegions.includes(region.id)) {
                    // 새 지역 선택 - 항상 3개 유지, 가장 오래된 것 교체
                    const newSelectedRegions = [...selectedRegions.slice(1), region.id];
                    setSelectedRegions(newSelectedRegions);
                    // App.jsx에 변경사항 알림
                    onSelectedRegionsChange?.(newSelectedRegions);
                  }
                }}
                title={region.description}
                className={`
                  px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
                  flex flex-col items-center gap-1 cursor-pointer min-h-[60px]
                  ${selectedRegions.includes(region.id)
                    ? 'bg-blue-500 text-white shadow-md ring-2 ring-blue-300 scale-105'
                    : 'bg-white text-gray-700 hover:bg-blue-100 hover:text-blue-700 border border-gray-200'
                  }
                `}
              >
                <span className="text-lg">{region.emoji}</span>
                <span className="text-xs font-medium">{region.name}</span>
              </button>
            ))}
          </div>
          <div className="mt-3 text-xs text-gray-500 text-center">
            현재 선택된 지역: {selectedRegions.map(id => 
              AVAILABLE_REGIONS.find(r => r.id === id)?.name
            ).join(', ')}
          </div>
        </div>
      </div>

      {/* 지역별 날씨 카드 그리드 - 개선된 레이아웃 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
              region={`${region.emoji} ${cardData.region}`}
              temperature={cardData.temperature}
              humidity={cardData.humidity}
              rainfall={cardData.rainfall}
              windDirection={cardData.windDirection}
              stationName={cardData.stationName}
              isActive={activeRegion === region.id}
              onClick={() => handleRegionClick(region.id)}
              lastUpdate={formatLastUpdate(cardData.lastUpdate)}
              className="min-h-[200px] transition-all duration-300 hover:shadow-lg"
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
  onSelectedRegionsChange: PropTypes.func,
  className: PropTypes.string,
};

RegionalWeatherDashboard.displayName = 'RegionalWeatherDashboard';

export default RegionalWeatherDashboard;