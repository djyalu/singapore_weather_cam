# 🌤️ Singapore Weather Cam

[![Deploy Status](https://github.com/djyalu/singapore_weather_cam/actions/workflows/deploy.yml/badge.svg)](https://github.com/djyalu/singapore_weather_cam/actions/workflows/deploy.yml)
[![Weather Collection](https://github.com/djyalu/singapore_weather_cam/actions/workflows/collect-weather.yml/badge.svg)](https://github.com/djyalu/singapore_weather_cam/actions/workflows/collect-weather.yml)
[![Webcam Capture](https://github.com/djyalu/singapore_weather_cam/actions/workflows/capture-webcam.yml/badge.svg)](https://github.com/djyalu/singapore_weather_cam/actions/workflows/capture-webcam.yml)
[![Health Check](https://github.com/djyalu/singapore_weather_cam/actions/workflows/health-check.yml/badge.svg)](https://github.com/djyalu/singapore_weather_cam/actions/workflows/health-check.yml)
[![Usage Monitor](https://github.com/djyalu/singapore_weather_cam/actions/workflows/monitor-usage.yml/badge.svg)](https://github.com/djyalu/singapore_weather_cam/actions/workflows/monitor-usage.yml)

**지능형 실시간 싱가포르 날씨 및 지역별 교통 모니터링 시스템**

Bukit Timah Nature Reserve를 중심으로 한 싱가포르의 실시간 날씨 정보와 지역별 교통 카메라 영상을 제공하는 AI 강화 웹 애플리케이션입니다.

## 🌟 **주요 기능**

### 🔄 **실시간 수동 업데이트** ⭐ 신규
- **즉시 새로고침**: 필요할 때마다 즉시 데이터 업데이트
- **일반 새로고침**: 캐시를 유지하며 효율적 업데이트
- **강제 새로고침**: 모든 캐시를 무시하고 최신 데이터 강제 로드
- **모바일 최적화**: 44px 최소 터치 영역, 반응형 레이아웃
- **Service Worker 캐시 제어**: 완전한 캐시 우회 지원

### 🌤️ **실시간 날씨 모니터링**
- **공식 데이터**: NEA Singapore API를 통한 신뢰할 수 있는 날씨 정보
- **지역 중심**: Bukit Timah Nature Reserve 및 주변 지역 (S121, S116, S118 스테이션)
- **AI 분석**: Claude AI를 활용한 날씨 상황 해석
- **자동 업데이트**: 30분 간격 실시간 데이터 수집

### 📸 **실시간 웹캠 & 교통 카메라**
- **90개 교통 카메라**: Singapore data.gov.sg 연동 전국 실시간 교통 상황
- **HD 화질**: 1920x1080 해상도 지원 (79개 카메라)
- **지역별 필터링**: 주요 지점, 지역별, 전체 보기
- **AI 이미지 분석**: Claude Vision API를 통한 날씨 및 교통 상황 분석

### 🗺️ **지역별 인터랙티브 지도**
- **5개 지역 선택**: All Singapore, Central, West, East, North, South
- **동적 지역 오버레이**: 선택된 지역 하이라이트 및 경계 표시
- **실시간 통계**: 지역별 날씨 스테이션, 교통 카메라, 평균 온도 표시
- **중심 위치**: Bukit Timah Nature Reserve (1.3520°N, 103.7767°E)
- **실시간 마커**: 날씨 스테이션 및 웹캠 위치 표시
- **반응형 디자인**: 모바일 및 데스크톱 최적화

### 📊 **지능형 시스템 모니터링**
- **실시간 헬스 체크**: 시스템 성능 및 데이터 품질 모니터링
- **자동 복구**: 장애 상황 자동 감지 및 복구 (Circuit Breaker 패턴)
- **사용량 추적**: GitHub Actions 리소스 사용량 모니터링 및 알림
- **SystemStatus 컴포넌트**: 상단 상태 바를 통한 실시간 서비스 상태 표시
- **데이터 신뢰성**: 다층 검증 시스템 및 Fallback 데이터 제공

## 🚀 **라이브 데모**

**🌐 [Singapore Weather Cam 바로가기](https://djyalu.github.io/singapore_weather_cam/)**

## 🏗️ **기술 스택**

### **Frontend Architecture**
- **React 18.3.1**: 현대적인 함수형 컴포넌트 + Hooks
- **Vite 4.5.14**: 초고속 개발 환경 + HMR
- **Tailwind CSS 3.4.17**: 유틸리티 기반 스타일링 + 커스텀 테마
- **Leaflet**: 고성능 인터랙티브 지도 (RegionalMapView)
- **Lucide React**: 현대적인 아이콘 시스템
- **Chart.js**: 반응형 날씨 데이터 시각화

### **Core Components**
- **RegionalMapView**: 지역별 맵 선택 및 오버레이 시스템
- **WeatherDashboard**: 인터랙티브 날씨 데이터 대시보드
- **SystemStatus**: 실시간 시스템 상태 모니터링 바
- **TrafficCameraGallery**: LTA 최적화 교통 카메라 갤러리
- **WeatherDataTransformer**: 다중 API 데이터 통합 엔진

### **Backend & Infrastructure**
- **GitHub Actions (5개 워크플로우)**: 완전 자동화 시스템
  - `collect-weather.yml`: 5분 간격 날씨 데이터 수집
  - `capture-webcam.yml`: 15분 간격 교통 카메라 캡처
  - `deploy.yml`: 자동 빌드 및 배포
  - `health-check.yml`: 시스템 헬스 모니터링
  - `monitor-usage.yml`: 리소스 사용량 추적
- **GitHub Pages**: 무료 호스팅 + CDN
- **NEA Singapore API**: 공식 날씨 데이터 (무료, 무제한)
- **LTA Traffic API**: 실시간 교통 카메라 (data.gov.sg)
- **Claude AI API**: 이미지 분석 및 날씨 해석

### **Data Reliability & Performance**
- **Circuit Breaker Pattern**: 장애 격리 및 자동 복구
- **Multi-layer Caching**: 브라우저 + GitHub Actions 레벨 캐싱
- **Data Validation**: 보안 검증 + 신뢰성 점수 시스템
- **Fallback Strategies**: 다중 데이터 소스 백업
- **Rate Limiting**: API 호출 최적화 및 부하 분산

### **Development & Quality**
- **ESLint + Prettier**: 자동 코드 포맷팅 및 품질 관리
- **PropTypes**: 런타임 타입 검증
- **Modern JavaScript**: ES2021+ 기능 + 모듈 시스템
- **PWA Support**: 서비스 워커 + 오프라인 지원
- **Accessibility**: WCAG 2.1 AA 준수 + 키보드 네비게이션

## 📦 **설치 및 실행**

### **Prerequisites**
- Node.js 18.x 이상
- npm 또는 yarn

### **로컬 개발 환경**
```bash
# 저장소 클론
git clone https://github.com/djyalu/singapore_weather_cam.git
cd singapore_weather_cam

# 의존성 설치
npm install

# 개발 서버 실행
npm run dev
```

개발 서버가 http://localhost:5173 에서 실행됩니다.

### **프로덕션 빌드**
```bash
# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview
```

## 🔧 **환경 변수 (선택사항)**

프로젝트는 환경 변수 없이도 기본 기능이 작동하지만, 다음 변수들로 기능을 확장할 수 있습니다:

```bash
# Claude AI 이미지 분석 (선택사항)
CLAUDE_API_KEY=your_claude_api_key

# OpenWeatherMap 백업 데이터 (선택사항)
OPENWEATHER_API_KEY=your_openweather_api_key
```

## 📱 **반응형 디자인**

- **모바일 최적화**: 스마트폰 및 태블릿 완벽 지원
- **PWA 지원**: 오프라인 모드 및 홈 화면 추가
- **접근성**: WCAG 2.1 AA 준수
- **성능 최적화**: Lighthouse 90+ 점수

## 🌏 **데이터 소스**

### **공식 API**
- **[NEA Singapore](https://www.nea.gov.sg/our-services/weather-climate/weather-monitoring)**: 날씨 데이터
- **[Singapore data.gov.sg](https://data.gov.sg)**: 교통 카메라
- **[LTA Singapore](https://www.lta.gov.sg)**: 교통 정보

### **데이터 업데이트 주기**
- **날씨 데이터**: 30분 간격
- **교통 카메라**: 30분 간격
- **시스템 상태**: 1시간 간격

## 🔄 **자동화 워크플로우**

프로젝트는 5개의 GitHub Actions 워크플로우로 완전 자동화됩니다:

1. **🌤️ 날씨 수집**: NEA API 데이터 자동 수집
2. **📸 웹캠 캡처**: 교통 카메라 이미지 및 AI 분석
3. **🚀 자동 배포**: GitHub Pages 실시간 배포
4. **💚 헬스 체크**: 시스템 상태 모니터링
5. **📊 사용량 모니터링**: 리소스 최적화

## 🎯 **프로젝트 목표**

1. **신뢰성**: 공식 API 사용으로 정확한 데이터 제공
2. **실시간성**: 30분 간격 자동 업데이트
3. **사용성**: 직관적이고 반응형인 UI/UX
4. **지속가능성**: 무료 인프라로 운영 (GitHub 생태계)
5. **확장성**: 모듈화된 아키텍처로 쉬운 기능 추가

## 🌿 **Bukit Timah Nature Reserve 중심**

이 프로젝트는 싱가포르의 자연보호구역인 Bukit Timah Nature Reserve를 중심으로 설계되었습니다:

- **위치**: 1.3520°N, 103.7767°E
- **특징**: 싱가포르 최고점 (164m)
- **생태계**: 열대우림 보존지역
- **우선 데이터**: S121, S116, S118 기상 스테이션

## 📁 **프로젝트 구조**
```
singapore_weather_cam/
├── .github/workflows/   # 자동화 워크플로우 (5개)
├── scripts/            # 데이터 수집 스크립트
├── src/               # React 소스 코드
│   ├── components/    # UI 컴포넌트 (17개)
│   │   ├── analysis/  # 날씨 분석 카드
│   │   ├── common/    # 공통 컴포넌트
│   │   ├── dashboard/ # 시스템 대시보드
│   │   ├── layout/    # 레이아웃 컴포넌트
│   │   ├── map/       # 지도 뷰 (Bukit Timah 중심)
│   │   ├── weather/   # 날씨 컴포넌트
│   │   └── webcam/    # 웹캠 & 교통 카메라
│   ├── config/       # 설정 파일
│   ├── services/     # API 서비스
│   └── utils/        # 유틸리티 함수
├── data/             # 수집된 데이터
│   ├── weather/      # 날씨 JSON
│   ├── webcam/       # 웹캠 메타데이터
│   └── traffic/      # 교통 카메라 데이터
└── public/           # 정적 파일
    └── images/       # 웹캠 이미지
```

## 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 라이선스

MIT License