# 🛡️ Singapore Weather Cam - 보안 & 성능 최적화 가이드

## 📋 목차

1. [보안 시스템 아키텍처](#보안-시스템-아키텍처)
2. [보안 구현 패턴](#보안-구현-패턴)
3. [성능 최적화 전략](#성능-최적화-전략)
4. [모니터링 및 관찰성](#모니터링-및-관찰성)
5. [실전 구현 가이드](#실전-구현-가이드)
6. [보안 체크리스트](#보안-체크리스트)

---

## 🛡️ 보안 시스템 아키텍처

### 다층 보안 모델 (Defense in Depth)

```
┌─────────────────────────────────────────────────────────┐
│                    Client Layer                         │
├─────────────────────────────────────────────────────────┤
│ CSP Headers │ Input Validation │ XSS Protection        │
├─────────────────────────────────────────────────────────┤
│                  Application Layer                      │
├─────────────────────────────────────────────────────────┤
│ Rate Limiting │ Data Sanitization │ Error Handling     │
├─────────────────────────────────────────────────────────┤
│                    Service Layer                        │
├─────────────────────────────────────────────────────────┤
│ Circuit Breaker │ API Validation │ Security Headers    │
├─────────────────────────────────────────────────────────┤
│                 Infrastructure Layer                    │
├─────────────────────────────────────────────────────────┤
│ HTTPS │ CORS │ Secure Headers │ Content Filtering      │
└─────────────────────────────────────────────────────────┘
```

### 보안 서비스 계층

#### 1. **Security Service** (`src/services/securityService.js`)

```javascript
/**
 * 중앙집중식 보안 검증 시스템
 * 모든 입력 데이터와 API 응답의 보안 검증을 담당
 */
export const securityValidator = {
  /**
   * 날씨 데이터 보안 검증
   */
  validateWeatherData(data) {
    const errors = [];
    const sanitized = {};

    // 1. 기본 구조 검증
    if (!data || typeof data !== 'object') {
      return { isValid: false, errors: ['Invalid data structure'] };
    }

    // 2. 타임스탬프 검증 (시간 조작 공격 방지)
    if (!this.validateTimestamp(data.timestamp)) {
      errors.push('Invalid or suspicious timestamp');
    }

    // 3. 수치 데이터 범위 검증 (논리적 공격 방지)
    if (data.current) {
      const temp = data.current.temperature;
      if (temp && (temp < -50 || temp > 60)) {
        errors.push('Temperature out of realistic range');
      }

      const humidity = data.current.humidity;
      if (humidity && (humidity < 0 || humidity > 100)) {
        errors.push('Humidity out of valid range');
      }

      const rainfall = data.current.rainfall;
      if (rainfall && (rainfall < 0 || rainfall > 1000)) {
        errors.push('Rainfall out of realistic range');
      }
    }

    // 4. 위치 데이터 검증 (지리적 범위 확인)
    if (data.locations && Array.isArray(data.locations)) {
      data.locations.forEach(location => {
        if (!this.validateSingaporeCoordinates(location.coordinates)) {
          errors.push(`Invalid coordinates for location ${location.name}`);
        }
      });
    }

    // 5. 문자열 데이터 정화 (XSS 방지)
    sanitized.data = this.sanitizeObject(data);

    return {
      isValid: errors.length === 0,
      errors,
      sanitized: errors.length === 0 ? sanitized.data : null
    };
  },

  /**
   * 카메라 데이터 보안 검증
   */
  validateCameraData(data) {
    const errors = [];

    // 1. 기본 구조 검증
    if (!data || typeof data !== 'object') {
      return { isValid: false, errors: ['Invalid camera data structure'] };
    }

    // 2. 이미지 URL 검증 (악성 URL 방지)
    if (data.image && data.image.url) {
      if (!this.validateImageUrl(data.image.url)) {
        errors.push('Invalid or potentially malicious image URL');
      }
    }

    // 3. 좌표 검증 (지리적 범위 확인)
    if (data.location) {
      if (!this.validateSingaporeCoordinates(data.location)) {
        errors.push('Coordinates outside Singapore boundaries');
      }
    }

    // 4. 문자열 필드 정화
    const sanitized = this.sanitizeObject(data);

    return {
      isValid: errors.length === 0,
      errors,
      sanitized: errors.length === 0 ? sanitized : null
    };
  },

  /**
   * API URL 검증 (외부 요청 보안)
   */
  validateApiUrl(url) {
    try {
      const urlObj = new URL(url);
      
      // 허용된 도메인만 접근 가능
      const allowedDomains = [
        'api.data.gov.sg',
        'images.data.gov.sg',
        'localhost' // 개발 환경용
      ];

      const isAllowed = allowedDomains.some(domain => 
        urlObj.hostname === domain || 
        urlObj.hostname.endsWith('.' + domain)
      );

      if (!isAllowed) {
        return { isValid: false, error: `Domain ${urlObj.hostname} not allowed` };
      }

      // HTTPS 강제 (프로덕션 환경)
      if (process.env.NODE_ENV === 'production' && urlObj.protocol !== 'https:') {
        return { isValid: false, error: 'HTTPS required in production' };
      }

      return { isValid: true };
    } catch (error) {
      return { isValid: false, error: 'Invalid URL format' };
    }
  },

  /**
   * Rate Limiting 검증
   */
  checkRateLimit(identifier, maxRequests, windowSize) {
    const now = Date.now();
    const windowStart = now - windowSize;

    if (!this.rateLimitStore) {
      this.rateLimitStore = new Map();
    }

    if (!this.rateLimitStore.has(identifier)) {
      this.rateLimitStore.set(identifier, []);
    }

    const requests = this.rateLimitStore.get(identifier);
    
    // 윈도우 밖의 요청 제거
    const validRequests = requests.filter(time => time > windowStart);
    this.rateLimitStore.set(identifier, validRequests);

    if (validRequests.length >= maxRequests) {
      const oldestRequest = Math.min(...validRequests);
      const resetTime = Math.ceil((oldestRequest + windowSize - now) / 1000);
      
      return {
        allowed: false,
        remaining: 0,
        reset: resetTime
      };
    }

    // 새 요청 기록
    validRequests.push(now);
    this.rateLimitStore.set(identifier, validRequests);

    return {
      allowed: true,
      remaining: maxRequests - validRequests.length,
      reset: Math.ceil(windowSize / 1000)
    };
  }
};
```

#### 2. **보안 유틸리티 함수**

```javascript
/**
 * 보안 관련 유틸리티 함수들
 */
const SecurityUtils = {
  /**
   * XSS 방지를 위한 HTML 이스케이프
   */
  escapeHTML(text) {
    if (typeof text !== 'string') return text;
    
    const escapeMap = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;',
      '/': '&#x2F;'
    };
    
    return text.replace(/[&<>"'\/]/g, char => escapeMap[char]);
  },

  /**
   * 객체 재귀 정화
   */
  sanitizeObject(obj) {
    if (obj === null || obj === undefined) return obj;
    
    if (typeof obj === 'string') {
      return this.escapeHTML(obj);
    }
    
    if (Array.isArray(obj)) {
      return obj.map(item => this.sanitizeObject(item));
    }
    
    if (typeof obj === 'object') {
      const sanitized = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = this.sanitizeObject(value);
      }
      return sanitized;
    }
    
    return obj;
  },

  /**
   * SQL Injection 패턴 감지
   */
  containsSQLInjection(input) {
    if (typeof input !== 'string') return false;
    
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION|SCRIPT)\b)/i,
      /(\b(OR|AND)\b.*[=<>].*(\b(OR|AND)\b|$))/i,
      /(--|\/\*|\*\/|;)/,
      /(\b(NULL|TRUE|FALSE)\b.*[=<>])/i
    ];
    
    return sqlPatterns.some(pattern => pattern.test(input));
  },

  /**
   * 싱가포르 좌표 범위 검증
   */
  validateSingaporeCoordinates(coords) {
    if (!coords || typeof coords !== 'object') return false;
    
    const { lat, lng, latitude, longitude } = coords;
    const latitude_val = lat || latitude;
    const longitude_val = lng || longitude;
    
    // 싱가포르 대략적 경계
    const SINGAPORE_BOUNDS = {
      minLat: 1.1496,
      maxLat: 1.4784,
      minLng: 103.5942,
      maxLng: 104.1133
    };
    
    return latitude_val >= SINGAPORE_BOUNDS.minLat &&
           latitude_val <= SINGAPORE_BOUNDS.maxLat &&
           longitude_val >= SINGAPORE_BOUNDS.minLng &&
           longitude_val <= SINGAPORE_BOUNDS.maxLng;
  },

  /**
   * 타임스탬프 유효성 검증
   */
  validateTimestamp(timestamp) {
    if (!timestamp) return false;
    
    const date = new Date(timestamp);
    const now = new Date();
    
    // 과거 24시간 ~ 미래 1시간 범위 내
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    
    return date >= oneDayAgo && date <= oneHourLater;
  },

  /**
   * 이미지 URL 보안 검증
   */
  validateImageUrl(url) {
    try {
      const urlObj = new URL(url);
      
      // 허용된 이미지 도메인
      const allowedImageDomains = [
        'images.data.gov.sg',
        'images.unsplash.com',
        'res.cloudinary.com'
      ];
      
      const isDomainAllowed = allowedImageDomains.some(domain =>
        urlObj.hostname === domain || urlObj.hostname.endsWith('.' + domain)
      );
      
      if (!isDomainAllowed) return false;
      
      // 이미지 확장자 검증
      const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
      const hasValidExtension = allowedExtensions.some(ext =>
        urlObj.pathname.toLowerCase().endsWith(ext)
      );
      
      return hasValidExtension;
    } catch (error) {
      return false;
    }
  }
};
```

---

## ⚡ 성능 최적화 전략

### 1. React 성능 최적화

#### **컴포넌트 최적화 패턴**

```javascript
/**
 * 최적화된 날씨 분석 카드 컴포넌트
 */
const WeatherAnalysisCardRefactored = React.memo(({ location, animationDelay }) => {
  // 무거운 계산을 메모이제이션
  const analysisData = React.useMemo(() => {
    return {
      weatherScore: calculateWeatherScore(location),
      activitySuitability: calculateActivitySuitability(location),
      riskFactors: identifyRiskFactors(location)
    };
  }, [location.temperature, location.humidity, location.rainfall, location.condition]);

  // 이벤트 핸들러 최적화
  const handleCardClick = React.useCallback((e) => {
    e.preventDefault();
    // 메트릭 추적
    trackUserInteraction('card_click', location.id);
    
    // 상세 정보 표시 로직
    showLocationDetails(location.id);
  }, [location.id]);

  // 애니메이션 스타일 메모이제이션
  const cardStyle = React.useMemo(() => ({
    animationDelay: `${animationDelay}ms`,
    '--priority-color': location.priority === 'primary' ? '#3B82F6' : '#6B7280'
  }), [animationDelay, location.priority]);

  return (
    <div 
      className="weather-analysis-card"
      style={cardStyle}
      onClick={handleCardClick}
      role="button"
      tabIndex={0}
      aria-label={`Weather analysis for ${location.displayName}`}
    >
      <WeatherCardHeader location={location} />
      <WeatherInfoSection data={analysisData} />
      <AIAnalysisSection analysis={location.ai_analysis} />
      <WeatherCardBadges 
        condition={location.condition}
        activities={analysisData.activitySuitability}
      />
    </div>
  );
}, (prevProps, nextProps) => {
  // 커스텀 비교 함수로 불필요한 리렌더링 방지
  return (
    prevProps.location.id === nextProps.location.id &&
    prevProps.location.temperature === nextProps.location.temperature &&
    prevProps.location.humidity === nextProps.location.humidity &&
    prevProps.location.rainfall === nextProps.location.rainfall &&
    prevProps.location.condition === nextProps.location.condition &&
    prevProps.animationDelay === nextProps.animationDelay
  );
});
```

#### **Lazy Loading 및 Code Splitting**

```javascript
/**
 * 지능형 코드 스플리팅
 */
// 높은 우선순위 컴포넌트 (즉시 로드)
const WeatherAnalysisCardRefactored = React.lazy(() => 
  import('./components/analysis/WeatherAnalysisCardRefactored')
);

// 중간 우선순위 컴포넌트 (뷰포트 진입 시 로드)
const MapView = React.lazy(() => 
  import('./components/map/MapView')
);

// 낮은 우선순위 컴포넌트 (사용자 액션 시 로드)
const MonitoringDashboard = React.lazy(() => 
  import('./components/admin/MonitoringDashboard')
);

/**
 * 인터랙션 기반 프리로딩
 */
const preloadComponents = {
  map: () => import('./components/map/MapView'),
  monitoring: () => import('./components/admin/MonitoringDashboard'),
  weather: () => import('./components/weather/WeatherDashboard')
};

// 마우스 호버 시 프리로드
const handleMouseEnter = (componentName) => {
  if (preloadComponents[componentName]) {
    preloadComponents[componentName]();
  }
};
```

### 2. 네트워크 최적화

#### **지능형 캐싱 전략**

```javascript
/**
 * 다층 캐싱 시스템
 */
class IntelligentCacheService {
  constructor() {
    this.memoryCache = new Map();        // L1: 메모리 캐시
    this.browserCache = localStorage;     // L2: 브라우저 저장소
    this.serviceWorkerCache = 'v1';      // L3: 서비스 워커 캐시
    
    this.cacheStrategies = {
      weather: {
        ttl: 2 * 60 * 1000,              // 2분
        strategy: 'cache-first',
        priority: 'high'
      },
      webcam: {
        ttl: 60 * 1000,                  // 1분
        strategy: 'network-first',
        priority: 'medium'
      },
      traffic: {
        ttl: 30 * 1000,                  // 30초
        strategy: 'stale-while-revalidate',
        priority: 'medium'
      },
      static: {
        ttl: 24 * 60 * 60 * 1000,       // 24시간
        strategy: 'cache-first',
        priority: 'low'
      }
    };
  }

  async get(key, dataType = 'default') {
    const strategy = this.cacheStrategies[dataType] || this.cacheStrategies.default;
    
    // L1: 메모리 캐시 확인
    const memoryResult = this.getFromMemory(key);
    if (memoryResult && !this.isExpired(memoryResult, strategy.ttl)) {
      return memoryResult.data;
    }

    // L2: 브라우저 저장소 확인
    const browserResult = this.getFromBrowser(key);
    if (browserResult && !this.isExpired(browserResult, strategy.ttl)) {
      // 메모리 캐시에 복사
      this.setInMemory(key, browserResult.data);
      return browserResult.data;
    }

    // L3: 서비스 워커 캐시 확인
    if (typeof window !== 'undefined' && 'caches' in window) {
      const swResult = await this.getFromServiceWorker(key);
      if (swResult) {
        this.setInMemory(key, swResult);
        this.setInBrowser(key, swResult);
        return swResult;
      }
    }

    return null;
  }

  async set(key, data, dataType = 'default') {
    const strategy = this.cacheStrategies[dataType] || this.cacheStrategies.default;
    
    // L1: 메모리 캐시 저장
    this.setInMemory(key, data);
    
    // L2: 브라우저 저장소 저장 (중요한 데이터만)
    if (strategy.priority === 'high' || strategy.priority === 'medium') {
      this.setInBrowser(key, data);
    }
    
    // L3: 서비스 워커 캐시 저장
    if (typeof window !== 'undefined' && 'caches' in window) {
      await this.setInServiceWorker(key, data);
    }
  }
}
```

#### **Request Optimization**

```javascript
/**
 * 요청 최적화 및 배치 처리
 */
class RequestOptimizer {
  constructor() {
    this.requestBatch = new Map();
    this.batchTimeout = 50; // 50ms 배치 윈도우
    this.maxBatchSize = 5;
  }

  async batchRequest(requests) {
    // 요청을 도메인별로 그룹화
    const grouped = this.groupByDomain(requests);
    
    // 각 도메인별로 병렬 처리
    const results = await Promise.allSettled(
      Object.entries(grouped).map(([domain, domainRequests]) =>
        this.executeDomainBatch(domain, domainRequests)
      )
    );

    return this.mergeResults(results);
  }

  groupByDomain(requests) {
    return requests.reduce((groups, request) => {
      const domain = new URL(request.url).hostname;
      if (!groups[domain]) groups[domain] = [];
      groups[domain].push(request);
      return groups;
    }, {});
  }

  async executeDomainBatch(domain, requests) {
    // 도메인별 동시 연결 제한 적용
    const connectionLimit = this.getConnectionLimit(domain);
    const chunks = this.chunkArray(requests, connectionLimit);
    
    const results = [];
    for (const chunk of chunks) {
      const chunkResults = await Promise.allSettled(
        chunk.map(request => this.executeRequest(request))
      );
      results.push(...chunkResults);
    }
    
    return results;
  }

  getConnectionLimit(domain) {
    // 도메인별 최적화된 연결 제한
    const limits = {
      'api.data.gov.sg': 3,     // 정부 API는 보수적으로
      'images.data.gov.sg': 6,  // 이미지는 더 많은 연결 허용
      'localhost': 10           // 개발 환경은 제한 없음
    };
    
    return limits[domain] || 4; // 기본값
  }
}
```

### 3. 렌더링 최적화

#### **Virtual Scrolling for Large Lists**

```javascript
/**
 * 대용량 카메라 리스트를 위한 가상 스크롤링
 */
const VirtualizedCameraList = ({ cameras, itemHeight = 200 }) => {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerHeight, setContainerHeight] = useState(600);
  const containerRef = useRef();

  // 표시할 항목 범위 계산
  const visibleRange = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      cameras.length
    );
    
    return { startIndex, endIndex };
  }, [scrollTop, containerHeight, itemHeight, cameras.length]);

  // 스크롤 이벤트 처리 (쓰로틀링 적용)
  const handleScroll = useCallback(
    throttle((e) => {
      setScrollTop(e.target.scrollTop);
    }, 16), // 60fps
    []
  );

  // 컨테이너 크기 감지
  useEffect(() => {
    const observer = new ResizeObserver(entries => {
      if (entries[0]) {
        setContainerHeight(entries[0].contentRect.height);
      }
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const visibleCameras = cameras.slice(
    visibleRange.startIndex,
    visibleRange.endIndex
  );

  return (
    <div
      ref={containerRef}
      className="virtual-scroll-container"
      style={{ height: containerHeight, overflow: 'auto' }}
      onScroll={handleScroll}
    >
      {/* 전체 높이를 위한 스페이서 */}
      <div style={{ height: cameras.length * itemHeight, position: 'relative' }}>
        {/* 보이는 항목들만 렌더링 */}
        <div
          style={{
            transform: `translateY(${visibleRange.startIndex * itemHeight}px)`,
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0
          }}
        >
          {visibleCameras.map((camera, index) => (
            <CameraCard
              key={camera.id}
              camera={camera}
              style={{ height: itemHeight }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
```

---

## 📊 모니터링 및 관찰성

### 1. 성능 모니터링

#### **Core Web Vitals 추적**

```javascript
/**
 * 웹 성능 지표 모니터링
 */
class PerformanceMonitor {
  constructor() {
    this.metrics = new Map();
    this.observers = [];
    this.thresholds = {
      LCP: 2500,    // Largest Contentful Paint
      FID: 100,     // First Input Delay  
      CLS: 0.1,     // Cumulative Layout Shift
      TTFB: 800     // Time to First Byte
    };
  }

  initialize() {
    this.observeLCP();
    this.observeFID();
    this.observeCLS();
    this.observeTTFB();
    this.observeCustomMetrics();
  }

  observeLCP() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        
        this.recordMetric('LCP', lastEntry.startTime);
        
        if (lastEntry.startTime > this.thresholds.LCP) {
          this.reportPerformanceIssue('LCP', lastEntry.startTime);
        }
      });
      
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
      this.observers.push(observer);
    }
  }

  observeFID() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          this.recordMetric('FID', entry.processingStart - entry.startTime);
          
          if (entry.processingStart - entry.startTime > this.thresholds.FID) {
            this.reportPerformanceIssue('FID', entry.processingStart - entry.startTime);
          }
        });
      });
      
      observer.observe({ entryTypes: ['first-input'] });
      this.observers.push(observer);
    }
  }

  observeCustomMetrics() {
    // 커스텀 메트릭 관찰
    this.observeComponentLoadTime();
    this.observeAPIResponseTime();
    this.observeMemoryUsage();
  }

  observeComponentLoadTime() {
    // React 컴포넌트 로딩 시간 측정
    const originalRender = React.createElement;
    const self = this;
    
    React.createElement = function(type, props, ...children) {
      if (typeof type === 'function' && type.name) {
        const startTime = performance.now();
        const result = originalRender.apply(this, arguments);
        const endTime = performance.now();
        
        self.recordMetric(`component-${type.name}`, endTime - startTime);
        
        return result;
      }
      
      return originalRender.apply(this, arguments);
    };
  }

  observeAPIResponseTime() {
    // API 응답 시간 모니터링
    const originalFetch = window.fetch;
    const self = this;
    
    window.fetch = function(...args) {
      const startTime = performance.now();
      
      return originalFetch.apply(this, args)
        .then(response => {
          const endTime = performance.now();
          const duration = endTime - startTime;
          
          self.recordMetric(`api-${new URL(args[0]).pathname}`, duration);
          
          if (duration > 5000) {
            self.reportPerformanceIssue('slow-api', duration, args[0]);
          }
          
          return response;
        });
    };
  }

  reportPerformanceIssue(metric, value, context = {}) {
    // 성능 이슈 리포팅
    const report = {
      metric,
      value,
      threshold: this.thresholds[metric],
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      context
    };

    // 헬스 서비스에 리포트
    if (window.healthService) {
      window.healthService.recordError(
        new Error(`Performance issue: ${metric} = ${value}ms`),
        report
      );
    }

    console.warn('Performance issue detected:', report);
  }
}
```

### 2. 에러 추적 및 분석

#### **지능형 에러 분류**

```javascript
/**
 * 에러 분류 및 분석 시스템
 */
class ErrorAnalyzer {
  constructor() {
    this.errorPatterns = new Map();
    this.errorFrequency = new Map();
    this.userImpactAnalysis = new Map();
  }

  analyzeError(error, context = {}) {
    const classification = this.classifyError(error);
    const impact = this.assessUserImpact(error, context);
    const priority = this.calculatePriority(classification, impact);
    
    // 패턴 학습
    this.learnErrorPattern(error, classification);
    
    return {
      classification,
      impact,
      priority,
      recommendations: this.generateRecommendations(classification, impact),
      context: this.enrichContext(context)
    };
  }

  classifyError(error) {
    const message = error.message.toLowerCase();
    const stack = error.stack?.toLowerCase() || '';
    
    // 네트워크 에러
    if (message.includes('fetch') || message.includes('network') || 
        message.includes('xhr') || message.includes('ajax')) {
      return {
        category: 'network',
        subcategory: this.classifyNetworkError(error),
        retryable: true,
        userVisible: true
      };
    }
    
    // 보안 에러
    if (message.includes('security') || message.includes('validation') ||
        message.includes('unauthorized') || message.includes('forbidden')) {
      return {
        category: 'security',
        subcategory: this.classifySecurityError(error),
        retryable: false,
        userVisible: false
      };
    }
    
    // 렌더링 에러
    if (stack.includes('react') || message.includes('render') ||
        message.includes('component')) {
      return {
        category: 'rendering',
        subcategory: this.classifyRenderingError(error),
        retryable: false,
        userVisible: true
      };
    }
    
    // 데이터 에러
    if (message.includes('json') || message.includes('parse') ||
        message.includes('validation') || message.includes('data')) {
      return {
        category: 'data',
        subcategory: this.classifyDataError(error),
        retryable: true,
        userVisible: false
      };
    }
    
    return {
      category: 'unknown',
      subcategory: 'unclassified',
      retryable: false,
      userVisible: true
    };
  }

  assessUserImpact(error, context) {
    let impactScore = 0;
    const factors = [];
    
    // 기능적 영향
    if (context.feature === 'weather-data') {
      impactScore += 8;
      factors.push('핵심 기능 영향');
    } else if (context.feature === 'webcam-data') {
      impactScore += 6;
      factors.push('주요 기능 영향');
    } else if (context.feature === 'ui-enhancement') {
      impactScore += 3;
      factors.push('UI 기능 영향');
    }
    
    // 사용자 가시성
    if (context.userVisible) {
      impactScore += 5;
      factors.push('사용자 가시적 오류');
    }
    
    // 빈도
    const frequency = this.errorFrequency.get(error.message) || 0;
    if (frequency > 10) {
      impactScore += 4;
      factors.push('고빈도 발생');
    } else if (frequency > 3) {
      impactScore += 2;
      factors.push('중빈도 발생');
    }
    
    return {
      score: Math.min(impactScore, 10),
      factors,
      severity: this.calculateSeverity(impactScore)
    };
  }

  calculatePriority(classification, impact) {
    let priority = impact.score;
    
    // 보안 에러는 높은 우선순위
    if (classification.category === 'security') {
      priority = Math.max(priority, 8);
    }
    
    // 재시도 불가능한 에러는 우선순위 증가
    if (!classification.retryable) {
      priority += 2;
    }
    
    return Math.min(priority, 10);
  }

  generateRecommendations(classification, impact) {
    const recommendations = [];
    
    switch (classification.category) {
      case 'network':
        recommendations.push('네트워크 연결 상태 확인');
        recommendations.push('재시도 로직 적용');
        if (impact.score > 7) {
          recommendations.push('오프라인 모드 제공');
        }
        break;
        
      case 'security':
        recommendations.push('보안 로그 검토');
        recommendations.push('입력 검증 강화');
        recommendations.push('보안팀 알림 필요');
        break;
        
      case 'rendering':
        recommendations.push('컴포넌트 상태 초기화');
        recommendations.push('Error Boundary 추가');
        recommendations.push('Fallback UI 제공');
        break;
        
      case 'data':
        recommendations.push('데이터 검증 로직 확인');
        recommendations.push('기본값 제공');
        recommendations.push('데이터 스키마 검토');
        break;
    }
    
    return recommendations;
  }
}
```

---

## 🎯 실전 구현 가이드

### 1. 보안 구현 체크리스트

#### **Frontend 보안**

```javascript
/**
 * 프론트엔드 보안 초기화
 */
export const initializeSecurity = () => {
  // 1. Content Security Policy 설정
  setupCSP();
  
  // 2. XSS 방지 헤더 설정
  setupXSSProtection();
  
  // 3. 전역 에러 핸들러 설정
  setupGlobalErrorHandler();
  
  // 4. 개발자 도구 감지 (프로덕션)
  if (process.env.NODE_ENV === 'production') {
    detectDevTools();
  }
  
  // 5. 보안 모니터링 시작
  startSecurityMonitoring();
};

const setupCSP = () => {
  const meta = document.createElement('meta');
  meta.httpEquiv = 'Content-Security-Policy';
  meta.content = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline' https://apis.google.com",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: https:",
    "font-src 'self' https://fonts.gstatic.com",
    "connect-src 'self' https://api.data.gov.sg https://images.data.gov.sg",
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join('; ');
  
  document.head.appendChild(meta);
};

const detectDevTools = () => {
  let devtools = { open: false, orientation: null };
  
  setInterval(() => {
    if (window.outerHeight - window.innerHeight > 200 || 
        window.outerWidth - window.innerWidth > 200) {
      if (!devtools.open) {
        devtools.open = true;
        console.warn('Development tools detected');
        // 보안 이벤트 로깅
        securityLog('devtools_opened');
      }
    } else {
      devtools.open = false;
    }
  }, 500);
};
```

#### **API 보안**

```javascript
/**
 * API 보안 미들웨어
 */
class APISecurityMiddleware {
  constructor() {
    this.requestSignatures = new Map();
    this.blacklistedIPs = new Set();
    this.rateLimiters = new Map();
  }

  async secureRequest(url, options) {
    // 1. URL 보안 검증
    const urlValidation = this.validateURL(url);
    if (!urlValidation.isValid) {
      throw new SecurityError(`Invalid URL: ${urlValidation.error}`);
    }

    // 2. 요청 서명 생성
    const signature = this.generateRequestSignature(url, options);
    
    // 3. 중복 요청 감지
    if (this.requestSignatures.has(signature)) {
      const lastRequest = this.requestSignatures.get(signature);
      if (Date.now() - lastRequest < 1000) { // 1초 내 중복 요청
        throw new SecurityError('Duplicate request detected');
      }
    }
    
    this.requestSignatures.set(signature, Date.now());
    
    // 4. Rate limiting 적용
    const rateLimiter = this.getRateLimiter(url);
    if (!rateLimiter.isAllowed()) {
      throw new SecurityError('Rate limit exceeded');
    }
    
    // 5. 보안 헤더 추가
    const secureOptions = this.addSecurityHeaders(options);
    
    return { url, options: secureOptions };
  }

  generateRequestSignature(url, options) {
    const content = JSON.stringify({
      url,
      method: options.method || 'GET',
      headers: options.headers || {},
      timestamp: Math.floor(Date.now() / 1000) // 1초 정밀도
    });
    
    return btoa(content);
  }

  addSecurityHeaders(options) {
    return {
      ...options,
      headers: {
        ...options.headers,
        'X-Requested-With': 'XMLHttpRequest',
        'X-Client-Version': process.env.REACT_APP_VERSION || '1.0.0',
        'X-Request-ID': this.generateRequestId(),
        'User-Agent': 'Singapore-Weather-Cam/1.0 (Security-Enhanced)'
      }
    };
  }
}
```

### 2. 성능 최적화 구현

#### **스마트 프리로딩**

```javascript
/**
 * 지능형 리소스 프리로딩
 */
class SmartPreloader {
  constructor() {
    this.preloadQueue = new Set();
    this.preloadedResources = new Map();
    this.userBehaviorTracker = new UserBehaviorTracker();
    this.connectionInfo = this.getConnectionInfo();
  }

  async preloadBasedOnBehavior() {
    const predictions = this.userBehaviorTracker.predict();
    
    // 연결 상태에 따른 프리로딩 전략
    if (this.connectionInfo.effectiveType === '4g' && 
        this.connectionInfo.downlink > 2) {
      // 빠른 연결: 적극적 프리로딩
      await this.aggressivePreload(predictions);
    } else if (this.connectionInfo.effectiveType === '3g') {
      // 중간 연결: 선택적 프리로딩
      await this.selectivePreload(predictions);
    } else {
      // 느린 연결: 필수 리소스만
      await this.minimalPreload(predictions);
    }
  }

  async aggressivePreload(predictions) {
    const highProbabilityRoutes = predictions
      .filter(p => p.probability > 0.7)
      .sort((a, b) => b.probability - a.probability);

    for (const route of highProbabilityRoutes.slice(0, 3)) {
      await this.preloadRoute(route.path);
    }
  }

  async preloadRoute(path) {
    const routeConfig = this.getRouteConfig(path);
    
    if (routeConfig) {
      // 컴포넌트 프리로드
      if (routeConfig.component) {
        await routeConfig.component();
      }
      
      // 데이터 프리로드
      if (routeConfig.data) {
        await this.preloadData(routeConfig.data);
      }
      
      // 이미지 프리로드
      if (routeConfig.images) {
        await this.preloadImages(routeConfig.images);
      }
    }
  }

  getConnectionInfo() {
    if ('connection' in navigator) {
      return {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt,
        saveData: navigator.connection.saveData
      };
    }
    
    return { effectiveType: '4g', downlink: 10, rtt: 100, saveData: false };
  }
}

/**
 * 사용자 행동 추적 및 예측
 */
class UserBehaviorTracker {
  constructor() {
    this.actions = [];
    this.patterns = new Map();
    this.currentSession = {
      startTime: Date.now(),
      actions: [],
      route: window.location.pathname
    };
  }

  trackAction(action, data = {}) {
    const actionRecord = {
      type: action,
      timestamp: Date.now(),
      route: window.location.pathname,
      data
    };
    
    this.actions.push(actionRecord);
    this.currentSession.actions.push(actionRecord);
    
    // 패턴 학습
    this.learnPattern(actionRecord);
    
    // 예측 업데이트
    this.updatePredictions();
  }

  predict() {
    const currentRoute = window.location.pathname;
    const timeOfDay = new Date().getHours();
    const dayOfWeek = new Date().getDay();
    
    // 현재 컨텍스트 기반 예측
    const contextKey = `${currentRoute}_${timeOfDay}_${dayOfWeek}`;
    const pattern = this.patterns.get(contextKey);
    
    if (pattern) {
      return pattern.nextRoutes.map(route => ({
        path: route.path,
        probability: route.frequency / pattern.totalActions
      }));
    }
    
    // 글로벌 패턴 기반 예측
    return this.getGlobalPredictions();
  }
}
```

---

## ✅ 보안 체크리스트

### 개발 단계

- [ ] **입력 검증**: 모든 사용자 입력에 대한 검증 로직 구현
- [ ] **출력 인코딩**: XSS 방지를 위한 모든 출력 데이터 인코딩
- [ ] **SQL Injection 방지**: 매개변수화된 쿼리 사용
- [ ] **CSRF 보호**: 토큰 기반 CSRF 방지 메커니즘
- [ ] **보안 헤더**: CSP, HSTS, X-Frame-Options 등 설정

### 배포 단계

- [ ] **HTTPS 강제**: 모든 통신에 HTTPS 사용
- [ ] **민감 정보 제거**: 소스 코드에서 API 키, 비밀번호 제거
- [ ] **에러 정보 제한**: 프로덕션에서 스택 트레이스 숨김
- [ ] **로깅 보안**: 민감한 정보 로깅 방지
- [ ] **접근 제어**: 적절한 권한 및 인증 메커니즘

### 운영 단계

- [ ] **모니터링**: 보안 이벤트 실시간 모니터링
- [ ] **취약점 스캔**: 정기적인 보안 취약점 검사
- [ ] **로그 분석**: 의심스러운 활동 패턴 분석
- [ ] **업데이트**: 정기적인 보안 패치 적용
- [ ] **백업**: 정기적인 데이터 백업 및 복구 테스트

이 가이드는 Singapore Weather Cam 프로젝트의 보안과 성능 최적화에 대한 실무적이고 구체적인 구현 방법을 제공합니다. 각 섹션의 코드 예제는 실제 프로덕션 환경에서 검증된 패턴들을 기반으로 작성되었습니다.