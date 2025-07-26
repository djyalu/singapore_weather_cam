# 🧩 Components Documentation

Singapore Weather Cam 프로젝트의 핵심 React 컴포넌트들에 대한 상세 문서입니다.

## 🗺️ Map Components

### RegionalMapView
**위치**: `src/components/map/RegionalMapView.jsx`

지역별 선택이 가능한 인터랙티브 지도 컴포넌트입니다.

**주요 기능**:
- 5개 지역 선택 (All Singapore, Central, West, East, North, South)
- 동적 지역 오버레이 및 경계 표시
- 실시간 지역 통계 (날씨 스테이션, 교통 카메라, 평균 온도)
- 반응형 디자인 및 애니메이션

**Props**:
```typescript
interface RegionalMapViewProps {
  weatherData: WeatherData;
  webcamData: WebcamData;
}
```

**사용 예시**:
```jsx
<RegionalMapView 
  weatherData={weatherData} 
  webcamData={webcamData} 
/>
```

### MapView
**위치**: `src/components/map/MapView.jsx`

기본 Leaflet 지도 컴포넌트입니다.

**주요 기능**:
- Leaflet 기반 인터랙티브 지도
- 날씨 스테이션 및 웹캠 마커 표시
- 커스텀 아이콘 및 팝업
- 지역별 오버레이 지원

## 🌤️ Weather Components

### WeatherDashboard
**위치**: `src/components/weather/WeatherDashboard.jsx`

인터랙티브 날씨 데이터 대시보드입니다.

**주요 기능**:
- 지역별 날씨 정보 필터링
- 실시간 온도, 습도, 강수량 표시
- 날씨 예보 차트
- 위치별 상세 정보

**Props**:
```typescript
interface WeatherDashboardProps {
  data: TransformedWeatherData;
}
```

### WeatherCard
**위치**: `src/components/weather/WeatherCard.jsx`

개별 날씨 정보를 표시하는 카드 컴포넌트입니다.

### TemperatureHero
**위치**: `src/components/weather/TemperatureHero.jsx`

메인 온도 정보를 강조 표시하는 히어로 섹션입니다.

## 📸 Webcam Components

### TrafficCameraGallery
**위치**: `src/components/webcam/TrafficCameraGallery.jsx`

LTA 최적화된 교통 카메라 갤러리입니다.

**주요 기능**:
- 90개 교통 카메라 지원
- HD 화질 (1920x1080) 79개 카메라
- 지역별 필터링
- 실시간 이미지 업데이트

### WebcamGallery
**위치**: `src/components/webcam/WebcamGallery.jsx`

기본 웹캠 갤러리 컴포넌트입니다.

## 🔧 System Components

### SystemStatus
**위치**: `src/components/common/SystemStatus.jsx`

실시간 시스템 상태를 표시하는 상단 바 컴포넌트입니다.

**주요 기능**:
- 서비스별 상태 표시 (날씨, 웹캠, 네트워크)
- 컬러 코딩된 상태 인디케이터
- 마지막 업데이트 시간 표시
- 데이터 품질 메트릭

**Props**:
```typescript
interface SystemStatusProps {
  lastFetch?: Date;
  weatherData?: any;
  webcamData?: any;
  reliabilityMetrics?: {
    weatherQuality?: number;
    webcamQuality?: number;
    fallbackMode?: boolean;
    dataAge?: number;
  };
  error?: any;
  isRefreshing?: boolean;
}
```

### MonitoringDashboard
**위치**: `src/components/admin/MonitoringDashboard.jsx`

관리자용 모니터링 대시보드입니다.

**주요 기능**:
- 시스템 메트릭 모니터링
- 리소스 사용량 추적
- 오류 로그 및 성능 지표
- 키보드 단축키 지원 (Ctrl+Shift+M)

## 🎯 Analysis Components

### WeatherAnalysisCardRefactored
**위치**: `src/components/analysis/WeatherAnalysisCardRefactored.jsx`

AI 강화 날씨 분석 카드입니다.

**주요 기능**:
- Claude AI 기반 날씨 분석
- 위치별 날씨 상황 해석
- 실시간 이미지 분석
- 애니메이션 효과

## 📱 Common Components

### LoadingScreen
**위치**: `src/components/common/LoadingScreen.jsx`

애플리케이션 로딩 화면입니다.

### ErrorBoundary
**위치**: `src/components/common/ErrorBoundary.jsx`

React 에러 경계 컴포넌트입니다.

### PWAStatus
**위치**: `src/components/common/PWAStatus.jsx`

PWA 기능 상태 및 설치 프롬프트 컴포넌트입니다.

## 🎨 Layout Components

### Header
**위치**: `src/components/layout/Header.jsx`

메인 헤더 컴포넌트입니다.

### SystemFooter
**위치**: `src/components/layout/SystemFooter.jsx`

시스템 정보가 포함된 푸터 컴포넌트입니다.

## 🔄 Hook Integration

모든 컴포넌트는 다음 커스텀 훅들과 통합되어 작동합니다:

- **useDataLoader**: 데이터 로딩 및 신뢰성 관리
- **useSystemStats**: 시스템 통계 계산
- **useServiceWorker**: PWA 기능 지원

## 🎯 Performance Optimizations

- **React.lazy()**: 모든 주요 컴포넌트에 대한 코드 분할
- **React.memo()**: 불필요한 리렌더링 방지
- **Suspense**: 로딩 상태 관리
- **PropTypes**: 런타임 타입 검증

## 🌐 Accessibility Features

- **WCAG 2.1 AA 준수**: 모든 컴포넌트에서 접근성 표준 준수
- **키보드 네비게이션**: 키보드만으로 전체 애플리케이션 사용 가능
- **스크린 리더 지원**: 적절한 ARIA 라벨 및 역할 설정
- **고대비 지원**: 시각적 접근성 향상

## 📋 Component Status

| Component | Status | Last Updated | Features |
|-----------|--------|--------------|----------|
| RegionalMapView | ✅ Active | 2025-07-26 | 지역별 선택, 오버레이 |
| WeatherDashboard | ✅ Active | 2025-07-26 | 데이터 변환 통합 |
| SystemStatus | ✅ Active | 2025-07-26 | 실시간 상태 모니터링 |
| TrafficCameraGallery | ✅ Active | 2025-07-26 | LTA 최적화 |
| MonitoringDashboard | ✅ Active | 2025-07-26 | Admin 기능 |
