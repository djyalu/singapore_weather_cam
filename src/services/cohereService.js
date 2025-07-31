/**
 * Cohere AI API 서비스
 * 실시간 날씨 데이터 분석 및 인사이트 제공
 */

class CohereService {
  constructor() {
    this.baseURL = 'https://api.cohere.ai/v1';
    this.apiKey = import.meta.env.VITE_COHERE_API_KEY;
    this.model = 'command-light'; // 빠른 응답을 위한 경량 모델
    
    // 디버깅 정보
    console.log('🔑 Cohere API 키 상태:', {
      hasKey: !!this.apiKey,
      keyLength: this.apiKey ? this.apiKey.length : 0,
      keyPrefix: this.apiKey ? this.apiKey.substring(0, 8) + '...' : 'NOT_SET',
      envVars: Object.keys(import.meta.env).filter(key => key.includes('COHERE'))
    });
  }

  /**
   * Cohere API로 날씨 데이터 분석
   */
  async analyzeWeatherData(weatherData) {
    if (!this.apiKey) {
      console.warn('⚠️ Cohere API key not found');
      return null;
    }

    try {
      const prompt = this.buildWeatherAnalysisPrompt(weatherData);
      
      const response = await fetch(`${this.baseURL}/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt: prompt,
          max_tokens: 150,
          temperature: 0.3,
          k: 0,
          stop_sequences: ['--'],
          return_likelihoods: 'NONE'
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Cohere API Error: ${response.status} - ${errorData.message || 'Unknown error'}`);
      }

      const data = await response.json();
      
      if (!data.generations || data.generations.length === 0) {
        throw new Error('No analysis generated');
      }

      const analysis = data.generations[0].text.trim();
      
      return {
        analysis,
        confidence: 0.95,
        model: 'Cohere Command-Light',
        timestamp: new Date().toISOString(),
        isRealAnalysis: true
      };

    } catch (error) {
      console.error('🚨 Cohere API 분석 실패:', error);
      throw error;
    }
  }

  /**
   * 날씨 데이터를 기반으로 AI 분석 프롬프트 생성
   */
  buildWeatherAnalysisPrompt(weatherData) {
    const { current, locations, timestamp } = weatherData;
    
    // 현재 시간 정보
    const now = new Date();
    const singaporeTime = now.toLocaleString('ko-KR', { 
      timeZone: 'Asia/Singapore',
      hour: '2-digit',
      minute: '2-digit'
    });

    // 지역별 온도 데이터 요약
    const tempData = locations?.slice(0, 5).map(loc => 
      `${loc.name}: ${loc.temperature}°C`
    ).join(', ') || '';

    const prompt = `싱가포르 날씨 전문가로서, 다음 실시간 기상 데이터를 분석해주세요:

현재 시간: ${singaporeTime} (싱가포르 시간)
전체 평균 온도: ${current?.temperature || 'N/A'}°C
전체 평균 습도: ${current?.humidity || 'N/A'}%
강수량: ${current?.rainfall || 0}mm
예보: ${current?.description || 'N/A'}

주요 지역 온도: ${tempData}

다음 형식으로 간결하고 실용적인 분석을 해주세요:

1. 현재 날씨 상황 (한 문장)
2. 주의사항 또는 추천사항 (한 문장)
3. 향후 몇 시간 예상 (한 문장)

한국어로 친근하고 이해하기 쉽게 작성해주세요.

분석:`;

    return prompt;
  }

  /**
   * API 키 설정 여부 확인
   */
  isConfigured() {
    return !!this.apiKey;
  }

  /**
   * API 연결 테스트
   */
  async testConnection() {
    if (!this.apiKey) {
      return { success: false, error: 'API key not configured' };
    }

    try {
      const response = await fetch(`${this.baseURL}/generate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          prompt: 'Test connection',
          max_tokens: 10,
          temperature: 0.1
        })
      });

      if (response.ok) {
        return { success: true, message: 'Cohere API 연결 성공' };
      } else {
        const errorData = await response.json();
        return { success: false, error: errorData.message || 'Connection failed' };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}

// 싱글톤 인스턴스 생성
const cohereService = new CohereService();

export default cohereService;