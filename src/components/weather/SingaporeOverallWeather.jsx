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

  // AI 날씨 요약 데이터 생성
  useEffect(() => {
    const generateSmartWeatherSummary = async () => {
      if (!weatherData) return;
      
      setAiLoading(true);
      try {
        console.log('🤖 Generating smart weather summary...');
        
        const overallData = getOverallWeatherData();
        const forecast = weatherData?.data?.forecast?.general;
        
        // 스마트 요약 생성
        const summary = generateIntelligentSummary(overallData, forecast);
        const highlights = generateHighlights(overallData, forecast);
        const recommendation = generateRecommendation(overallData, forecast);
        
        setAiSummary({
          summary,
          highlights,
          recommendation,
          confidence: 0.85,
          aiModel: 'Smart Data Engine',
          timestamp: new Date().toISOString(),
          isRealAnalysis: false  // 실제 AI API 사용하지 않음
        });
        
        console.log('✅ Smart weather summary generated');
      } catch (error) {
        console.warn('⚠️ Failed to generate smart summary:', error);
        
        // 최종 폴백
        setAiSummary({
          summary: '실시간 날씨 데이터를 기반으로 현재 날씨 상황을 분석하고 있습니다.',
          highlights: ['NEA Singapore 공식 데이터'],
          recommendation: '날씨 변화에 주의하세요.',
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
    const currentHour = new Date().getHours();
    const forecastText = forecast?.forecast || '';
    
    let summary = '싱가포르는 현재 ';
    
    // 온도 분석
    if (temp >= 32) {
      summary += `매우 더운 날씨(${temp}°C)로, `;
    } else if (temp >= 30) {
      summary += `더운 날씨(${temp}°C)로, `;
    } else if (temp >= 28) {
      summary += `따뜻한 날씨(${temp}°C)로, `;
    } else {
      summary += `쾌적한 날씨(${temp}°C)로, `;
    }
    
    // 습도 및 체감 분석
    if (humidity >= 85) {
      summary += '높은 습도(85%+)로 인해 실제보다 더 덥게 느껴집니다. ';
    } else if (humidity >= 75) {
      summary += '다소 높은 습도로 �끈끈한 느낌이 있습니다. ';
    } else {
      summary += '적당한 습도로 비교적 쾌적합니다. ';
    }
    
    // 강수 및 예보 분석
    if (rainfall > 0) {
      summary += `현재 ${rainfall}mm의 비가 내리고 있으며, `;
    } else if (forecastText.includes('Thundery') || forecastText.includes('Shower')) {
      summary += '소나기나 뇌우의 가능성이 있어 ';
    } else if (forecastText.includes('Cloudy')) {
      summary += '구름이 많은 하늘로 ';
    } else {
      summary += '맑은 하늘로 ';
    }
    
    // 시간대별 조언
    if (currentHour >= 6 && currentHour <= 11) {
      summary += '아침 시간대로 야외 활동하기 좋은 시간입니다.';
    } else if (currentHour >= 12 && currentHour <= 17) {
      summary += '오후 시간대로 강한 햇볕에 주의하세요.';
    } else if (currentHour >= 18 && currentHour <= 21) {
      summary += '저녁 시간대로 산책하기 좋습니다.';
    } else {
      summary += '야간 시간대로 실내 활동을 권합니다.';
    }
    
    return summary;
  };

  const generateHighlights = (data, forecast) => {
    const highlights = [];
    const temp = data.temperature;
    const humidity = data.humidity;
    const rainfall = data.rainfall;
    
    // 온도 하이라이트
    if (temp >= 32) {
      highlights.push('고온 주의보');
    } else if (temp <= 24) {
      highlights.push('선선한 날씨');
    }
    
    // 습도 하이라이트
    if (humidity >= 85) {
      highlights.push('높은 습도');
    } else if (humidity <= 60) {
      highlights.push('낮은 습도');
    }
    
    // 강수 하이라이트
    if (rainfall > 5) {
      highlights.push('강한 비');
    } else if (rainfall > 0) {
      highlights.push('약한 비');
    } else {
      highlights.push('강수 없음');
    }
    
    // 예보 하이라이트
    const forecastText = forecast?.forecast || '';
    if (forecastText.includes('Thundery')) {
      highlights.push('뇌우 가능성');
    } else if (forecastText.includes('Shower')) {
      highlights.push('소나기 예상');
    } else if (forecastText.includes('Fair')) {
      highlights.push('맑은 날씨');
    }
    
    // 기본 하이라이트가 없으면 추가
    if (highlights.length === 0) {
      highlights.push('일반적인 열대 기후');
    }
    
    highlights.push('실시간 NEA 데이터');
    
    return highlights;
  };

  const generateRecommendation = (data, forecast) => {
    const temp = data.temperature;
    const humidity = data.humidity;
    const rainfall = data.rainfall;
    const forecastText = forecast?.forecast || '';
    
    let recommendation = '';
    
    // 온도 기반 추천
    if (temp >= 32) {
      recommendation += '충분한 수분 섭취와 그늘에서 휴식을 취하세요. ';
    } else if (temp <= 26) {
      recommendation += '야외 활동하기 좋은 날씨입니다. ';
    }
    
    // 습도 기반 추천
    if (humidity >= 85) {
      recommendation += '높은 습도로 인해 실내 활동을 권합니다. ';
    }
    
    // 강수 기반 추천
    if (rainfall > 0) {
      recommendation += '우산이나 우비를 준비하세요. ';
    } else if (forecastText.includes('Thundery') || forecastText.includes('Shower')) {
      recommendation += '갑작스러운 소나기에 대비해 우산을 휴대하세요. ';
    }
    
    // 기본 추천사항
    if (!recommendation) {
      recommendation = '현재 날씨 조건에서는 일반적인 야외 활동이 가능합니다. ';
    }
    
    recommendation += '날씨 변화를 주기적으로 확인하세요.';
    
    return recommendation;
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
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-4">
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
        </div>

        {/* 간결한 날씨 요약 */}
        {aiSummary && !aiLoading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="text-sm text-gray-800 leading-relaxed">
              {/* 핵심 정보만 간단하게 */}
              {aiSummary.summary.split('.')[0]}.
            </div>
            
            {/* 하이라이트 중 가장 중요한 것만 1-2개 */}
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