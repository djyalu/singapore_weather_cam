# Singapore Weather Cam - API 및 컴포넌트 문서

## 📡 데이터 API 명세

### 날씨 데이터 API

#### Endpoint: `/data/weather/latest.json`

**설명**: 최신 날씨 정보 제공  
**업데이트 주기**: 5분  
**데이터 소스**: NEA Singapore (data.gov.sg)

**응답 스키마**:
```typescript
interface WeatherResponse {
  timestamp: string;              // ISO 8601 format
  source: 'NEA Singapore' | 'OpenWeatherMap';
  
  data: {
    temperature: {
      readings: Array<{
        station: string;           // Station ID (e.g., "S107", "S109")
        value: number;            // Temperature in Celsius
      }>;
      average: number;            // Average temperature across all stations
    };
    
    humidity: {
      readings: Array<{
        station: string;
        value: number;            // Relative humidity percentage (0-100)
      }>;
      average: number;
    };
    
    rainfall: {
      readings: Array<{
        station: string;
        value: number;            // Rainfall in mm per 5-minute interval
      }>;
      total: number;              // Total rainfall across all stations
    };
    
    forecast?: {
      general: {
        forecast: string;         // Weather description
        relative_humidity: {
          low: number;
          high: number;
        };
        temperature: {
          low: number;
          high: number;
        };
      };
      periods: Array<{
        time: {
          start: string;          // ISO 8601 format
          end: string;
        };
        regions: {
          west: string;           // Regional weather description
          east: string;
          central: string;
          south: string;
          north: string;
        };
      }>;
    };
  };
}
```

**사용 예시**:
```javascript
const response = await fetch('/data/weather/latest.json');
const weatherData = await response.json();

console.log('Current temperature:', weatherData.data.temperature.average);
console.log('Humidity:', weatherData.data.humidity.average);
```

**에러 처리**:
```javascript
try {
  const response = await fetch('/data/weather/latest.json');
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  const data = await response.json();
  
  // 데이터 유효성 검사
  if (!data.timestamp || !data.data) {
    throw new Error('Invalid weather data format');
  }
  
  return data;
} catch (error) {
  console.error('Failed to fetch weather data:', error);
  // 캐시된 데이터 사용 또는 기본값 반환
}
```

### 웹캠 데이터 API

#### Endpoint: `/data/webcam/latest.json`

**설명**: 웹캠 캡처 정보 및 메타데이터  
**업데이트 주기**: 30분 (예정)  
**데이터 소스**: Singapore Traffic Cameras, Public Webcams

**응답 스키마**:
```typescript
interface WebcamResponse {
  timestamp: string;              // Collection time
  total_cameras: number;          // Total number of cameras attempted
  successful_captures: number;    // Successfully captured images
  failed_captures: number;        // Failed capture attempts
  skipped_captures?: number;      // Skipped due to maintenance/downtime
  
  captures: Array<{
    id: string;                   // Unique camera identifier
    name: string;                 // Display name
    location: string;             // Location description
    coordinates: {
      lat: number;                // Latitude
      lng: number;                // Longitude
    };
    type: 'traffic' | 'public' | 'weather' | 'test';
    
    timestamp: string;            // Capture attempt time
    capture_time: string;         // Actual capture completion time
    status: 'success' | 'failed' | 'skipped';
    
    file_info?: {
      path: string;               // Relative path to image file
      size: number;               // File size in bytes
      created: string;            // File creation timestamp
      source_url?: string;        // Original source URL
    };
    
    ai_analysis?: {
      analysis_available: boolean;
      reason?: string;            // If analysis not available
      description?: string;       // AI-generated description
      weather_condition?: string; // Detected weather
      visibility?: 'excellent' | 'good' | 'moderate' | 'poor';
      tags?: string[];           // Analysis tags
      confidence?: number;       // Analysis confidence (0-1)
    };
    
    error?: string;               // Error message if failed
  }>;
}
```

**사용 예시**:
```javascript
const response = await fetch('/data/webcam/latest.json');
const webcamData = await response.json();

// 성공한 캡처만 필터링
const successfulCaptures = webcamData.captures.filter(
  capture => capture.status === 'success'
);

console.log(`${successfulCaptures.length} cameras available`);
```

**이미지 접근**:
```javascript
// 웹캠 이미지 표시
const ImageComponent = ({ capture }) => {
  if (capture.status !== 'success' || !capture.file_info) {
    return <div>Image not available</div>;
  }
  
  return (
    <img 
      src={`/${capture.file_info.path}`}
      alt={capture.name}
      loading="lazy"
    />
  );
};
```

## 🧩 React 컴포넌트 문서

### 공통 컴포넌트

#### ErrorBoundary

**위치**: `src/components/common/ErrorBoundary.jsx`  
**목적**: React 애플리케이션 에러 경계 설정

```jsx
interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; errorInfo: ErrorInfo }>;
}

// 사용 예시
<ErrorBoundary fallback={CustomErrorComponent}>
  <WeatherDashboard />
</ErrorBoundary>
```

**기능**:
- JavaScript 에러 자동 포착
- 에러 정보 로깅
- 사용자 친화적 에러 메시지 표시
- 애플리케이션 크래시 방지

#### LoadingScreen

**위치**: `src/components/common/LoadingScreen.jsx`  
**목적**: 데이터 로딩 중 표시되는 스크린

```jsx
interface LoadingScreenProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

// 사용 예시
<LoadingScreen message="날씨 데이터 로딩 중..." size="medium" />
```

**기능**:
- 로딩 애니메이션 표시
- 커스텀 메시지 지원
- 반응형 크기 조절

### 레이아웃 컴포넌트

#### Header

**위치**: `src/components/layout/Header.jsx`  
**목적**: 애플리케이션 상단 네비게이션

```jsx
interface HeaderProps {
  title?: string;
  showRefresh?: boolean;
  onRefresh?: () => void;
}

// 사용 예시
<Header 
  title="Singapore Weather Cam"
  showRefresh={true}
  onRefresh={handleRefresh}
/>
```

**기능**:
- 애플리케이션 타이틀 표시
- 새로고침 버튼
- 반응형 네비게이션
- 다크모드 토글 (향후 추가)

### 날씨 컴포넌트

#### WeatherDashboard

**위치**: `src/components/weather/WeatherDashboard.jsx`  
**목적**: 날씨 정보 종합 대시보드

```jsx
interface WeatherDashboardProps {
  data: WeatherResponse | null;
  loading?: boolean;
  error?: string;
}

// 사용 예시
<WeatherDashboard 
  data={weatherData}
  loading={isLoading}
  error={errorMessage}
/>
```

**기능**:
- 현재 날씨 정보 표시
- 지역별 데이터 선택
- 24시간 예보 차트
- 날씨 카드 그리드 레이아웃

**내부 구조**:
```jsx
const WeatherDashboard = ({ data }) => {
  const [selectedLocation, setSelectedLocation] = useState('all');
  
  return (
    <div className="space-y-6">
      {/* 지역 선택 버튼 */}
      <LocationSelector 
        locations={data.locations}
        selected={selectedLocation}
        onSelect={setSelectedLocation}
      />
      
      {/* 날씨 카드 그리드 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <WeatherCard title="Temperature" {...} />
        <WeatherCard title="Humidity" {...} />
        <WeatherCard title="Rainfall" {...} />
        <WeatherCard title="Wind" {...} />
      </div>
      
      {/* 예보 차트 */}
      {forecast && <WeatherChart data={forecast} />}
    </div>
  );
};
```

#### WeatherCard

**위치**: `src/components/weather/WeatherCard.jsx`  
**목적**: 개별 날씨 지표 표시 카드

```jsx
interface WeatherCardProps {
  title: string;
  value: string;
  icon: string;
  description?: string;
  trend?: 'up' | 'down' | 'stable';
  color?: 'blue' | 'green' | 'yellow' | 'red';
}

// 사용 예시
<WeatherCard
  title="Temperature"
  value="28.5°C"
  icon="🌡️"
  description="Feels like 32.1°C"
  trend="up"
  color="red"
/>
```

**스타일링**:
```css
.weather-card {
  @apply bg-white rounded-lg shadow-md p-6 transition-all hover:shadow-lg;
}

.weather-card-icon {
  @apply text-3xl mb-2;
}

.weather-card-value {
  @apply text-2xl font-bold text-gray-800;
}
```

#### WeatherChart

**위치**: `src/components/weather/WeatherChart.jsx`  
**목적**: 날씨 데이터 시각화 차트

```jsx
interface WeatherChartProps {
  data: Array<{
    time: string;
    temperature: number;
    rainfall?: number;
  }>;
  type?: 'line' | 'bar' | 'area';
  height?: number;
}

// 사용 예시
<WeatherChart 
  data={forecastData}
  type="line"
  height={300}
/>
```

**Chart.js 설정**:
```javascript
const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  scales: {
    x: {
      type: 'time',
      time: {
        unit: 'hour',
        displayFormats: {
          hour: 'HH:mm'
        }
      }
    },
    y: {
      beginAtZero: true,
      title: {
        display: true,
        text: 'Temperature (°C)'
      }
    }
  },
  plugins: {
    legend: {
      display: true,
      position: 'top'
    },
    tooltip: {
      mode: 'index',
      intersect: false
    }
  }
};
```

### 웹캠 컴포넌트

#### WebcamGallery

**위치**: `src/components/webcam/WebcamGallery.jsx`  
**목적**: 웹캠 이미지 갤러리 표시

```jsx
interface WebcamGalleryProps {
  data: WebcamResponse | null;
  columns?: number;
  showFailedCameras?: boolean;
}

// 사용 예시
<WebcamGallery 
  data={webcamData}
  columns={3}
  showFailedCameras={false}
/>
```

**기능**:
- 그리드 레이아웃 이미지 갤러리
- 이미지 lazy loading
- 모달 팝업 지원
- 실패한 카메라 표시 옵션

#### WebcamCard

**위치**: `src/components/webcam/WebcamCard.jsx`  
**목적**: 개별 웹캠 이미지 카드

```jsx
interface WebcamCardProps {
  capture: WebcamCapture;
  onClick?: (capture: WebcamCapture) => void;
  showMetadata?: boolean;
}

// 사용 예시
<WebcamCard 
  capture={cameraData}
  onClick={handleImageClick}
  showMetadata={true}
/>
```

**상태별 렌더링**:
```jsx
const WebcamCard = ({ capture, onClick, showMetadata }) => {
  if (capture.status === 'failed') {
    return (
      <div className="webcam-card error">
        <div className="error-message">
          <span>📷</span>
          <p>{capture.name}</p>
          <small>{capture.error}</small>
        </div>
      </div>
    );
  }
  
  return (
    <div className="webcam-card success" onClick={() => onClick(capture)}>
      <img 
        src={`/${capture.file_info.path}`}
        alt={capture.name}
        loading="lazy"
      />
      {showMetadata && (
        <div className="metadata">
          <h4>{capture.name}</h4>
          <p>{capture.location}</p>
          {capture.ai_analysis?.description && (
            <p className="ai-description">
              {capture.ai_analysis.description}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
```

#### WebcamModal

**위치**: `src/components/webcam/WebcamModal.jsx`  
**목적**: 웹캠 이미지 확대 모달

```jsx
interface WebcamModalProps {
  capture: WebcamCapture | null;
  isOpen: boolean;
  onClose: () => void;
}

// 사용 예시
<WebcamModal 
  capture={selectedCapture}
  isOpen={modalOpen}
  onClose={() => setModalOpen(false)}
/>
```

**기능**:
- 전체 화면 이미지 표시
- 이미지 메타데이터 표시
- AI 분석 결과 표시
- 키보드 네비게이션 (ESC, 화살표)

### 지도 컴포넌트

#### MapView

**위치**: `src/components/map/MapView.jsx`  
**목적**: 날씨/웹캠 위치 지도 표시

```jsx
interface MapViewProps {
  weatherData: WeatherResponse | null;
  webcamData: WebcamResponse | null;
  center?: [number, number];
  zoom?: number;
  height?: string;
}

// 사용 예시
<MapView 
  weatherData={weatherData}
  webcamData={webcamData}
  center={[1.3521, 103.8198]} // Singapore coordinates
  zoom={11}
  height="400px"
/>
```

**Leaflet 설정**:
```javascript
const mapOptions = {
  center: [1.3521, 103.8198], // Singapore center
  zoom: 11,
  scrollWheelZoom: false,
  zoomControl: true
};

// 날씨 마커
const weatherMarkers = weatherData?.data.temperature.readings.map(reading => (
  <Marker 
    key={reading.station}
    position={getStationCoordinates(reading.station)}
    icon={temperatureIcon}
  >
    <Popup>
      <div>
        <h4>Station {reading.station}</h4>
        <p>Temperature: {reading.value}°C</p>
      </div>
    </Popup>
  </Marker>
));

// 웹캠 마커
const webcamMarkers = webcamData?.captures
  .filter(capture => capture.status === 'success')
  .map(capture => (
    <Marker 
      key={capture.id}
      position={[capture.coordinates.lat, capture.coordinates.lng]}
      icon={webcamIcon}
    >
      <Popup>
        <div>
          <h4>{capture.name}</h4>
          <img 
            src={`/${capture.file_info.path}`}
            alt={capture.name}
            style={{ width: '200px', height: 'auto' }}
          />
        </div>
      </Popup>
    </Marker>
  ));
```

## 🔄 데이터 플로우 및 상태 관리

### 메인 애플리케이션 상태

**App.jsx 상태 구조**:
```javascript
const [state, setState] = useState({
  loading: true,
  error: null,
  weatherData: null,
  webcamData: null,
  lastUpdate: null
});
```

**데이터 로딩 플로우**:
```javascript
const fetchData = async () => {
  try {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    // 병렬 데이터 로딩
    const [weatherResponse, webcamResponse] = await Promise.all([
      fetch('/data/weather/latest.json'),
      fetch('/data/webcam/latest.json')
    ]);
    
    // 응답 검증
    if (!weatherResponse.ok) {
      throw new Error(`Weather API: ${weatherResponse.status}`);
    }
    if (!webcamResponse.ok) {
      throw new Error(`Webcam API: ${webcamResponse.status}`);
    }
    
    // 데이터 파싱
    const [weatherData, webcamData] = await Promise.all([
      weatherResponse.json(),
      webcamResponse.json()
    ]);
    
    // 상태 업데이트
    setState({
      loading: false,
      error: null,
      weatherData,
      webcamData,
      lastUpdate: new Date()
    });
    
  } catch (error) {
    console.error('Data loading error:', error);
    setState(prev => ({
      ...prev,
      loading: false,
      error: error.message
    }));
  }
};
```

### 에러 처리 전략

**계층적 에러 처리**:
```javascript
// 1. API 레벨 에러 처리
const fetchWithTimeout = async (url, timeout = 10000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  
  try {
    const response = await fetch(url, { 
      signal: controller.signal 
    });
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new Error('Request timeout');
    }
    throw error;
  }
};

// 2. 컴포넌트 레벨 에러 처리
const WeatherDashboard = ({ data, loading, error }) => {
  if (error) {
    return (
      <div className="error-state">
        <h3>날씨 데이터 로딩 실패</h3>
        <p>{error}</p>
        <button onClick={onRetry}>다시 시도</button>
      </div>
    );
  }
  
  if (loading) {
    return <LoadingScreen message="날씨 데이터 로딩 중..." />;
  }
  
  if (!data) {
    return (
      <div className="empty-state">
        <p>날씨 데이터가 없습니다.</p>
      </div>
    );
  }
  
  return <WeatherContent data={data} />;
};

// 3. 전역 에러 경계
<ErrorBoundary>
  <App />
</ErrorBoundary>
```

## 🎨 스타일링 가이드

### Tailwind CSS 클래스 패턴

**색상 팔레트**:
```css
/* 날씨 관련 색상 */
.weather-blue { @apply bg-blue-500 text-white; }
.weather-green { @apply bg-green-500 text-white; }
.weather-yellow { @apply bg-yellow-500 text-black; }
.weather-red { @apply bg-red-500 text-white; }

/* Singapore 테마 색상 */
.singapore-red { @apply bg-red-600 text-white; }
.singapore-white { @apply bg-white text-gray-800; }
```

**컴포넌트 스타일 패턴**:
```css
/* 카드 스타일 */
.card {
  @apply bg-white rounded-lg shadow-md p-6 transition-all hover:shadow-lg;
}

/* 버튼 스타일 */
.btn-primary {
  @apply bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors;
}

.btn-secondary {
  @apply bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors;
}

/* 그리드 레이아웃 */
.container-custom {
  @apply max-w-7xl mx-auto px-4 sm:px-6 lg:px-8;
}

/* 반응형 그리드 */
.grid-responsive {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6;
}
```

**반응형 디자인 브레이크포인트**:
```css
/* Tailwind 기본 브레이크포인트 */
sm: 640px   /* 모바일 가로 */
md: 768px   /* 태블릿 */
lg: 1024px  /* 데스크톱 */
xl: 1280px  /* 대형 데스크톱 */
2xl: 1536px /* 초대형 화면 */
```

## 🧪 테스트 가이드 (향후 구현)

### 단위 테스트 예시

**컴포넌트 테스트**:
```javascript
// WeatherCard.test.jsx
import { render, screen } from '@testing-library/react';
import WeatherCard from '../WeatherCard';

describe('WeatherCard', () => {
  const mockProps = {
    title: 'Temperature',
    value: '28.5°C',
    icon: '🌡️',
    description: 'Feels like 32.1°C'
  };
  
  it('displays weather information correctly', () => {
    render(<WeatherCard {...mockProps} />);
    
    expect(screen.getByText('Temperature')).toBeInTheDocument();
    expect(screen.getByText('28.5°C')).toBeInTheDocument();
    expect(screen.getByText('Feels like 32.1°C')).toBeInTheDocument();
  });
  
  it('handles missing description', () => {
    const props = { ...mockProps, description: undefined };
    render(<WeatherCard {...props} />);
    
    expect(screen.queryByText('Feels like 32.1°C')).not.toBeInTheDocument();
  });
});
```

**API 테스트**:
```javascript
// weatherApi.test.js
import { fetchWeatherData } from '../utils/weatherApi';

describe('Weather API', () => {
  beforeEach(() => {
    fetch.resetMocks();
  });
  
  it('fetches weather data successfully', async () => {
    const mockData = {
      timestamp: '2025-07-26T06:00:00Z',
      data: { temperature: { average: 28.5 } }
    };
    
    fetch.mockResponseOnce(JSON.stringify(mockData));
    
    const result = await fetchWeatherData();
    
    expect(result).toEqual(mockData);
    expect(fetch).toHaveBeenCalledWith('/data/weather/latest.json');
  });
  
  it('handles fetch errors', async () => {
    fetch.mockRejectOnce(new Error('Network error'));
    
    await expect(fetchWeatherData()).rejects.toThrow('Network error');
  });
});
```

### E2E 테스트 예시

**Playwright 테스트**:
```javascript
// e2e/weather-app.spec.js
import { test, expect } from '@playwright/test';

test.describe('Weather App', () => {
  test('displays weather dashboard', async ({ page }) => {
    await page.goto('/');
    
    // 로딩 화면 확인
    await expect(page.locator('[data-testid="loading-screen"]')).toBeVisible();
    
    // 데이터 로딩 완료 대기
    await expect(page.locator('[data-testid="weather-dashboard"]')).toBeVisible();
    
    // 온도 카드 확인
    await expect(page.locator('[data-testid="temperature-card"]')).toContainText('°C');
  });
  
  test('opens webcam modal', async ({ page }) => {
    await page.goto('/');
    
    // 웹캠 이미지 클릭
    await page.locator('[data-testid="webcam-card"]').first().click();
    
    // 모달 열림 확인
    await expect(page.locator('[data-testid="webcam-modal"]')).toBeVisible();
    
    // ESC 키로 모달 닫기
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="webcam-modal"]')).not.toBeVisible();
  });
});
```

## 📚 개발자 참고사항

### 개발 환경 설정

**필수 VS Code 확장**:
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- Prettier - Code formatter
- ESLint
- Auto Rename Tag

**추천 개발 도구**:
- React Developer Tools (브라우저 확장)
- Redux DevTools (상태 관리 시)
- Lighthouse (성능 측정)

### 성능 최적화 팁

**React 최적화**:
```javascript
// 1. React.memo 사용
const WeatherCard = React.memo(({ data }) => {
  return <div>{/* 컴포넌트 내용 */}</div>;
});

// 2. useMemo로 계산 캐싱
const processedData = useMemo(() => {
  return expensiveCalculation(rawData);
}, [rawData]);

// 3. useCallback으로 함수 캐싱
const handleClick = useCallback((id) => {
  setSelectedId(id);
}, [setSelectedId]);

// 4. lazy loading
const WebcamModal = lazy(() => import('./WebcamModal'));
```

**이미지 최적화**:
```javascript
// Intersection Observer로 lazy loading
const LazyImage = ({ src, alt }) => {
  const [imageSrc, setImageSrc] = useState(null);
  const imgRef = useRef();
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setImageSrc(src);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    
    if (imgRef.current) {
      observer.observe(imgRef.current);
    }
    
    return () => observer.disconnect();
  }, [src]);
  
  return (
    <div ref={imgRef}>
      {imageSrc && <img src={imageSrc} alt={alt} />}
    </div>
  );
};
```

### 보안 고려사항

**XSS 방지**:
```javascript
// 사용자 입력 데이터 정화
import DOMPurify from 'dompurify';

const SafeHTML = ({ html }) => {
  const cleanHTML = DOMPurify.sanitize(html);
  return <div dangerouslySetInnerHTML={{ __html: cleanHTML }} />;
};
```

**API 요청 보안**:
```javascript
// CSRF 토큰 포함 (필요 시)
const fetchWithCSRF = async (url, options = {}) => {
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.content;
  
  return fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'X-CSRF-TOKEN': csrfToken,
      ...options.headers
    }
  });
};
```

---

## 🔧 문제 해결

### 자주 발생하는 문제

**1. 데이터 로딩 실패**
```javascript
// 해결: 재시도 로직 구현
const useWeatherData = () => {
  const [data, setData] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  
  const fetchData = useCallback(async () => {
    try {
      const response = await fetch('/data/weather/latest.json');
      const data = await response.json();
      setData(data);
      setRetryCount(0); // 성공 시 재시도 카운트 리셋
    } catch (error) {
      if (retryCount < 3) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
          fetchData();
        }, Math.pow(2, retryCount) * 1000); // 지수 백오프
      }
    }
  }, [retryCount]);
  
  return { data, retry: fetchData };
};
```

**2. 이미지 로딩 실패**
```javascript
// 해결: 이미지 에러 처리
const WebcamImage = ({ src, alt, fallback }) => {
  const [imageSrc, setImageSrc] = useState(src);
  const [hasError, setHasError] = useState(false);
  
  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImageSrc(fallback || '/images/placeholder.jpg');
    }
  };
  
  return (
    <img 
      src={imageSrc}
      alt={alt}
      onError={handleError}
      loading="lazy"
    />
  );
};
```

**3. 모바일 반응형 이슈**
```css
/* 해결: 적절한 뷰포트 및 터치 대상 크기 */
.touch-target {
  @apply min-h-[44px] min-w-[44px]; /* iOS 권장 최소 크기 */
}

.mobile-friendly {
  @apply text-base leading-relaxed; /* 가독성 향상 */
}

/* 모바일에서 hover 효과 제거 */
@media (hover: hover) {
  .hover-effect:hover {
    @apply shadow-lg;
  }
}
```

### 디버깅 도구

**개발자 도구 활용**:
```javascript
// 성능 측정
const performanceDebug = () => {
  if (process.env.NODE_ENV === 'development') {
    // 컴포넌트 렌더링 시간 측정
    console.time('Component Render');
    // 컴포넌트 로직
    console.timeEnd('Component Render');
    
    // 메모리 사용량 체크
    if (performance.memory) {
      console.log('Memory:', {
        used: Math.round(performance.memory.usedJSHeapSize / 1048576) + 'MB',
        total: Math.round(performance.memory.totalJSHeapSize / 1048576) + 'MB'
      });
    }
  }
};

// 네트워크 요청 로깅
const debugFetch = async (url, options) => {
  console.log(`🌐 Fetching: ${url}`);
  const startTime = performance.now();
  
  try {
    const response = await fetch(url, options);
    const endTime = performance.now();
    
    console.log(`✅ ${url} completed in ${Math.round(endTime - startTime)}ms`);
    return response;
  } catch (error) {
    console.error(`❌ ${url} failed:`, error);
    throw error;
  }
};
```

---

*이 API 및 컴포넌트 문서는 프로젝트 발전과 함께 지속적으로 업데이트됩니다.*  
*마지막 업데이트: 2025-07-26*