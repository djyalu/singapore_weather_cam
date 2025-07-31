/**
 * NEA Singapore API 기상 경보 서비스
 * 실시간 날씨 경보, 폭염/호우 정보, 대기질 정보 등을 제공
 */

class NEAAlertService {
  constructor() {
    // 개발 환경에서는 프록시 사용, 프로덕션에서는 직접 호출 시도
    this.baseURL = import.meta.env.DEV ? '/api/nea' : 'https://api.data.gov.sg/v1';
    this.endpoints = {
      weather: '/environment/2-hour-weather-forecast',
      psi: '/environment/psi',
      pm25: '/environment/pm25',
      temperature: '/environment/air-temperature',
      rainfall: '/environment/rainfall',
      humidity: '/environment/relative-humidity',
      windSpeed: '/environment/wind-speed',
      uvi: '/environment/uv-index'
    };
  }

  /**
   * 실제 NEA API를 통한 기상 경보 정보 수집
   */
  async getWeatherAlerts() {
    try {
      console.log('🚨 NEA Singapore API 기상 경보 정보 수집 시작...');
      console.log('📡 Using base URL:', this.baseURL);
      
      // 병렬로 여러 NEA API 호출
      const [weatherResult, tempResult, psiResult] = await Promise.allSettled([
        this.fetchWeatherForecast(),
        this.fetchTemperature(), 
        this.fetchPSI()
      ]);

      const alerts = [];
      const now = new Date();

      // 2시간 날씨 예보 분석
      if (weatherResult.status === 'fulfilled' && weatherResult.value) {
        console.log('📡 Weather forecast data received');
        const weatherAlerts = this.analyzeWeatherForecast(weatherResult.value);
        alerts.push(...weatherAlerts);
      } else {
        console.warn('⚠️ Weather forecast API failed:', weatherResult.reason?.message);
      }

      // 온도 데이터 분석  
      if (tempResult.status === 'fulfilled' && tempResult.value) {
        console.log('🌡️ Temperature data received');
        const tempAlerts = this.analyzeTemperature(tempResult.value);
        alerts.push(...tempAlerts);
      } else {
        console.warn('⚠️ Temperature API failed:', tempResult.reason?.message);
      }

      // PSI 대기질 분석
      if (psiResult.status === 'fulfilled' && psiResult.value) {
        console.log('🍃 PSI data received');
        const psiAlerts = this.analyzePSI(psiResult.value);
        alerts.push(...psiAlerts);
      } else {
        console.warn('⚠️ PSI API failed:', psiResult.reason?.message);
      }

      // API 호출 결과에 따른 적절한 메시지
      if (alerts.length === 0) {
        const hasAnyData = [weatherResult, tempResult, psiResult].some(r => r.status === 'fulfilled');
        
        if (hasAnyData) {
          alerts.push({
            type: 'info',
            priority: 'low',
            icon: '🌤️',
            message: '현재 특별한 기상 경보는 없습니다. 쾌적한 날씨를 즐기세요!',
            timestamp: now.toISOString(),
            source: 'NEA Singapore'
          });
        } else {
          // 모든 API가 실패한 경우 - 수집된 데이터로 대체
          console.log('🔄 Falling back to collected weather data...');
          const fallbackData = await this.getCollectedWeatherData();
          if (fallbackData && fallbackData.current) {
            const { temperature, humidity, rainfall } = fallbackData.current;
            
            if (temperature >= 32) {
              alerts.push({
                type: 'warning',
                priority: 'high',
                icon: '🌡️',
                message: `고온 주의! 현재 ${temperature.toFixed(1)}°C (수집된 데이터 기준)`,
                timestamp: now.toISOString(),
                source: 'Collected Data'
              });
            } else {
              alerts.push({
                type: 'info',
                priority: 'low',
                icon: '🌤️',
                message: `현재 ${temperature.toFixed(1)}°C, 습도 ${humidity.toFixed(0)}% (수집된 데이터 기준)`,
                timestamp: now.toISOString(),
                source: 'Collected Data'
              });
            }
          } else {
            alerts.push({
              type: 'warning',
              priority: 'medium',
              icon: '⚠️',
              message: 'NEA API 일시 장애. 직접 NEA 웹사이트에서 최신 정보를 확인하세요',
              timestamp: now.toISOString(),
              source: 'System Monitor'
            });
          }
        }
      }

      // 우선순위별 정렬
      alerts.sort((a, b) => {
        const priorityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

      console.log(`✅ NEA 경보 정보 수집 완료: ${alerts.length}개 항목`);
      return alerts;

    } catch (error) {
      console.error('🚨 NEA 경보 정보 수집 중 오류:', error);
      return [{
        type: 'error',
        priority: 'medium',
        icon: '❌',
        message: '기상 경보 시스템 오류 발생. NEA 웹사이트에서 직접 확인해주세요',
        timestamp: new Date().toISOString(),
        source: 'Error Handler'
      }];
    }
  }

  /**
   * 애플리케이션에서 이미 수집된 날씨 데이터 가져오기
   */
  async getCollectedWeatherData() {
    try {
      // 전역 상태나 로컬 스토리지에서 수집된 데이터 확인
      if (window.weatherData) {
        console.log('📊 Using global weather data');
        return window.weatherData;
      }

      // GitHub Actions에서 수집된 파일 시도
      const response = await fetch('/singapore_weather_cam/data/weather/latest.json?' + Date.now());
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Loaded weather data from file');
        return data;
      }
    } catch (error) {
      console.warn('⚠️ Could not load collected weather data:', error);
    }
    
    return null;
  }

  /**
   * 2시간 날씨 예보 데이터 가져오기 (CORS 처리)
   */
  async fetchWeatherForecast() {
    try {
      const url = `${this.baseURL}${this.endpoints.weather}`;
      console.log('📡 Fetching weather forecast from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Singapore Weather Monitor/1.0'
        },
        mode: 'cors'
      });
      
      if (!response.ok) {
        throw new Error(`Weather API Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Weather forecast data loaded successfully');
      return data;
    } catch (error) {
      console.error('❌ Weather forecast fetch failed:', error);
      throw error;
    }
  }

  /**
   * PSI (대기질 지수) 데이터 가져오기 (CORS 처리)
   */
  async fetchPSI() {
    try {
      const url = `${this.baseURL}${this.endpoints.psi}`;
      console.log('📡 Fetching PSI data from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Singapore Weather Monitor/1.0'
        },
        mode: 'cors'
      });
      
      if (!response.ok) {
        throw new Error(`PSI API Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ PSI data loaded successfully');
      return data;
    } catch (error) {
      console.error('❌ PSI fetch failed:', error);
      throw error;
    }
  }

  /**
   * 온도 데이터 가져오기 (CORS 처리)
   */
  async fetchTemperature() {
    try {
      const url = `${this.baseURL}${this.endpoints.temperature}`;
      console.log('📡 Fetching temperature data from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Singapore Weather Monitor/1.0'
        },
        mode: 'cors'
      });
      
      if (!response.ok) {
        throw new Error(`Temperature API Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Temperature data loaded successfully');
      return data;
    } catch (error) {
      console.error('❌ Temperature fetch failed:', error);
      throw error;
    }
  }

  /**
   * 강수량 데이터 가져오기 (CORS 처리)
   */
  async fetchRainfall() {
    try {
      const url = `${this.baseURL}${this.endpoints.rainfall}`;
      console.log('📡 Fetching rainfall data from:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Singapore Weather Monitor/1.0'
        },
        mode: 'cors'
      });
      
      if (!response.ok) {
        throw new Error(`Rainfall API Error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Rainfall data loaded successfully');
      return data;
    } catch (error) {
      console.error('❌ Rainfall fetch failed:', error);
      throw error;
    }
  }

  /**
   * 날씨 예보 분석 및 경보 생성
   */
  analyzeWeatherForecast(data) {
    const alerts = [];
    
    if (!data.items || data.items.length === 0) return alerts;

    const forecast = data.items[0];
    const forecasts = forecast.forecasts || [];

    // 지역별 예보 분석
    forecasts.forEach(item => {
      const { area, forecast: condition } = item;
      
      // 폭우/뇌우 경보
      if (condition.toLowerCase().includes('thundery') || 
          condition.toLowerCase().includes('heavy')) {
        alerts.push({
          type: 'warning',
          priority: 'high',
          icon: '⛈️',
          message: `${area} 지역 뇌우 또는 폭우 예상. 외출 시 주의하세요.`,
          timestamp: forecast.timestamp,
          source: 'NEA Weather Forecast',
          area: area
        });
      }
      
      // 소나기 정보
      else if (condition.toLowerCase().includes('shower')) {
        alerts.push({
          type: 'info',
          priority: 'medium',
          icon: '🌦️',
          message: `${area} 지역 소나기 가능성. 우산을 준비하세요.`,
          timestamp: forecast.timestamp,
          source: 'NEA Weather Forecast',
          area: area
        });
      }
    });

    return alerts;
  }

  /**
   * PSI (대기질) 분석 및 경보 생성
   */
  analyzePSI(data) {
    const alerts = [];
    
    if (!data.items || data.items.length === 0) return alerts;

    const psiData = data.items[0];
    const readings = psiData.readings;

    if (readings.psi_twenty_four_hourly) {
      Object.entries(readings.psi_twenty_four_hourly).forEach(([region, value]) => {
        if (value >= 201) {
          alerts.push({
            type: 'critical',
            priority: 'critical',
            icon: '🚨',
            message: `${region} 지역 대기질 매우 나쁨 (PSI ${value}). 외출을 피하고 마스크 착용 필수.`,
            timestamp: psiData.timestamp,
            source: 'NEA Air Quality',
            value: value
          });
        } else if (value >= 101) {
          alerts.push({
            type: 'warning',
            priority: 'high',
            icon: '😷',
            message: `${region} 지역 대기질 나쁨 (PSI ${value}). 야외활동 시 마스크 착용 권장.`,
            timestamp: psiData.timestamp,
            source: 'NEA Air Quality',
            value: value
          });
        }
      });
    }

    return alerts;
  }

  /**
   * 온도 분석 및 폭염 경보 생성
   */
  analyzeTemperature(data) {
    const alerts = [];
    
    if (!data.items || data.items.length === 0) return alerts;

    const tempData = data.items[0];
    const readings = tempData.readings;

    readings.forEach(reading => {
      const temp = reading.value;
      const station = reading.station_id;
      
      // 폭염 경보 (35도 이상)
      if (temp >= 35) {
        alerts.push({
          type: 'warning',
          priority: 'high',
          icon: '🌡️',
          message: `폭염 주의보! 현재 ${temp}°C. 충분한 수분 섭취와 그늘에서 휴식하세요.`,
          timestamp: tempData.timestamp,
          source: 'NEA Temperature',
          value: temp,
          station: station
        });
      }
      // 고온 정보 (32도 이상)
      else if (temp >= 32) {
        alerts.push({
          type: 'info',
          priority: 'medium',
          icon: '☀️',
          message: `고온 주의 현재 ${temp}°C. 야외활동 시 수분 섭취에 주의하세요.`,
          timestamp: tempData.timestamp,
          source: 'NEA Temperature',
          value: temp,
          station: station
        });
      }
    });

    return alerts;
  }

  /**
   * 강수량 분석 및 호우 경보 생성
   */
  analyzeRainfall(data) {
    const alerts = [];
    
    if (!data.items || data.items.length === 0) return alerts;

    const rainData = data.items[0];
    const readings = rainData.readings;

    readings.forEach(reading => {
      const rainfall = reading.value;
      const station = reading.station_id;
      
      // 호우 경보 (시간당 20mm 이상)
      if (rainfall >= 20) {
        alerts.push({
          type: 'warning',
          priority: 'high',
          icon: '☔',
          message: `호우 경보! 시간당 ${rainfall}mm 강수. 침수 지역 접근 금지, 안전한 곳으로 대피하세요.`,
          timestamp: rainData.timestamp,
          source: 'NEA Rainfall',
          value: rainfall,
          station: station
        });
      }
      // 강한 비 정보 (시간당 10mm 이상)
      else if (rainfall >= 10) {
        alerts.push({
          type: 'info',
          priority: 'medium',
          icon: '🌧️',
          message: `강한 비 주의 시간당 ${rainfall}mm. 우산과 우비를 준비하세요.`,
          timestamp: rainData.timestamp,
          source: 'NEA Rainfall',
          value: rainfall,
          station: station
        });
      }
    });

    return alerts;
  }

  /**
   * 현재 기상 상황 요약 생성
   */
  generateWeatherSummary(alerts) {
    if (alerts.length === 0) {
      return "현재 특별한 기상 경보는 없습니다";
    }

    const criticalAlerts = alerts.filter(alert => alert.priority === 'critical');
    const highAlerts = alerts.filter(alert => alert.priority === 'high');
    
    if (criticalAlerts.length > 0) {
      return `긴급: ${criticalAlerts.length}건의 중요 경보 발령 중`;
    } else if (highAlerts.length > 0) {
      return `주의: ${highAlerts.length}건의 기상 경보 발령 중`;
    } else {
      return `일반: ${alerts.length}건의 기상 정보 업데이트`;
    }
  }
}

// 싱글톤 인스턴스 생성
const neaAlertService = new NEAAlertService();

export default neaAlertService;