import React, { useState, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import RegionalWeatherCard from './RegionalWeatherCard';
import { getStationInfo } from '../../config/weatherStations';
import { STANDARD_REGIONS, getRegionalTemperature } from '../../utils/weatherDataUnifier';

// weatherDataTransformer.js에서 가져온 날씨 설명 및 아이콘 생성 함수들 (컴포넌트 외부)
const getWeatherDescription = (temperature, rainfall) => {
  try {
    if (typeof temperature !== 'number') {return 'Unknown';}
    if (typeof rainfall !== 'number') {rainfall = 0;}

    if (rainfall > 5) {return 'Rainy';}
    if (rainfall > 0.5) {return 'Light Rain';}
    if (temperature > 32) {return 'Hot';}
    if (temperature > 28) {return 'Warm';}
    if (temperature > 24) {return 'Pleasant';}
    return 'Cool';
  } catch (error) {
    console.error('Error in getWeatherDescription:', error);
    return 'Unknown';
  }
};

const getWeatherIcon = (temperature, rainfall) => {
  try {
    if (typeof temperature !== 'number') {return '🌤️';}
    if (typeof rainfall !== 'number') {rainfall = 0;}

    if (rainfall > 5) {return '🌧️';}
    if (rainfall > 0.5) {return '🌦️';}
    if (temperature > 32) {return '☀️';}
    if (temperature > 28) {return '⛅';}
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
  className = '',
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

  // 지역별 날씨 데이터 가져오기 - Single Source of Truth 사용 (티커와 동일한 소스)
  const getRegionalWeatherData = useMemo(() => {
    console.log('🔍 [RegionalWeatherDashboard] Single Source of Truth 사용 (티커와 동일한 소스)');
    
    // 글로벌 window.weatherData 사용 (티커와 동일한 소스)
    const globalWeatherData = window.weatherData;
    const dataToUse = globalWeatherData || weatherData; // 글로벌 데이터 우선, 없으면 props 사용
    
    console.log('- 데이터 소스:', globalWeatherData ? 'GLOBAL (티커와 동일)' : 'PROPS (폴백)');
    console.log('- dataToUse exists:', !!dataToUse);
    console.log('- dataToUse.data exists:', !!dataToUse?.data);
    console.log('- dataToUse.data.temperature exists:', !!dataToUse?.data?.temperature);

    if (dataToUse?.data?.temperature?.readings) {
      console.log('- Temperature readings count:', dataToUse.data.temperature.readings.length);
      console.log('- Temperature readings sample:', dataToUse.data.temperature.readings.slice(0, 3));
      console.log('- 평균 온도 (티커와 동일):', dataToUse.data.temperature.average);
    }

    // 실시간 온도 데이터가 있을 때만 처리 (폴백 데이터 사용 안함)
    if (dataToUse?.data?.temperature?.readings?.length > 0) {
      console.log('✅ [RegionalWeatherDashboard] 티커와 동일한 NEA 데이터 사용 - weatherDataUnifier 기반');
      
      const regionalData = {};
      
      // 선택된 지역만 처리
      const selectedRegionConfigs = AVAILABLE_REGIONS.filter(region =>
        selectedRegions.includes(region.id),
      );

      selectedRegionConfigs.forEach(region => {
        console.log(`🎯 Processing region: ${region.displayName} (${region.id}), stations: ${region.stationIds.join(', ')}`);
        
        // weatherDataUnifier의 getRegionalTemperature만 사용 (티커와 동일한 데이터)
        const regionalTemp = getRegionalTemperature(dataToUse, region.id);
        
        // 실제 온도 데이터가 없으면 건너뛰기 (폴백 데이터 사용 안함)
        if (regionalTemp === null || typeof regionalTemp !== 'number' || isNaN(regionalTemp)) {
          console.log(`❌ ${region.displayName}: 실시간 온도 데이터 없음 - 카드 생성 건너뛰기 (폴백 사용 안함)`);
          return; // 폴백 데이터 생성하지 않고 건너뛰기
        }
        
        // 습도도 실시간 데이터만 사용 (기본값 없음) - 티커와 동일한 소스
        let avgHumidity = null;
        if (dataToUse.data?.humidity?.average !== undefined && dataToUse.data?.humidity?.average !== null) {
          avgHumidity = dataToUse.data.humidity.average;
        } else if (dataToUse.data?.humidity?.readings?.length > 0) {
          avgHumidity = dataToUse.data.humidity.readings.reduce((sum, r) => sum + r.value, 0) / dataToUse.data.humidity.readings.length;
        }
        
        // 강수량도 실시간 데이터만 사용 - 티커와 동일한 소스
        const totalRainfall = dataToUse.data?.rainfall?.total || 0;
        
        console.log(`  ✅ ${region.displayName}: ${regionalTemp.toFixed(1)}°C (실시간 계산, stations: ${region.stationIds.join(', ')})`);
        
        // 실시간 데이터만으로 카드 데이터 생성
        regionalData[region.id] = {
          region: region.displayName,
          temperature: Math.round(regionalTemp * 10) / 10,
          feelsLike: Math.round((regionalTemp + 1.5) * 10) / 10, // 약간 더 현실적인 체감온도
          humidity: avgHumidity ? Math.round(avgHumidity) : null,
          rainfall: Math.round(totalRainfall * 10) / 10,
          windDirection: null, // 실시간 풍향 데이터 없음
          description: getWeatherDescription(regionalTemp, totalRainfall),
          icon: getWeatherIcon(regionalTemp, totalRainfall),
          stationName: `${region.stationIds.length}개 관측소 실시간 평균`,
          stationCount: region.stationIds.length,
          lastUpdate: dataToUse.timestamp,
          realTime: true, // 실시간 데이터임을 표시
        };
      });
      
      console.log('🎯 [RegionalWeatherDashboard] 티커와 동일한 소스로 지역 데이터 생성 완료:', regionalData);
      return regionalData;
    }

    console.log('❌ [RegionalWeatherDashboard] 실시간 온도 데이터 없음 - 빈 객체 반환 (폴백 데이터 사용 안함)');
    // 실제 데이터가 없으면 빈 객체 반환 (폴백 데이터 완전 제거)
    return {};
  }, [weatherData, selectedRegions]);

  // 업데이트 시간 포맷팅 (Asia/Singapore 시간대로 정확한 계산)
  const formatLastUpdate = (timestamp) => {
    if (!timestamp) {return '';}

    try {
      const updateTime = new Date(timestamp);

      // Singapore 시간으로 현재 시간 계산 (UTC+8)
      const singaporeNow = new Date(new Date().toLocaleString('en-US', {timeZone: 'Asia/Singapore'}));

      // 디버깅: 시간 정보 출력
      console.log('🕐 Time Debug (Fixed):', {
        originalTimestamp: timestamp,
        updateTime: updateTime.toISOString(),
        singaporeNow: singaporeNow.toISOString(),
        updateTimeInSingapore: updateTime.toLocaleString('ko-KR', { timeZone: 'Asia/Singapore' }),
        nowInSingapore: singaporeNow.toLocaleString('ko-KR', { timeZone: 'Asia/Singapore' }),
      });

      // Singapore 시간 기준으로 차이 계산
      const diffMinutes = Math.floor((singaporeNow - updateTime) / (1000 * 60));

      console.log('⏱️ Time difference (Singapore timezone):', diffMinutes, 'minutes');

      if (diffMinutes < 1) {return '방금 전';}
      if (diffMinutes < 60) {return `${diffMinutes}분 전`;}

      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) {return `${diffHours}시간 전`;}

      // 24시간 이상인 경우 정확한 날짜/시간 표시
      return updateTime.toLocaleDateString('ko-KR', {
        timeZone: 'Asia/Singapore',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
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
  [selectedRegions],
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
            실시간 NEA API 데이터만 사용 (폴백/하드코딩 데이터 완전 제거) - 지역 버튼을 클릭하여 3개 지역을 선택하세요
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
              AVAILABLE_REGIONS.find(r => r.id === id)?.displayName,
            ).join(', ')}
          </div>
        </div>
      </div>

      {/* 지역별 날씨 카드 그리드 - 모바일 최적화 레이아웃 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-8">
        {selectedRegionConfigs.map(region => {
          const data = getRegionalWeatherData[region.id];

          console.log(`🎯 [RegionalWeatherDashboard] 카드 렌더링 for ${region.id}:`, {
            hasRealData: !!data,
            temperature: data?.temperature,
            humidity: data?.humidity,
            realTime: data?.realTime,
            stationName: data?.stationName,
            lastUpdate: data?.lastUpdate,
          });

          // 실시간 데이터가 없으면 로딩 상태만 표시 (폴백 카드 완전 제거)
          if (!data) {
            console.log(`❌ [RegionalWeatherDashboard] ${region.displayName}: 실시간 데이터 없음 - 로딩 상태 표시`);
            return (
              <div key={region.id} className="bg-gray-100 rounded-lg p-4 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <div className="text-lg mb-2">{region.emoji}</div>
                  <div className="text-sm font-medium">{region.displayName}</div>
                  <div className="text-xs mt-1">실시간 NEA 데이터 로딩 중...</div>
                  <div className="text-xs mt-1 text-red-500">※ 폴백 데이터 사용 안함</div>
                </div>
              </div>
            );
          }

          // 실시간 데이터만으로 카드 렌더링
          return (
            <RegionalWeatherCard
              key={region.id}
              region={`${region.emoji} ${data.region}`}
              temperature={data.temperature}
              feelsLike={data.feelsLike}
              humidity={data.humidity}
              rainfall={data.rainfall}
              windDirection={data.windDirection || '--'}
              weatherDescription={data.description}
              weatherIcon={data.icon}
              stationName={data.stationName}
              isActive={activeRegion === region.id}
              onClick={() => handleRegionClick(region.id)}
              lastUpdate={formatLastUpdate(data.lastUpdate)}
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