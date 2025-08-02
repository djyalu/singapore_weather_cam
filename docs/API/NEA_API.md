# 🌤️ NEA Singapore API 가이드

## 개요

NEA (National Environment Agency) Singapore API는 싱가포르 전역의 실시간 기상 데이터를 제공합니다.

## 📊 API 기본 정보

### 엔드포인트
```
BASE_URL: https://api.data.gov.sg/v1/environment/
```

### 주요 API 목록
| API | 엔드포인트 | 업데이트 주기 | 데이터 타입 |
|-----|-----------|--------------|-------------|
| 2시간 날씨 예보 | `/2-hour-weather-forecast` | 30분 | 온도, 습도, 강수량 |
| 실시간 날씨 | `/realtime-weather-readings` | 1분 | 온도, 습도, 강수량, 풍향 |
| 24시간 예보 | `/24-hour-weather-forecast` | 6시간 | 일반 예보, 온도 범위 |

## 🔌 실시간 날씨 데이터 API

### 요청 예시
```javascript
const response = await fetch(
  'https://api.data.gov.sg/v1/environment/2-hour-weather-forecast'
);
const data = await response.json();
```

### 응답 구조
```json
{
  "area_metadata": [
    {
      "name": "Ang Mo Kio",
      "label_location": {
        "latitude": 1.375,
        "longitude": 103.839
      }
    }
  ],
  "items": [
    {
      "update_timestamp": "2025-08-02T14:35:00+08:00",
      "timestamp": "2025-08-02T14:30:00+08:00",
      "valid_period": {
        "start": "2025-08-02T14:30:00+08:00",
        "end": "2025-08-02T16:30:00+08:00"
      },
      "forecasts": [
        {
          "area": "Ang Mo Kio",
          "forecast": "Partly Cloudy"
        }
      ]
    }
  ]
}
```

## 🏠 프로젝트 내 구현

### 데이터 수집 스크립트 (`scripts/collect-weather.js`)

```javascript
/**
 * NEA API에서 59개 관측소 실시간 데이터 수집
 */
async function collectWeatherData() {
  const endpoints = [
    '2-hour-weather-forecast',
    'realtime-weather-readings', 
    '24-hour-weather-forecast'
  ];
  
  const results = await Promise.all(
    endpoints.map(endpoint => 
      fetch(`https://api.data.gov.sg/v1/environment/${endpoint}`)
        .then(res => res.json())
    )
  );
  
  return transformToStandardFormat(results);
}
```

### 데이터 변환 (`src/utils/weatherDataTransformer.js`)

```javascript
/**
 * NEA API 응답을 앱 표준 형식으로 변환
 */
export const transformWeatherData = (neaData) => {
  return {
    timestamp: new Date().toISOString(),
    source: 'NEA Singapore',
    data: {
      temperature: {
        readings: extractTemperatureReadings(neaData),
        average: calculateAverage(neaData.temperature)
      },
      humidity: {
        readings: extractHumidityReadings(neaData),
        average: calculateAverage(neaData.humidity)
      },
      rainfall: {
        readings: extractRainfallReadings(neaData),
        total: calculateTotal(neaData.rainfall)
      }
    }
  };
};
```

### 지역별 데이터 통합 (`src/utils/weatherDataUnifier.js`)

```javascript
/**
 * 8개 표준 지역별 온도 계산
 */
export const getRegionalTemperature = (weatherData, regionId) => {
  const region = STANDARD_REGIONS.find(r => r.id === regionId);
  
  // NEA API 직접 데이터 구조에서 읽기
  if (weatherData?.data?.temperature?.readings) {
    const matchedReadings = region.stationIds
      .map(stationId => 
        weatherData.data.temperature.readings.find(
          reading => reading.station === stationId
        )
      )
      .filter(Boolean);
      
    const temps = matchedReadings.map(reading => reading.value);
    return temps.reduce((sum, temp) => sum + temp, 0) / temps.length;
  }
  
  return region.fallbackTemp;
};
```

## 🎯 현재 프로젝트에서 사용되는 관측소

### 우선 관측소 (8개 지역별)
| 지역 | 관측소 ID | 관측소 명 | 좌표 |
|------|-----------|-----------|------|
| Hwa Chong | S109, S104 | Ang Mo Kio, Woodlands | 1.3437°N, 103.7640°E |
| Newton | S109, S107 | Newton, East Coast | 1.3100°N, 103.8300°E |
| Changi | S24, S107 | Changi, East Coast | 1.3600°N, 103.9600°E |
| North | S24, S115 | 북부 지역 | 1.4200°N, 103.7900°E |
| Jurong | S104, S60 | Jurong West, Sentosa | 1.3496°N, 103.7063°E |
| Central | S109, S106 | Newton, Tai Seng | 1.3048°N, 103.8318°E |
| East | S107, S43 | East Coast, Kim Chuan | 1.3048°N, 103.9318°E |
| South | S60, S104 | Sentosa, 남서부 | 1.2700°N, 103.8200°E |

### 전체 관측소 (59개)
프로젝트는 NEA에서 제공하는 전체 59개 관측소 데이터를 수집하여 가장 정확한 지역별 평균을 계산합니다.

## ⚙️ GitHub Actions 자동화

### 데이터 수집 워크플로우 (`.github/workflows/collect-weather.yml`)

```yaml
name: Collect Weather Data
on:
  schedule:
    - cron: '0 */6 * * *'  # 6시간마다
  workflow_dispatch:  # 수동 실행

jobs:
  collect:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      - name: Install dependencies
        run: npm ci
      - name: Collect weather data
        run: npm run collect-weather
      - name: Commit and push
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add data/weather/latest.json
          git commit -m "🤖 Update weather data" || exit 0
          git push
```

## 📊 데이터 품질 및 신뢰성

### 데이터 검증 (`src/services/dataReliabilityService.js`)

```javascript
/**
 * NEA API 데이터 품질 검증
 */
export const validateWeatherData = (data) => {
  const checks = [
    data.timestamp && isValidTimestamp(data.timestamp),
    data.data?.temperature?.readings?.length > 0,
    data.data?.humidity?.readings?.length > 0,
    data.geographic_coverage?.total_stations > 50
  ];
  
  return {
    isValid: checks.every(Boolean),
    qualityScore: checks.filter(Boolean).length / checks.length,
    issues: identifyIssues(data)
  };
};
```

### 오류 처리 및 폴백

```javascript
/**
 * Circuit Breaker 패턴으로 API 안정성 확보
 */
class NEAApiCircuitBreaker {
  constructor() {
    this.failureCount = 0;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.timeout = 30000; // 30초
  }
  
  async call(apiFunction) {
    if (this.state === 'OPEN') {
      throw new Error('Circuit breaker is OPEN');
    }
    
    try {
      const result = await apiFunction();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
}
```

## 🔗 참고 자료

- **NEA 공식 문서**: https://data.gov.sg/developer
- **API 테스트**: https://api.data.gov.sg/v1/environment/
- **싱가포르 기상청**: https://www.nea.gov.sg/

## 🚨 주의사항

1. **Rate Limiting**: API 호출 제한 없음 (정부 공개 데이터)
2. **데이터 지연**: 실시간이지만 1-5분 지연 가능
3. **서비스 중단**: 가끔 정기 점검으로 일시 중단
4. **데이터 형식**: JSON 형식 고정, 스키마 변경 시 알림

---

**💡 팁**: NEA API는 무료이며 인증이 필요 없어 개발하기 매우 편리합니다!