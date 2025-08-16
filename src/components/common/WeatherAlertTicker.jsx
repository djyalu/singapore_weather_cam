import React, { useState, useEffect, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle, Info, X, RefreshCw } from 'lucide-react';
import neaRealTimeService from '../../services/neaRealTimeService';
import { useWeatherData } from '../../contexts/AppDataContextSimple';

/**
 * 실시간 기상 경보 티커 컴포넌트
 * NEA API를 통해 폭염, 호우, 대기질 등의 긴급 정보를 스크롤 형태로 표시
 */
const WeatherAlertTicker = React.memo(({ className = '', refreshInterval = 300000 }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [isBackgroundTab, setIsBackgroundTab] = useState(false);
  const intervalRef = useRef(null);
  const tickerRef = useRef(null);

  // 메인 앱의 실시간 날씨 데이터 컨텍스트 활용 + 원본 NEA 데이터 접근
  const { weatherData: mainWeatherData, isLoading: mainDataLoading } = useWeatherData();
  
  // 글로벌 window.weatherData에서 원본 NEA 데이터 직접 접근 (Single Source of Truth)
  const getOriginalNeaData = () => {
    return window.weatherData || null;
  };

  // 배터리 절약을 위한 백그라운드 탭 감지
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsBackgroundTab(document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // 경보 데이터 로드 - 실시간 NEA 서비스 데이터 사용 (Single Source of Truth)
  const loadAlerts = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('🔄 Ticker: Using original NEA data (Single Source of Truth)');

      // Use original NEA data directly from global reference (NOT transformed data)
      const originalNeaData = getOriginalNeaData();
      if (originalNeaData?.data?.temperature?.readings?.length > 0) {
        const data = originalNeaData; // Use original NEA data structure
          console.log('📊 Real-time data loaded:', data);
          console.log('🔍 Data structure check:', {
            hasTemperature: !!data.data?.temperature?.readings?.length,
            hasHumidity: !!data.data?.humidity?.readings?.length,
            hasRainfall: !!data.data?.rainfall?.readings?.length,
            hasForecast: !!data.data?.forecast?.general?.forecast,
            tempCount: data.data?.temperature?.readings?.length || 0,
            humidityCount: data.data?.humidity?.readings?.length || 0,
            rainfallCount: data.data?.rainfall?.readings?.length || 0
          });
          
          const realAlerts = [];
          const now = new Date();
          
          // 온도 데이터 - weatherDataUnifier와 동일한 방식 사용
          if (data.data?.temperature?.readings?.length > 0) {
            const tempReadings = data.data.temperature.readings;
            
            // weatherDataUnifier.js와 동일한 방식으로 계산
            const calculatedAvgTemp = tempReadings.reduce((sum, r) => sum + r.value, 0) / tempReadings.length;
            const preCalculatedAvgTemp = data.data.temperature.average;
            
            // 이미 계산된 average가 있으면 우선 사용 (weatherDataUnifier와 동일한 로직)
            const avgTemp = (preCalculatedAvgTemp !== undefined && preCalculatedAvgTemp !== null)
              ? preCalculatedAvgTemp
              : calculatedAvgTemp;
            
            const minTemp = tempReadings.length > 0 ? Math.min(...tempReadings.map(r => r.value)) : 0;
            const maxTemp = tempReadings.length > 0 ? Math.max(...tempReadings.map(r => r.value)) : 0;
            
            console.log('🌡️ [WeatherAlertTicker] 온도 계산 결과:', {
              preCalculatedAvgTemp,
              calculatedAvgTemp: calculatedAvgTemp?.toFixed(2) || '--',
              finalAvgTemp: avgTemp?.toFixed(2) || '--',
              readingsCount: tempReadings.length
            });
            
            let tempStatus = '정상';
            if (avgTemp >= 35) tempStatus = '매우 높음';
            else if (avgTemp >= 33) tempStatus = '높음';
            else if (avgTemp <= 25) tempStatus = '낮음';
            
            realAlerts.push({
              type: 'info',
              priority: avgTemp >= 35 ? 'medium' : 'low',
              icon: avgTemp >= 35 ? '🔥' : avgTemp <= 25 ? '❄️' : '🌡️',
              message: `현재 기온 ${avgTemp?.toFixed(1) || '--'}°C (${tempStatus}) • ${tempReadings.length}개 관측소 평균 • 최저 ${minTemp?.toFixed(1) || '--'}°C 최고 ${maxTemp?.toFixed(1) || '--'}°C`,
              timestamp: now.toISOString(),
              source: 'NEA Singapore',
            });
          }
          
          // 습도 데이터 - weatherDataUnifier와 동일한 방식 사용
          if (data.data?.humidity?.readings?.length > 0) {
            const humidityReadings = data.data.humidity.readings;
            
            // weatherDataUnifier.js와 동일한 방식으로 계산
            const calculatedAvgHumidity = humidityReadings.reduce((sum, r) => sum + r.value, 0) / humidityReadings.length;
            const preCalculatedAvgHumidity = data.data.humidity.average;
            
            // 이미 계산된 average가 있으면 우선 사용 (weatherDataUnifier와 동일한 로직)
            const avgHumidity = (preCalculatedAvgHumidity !== undefined && preCalculatedAvgHumidity !== null)
              ? preCalculatedAvgHumidity
              : calculatedAvgHumidity;
            
            const minHumidity = humidityReadings.length > 0 ? Math.min(...humidityReadings.map(r => r.value)) : 0;
            const maxHumidity = humidityReadings.length > 0 ? Math.max(...humidityReadings.map(r => r.value)) : 0;
            
            console.log('💧 [WeatherAlertTicker] 습도 계산 결과:', {
              preCalculatedAvgHumidity,
              calculatedAvgHumidity: calculatedAvgHumidity?.toFixed(2) || '--',
              finalAvgHumidity: avgHumidity?.toFixed(2) || '--',
              readingsCount: humidityReadings.length
            });
            
            let humidityStatus = '정상';
            if (avgHumidity >= 90) humidityStatus = '매우 높음';
            else if (avgHumidity >= 80) humidityStatus = '높음';
            else if (avgHumidity <= 40) humidityStatus = '낮음';
            
            realAlerts.push({
              type: 'info',
              priority: 'low',
              icon: avgHumidity >= 90 ? '💦' : avgHumidity <= 40 ? '🏜️' : '💧',
              message: `현재 습도 ${avgHumidity?.toFixed(0) || '--'}% (${humidityStatus}) • ${humidityReadings.length}개 관측소 평균 • 최저 ${minHumidity?.toFixed(0) || '--'}% 최고 ${maxHumidity?.toFixed(0) || '--'}%`,
              timestamp: now.toISOString(),
              source: 'NEA Singapore',
            });
          }
          
          // 강수량 데이터
          if (data.data?.rainfall?.readings?.length > 0) {
            const rainfallReadings = data.data.rainfall.readings;
            const activeRainStations = rainfallReadings.filter(r => r.value > 0).length;
            const totalRainfall = rainfallReadings.reduce((sum, r) => sum + r.value, 0);
            const maxRainfall = rainfallReadings.length > 0 ? Math.max(...rainfallReadings.map(r => r.value)) : 0;
            
            if (activeRainStations > 0) {
              let rainIcon = '🌧️';
              let rainStatus = '소나기';
              if (maxRainfall >= 20) {
                rainIcon = '⛈️';
                rainStatus = '집중호우';
              } else if (maxRainfall >= 10) {
                rainIcon = '🌦️';
                rainStatus = '강한 비';
              }
              
              realAlerts.push({
                type: 'info',
                priority: maxRainfall >= 20 ? 'high' : maxRainfall >= 10 ? 'medium' : 'low',
                icon: rainIcon,
                message: `${rainStatus} 진행 중 • ${activeRainStations}개 지역에서 강수 • 최대 ${maxRainfall?.toFixed(1) || '--'}mm • 총 ${totalRainfall?.toFixed(1) || '--'}mm 기록`,
                timestamp: now.toISOString(),
                source: 'NEA Singapore',
              });
            } else {
              realAlerts.push({
                type: 'info',
                priority: 'low',
                icon: '☀️',
                message: `전국 건조 상태 • ${rainfallReadings.length}개 관측소 모두 강수량 0mm • 맑은 날씨 지속`,
                timestamp: now.toISOString(),
                source: 'NEA Singapore',
              });
            }
          }
          
          // 예보 정보
          if (data.data?.forecast?.general?.forecast) {
            const forecast = data.data.forecast.general.forecast;
            const tempRange = data.data.forecast.general.temperature;
            const humidityRange = data.data.forecast.general.relative_humidity;
            
            let forecastIcon = '🌤️';
            let forecastMessage = forecast;
            
            if (forecast.includes('Thundery')) {
              forecastIcon = '⛈️';
              forecastMessage = '뇌우성 소나기 예상';
            } else if (forecast.includes('Shower') || forecast.includes('Rain')) {
              forecastIcon = '🌧️';
              forecastMessage = '소나기 예상';
            } else if (forecast.includes('Cloudy')) {
              forecastIcon = '☁️';
              forecastMessage = '흐린 날씨';
            } else if (forecast.includes('Fair')) {
              forecastIcon = '☀️';
              forecastMessage = '맑은 날씨';
            }
            
            realAlerts.push({
              type: 'info',
              priority: 'low',
              icon: forecastIcon,
              message: `${forecastMessage} • 예상기온 ${tempRange?.low || 25}-${tempRange?.high || 34}°C • 습도 ${humidityRange?.low || 60}-${humidityRange?.high || 95}% • NEA 공식예보`,
              timestamp: now.toISOString(),
              source: 'NEA Singapore',
            });
          }
          
          // 데이터 수집 현황
          const totalStations = data.stations_used?.length || 0;
          const dataAge = data.timestamp ? Math.round((Date.now() - new Date(data.timestamp).getTime()) / (1000 * 60)) : 0;
          
          realAlerts.push({
            type: 'info',
            priority: 'low',
            icon: '📊',
            message: `실시간 데이터 수집 완료 • 총 ${totalStations}개 관측소 연동 • ${dataAge}분 전 업데이트 • 데이터 품질 ${Math.round((data.data_quality_score || 0.95) * 100)}%`,
            timestamp: now.toISOString(),
            source: 'System Status',
          });
          
          console.log('🎯 Complete real-time alerts generated:', realAlerts.length);
          console.log('📋 Generated alerts:', realAlerts.map(a => a.message.substring(0, 50) + '...'));
          
          if (realAlerts.length === 0) {
            console.warn('⚠️ No alerts generated despite having data - this is unexpected!');
          }
          
          setAlerts(realAlerts);
        } else {
          // 원본 NEA 데이터가 없으면 로딩 메시지 표시
          const loadingAlerts = [{
            type: 'info',
            priority: 'low',
            icon: '📡',
            message: '실시간 NEA Singapore API에서 날씨 데이터를 로딩 중입니다...',
            timestamp: new Date().toISOString(),
            source: 'Original NEA Data Loading',
          }];
          
          console.log('🔄 Original NEA data not ready, showing loading message');
          setAlerts(loadingAlerts);
        }
    } catch (err) {
      console.error('🚨 Ticker: Failed to load weather alerts:', err);
      setError(err.message);

      // 에러 시 기본 메시지 표시
      setAlerts([{
        type: 'error',
        priority: 'low',
        icon: '⚠️',
        message: '기상 경보 정보를 불러올 수 없습니다. 실시간 데이터 수집 중입니다.',
        timestamp: new Date().toISOString(),
        source: 'Real-time System',
      }]);
    } finally {
      setLoading(false);
    }
  };

  // 원본 NEA 데이터가 변경될 때마다 티커 업데이트 (window.weatherData 감지)
  useEffect(() => {
    const originalData = getOriginalNeaData();
    if (originalData && !mainDataLoading) {
      console.log('🔄 Ticker: Original NEA data updated, refreshing alerts...');
      loadAlerts();
    }
  }, [mainWeatherData, mainDataLoading]); // mainWeatherData 변경은 원본 데이터 변경을 의미

  // 모바일 전용 강제 새로고침 이벤트 리스너
  useEffect(() => {
    const handleMobileRefresh = (event) => {
      console.log('📱 [WeatherAlertTicker] Mobile refresh event received:', event.type);
      loadAlerts();
    };

    const handleDataUpdated = (event) => {
      console.log('📊 [WeatherAlertTicker] Data updated event received:', event.type);
      if (event.detail) {
        window.weatherData = event.detail;
      }
      loadAlerts();
    };

    const handleForceRefresh = () => {
      console.log('🔄 [WeatherAlertTicker] Force refresh event received');
      setTimeout(loadAlerts, 100); // 약간의 지연으로 데이터 로딩 보장
    };

    // 모바일 이벤트 리스너 등록
    window.addEventListener('mobileDataRefreshed', handleDataUpdated);
    window.addEventListener('mobileTickerRefresh', handleMobileRefresh);
    window.addEventListener('weatherDataUpdated', handleDataUpdated);
    window.addEventListener('dataRefreshed', handleDataUpdated);
    window.addEventListener('forceComponentRefresh', handleForceRefresh);

    return () => {
      window.removeEventListener('mobileDataRefreshed', handleDataUpdated);
      window.removeEventListener('mobileTickerRefresh', handleMobileRefresh);
      window.removeEventListener('weatherDataUpdated', handleDataUpdated);
      window.removeEventListener('dataRefreshed', handleDataUpdated);
      window.removeEventListener('forceComponentRefresh', handleForceRefresh);
    };
  }, []);

  // 컴포넌트 마운트 시 초기 로드 (원본 NEA 데이터 확인)
  useEffect(() => {
    const originalData = getOriginalNeaData();
    if (originalData && !mainDataLoading) {
      loadAlerts();
    }
  }, []); // 초기 마운트 시에만 실행

  // 경보 우선순위에 따른 스타일 결정 - 간격 최적화
  const getAlertStyle = (alert) => {
    const baseClasses = 'flex items-center gap-1.5 sm:gap-2 md:gap-3 px-3 sm:px-4 py-1.5 sm:py-2 whitespace-nowrap min-h-[36px] sm:min-h-[40px] touch-manipulation';

    switch (alert.priority) {
      case 'critical':
        return `${baseClasses} text-red-800 font-semibold`;
      case 'high':
        return `${baseClasses} text-orange-800 font-semibold`;
      case 'medium':
        return `${baseClasses} text-amber-800 font-medium`;
      case 'low':
        return `${baseClasses} text-gray-800 font-normal`;
      case 'error':
        return `${baseClasses} text-red-700 font-medium`;
      default:
        return `${baseClasses} text-gray-800 font-normal`;
    }
  };

  // 경보 아이콘 결정 - 모바일 최적화 강화 (깜박거림 제거)
  const getAlertIcon = (alert) => {
    if (alert.type === 'critical' || alert.type === 'warning') {
      return <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-red-600 flex-shrink-0" />;
    }
    return <Info className="w-3 h-3 sm:w-4 sm:h-4 md:w-5 md:h-5 text-blue-600 flex-shrink-0" />;
  };

  // 티커 숨기기/보이기
  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  // 티커 일시정지/재생
  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  // 수동 새로고침 - 실시간 NEA 서비스 사용
  const handleRefresh = async () => {
    try {
      console.log('🔄 Ticker manual refresh: Using real-time NEA service');
      setLoading(true);
      
      // Get fresh data from NEA service
      const freshData = await neaRealTimeService.getRealTimeWeatherData();
      
      if (freshData) {
        // Update global reference
        window.weatherData = freshData;
        console.log('✅ Ticker: Fresh real-time data loaded:', {
          avgTemp: freshData.data?.temperature?.average?.toFixed(2),
          stations: freshData.stations_used?.length
        });
      }
      
      // Regenerate alerts with fresh data
      loadAlerts();
    } catch (error) {
      console.error('❌ Ticker manual refresh failed:', error);
      setError('실시간 데이터 새로고침 실패');
    } finally {
      setLoading(false);
    }
  };

  // 티커 숨김 처리 (경보가 없어도 로딩 상태 표시)
  if (!isVisible) {
    return null;
  }

  // 높은 우선순위 경보만 표시 (최대 5개) - 강제로 모든 알림 표시하도록 수정
  const displayAlerts = useMemo(() => {
    console.log('🎭 Display alerts filtering:', {
      totalAlerts: alerts.length,
      alertPriorities: alerts.map(a => a.priority),
      filtered: alerts.slice(0, 5).length
    });
    
    // 모든 알림을 표시하도록 임시 수정 (우선순위 필터링 비활성화)
    return alerts.slice(0, 5);
  }, [alerts]);

  // 애니메이션 활성화 조건 (배터리 절약)
  const shouldAnimate = useMemo(() =>
    !isPaused && !isBackgroundTab && displayAlerts.length > 0,
  [isPaused, isBackgroundTab, displayAlerts.length],
  );

  // 동적 애니메이션 지속 시간 계산 - 정확한 메시지 길이 기반
  const animationDuration = useMemo(() => {
    if (displayAlerts.length === 0) return 15;
    
    // 각 메시지의 실제 픽셀 너비 추정 (한글 및 영문 고려)
    const estimateTextWidth = (text) => {
      // 한글: 약 16px, 영문/숫자: 약 9px, 특수문자/아이콘: 약 14px
      let width = 0;
      for (const char of text) {
        if (/[가-힣]/.test(char)) {
          width += 16; // 한글
        } else if (/[a-zA-Z0-9]/.test(char)) {
          width += 9; // 영문/숫자
        } else {
          width += 14; // 특수문자/아이콘/공백
        }
      }
      return width;
    };
    
    // 전체 티커 콘텐츠 너비 계산 (아이콘 + 텍스트 + 간격 포함)
    const totalWidth = displayAlerts.reduce((sum, alert) => {
      const textWidth = estimateTextWidth(alert.message);
      const iconWidth = 60; // 아이콘 + 패딩
      const spacing = 32; // 메시지 간 간격 (mr-8)
      return sum + iconWidth + textWidth + spacing;
    }, 0);
    
    // 화면 너비 추정 (대부분의 경우 1200px 이하)
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1200;
    
    // 애니메이션 속도: 약 150px/초 (적당한 읽기 속도)
    const animationSpeed = 150;
    
    // 완전한 스크롤을 위해 전체 콘텐츠 + 화면 너비만큼 이동해야 함
    const totalDistance = totalWidth + screenWidth;
    const calculatedDuration = Math.ceil(totalDistance / animationSpeed);
    
    // 최소 15초, 최대 60초로 제한
    const finalDuration = Math.max(15, Math.min(60, calculatedDuration));
    
    console.log('🎬 Enhanced animation duration calculated:', {
      alertCount: displayAlerts.length,
      totalWidth: Math.round(totalWidth),
      screenWidth,
      totalDistance: Math.round(totalDistance),
      calculatedDuration,
      finalDuration
    });
    
    return finalDuration;
  }, [displayAlerts]);

  return (
    <div className={`bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-b border-gray-200/50 ${className}`}>
      <div className="relative">
        {/* 티커 헤더 - 간격 최적화 */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-1.5 sm:py-2 bg-white/10 border-b border-gray-300/20">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
              <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
              <span className="text-gray-800 font-semibold text-xs sm:text-sm whitespace-nowrap">🚨 기상 경보</span>
            </div>
            <span className="text-gray-600 text-xs hidden sm:block truncate">
              {loading ? 'Loading...' : `${displayAlerts.length}건 • NEA Singapore (실시간)`}
            </span>
            <span className="text-gray-600 text-xs sm:hidden flex-shrink-0">
              {loading ? '...' : `${displayAlerts.length}건`}
            </span>
          </div>

          <div className="flex items-center gap-0.5 flex-shrink-0">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="text-gray-600 hover:text-gray-800 transition-colors touch-manipulation flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-md hover:bg-white/20 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              title="새로고침"
              aria-label="날씨 경보 새로고침"
            >
              <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={togglePause}
              className="text-gray-600 hover:text-gray-800 transition-colors touch-manipulation flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-md bg-white/20 hover:bg-white/30 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              title={isPaused ? '재생' : '일시정지'}
              aria-label={isPaused ? '티커 재생' : '티커 일시정지'}
            >
              <span className="text-xs sm:text-sm">{isPaused ? '▶️' : '⏸️'}</span>
            </button>
            <button
              onClick={toggleVisibility}
              className="text-gray-600 hover:text-gray-800 transition-colors touch-manipulation flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-md hover:bg-white/20 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              title="닫기"
              aria-label="기상 경보 티커 닫기"
            >
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>
        </div>

        {/* 스크롤 티커 영역 - 높이 최적화 */}
        <div className="relative h-10 sm:h-12 overflow-hidden touch-manipulation">
          {loading ? (
            <div className="flex items-center justify-center h-full px-4">
              <div className="flex items-center gap-2 text-gray-700">
                <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 animate-spin flex-shrink-0" />
                <span className="text-xs sm:text-sm md:text-base truncate">기상 정보 업데이트 중...</span>
              </div>
            </div>
          ) : displayAlerts.length === 0 ? (
            <div className="flex items-center justify-center h-full px-4">
              <div className="flex items-center gap-2 text-gray-600">
                <Info className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="text-xs sm:text-sm md:text-base truncate">
                  기상 정보를 불러오는 중입니다... (alerts: {alerts.length}, display: {displayAlerts.length})
                </span>
              </div>
            </div>
          ) : (
            <div
              ref={tickerRef}
              className={`flex items-center h-full will-change-transform ${shouldAnimate ? 'animate-scroll-left' : ''}`}
              style={{
                animationDuration: `${animationDuration}s`,
                animationPlayState: shouldAnimate ? 'running' : 'paused',
                transform: shouldAnimate ? 'translateZ(0)' : 'none', // GPU 레이어 활성화
                backfaceVisibility: 'hidden', // iOS Safari 최적화
                perspective: '1000px', // 3D 렌더링 성능 향상
              }}
            >
              {/* 원본 메시지들 - 모바일 최적화 */}
              {displayAlerts.map((alert, index) => (
                <div key={`${alert.timestamp}-${index}`} className={`${getAlertStyle(alert)} mr-4 sm:mr-6 md:mr-8`}>
                  <span className="text-xs sm:text-sm md:text-lg flex-shrink-0">{alert.icon}</span>
                  {getAlertIcon(alert)}
                  <span className="font-medium min-w-0 flex-1 text-xs sm:text-sm md:text-base">{alert.message}</span>
                  <span className="text-xs opacity-70 ml-1 sm:ml-2 flex-shrink-0 hidden md:inline">
                    {new Date(alert.timestamp).toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))}

              {/* 무한 스크롤을 위한 복제 - 모바일 최적화 */}
              {displayAlerts.map((alert, index) => (
                <div key={`duplicate-${alert.timestamp}-${index}`} className={`${getAlertStyle(alert)} mr-4 sm:mr-6 md:mr-8`}>
                  <span className="text-xs sm:text-sm md:text-lg flex-shrink-0">{alert.icon}</span>
                  {getAlertIcon(alert)}
                  <span className="font-medium min-w-0 flex-1 text-xs sm:text-sm md:text-base">{alert.message}</span>
                  <span className="text-xs opacity-70 ml-1 sm:ml-2 flex-shrink-0 hidden md:inline">
                    {new Date(alert.timestamp).toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              ))}

              {/* 추가 패딩으로 부드러운 전환 */}
              <div className="w-32 flex-shrink-0"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

WeatherAlertTicker.propTypes = {
  className: PropTypes.string,
  refreshInterval: PropTypes.number, // 새로고침 간격 (ms)
};

WeatherAlertTicker.displayName = 'WeatherAlertTicker';

export default WeatherAlertTicker;