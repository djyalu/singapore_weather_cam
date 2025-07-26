# 🏗️ Architecture Documentation

Singapore Weather Cam 프로젝트의 시스템 아키텍처 상세 문서입니다.

**최종 업데이트**: 2025-07-26  
**아키텍처 버전**: 3.0  
**상태**: 프로덕션 운영 중 ✅  
**새로운 기능**: RegionalMapView, SystemStatus, 지능형 데이터 변환

## 📋 **목차**

- [System Overview](#system-overview)
- [Architecture Patterns](#architecture-patterns)
- [Component Architecture](#component-architecture)
- [Data Flow](#data-flow)
- [Infrastructure](#infrastructure)
- [Security](#security)
- [Performance](#performance)
- [Scalability](#scalability)

## 🌐 **System Overview**

### **Architecture Type**
**JAMstack (JavaScript, APIs, Markup)**
- **J**avaScript: React 18.3.1 클라이언트 사이드
- **A**PIs: 외부 API 통합 (NEA, LTA, Claude AI)
- **M**arkup: 정적 HTML 생성 (Vite 빌드)

### **Deployment Pattern**
**GitHub-Native Infrastructure**
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Data Sources  │    │ GitHub Actions   │    │  GitHub Pages   │
│                 │    │                  │    │                 │
│ • NEA API       │───▶│ • Collect Data   │───▶│ • Static Hosting│
│ • LTA API       │    │ • Process Images │    │ • CDN Delivery  │
│ • Claude AI     │    │ • Build & Deploy │    │ • Auto SSL      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
```

### **Core Principles**
1. **Serverless**: GitHub Actions로 백엔드 로직 구현
2. **Static First**: 빌드 타임에 최적화
3. **API Driven**: 외부 서비스 의존성
4. **Cost Effective**: 무료 인프라 활용
5. **Developer Friendly**: 간단한 배포 파이프라인

## 🔧 **Architecture Patterns**

### **1. Event-Driven Architecture**
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Scheduler  │───▶│   Actions   │───▶│    Data     │
│             │    │             │    │             │
│ • 30min     │    │ • Collect   │    │ • JSON      │
│ • Cron      │    │ • Process   │    │ • Commit    │
│ • Manual    │    │ • Analyze   │    │ • Deploy    │
└─────────────┘    └─────────────┘    └─────────────┘
```

### **2. Circuit Breaker Pattern**
```javascript
// API 호출 보호
const callWithCircuitBreaker = async (apiCall) => {
  if (circuitBreaker.isOpen()) {
    return fallbackData;
  }
  
  try {
    const result = await apiCall();
    circuitBreaker.recordSuccess();
    return result;
  } catch (error) {
    circuitBreaker.recordFailure();
    throw error;
  }
};
```

### **3. Repository Pattern**
```javascript
// 데이터 접근 추상화
class WeatherRepository {
  async getLatest() {
    return fetch('/data/weather/latest.json');
  }
  
  async getHistorical(date) {
    return fetch(`/data/weather/${date}.json`);
  }
}
```

### **4. Observer Pattern**
```javascript
// 실시간 업데이트
useEffect(() => {
  const interval = setInterval(loadData, 5 * 60 * 1000);
  return () => clearInterval(interval);
}, [loadData]);
```

## 🧩 **Component Architecture**

### **Frontend Component Hierarchy**
```
App.jsx
├── ErrorBoundary
├── LiveHeader
│   └── SystemStats
├── MapView (Leaflet)
│   ├── WeatherMarkers
│   └── WebcamMarkers
├── WeatherAnalysisCard
│   ├── ClaudeAnalysis
│   └── WeatherData
├── WebcamGallery
│   ├── WebcamCard
│   └── WebcamModal
├── TrafficCameraGallery
│   ├── CameraFilters
│   └── CameraGrid
└── SystemFooter
```

### **Service Layer Architecture**
```
Services
├── trafficCameraService.js
│   ├── fetchTrafficCameras()
│   ├── filterCamerasByRegion()
│   └── analyzeImageWithClaude()
├── weatherService.js
│   ├── fetchWeatherData()
│   ├── processStationData()
│   └── generateSummary()
└── apiClient.js
    ├── createHttpClient()
    ├── handleRetries()
    └── circuitBreaker()
```

### **Configuration Management**
```
Config
├── webcamSources.js      # 웹캠 설정
├── weatherStations.js    # 기상 스테이션
├── apiEndpoints.js       # API 엔드포인트
└── constants.js          # 전역 상수
```

## 🔄 **Data Flow**

### **Real-time Data Pipeline**
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   External  │    │   GitHub    │    │    Git      │    │   Client    │
│    APIs     │───▶│   Actions   │───▶│ Repository  │───▶│   Browser   │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
      │                    │                   │                   │
      ▼                    ▼                   ▼                   ▼
• NEA Weather      • collect-weather.yml  • data/weather/  • Auto Refresh
• LTA Traffic      • capture-webcam.yml   • data/webcam/   • Live Updates
• Claude AI        • Scheduled Jobs       • JSON Files     • State Sync
```

### **Data Transformation Flow**
```
Raw API Data → Validation → Normalization → Enrichment → Storage → Client

1. Raw API Data:     External API 응답
2. Validation:       스키마 검증, 데이터 품질 체크
3. Normalization:    표준 포맷 변환
4. Enrichment:       AI 분석, 메타데이터 추가
5. Storage:          JSON 파일 저장, Git 커밋
6. Client:           브라우저에서 소비
```

### **State Management**
```javascript
// React State Architecture
App State
├── weatherData     (from /data/weather/latest.json)
├── webcamData      (from /data/webcam/latest.json)
├── loading         (boolean)
├── error           (string | null)
└── retryCount      (number)

// Derived State (useMemo)
├── systemStats     (computed from webcamData)
├── filteredCameras (computed from webcamData + filters)
└── weatherSummary  (computed from weatherData)
```

## 🏗️ **Infrastructure**

### **GitHub Actions Workflows**
```yaml
Infrastructure:
├── collect-weather.yml    # 날씨 데이터 수집 (30분 간격)
├── capture-webcam.yml     # 웹캠 이미지 캡처 (30분 간격)
├── deploy.yml             # 자동 배포 (push 트리거)
├── health-check.yml       # 시스템 헬스 체크 (1시간 간격)
└── monitor-usage.yml      # 리소스 사용량 모니터링 (일 1회)
```

### **Resource Allocation**
```yaml
GitHub Actions Budget (2000 min/month):
├── Weather Collection:     ~480 min/month  (24%)
├── Webcam Capture:        ~720 min/month  (36%)
├── Deployment:            ~50 min/month   (2.5%)
├── Health Check:          ~80 min/month   (4%)
├── Usage Monitoring:      ~48 min/month   (2.4%)
└── Buffer:                ~622 min/month  (31.1%)
```

### **Storage Strategy**
```
GitHub Repository Storage:
├── /data/                 # Dynamic data (auto-generated)
│   ├── weather/          # Weather JSON files
│   ├── webcam/           # Webcam metadata
│   └── traffic/          # Traffic camera data
├── /public/images/       # Static images (auto-managed)
│   └── webcam/          # Captured images (7-day retention)
└── /dist/               # Build output (auto-generated)
```

## 🔒 **Security**

### **Security Architecture**
```
Security Layers:
├── GitHub Security
│   ├── Repository Access Control
│   ├── Actions Secrets Management
│   └── Branch Protection Rules
├── API Security
│   ├── HTTPS Only Communication
│   ├── API Key Rotation Support
│   └── Rate Limiting Compliance
├── Client Security
│   ├── CSP Headers
│   ├── Input Sanitization
│   └── XSS Protection
└── Data Security
    ├── No Sensitive Data Storage
    ├── Public API Data Only
    └── Audit Trail (Git History)
```

### **Authentication & Authorization**
```yaml
Authentication Matrix:
├── GitHub Actions:        Automatic GITHUB_TOKEN
├── External APIs:         Optional API keys (Secrets)
├── Public Data:           No authentication required
└── Client Access:         Public website (no auth)

Secret Management:
├── CLAUDE_API_KEY:        GitHub Secrets (optional)
├── OPENWEATHER_API_KEY:   GitHub Secrets (optional)
└── GITHUB_TOKEN:          Auto-generated (read/write repo)
```

### **Security Best Practices**
1. **Principle of Least Privilege**: 최소 권한 원칙
2. **Defense in Depth**: 다층 보안 구조
3. **Zero Trust**: 모든 요청 검증
4. **Regular Updates**: 의존성 자동 업데이트
5. **Audit Logging**: Git 기반 감사 추적

## ⚡ **Performance**

### **Performance Architecture**
```
Performance Optimization Stack:
├── Build Time Optimization
│   ├── Vite Fast Build         (<30s)
│   ├── Tree Shaking           (Bundle optimization)
│   ├── Code Splitting         (Route-based)
│   └── Asset Optimization     (Images, CSS)
├── Runtime Optimization
│   ├── React.memo             (Component memoization)
│   ├── useMemo/useCallback    (Hook optimization)
│   ├── Lazy Loading           (Component lazy loading)
│   └── Virtual Scrolling      (Large lists)
├── Network Optimization
│   ├── GitHub Pages CDN       (Global distribution)
│   ├── HTTP/2                 (Multiplexing)
│   ├── Gzip Compression       (Response compression)
│   └── Cache Headers          (Browser caching)
└── Data Optimization
    ├── JSON Minification      (Data compression)
    ├── Image Optimization     (WebP, compression)
    ├── Progressive Loading    (Incremental updates)
    └── Background Sync        (Service Worker)
```

### **Performance Metrics**
```yaml
Target Performance:
├── First Contentful Paint:   <1.5s
├── Largest Contentful Paint: <2.5s
├── Cumulative Layout Shift:  <0.1
├── First Input Delay:        <100ms
├── Time to Interactive:      <3s
└── Lighthouse Score:         >90
```

### **Caching Strategy**
```
Cache Architecture:
├── Browser Cache (31536000s = 1 year)
│   ├── Static Assets         (CSS, JS, Images)
│   ├── Fonts                 (WOFF2)
│   └── Icons                 (SVG)
├── CDN Cache (3600s = 1 hour)
│   ├── HTML Pages            (Dynamic content)
│   ├── Data Files            (JSON)
│   └── API Responses         (Weather, Traffic)
├── Service Worker Cache (Variable)
│   ├── Core App Shell        (Persistent)
│   ├── Runtime Cache         (Dynamic)
│   └── Offline Fallbacks     (Essential data)
└── Application Cache (300s = 5 minutes)
    ├── Weather Data          (Auto-refresh)
    ├── Traffic Images        (Real-time updates)
    └── System Status         (Health monitoring)
```

## 📈 **Scalability**

### **Horizontal Scaling**
```
Scaling Dimensions:
├── Data Sources
│   ├── Additional Weather Stations    (Easy)
│   ├── More Traffic Cameras          (Easy)
│   ├── New External APIs             (Medium)
│   └── International Expansion       (Complex)
├── Processing Power
│   ├── Parallel GitHub Actions       (Built-in)
│   ├── Multiple Workflows            (Easy)
│   ├── Distributed Processing        (Medium)
│   └── External Compute              (Complex)
├── Storage
│   ├── Git LFS for Large Files       (Easy)
│   ├── External Storage              (Medium)
│   ├── Database Integration          (Complex)
│   └── CDN Storage                   (Complex)
└── Traffic
    ├── GitHub Pages Auto-scaling     (Built-in)
    ├── CDN Distribution              (Built-in)
    ├── Multiple Regions              (Easy)
    └── Custom Infrastructure         (Complex)
```

### **Vertical Scaling**
```
Resource Optimization:
├── GitHub Actions
│   ├── Workflow Optimization         (Code efficiency)
│   ├── Parallel Execution           (Matrix strategies)
│   ├── Conditional Execution        (Skip unnecessary runs)
│   └── Resource Monitoring          (Usage optimization)
├── Build Process
│   ├── Incremental Builds           (Only changed files)
│   ├── Build Caching                (Dependency caching)
│   ├── Output Optimization          (Minification)
│   └── Asset Bundling               (Efficient packaging)
├── Data Processing
│   ├── Streaming Processing          (Large datasets)
│   ├── Batch Optimization           (Bulk operations)
│   ├── Compression                  (Storage efficiency)
│   └── Deduplication               (Redundancy removal)
└── Client Performance
    ├── Code Splitting               (Load on demand)
    ├── Prefetching                  (Anticipatory loading)
    ├── Background Processing        (Non-blocking operations)
    └── Memory Management            (Garbage collection)
```

### **Growth Planning**
```yaml
Capacity Planning:
├── Current Capacity:
│   ├── GitHub Actions:        2000 min/month
│   ├── Repository Storage:    1GB
│   ├── GitHub Pages:          100GB bandwidth/month
│   └── API Calls:            Unlimited (free APIs)
├── 10x Growth Scenario:
│   ├── Actions Needed:        Pro account ($4/month)
│   ├── Storage Needed:        LFS or external storage
│   ├── Bandwidth:            Sufficient (GitHub Pages)
│   └── API Limits:           Monitor rate limits
└── Migration Path:
    ├── Phase 1:              Optimize existing workflows
    ├── Phase 2:              Upgrade GitHub subscription
    ├── Phase 3:              Hybrid infrastructure
    └── Phase 4:              Custom cloud deployment
```

## 🔧 **Development Architecture**

### **Development Workflow**
```
Development Pipeline:
├── Local Development
│   ├── Hot Module Replacement    (Instant feedback)
│   ├── ESLint + Prettier        (Code quality)
│   ├── Mock Data                (Offline development)
│   └── Component Storybook      (Isolated testing)
├── Version Control
│   ├── Feature Branches         (Isolated development)
│   ├── Pull Request Reviews     (Code review)
│   ├── Automated Testing        (CI validation)
│   └── Semantic Versioning      (Release management)
├── Continuous Integration
│   ├── Dependency Installation  (npm ci)
│   ├── Linting & Formatting     (Quality gates)
│   ├── Build Validation         (Build success)
│   └── Deployment Trigger       (Auto-deploy)
└── Monitoring & Feedback
    ├── Error Tracking           (Runtime errors)
    ├── Performance Monitoring    (Web Vitals)
    ├── Usage Analytics          (GitHub Insights)
    └── User Feedback            (GitHub Issues)
```

### **Testing Strategy**
```
Testing Architecture:
├── Unit Tests
│   ├── Component Testing        (React Testing Library)
│   ├── Service Testing          (Jest)
│   ├── Utility Testing          (Pure functions)
│   └── Mock Integration         (API mocking)
├── Integration Tests
│   ├── API Integration          (Real API calls)
│   ├── Data Flow Testing        (End-to-end data)
│   ├── Workflow Testing         (GitHub Actions)
│   └── Browser Testing          (Playwright)
├── System Tests
│   ├── Performance Testing      (Lighthouse CI)
│   ├── Accessibility Testing    (axe-core)
│   ├── Security Testing         (Dependency audit)
│   └── Load Testing             (Synthetic traffic)
└── Production Monitoring
    ├── Health Checks            (System status)
    ├── Error Monitoring         (Runtime errors)
    ├── Performance Tracking     (Real user metrics)
    └── Availability Monitoring   (Uptime checks)
```

---

**🤖 Generated with [Claude Code](https://claude.ai/code)**

**Co-Authored-By: Claude <noreply@anthropic.com>**