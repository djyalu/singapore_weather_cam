# 🏗️ Singapore Weather Cam - 기술 아키텍처 및 구현 가이드

## 📋 목차

1. [시스템 아키텍처 개요](#시스템-아키텍처-개요)
2. [핵심 서비스 계층](#핵심-서비스-계층)
3. [컴포넌트 아키텍처](#컴포넌트-아키텍처)
4. [데이터 플로우](#데이터-플로우)
5. [보안 시스템](#보안-시스템)
6. [성능 최적화](#성능-최적화)
7. [모니터링 및 관찰성](#모니터링-및-관찰성)
8. [구현 패턴](#구현-패턴)

---

## 🎯 시스템 아키텍처 개요

### 전체 시스템 구조

```
┌─────────────────────────────────────────────────────────┐
│                    Presentation Layer                   │
├─────────────────────────────────────────────────────────┤
│ React Components │ Layout │ Analysis │ Maps │ Webcams   │
├─────────────────────────────────────────────────────────┤
│                     Hook Layer                          │
├─────────────────────────────────────────────────────────┤
│ useDataLoader │ useSystemStats │ useServiceWorker       │
├─────────────────────────────────────────────────────────┤
│                    Service Layer                        │
├─────────────────────────────────────────────────────────┤
│ API Service │ Security │ Health │ Traffic │ Metrics     │
├─────────────────────────────────────────────────────────┤
│                   Infrastructure                        │
├─────────────────────────────────────────────────────────┤
│ Circuit Breaker │ Cache │ Rate Limiter │ Monitoring    │
└─────────────────────────────────────────────────────────┘
```

### 설계 원칙

#### 1. **신뢰성 우선 (Reliability First)**
- Circuit Breaker 패턴으로 장애 격리
- 지능형 캐싱으로 가용성 보장
- 자동 재시도 및 Graceful Degradation

#### 2. **보안 내장 (Security by Design)**
- 입력 데이터 검증 및 Sanitization
- Rate Limiting으로 남용 방지
- Content Security Policy 적용

#### 3. **성능 최적화 (Performance-Optimized)**
- React.lazy를 통한 Code Splitting
- 메모이제이션 및 최적화된 리렌더링
- 지능형 캐싱 전략

#### 4. **관찰성 (Observability)**
- 실시간 헬스 모니터링
- 성능 메트릭 수집
- 에러 추적 및 로깅

---

## ⚙️ 핵심 서비스 계층

### 1. API Service (`src/services/apiService.js`)

**핵심 기능:**
- Circuit Breaker 패턴 구현
- 지능형 캐싱 시스템
- Rate Limiting
- 요청 큐잉 및 병렬 처리 제한

**Circuit Breaker 구조:**
```javascript
class CircuitBreaker {
  constructor(options) {
    this.state = 'CLOSED';    // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.failureThreshold = options.failureThreshold || 5;
    this.timeout = options.timeout || 60000;
  }
}
```

**상태 전이:**
- `CLOSED` → `OPEN`: 실패 임계값 초과시
- `OPEN` → `HALF_OPEN`: 타임아웃 후 복구 시도
- `HALF_OPEN` → `CLOSED`: 성공시 정상 복구

**Cache 전략:**
```javascript
class CacheService {
  constructor() {
    this.cache = new Map();
    this.ttl = new Map();
    this.maxSize = 100;
    this.stats = { hits: 0, misses: 0 };
  }
}
```

### 2. Security Service (`src/services/securityService.js`)

**보안 계층:**
- **Input Validation**: XSS, SQL Injection 방지
- **Data Sanitization**: 출력 데이터 정화
- **Rate Limiting**: API 남용 방지
- **URL Validation**: 외부 URL 검증

**검증 체계:**
```javascript
const securityValidator = {
  validateWeatherData(data) {
    // 날씨 데이터 구조 검증
    // 수치 범위 확인 (온도, 습도, 강수량)
    // 타임스탬프 유효성 검사
  },
  
  validateCameraData(data) {
    // 카메라 데이터 검증
    // 좌표 범위 확인
    // 이미지 URL 검증
  }
};
```

### 3. Health Service (`src/services/healthService.js`)

**모니터링 영역:**
- **API Health**: 외부 API 상태 추적
- **Performance**: 메모리, DOM, 캐시 성능
- **Error Tracking**: 에러 패턴 분석
- **System Status**: 전체 시스템 상태

**헬스 체크 흐름:**
```javascript
class HealthService {
  checkAPIHealth() {
    // NEA Weather API 상태 확인
    // LTA Traffic API 상태 확인
    // 응답 시간 측정
    // 가용성 계산
  }
  
  checkPerformanceMetrics() {
    // 메모리 사용량 모니터링
    // DOM 노드 수 추적
    // 캐시 성능 분석
  }
}
```

### 4. Traffic Camera Service (`src/services/trafficCameraService.js`)

**데이터 처리 파이프라인:**
1. **API 호출**: data.gov.sg Traffic Images API
2. **데이터 검증**: 카메라 데이터 구조 확인
3. **보안 검증**: 악성 데이터 필터링
4. **위치 매핑**: 카메라 ID → 위치 정보 변환
5. **품질 분석**: 이미지 해상도 기반 품질 결정

**카메라 데이터 구조:**
```javascript
{
  id: "1701",
  name: "Woodlands Causeway",
  area: "Causeway",
  location: { latitude: 1.447, longitude: 103.772 },
  image: {
    url: "https://images.data.gov.sg/...",
    width: 640,
    height: 480,
    quality: "Standard"
  },
  status: "active"
}
```

---

## 🧩 컴포넌트 아키텍처

### 계층 구조

```
App.jsx (Root)
├── Layout Components
│   ├── Header.jsx - 시스템 상태 표시
│   ├── SystemStats.jsx - 실시간 통계
│   └── SystemFooter.jsx - 시스템 정보
├── Dashboard Components  
│   └── SystemStats.jsx - 대시보드 메트릭
├── Analysis Components
│   ├── WeatherAnalysisCardRefactored.jsx - 날씨 분석
│   ├── AIAnalysisSection.jsx - AI 분석 결과
│   └── WeatherCardBadges.jsx - 상태 배지
├── Map Components
│   └── MapView.jsx - 인터랙티브 지도
├── Webcam Components
│   ├── WebcamGallery.jsx - 웹캠 갤러리
│   ├── TrafficCameraGallery.jsx - 교통 카메라
│   └── ExternalWebcamLinks.jsx - 외부 링크
├── Common Components
│   ├── LoadingScreen.jsx - 로딩 화면
│   ├── ErrorBoundary.jsx - 에러 처리
│   └── PWAStatus.jsx - PWA 상태
└── System Components
    └── HealthMonitor.jsx - 시스템 모니터링
```

### 주요 컴포넌트 상세

#### 1. **App.jsx** - 루트 컴포넌트
```javascript
const App = React.memo(() => {
  // 커스텀 훅으로 관심사 분리
  const { weatherData, webcamData, error, refresh } = useDataLoader();
  const systemStats = useSystemStats(webcamData);
  const { isOnline, canInstall } = useServiceWorker();
  
  // 초기화 효과
  React.useEffect(() => {
    initializeAccessibility();
    initializeSecurity();
  }, []);
});
```

#### 2. **WeatherAnalysisCardRefactored.jsx** - 날씨 분석 카드
```javascript
const WeatherAnalysisCardRefactored = React.memo(({ location, animationDelay }) => {
  // 메모이제이션으로 성능 최적화
  const analysisData = React.useMemo(() => {
    return processWeatherAnalysis(location);
  }, [location]);
  
  // 애니메이션 지연 적용
  const cardStyle = {
    animationDelay: `${animationDelay}ms`
  };
});
```

#### 3. **TrafficCameraGallery.jsx** - 교통 카메라 갤러리
```javascript
const TrafficCameraGallery = () => {
  // 상태 관리
  const [cameras, setCameras] = useState([]);
  const [filteredCameras, setFilteredCameras] = useState([]);
  const [viewMode, setViewMode] = useState('featured');
  
  // 데이터 페칭
  useEffect(() => {
    fetchCameras();
    const interval = setInterval(fetchCameras, 60000);
    return () => clearInterval(interval);
  }, []);
};
```

---

## 🔄 데이터 플로우

### 1. 데이터 로딩 흐름

```
User Request
    ↓
useDataLoader Hook
    ↓
API Service (Circuit Breaker)
    ↓
Cache Check → Cache Hit ✓ → Return Cached Data
    ↓ Cache Miss
External API Call
    ↓
Security Validation
    ↓
Data Sanitization
    ↓
Cache Update
    ↓
Component State Update
    ↓
UI Render
```

### 2. 에러 처리 흐름

```
API Error
    ↓
Circuit Breaker Check
    ↓
Error Categorization
    ├── network → Retry with Backoff
    ├── timeout → Increase Timeout
    ├── validation → Log & Fallback
    └── rate_limit → Wait & Retry
    ↓
Health Service Notification
    ↓
User Notification (if needed)
```

### 3. 실시간 업데이트 흐름

```
Timer Trigger (5분 간격)
    ↓
Background Data Fetch
    ↓
Data Comparison
    ↓
Changed Data Detection
    ↓
State Update (only if changed)
    ↓
Component Re-render (optimized)
    ↓
Health Metrics Update
```

---

## 🛡️ 보안 시스템

### 다층 보안 구조

#### 1. **입력 계층 보안**
```javascript
const validateInput = (data) => {
  // XSS 방지
  if (containsScript(data)) return false;
  
  // SQL Injection 방지  
  if (containsSQLKeywords(data)) return false;
  
  // 데이터 타입 검증
  if (!isValidDataType(data)) return false;
  
  return true;
};
```

#### 2. **API 계층 보안**
```javascript
const securityMiddleware = {
  validateApiUrl(url) {
    // 허용된 도메인 확인
    const allowedDomains = ['api.data.gov.sg', 'images.data.gov.sg'];
    return allowedDomains.some(domain => url.includes(domain));
  },
  
  checkRateLimit(identifier, maxRequests, windowSize) {
    // 요청 빈도 제한
    return rateLimiter.isAllowed(identifier);
  }
};
```

#### 3. **출력 계층 보안**
```javascript
const sanitizeOutput = (data) => {
  // HTML 태그 이스케이프
  if (typeof data === 'string') {
    return data.replace(/[<>]/g, '');
  }
  
  // 객체 재귀 정화
  if (typeof data === 'object') {
    return Object.keys(data).reduce((clean, key) => {
      clean[key] = sanitizeOutput(data[key]);
      return clean;
    }, {});
  }
  
  return data;
};
```

---

## ⚡ 성능 최적화

### 1. React 최적화 패턴

#### **Code Splitting**
```javascript
// Lazy Loading으로 초기 번들 크기 감소
const WeatherAnalysisCardRefactored = React.lazy(() => 
  import('./components/analysis/WeatherAnalysisCardRefactored')
);

// Suspense로 로딩 상태 처리
<Suspense fallback={<LoadingScreen />}>
  <WeatherAnalysisCardRefactored />
</Suspense>
```

#### **Memoization**
```javascript
// React.memo로 불필요한 리렌더링 방지
const WeatherCard = React.memo(({ data }) => {
  // useMemo로 비싼 계산 캐싱
  const processedData = React.useMemo(() => {
    return processWeatherData(data);
  }, [data]);
  
  // useCallback으로 함수 참조 안정화
  const handleRefresh = React.useCallback(() => {
    refreshData();
  }, [refreshData]);
});
```

### 2. 네트워크 최적화

#### **Intelligent Caching**
```javascript
const cacheStrategy = {
  weather: { ttl: 2 * 60 * 1000 },    // 2분 캐시
  webcam: { ttl: 60 * 1000 },        // 1분 캐시  
  traffic: { ttl: 60 * 1000 }        // 1분 캐시
};
```

#### **Request Batching**
```javascript
// 병렬 요청으로 로딩 시간 단축
const [weatherData, webcamData] = await Promise.all([
  apiService.fetch('/weather/latest.json'),
  apiService.fetch('/webcam/latest.json')
]);
```

### 3. 렌더링 최적화

#### **Virtual Scrolling** (대용량 리스트)
```javascript
// 큰 카메라 리스트의 경우 가상 스크롤링 고려
const VirtualizedCameraList = ({ cameras }) => {
  const [visibleRange, setVisibleRange] = useState([0, 20]);
  
  return (
    <div onScroll={handleScroll}>
      {cameras.slice(...visibleRange).map(camera => 
        <CameraCard key={camera.id} camera={camera} />
      )}
    </div>
  );
};
```

---

## 📊 모니터링 및 관찰성

### 1. 헬스 모니터링 시스템

#### **API 건강성 추적**
```javascript
const apiHealthMetrics = {
  'NEA Weather API': {
    status: 'healthy',
    availability: '99.2%',
    avgResponseTime: 250,
    lastCheck: '2025-07-26T13:30:00Z'
  },
  'LTA Traffic API': {
    status: 'degraded', 
    availability: '95.8%',
    avgResponseTime: 1200,
    lastCheck: '2025-07-26T13:30:00Z'
  }
};
```

#### **성능 메트릭 수집**
```javascript
const performanceMetrics = {
  memory: {
    used: 45123456,      // bytes
    total: 67108864,     // bytes  
    percentage: '67.2%'
  },
  domNodes: 1247,
  eventListeners: 89,
  cacheHitRate: '87.3%'
};
```

### 2. 에러 추적 시스템

#### **에러 분류 및 대응**
```javascript
const errorCategories = {
  network: {
    severity: 'medium',
    retryable: true,
    action: 'exponential_backoff'
  },
  timeout: {
    severity: 'medium', 
    retryable: true,
    action: 'increase_timeout'
  },
  validation: {
    severity: 'high',
    retryable: false,
    action: 'log_and_fallback'
  },
  circuit_breaker: {
    severity: 'high',
    retryable: true,
    action: 'wait_for_recovery'
  }
};
```

### 3. 실시간 대시보드

#### **시스템 상태 표시**
```javascript
const SystemStatus = ({ healthData }) => {
  const statusColor = {
    healthy: 'green',
    degraded: 'yellow', 
    unhealthy: 'red'
  };
  
  return (
    <div className={`status-${healthData.systemStatus}`}>
      <StatusIndicator color={statusColor[healthData.systemStatus]} />
      <MetricsDisplay metrics={healthData.metrics} />
    </div>
  );
};
```

---

## 🔧 구현 패턴

### 1. Custom Hooks 패턴

#### **데이터 로딩 훅**
```javascript
export const useDataLoader = (refreshInterval = 5 * 60 * 1000) => {
  // 상태 관리
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // 데이터 로딩 로직
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const data = await apiService.fetch('/api/data');
      setWeatherData(data);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // 자동 새로고침
  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, refreshInterval);
    return () => clearInterval(interval);
  }, [loadData, refreshInterval]);
  
  return { weatherData, loading, error, refresh: loadData };
};
```

### 2. Error Boundary 패턴

```javascript
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  
  componentDidCatch(error, errorInfo) {
    // 에러 로깅
    healthService.recordError(error, {
      component: this.constructor.name,
      errorInfo
    });
  }
  
  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    
    return this.props.children;
  }
}
```

### 3. Service Worker 패턴

```javascript
export const useServiceWorker = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [canInstall, setCanInstall] = useState(false);
  
  useEffect(() => {
    // PWA 설치 가능성 감지
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setCanInstall(true);
    };
    
    // 네트워크 상태 감지
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  return { isOnline, canInstall };
};
```

### 4. Accessibility 패턴

```javascript
export const initializeAccessibility = () => {
  // 스크린 리더를 위한 실시간 업데이트 알림
  const announcer = document.createElement('div');
  announcer.setAttribute('aria-live', 'polite');
  announcer.setAttribute('aria-atomic', 'true');
  announcer.className = 'sr-only';
  document.body.appendChild(announcer);
  
  // 동적 콘텐츠 업데이트 알림
  const announceUpdate = (message) => {
    announcer.textContent = message;
    setTimeout(() => {
      announcer.textContent = '';
    }, 1000);
  };
  
  // 키보드 네비게이션 개선
  const handleKeyboardNavigation = (e) => {
    if (e.key === 'Tab') {
      document.body.classList.add('keyboard-navigation');
    }
  };
  
  document.addEventListener('keydown', handleKeyboardNavigation);
  
  return { announceUpdate };
};
```

---

## 🎓 학습 포인트

### 1. 아키텍처 설계 원칙
- **관심사 분리**: 각 계층이 명확한 책임을 가짐
- **의존성 역전**: 고수준 모듈이 저수준 모듈에 의존하지 않음
- **단일 책임**: 각 클래스/함수가 하나의 역할만 수행

### 2. React 베스트 프랙티스
- **Custom Hooks**: 로직 재사용과 관심사 분리
- **Memoization**: 성능 최적화를 위한 적절한 메모이제이션
- **Error Boundaries**: 안정적인 에러 처리

### 3. 보안 고려사항
- **Defense in Depth**: 다층 보안 구조
- **Input Validation**: 모든 입력에 대한 검증
- **Rate Limiting**: API 남용 방지

### 4. 성능 최적화 기법
- **Code Splitting**: 필요한 시점에 로드
- **Intelligent Caching**: 적절한 캐시 전략
- **Request Optimization**: 병렬 처리 및 배치

이 가이드는 Singapore Weather Cam 프로젝트의 기술적 구현을 이해하고, 유사한 시스템을 구축할 때 참고할 수 있는 포괄적인 자료입니다. 각 패턴과 구현 방식은 실제 프로덕션 환경에서 검증된 베스트 프랙티스를 기반으로 작성되었습니다.