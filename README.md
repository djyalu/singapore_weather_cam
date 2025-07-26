# 🌤️ Singapore Weather Cam

[![Deploy Status](https://github.com/djyalu/singapore_weather_cam/actions/workflows/deploy.yml/badge.svg)](https://github.com/djyalu/singapore_weather_cam/actions/workflows/deploy.yml)
[![Weather Collection](https://github.com/djyalu/singapore_weather_cam/actions/workflows/collect-weather.yml/badge.svg)](https://github.com/djyalu/singapore_weather_cam/actions/workflows/collect-weather.yml)
[![Webcam Capture](https://github.com/djyalu/singapore_weather_cam/actions/workflows/capture-webcam.yml/badge.svg)](https://github.com/djyalu/singapore_weather_cam/actions/workflows/capture-webcam.yml)

**실시간 싱가포르 날씨 및 웹캠 모니터링 시스템**

Bukit Timah Nature Reserve를 중심으로 한 싱가포르의 실시간 날씨 정보와 교통 카메라 영상을 제공하는 웹 애플리케이션입니다.

## 🌟 **주요 기능**

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

### 🗺️ **인터랙티브 지도**
- **중심 위치**: Bukit Timah Nature Reserve (1.3520°N, 103.7767°E)
- **실시간 마커**: 날씨 스테이션 및 웹캠 위치 표시
- **OpenStreetMap**: 고해상도 지도 데이터

### 📊 **시스템 모니터링**
- **실시간 상태**: 시스템 성능 및 데이터 품질 모니터링
- **자동 복구**: 장애 상황 자동 감지 및 복구
- **사용량 추적**: GitHub Actions 리소스 사용량 모니터링

## 🚀 **라이브 데모**

**🌐 [Singapore Weather Cam 바로가기](https://djyalu.github.io/singapore_weather_cam/)**

## 🏗️ **기술 스택**

### **Frontend**
- **React 18.3.1**: 현대적인 UI 컴포넌트
- **Vite 4.5.14**: 초고속 개발 환경
- **Tailwind CSS 3.4.17**: 유틸리티 기반 스타일링
- **Chart.js**: 날씨 데이터 시각화
- **React Leaflet**: 인터랙티브 지도

### **Backend & Infrastructure**
- **GitHub Actions**: 자동화된 데이터 수집 파이프라인
- **GitHub Pages**: 무료 호스팅
- **NEA Singapore API**: 공식 날씨 데이터
- **LTA Traffic API**: 실시간 교통 카메라
- **Claude AI API**: 이미지 및 날씨 분석

### **Development**
- **ESLint + Prettier**: 코드 품질 관리
- **PropTypes**: 타입 검증
- **Modern JavaScript**: ES2021+ 기능 활용

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