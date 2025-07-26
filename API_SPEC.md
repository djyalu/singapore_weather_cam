# Singapore Weather Cam API Specification

## Overview
Singapore Weather Cam은 정적 사이트 기반이므로, 주로 외부 API를 활용하고 데이터는 JSON 파일로 제공됩니다.

## 외부 API 통합

### 1. Weather.gov.sg API
**용도**: 싱가포르 공식 날씨 데이터 수집

#### Endpoints
- **24시간 날씨 예보**: `https://api.data.gov.sg/v1/environment/24-hour-weather-forecast`
- **실시간 날씨**: `https://api.data.gov.sg/v1/environment/air-temperature`
- **습도**: `https://api.data.gov.sg/v1/environment/relative-humidity`
- **강수량**: `https://api.data.gov.sg/v1/environment/rainfall`

#### 요청 예시
```bash
GET https://api.data.gov.sg/v1/environment/air-temperature
Headers: None required
```

#### 응답 예시
```json
{
  "items": [{
    "timestamp": "2024-01-01T12:00:00+08:00",
    "readings": [{
      "station_id": "S117",
      "value": 28.5
    }]
  }]
}
```

### 2. OpenWeatherMap API (백업)
**용도**: Weather.gov.sg 장애 시 백업

#### Configuration
```javascript
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const SINGAPORE_LAT = 1.3521;
const SINGAPORE_LON = 103.8198;
```

### 3. Claude API
**용도**: 웹캠 이미지 분석 및 날씨 설명 생성

#### 사용 예시
```javascript
const analyzeWeatherImage = async (imageBase64) => {
  const response = await claude.messages.create({
    model: "claude-3-opus-20240229",
    messages: [{
      role: "user",
      content: [
        {
          type: "image",
          source: {
            type: "base64",
            media_type: "image/jpeg",
            data: imageBase64
          }
        },
        {
          type: "text",
          text: "Analyze this weather cam image from Singapore. Describe weather conditions, visibility, and any notable features."
        }
      ]
    }]
  });
  return response.content;
};
```

## 내부 데이터 구조

### 1. Weather Data Format
**파일**: `/data/weather/YYYY-MM-DD.json`

```json
{
  "date": "2024-01-01",
  "hourly": [
    {
      "hour": "00:00",
      "temperature": 26.5,
      "humidity": 85,
      "rainfall": 0,
      "conditions": "cloudy",
      "wind": {
        "speed": 10,
        "direction": "NE"
      }
    }
  ],
  "daily_summary": {
    "temp_high": 32,
    "temp_low": 25,
    "rainfall_total": 5.2,
    "general_forecast": "Partly cloudy with afternoon showers"
  }
}
```

### 2. Webcam Data Format
**파일**: `/data/webcam/YYYY-MM-DD.json`

```json
{
  "date": "2024-01-01",
  "captures": [
    {
      "timestamp": "2024-01-01T06:00:00+08:00",
      "image_path": "/images/webcam/2024-01-01-06-00.jpg",
      "thumbnail_path": "/images/webcam/thumbs/2024-01-01-06-00.jpg",
      "analysis": {
        "visibility": "good",
        "weather_conditions": "clear",
        "claude_description": "Clear morning sky with good visibility...",
        "detected_features": ["sunrise", "clear_sky", "light_traffic"]
      }
    }
  ]
}
```

### 3. Combined Data API
**파일**: `/data/latest.json`

```json
{
  "last_updated": "2024-01-01T12:00:00+08:00",
  "current_weather": {
    "temperature": 28.5,
    "humidity": 82,
    "conditions": "partly cloudy",
    "rainfall_last_hour": 0
  },
  "latest_webcam": {
    "timestamp": "2024-01-01T12:00:00+08:00",
    "image_url": "/images/webcam/latest.jpg",
    "analysis": "Partly cloudy conditions with good visibility"
  },
  "forecast": {
    "next_6_hours": "Afternoon thunderstorms expected",
    "tomorrow": "Similar weather pattern"
  }
}
```

## GitHub Actions Workflows

### 1. Weather Data Collection
**파일**: `.github/workflows/collect-weather.yml`
**스케줄**: 매시간 정각

```yaml
name: Collect Weather Data
on:
  schedule:
    - cron: '0 * * * *'
  workflow_dispatch:

jobs:
  collect:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
      - name: Collect Weather Data
        run: node scripts/collect-weather.js
      - name: Commit and Push
        run: |
          git config user.name "Weather Bot"
          git config user.email "bot@example.com"
          git add data/
          git commit -m "Update weather data"
          git push
```

### 2. Webcam Capture
**파일**: `.github/workflows/capture-webcam.yml`
**스케줄**: 매 30분

## 데이터 접근 패턴

### 1. 최신 데이터 가져오기
```javascript
const getLatestData = async () => {
  const response = await fetch('/data/latest.json');
  return await response.json();
};
```

### 2. 특정 날짜 데이터 가져오기
```javascript
const getDateData = async (date) => {
  const weatherResponse = await fetch(`/data/weather/${date}.json`);
  const webcamResponse = await fetch(`/data/webcam/${date}.json`);
  
  return {
    weather: await weatherResponse.json(),
    webcam: await webcamResponse.json()
  };
};
```

### 3. 날씨 트렌드 데이터
```javascript
const getWeatherTrend = async (days = 7) => {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const trendData = [];
  for (let d = startDate; d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const data = await getDateData(dateStr);
    trendData.push(data);
  }
  
  return trendData;
};
```

## 에러 처리

### API 장애 대응
1. **Primary API 실패**: 백업 API로 자동 전환
2. **데이터 누락**: 이전 데이터 사용 및 경고 표시
3. **이미지 로드 실패**: 플레이스홀더 이미지 표시

### 데이터 유효성 검증
```javascript
const validateWeatherData = (data) => {
  const required = ['temperature', 'humidity', 'conditions'];
  return required.every(field => data.hasOwnProperty(field));
};
```

## Rate Limiting
- Weather.gov.sg: 제한 없음 (공공 데이터)
- OpenWeatherMap: 60 calls/minute (무료 티어)
- Claude API: 계정 제한에 따름
- GitHub Actions: 2000분/월 (무료 티어)