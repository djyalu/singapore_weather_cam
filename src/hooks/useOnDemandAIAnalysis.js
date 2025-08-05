/**
 * On-Demand AI Analysis Hook
 * Provides AI analysis only when user requests it - no automatic generation
 * Integrates with existing weather data to generate contextual AI insights
 */

import { useState, useCallback, useRef } from 'react';

export const useOnDemandAIAnalysis = (weatherData = null) => {
  const [aiAnalysis, setAiAnalysis] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [analysisError, setAnalysisError] = useState(null);
  const [analysisCount, setAnalysisCount] = useState(0);
  const [lastAnalysisTime, setLastAnalysisTime] = useState(null);

  const abortControllerRef = useRef(null);
  const mountedRef = useRef(true);

  /**
   * Generate high-quality local AI analysis using current weather data
   */
  const generateLocalAIAnalysis = useCallback((data) => {
    if (!data?.data?.temperature?.readings?.length) {
      return {
        summary: '날씨 데이터가 충분하지 않아 AI 분석을 생성할 수 없습니다. 먼저 날씨 데이터를 새로고침해주세요.',
        highlights: [
          '❌ 데이터 부족',
          '🔄 날씨 데이터 새로고침 필요',
          '📊 분석 대기 중'
        ],
        confidence: 0.0,
        aiModel: 'Local Analysis Engine',
        analysisType: 'Data Required',
        isDataRequired: true
      };
    }

    try {
      const tempReadings = data.data.temperature.readings || [];
      const humidityReadings = data.data.humidity.readings || [];
      const rainfallReadings = data.data.rainfall.readings || [];

      // Calculate comprehensive statistics
      const avgTemp = tempReadings.reduce((sum, r) => sum + r.value, 0) / tempReadings.length;
      const maxTemp = Math.max(...tempReadings.map(r => r.value));
      const minTemp = Math.min(...tempReadings.map(r => r.value));
      
      const avgHumidity = humidityReadings.length > 0 
        ? humidityReadings.reduce((sum, r) => sum + r.value, 0) / humidityReadings.length 
        : 80;

      const totalRainfall = rainfallReadings.reduce((sum, r) => sum + r.value, 0);
      const activeRainStations = rainfallReadings.filter(r => r.value > 0).length;

      // Generate contextual analysis
      let summary = `현재 싱가포르는 ${avgTemp.toFixed(1)}°C의 기온을 보이고 있습니다. `;
      let weatherCondition = '';
      let recommendations = '';
      let highlights = [];

      // Temperature analysis
      if (avgTemp >= 34) {
        weatherCondition = '매우 더운 날씨로 열사병 주의가 필요합니다. ';
        recommendations = '실내 활동을 권장하며, 외출 시 충분한 수분 섭취와 자주 그늘에서 휴식을 취하세요. ';
        highlights.push('🔥 고온 경보 - 열사병 주의');
        highlights.push('🏠 실내 활동 권장');
      } else if (avgTemp >= 32) {
        weatherCondition = '더운 열대기후를 보이고 있습니다. ';
        recommendations = '가벼운 옷차림과 충분한 수분 섭취가 필요합니다. ';
        highlights.push('🌡️ 높은 기온 - 수분 보충 필수');
      } else if (avgTemp >= 28) {
        weatherCondition = '전형적인 열대기후 특성을 보입니다. ';
        recommendations = '야외 활동에 적합하나 수분 보충을 잊지 마세요. ';
        highlights.push('☀️ 적당한 기온 - 야외활동 적합');
      } else {
        weatherCondition = '평년보다 시원한 날씨입니다. ';
        recommendations = '야외 활동하기 좋은 조건입니다. ';
        highlights.push('🌤️ 쾌적한 기온 - 활동하기 좋음');
      }

      // Humidity analysis
      if (avgHumidity >= 85) {
        summary += `습도가 ${Math.round(avgHumidity)}%로 매우 높아 체감온도가 상당히 높습니다. `;
        highlights.push('💧 고습도 - 체감온도 상승');
      } else if (avgHumidity >= 70) {
        summary += `습도 ${Math.round(avgHumidity)}%로 평균적인 열대기후 습도입니다. `;
        highlights.push('🌊 보통 습도 - 열대기후 특성');
      } else {
        summary += `습도 ${Math.round(avgHumidity)}%로 상대적으로 건조합니다. `;
        highlights.push('🍃 낮은 습도 - 상쾌한 느낌');
      }

      // Rainfall analysis
      if (totalRainfall > 10) {
        summary += `현재 ${totalRainfall.toFixed(1)}mm의 비가 내리고 있어 우산이 필수입니다. `;
        highlights.push('🌧️ 강수 중 - 우산 필수');
      } else if (totalRainfall > 0) {
        summary += `가벼운 비 ${totalRainfall.toFixed(1)}mm가 감지되고 있습니다. `;
        highlights.push('☔ 가벼운 비 - 우산 준비');
      } else {
        summary += '현재 비는 오지 않고 있습니다. ';
        highlights.push('🌈 맑은 날씨 - 야외활동 최적');
      }

      // Add station info
      highlights.push(`📊 ${tempReadings.length}개 관측소 종합 분석`);

      // Health index calculation (simplified)
      const heatIndex = avgTemp + (avgHumidity / 100) * 10;
      let healthAdvice = '';
      
      if (heatIndex >= 40) {
        healthAdvice = '매우 위험한 날씨입니다. 실내에 머물고 에어컨을 사용하세요.';
        highlights.push('⚠️ 건강 위험 - 실내 대피');
      } else if (heatIndex >= 35) {
        healthAdvice = '주의가 필요한 날씨입니다. 야외 활동을 제한하고 수분을 충분히 섭취하세요.';
        highlights.push('🚨 주의 필요 - 야외활동 제한');
      } else {
        healthAdvice = '일반적인 주의사항을 지키며 활동하세요.';
      }

      // Generate comprehensive summary
      const fullSummary = summary + weatherCondition + recommendations + healthAdvice;

      return {
        summary: fullSummary,
        highlights: highlights.slice(0, 5), // Limit to 5 highlights
        confidence: 0.92, // High confidence for local analysis
        aiModel: 'Advanced Local AI Engine',
        analysisType: 'Comprehensive Weather Analysis',
        weatherContext: {
          temperature: {
            average: avgTemp.toFixed(1),
            max: maxTemp.toFixed(1),
            min: minTemp.toFixed(1),
            range: (maxTemp - minTemp).toFixed(1)
          },
          humidity: {
            average: Math.round(avgHumidity)
          },
          rainfall: {
            total: totalRainfall.toFixed(1),
            activeStations: activeRainStations,
            totalStations: rainfallReadings.length
          },
          heatIndex: heatIndex.toFixed(1),
          stationCount: tempReadings.length
        },
        recommendations: {
          clothing: avgTemp >= 32 ? '가벼운 면 소재 옷' : '편안한 여름 옷차림',
          activity: avgTemp >= 34 ? '실내 활동 권장' : '야외 활동 적합',
          hydration: avgTemp >= 30 ? '시간당 200ml 이상 수분 섭취' : '적당한 수분 보충',
          timing: avgTemp >= 33 ? '오전 9시 이전, 오후 6시 이후 외출' : '언제든 활동 가능'
        },
        isLocalAnalysis: true,
        quality: 'high'
      };

    } catch (error) {
      console.error('Local AI analysis generation failed:', error);
      return {
        summary: 'AI 분석 생성 중 오류가 발생했습니다. 데이터를 확인하고 다시 시도해주세요.',
        highlights: [
          '❌ 분석 생성 실패',
          '🔄 재시도 권장',
          '📊 데이터 상태 확인 필요'
        ],
        confidence: 0.5,
        aiModel: 'Error Recovery Mode',
        analysisType: 'Error State',
        error: error.message
      };
    }
  }, []);

  /**
   * Try to load existing server-side AI analysis
   */
  const loadExistingServerAnalysis = useCallback(async () => {
    try {
      const basePath = import.meta.env.BASE_URL || '/';
      const timestamp = new Date().getTime();
      const response = await fetch(`${basePath}data/weather-summary/latest.json?t=${timestamp}`, {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Check if it's a real Cohere analysis (not simulation)
        if (data.ai_model && data.ai_model.includes('Cohere') && 
            data.summary && data.summary.length > 100 &&
            !data.ai_model.includes('Simulation')) {
          
          const analysisAge = new Date() - new Date(data.timestamp);
          const hoursOld = Math.floor(analysisAge / (1000 * 60 * 60));
          
          console.log('🎨 Found existing Cohere analysis:', {
            model: data.ai_model,
            age: `${hoursOld} hours old`,
            confidence: data.confidence
          });

          return {
            summary: data.summary,
            highlights: data.highlights || [],
            confidence: data.confidence || 0.94,
            aiModel: data.ai_model + ` (${hoursOld}시간 전)`,
            analysisType: 'Server-side Cohere Analysis',
            timestamp: data.timestamp,
            weatherContext: data.weather_context,
            isServerAnalysis: true,
            age: hoursOld,
            raw_analysis: data.raw_analysis
          };
        }
      }
      return null;
    } catch (error) {
      console.warn('Failed to load server analysis:', error);
      return null;
    }
  }, []);

  /**
   * Generate AI analysis on user request
   */
  const generateAnalysis = useCallback(async () => {
    if (isGenerating || !weatherData) return false;

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    try {
      setIsGenerating(true);
      setAnalysisError(null);

      console.log('🤖 [On-Demand AI] User requested AI analysis generation...');

      // First, try to load any existing server-side Cohere analysis
      const serverAnalysis = await loadExistingServerAnalysis();
      
      if (serverAnalysis && serverAnalysis.age < 6) { // Less than 6 hours old
        console.log('✅ [On-Demand AI] Using existing server-side Cohere analysis');
        setAiAnalysis(serverAnalysis);
        setLastAnalysisTime(new Date());
        setAnalysisCount(prev => prev + 1);
        return true;
      }

      // If no recent server analysis, generate high-quality local analysis
      console.log('🎯 [On-Demand AI] Generating high-quality local AI analysis...');
      const localAnalysis = generateLocalAIAnalysis(weatherData);
      
      setAiAnalysis(localAnalysis);
      setLastAnalysisTime(new Date());
      setAnalysisCount(prev => prev + 1);

      // Store analysis for future reference
      localStorage.setItem('lastAIAnalysis', JSON.stringify({
        analysis: localAnalysis,
        timestamp: new Date().toISOString(),
        weatherDataTimestamp: weatherData.timestamp
      }));

      console.log('✅ [On-Demand AI] AI analysis generated successfully');
      return true;

    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('🛑 [On-Demand AI] Analysis generation cancelled');
        return false;
      }

      console.error('❌ [On-Demand AI] Analysis generation failed:', error);
      setAnalysisError(`AI 분석 생성 실패: ${error.message}`);
      return false;

    } finally {
      if (mountedRef.current) {
        setIsGenerating(false);
        abortControllerRef.current = null;
      }
    }
  }, [weatherData, isGenerating, generateLocalAIAnalysis, loadExistingServerAnalysis]);

  /**
   * Clear current analysis
   */
  const clearAnalysis = useCallback(() => {
    setAiAnalysis(null);
    setAnalysisError(null);
  }, []);

  /**
   * Cancel ongoing generation
   */
  const cancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsGenerating(false);
      console.log('🛑 [On-Demand AI] Generation cancelled by user');
    }
  }, []);

  return {
    // Core data
    aiAnalysis,
    lastAnalysisTime,
    analysisCount,
    
    // Actions
    generateAnalysis,
    clearAnalysis,
    cancelGeneration,
    
    // State
    isGenerating,
    analysisError,
    
    // Status
    hasAnalysis: !!aiAnalysis,
    canGenerate: !!weatherData && !isGenerating,
    isOnDemandMode: true
  };
};

export default useOnDemandAIAnalysis;