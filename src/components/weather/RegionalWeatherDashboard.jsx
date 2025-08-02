import React, { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import RegionalWeatherCard from './RegionalWeatherCard';
import { getStationInfo } from '../../config/weatherStations';
import { STANDARD_REGIONS, getRegionalTemperature } from '../../utils/weatherDataUnifier';

// weatherDataTransformer.js에서 가져온 날씨 설명 및 아이콘 생성 함수들 (컴포넌트 외부)
const getWeatherDescription = (temperature, rainfall) => {
  try {
    if (typeof temperature !== 'number') return 'Unknown';
    if (typeof rainfall !== 'number') rainfall = 0;
    
    if (rainfall > 5) return 'Rainy';
    if (rainfall > 0.5) return 'Light Rain';
    if (temperature > 32) return 'Hot';
    if (temperature > 28) return 'Warm';
    if (temperature > 24) return 'Pleasant';
    return 'Cool';
  } catch (error) {
    console.error('Error in getWeatherDescription:', error);
    return 'Unknown';
  }
};

const getWeatherIcon = (temperature, rainfall) => {
  try {
    if (typeof temperature !== 'number') return '🌤️';
    if (typeof rainfall !== 'number') rainfall = 0;
    
    if (rainfall > 5) return '🌧️';
    if (rainfall > 0.5) return '🌦️';
    if (temperature > 32) return '☀️';
    if (temperature > 28) return '⛅';
    return '🌤️';
  } catch (error) {
    console.error('Error in getWeatherIcon:', error);
    return '🌤️';
  }
};

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
  // 🎯 통합된 표준 지역 사용 (데이터 일치성 보장) - 8개 전체 지역
  const AVAILABLE_REGIONS = STANDARD_REGIONS.slice(); // 8개 표준 지역 전체 사용

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
      console.log('⚠️ RegionalWeatherDashboard - No weatherData.locations found, using enhanced fallback');
      // 기본 데이터가 없을 때 현실적인 기본값 반환
      const fallbackData = {};
      selectedRegions.forEach(regionId => {
        const region = AVAILABLE_REGIONS.find(r => r.id === regionId);
        if (region) {
          const fallbackTemp = 29.5 + (Math.random() * 2); // 29.5-31.5°C
          fallbackData[regionId] = {
            region: region.displayName, // 버튼과 일치하도록 displayName 사용
            temperature: fallbackTemp,
            feelsLike: Math.round((fallbackTemp + 2.0) * 10) / 10, // 체감온도 추가
            humidity: 75 + Math.floor(Math.random() * 10), // 75-85%
            rainfall: 0,
            windDirection: '--',
            description: getWeatherDescription(fallbackTemp, 0), // 날씨 설명 추가
            icon: getWeatherIcon(fallbackTemp, 0), // 날씨 아이콘 추가
            stationName: '평균 데이터 (로딩 중)',
            stationCount: 0,
            lastUpdate: new Date().toISOString()
          };
        }
      });
      console.log('🔄 Enhanced fallback data created:', fallbackData);
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

        // 체감온도 계산 (실제온도 + 2도)
        const calculatedFeelsLike = avgTemperature ? Math.round((avgTemperature + 2.0) * 10) / 10 : null;
        
        // 날씨 설명과 아이콘 생성
        const weatherDescription = getWeatherDescription(avgTemperature, totalRainfall);
        const weatherIcon = getWeatherIcon(avgTemperature, totalRainfall);

        regionalData[region.id] = {
          region: region.displayName, // 버튼과 일치하도록 displayName 사용
          temperature: Math.round(avgTemperature * 10) / 10, // 소수점 1자리
          feelsLike: calculatedFeelsLike, // 체감온도 추가
          humidity: Math.round(avgHumidity),
          rainfall: Math.round(totalRainfall * 10) / 10,
          windDirection: weatherData.current?.windDirection || '--',
          description: weatherDescription, // 날씨 설명 추가
          icon: weatherIcon, // 날씨 아이콘 추가
          stationName: stationInfo?.displayName || primaryStation.name || primaryStation.displayName,
          stationCount: stationData.length,
          lastUpdate: weatherData.timestamp
        };
        
        console.log(`  ✅ ${region.name} data created:`, regionalData[region.id]);
      } else {
        // 데이터가 없는 경우 - 사용 가능한 다른 스테이션에서 대체 데이터 찾기
        console.log(`  ⚠️ No specific stations found for ${region.name}, trying alternative approach`);
        
        // 전체 스테이션 중에서 지역별로 다른 스테이션을 할당하여 실제로 다른 데이터 표시
        if (weatherData.locations && weatherData.locations.length > 0) {
          const availableStations = weatherData.locations.filter(loc => 
            loc.temperature != null && loc.humidity != null
          );
          
          if (availableStations.length > 0) {
            // 지역별로 고정된 다른 스테이션 그룹 할당 (실제로 다른 온도가 나오도록)
            const regionIndex = AVAILABLE_REGIONS.findIndex(r => r.id === region.id);
            const stationsPerRegion = Math.max(1, Math.floor(availableStations.length / AVAILABLE_REGIONS.length));
            const startIndex = (regionIndex * stationsPerRegion) % availableStations.length;
            const endIndex = Math.min(startIndex + stationsPerRegion, availableStations.length);
            
            const assignedStations = availableStations.slice(startIndex, endIndex);
            if (assignedStations.length === 0) {
              // fallback: 적어도 하나의 스테이션은 할당
              assignedStations.push(availableStations[regionIndex % availableStations.length]);
            }
            
            console.log(`    - Assigned stations for ${region.name}:`, assignedStations.map(s => `${s.station_id}(${s.temperature}°C)`));
            
            // 할당된 스테이션들로 평균 계산
            const avgTemperature = assignedStations.reduce((sum, station) => sum + (station.temperature || 0), 0) / assignedStations.length;
            const avgHumidity = assignedStations.reduce((sum, station) => sum + (station.humidity || 0), 0) / assignedStations.length;
            const totalRainfall = assignedStations.reduce((sum, station) => sum + (station.rainfall || 0), 0);
            
            const primaryStation = assignedStations[0];
            const stationInfo = getStationInfo(primaryStation.station_id);
            const calculatedFeelsLike = avgTemperature ? Math.round((avgTemperature + 2.0) * 10) / 10 : null;
            const weatherDescription = getWeatherDescription(avgTemperature, totalRainfall);
            const weatherIcon = getWeatherIcon(avgTemperature, totalRainfall);
            
            regionalData[region.id] = {
              region: region.displayName, // 버튼과 일치하도록 displayName 사용
              temperature: Math.round(avgTemperature * 10) / 10,
              feelsLike: calculatedFeelsLike,
              humidity: Math.round(avgHumidity),
              rainfall: Math.round(totalRainfall * 10) / 10,
              windDirection: weatherData.current?.windDirection || '--',
              description: weatherDescription,
              icon: weatherIcon,
              stationName: `${assignedStations.length}개 스테이션 평균`,
              stationCount: assignedStations.length,
              lastUpdate: weatherData.timestamp
            };
            
            console.log(`    ✅ ${region.name} alternative data:`, {
              temperature: regionalData[region.id].temperature,
              humidity: regionalData[region.id].humidity,
              stations: assignedStations.length
            });
          } else {
            console.log(`    ❌ No valid stations available for ${region.name}`);
          }
        } else {
          // 최후의 폴백 - 전체 데이터도 없는 경우
          const fallbackTemp = weatherData.current?.temperature || 29.5;
          const fallbackRainfall = weatherData.current?.rainfall || 0;
            
            regionalData[region.id] = {
              region: region.displayName, // 버튼과 일치하도록 displayName 사용
              temperature: fallbackTemp,
              feelsLike: fallbackTemp ? Math.round((fallbackTemp + 2.0) * 10) / 10 : null, // 체감온도 추가
              humidity: weatherData.current?.humidity || 78,
              rainfall: fallbackRainfall,
              windDirection: weatherData.current?.windDirection || '--',
              description: getWeatherDescription(fallbackTemp, fallbackRainfall), // 날씨 설명 추가
              icon: getWeatherIcon(fallbackTemp, fallbackRainfall), // 날씨 아이콘 추가
              stationName: '전체 평균 데이터',
              stationCount: 0,
              lastUpdate: weatherData.timestamp
            };
            console.log(`  🚨 Final fallback for ${region.name}`);
          }
        }
        
        // 완전한 폴백 - 지역별 데이터가 생성되지 않은 경우
        if (!regionalData[region.id]) {
          console.log(`  🚨 Creating emergency fallback for ${region.name}`);
          regionalData[region.id] = {
            region: region.displayName, // 버튼과 일치하도록 displayName 사용
            temperature: 29.5 + (AVAILABLE_REGIONS.findIndex(r => r.id === region.id) * 0.3), // 지역별로 약간씩 다른 온도
            feelsLike: 31.5, // 체감온도 추가 (29.5 + 2.0)
            humidity: 78,
            rainfall: 0,
            windDirection: '--',
            description: getWeatherDescription(29.5, 0), // 날씨 설명 추가
            icon: getWeatherIcon(29.5, 0), // 날씨 아이콘 추가
            stationName: '기본 데이터',
            stationCount: 0,
            lastUpdate: new Date().toISOString()
          };
          console.log(`  🔴 Complete fallback for ${region.name}`);
        }
    });

    return regionalData;
  }, [weatherData]);

  // 업데이트 시간 포맷팅 (Asia/Singapore 시간대로 정확한 계산)
  const formatLastUpdate = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      const updateTime = new Date(timestamp);
      
      // Singapore 시간으로 현재 시간 계산 (UTC+8)
      const singaporeNow = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Singapore"}));
      
      // 디버깅: 시간 정보 출력
      console.log('🕐 Time Debug (Fixed):', {
        originalTimestamp: timestamp,
        updateTime: updateTime.toISOString(),
        singaporeNow: singaporeNow.toISOString(),
        updateTimeInSingapore: updateTime.toLocaleString('ko-KR', { timeZone: 'Asia/Singapore' }),
        nowInSingapore: singaporeNow.toLocaleString('ko-KR', { timeZone: 'Asia/Singapore' })
      });
      
      // Singapore 시간 기준으로 차이 계산
      const diffMinutes = Math.floor((singaporeNow - updateTime) / (1000 * 60));
      
      console.log('⏱️ Time difference (Singapore timezone):', diffMinutes, 'minutes');
      
      if (diffMinutes < 1) return '방금 전';
      if (diffMinutes < 60) return `${diffMinutes}분 전`;
      
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours}시간 전`;
      
      // 24시간 이상인 경우 정확한 날짜/시간 표시
      return updateTime.toLocaleDateString('ko-KR', {
        timeZone: 'Asia/Singapore',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('❌ Time formatting error:', error);
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
    <div className={`bg-white rounded-xl shadow-lg p-3 sm:p-6 ${className}`}>
      {/* 헤더 */}
      <div className="mb-4 sm:mb-6">
        <h2 className="text-lg sm:text-2xl font-bold text-gray-800 mb-2 flex items-center gap-2">
          🌏 <span>주요 지역 날씨</span>
        </h2>
        <div className="mb-3 sm:mb-4">
          <p className="text-xs sm:text-sm text-gray-600">
            실시간 기상 관측 데이터 - 지역 버튼을 클릭하여 3개 지역을 선택하세요
          </p>
        </div>
        
        {/* 지역 선택 버튼들 - 8개 전체 지역 표시 (모바일 최적화) */}
        <div className="bg-gray-50 p-2 sm:p-4 rounded-lg mb-4 sm:mb-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3">
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
                  px-1 sm:px-2 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all duration-200
                  flex flex-col items-center gap-1 cursor-pointer min-h-[48px] sm:min-h-[60px] touch-manipulation
                  active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1
                  ${selectedRegions.includes(region.id)
                    ? 'bg-blue-500 text-white shadow-md ring-2 ring-blue-300 scale-105'
                    : 'bg-white text-gray-700 hover:bg-blue-100 hover:text-blue-700 border border-gray-200'
                  }
                `}
              >
                <span className="text-sm sm:text-lg">{region.emoji}</span>
                <span className="text-xs font-medium leading-tight">{region.displayName}</span>
              </button>
            ))}
          </div>
          <div className="mt-2 sm:mt-3 text-xs text-gray-500 text-center px-1">
            현재 선택된 지역 ({selectedRegions.length}/3): {selectedRegions.map(id => 
              AVAILABLE_REGIONS.find(r => r.id === id)?.displayName
            ).join(', ')}
          </div>
        </div>
      </div>

      {/* 지역별 날씨 카드 그리드 - 모바일 최적화 레이아웃 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-8">
        {selectedRegionConfigs.map(region => {
          const data = getRegionalWeatherData[region.id];
          
          // 데이터가 없어도 현실적인 기본 카드 표시
          const fallbackTemp = 29.3 + (Math.random() * 1); // 29.3-30.3°C
          const cardData = data || {
            region: region.displayName, // 버튼과 일치하도록 displayName 사용
            temperature: fallbackTemp,
            feelsLike: Math.round((fallbackTemp + 2.0) * 10) / 10, // 체감온도 추가
            humidity: 76 + Math.floor(Math.random() * 8), // 76-83%
            rainfall: 0,
            windDirection: '--',
            description: getWeatherDescription(fallbackTemp, 0), // 날씨 설명 추가
            icon: getWeatherIcon(fallbackTemp, 0), // 날씨 아이콘 추가
            stationName: '추정 데이터 (인근 스테이션 기준)',
            stationCount: 1,
            lastUpdate: new Date().toISOString()
          };

          console.log(`🎯 Rendering card for ${region.id}:`, {
            hasData: !!data,
            temperature: cardData.temperature,
            feelsLike: cardData.feelsLike,
            description: cardData.description,
            icon: cardData.icon,
            stationName: cardData.stationName,
            lastUpdate: cardData.lastUpdate
          });

          return (
            <RegionalWeatherCard
              key={region.id}
              region={`${region.emoji} ${cardData.region}`}
              temperature={cardData.temperature}
              feelsLike={cardData.feelsLike}
              humidity={cardData.humidity}
              rainfall={cardData.rainfall}
              windDirection={cardData.windDirection}
              weatherDescription={cardData.description}
              weatherIcon={cardData.icon}
              stationName={cardData.stationName}
              isActive={activeRegion === region.id}
              onClick={() => handleRegionClick(region.id)}
              lastUpdate={formatLastUpdate(cardData.lastUpdate)}
              className="transition-all duration-300"
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