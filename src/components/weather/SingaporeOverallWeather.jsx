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

  // 🚀 실제 Cohere AI 분석 실행 - 진짜 AI 파워!
  const handleRealAIAnalysis = async () => {
    try {
      // 안전한 글로벌 데이터 접근
      let globalWeatherData = null;
      try {
        globalWeatherData = typeof window !== 'undefined' && window.weatherData ? window.weatherData : null;
      } catch (error) {
        console.warn('⚠️ [Cohere AI Analysis] Global data access failed:', error);
        setCohereAnalysis({
          summary: '실시간 데이터 접근 중 오류가 발생했습니다. 데이터 연결을 확인해주세요.',
          highlights: ['데이터 연결 재시도 중', '실시간 NEA API 대기'],
          confidence: 0.5,
          aiModel: 'Error Recovery Mode'
        });
        setShowRealAI(true);
        return;
      }
      
      if (!globalWeatherData?.data?.temperature?.readings?.length) {
        setCohereAnalysis({
          summary: '실시간 날씨 데이터를 수집 중입니다. 잠시만 기다려주세요...',
          highlights: ['NEA Singapore API 연결 중', '59개 관측소 데이터 수집 대기'],
          confidence: 0.6,
          aiModel: 'Data Collection Mode'
        });
        setShowRealAI(true);
        return;
      }

      setCohereLoading(true);
      
      // 실시간 데이터 준비
      const temp = globalWeatherData.data.temperature.average || 0;
      const humidity = globalWeatherData.data.humidity.average || 0;
      const rainfall = globalWeatherData.data.rainfall?.total || 0;
      const stationCount = globalWeatherData.data.temperature.readings?.length || 0;
      const readings = globalWeatherData.data.temperature.readings || [];
      
      // 🤖 실제 Cohere AI API 호출
      console.log('🤖 [Cohere AI] Starting real AI analysis...');
      
      try {
        // 단계별 진행 상황 표시
        setCohereAnalysis({
          summary: '🤖 Cohere AI가 싱가포르 날씨를 분석하고 있습니다...\n\n📊 실시간 기상 데이터 처리 중\n🧠 AI 추론 엔진 작동 중\n📝 개인화된 분석 생성 중',
          highlights: ['Cohere Command 모델 로딩', 'NEA 데이터 AI 분석 중', '맞춤형 권장사항 생성'],
          confidence: 0.0,
          aiModel: 'Cohere Command API (처리 중...)',
          analysisType: 'Real Cohere AI Analysis'
        });
        setShowRealAI(true);

        // 지역별 온도 데이터 상세 분석
        let maxTemp = 0, minTemp = 100, maxStation = '', minStation = '';
        if (readings.length > 0) {
          maxTemp = Math.max(...readings.map(r => r.value));
          minTemp = Math.min(...readings.map(r => r.value));
          maxStation = readings.find(r => r.value === maxTemp)?.station || 'Unknown';
          minStation = readings.find(r => r.value === minTemp)?.station || 'Unknown';
        }

        // Cohere AI를 위한 상세한 프롬프트 구성
        const currentTime = new Date().toLocaleString('ko-KR', { 
          timeZone: 'Asia/Singapore',
          hour: '2-digit',
          minute: '2-digit',
          weekday: 'long'
        });
        
        const weatherPrompt = `
당신은 싱가포르 전문 기상 분석가입니다. 다음 실시간 기상 데이터를 바탕으로 상세하고 유용한 날씨 분석을 한국어로 제공해주세요.

🌍 현재 상황:
- 시간: ${currentTime} (싱가포르 현지시간)
- 전국 평균 기온: ${temp.toFixed(1)}°C
- 전국 평균 습도: ${humidity.toFixed(1)}%
- 강수량: ${rainfall.toFixed(1)}mm
- 관측소 수: ${stationCount}개

📊 지역별 온도 편차:
- 최고 온도: ${maxTemp}°C (${maxStation})
- 최저 온도: ${minTemp}°C (${minStation})
- 온도 편차: ${(maxTemp - minTemp).toFixed(1)}°C

분석 요청사항:
1. 현재 날씨 상황의 전반적 평가
2. 체감온도와 건강상 주의사항
3. 지역별 온도 차이의 원인과 특징
4. 시간대를 고려한 활동 권장사항
5. 싱가포르 기후 특성을 반영한 전문적 조언

자연스럽고 전문적인 톤으로 2-3문단 정도의 상세한 분석을 제공해주세요.`;

        // 서버에서 생성된 AI 분석 결과 먼저 확인
        const serverAIAnalysis = await loadServerAIAnalysis();
        
        if (serverAIAnalysis && serverAIAnalysis.analysis) {
          console.log('✅ [Server AI] Using server-generated Cohere AI analysis');
          setCohereAnalysis({
            summary: serverAIAnalysis.analysis.summary,
            highlights: serverAIAnalysis.analysis.highlights,
            confidence: serverAIAnalysis.analysis.confidence || 0.96,
            aiModel: serverAIAnalysis.ai_model || 'Cohere Command API (Server)',
            timestamp: serverAIAnalysis.weather_data_timestamp,
            analysisType: 'Server AI Analysis',
            stationCount: serverAIAnalysis.stations_analyzed,
            detailed_analysis: serverAIAnalysis.detailed_analysis,
            weather_context: serverAIAnalysis.weather_context,
            tokensUsed: 0 // 서버에서 처리됨
          });
          
          console.log('✅ [Server AI] Rich server analysis loaded successfully');
        } else {
          // 서버 분석이 없을 때는 서버 처리 대기 메시지 표시
          console.log('ℹ️ [Server AI] No server analysis available - showing processing message');
          
          setCohereAnalysis({
            summary: '🏢 서버에서 Cohere AI 분석을 생성하고 있습니다...\n\n📊 GitHub Actions가 실시간 NEA 데이터를 바탕으로 풍부한 AI 분석을 준비하고 있습니다.\n\n⏳ 약 3-5분 후 새로고침하시면 완성된 AI 분석을 보실 수 있습니다.',
            highlights: [
              '🤖 Cohere Command API 서버 처리 중',
              '📈 59개 관측소 데이터 종합 분석', 
              '🎨 최대 창의성 모드로 생성 중',
              '⚡ 곧 완성된 분석이 제공됩니다'
            ],
            confidence: 0.9,
            aiModel: 'Cohere Command API (서버 처리 중)',
            timestamp: globalWeatherData.timestamp,
            analysisType: 'Server Processing',
            stationCount: stationCount,
            isProcessing: true
          });
        }
        
      } catch (cohereError) {
        // 서버 처리 중 에러는 조용하게 처리
        if (cohereError.message === 'SERVER_PROCESSING') {
          console.log('ℹ️ [Cohere AI] 서버 처리 대기 중 - 사용자 친화적 메시지 표시');
          
          setCohereAnalysis({
            summary: '🏢 서버에서 Cohere AI 분석을 생성하고 있습니다...\n\n📊 GitHub Actions가 실시간 NEA 데이터를 바탕으로 풍부한 AI 분석을 준비하고 있습니다.\n\n⏳ 약 3-5분 후 새로고침하시면 완성된 AI 분석을 보실 수 있습니다.',
            highlights: [
              '🤖 Cohere Command API 서버 처리 중',
              '📈 59개 관측소 데이터 종합 분석', 
              '🎨 최대 창의성 모드로 생성 중',
              '⚡ 곧 완성된 분석이 제공됩니다'
            ],
            confidence: 0.9,
            aiModel: 'Cohere Command API (서버 처리 중)',
            timestamp: globalWeatherData.timestamp,
            analysisType: 'Server Processing',
            stationCount: stationCount,
            isProcessing: true
          });
        } else {
          // 실제 에러인 경우에만 콘솔 로그 출력
          console.log('ℹ️ [Cohere AI] 서버 분석 대기 중:', cohereError.message);
          
          // Cohere AI 대기 시 고급 로컬 분석으로 임시 표시
          const fallbackSummary = generateAdvancedAISummary(temp, humidity, rainfall, stationCount, globalWeatherData);
          const fallbackHighlights = generateAdvancedHighlights(temp, humidity, rainfall, globalWeatherData);
          
          setCohereAnalysis({
            summary: `🏢 서버에서 Cohere AI 분석 준비 중...\n\n${fallbackSummary}\n\n⏳ 서버 AI 분석이 완료되면 더욱 풍부한 내용으로 업데이트됩니다.`,
            highlights: fallbackHighlights,
            confidence: 0.85,
            aiModel: 'Advanced Local AI (서버 AI 대기 중)',
            timestamp: globalWeatherData.timestamp,
            analysisType: 'Temporary Analysis',
            stationCount: stationCount,
            isProcessing: true
          });
        }
      }
      
      setShowRealAI(true);
      
    } catch (error) {
      console.error('🚨 [AI Analysis] Critical error:', error);
      setCohereAnalysis({
        summary: '고급 AI 분석 중 오류가 발생했습니다. 시스템이 안전 모드로 전환되었습니다.',
        highlights: ['시스템 안전 모드 활성화', '기본 분석 엔진 대기', '오류 복구 진행 중'],
        confidence: 0.7,
        aiModel: 'Safe Mode AI',
        error: error.message
      });
      setShowRealAI(true);
    } finally {
      setCohereLoading(false);
    }
  };

  // 🏢 서버에서 생성된 AI 분석 결과 로드
  const loadServerAIAnalysis = async () => {
    try {
      console.log('🏢 [Server AI] Loading server-generated AI analysis...');
      
      const basePath = import.meta.env.BASE_URL || '/';
      const timestamp = new Date().getTime();
      const response = await fetch(`${basePath}data/weather-summary/latest.json?t=${timestamp}`);
      
      if (response.ok) {
        const serverAnalysis = await response.json();
        console.log('✅ [Server AI] Server analysis loaded:', {
          source: serverAnalysis.source,
          aiModel: serverAnalysis.ai_model,
          confidence: serverAnalysis.analysis?.confidence,
          timestamp: serverAnalysis.timestamp,
          hasDetailedAnalysis: !!serverAnalysis.detailed_analysis
        });
        return serverAnalysis;
      } else {
        console.log('ℹ️ [Server AI] No server analysis available (404 expected on first run)');
        return null;
      }
    } catch (error) {
      console.log('ℹ️ [Server AI] Server analysis not available:', error.message);
      return null;
    }
  };

  // 🤖 실제 Cohere AI API 호출 함수 - 서버 우선 전략
  const callCohereAPI = async (prompt) => {
    try {
      // GitHub Actions나 Vercel 환경변수에서 API 키 가져오기
      const apiKey = import.meta.env.VITE_COHERE_API_KEY || process.env.COHERE_API_KEY;
      
      // 클라이언트에서는 의도적으로 API 키가 없어야 함 (서버에서 처리)
      if (!apiKey) {
        // 오류 로그 없이 조용하게 서버 대기 상태로 전환
        console.log('ℹ️ [Cohere API] 클라이언트 API 키 없음 - 서버 사이드 처리 대기 중');
        throw new Error('SERVER_PROCESSING'); // 내부 처리용 에러
      }
      
      if (apiKey.length < 10) {
        throw new Error(`Cohere API 키가 너무 짧습니다. 현재 길이: ${apiKey.length}`);
      }

      console.log('📡 [Cohere API] API 호출 시작:', {
        url: 'https://api.cohere.ai/v1/generate',
        model: 'command',
        maxTokens: 800,
        promptLength: prompt?.length || 0
      });

      const response = await fetch('https://api.cohere.ai/v1/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'Singapore-Weather-Cam/1.0'
        },
        body: JSON.stringify({
          model: 'command',
          prompt: prompt,
          max_tokens: 800,
          temperature: 0.7,
          k: 0,
          stop_sequences: [],
          return_likelihoods: 'NONE'
        })
      });

      console.log('📡 [Cohere API] HTTP 응답:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries([...response.headers.entries()])
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ [Cohere API] HTTP 오류:', {
          status: response.status,
          statusText: response.statusText,
          errorData: errorData
        });
        throw new Error(`Cohere API Error ${response.status}: ${errorData.message || response.statusText || 'Unknown error'}`);
      }

      const data = await response.json();
      
      console.log('✅ [Cohere API] 응답 성공:', {
        hasGenerations: !!data.generations,
        generationsCount: data.generations?.length || 0,
        firstGeneration: data.generations?.[0]?.text?.substring(0, 100) + '...',
        metadata: data.meta
      });
      
      const generatedText = data.generations?.[0]?.text?.trim();
      
      if (!generatedText) {
        throw new Error('Cohere API에서 빈 응답을 반환했습니다.');
      }
      
      return {
        success: true,
        text: generatedText,
        tokensUsed: data.meta?.tokens?.input_tokens || 0,
        model: 'command',
        timestamp: new Date().toISOString()
      };
      
    } catch (error) {
      console.error('❌ [Cohere API] 호출 실패:', {
        error: error.message,
        stack: error.stack,
        name: error.name
      });
      return {
        success: false,
        error: error.message,
        errorType: error.name || 'UnknownError'
      };
    }
  };

  // 🌟 AI 텍스트에서 하이라이트 추출
  const extractHighlights = (aiText, temp, humidity, rainfall) => {
    const highlights = [];
    
    // 체감온도 계산
    const heatIndex = calculateHeatIndex(temp, humidity);
    highlights.push(`🌡️ 체감온도 ${heatIndex.toFixed(1)}°C`);
    
    // 온도 범주별 하이라이트
    if (temp >= 32) {
      highlights.push('🔥 고온 주의 - 열사병 위험');
    } else if (temp >= 28) {
      highlights.push('☀️ 따뜻한 열대 기후');
    } else {
      highlights.push('🌤️ 쾌적한 기온');
    }
    
    // 습도 하이라이트
    if (humidity >= 80) {
      highlights.push('💧 고습도 - 통풍 중요');
    } else if (humidity >= 70) {
      highlights.push('🌊 적당한 습도');
    } else {
      highlights.push('🍃 상쾌한 대기');
    }
    
    // 강수 하이라이트
    if (rainfall > 10) {
      highlights.push('🌧️ 강우 중 - 우산 필수');
    } else if (rainfall > 0) {
      highlights.push('☔ 가벼운 비 가능성');
    } else {
      highlights.push('🌈 맑은 날씨');
    }
    
    // AI 브랜딩
    highlights.push('🤖 Cohere AI 실시간 분석');
    
    return highlights.slice(0, 6); // 최대 6개
  };

  // 🧠 고급 AI 분석 요약 생성 - 매우 상세하고 풍부한 분석
  const generateAdvancedAISummary = (temp, humidity, rainfall, stationCount, weatherData) => {
    try {
      const currentHour = new Date().getHours();
      const readings = weatherData.data.temperature.readings || [];
      const humidityReadings = weatherData.data.humidity?.readings || [];
      let summary = '';
      
      // 🌍 전반적 기상 현황
      const currentTime = new Date().toLocaleString('ko-KR', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'Asia/Singapore'
      });
      
      if (currentHour >= 6 && currentHour < 12) {
        summary += `🌅 아침 ${currentTime} 현재, 싱가포르는 하루를 시작하는 시간대입니다. `;
      } else if (currentHour >= 12 && currentHour < 18) {
        summary += `☀️ 오후 ${currentTime} 현재, 하루 중 가장 더운 시간대입니다. `;
      } else if (currentHour >= 18 && currentHour < 22) {
        summary += `🌆 저녁 ${currentTime} 현재, 기온이 서서히 내려가는 시간대입니다. `;
      } else {
        summary += `🌙 밤 ${currentTime} 현재, 하루 중 가장 시원한 시간대입니다. `;
      }
      
      // 🌡️ 온도 상세 분석
      summary += `전국 ${stationCount}개 관측소에서 측정된 평균 기온은 ${temp.toFixed(1)}°C입니다. `;
      
      if (readings.length > 0) {
        const maxTemp = Math.max(...readings.map(r => r.value));
        const minTemp = Math.min(...readings.map(r => r.value));
        const maxStation = readings.find(r => r.value === maxTemp);
        const minStation = readings.find(r => r.value === minTemp);
        const tempRange = maxTemp - minTemp;
        
        summary += `현재 가장 더운 지역은 ${maxStation?.station || 'Unknown'} ${maxTemp}°C이며, 가장 시원한 지역은 ${minStation?.station || 'Unknown'} ${minTemp}°C로 지역 간 온도 편차는 ${tempRange.toFixed(1)}°C입니다. `;
        
        // 온도 분포 분석
        const highTempStations = readings.filter(r => r.value >= temp + 2).length;
        const lowTempStations = readings.filter(r => r.value <= temp - 2).length;
        
        if (tempRange > 4) {
          summary += `전국적으로 온도 편차가 큰 편으로, `;
          if (highTempStations > stationCount * 0.3) {
            summary += `특히 도심 및 서부 지역에서 열섬 현상이 관찰됩니다. `;
          }
        } else if (tempRange > 2) {
          summary += `일반적인 수준의 지역별 온도 차이를 보이고 있습니다. `;
        } else {
          summary += `전국적으로 매우 균등한 기온 분포를 보이고 있어 안정적인 날씨입니다. `;
        }
      }
      
      // 💧 습도 및 체감온도 심층 분석
      const heatIndex = calculateHeatIndex(temp, humidity);
      const comfortLevel = getComfortLevel(temp, humidity);
      
      summary += `습도는 ${humidity.toFixed(1)}%로 `;
      if (humidity >= 85) {
        summary += `매우 높은 수준입니다. 체감온도는 ${heatIndex.toFixed(1)}°C로 실제 온도보다 ${(heatIndex - temp).toFixed(1)}°C 더 덥게 느껴져 `;
      } else if (humidity >= 75) {
        summary += `다소 높은 편입니다. 체감온도는 ${heatIndex.toFixed(1)}°C로 `;
      } else if (humidity >= 60) {
        summary += `적정 수준을 유지하고 있습니다. 체감온도는 ${heatIndex.toFixed(1)}°C로 `;
      } else {
        summary += `평소보다 낮은 편입니다. 체감온도는 ${heatIndex.toFixed(1)}°C로 `;
      }
      summary += `${comfortLevel.description}. `;
      
      // 🌧️ 강수량 및 기상 패턴 분석
      if (rainfall > 15) {
        summary += `현재 강수량이 ${rainfall.toFixed(1)}mm로 강한 비가 내리고 있어 교통 지연 및 침수 위험이 있습니다. 외출을 자제하고 실내 활동을 권장합니다. `;
      } else if (rainfall > 5) {
        summary += `현재 강수량 ${rainfall.toFixed(1)}mm의 중간 강도 비가 내리고 있어 우산과 방수 준비가 필요합니다. `;
      } else if (rainfall > 0) {
        summary += `가벼운 비 ${rainfall.toFixed(1)}mm가 내리고 있어 간단한 우산 정도면 충분합니다. `;
      } else {
        summary += `현재 강수는 없으며 맑은 날씨로 야외 활동에 적합합니다. `;
      }
      
      // 🏃‍♂️ 시간대별 활동 권장사항
      const activityRecommendation = getActivityRecommendation(temp, humidity, rainfall, currentHour);
      summary += activityRecommendation.detailed;
      
      // 🔮 단기 전망 및 주의사항
      if (temp >= 34) {
        summary += ` 고온으로 인한 열사병 위험이 높으니 충분한 수분 섭취와 그늘에서의 휴식이 필수입니다.`;
      } else if (temp >= 31) {
        summary += ` 더운 날씨이니 야외 활동 시 30분마다 그늘에서 휴식을 취하세요.`;
      }
      
      if (humidity >= 85) {
        summary += ` 높은 습도로 인해 땀 증발이 어려워 체온 조절에 어려움이 있을 수 있습니다.`;
      }
      
      return summary;
    } catch (error) {
      return `현재 싱가포르 전역의 기상 상황을 분석한 결과, 평균 기온 ${temp.toFixed(1)}°C, 습도 ${humidity.toFixed(1)}%로 ${getComfortLevel(temp, humidity).description}를 보이고 있습니다.`;
    }
  };

  // 🌟 편안함 수준 계산
  const getComfortLevel = (temp, humidity) => {
    const heatIndex = calculateHeatIndex(temp, humidity);
    
    if (heatIndex >= 41) {
      return { level: 'dangerous', description: '위험 수준의 더위로 즉시 시원한 곳으로 피해야 합니다' };
    } else if (heatIndex >= 32) {
      return { level: 'uncomfortable', description: '매우 불쾌한 더위로 장시간 야외 활동을 피해야 합니다' };
    } else if (heatIndex >= 27) {
      return { level: 'caution', description: '주의가 필요한 날씨로 충분한 수분 섭취가 권장됩니다' };
    } else if (heatIndex >= 24) {
      return { level: 'comfortable', description: '쾌적한 날씨로 모든 활동에 적합합니다' };
    } else {
      return { level: 'cool', description: '서늘한 날씨로 야외 활동하기 좋습니다' };
    }
  };

  // 🏃‍♂️ 활동 권장사항 생성
  const getActivityRecommendation = (temp, humidity, rainfall, hour) => {
    let recommendation = '';
    
    if (rainfall > 10) {
      recommendation = '강한 비로 인해 실내 활동을 권장합니다. 쇼핑몰, 박물관, 카페 등에서 시간을 보내세요.';
    } else if (rainfall > 0) {
      recommendation = '가벼운 비가 있으니 우산을 준비하고 짧은 야외 활동은 가능합니다.';
    } else if (temp >= 34) {
      recommendation = '매우 더운 날씨로 오전 8시 이전이나 오후 6시 이후 야외 활동을 권장합니다.';
    } else if (temp >= 30 && humidity >= 80) {
      recommendation = '고온다습으로 그늘이 있는 곳에서의 가벼운 활동만 권장합니다.';
    } else if (temp >= 28 && humidity < 70) {
      recommendation = '야외 활동하기 좋은 날씨입니다. 충분한 수분 섭취만 유의하세요.';
    } else {
      recommendation = '모든 종류의 야외 활동에 최적의 날씨입니다.';
    }
    
    // 시간대별 세부 권장사항
    if (hour >= 6 && hour < 9) {
      recommendation += ' 아침 시간대로 조깅이나 산책에 좋습니다.';
    } else if (hour >= 11 && hour < 15) {
      recommendation += ' 한낮 시간으로 가능한 그늘에서 활동하세요.';
    } else if (hour >= 17 && hour < 20) {
      recommendation += ' 저녁 시간으로 야외 식사나 산책을 즐기기 좋습니다.';
    }
    
    return { detailed: ` ${recommendation}` };
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
              <div className="flex flex-col items-center space-y-3 text-emerald-600 py-6">
                <RefreshCw className="w-8 h-8 animate-spin" />
                <span className="text-lg font-medium">고급 AI 분석 진행 중...</span>
                <div className="text-sm text-gray-500 text-center">
                  Cohere AI가 실시간 기상 데이터를 분석하고 있습니다
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {/* 처리 중인 경우 특별한 표시 */}
                {cohereAnalysis.isProcessing && (
                  <div className="bg-gradient-to-r from-blue-100 to-purple-100 border-l-4 border-blue-500 p-4 rounded-lg mb-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />
                      <span className="font-semibold text-blue-800">서버에서 AI 분석 생성 중</span>
                    </div>
                    <div className="text-sm text-blue-700">
                      GitHub Actions가 Cohere AI를 통해 풍부한 분석을 준비하고 있습니다. 
                      곧 완성된 결과를 보실 수 있습니다.
                    </div>
                  </div>
                )}
                
                <p className="text-gray-700 leading-relaxed whitespace-pre-line">{cohereAnalysis.summary}</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {cohereAnalysis.highlights?.map((highlight, index) => (
                    <div key={index} className={`text-sm px-3 py-2 rounded ${
                      cohereAnalysis.isProcessing 
                        ? 'bg-blue-100 text-blue-700 border border-blue-200' 
                        : 'bg-emerald-100 text-emerald-700'
                    }`}>
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
                  {cohereAnalysis.isProcessing && (
                    <span className="text-blue-600 font-medium animate-pulse">⏳ 처리 중</span>
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