/**
 * NEA Singapore API 기상 경보 서비스
 * 실시간 날씨 경보, 폭염/호우 정보, 대기질 정보 등을 제공
 */

class NEAAlertService {
  constructor() {
    this.baseURL = 'https://api.data.gov.sg/v1';
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
   * 종합적인 기상 경보 정보 수집
   */
  async getWeatherAlerts() {
    try {
      console.log('🚨 NEA 기상 경보 정보 수집 시작...');
      
      // 병렬로 여러 API 호출
      const [weatherData, psiData, tempData, rainfallData] = await Promise.allSettled([
        this.fetchWeatherForecast(),
        this.fetchPSI(),
        this.fetchTemperature(),
        this.fetchRainfall()
      ]);

      const alerts = [];
      const now = new Date();

      // 날씨 경보 분석
      if (weatherData.status === 'fulfilled' && weatherData.value) {
        const weatherAlerts = this.analyzeWeatherForecast(weatherData.value);
        alerts.push(...weatherAlerts);
      }

      // 대기질 경보 분석
      if (psiData.status === 'fulfilled' && psiData.value) {
        const psiAlerts = this.analyzePSI(psiData.value);
        alerts.push(...psiAlerts);
      }

      // 온도 경보 분석
      if (tempData.status === 'fulfilled' && tempData.value) {
        const tempAlerts = this.analyzeTemperature(tempData.value);
        alerts.push(...tempAlerts);
      }

      // 강수 경보 분석
      if (rainfallData.status === 'fulfilled' && rainfallData.value) {
        const rainAlerts = this.analyzeRainfall(rainfallData.value);
        alerts.push(...rainAlerts);
      }

      // 일반 정보 추가 (경보가 없을 때)
      if (alerts.length === 0) {
        alerts.push({
          type: 'info',
          priority: 'low',
          icon: '🌤️',
          message: '현재 특별한 기상 경보는 없습니다. 쾌적한 날씨를 즐기세요!',
          timestamp: now.toISOString(),
          source: 'NEA Singapore'
        });
      }

      // 우선순위별 정렬
      alerts.sort((a, b) => {
        const priorityOrder = { 'critical': 0, 'high': 1, 'medium': 2, 'low': 3 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      });

      console.log(`✅ NEA 경보 정보 수집 완료: ${alerts.length}개 항목`);
      return alerts;

    } catch (error) {
      console.error('🚨 NEA 경보 정보 수집 실패:', error);
      return [{
        type: 'error',
        priority: 'low',
        icon: '⚠️',
        message: '기상 경보 정보를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.',
        timestamp: new Date().toISOString(),
        source: 'System'
      }];
    }
  }

  /**
   * 2시간 날씨 예보 데이터 가져오기
   */
  async fetchWeatherForecast() {
    const response = await fetch(`${this.baseURL}${this.endpoints.weather}`);
    if (!response.ok) throw new Error(`Weather API Error: ${response.status}`);
    return await response.json();
  }

  /**
   * PSI (대기질 지수) 데이터 가져오기
   */
  async fetchPSI() {
    const response = await fetch(`${this.baseURL}${this.endpoints.psi}`);
    if (!response.ok) throw new Error(`PSI API Error: ${response.status}`);
    return await response.json();
  }

  /**
   * 온도 데이터 가져오기
   */
  async fetchTemperature() {
    const response = await fetch(`${this.baseURL}${this.endpoints.temperature}`);
    if (!response.ok) throw new Error(`Temperature API Error: ${response.status}`);
    return await response.json();
  }

  /**
   * 강수량 데이터 가져오기
   */
  async fetchRainfall() {
    const response = await fetch(`${this.baseURL}${this.endpoints.rainfall}`);
    if (!response.ok) throw new Error(`Rainfall API Error: ${response.status}`);
    return await response.json();
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