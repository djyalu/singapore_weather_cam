# 📡 API Reference

Singapore Weather Cam 프로젝트의 API 및 서비스 레퍼런스 문서입니다.

## 📋 **목차**

- [External APIs](#external-apis)
- [Internal Services](#internal-services)
- [Data Formats](#data-formats)
- [Error Handling](#error-handling)
- [Rate Limits](#rate-limits)
- [Authentication](#authentication)

## 🌐 **External APIs**

### **NEA Singapore Weather API**

**Base URL**: `https://api.data.gov.sg/v1/environment/`

#### **Air Temperature**
```
GET /air-temperature
```

**Response Example**:
```json
{
  "area_metadata": [
    {
      "name": "Bukit Timah",
      "label_location": {
        "latitude": 1.3520,
        "longitude": 103.7767
      }
    }
  ],
  "items": [
    {
      "timestamp": "2024-01-01T12:00:00+08:00",
      "readings": [
        {
          "station_id": "S121",
          "value": 28.5
        }
      ]
    }
  ]
}
```

#### **Relative Humidity**
```
GET /relative-humidity
```

#### **Rainfall**
```
GET /rainfall
```

#### **24-hour Weather Forecast**
```
GET /24-hour-weather-forecast
```

### **LTA Traffic Images API**

**Base URL**: `https://api.data.gov.sg/v1/transport/`

#### **Traffic Images**
```
GET /traffic-images
```

**Response Example**:
```json
{
  "items": [
    {
      "timestamp": "2024-01-01T12:00:00+08:00",
      "cameras": [
        {
          "timestamp": "2024-01-01T12:00:00+08:00",
          "image": "https://images.data.gov.sg/api/traffic-images/camera_1234",
          "location": {
            "latitude": 1.3520,
            "longitude": 103.7767
          },
          "camera_id": "1234",
          "image_metadata": {
            "height": 1080,
            "width": 1920,
            "md5": "abc123..."
          }
        }
      ]
    }
  ]
}
```

### **Claude AI Vision API**

**Base URL**: `https://api.anthropic.com/v1/`

#### **Image Analysis**
```
POST /messages
Authorization: x-api-key: your_api_key
```

**Request Body**:
```json
{
  "model": "claude-3-5-sonnet-20241022",
  "max_tokens": 1000,
  "messages": [
    {
      "role": "user",
      "content": [
        {
          "type": "image",
          "source": {
            "type": "base64",
            "media_type": "image/jpeg",
            "data": "base64_image_data"
          }
        },
        {
          "type": "text",
          "text": "Analyze this Singapore traffic camera image for weather conditions and traffic situation."
        }
      ]
    }
  ]
}
```

## 🔧 **Internal Services**

### **trafficCameraService.js**

주요 함수들:

#### **fetchTrafficCameras()**
```javascript
async function fetchTrafficCameras()
```

**Returns**: `Promise<Object>`
```json
{
  "total_cameras": 90,
  "successful_captures": 85,
  "failed_captures": 5,
  "captures": [
    {
      "id": "camera_1234",
      "location": "Bukit Timah Road",
      "coordinates": {
        "lat": 1.3520,
        "lng": 103.7767
      },
      "image_url": "https://images.data.gov.sg/api/traffic-images/camera_1234",
      "timestamp": "2024-01-01T12:00:00.000Z",
      "metadata": {
        "height": 1080,
        "width": 1920,
        "quality": "HD"
      },
      "status": "success"
    }
  ]
}
```

#### **filterCamerasByRegion(cameras, region)**
```javascript
function filterCamerasByRegion(cameras, region)
```

**Parameters**:
- `cameras`: Array of camera objects
- `region`: String - "major", "central", "north", "south", "east", "west", "all"

**Returns**: Filtered camera array

#### **analyzeImageWithClaude(imageUrl, claudeApiKey)**
```javascript
async function analyzeImageWithClaude(imageUrl, claudeApiKey)
```

**Returns**: `Promise<Object>`
```json
{
  "weather_condition": "Partly cloudy",
  "traffic_condition": "Light traffic",
  "visibility": "Good",
  "analysis_timestamp": "2024-01-01T12:00:00.000Z",
  "confidence": 85
}
```

### **webcamSources.js**

웹캠 소스 설정:

```javascript
export const webcamSources = [
  {
    id: 'bukit_timah_1',
    name: 'Bukit Timah Nature Reserve',
    location: 'Bukit Timah',
    coordinates: { lat: 1.3520, lng: 103.7767 },
    type: 'nature',
    priority: 'primary'
  },
  {
    id: 'newton_1',
    name: 'Newton MRT',
    location: 'Newton',
    coordinates: { lat: 1.3138, lng: 103.8420 },
    type: 'urban',
    priority: 'secondary'
  }
]
```

## 📊 **Data Formats**

### **Weather Data Structure**
```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "source": "NEA Singapore",
  "location": {
    "name": "Bukit Timah Nature Reserve",
    "coordinates": {
      "lat": 1.3520,
      "lng": 103.7767
    }
  },
  "data": {
    "temperature": {
      "value": 28.5,
      "unit": "°C",
      "station_id": "S121"
    },
    "humidity": {
      "value": 75.2,
      "unit": "%",
      "station_id": "S121"
    },
    "rainfall": {
      "value": 0.0,
      "unit": "mm",
      "station_id": "S121"
    }
  }
}
```

### **Webcam Data Structure**
```json
{
  "timestamp": "2024-01-01T12:00:00.000Z",
  "total_cameras": 90,
  "successful_captures": 85,
  "failed_captures": 5,
  "captures": [
    {
      "id": "camera_1234",
      "name": "Bukit Timah Road",
      "location": "Bukit Timah",
      "coordinates": {
        "lat": 1.3520,
        "lng": 103.7767
      },
      "image_url": "https://example.com/image.jpg",
      "timestamp": "2024-01-01T12:00:00.000Z",
      "status": "success",
      "ai_analysis": {
        "weather_condition": "Partly cloudy",
        "traffic_condition": "Light traffic",
        "visibility": "Good",
        "confidence": 85
      },
      "metadata": {
        "height": 1080,
        "width": 1920,
        "size_bytes": 245760,
        "format": "JPEG"
      }
    }
  ]
}
```

## ⚠️ **Error Handling**

### **Common Error Responses**

#### **API Timeout**
```json
{
  "error": "timeout",
  "message": "Request timed out after 15000ms",
  "timestamp": "2024-01-01T12:00:00.000Z",
  "retry_after": 300
}
```

#### **Rate Limit Exceeded**
```json
{
  "error": "rate_limit",
  "message": "Too many requests",
  "retry_after": 3600,
  "limit": 1000,
  "remaining": 0
}
```

#### **Service Unavailable**
```json
{
  "error": "service_unavailable",
  "message": "External API temporarily unavailable",
  "status": "degraded",
  "fallback_data": true
}
```

### **Error Handling Strategies**

1. **Exponential Backoff**: 자동 재시도 (1s, 2s, 4s, 8s, 16s)
2. **Circuit Breaker**: 연속 실패 시 일시적 차단
3. **Fallback Data**: 캐시된 데이터 또는 기본값 제공
4. **Graceful Degradation**: 핵심 기능 유지

## 📊 **Rate Limits**

### **External APIs**

| API | Limit | Window | Notes |
|-----|-------|--------|-------|
| NEA Singapore | Unlimited | - | Free government API |
| LTA Traffic | Unlimited | - | Free government API |
| Claude AI | 1000 requests | 1 day | Anthropic limits |

### **Internal Services**

| Service | Limit | Window | Purpose |
|---------|-------|--------|---------|
| Traffic Camera Fetch | 1 request | 1 minute | Resource optimization |
| Weather Data Fetch | 1 request | 30 minutes | GitHub Actions efficiency |
| AI Analysis | 10 requests | 1 hour | Cost management |

## 🔐 **Authentication**

### **Environment Variables**

```bash
# Required for AI analysis (optional)
CLAUDE_API_KEY=your_claude_api_key

# Required for backup weather data (optional)
OPENWEATHER_API_KEY=your_openweather_api_key

# GitHub Actions (automatic)
GITHUB_TOKEN=automatic_github_token
```

### **API Key Management**

1. **GitHub Secrets**: 프로덕션 환경 키 관리
2. **Local .env**: 개발 환경 (git ignored)
3. **Validation**: 시작 시 키 유효성 검증
4. **Fallback**: 키 없이도 기본 기능 작동

## 🔄 **Caching Strategy**

### **Cache Layers**

1. **Browser Cache**: 1시간 정적 리소스
2. **Service Worker**: 오프라인 데이터
3. **GitHub Actions Cache**: npm 의존성
4. **Data Cache**: 최근 API 응답 (5분)

### **Cache Invalidation**

- **Weather Data**: 30분 TTL
- **Traffic Images**: 1분 TTL (실시간 업데이트)
- **Static Assets**: 1일 TTL
- **AI Analysis**: 1시간 TTL

## 📈 **Performance Metrics**

### **Target SLAs**

| Metric | Target | Measurement |
|--------|--------|-------------|
| API Response Time | < 2s | P95 |
| Page Load Time | < 3s | First Contentful Paint |
| Data Freshness | < 30min | Last update timestamp |
| Uptime | > 99% | Monthly average |

### **Monitoring**

- **GitHub Actions**: 워크플로우 실행 시간
- **Web Vitals**: Core Web Vitals 추적
- **Error Rate**: API 실패율 모니터링
- **Resource Usage**: GitHub Actions 분 사용량

---

**🤖 Generated with [Claude Code](https://claude.ai/code)**

**Co-Authored-By: Claude <noreply@anthropic.com>**