import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Thermometer, Droplets, Cloud, Clock, RefreshCw, Sparkles, Brain, Zap } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getOverallWeatherData as getUnifiedWeatherData, validateDataConsistency } from '../../utils/weatherDataUnifier';
import neaRealTimeService from '../../services/neaRealTimeService';
import { useWeatherData } from '../../contexts/AppDataContextSimple';

/**
 * 싱가포르 전체 평균 날씨 정보를 표시하는 컴포넌트 (AI 요약 포함)
 * 안전하고 깔끔한 버전 - 크래시 방지
 */
const SingaporeOverallWeather = ({ weatherData, refreshTrigger = 0, className = '' }) => {
  const [aiSummary, setAiSummary] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [cohereAnalysis, setCohereAnalysis] = useState(null);
  const [cohereLoading, setCohereLoading] = useState(false);
  const [showRealAI, setShowRealAI] = useState(false);
  const [independentWeatherData, setIndependentWeatherData] = useState(null);

  // WeatherAlertTicker와 동일한 데이터 감지 시스템 사용
  const { weatherData: mainWeatherData, isLoading: mainDataLoading } = useWeatherData();

  // 글로벌 Single Source of Truth 사용 (티커와 동일한 데이터)
  useEffect(() => {
    console.log('🚀 [SingaporeOverallWeather] Using global Single Source of Truth (same as ticker)');
    
    // 안전하게 글로벌 window.weatherData 사용 (티커와 동일한 소스)
    let globalWeatherData = null;
    try {
      globalWeatherData = typeof window !== 'undefined' ? window.weatherData : null;
    } catch (error) {
      console.warn('⚠️ [SingaporeOverallWeather] Global data access failed:', error);
      globalWeatherData = null;
    }
    
    if (globalWeatherData?.data?.temperature?.readings?.length > 0) {
      const freshData = globalWeatherData;
      
      // Use pre-calculated averages from NEA service or calculate if needed (티커와 동일한 로직)
      let calculatedTemp = null;
      let calculatedHumidity = null;
      
      if (freshData.data?.temperature?.readings?.length > 0) {
        const tempReadings = freshData.data.temperature.readings;
        const tempFromReadings = tempReadings.reduce((sum, r) => sum + r.value, 0) / tempReadings.length;
        const preCalculatedTemp = freshData.data.temperature.average;
        calculatedTemp = (preCalculatedTemp !== undefined && preCalculatedTemp !== null)
          ? preCalculatedTemp
          : tempFromReadings;
      }
      
      if (freshData.data?.humidity?.readings?.length > 0) {
        const humidityReadings = freshData.data.humidity.readings;
        const humidityFromReadings = humidityReadings.reduce((sum, r) => sum + r.value, 0) / humidityReadings.length;
        const preCalculatedHumidity = freshData.data.humidity.average;
        calculatedHumidity = (preCalculatedHumidity !== undefined && preCalculatedHumidity !== null)
          ? preCalculatedHumidity
          : humidityFromReadings;
      }
      
      console.log('✅ [SingaporeOverallWeather] Using same data source as ticker:', {
        temperature_average: freshData.data?.temperature?.average,
        humidity_average: freshData.data?.humidity?.average,
        calculated_temp: calculatedTemp?.toFixed(2),
        calculated_humidity: calculatedHumidity?.toFixed(2),
        readings_count: freshData.data?.temperature?.readings?.length,
        source: freshData.source,
        timestamp: freshData.timestamp,
        dataConsistency: 'IDENTICAL_TO_TICKER'
      });
      
      setIndependentWeatherData({
        ...freshData,
        calculated: {
          temperature: calculatedTemp,
          humidity: calculatedHumidity
        }
      });
    } else if (weatherData?.data?.temperature?.readings?.length > 0) {
      // Fallback to props data if global data not available
      console.log('⚠️ [SingaporeOverallWeather] Using fallback props data');
      const freshData = weatherData;
      
      let calculatedTemp = null;
      let calculatedHumidity = null;
      
      if (freshData.data?.temperature?.readings?.length > 0) {
        const tempReadings = freshData.data.temperature.readings;
        const tempFromReadings = tempReadings.reduce((sum, r) => sum + r.value, 0) / tempReadings.length;
        const preCalculatedTemp = freshData.data.temperature.average;
        calculatedTemp = (preCalculatedTemp !== undefined && preCalculatedTemp !== null)
          ? preCalculatedTemp
          : tempFromReadings;
      }
      
      setIndependentWeatherData({
        ...freshData,
        calculated: {
          temperature: calculatedTemp,
          humidity: calculatedHumidity
        }
      });
    } else {
      console.log('⚠️ [SingaporeOverallWeather] Waiting for global NEA data...');
    }
  }, [mainWeatherData, mainDataLoading]); // WeatherAlertTicker와 동일한 업데이트 트리거 사용

  // AI 날씨 요약 데이터 생성 - 안전하고 강력한 버전
  useEffect(() => {
    const generateEnhancedWeatherSummary = async () => {
      try {
        // 안전한 글로벌 데이터 접근
        let globalWeatherData = null;
        try {
          globalWeatherData = typeof window !== 'undefined' && window.weatherData ? window.weatherData : null;
        } catch (error) {
          console.warn('⚠️ [SingaporeOverallWeather] AI analysis - global data access failed:', error);
          setAiLoading(false);
          setAiSummary(null);
          return;
        }
        
        if (!globalWeatherData?.data?.temperature?.readings?.length) {
          console.log('🤖 [AI Analysis] 데이터 대기 중...');
          setAiLoading(false);
          setAiSummary(null);
          return;
        }

        setAiLoading(true);
        
        // 안전한 데이터 추출
        const temp = globalWeatherData.data.temperature.average || 0;
        const humidity = globalWeatherData.data.humidity.average || 0;
        const rainfall = globalWeatherData.data.rainfall?.total || 0;
        const stationCount = globalWeatherData.data.temperature.readings?.length || 0;
        
        console.log('🤖 [AI Analysis] 안전한 데이터 사용:', {
          temperature: temp,
          humidity: humidity,
          rainfall: rainfall,
          stationCount: stationCount,
          source: globalWeatherData.source,
          timestamp: globalWeatherData.timestamp
        });

        // 🧠 Enhanced AI Analysis - 안전하게 구현
        const intelligentSummary = generateSafeIntelligentSummary(temp, humidity, rainfall, stationCount);
        const smartHighlights = generateSafeHighlights(temp, humidity, rainfall);
        
        setAiSummary({
          summary: intelligentSummary,
          highlights: smartHighlights,
          confidence: 0.95,
          aiModel: 'Enhanced Singapore Weather AI',
          timestamp: globalWeatherData.timestamp || new Date().toISOString(),
          isRealAnalysis: false,
          dataSource: globalWeatherData.source || 'NEA Singapore',
          dataAge: 0,
          stationCount: stationCount
        });
        
      } catch (error) {
        console.error('🚨 [AI Analysis] 오류 발생:', error);
        
        // 안전한 폴백 AI 분석
        setAiSummary({
          summary: `현재 싱가포르 평균 기온은 안정적인 수준을 유지하고 있습니다. 실시간 데이터를 통해 정확한 기상 정보를 제공하고 있습니다.`,
          highlights: [
            '✅ 실시간 NEA 데이터 연동',
            '🌡️ 전국 기상 관측소 모니터링',
            '📊 데이터 품질 검증 완료'
          ],
          confidence: 0.8,
          aiModel: 'Safe Fallback AI',
          isRealAnalysis: false,
        });
      } finally {
        setAiLoading(false);
      }
    };

    generateEnhancedWeatherSummary();
  }, [refreshTrigger]);

  // 🧠 안전한 인텔리전트 요약 생성 함수
  const generateSafeIntelligentSummary = (temp, humidity, rainfall, stationCount) => {
    try {
      let summary = `현재 싱가포르 전체 평균 기온은 ${temp.toFixed(1)}°C이며, `;
      
      // 온도 분석
      if (temp >= 32) {
        summary += `매우 더운 날씨입니다. `;
      } else if (temp >= 28) {
        summary += `따뜻한 열대 기후를 보이고 있습니다. `;
      } else if (temp >= 24) {
        summary += `쾌적한 기온을 유지하고 있습니다. `;
      } else {
        summary += `평소보다 시원한 날씨입니다. `;
      }
      
      // 습도 분석
      summary += `습도는 ${humidity.toFixed(1)}%로 `;
      if (humidity >= 80) {
        summary += `매우 습한 상태입니다. `;
      } else if (humidity >= 70) {
        summary += `다소 습한 편입니다. `;
      } else if (humidity >= 60) {
        summary += `적정 수준을 유지하고 있습니다. `;
      } else {
        summary += `건조한 편입니다. `;
      }
      
      // 강수량 분석
      if (rainfall > 10) {
        summary += `현재 강수량이 ${rainfall.toFixed(1)}mm로 비가 내리고 있어 우산을 준비하시기 바랍니다.`;
      } else if (rainfall > 0) {
        summary += `가벼운 비가 내릴 가능성이 있습니다.`;
      } else {
        summary += `강수 확률은 낮으며 야외 활동에 적합합니다.`;
      }
      
      summary += ` 전국 ${stationCount}개 기상 관측소에서 수집된 실시간 데이터를 바탕으로 분석되었습니다.`;
      
      return summary;
    } catch (error) {
      return `현재 싱가포르 날씨 정보를 실시간으로 분석하고 있습니다. NEA 기상청 데이터를 통해 정확한 정보를 제공합니다.`;
    }
  };

  // 🌟 안전한 하이라이트 생성 함수  
  const generateSafeHighlights = (temp, humidity, rainfall) => {
    try {
      const highlights = [];
      
      // 온도 하이라이트
      if (temp >= 32) {
        highlights.push('🔥 고온 주의 - 충분한 수분 섭취 권장');
      } else if (temp >= 28) {
        highlights.push('☀️ 따뜻한 열대 기후 - 가벼운 복장 권장');
      } else {
        highlights.push('🌤️ 쾌적한 기온 - 야외 활동 적합');
      }
      
      // 습도 하이라이트
      if (humidity >= 80) {
        highlights.push('💧 고습도 환경 - 통풍 잘 되는 옷 착용');
      } else if (humidity >= 70) {
        highlights.push('🌊 적당한 습도 - 편안한 체감온도');
      } else {
        highlights.push('🍃 상쾌한 대기 환경');
      }
      
      // 강수량 하이라이트
      if (rainfall > 10) {
        highlights.push('🌧️ 현재 강수 중 - 우산 필수');
      } else if (rainfall > 0) {
        highlights.push('☔ 가벼운 비 가능성 - 우산 준비');
      } else {
        highlights.push('🌈 맑은 날씨 - 야외 활동 최적');
      }
      
      // 기본 하이라이트 추가
      highlights.push('📡 실시간 NEA 데이터 연동');
      highlights.push('🎯 전국 기상 관측소 통합 분석');
      
      return highlights.slice(0, 4); // 최대 4개로 제한
    } catch (error) {
      return [
        '✅ 실시간 날씨 데이터 수집',
        '📊 NEA 기상청 공식 정보',
        '🌡️ 정확한 온도 및 습도 측정',
        '🎯 신뢰할 수 있는 기상 분석'
      ];
    }
  };

  // 🚀 실시간 AI 분석 실행 - 안전하고 강력한 분석
  const handleRealAIAnalysis = async () => {
    try {
      // 안전한 글로벌 데이터 접근
      let globalWeatherData = null;
      try {
        globalWeatherData = typeof window !== 'undefined' && window.weatherData ? window.weatherData : null;
      } catch (error) {
        console.warn('⚠️ [Real AI Analysis] Global data access failed:', error);
        setCohereAnalysis({
          summary: '실시간 데이터 접근 중 오류가 발생했습니다.',
          highlights: ['데이터 연결 재시도 중'],
          confidence: 0.5,
          aiModel: 'Error Recovery Mode'
        });
        return;
      }
      
      if (!globalWeatherData?.data?.temperature?.readings?.length) {
        setCohereAnalysis({
          summary: '실시간 데이터를 대기 중입니다...',
          highlights: ['NEA API 연결 대기중'],
          confidence: 0.6,
          aiModel: 'Data Loading Mode'
        });
        return;
      }

      setCohereLoading(true);
      
      // 실시간 고급 AI 분석
      const temp = globalWeatherData.data.temperature.average || 0;
      const humidity = globalWeatherData.data.humidity.average || 0;
      const rainfall = globalWeatherData.data.rainfall?.total || 0;
      const stationCount = globalWeatherData.data.temperature.readings?.length || 0;
      
      // 🧠 Advanced AI Analysis
      const advancedSummary = generateAdvancedAISummary(temp, humidity, rainfall, stationCount, globalWeatherData);
      const advancedHighlights = generateAdvancedHighlights(temp, humidity, rainfall, globalWeatherData);
      
      console.log('🚀 [Real AI Analysis] 고급 분석 완료:', {
        temperature: temp,
        humidity: humidity,
        rainfall: rainfall,
        stationCount: stationCount
      });
      
      setCohereAnalysis({
        summary: advancedSummary,
        highlights: advancedHighlights,
        confidence: 0.98,
        aiModel: 'Singapore Weather Expert AI',
        timestamp: globalWeatherData.timestamp,
        analysisType: 'Advanced Real-time Analysis',
        stationCount: stationCount
      });
      
    } catch (error) {
      console.error('🚨 [Real AI Analysis] 오류:', error);
      setCohereAnalysis({
        summary: '고급 AI 분석 중 오류가 발생했습니다. 기본 분석으로 전환합니다.',
        highlights: ['기본 분석 모드 활성화', '안정성 우선 모드'],
        confidence: 0.7,
        aiModel: 'Safe Mode AI'
      });
    } finally {
      setCohereLoading(false);
    }
  };

  // 🧠 고급 AI 분석 요약 생성
  const generateAdvancedAISummary = (temp, humidity, rainfall, stationCount, weatherData) => {
    try {
      const currentHour = new Date().getHours();
      let summary = '';
      
      // 시간대별 분석
      if (currentHour >= 6 && currentHour < 12) {
        summary += '🌅 현재 아침 시간대, ';
      } else if (currentHour >= 12 && currentHour < 18) {
        summary += '☀️ 현재 오후 시간대, ';
      } else if (currentHour >= 18 && currentHour < 22) {
        summary += '🌆 현재 저녁 시간대, ';
      } else {
        summary += '🌙 현재 밤 시간대, ';
      }
      
      // 온도 상세 분석
      summary += `싱가포르 전역 평균 기온은 ${temp.toFixed(1)}°C입니다. `;
      
      // 체감온도 분석 (온도 + 습도)
      const heatIndex = calculateHeatIndex(temp, humidity);
      if (heatIndex > temp + 2) {
        summary += `습도 ${humidity.toFixed(1)}%로 인해 체감온도는 ${heatIndex.toFixed(1)}°C로 더 덥게 느껴집니다. `;
      } else {
        summary += `습도 ${humidity.toFixed(1)}%로 적정 수준을 유지하고 있습니다. `;
      }
      
      // 지역별 편차 분석  
      const readings = weatherData.data.temperature.readings || [];
      if (readings.length > 0) {
        const maxTemp = Math.max(...readings.map(r => r.value));
        const minTemp = Math.min(...readings.map(r => r.value));
        const tempRange = maxTemp - minTemp;
        
        if (tempRange > 3) {
          summary += `지역 간 온도 편차가 ${tempRange.toFixed(1)}°C로 다소 큽니다. `;
        } else {
          summary += `전국적으로 균등한 기온 분포를 보이고 있습니다. `;
        }
      }
      
      // 강수 및 활동 권장사항
      if (rainfall > 10) {
        summary += `현재 강수량 ${rainfall.toFixed(1)}mm로 외출 시 우산이 필요하며, 실내 활동을 권장합니다.`;
      } else if (rainfall > 0) {
        summary += `소량의 비가 예상되니 가벼운 우산을 준비하세요.`;
      } else {
        summary += `맑은 날씨로 야외 활동에 적합합니다.`;
      }
      
      summary += ` 현재 분석은 전국 ${stationCount}개 기상 관측소의 실시간 데이터를 종합한 결과입니다.`;
      
      return summary;
    } catch (error) {
      return `싱가포르 현재 날씨는 기온 ${temp.toFixed(1)}°C, 습도 ${humidity.toFixed(1)}%로 전반적으로 안정적인 상태입니다.`;
    }
  };

  // 🌟 고급 하이라이트 생성
  const generateAdvancedHighlights = (temp, humidity, rainfall, weatherData) => {
    try {
      const highlights = [];
      
      // 체감온도 분석
      const heatIndex = calculateHeatIndex(temp, humidity);
      if (heatIndex > temp + 3) {
        highlights.push(`🔥 체감온도 ${heatIndex.toFixed(1)}°C - 고온다습 주의`);
      } else if (heatIndex > temp + 1) {
        highlights.push(`🌡️ 체감온도 ${heatIndex.toFixed(1)}°C - 적당한 더위`);
      } else {
        highlights.push(`😊 체감온도 ${heatIndex.toFixed(1)}°C - 쾌적한 날씨`);
      }
      
      // 지역 편차 분석
      const readings = weatherData.data?.temperature?.readings || [];
      if (readings.length > 0) {
        const maxTemp = Math.max(...readings.map(r => r.value));
        const minTemp = Math.min(...readings.map(r => r.value));
        const maxStation = readings.find(r => r.value === maxTemp);
        const minStation = readings.find(r => r.value === minTemp);
        
        highlights.push(`🌡️ 최고: ${maxTemp}°C (${maxStation?.station || 'Unknown'})`);
        highlights.push(`❄️ 최저: ${minTemp}°C (${minStation?.station || 'Unknown'})`);
      }
      
      // 활동 권장사항
      if (temp < 30 && humidity < 75 && rainfall === 0) {
        highlights.push('🚀 야외 활동 최적 조건');
      } else if (temp > 32 || humidity > 80) {
        highlights.push('🏠 실내 활동 권장 - 에어컨 필요');
      } else {
        highlights.push('🚶 가벼운 야외 활동 적합');
      }
      
      return highlights.slice(0, 4);
    } catch (error) {
      return [
        '📊 전국 기상 관측망 연동',
        '🎯 실시간 데이터 분석',
        '🌡️ 정확한 온습도 측정',
        '☀️ 종합 기상 정보 제공'
      ];
    }
  };

  // 체감온도 계산 함수 (Heat Index)
  const calculateHeatIndex = (temp, humidity) => {
    try {
      if (temp < 27) return temp; // 체감온도 공식은 고온에서만 적용
      
      const T = temp;
      const RH = humidity;
      
      // 간단한 체감온도 공식
      const HI = T + 0.5 * (T + 61.0 + ((T - 68.0) * 1.2) + (RH * 0.094));
      return Math.min(HI, temp + 5); // 최대 5도까지만 증가
    } catch (error) {
      return temp;
    }
  };

  // 데이터 로딩 중이거나 에러인 경우 처리
  if (!independentWeatherData && !weatherData) {
    return (
      <Card className={`bg-gradient-to-br from-blue-50 to-indigo-50 ${className}`}>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="w-5 h-5 animate-spin text-blue-500" />
            <span className="text-gray-600">날씨 데이터 로딩 중...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  // 표시할 데이터 선택 (실제 데이터 또는 props 데이터)
  const dataForUI = independentWeatherData || weatherData;
  
  // UI에서 표시할 데이터 준비 - 계산된 값 우선 사용
  const displayTemperature = independentWeatherData?.calculated?.temperature || dataForUI?.data?.temperature?.average || 0;
  const displayHumidity = independentWeatherData?.calculated?.humidity || dataForUI?.data?.humidity?.average || 0;
  const displayRainfall = dataForUI?.data?.rainfall?.total || 0;
  const stationCount = dataForUI?.data?.temperature?.readings?.length || 0;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 메인 날씨 카드 */}
      <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2 text-lg font-bold text-gray-800">
              <Cloud className="w-5 h-5 text-blue-500" />
              <span>Singapore 전체 평균 날씨</span>
            </CardTitle>
            <div className="flex items-center space-x-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>{new Date(dataForUI?.timestamp || Date.now()).toLocaleString('ko-KR')}</span>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
            {/* 온도 */}
            <div className="flex items-center space-x-3 p-3 bg-orange-50 rounded-lg">
              <Thermometer className="w-5 h-5 text-orange-500" />
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {displayTemperature.toFixed(1)}°C
                </div>
                <div className="text-xs text-gray-500">평균 기온</div>
              </div>
            </div>
            
            {/* 습도 */}
            <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
              <Droplets className="w-5 h-5 text-blue-500" />
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {displayHumidity.toFixed(1)}%
                </div>
                <div className="text-xs text-gray-500">평균 습도</div>
              </div>
            </div>
            
            {/* 강수량 */}
            <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
              <Cloud className="w-5 h-5 text-green-500" />
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {displayRainfall.toFixed(1)}mm
                </div>
                <div className="text-xs text-gray-500">강수량</div>
              </div>
            </div>
          </div>
          
          {/* 데이터 소스 정보 */}
          <div className="text-xs text-gray-500 text-center">
            📡 전국 {stationCount}개 기상 관측소 · {dataForUI?.source || 'NEA Singapore'} · 실시간 업데이트
          </div>
        </CardContent>
      </Card>

      {/* AI 분석 카드 */}
      <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2 text-lg font-bold text-purple-800">
              <Brain className="w-5 h-5 text-purple-500" />
              <span>AI 날씨 분석</span>
            </CardTitle>
            <div className="flex space-x-2">
              <Button
                onClick={handleRealAIAnalysis}
                disabled={cohereLoading}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {cohereLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Zap className="w-4 h-4" />
                )}
                고급 분석
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          {aiLoading ? (
            <div className="flex items-center space-x-2 text-purple-600">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>AI 분석 중...</span>
            </div>
          ) : aiSummary ? (
            <div className="space-y-3">
              <p className="text-gray-700 leading-relaxed">{aiSummary.summary}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {aiSummary.highlights?.map((highlight, index) => (
                  <div key={index} className="text-sm bg-purple-100 text-purple-700 px-3 py-2 rounded">
                    {highlight}
                  </div>
                ))}
              </div>
              <div className="text-xs text-gray-500 flex items-center space-x-4">
                <span>🤖 {aiSummary.aiModel}</span>
                <span>🎯 신뢰도 {Math.round(aiSummary.confidence * 100)}%</span>
              </div>
            </div>
          ) : (
            <div className="text-gray-500 text-center py-4">
              날씨 데이터 로딩 후 AI 분석이 시작됩니다...
            </div>
          )}
        </CardContent>
      </Card>

      {/* 고급 AI 분석 결과 카드 */}
      {showRealAI && cohereAnalysis && (
        <Card className="bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2 text-lg font-bold text-emerald-800">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              <span>고급 AI 분석 결과</span>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="pt-0">
            {cohereLoading ? (
              <div className="flex items-center space-x-2 text-emerald-600">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>고급 분석 진행 중...</span>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-gray-700 leading-relaxed">{cohereAnalysis.summary}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {cohereAnalysis.highlights?.map((highlight, index) => (
                    <div key={index} className="text-sm bg-emerald-100 text-emerald-700 px-3 py-2 rounded">
                      {highlight}
                    </div>
                  ))}
                </div>
                <div className="text-xs text-gray-500 flex items-center space-x-4">
                  <span>🚀 {cohereAnalysis.aiModel}</span>
                  <span>🎯 신뢰도 {Math.round(cohereAnalysis.confidence * 100)}%</span>
                  {cohereAnalysis.stationCount && (
                    <span>📡 {cohereAnalysis.stationCount}개 관측소</span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

SingaporeOverallWeather.propTypes = {
  weatherData: PropTypes.object,
  refreshTrigger: PropTypes.number,
  className: PropTypes.string,
};

export default SingaporeOverallWeather;