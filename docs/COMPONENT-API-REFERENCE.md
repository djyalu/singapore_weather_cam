# 🧩 Singapore Weather Cam - 컴포넌트 & API 레퍼런스

## 📋 목차

1. [컴포넌트 계층 구조](#컴포넌트-계층-구조)
2. [핵심 컴포넌트 API](#핵심-컴포넌트-api)
3. [커스텀 훅 API](#커스텀-훅-api)
4. [서비스 API](#서비스-api)
5. [유틸리티 함수](#유틸리티-함수)
6. [타입 정의](#타입-정의)

---

## 🏗️ 컴포넌트 계층 구조

### 전체 컴포넌트 트리

```
App (Root Component)
├── ErrorBoundary
│   └── Layout Components
│       ├── Header
│       ├── SystemStats  
│       └── SystemFooter
├── Main Content
│   ├── MapView (Lazy)
│   ├── WeatherDashboard (Lazy)
│   ├── WeatherAnalysisCardRefactored (Lazy)
│   ├── WebcamGallery (Lazy)
│   └── TrafficCameraGallery (Lazy)
├── System Components
│   ├── PWAStatus
│   ├── HealthMonitor
│   └── MonitoringDashboard
└── Common Components
    ├── LoadingScreen
    └── ErrorBoundary
```

---

## 🎯 핵심 컴포넌트 API

### 1. App 컴포넌트

**파일**: `src/App.jsx`

```typescript
interface AppProps {}

const App: React.FC<AppProps>
```

**주요 기능:**
- 전체 애플리케이션 상태 관리
- 초기화 로직 처리 (접근성, 보안)
- 메트릭 추적 및 키보드 단축키 처리

**사용하는 훅:**
- `useDataLoader()` - 데이터 로딩 및 관리
- `useSystemStats()` - 시스템 통계
- `useServiceWorker()` - PWA 기능
- `useMetrics()` - 메트릭 추적

### 2. Header 컴포넌트

**파일**: `src/components/layout/Header.jsx`

```typescript
interface HeaderProps {
  systemStats?: SystemStatsData;
}

const Header: React.FC<HeaderProps>
```

**주요 기능:**
- 브랜딩 및 내비게이션
- 시스템 상태 표시
- 실시간 업데이트 인디케이터

### 3. WeatherDashboard 컴포넌트

**파일**: `src/components/weather/WeatherDashboard.jsx`

```typescript
interface WeatherDashboardProps {
  data: WeatherData;
}

const WeatherDashboard: React.FC<WeatherDashboardProps>
```

**주요 기능:**
- 인터랙티브 날씨 대시보드
- 위치별 필터링 기능
- 차트 및 그래프 표시

### 4. WeatherAnalysisCardRefactored 컴포넌트

**파일**: `src/components/analysis/WeatherAnalysisCardRefactored.jsx`

```typescript
interface WeatherAnalysisCardProps {
  location: LocationData;
  animationDelay?: number;
}

const WeatherAnalysisCardRefactored: React.FC<WeatherAnalysisCardProps>
```

**주요 기능:**
- AI 분석 결과 표시
- 애니메이션 효과
- 날씨 상태 시각화

**내부 서브컴포넌트:**
- `WeatherCardHeader` - 카드 헤더
- `WeatherInfoSection` - 날씨 정보
- `AIAnalysisSection` - AI 분석 결과
- `WeatherCardBadges` - 상태 배지

### 5. MapView 컴포넌트

**파일**: `src/components/map/MapView.jsx`

```typescript
interface MapViewProps {
  weatherData: WeatherData;
  webcamData: WebcamData;
}

const MapView: React.FC<MapViewProps>
```

**주요 기능:**
- 인터랙티브 지도 표시
- 날씨 및 웹캠 위치 마커
- Bukit Timah 중심 지도

### 6. TrafficCameraGallery 컴포넌트

**파일**: `src/components/webcam/TrafficCameraGallery.jsx`

```typescript
interface TrafficCameraGalleryProps {}

const TrafficCameraGallery: React.FC<TrafficCameraGalleryProps>
```

**주요 기능:**
- 교통 카메라 이미지 갤러리
- 실시간 자동 새로고침
- 지역별 필터링
- 주요 지점/전체/지역별 보기 모드

**상태 관리:**
```typescript
interface GalleryState {
  cameras: CameraData[];
  filteredCameras: CameraData[];
  loading: boolean;
  error: string | null;
  selectedArea: string;
  viewMode: 'featured' | 'all' | 'area';
  autoRefresh: boolean;
  lastUpdate: Date | null;
}
```

### 7. HealthMonitor 컴포넌트

**파일**: `src/components/system/HealthMonitor.jsx`

```typescript
interface HealthMonitorProps {
  isVisible: boolean;
  onToggle: () => void;
}

const HealthMonitor: React.FC<HealthMonitorProps>
```

**주요 기능:**
- 시스템 건강 상태 모니터링
- API 상태 실시간 추적
- 성능 메트릭 표시

### 8. PWAStatus 컴포넌트

**파일**: `src/components/common/PWAStatus.jsx`

```typescript
interface PWAStatusProps {
  isOnline: boolean;
  isUpdateAvailable: boolean;
  canInstall: boolean;
  onInstall: () => void;
  onUpdate: () => void;
  onRequestNotifications: () => void;
}

const PWAStatus: React.FC<PWAStatusProps>
```

**주요 기능:**
- PWA 설치 가능성 표시
- 업데이트 알림
- 네트워크 상태 표시
- 알림 권한 요청

---

## 🪝 커스텀 훅 API

### 1. useDataLoader

**파일**: `src/hooks/useDataLoader.js`

```typescript
interface UseDataLoaderReturn {
  weatherData: WeatherData | null;
  webcamData: WebcamData | null;
  loading: boolean;
  error: ErrorData | null;
  retryCount: number;
  isInitialLoading: boolean;
  isRefreshing: boolean;
  lastFetch: Date | null;
  refresh: () => void;
  dataFreshness: string | null;
}

const useDataLoader: (refreshInterval?: number) => UseDataLoaderReturn
```

**주요 기능:**
- 자동 데이터 로딩 및 새로고침
- 회로 차단기 패턴 적용
- 지능형 재시도 로직
- 데이터 검증 및 보안 확인

**에러 처리:**
```typescript
interface ErrorData {
  message: string;
  category: 'network' | 'timeout' | 'validation' | 'circuit_breaker' | 'rate_limit' | 'unknown';
  timestamp: string;
  retryable: boolean;
}
```

### 2. useSystemStats

**파일**: `src/hooks/useSystemStats.js`

```typescript
interface UseSystemStatsReturn {
  totalCameras: number;
  activeCameras: number;
  lastUpdate: string;
  systemUptime: string;
  dataFreshness: string;
  connectionStatus: 'online' | 'offline';
}

const useSystemStats: (webcamData?: WebcamData) => UseSystemStatsReturn
```

**주요 기능:**
- 시스템 통계 계산
- 연결 상태 추적
- 업타임 계산

### 3. useServiceWorker

**파일**: `src/hooks/useServiceWorker.js`

```typescript
interface UseServiceWorkerReturn {
  isOnline: boolean;
  isUpdateAvailable: boolean;
  canInstall: boolean;
  installPWA: () => Promise<void>;
  updateServiceWorker: () => void;
  requestNotificationPermission: () => Promise<void>;
}

const useServiceWorker: () => UseServiceWorkerReturn
```

**주요 기능:**
- PWA 설치 관리
- 서비스 워커 업데이트
- 네트워크 상태 감지
- 알림 권한 관리

### 4. useMetrics

**파일**: `src/services/metricsService.js`

```typescript
interface UseMetricsReturn {
  trackPageView: (path: string, metadata?: object) => void;
  trackUserInteraction: (action: string, target: string, metadata?: object) => void;
  trackAPICall: (endpoint: string, method: string, statusCode: number, duration: number, metadata?: object) => void;
  getMetrics: () => MetricsData;
}

const useMetrics: () => UseMetricsReturn
```

**주요 기능:**
- 페이지 뷰 추적
- 사용자 상호작용 추적
- API 호출 메트릭
- 성능 데이터 수집

---

## 🔧 서비스 API

### 1. API Service

**파일**: `src/services/apiService.js`

```typescript
class APIService {
  fetch(url: string, options?: RequestOptions): Promise<any>;
  getHealthStatus(): HealthStatus;
  reset(): void;
}

interface RequestOptions {
  cacheTTL?: number;
  timeout?: number;
  headers?: Record<string, string>;
  method?: string;
}

interface HealthStatus {
  circuitBreakers: Record<string, CircuitBreakerStatus>;
  cache: CacheStats;
  rateLimiter: RateLimiterStats;
  timestamp: string;
}
```

**주요 기능:**
- Circuit Breaker 패턴
- 지능형 캐싱
- Rate Limiting
- 요청 큐잉

### 2. Security Service

**파일**: `src/services/securityService.js`

```typescript
interface SecurityValidator {
  validateWeatherData(data: any): ValidationResult;
  validateCameraData(data: any): ValidationResult;
  validateApiUrl(url: string): ValidationResult;
  checkRateLimit(identifier: string, maxRequests: number, windowSize: number): RateLimitResult;
}

interface ValidationResult {
  isValid: boolean;
  errors?: string[];
  sanitized?: any;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  reset: number;
}
```

**주요 기능:**
- 입력 데이터 검증
- XSS/SQL Injection 방지
- Rate Limiting
- URL 검증

### 3. Health Service

**파일**: `src/services/healthService.js`

```typescript
class HealthService {
  getHealthReport(): HealthReport;
  recordError(error: Error, context?: object): void;
  subscribe(callback: (event: HealthEvent) => void): () => void;
  reset(): void;
}

interface HealthReport {
  systemStatus: 'healthy' | 'degraded' | 'unhealthy';
  uptime: UptimeInfo;
  apis: APIHealthSummary;
  performance: PerformanceSummary;
  errors: ErrorSummary;
  timestamp: string;
}
```

**주요 기능:**
- API 건강성 모니터링
- 성능 메트릭 수집
- 에러 추적
- 시스템 상태 관리

### 4. Traffic Camera Service

**파일**: `src/services/trafficCameraService.js`

```typescript
interface TrafficCameraService {
  fetchTrafficCameras(options?: FetchOptions): Promise<CameraResponse>;
  filterCamerasByArea(cameras: CameraData[], area: string): CameraData[];
  getCameraById(cameras: CameraData[], id: string): CameraData | undefined;
  groupCamerasByArea(cameras: CameraData[]): Record<string, CameraData[]>;
  getFeaturedCameras(cameras: CameraData[]): CameraData[];
}

interface CameraResponse {
  timestamp: string;
  totalCameras: number;
  cameras: CameraData[];
  metadata: ResponseMetadata;
}

interface CameraData {
  id: string;
  name: string;
  area: string;
  location: { latitude: number; longitude: number };
  image: ImageInfo;
  timestamp: string;
  quality: 'HD' | 'HD Ready' | 'Standard' | 'Low' | 'unknown';
  status: 'active' | 'inactive';
}
```

---

## 🛠️ 유틸리티 함수

### 1. Accessibility Utils

**파일**: `src/utils/accessibility.js`

```typescript
interface AccessibilityUtils {
  initializeAccessibility(): { announceUpdate: (message: string) => void };
  announceUpdate(message: string): void;
  manageFocus(element: HTMLElement): void;
  ensureKeyboardNavigation(): void;
}
```

**주요 기능:**
- 스크린 리더 지원
- 키보드 네비게이션
- ARIA 속성 관리
- 포커스 관리

### 2. Security Utils

**파일**: `src/utils/security.js`

```typescript
interface SecurityUtils {
  initializeSecurity(): void;
  sanitizeInput(input: string): string;
  validateURL(url: string): boolean;
  escapeHTML(text: string): string;
  generateCSPNonce(): string;
}
```

**주요 기능:**
- Content Security Policy 설정
- 입력 값 정화
- URL 검증
- HTML 이스케이프

### 3. Weather Utils

**파일**: `src/utils/weatherUtils.jsx`

```typescript
interface WeatherUtils {
  formatTemperature(temp: number): string;
  getWeatherIcon(condition: string): string;
  calculateFeelsLike(temp: number, humidity: number): number;
  getWindDirection(degrees: number): string;
  formatPressure(pressure: number): string;
}
```

**주요 기능:**
- 날씨 데이터 포맷팅
- 날씨 아이콘 매핑
- 체감온도 계산
- 풍향 변환

---

## 📊 타입 정의

### 1. Weather Data Types

```typescript
interface WeatherData {
  timestamp: string;
  source: string;
  data: {
    temperature: TemperatureData;
    humidity: HumidityData;
    rainfall: RainfallData;
    forecast: ForecastData;
  };
  current: CurrentWeatherData;
  locations: LocationData[];
  summary: WeatherSummary;
}

interface LocationData {
  id: string;
  name: string;
  displayName: string;
  description: string;
  coordinates: { lat: number; lng: number };
  temperature: number;
  humidity: number;
  rainfall: number;
  condition: WeatherCondition;
  weather_description: string;
  priority: 'primary' | 'secondary';
  station_id?: string;
}

type WeatherCondition = 'sunny' | 'partly_cloudy' | 'cloudy' | 'rainy' | 'thunderstorm';
```

### 2. Webcam Data Types

```typescript
interface WebcamData {
  timestamp: string;
  total_cameras: number;
  successful_captures: number;
  failed_captures: number;
  captures: CaptureData[];
}

interface CaptureData {
  id: string;
  name: string;
  displayName: string;
  location: string;
  coordinates: { lat: number; lng: number };
  type: 'educational' | 'nature' | 'traffic' | 'urban' | 'residential';
  timestamp: string;
  capture_time: string;
  status: 'success' | 'failed';
  file_info: FileInfo;
  ai_analysis?: AIAnalysis;
  activities?: ActivityConditions;
  analysis?: AnalysisResult;
}
```

### 3. System Data Types

```typescript
interface SystemStatsData {
  totalCameras: number;
  activeCameras: number;
  lastUpdate: string;
  systemUptime: string;
  dataFreshness: string;
  connectionStatus: 'online' | 'offline';
}

interface MetricsData {
  pageViews: PageViewMetric[];
  userInteractions: InteractionMetric[];
  apiCalls: APICallMetric[];
  performance: PerformanceMetric[];
}

interface PerformanceMetric {
  timestamp: string;
  loadTime: number;
  renderTime: number;
  memoryUsage: number;
  domNodes: number;
}
```

### 4. Error Types

```typescript
interface ApplicationError extends Error {
  category: ErrorCategory;
  timestamp: string;
  context?: Record<string, any>;
  retryable: boolean;
}

type ErrorCategory = 'network' | 'timeout' | 'validation' | 'circuit_breaker' | 'rate_limit' | 'unknown';

interface ErrorBoundaryState {
  hasError: boolean;
  error: ApplicationError | null;
  errorInfo: React.ErrorInfo | null;
}
```

---

## 🎓 사용 예제

### 컴포넌트 사용 예제

```jsx
// WeatherAnalysisCard 사용
<WeatherAnalysisCardRefactored
  location={locationData}
  animationDelay={100}
/>

// TrafficCameraGallery 사용
<TrafficCameraGallery />

// PWAStatus 사용
<PWAStatus
  isOnline={isOnline}
  isUpdateAvailable={updateAvailable}
  canInstall={canInstall}
  onInstall={handleInstall}
  onUpdate={handleUpdate}
  onRequestNotifications={requestNotifications}
/>
```

### 훅 사용 예제

```jsx
// useDataLoader 사용
const {
  weatherData,
  webcamData,
  loading,
  error,
  refresh
} = useDataLoader(5 * 60 * 1000); // 5분 간격

// useSystemStats 사용
const systemStats = useSystemStats(webcamData);

// useMetrics 사용
const { trackPageView, trackUserInteraction } = useMetrics();

useEffect(() => {
  trackPageView('/dashboard');
}, []);

const handleButtonClick = () => {
  trackUserInteraction('click', 'refresh-button');
  refresh();
};
```

### 서비스 사용 예제

```javascript
// API Service 사용
const data = await apiService.fetch('/api/weather', {
  cacheTTL: 120000, // 2분 캐시
  timeout: 10000    // 10초 타임아웃
});

// Security Service 사용
const validation = securityValidator.validateWeatherData(rawData);
if (!validation.isValid) {
  throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
}

// Health Service 사용
healthService.recordError(error, {
  component: 'WeatherCard',
  action: 'data-load'
});

const report = healthService.getHealthReport();
```

이 레퍼런스는 Singapore Weather Cam 프로젝트의 모든 컴포넌트, 훅, 서비스에 대한 포괄적인 API 문서입니다. 각 컴포넌트의 props, 훅의 반환값, 서비스의 메서드 등을 상세히 설명하여 개발자가 쉽게 참조하고 활용할 수 있도록 구성했습니다.