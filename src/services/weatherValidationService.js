/**
 * Weather Data Validation Service
 * NEA Singapore API 데이터와 외부 소스를 비교하여 이상 여부를 검증
 */

class WeatherValidationService {
  constructor() {
    this.validationThresholds = {
      temperature: {
        maxDiff: 3.0, // 3도 이상 차이나면 경고
        extremeHigh: 38.0, // 38도 이상은 극한 고온
        extremeLow: 20.0, // 20도 이하는 극한 저온
      },
      humidity: {
        maxDiff: 15.0, // 15% 이상 차이나면 경고
        extremeHigh: 98.0, // 98% 이상은 극한 습도
        extremeLow: 30.0, // 30% 이하는 극한 건조
      },
      stationCount: {
        minRequired: 5, // 최소 5개 관측소 필요
        normalRange: [8, 15], // 정상 범위
      },
      dataAge: {
        maxMinutes: 30, // 30분 이상 오래된 데이터는 경고
      }
    };

    // 싱가포르 기후 기준값 (연중 평균)
    this.singaporeNormals = {
      temperature: {
        min: 24.0,
        max: 35.0,
        average: 29.5,
      },
      humidity: {
        min: 60.0,
        max: 95.0,
        average: 80.0,
      },
      // 월별 정상 범위 (1월=0, 12월=11)
      monthlyNormals: [
        { temp: [24, 31], humidity: [75, 90] }, // 1월
        { temp: [25, 32], humidity: [70, 85] }, // 2월
        { temp: [25, 33], humidity: [70, 85] }, // 3월
        { temp: [26, 34], humidity: [75, 90] }, // 4월
        { temp: [26, 34], humidity: [75, 90] }, // 5월
        { temp: [26, 34], humidity: [70, 85] }, // 6월
        { temp: [26, 34], humidity: [70, 85] }, // 7월
        { temp: [26, 34], humidity: [70, 85] }, // 8월
        { temp: [26, 34], humidity: [75, 90] }, // 9월
        { temp: [25, 33], humidity: [75, 90] }, // 10월
        { temp: [24, 32], humidity: [80, 95] }, // 11월
        { temp: [24, 31], humidity: [80, 95] }, // 12월
      ]
    };
  }

  /**
   * NEA 데이터의 이상 여부를 종합적으로 검증
   * @param {Object} neaData - NEA API에서 받은 데이터
   * @returns {Object} 검증 결과
   */
  async validateWeatherData(neaData) {
    console.log('🔍 [WeatherValidation] Starting comprehensive validation...');
    
    const validationResults = {
      timestamp: new Date().toISOString(),
      overall: 'healthy', // 'healthy', 'warning', 'error'
      score: 100, // 0-100 점수
      checks: [],
      alerts: [],
      recommendations: [],
      dataQuality: {
        completeness: 0,
        consistency: 0,
        timeliness: 0,
        accuracy: 0,
      }
    };

    try {
      // 1. 기본 데이터 구조 검증
      const structureCheck = this.validateDataStructure(neaData);
      validationResults.checks.push(structureCheck);

      // 2. 온도 데이터 검증
      if (neaData?.data?.temperature) {
        const tempCheck = this.validateTemperature(neaData.data.temperature);
        validationResults.checks.push(tempCheck);
      }

      // 3. 습도 데이터 검증
      if (neaData?.data?.humidity) {
        const humidityCheck = this.validateHumidity(neaData.data.humidity);
        validationResults.checks.push(humidityCheck);
      }

      // 4. 관측소 데이터 검증
      const stationCheck = this.validateStations(neaData);
      validationResults.checks.push(stationCheck);

      // 5. 데이터 시간 검증
      const timeCheck = this.validateDataAge(neaData.timestamp);
      validationResults.checks.push(timeCheck);

      // 6. 계절적 정상성 검증
      const seasonalCheck = this.validateSeasonalNormality(neaData);
      validationResults.checks.push(seasonalCheck);

      // 7. 외부 소스와 교차 검증 (OpenWeatherMap) - 브라우저 환경에서는 건너뛰기
      try {
        if (typeof window === 'undefined') {
          // Node.js 환경에서만 실행
          const externalCheck = await this.validateWithExternalSource(neaData);
          if (externalCheck) {
            validationResults.checks.push(externalCheck);
          }
        } else {
          // 브라우저 환경에서는 외부 검증 건너뛰기
          validationResults.checks.push({
            name: 'External Source Validation',
            status: 'info',
            score: 95,
            details: ['브라우저 환경에서는 외부 검증을 건너뜁니다']
          });
        }
      } catch (error) {
        console.warn('⚠️ [WeatherValidation] External validation skipped:', error.message);
        validationResults.checks.push({
          name: 'External Source Validation',
          status: 'info',
          score: 90,
          details: [`외부 검증 실패: ${error.message}`]
        });
      }

      // 8. 종합 평가 계산
      this.calculateOverallValidation(validationResults);

      console.log('✅ [WeatherValidation] Validation completed:', {
        overall: validationResults.overall,
        score: validationResults.score,
        checksCount: validationResults.checks.length,
        alertsCount: validationResults.alerts.length
      });

      return validationResults;

    } catch (error) {
      console.error('❌ [WeatherValidation] Validation failed:', error);
      
      validationResults.overall = 'error';
      validationResults.score = 0;
      validationResults.alerts.push({
        level: 'error',
        message: '날씨 데이터 검증 중 오류가 발생했습니다',
        details: error.message,
        timestamp: new Date().toISOString()
      });

      return validationResults;
    }
  }

  /**
   * 데이터 구조 기본 검증
   */
  validateDataStructure(neaData) {
    const check = {
      name: 'Data Structure',
      status: 'pass',
      score: 100,
      details: []
    };

    if (!neaData) {
      check.status = 'fail';
      check.score = 0;
      check.details.push('NEA 데이터가 없습니다');
      return check;
    }

    if (!neaData.data) {
      check.status = 'fail';
      check.score = 20;
      check.details.push('데이터 객체가 없습니다');
    }

    if (!neaData.timestamp) {
      check.status = 'warning';
      check.score = Math.min(check.score, 80);
      check.details.push('타임스탬프가 없습니다');
    }

    if (!neaData.source) {
      check.status = 'warning';
      check.score = Math.min(check.score, 90);
      check.details.push('데이터 소스 정보가 없습니다');
    }

    return check;
  }

  /**
   * 온도 데이터 검증
   */
  validateTemperature(tempData) {
    const check = {
      name: 'Temperature Validation',
      status: 'pass',
      score: 100,
      details: []
    };

    if (!tempData.readings || tempData.readings.length === 0) {
      check.status = 'fail';
      check.score = 0;
      check.details.push('온도 관측 데이터가 없습니다');
      return check;
    }

    const avgTemp = tempData.average || 
      (tempData.readings.reduce((sum, r) => sum + r.value, 0) / tempData.readings.length);

    // 극한 온도 체크
    if (avgTemp > this.validationThresholds.temperature.extremeHigh) {
      check.status = 'warning';
      check.score = 60;
      check.details.push(`평균 온도가 매우 높습니다: ${avgTemp.toFixed(1)}°C`);
    } else if (avgTemp < this.validationThresholds.temperature.extremeLow) {
      check.status = 'warning';
      check.score = 60;
      check.details.push(`평균 온도가 매우 낮습니다: ${avgTemp.toFixed(1)}°C`);
    }

    // 관측소 간 온도 편차 체크
    const temps = tempData.readings.map(r => r.value);
    const tempRange = Math.max(...temps) - Math.min(...temps);
    
    if (tempRange > 8.0) {
      check.status = 'warning';
      check.score = Math.min(check.score, 70);
      check.details.push(`관측소 간 온도 편차가 큽니다: ${tempRange.toFixed(1)}°C`);
    }

    // 이상치 관측소 체크
    const outliers = tempData.readings.filter(r => 
      Math.abs(r.value - avgTemp) > 5.0
    );

    if (outliers.length > 0) {
      check.status = 'warning';
      check.score = Math.min(check.score, 80);
      check.details.push(`이상 온도 관측소 ${outliers.length}개: ${outliers.map(o => `${o.station}(${o.value}°C)`).join(', ')}`);
    }

    return check;
  }

  /**
   * 습도 데이터 검증
   */
  validateHumidity(humidityData) {
    const check = {
      name: 'Humidity Validation',
      status: 'pass',
      score: 100,
      details: []
    };

    if (!humidityData.readings || humidityData.readings.length === 0) {
      check.status = 'warning';
      check.score = 70;
      check.details.push('습도 관측 데이터가 제한적입니다');
      return check;
    }

    const avgHumidity = humidityData.average || 
      (humidityData.readings.reduce((sum, r) => sum + r.value, 0) / humidityData.readings.length);

    // 극한 습도 체크
    if (avgHumidity > this.validationThresholds.humidity.extremeHigh) {
      check.status = 'warning';
      check.score = 80;
      check.details.push(`습도가 매우 높습니다: ${avgHumidity.toFixed(1)}%`);
    } else if (avgHumidity < this.validationThresholds.humidity.extremeLow) {
      check.status = 'warning';
      check.score = 80;
      check.details.push(`습도가 매우 낮습니다: ${avgHumidity.toFixed(1)}%`);
    }

    return check;
  }

  /**
   * 관측소 데이터 검증
   */
  validateStations(neaData) {
    const check = {
      name: 'Station Coverage',
      status: 'pass',
      score: 100,
      details: []
    };

    const stationCount = neaData.stations_used?.length || 0;
    const tempStations = neaData.data?.temperature?.readings?.length || 0;

    if (tempStations < this.validationThresholds.stationCount.minRequired) {
      check.status = 'warning';
      check.score = 50;
      check.details.push(`활성 온도 관측소가 부족합니다: ${tempStations}개 (최소 ${this.validationThresholds.stationCount.minRequired}개 필요)`);
    }

    if (stationCount < this.validationThresholds.stationCount.normalRange[0]) {
      check.status = 'warning';
      check.score = Math.min(check.score, 70);
      check.details.push(`전체 관측소 수가 적습니다: ${stationCount}개`);
    }

    // 데이터 품질 점수 체크
    const qualityScore = neaData.data_quality_score || 0;
    if (qualityScore < 0.8) {
      check.status = 'warning';
      check.score = Math.min(check.score, 60);
      check.details.push(`데이터 품질 점수가 낮습니다: ${(qualityScore * 100).toFixed(1)}%`);
    }

    return check;
  }

  /**
   * 데이터 시간 검증
   */
  validateDataAge(timestamp) {
    const check = {
      name: 'Data Timeliness',
      status: 'pass',
      score: 100,
      details: []
    };

    if (!timestamp) {
      check.status = 'warning';
      check.score = 80;
      check.details.push('데이터 타임스탬프가 없습니다');
      return check;
    }

    const dataTime = new Date(timestamp);
    const now = new Date();
    const ageMinutes = (now - dataTime) / (1000 * 60);

    if (ageMinutes > this.validationThresholds.dataAge.maxMinutes) {
      check.status = 'warning';
      check.score = 70;
      check.details.push(`데이터가 오래되었습니다: ${Math.round(ageMinutes)}분 전`);
    } else if (ageMinutes > 15) {
      check.status = 'info';
      check.score = 90;
      check.details.push(`데이터 나이: ${Math.round(ageMinutes)}분`);
    }

    return check;
  }

  /**
   * 계절적 정상성 검증
   */
  validateSeasonalNormality(neaData) {
    const check = {
      name: 'Seasonal Normality',
      status: 'pass',
      score: 100,
      details: []
    };

    if (!neaData?.data?.temperature?.average) {
      check.status = 'info';
      check.score = 90;
      check.details.push('계절적 정상성 검증 불가 (온도 데이터 없음)');
      return check;
    }

    const currentMonth = new Date().getMonth(); // 0-11
    const avgTemp = neaData.data.temperature.average;
    const avgHumidity = neaData.data.humidity?.average;

    const monthlyNormal = this.singaporeNormals.monthlyNormals[currentMonth];

    // 온도 정상성 체크
    if (avgTemp < monthlyNormal.temp[0] - 2 || avgTemp > monthlyNormal.temp[1] + 2) {
      check.status = 'warning';
      check.score = 80;
      check.details.push(`계절 대비 이상 온도: ${avgTemp.toFixed(1)}°C (정상: ${monthlyNormal.temp[0]}-${monthlyNormal.temp[1]}°C)`);
    }

    // 습도 정상성 체크
    if (avgHumidity) {
      if (avgHumidity < monthlyNormal.humidity[0] - 10 || avgHumidity > monthlyNormal.humidity[1] + 5) {
        check.status = 'warning';
        check.score = Math.min(check.score, 85);
        check.details.push(`계절 대비 이상 습도: ${avgHumidity.toFixed(1)}% (정상: ${monthlyNormal.humidity[0]}-${monthlyNormal.humidity[1]}%)`);
      }
    }

    return check;
  }

  /**
   * 외부 소스와 교차 검증 (OpenWeatherMap API) - Node.js 환경에서만 실행
   */
  async validateWithExternalSource(neaData) {
    const check = {
      name: 'External Source Validation',
      status: 'pass',
      score: 100,
      details: []
    };

    try {
      // 브라우저 환경에서는 CORS 문제로 인해 건너뛰기
      if (typeof window !== 'undefined') {
        check.status = 'info';
        check.score = 95;
        check.details.push('브라우저 환경에서는 외부 검증을 건너뜁니다 (CORS 제한)');
        return check;
      }

      // OpenWeatherMap API 키가 있는 경우에만 실행 (Node.js 환경)
      const owmApiKey = process.env.OPENWEATHER_API_KEY;
      if (!owmApiKey) {
        check.status = 'info';
        check.score = 95;
        check.details.push('외부 검증 API 키가 없어 검증을 건너뜁니다');
        return check;
      }

      // Singapore coordinates
      const lat = 1.3521;
      const lon = 103.8198;
      
      const owmUrl = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${owmApiKey}&units=metric`;
      
      // Node.js 환경에서만 fetch 실행
      const AbortController = globalThis.AbortController;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(owmUrl, { 
        signal: controller.signal,
        headers: {
          'User-Agent': 'Singapore-Weather-Validation/1.0'
        }
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`OpenWeatherMap API error: ${response.status}`);
      }

      const owmData = await response.json();
      
      const neaTemp = neaData?.data?.temperature?.average;
      const neaHumidity = neaData?.data?.humidity?.average;
      
      const owmTemp = owmData.main?.temp;
      const owmHumidity = owmData.main?.humidity;

      // 온도 비교
      if (neaTemp && owmTemp) {
        const tempDiff = Math.abs(neaTemp - owmTemp);
        if (tempDiff > this.validationThresholds.temperature.maxDiff) {
          check.status = 'warning';
          check.score = 70;
          check.details.push(`외부 소스와 온도 차이 큼: NEA ${neaTemp.toFixed(1)}°C vs OWM ${owmTemp.toFixed(1)}°C (차이: ${tempDiff.toFixed(1)}°C)`);
        } else {
          check.details.push(`온도 일치성 양호: NEA ${neaTemp.toFixed(1)}°C vs OWM ${owmTemp.toFixed(1)}°C (차이: ${tempDiff.toFixed(1)}°C)`);
        }
      }

      // 습도 비교
      if (neaHumidity && owmHumidity) {
        const humidityDiff = Math.abs(neaHumidity - owmHumidity);
        if (humidityDiff > this.validationThresholds.humidity.maxDiff) {
          check.status = 'warning';
          check.score = Math.min(check.score, 80);
          check.details.push(`외부 소스와 습도 차이 큼: NEA ${neaHumidity.toFixed(1)}% vs OWM ${owmHumidity.toFixed(1)}% (차이: ${humidityDiff.toFixed(1)}%)`);
        } else {
          check.details.push(`습도 일치성 양호: NEA ${neaHumidity.toFixed(1)}% vs OWM ${owmHumidity.toFixed(1)}% (차이: ${humidityDiff.toFixed(1)}%)`);
        }
      }

    } catch (error) {
      console.warn('⚠️ [WeatherValidation] External validation failed:', error.message);
      check.status = 'info';
      check.score = 90;
      check.details.push(`외부 검증 실패: ${error.message}`);
    }

    return check;
  }

  /**
   * 종합 평가 계산
   */
  calculateOverallValidation(results) {
    const checks = results.checks;
    const totalScore = checks.reduce((sum, check) => sum + check.score, 0);
    const averageScore = totalScore / checks.length;

    // 점수에 따른 전체 상태 결정
    if (averageScore >= 90) {
      results.overall = 'healthy';
    } else if (averageScore >= 70) {
      results.overall = 'warning';
    } else {
      results.overall = 'error';
    }

    results.score = Math.round(averageScore);

    // 경고 및 권장사항 생성
    const warningChecks = checks.filter(c => c.status === 'warning' || c.status === 'fail');
    warningChecks.forEach(check => {
      check.details.forEach(detail => {
        results.alerts.push({
          level: check.status === 'fail' ? 'error' : 'warning',
          message: detail,
          source: check.name,
          timestamp: new Date().toISOString()
        });
      });
    });

    // 데이터 품질 메트릭 계산
    results.dataQuality = {
      completeness: this.calculateCompleteness(checks),
      consistency: this.calculateConsistency(checks),
      timeliness: this.calculateTimeliness(checks),
      accuracy: this.calculateAccuracy(checks),
    };
  }

  calculateCompleteness(checks) {
    const structureCheck = checks.find(c => c.name === 'Data Structure');
    return structureCheck ? structureCheck.score : 0;
  }

  calculateConsistency(checks) {
    const tempCheck = checks.find(c => c.name === 'Temperature Validation');
    const humidityCheck = checks.find(c => c.name === 'Humidity Validation');
    const externalCheck = checks.find(c => c.name === 'External Source Validation');
    
    const scores = [tempCheck, humidityCheck, externalCheck]
      .filter(Boolean)
      .map(c => c.score);
    
    return scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : 0;
  }

  calculateTimeliness(checks) {
    const timeCheck = checks.find(c => c.name === 'Data Timeliness');
    return timeCheck ? timeCheck.score : 0;
  }

  calculateAccuracy(checks) {
    const seasonalCheck = checks.find(c => c.name === 'Seasonal Normality');
    const externalCheck = checks.find(c => c.name === 'External Source Validation');
    
    const scores = [seasonalCheck, externalCheck]
      .filter(Boolean)
      .map(c => c.score);
    
    return scores.length > 0 ? scores.reduce((sum, s) => sum + s, 0) / scores.length : 90;
  }

  /**
   * 검증 결과를 사용자 친화적 메시지로 변환
   */
  generateUserFriendlyReport(validationResults) {
    const report = {
      status: validationResults.overall,
      score: validationResults.score,
      summary: '',
      details: [],
      recommendations: []
    };

    // 상태별 요약 메시지
    switch (validationResults.overall) {
      case 'healthy':
        report.summary = `데이터 품질이 우수합니다 (${validationResults.score}점)`;
        break;
      case 'warning':
        report.summary = `데이터에 일부 주의사항이 있습니다 (${validationResults.score}점)`;
        break;
      case 'error':
        report.summary = `데이터 품질에 문제가 있습니다 (${validationResults.score}점)`;
        break;
    }

    // 상세 정보 추가
    validationResults.checks.forEach(check => {
      if (check.status !== 'pass') {
        report.details.push(...check.details);
      }
    });

    // 권장사항 생성
    if (validationResults.score < 80) {
      report.recommendations.push('데이터 새로고침을 다시 시도해보세요');
    }
    if (validationResults.alerts.some(a => a.message.includes('관측소'))) {
      report.recommendations.push('일부 관측소에 문제가 있을 수 있습니다');
    }

    return report;
  }
}

// Singleton instance
const weatherValidationService = new WeatherValidationService();

export default weatherValidationService;