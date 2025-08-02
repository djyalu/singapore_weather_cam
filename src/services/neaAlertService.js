/**
 * NEA Singapore API 기상 경보 서비스
 * 실시간 날씨 경보, 폭염/호우 정보, 대기질 정보 등을 제공
 */

class NEAAlertService {
  constructor() {
    // 모바일 CORS 문제 해결: 항상 수집된 데이터 우선 사용
    this.baseURL = import.meta.env.DEV ? '/api/nea' : null; // 프로덕션에서는 직접 API 호출 비활성화
    this.endpoints = {
      weather: '/environment/2-hour-weather-forecast',
      psi: '/environment/psi',
      pm25: '/environment/pm25',
      temperature: '/environment/air-temperature',
      rainfall: '/environment/rainfall',
      humidity: '/environment/relative-humidity',
      windSpeed: '/environment/wind-speed',
      uvi: '/environment/uv-index',
    };
  }

  /**
   * 실제 NEA API를 통한 기상 경보 정보 수집
   */
  async getWeatherAlerts() {
    try {
      console.log('🚨 NEA Singapore API 기상 경보 정보 수집 시작...');
      console.log('📡 Using base URL:', this.baseURL);

      // 프로덕션에서는 직접 수집된 데이터 사용 (CORS 문제 회피)
      if (!this.baseURL) {
        console.log('🔄 프로덕션 환경: 수집된 데이터 우선 사용');
        const collectedData = await this.getCollectedWeatherData();
        console.log('🔍 Ticker: Collected data result:', !!collectedData, collectedData ? Object.keys(collectedData) : 'null');
        
        if (collectedData) {
          console.log('✅ Ticker: Using collected data for alerts generation');
          return this.generateAlertsFromCollectedData(collectedData);
        }
        
        console.warn('⚠️ Ticker: No collected data available, using fallback message');
        // 수집된 데이터도 없을 경우 기본 메시지
        return [{
          type: 'info',
          priority: 'low',
          icon: '📊',
          message: 'GitHub Actions를 통해 최신 날씨 데이터를 자동 수집 중입니다.',
          timestamp: new Date().toISOString(),
          source: 'Automated Data Collection',
        }];
      }

      // 개발 환경에서만 API 호출
      const [weatherResult, tempResult, psiResult] = await Promise.allSettled([
        this.fetchWeatherForecast(),
        this.fetchTemperature(),
        this.fetchPSI(),
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
          // 실제 데이터 기반 현재 상황 요약 생성
          const currentSummary = this.generateCurrentWeatherSummary(weatherResult.value, tempResult.value, psiResult.value);
          alerts.push({
            type: 'info',
            priority: 'low',
            icon: '🌤️',
            message: currentSummary,
            timestamp: now.toISOString(),
            source: 'NEA Singapore',
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
                source: 'Collected Data',
              });
            } else {
              alerts.push({
                type: 'info',
                priority: 'low',
                icon: '🌤️',
                message: `현재 ${temperature.toFixed(1)}°C, 습도 ${humidity.toFixed(0)}% (수집된 데이터 기준)`,
                timestamp: now.toISOString(),
                source: 'Collected Data',
              });
            }
          } else {
            // 모바일 친화적 메시지로 변경
            alerts.push({
              type: 'info',
              priority: 'low',
              icon: '📊',
              message: '최신 수집된 날씨 데이터를 기반으로 분석 중입니다. 실시간 업데이트는 자동으로 진행됩니다.',
              timestamp: now.toISOString(),
              source: 'Data Collection System',
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
        type: 'info',
        priority: 'low',
        icon: '🔄',
        message: '수집된 날씨 데이터를 기반으로 서비스 중입니다. GitHub Actions가 자동으로 최신 데이터를 업데이트합니다.',
        timestamp: new Date().toISOString(),
        source: 'Data Collection System',
      }];
    }
  }

  /**
   * 수집된 데이터에서 실시간 날씨 정보 티커 생성
   */
  generateAlertsFromCollectedData(data) {
    const alerts = [];
    const now = new Date();

    console.log('🔍 Ticker Data Analysis:', {
      hasData: !!data,
      hasTemp: !!data?.data?.temperature?.readings,
      tempCount: data?.data?.temperature?.readings?.length || 0,
      hasHumidity: !!data?.data?.humidity?.readings,
      humidityCount: data?.data?.humidity?.readings?.length || 0,
      hasRainfall: !!data?.data?.rainfall?.readings,
      rainfallCount: data?.data?.rainfall?.readings?.length || 0
    });

    if (!data || !data.data) {
      return [{
        type: 'info',
        priority: 'low',
        icon: '📊',
        message: '날씨 데이터 로딩 중입니다. 잠시만 기다려주세요.',
        timestamp: now.toISOString(),
        source: 'Data Loading',
      }];
    }

    // 실제 온도, 습도, 강수량 데이터로 티커 생성
    const tempReadings = data.data.temperature?.readings || [];
    
    console.log('🌡️ Processing temperature data:', {
      readings: tempReadings,
      count: tempReadings.length,
      values: tempReadings.map(r => r.value)
    });
    
    // 온도 정보 (항상 표시)
    if (tempReadings.length > 0) {
      const currentTemp = tempReadings.reduce((sum, r) => sum + r.value, 0) / tempReadings.length;
      let tempIcon = '🌡️';
      let tempStatus = '정상';
      let tempPriority = 'low';
      
      if (currentTemp >= 35) {
        tempIcon = '🔥';
        tempStatus = '매우 높음';
        tempPriority = 'medium';
      } else if (currentTemp >= 33) {
        tempIcon = '🌡️';
        tempStatus = '높음';
        tempPriority = 'low';
      } else if (currentTemp <= 25) {
        tempIcon = '❄️';
        tempStatus = '낮음';
        tempPriority = 'low';
      }

      alerts.push({
        type: 'info',
        priority: tempPriority,
        icon: tempIcon,
        message: `현재 기온 ${currentTemp.toFixed(1)}°C (${tempStatus}) • ${tempReadings.length}개 관측소 평균`,
        timestamp: now.toISOString(),
        source: 'Temperature Monitor',
      });
    }

    // 습도 정보
    const humidityReadings = data.data.humidity?.readings || [];
    if (humidityReadings.length > 0) {
      const currentHumidity = humidityReadings.reduce((sum, r) => sum + r.value, 0) / humidityReadings.length;
      const currentTemp = tempReadings.length > 0 
        ? tempReadings.reduce((sum, r) => sum + r.value, 0) / tempReadings.length 
        : 30;
      
      let humidityIcon = '💧';
      let humidityStatus = '정상';
      
      if (currentHumidity >= 90) {
        humidityIcon = '💦';
        humidityStatus = '매우 높음';
      } else if (currentHumidity >= 80) {
        humidityIcon = '💧';
        humidityStatus = '높음';
      } else if (currentHumidity <= 40) {
        humidityIcon = '🏜️';
        humidityStatus = '낮음';
      }

      alerts.push({
        type: 'info',
        priority: 'low',
        icon: humidityIcon,
        message: `현재 습도 ${currentHumidity.toFixed(0)}% (${humidityStatus}) • 체감온도 ${(currentTemp + (currentHumidity - 60) * 0.1).toFixed(1)}°C`,
        timestamp: now.toISOString(),
        source: 'Humidity Monitor',
      });
    }

    // 강수량 정보
    const rainfallReadings = data.data.rainfall?.readings || [];
    if (rainfallReadings.length > 0) {
      const activeRainStations = rainfallReadings.filter(r => r.value > 0).length;
      const totalRainfall = rainfallReadings.reduce((sum, r) => sum + r.value, 0);
      
      if (activeRainStations > 0) {
        alerts.push({
          type: 'info',
          priority: 'medium',
          icon: '🌧️',
          message: `현재 ${activeRainStations}개 지역 강수 중 • 총 ${totalRainfall.toFixed(1)}mm 기록`,
          timestamp: now.toISOString(),
          source: 'Rainfall Monitor',
        });
      } else {
        alerts.push({
          type: 'info',
          priority: 'low',
          icon: '☀️',
          message: `전국 건조 상태 • ${rainfallReadings.length}개 관측소 모두 강수량 0mm`,
          timestamp: now.toISOString(),
          source: 'Rainfall Monitor',
        });
      }
    }

    // 예보 정보 추가
    if (data.data.forecast?.general?.forecast) {
      const forecast = data.data.forecast.general.forecast;
      let forecastIcon = '🌤️';
      let forecastMessage = '';

      if (forecast.includes('Thundery')) {
        forecastIcon = '⛈️';
        forecastMessage = '뇌우 예상. 야외활동 시 주의하세요';
      } else if (forecast.includes('Shower') || forecast.includes('Rain')) {
        forecastIcon = '🌧️';
        forecastMessage = '강수 예상. 우산을 준비하세요';
      } else if (forecast.includes('Cloudy')) {
        forecastIcon = '☁️';
        forecastMessage = '흐린 날씨 예상';
      } else {
        forecastIcon = '☀️';
        forecastMessage = '맑은 날씨 예상';
      }

      alerts.push({
        type: 'info',
        priority: 'low',
        icon: forecastIcon,
        message: `${forecastMessage} - NEA Singapore 공식 예보`,
        timestamp: now.toISOString(),
        source: 'Weather Forecast',
      });
    }

    console.log('✅ Generated alerts:', alerts.length, alerts.map(a => a.message));
    console.log('🔍 Final data check before fallback:', {
      hasTemp: tempReadings.length > 0,
      hasHumidity: data.data?.humidity?.readings?.length > 0,
      hasRainfall: data.data?.rainfall?.readings?.length > 0,
      alertsGenerated: alerts.length
    });

    // 디버깅: alerts가 비어있으면 기본 메시지 추가
    if (alerts.length === 0) {
      console.warn('⚠️ No alerts generated, adding fallback message');
      const totalStations = data.stations_used?.length ||
                           data.geographic_coverage?.total_stations ||
                           tempReadings.length || 0;

      const stationTypes = [];
      if (tempReadings.length > 0) {stationTypes.push(`온도 ${tempReadings.length}개`);}
      if (data.data?.humidity?.readings?.length > 0) {stationTypes.push(`습도 ${data.data.humidity.readings.length}개`);}
      if (data.data?.rainfall?.readings?.length > 0) {stationTypes.push(`강수량 ${data.data.rainfall.readings.length}개`);}

      const detailInfo = stationTypes.length > 0 ? ` (${stationTypes.join(', ')})` : '';

      alerts.push({
        type: 'info',
        priority: 'low',
        icon: '📊',
        message: `현재 ${totalStations}개 관측소에서 정상적으로 데이터 수집 중입니다${detailInfo}.`,
        timestamp: new Date().toISOString(),
        source: 'System Status',
      });
    }

    return alerts;
  }
  async getCollectedWeatherData() {
    try {
      // 1순위: 전역 상태에서 실시간 데이터 확인
      console.log('🔍 Ticker: Checking for global weather data...', !!window.weatherData);
      if (window.weatherData) {
        console.log('📊 Ticker: Using global real-time weather data:', {
          hasData: !!window.weatherData.data,
          hasTemp: !!window.weatherData.data?.temperature,
          tempCount: window.weatherData.data?.temperature?.readings?.length || 0,
          hasHumidity: !!window.weatherData.data?.humidity,
          humidityCount: window.weatherData.data?.humidity?.readings?.length || 0,
          hasRainfall: !!window.weatherData.data?.rainfall,
          rainfallCount: window.weatherData.data?.rainfall?.readings?.length || 0
        });
        return window.weatherData;
      }

      // 2순위: 다중 NEA API 직접 호출 (메인 앱과 동일한 방식)
      try {
        console.log('🔄 Ticker: Attempting multiple NEA API calls for comprehensive data...');

        // 여러 NEA API 엔드포인트 동시 호출
        const apiCalls = [
          fetch('https://api.data.gov.sg/v1/environment/air-temperature', {
            headers: { 'Accept': 'application/json', 'User-Agent': 'Singapore-Weather-Cam/1.0' },
            timeout: 10000,
          }),
          fetch('https://api.data.gov.sg/v1/environment/relative-humidity', {
            headers: { 'Accept': 'application/json', 'User-Agent': 'Singapore-Weather-Cam/1.0' },
            timeout: 10000,
          }),
          fetch('https://api.data.gov.sg/v1/environment/rainfall', {
            headers: { 'Accept': 'application/json', 'User-Agent': 'Singapore-Weather-Cam/1.0' },
            timeout: 10000,
          }),
          fetch('https://api.data.gov.sg/v1/environment/wind-speed', {
            headers: { 'Accept': 'application/json', 'User-Agent': 'Singapore-Weather-Cam/1.0' },
            timeout: 10000,
          }),
        ];

        const results = await Promise.allSettled(apiCalls);
        const [tempResult, humidityResult, rainfallResult, windResult] = results;

        let allTemperatureReadings = [];
        let allHumidityReadings = [];
        let allRainfallReadings = [];
        let allWindReadings = [];
        let successfulCalls = 0;

        // 데이터 처리
        if (tempResult.status === 'fulfilled' && tempResult.value.ok) {
          const tempData = await tempResult.value.json();
          allTemperatureReadings = tempData.items?.[0]?.readings?.map(reading => ({
            station: reading.station_id,
            value: reading.value,
          })) || [];
          successfulCalls++;
        }

        if (humidityResult.status === 'fulfilled' && humidityResult.value.ok) {
          const humidityData = await humidityResult.value.json();
          allHumidityReadings = humidityData.items?.[0]?.readings?.map(reading => ({
            station: reading.station_id,
            value: reading.value,
          })) || [];
          successfulCalls++;
        }

        if (rainfallResult.status === 'fulfilled' && rainfallResult.value.ok) {
          const rainfallData = await rainfallResult.value.json();
          allRainfallReadings = rainfallData.items?.[0]?.readings?.map(reading => ({
            station: reading.station_id,
            value: reading.value,
          })) || [];
          successfulCalls++;
        }

        if (windResult.status === 'fulfilled' && windResult.value.ok) {
          const windData = await windResult.value.json();
          allWindReadings = windData.items?.[0]?.readings?.map(reading => ({
            station: reading.station_id,
            value: reading.value,
          })) || [];
          successfulCalls++;
        }

        const allStationIds = new Set([
          ...allTemperatureReadings.map(r => r.station),
          ...allHumidityReadings.map(r => r.station),
          ...allRainfallReadings.map(r => r.station),
          ...allWindReadings.map(r => r.station),
        ]);

        console.log('📊 Ticker: Comprehensive NEA API response:', {
          temperatureStations: allTemperatureReadings.length,
          humidityStations: allHumidityReadings.length,
          rainfallStations: allRainfallReadings.length,
          windStations: allWindReadings.length,
          totalUniqueStations: allStationIds.size,
          successfulApiCalls: successfulCalls,
          currentAvgTemp: allTemperatureReadings.length > 0 ?
            allTemperatureReadings.reduce((sum, r) => sum + r.value, 0) / allTemperatureReadings.length : null,
        });

        if (successfulCalls > 0 && allStationIds.size > 0) {
          const realTimeWeatherData = {
            timestamp: new Date().toISOString(),
            source: `NEA Singapore (Real-time Ticker - ${allStationIds.size} stations)`,
            collection_time_ms: Date.now(),
            api_calls: 4,
            successful_calls: successfulCalls,
            failed_calls: 4 - successfulCalls,
            data: {
              temperature: {
                readings: allTemperatureReadings,
              },
              humidity: {
                readings: allHumidityReadings,
              },
              rainfall: {
                readings: allRainfallReadings,
              },
              wind: {
                readings: allWindReadings,
              },
            },
            stations_used: Array.from(allStationIds),
            station_details: Array.from(allStationIds).reduce((acc, stationId) => {
              const tempReading = allTemperatureReadings.find(r => r.station === stationId);
              const humidityReading = allHumidityReadings.find(r => r.station === stationId);
              const rainfallReading = allRainfallReadings.find(r => r.station === stationId);
              const windReading = allWindReadings.find(r => r.station === stationId);

              acc[stationId] = {
                id: stationId,
                temperature: tempReading?.value || null,
                humidity: humidityReading?.value || null,
                rainfall: rainfallReading?.value || null,
                wind_speed: windReading?.value || null,
                status: 'active',
                data_available: [
                  tempReading && 'temperature',
                  humidityReading && 'humidity',
                  rainfallReading && 'rainfall',
                  windReading && 'wind',
                ].filter(Boolean),
              };
              return acc;
            }, {}),
            geographic_coverage: {
              total_stations: allStationIds.size,
              coverage_percentage: Math.min(100, (allStationIds.size / 59) * 100),
              regions_covered: ['singapore'],
            },
          };

          console.log('📊 Ticker: Real-time data converted to internal format -', allStationIds.size, 'stations');
          return realTimeWeatherData;
        } else {
          throw new Error('Ticker: All NEA API calls failed or returned no data');
        }
      } catch (neaError) {
        console.warn('⚠️ Ticker: Real-time NEA API failed, falling back to local data:', neaError.message);

        // 3순위: 로컬 파일 폴백 (실시간 API 실패 시에만)
        const basePath = import.meta.env.BASE_URL || '/';
        const response = await fetch(`${basePath}data/weather/latest.json?t=${Date.now()}`);
        if (response.ok) {
          const data = await response.json();
          console.log('📁 Ticker: Fallback to local data successful');
          return data;
        } else {
          throw new Error(`Ticker: Local data fetch failed: ${response.status}`);
        }
      }
    } catch (error) {
      console.warn('⚠️ Ticker: Could not load any weather data:', error);
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
          'User-Agent': 'Singapore Weather Monitor/1.0',
        },
        mode: 'cors',
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
          'User-Agent': 'Singapore Weather Monitor/1.0',
        },
        mode: 'cors',
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
          'User-Agent': 'Singapore Weather Monitor/1.0',
        },
        mode: 'cors',
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
          'User-Agent': 'Singapore Weather Monitor/1.0',
        },
        mode: 'cors',
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

    if (!data.items || data.items.length === 0) {return alerts;}

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
          area: area,
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
          area: area,
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

    if (!data.items || data.items.length === 0) {return alerts;}

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
            value: value,
          });
        } else if (value >= 101) {
          alerts.push({
            type: 'warning',
            priority: 'high',
            icon: '😷',
            message: `${region} 지역 대기질 나쁨 (PSI ${value}). 야외활동 시 마스크 착용 권장.`,
            timestamp: psiData.timestamp,
            source: 'NEA Air Quality',
            value: value,
          });
        }
      });
    }

    return alerts;
  }

  /**
   * 온도 분석 및 폭염 경보 생성 - 지역 통합 버전
   */
  analyzeTemperature(data) {
    const alerts = [];

    if (!data.items || data.items.length === 0) {return alerts;}

    const tempData = data.items[0];
    const readings = tempData.readings;

    if (readings.length === 0) {return alerts;}

    // 전체 싱가포르 온도 통계 계산
    const temperatures = readings.map(r => r.value).filter(t => t !== null);
    const maxTemp = Math.max(...temperatures);
    const avgTemp = temperatures.reduce((sum, temp) => sum + temp, 0) / temperatures.length;
    const hotStations = readings.filter(r => r.value >= 35).length;
    const warmStations = readings.filter(r => r.value >= 32).length;

    // 통합된 지역 경보 생성 (개별 관측소별이 아닌)
    if (maxTemp >= 35) {
      alerts.push({
        type: 'warning',
        priority: 'high',
        icon: '🌡️',
        message: `폭염 주의보! 최고 ${maxTemp.toFixed(1)}°C (평균 ${avgTemp.toFixed(1)}°C). ${hotStations}개 지역에서 35°C 이상 기록`,
        timestamp: tempData.timestamp,
        source: 'NEA Temperature Alert',
        value: maxTemp,
        avgValue: avgTemp,
        stationCount: hotStations,
        totalStations: readings.length,
      });
    } else if (maxTemp >= 32) {
      alerts.push({
        type: 'info',
        priority: 'medium',
        icon: '☀️',
        message: `고온 주의 최고 ${maxTemp.toFixed(1)}°C (평균 ${avgTemp.toFixed(1)}°C). ${warmStations}개 지역에서 32°C 이상 기록`,
        timestamp: tempData.timestamp,
        source: 'NEA Temperature Alert',
        value: maxTemp,
        avgValue: avgTemp,
        stationCount: warmStations,
        totalStations: readings.length,
      });
    } else if (avgTemp >= 30) {
      // 평균 온도가 높은 경우에도 알림
      alerts.push({
        type: 'info',
        priority: 'low',
        icon: '🌤️',
        message: `따뜻한 날씨 평균 ${avgTemp.toFixed(1)}°C (최고 ${maxTemp.toFixed(1)}°C). 수분 섭취 권장`,
        timestamp: tempData.timestamp,
        source: 'NEA Temperature Alert',
        value: maxTemp,
        avgValue: avgTemp,
        stationCount: readings.length,
        totalStations: readings.length,
      });
    }

    return alerts;
  }

  /**
   * 강수량 분석 및 호우 경보 생성 - 지역 통합 버전
   */
  analyzeRainfall(data) {
    const alerts = [];

    if (!data.items || data.items.length === 0) {return alerts;}

    const rainData = data.items[0];
    const readings = rainData.readings;

    if (readings.length === 0) {return alerts;}

    // 강수량 통계 계산
    const rainfallData = readings.filter(r => r.value > 0);
    if (rainfallData.length === 0) {return alerts;}

    const maxRainfall = Math.max(...rainfallData.map(r => r.value));
    const totalRainfall = rainfallData.reduce((sum, r) => sum + r.value, 0);
    const avgRainfall = totalRainfall / rainfallData.length;
    const heavyRainStations = rainfallData.filter(r => r.value >= 20).length;
    const moderateRainStations = rainfallData.filter(r => r.value >= 10).length;

    // 통합된 강수 경보 생성
    if (maxRainfall >= 20) {
      alerts.push({
        type: 'warning',
        priority: 'high',
        icon: '☔',
        message: `호우 경보! 최대 ${maxRainfall.toFixed(1)}mm 강수. ${heavyRainStations}개 지역에서 집중호우 발생`,
        timestamp: rainData.timestamp,
        source: 'NEA Rainfall Alert',
        value: maxRainfall,
        avgValue: avgRainfall,
        stationCount: heavyRainStations,
        totalStations: rainfallData.length,
      });
    } else if (maxRainfall >= 10) {
      alerts.push({
        type: 'info',
        priority: 'medium',
        icon: '🌧️',
        message: `강한 비 주의 최대 ${maxRainfall.toFixed(1)}mm. ${moderateRainStations}개 지역에서 강수 진행 중`,
        timestamp: rainData.timestamp,
        source: 'NEA Rainfall Alert',
        value: maxRainfall,
        avgValue: avgRainfall,
        stationCount: moderateRainStations,
        totalStations: rainfallData.length,
      });
    } else if (rainfallData.length >= 5) {
      // 여러 지역에서 소량 강수
      alerts.push({
        type: 'info',
        priority: 'low',
        icon: '🌦️',
        message: `소나기 진행 중 최대 ${maxRainfall.toFixed(1)}mm. ${rainfallData.length}개 지역에서 강수 감지`,
        timestamp: rainData.timestamp,
        source: 'NEA Rainfall Alert',
        value: maxRainfall,
        avgValue: avgRainfall,
        stationCount: rainfallData.length,
        totalStations: readings.length,
      });
    }

    return alerts;
  }

  /**
   * 실제 NEA 데이터 기반 현재 상황 요약 생성
   */
  generateCurrentWeatherSummary(weatherData, tempData, psiData) {
    const summaryParts = [];

    // 온도 정보 추가
    if (tempData && tempData.items && tempData.items[0]) {
      const readings = tempData.items[0].readings;
      const avgTemp = readings.reduce((sum, reading) => sum + reading.value, 0) / readings.length;
      const tempIcon = avgTemp >= 30 ? '🌡️' : avgTemp >= 25 ? '☀️' : '🌤️';
      summaryParts.push(`${tempIcon} ${avgTemp.toFixed(1)}°C`);
    }

    // PSI 정보 추가
    if (psiData && psiData.items && psiData.items[0]) {
      const psiReadings = psiData.items[0].readings.psi_twenty_four_hourly;
      const avgPSI = Math.round(Object.values(psiReadings).reduce((sum, val) => sum + val, 0) / Object.keys(psiReadings).length);
      const psiStatus = avgPSI <= 50 ? '좋음' : avgPSI <= 100 ? '보통' : avgPSI <= 200 ? '나쁨' : '매우나쁨';
      const psiIcon = avgPSI <= 50 ? '🍃' : avgPSI <= 100 ? '😊' : '😷';
      summaryParts.push(`${psiIcon} 대기질 ${psiStatus} (PSI ${avgPSI})`);
    }

    // 날씨 상태 추가
    if (weatherData && weatherData.items && weatherData.items[0]) {
      const forecasts = weatherData.items[0].forecasts;
      const commonForecast = forecasts[0]?.forecast || '정보없음';
      let weatherIcon = '🌤️';
      if (commonForecast.includes('Rain') || commonForecast.includes('Shower')) {weatherIcon = '🌧️';}
      else if (commonForecast.includes('Thundery')) {weatherIcon = '⛈️';}
      else if (commonForecast.includes('Cloudy')) {weatherIcon = '☁️';}
      else if (commonForecast.includes('Fair')) {weatherIcon = '☀️';}

      const cleanForecast = commonForecast.replace(' (Night)', '').replace(' (Day)', '');
      summaryParts.push(`${weatherIcon} ${cleanForecast}`);
    }

    if (summaryParts.length === 0) {
      return '현재 싱가포르 날씨 정보를 확인 중입니다...';
    }

    return `현재 싱가포르: ${summaryParts.join(' • ')} • 업데이트 ${new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}`;
  }

  /**
   * 현재 기상 상황 요약 생성
   */
  generateWeatherSummary(alerts) {
    if (alerts.length === 0) {
      return '현재 특별한 기상 경보는 없습니다';
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