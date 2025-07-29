import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Thermometer, Droplets, Cloud, Clock, RefreshCw, Sparkles } from 'lucide-react';

/**
 * 싱가포르 전체 평균 날씨 정보를 표시하는 컴포넌트 (AI 요약 포함)
 */
const SingaporeOverallWeather = React.memo(({ weatherData, className = '' }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [aiSummary, setAiSummary] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  // 1초마다 현재 시간 업데이트
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // AI 날씨 요약 데이터 로드
  useEffect(() => {
    const loadAiWeatherSummary = async () => {
      if (!weatherData) return;
      
      setAiLoading(true);
      try {
        console.log('🤖 Loading AI weather summary...');
        
        // GitHub Actions에서 생성된 AI 날씨 요약 데이터 로드
        const basePath = import.meta.env.BASE_URL || '/';
        const timestamp = new Date().getTime();
        const response = await fetch(`${basePath}data/weather-summary/latest.json?t=${timestamp}`);
        
        if (response.ok) {
          const summaryData = await response.json();
          console.log('✅ AI weather summary loaded:', summaryData);
          
          setAiSummary({
            summary: summaryData.summary || '날씨 요약을 불러오는 중입니다...',
            highlights: summaryData.highlights || [],
            recommendation: summaryData.recommendation || '현재 날씨에 적합한 활동을 줊아하세요.',
            confidence: summaryData.confidence || 0.85,
            aiModel: summaryData.ai_model || 'Cohere Command API',
            timestamp: summaryData.timestamp,
            isRealAnalysis: true
          });
        } else {
          throw new Error(`Weather summary not found: ${response.status}`);
        }
      } catch (error) {
        console.warn('⚠️ Failed to load AI weather summary:', error);
        
        // 폴백: 기본 요약 생성
        const overallData = getOverallWeatherData();
        let fallbackSummary = '싱가포르는 현재 ';
        
        if (overallData.temperature >= 30) {
          fallbackSummary += '더운 날씨입니다. 수분 섭취와 실내 활동을 추천합니다.';
        } else if (overallData.rainfall > 0) {
          fallbackSummary += '비가 오고 있습니다. 우산을 챙겨주세요.';
        } else {
          fallbackSummary += '쾌적한 날씨입니다. 야외 활동을 즐겨보세요.';
        }
        
        setAiSummary({
          summary: fallbackSummary,
          highlights: ['실시간 날씨 데이터 기반'],
          recommendation: '날씨 변화를 주의 깊게 보세요.',
          confidence: 0.7,
          aiModel: '기본 분석',
          isRealAnalysis: false
        });
      } finally {
        setAiLoading(false);
      }
    };

    loadAiWeatherSummary();
  }, [weatherData]);

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

  // 습도에 따른 색상
  const getHumidityColor = (humidity) => {
    if (humidity >= 85) return 'text-blue-600';
    if (humidity >= 70) return 'text-blue-500';
    if (humidity >= 50) return 'text-green-500';
    return 'text-yellow-500';
  };

  return (
    <div className={`bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-xl shadow-xl p-6 ${className}`}
         style={{ minHeight: '200px' }}>
      {/* 헤더 */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-3 rounded-full">
            <Cloud className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">🇸🇬 Singapore Weather</h2>
            <p className="text-blue-100 text-sm">실시간 전국 평균 기상 정보</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-white/90 text-sm">현재 시간</div>
          <div className="text-lg font-mono bg-white/20 px-3 py-1 rounded-lg">
            {formatCurrentTime()}
          </div>
        </div>
      </div>

      {/* 주요 날씨 정보 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        {/* 온도 */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Thermometer className="w-6 h-6 text-red-300" />
            <span className="text-sm font-medium text-white/90">평균 온도</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-bold ${getTemperatureColor(overallData.temperature)}`}>
              {overallData.temperature.toFixed(1)}
            </span>
            <span className="text-xl text-white/80">°C</span>
          </div>
          <div className="text-xs text-white/70 mt-1">
            {overallData.stationCount}개 관측소 평균
          </div>
        </div>

        {/* 습도 */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <Droplets className="w-6 h-6 text-blue-300" />
            <span className="text-sm font-medium text-white/90">상대 습도</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-bold ${getHumidityColor(overallData.humidity)}`}>
              {Math.round(overallData.humidity)}
            </span>
            <span className="text-xl text-white/80">%</span>
          </div>
          <div className="text-xs text-white/70 mt-1">
            {overallData.humidity >= 80 ? '매우 습함' : overallData.humidity >= 60 ? '습함' : '보통'}
          </div>
        </div>

        {/* 강수량 & 날씨 상태 */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-2xl">{getWeatherIcon(overallData.forecast)}</span>
            <span className="text-sm font-medium text-white/90">날씨 상태</span>
          </div>
          <div className="text-lg font-semibold text-white mb-1">
            {overallData.forecast === 'Partly Cloudy (Day)' ? '부분적으로 흐림' :
             overallData.forecast === 'Partly Cloudy (Night)' ? '부분적으로 흐림 (밤)' :
             overallData.forecast === 'Fair (Day)' ? '맑음' :
             overallData.forecast === 'Fair (Night)' ? '맑음 (밤)' :
             overallData.forecast}
          </div>
          <div className="text-xs text-white/70">
            강수량: {overallData.rainfall.toFixed(1)}mm
          </div>
        </div>
      </div>

      {/* AI 날씨 요약 섹션 */}
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="bg-white/20 p-2 rounded-full">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h4 className="text-lg font-semibold text-white">AI 날씨 요약</h4>
            <p className="text-xs text-white/70">Cohere AI 기반 실시간 분석</p>
          </div>
        </div>
        
        {aiLoading ? (
          <div className="flex items-center gap-3 text-white/80">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-white/30 border-t-white"></div>
            <span className="text-sm">날씨 상황 분석 중...</span>
          </div>
        ) : aiSummary ? (
          <div className="space-y-3">
            <div className="text-white text-sm leading-relaxed">
              {aiSummary.summary}
            </div>
            
            {aiSummary.highlights && aiSummary.highlights.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {aiSummary.highlights.map((highlight, index) => (
                  <span key={index} className="bg-white/20 text-white text-xs px-2 py-1 rounded-full">
                    • {highlight}
                  </span>
                ))}
              </div>
            )}
            
            {aiSummary.recommendation && (
              <div className="bg-white/10 rounded-lg p-3 border-l-4 border-white/30">
                <p className="text-white/90 text-sm">
                  <span className="font-medium">💡 추천:</span> {aiSummary.recommendation}
                </p>
              </div>
            )}
            
            <div className="flex items-center justify-between text-xs text-white/60">
              <span className={aiSummary.isRealAnalysis ? 'text-green-200' : 'text-orange-200'}>
                {aiSummary.isRealAnalysis ? '🤖 실제 AI 분석' : '🔄 기본 분석'} • {aiSummary.aiModel}
              </span>
              <span>
                신뢰도: {Math.round(aiSummary.confidence * 100)}%
              </span>
            </div>
          </div>
        ) : (
          <div className="text-white/60 text-sm text-center py-2">
            AI 날씨 요약을 불러오는 중...
          </div>
        )}
      </div>

      {/* 업데이트 정보 */}
      <div className="flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-lg p-3">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-white/70" />
          <span className="text-sm text-white/90">마지막 업데이트:</span>
          <span className="text-sm font-medium text-white">
            {formatLastUpdate(overallData.lastUpdate)}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 text-white/70" />
          <span className="text-xs text-white/70">
            자동 업데이트: 3시간마다
          </span>
        </div>
      </div>

      {/* 추가 정보 */}
      <div className="mt-4 text-center">
        <div className="text-xs text-white/60">
          데이터 출처: NEA Singapore (National Environment Agency) • 
          {overallData.stationCount}개 기상관측소 실시간 데이터
        </div>
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