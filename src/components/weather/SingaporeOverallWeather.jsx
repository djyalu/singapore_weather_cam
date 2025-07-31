import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Thermometer, Droplets, Cloud, Clock, RefreshCw, Sparkles, Brain, Zap } from 'lucide-react';
import cohereService from '../../services/cohereService';

/**
 * 싱가포르 전체 평균 날씨 정보를 표시하는 컴포넌트 (AI 요약 포함)
 */
const SingaporeOverallWeather = React.memo(({ weatherData, className = '' }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [aiSummary, setAiSummary] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [cohereAnalysis, setCohereAnalysis] = useState(null);
  const [cohereLoading, setCohereLoading] = useState(false);
  const [showRealAI, setShowRealAI] = useState(false);

  // 1초마다 현재 시간 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // AI 날씨 요약 데이터 생성
  useEffect(() => {
    const generateSmartWeatherSummary = async () => {
      if (!weatherData) return;
      
      setAiLoading(true);
      try {
        console.log('🤖 Generating smart weather summary...');
        
        const overallData = getOverallWeatherData();
        const forecast = weatherData?.data?.forecast?.general;
        
        // 간결한 요약 생성
        const summary = generateIntelligentSummary(overallData, forecast);
        const highlights = generateHighlights(overallData, forecast);
        
        setAiSummary({
          summary,
          highlights,
          confidence: 0.85,
          aiModel: 'Smart Data Engine',
          timestamp: new Date().toISOString(),
          isRealAnalysis: false  // 실제 AI API 사용하지 않음
        });
        
        console.log('✅ Smart weather summary generated');
      } catch (error) {
        console.warn('⚠️ Failed to generate smart summary:', error);
        
        // 간단한 폴백
        setAiSummary({
          summary: '날씨 정보 분석 중',
          highlights: ['기본 정보'],
          confidence: 0.7,
          aiModel: '기본 분석',
          isRealAnalysis: false
        });
      } finally {
        setAiLoading(false);
      }
    };

    generateSmartWeatherSummary();
  }, [weatherData]);

  // Cohere AI 실시간 분석
  const handleRealAIAnalysis = async () => {
    if (!weatherData) {
      alert('날씨 데이터를 먼저 로드해주세요.');
      return;
    }

    if (!cohereService.isConfigured()) {
      alert('Cohere API 키가 설정되지 않았습니다.\n.env.local 파일에 VITE_COHERE_API_KEY를 설정해주세요.');
      return;
    }

    setCohereLoading(true);
    setCohereAnalysis(null);

    try {
      console.log('🤖 Cohere AI 실시간 날씨 분석 시작...');
      
      const result = await cohereService.analyzeWeatherData(weatherData);
      
      setCohereAnalysis(result);
      setShowRealAI(true);
      
      console.log('✅ Cohere AI 분석 완료:', result);
    } catch (error) {
      console.error('🚨 Cohere AI 분석 실패:', error);
      alert(`AI 분석 실패: ${error.message}`);
    } finally {
      setCohereLoading(false);
    }
  };

  // 날씨 데이터에서 전체 평균값 추출
  const getOverallWeatherData = () => {
    console.log('🔍 SingaporeOverallWeather weatherData structure check:', {
      hasWeatherData: !!weatherData,
      hasCurrent: !!weatherData?.current,
      hasLocations: !!weatherData?.locations,
      hasMeta: !!weatherData?.meta,
      currentTemp: weatherData?.current?.temperature,
      locationsCount: weatherData?.locations?.length,
      metaStations: weatherData?.meta?.stations
    });
    
    if (!weatherData?.current) {
      return {
        temperature: 29.0,
        humidity: 80,
        rainfall: 0,
        forecast: 'Partly Cloudy',
        lastUpdate: new Date().toISOString(),
        stationCount: 0
      };
    }

    const { current, meta, locations } = weatherData;

    return {
      temperature: current.temperature || 29.0,
      humidity: current.humidity || 80,
      rainfall: current.rainfall || 0,
      forecast: current.description || 'Partly Cloudy',
      lastUpdate: weatherData.timestamp,
      stationCount: meta?.stations || locations?.length || 0
    };
  };

  const overallData = getOverallWeatherData();

  // 스마트 요약 생성 함수들
  const generateIntelligentSummary = (data, forecast) => {
    const temp = data.temperature;
    const humidity = data.humidity;
    const rainfall = data.rainfall;
    
    // 온도 평가
    let tempDesc, tempAdvice;
    if (temp >= 32) {
      tempDesc = '매우 더움';
      tempAdvice = '외출 시 충분한 수분 섭취와 그늘 이용을 권장';
    } else if (temp >= 30) {
      tempDesc = '덥고 습함';
      tempAdvice = '야외활동 시 자주 휴식을 취하세요';
    } else if (temp >= 28) {
      tempDesc = '따뜻함';
      tempAdvice = '가벼운 옷차림으로 야외활동 적합';
    } else if (temp >= 25) {
      tempDesc = '쾌적함';
      tempAdvice = '야외활동하기 좋은 날씨';
    } else {
      tempDesc = '선선함';
      tempAdvice = '얇은 겉옷 준비를 권장';
    }
    
    // 습도 평가
    let humidityDesc = '';
    if (humidity >= 85) {
      humidityDesc = ', 매우 습하여 체감온도가 높음';
    } else if (humidity >= 75) {
      humidityDesc = ', 습도가 높아 끈적한 느낌';
    } else if (humidity >= 60) {
      humidityDesc = ', 적당한 습도';
    } else {
      humidityDesc = ', 건조한 편';
    }
    
    // 강수 상황
    let rainDesc = '';
    if (rainfall > 5) {
      rainDesc = `. ${rainfall}mm의 비로 우산 필수`;
    } else if (rainfall > 0) {
      rainDesc = `. 약한 비 (${rainfall}mm) 주의`;
    }
    
    return `싱가포르 현재 ${temp}°C로 ${tempDesc}${humidityDesc}${rainDesc}. ${tempAdvice}`;
  };

  const generateHighlights = (data, forecast) => {
    const highlights = [];
    const temp = data.temperature;
    const humidity = data.humidity;
    const rainfall = data.rainfall;
    
    // 온도 기반 하이라이트
    if (temp >= 32) {
      highlights.push('🌡️ 고온주의');
      highlights.push('💧 수분섭취');
    } else if (temp >= 30) {
      highlights.push('🌞 더운날씨');
      highlights.push('🏖️ 야외주의');
    } else if (temp >= 28) {
      highlights.push('☀️ 따뜻함');
      highlights.push('👕 가벼운옷');
    } else {
      highlights.push('😌 쾌적함');
      highlights.push('🚶 야외활동');
    }
    
    // 습도 기반 하이라이트
    if (humidity >= 85) {
      highlights[1] = '💦 높은습도';
    } else if (humidity <= 50) {
      highlights[1] = '🏜️ 건조함';
    }
    
    // 강수 우선 표시
    if (rainfall > 5) {
      highlights[0] = '☔ 강한비';
      highlights[1] = '🌂 우산필수';
    } else if (rainfall > 0) {
      highlights[1] = '💧 약한비';
    }
    
    return highlights.slice(0, 2); // 최대 2개만
  };


  // 마지막 업데이트 시간 포맷팅
  const formatLastUpdate = (timestamp) => {
    if (!timestamp) return '정보 없음';
    
    try {
      const updateTime = new Date(timestamp);
      
      // Singapore 시간으로 현재 시간 계산 (UTC+8)
      const singaporeNow = new Date(new Date().toLocaleString("en-US", {timeZone: "Asia/Singapore"}));
      
      // Singapore 시간 기준으로 차이 계산
      const diffMinutes = Math.floor((singaporeNow - updateTime) / (1000 * 60));
      
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
      console.error('Time formatting error:', error);
      return '시간 정보 오류';
    }
  };

  // 현재 Singapore 시간 표시
  const formatCurrentTime = () => {
    try {
      return currentTime.toLocaleString('ko-KR', {
        timeZone: 'Asia/Singapore',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      return currentTime.toLocaleString('ko-KR');
    }
  };

  // 날씨 상태에 따른 아이콘
  const getWeatherIcon = (forecast) => {
    if (forecast.includes('Rain') || forecast.includes('Shower')) return '🌧️';
    if (forecast.includes('Thunder')) return '⛈️';
    if (forecast.includes('Cloudy')) return '☁️';
    if (forecast.includes('Partly')) return '⛅';
    if (forecast.includes('Fair') || forecast.includes('Sunny')) return '☀️';
    return '🌤️';
  };

  // 온도에 따른 색상
  const getTemperatureColor = (temp) => {
    if (temp >= 32) return 'text-red-600';
    if (temp >= 28) return 'text-orange-500';
    if (temp >= 24) return 'text-yellow-500';
    return 'text-blue-500';
  };

  // 습도에 따른 색상 - 어두운 배경에서 잘 보이도록 수정
  const getHumidityColor = (humidity) => {
    if (humidity >= 85) return 'text-cyan-300';
    if (humidity >= 70) return 'text-blue-300';
    if (humidity >= 50) return 'text-green-300';
    return 'text-yellow-300';
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg border border-gray-100 ${className}`}>
      {/* 컴팩트한 헤더 - 그라데이션 배경 */}
      <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{getWeatherIcon(overallData.forecast)}</span>
              <div>
                <h2 className="text-xl font-bold">Singapore Weather</h2>
                <p className="text-blue-100 text-sm">실시간 전국 기상 정보</p>
              </div>
            </div>
          </div>
          
          {/* 핵심 온도 정보를 헤더에 배치 */}
          <div className="text-right">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl sm:text-3xl font-bold text-white drop-shadow-lg">
                {overallData.temperature.toFixed(1)}
              </span>
              <span className="text-base sm:text-lg text-blue-100">°C</span>
            </div>
            <div className="text-xs text-blue-100 hidden sm:block">
              {overallData.stationCount}개 관측소 평균
            </div>
          </div>
        </div>
      </div>

      {/* 핵심 정보만 간결하게 표시 */}
      <div className="p-4">
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 sm:gap-4 mb-4">
          {/* 습도 */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Droplets className="w-4 h-4 text-blue-500" />
              <span className="text-xs text-gray-600 font-medium">습도</span>
            </div>
            <div className="text-lg sm:text-xl font-bold text-gray-800">
              {Math.round(overallData.humidity)}%
            </div>
            <div className="text-xs text-gray-500">
              {overallData.humidity >= 80 ? '높음' : overallData.humidity >= 60 ? '보통' : '낮음'}
            </div>
          </div>

          {/* 강수량 */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Cloud className="w-4 h-4 text-gray-500" />
              <span className="text-xs text-gray-600 font-medium">강수량</span>
            </div>
            <div className="text-lg sm:text-xl font-bold text-gray-800">
              {overallData.rainfall.toFixed(1)}
            </div>
            <div className="text-xs text-gray-500">mm</div>
          </div>

          {/* 날씨 상태 */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <span className="text-sm">{getWeatherIcon(overallData.forecast)}</span>
              <span className="text-xs text-gray-600 font-medium">상태</span>
            </div>
            <div className="text-sm font-semibold text-gray-800">
              {overallData.forecast === 'Partly Cloudy (Day)' ? '부분흐림' :
               overallData.forecast === 'Partly Cloudy (Night)' ? '부분흐림' :
               overallData.forecast === 'Fair (Day)' ? '맑음' :
               overallData.forecast === 'Fair (Night)' ? '맑음' :
               overallData.forecast}
            </div>
          </div>

          {/* 업데이트 시간 */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Clock className="w-4 h-4 text-green-500" />
              <span className="text-xs text-gray-600 font-medium">업데이트</span>
            </div>
            <div className="text-sm font-semibold text-gray-800">
              {formatLastUpdate(overallData.lastUpdate)}
            </div>
            <div className="text-xs text-gray-500">자동 수집</div>
          </div>

          {/* AI 분석 버튼 */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 mb-1">
              <Brain className="w-4 h-4 text-purple-500" />
              <span className="text-xs text-gray-600 font-medium">AI 분석</span>
            </div>
            <button
              onClick={handleRealAIAnalysis}
              disabled={cohereLoading || !weatherData}
              className={`text-sm font-semibold px-3 py-1 rounded-full transition-all ${
                cohereLoading 
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : cohereService.isConfigured()
                  ? 'bg-purple-100 text-purple-800 hover:bg-purple-200 active:scale-95'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {cohereLoading ? (
                <div className="flex items-center gap-1">
                  <div className="animate-spin rounded-full h-3 w-3 border border-purple-300 border-t-purple-600"></div>
                  <span>분석중</span>
                </div>
              ) : (
                <div className="flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  <span>실행</span>
                </div>
              )}
            </button>
            <div className="text-xs text-gray-500 mt-0.5">
              {cohereService.isConfigured() ? 'Cohere AI' : 'API 미설정'}
            </div>
          </div>
        </div>

        {/* 로컬 데이터 분석 */}
        {!showRealAI && aiSummary && !aiLoading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">데이터 기반 요약</span>
            </div>
            <div className="text-sm text-gray-800 leading-relaxed">
              {aiSummary.summary.split('.')[0]}.
            </div>
            
            {aiSummary.highlights && aiSummary.highlights.length > 0 && (
              <div className="flex gap-1 mt-2">
                {aiSummary.highlights.slice(0, 2).filter(h => !h.includes('NEA')).map((highlight, index) => (
                  <span key={index} className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full">
                    {highlight}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Cohere AI 실시간 분석 결과 */}
        {showRealAI && cohereAnalysis && (
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600" />
                <span className="font-semibold text-purple-800">🤖 Cohere AI 실시간 분석</span>
              </div>
              <button
                onClick={() => setShowRealAI(false)}
                className="text-purple-600 hover:text-purple-800 text-sm px-2 py-1 rounded hover:bg-purple-100"
              >
                ✕
              </button>
            </div>
            
            <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">
              {cohereAnalysis.analysis}
            </div>
            
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-purple-200">
              <div className="flex items-center gap-4">
                <span className="text-xs text-purple-700 font-medium">
                  ✨ {cohereAnalysis.model}
                </span>
                <span className="text-xs text-purple-600">
                  신뢰도 {Math.round(cohereAnalysis.confidence * 100)}%
                </span>
              </div>
              <span className="text-xs text-purple-500">
                {new Date(cohereAnalysis.timestamp).toLocaleTimeString('ko-KR')}
              </span>
            </div>
          </div>
        )}

        {/* AI 분석 로딩 */}
        {cohereLoading && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-purple-300 border-t-purple-600"></div>
              <div>
                <div className="text-sm font-medium text-purple-800">🤖 Cohere AI 분석 중...</div>
                <div className="text-xs text-purple-600">실시간 날씨 데이터를 분석하고 있습니다</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

SingaporeOverallWeather.propTypes = {
  weatherData: PropTypes.shape({
    timestamp: PropTypes.string,
    data: PropTypes.shape({
      temperature: PropTypes.shape({
        average: PropTypes.number,
        readings: PropTypes.array
      }),
      humidity: PropTypes.shape({
        average: PropTypes.number
      }),
      rainfall: PropTypes.shape({
        total: PropTypes.number
      }),
      forecast: PropTypes.shape({
        general: PropTypes.shape({
          forecast: PropTypes.string
        })
      })
    })
  }),
  className: PropTypes.string
};

SingaporeOverallWeather.displayName = 'SingaporeOverallWeather';

export default SingaporeOverallWeather;