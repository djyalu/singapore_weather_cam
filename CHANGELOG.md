# 📝 Changelog

Singapore Weather Cam 프로젝트의 모든 주요 변경사항을 기록합니다.

## [Unreleased]

### 🚀 Added
- PWA 지원 (Service Worker, Manifest)
- 오프라인 모드 지원
- 푸시 알림 기능
- Lazy loading 컴포넌트 최적화

## [2.0.0] - 2025-07-26

### 🚀 Added
- **실시간 교통 카메라 시스템**: Singapore data.gov.sg API 연동
  - 90개 전국 교통 카메라 실시간 연동
  - HD 해상도 지원 (1920x1080, 79개 카메라)
  - 지역별 필터링 기능 (주요 지점, 지역별, 전체 보기)
- **TrafficCameraGallery** 컴포넌트
- **trafficCameraService.js** API 서비스
- **시스템 모니터링** 강화
  - `health-check.yml` 워크플로우 (1시간 간격 헬스 체크)
  - `monitor-usage.yml` 워크플로우 (일 1회 사용량 모니터링)
  - 자동 복구 시스템
- **GitHub Actions 최적화**
  - 30분 간격으로 스케줄 조정 (한도 관리)
  - 병렬 처리 및 캐싱 개선
  - 오류 처리 및 fallback 데이터 시스템

### 🔄 Changed
- **워크플로우 스케줄 최적화**
  - 날씨 수집: 5분 → 30분 간격
  - 웹캠 캡처: 15분 → 30분 간격
  - GitHub Actions 사용량 최적화 (~2,000분/월 한도 내)
- **App.jsx 성능 최적화**
  - React.memo, useMemo, useCallback 적용
  - 자동 재시도 로직 개선
  - 실시간 상태 표시 추가

### 🐛 Fixed
- GitHub Actions 한도 초과 문제 해결
- API 타임아웃 처리 개선
- 빌드 캐싱 문제 수정

### 🏗️ Technical
- **컴포넌트**: 15개 → 17개 (ExternalWebcamLinks, TrafficCameraGallery 추가)
- **서비스**: trafficCameraService.js 추가
- **설정**: webcamSources.js 구조화
- **문서**: LTA-API-Guide.md 추가

## [1.5.0] - 2025-07-25

### 🚀 Added
- **Bukit Timah Nature Reserve 중심 설정**
  - 지도 중심점 변경 (1.3520°N, 103.7767°E)
  - S121, S116, S118 기상 스테이션 우선 데이터 수집
  - Bukit Timah 지역 웹캠 소스 추가
- **시스템 대시보드 강화**
  - SystemStats 컴포넌트 실시간 메트릭
  - 평균 신뢰도 계산 알고리즘
  - 주요 날씨 조건 자동 판별

### 🔄 Changed
- **지도 설정 업데이트**
  - 중심점: Hwa Chong → Bukit Timah Nature Reserve
  - 줌 레벨: 지역 상세 보기 최적화
- **데이터 우선순위 조정**
  - Primary: Bukit Timah 지역 (S121, S116, S118)
  - Secondary: Newton, Clementi 지역

## [1.4.0] - 2025-07-24

### 🚀 Added
- **Claude AI 이미지 분석 통합**
  - 웹캠 이미지 자동 날씨 분석
  - AI 기반 교통 상황 판단
  - 신뢰도 점수 시스템
- **WeatherAnalysisCard** 컴포넌트
  - AI 분석 결과 표시
  - 실시간 날씨 해석
  - 애니메이션 효과 추가

### 🔄 Changed
- **워크플로우 개선**
  - capture-webcam.yml에 Claude AI 분석 추가
  - 오류 처리 및 fallback 시스템 강화
  - 브라우저 캡처 비활성화 (GitHub Actions 최적화)

## [1.3.0] - 2025-07-23

### 🚀 Added
- **자동화 워크플로우 시스템**
  - `collect-weather.yml`: NEA Singapore API 자동 수집
  - `capture-webcam.yml`: 웹캠 이미지 자동 캡처
  - `deploy.yml`: GitHub Pages 자동 배포
- **데이터 수집 스크립트**
  - `scripts/collect-weather.js`
  - `scripts/capture-webcam.js`
- **오류 처리 시스템**
  - API 타임아웃 처리
  - 자동 재시도 로직
  - Fallback 데이터 시스템

### 🔄 Changed
- **아키텍처 전환**
  - JAMstack → GitHub-Native JAMstack
  - 서버리스 백엔드 (GitHub Actions)
  - 정적 호스팅 (GitHub Pages)

## [1.2.0] - 2025-07-22

### 🚀 Added
- **인터랙티브 지도 (MapView)**
  - React Leaflet 통합
  - 실시간 마커 시스템
  - 날씨 스테이션 위치 표시
- **웹캠 갤러리 시스템**
  - WebcamGallery, WebcamCard, WebcamModal
  - 실시간 이미지 업데이트
  - 모달 뷰어 기능

### 🔄 Changed
- **성능 최적화**
  - React.memo 적용
  - 컴포넌트 지연 로딩
  - 이미지 최적화

## [1.1.0] - 2025-07-21

### 🚀 Added
- **날씨 대시보드**
  - WeatherDashboard, WeatherCard, WeatherChart
  - Chart.js 통합 데이터 시각화
  - 실시간 온도, 습도, 강수량 표시
- **시스템 상태 모니터링**
  - LiveHeader, SystemFooter
  - 실시간 업데이트 상태
  - 시스템 메트릭 표시

### 🔄 Changed
- **UI/UX 개선**
  - Tailwind CSS 커스텀 테마
  - Singapore 브랜드 컬러 적용
  - 반응형 디자인 구현

## [1.0.0] - 2025-07-20

### 🚀 Added
- **초기 프로젝트 설정**
  - React 18.3.1 + Vite 4.5.14
  - Tailwind CSS 3.4.17
  - ESLint + Prettier 설정
- **기본 컴포넌트 구조**
  - App.jsx 메인 애플리케이션
  - 기본 레이아웃 컴포넌트
  - 오류 처리 시스템
- **외부 API 연동**
  - NEA Singapore Weather API
  - 기본 데이터 수집 시스템

### 🏗️ Technical
- **개발 환경**: Node.js 18.x, npm 9.x
- **빌드 시스템**: Vite (ES modules, HMR)
- **코드 품질**: ESLint, Prettier, PropTypes
- **스타일링**: Tailwind CSS, 커스텀 테마

---

## 🏷️ **Version Naming Convention**

```
MAJOR.MINOR.PATCH
├── MAJOR: 아키텍처 변경, 호환성 break
├── MINOR: 새로운 기능 추가
└── PATCH: 버그 수정, 성능 개선
```

## 📋 **Change Categories**

- **🚀 Added**: 새로운 기능
- **🔄 Changed**: 기존 기능 변경
- **🗑️ Deprecated**: 곧 제거될 기능
- **🔥 Removed**: 제거된 기능
- **🐛 Fixed**: 버그 수정
- **🔒 Security**: 보안 이슈 수정
- **🏗️ Technical**: 기술적 변경사항

## 🔗 **Links**

- **Repository**: [GitHub](https://github.com/djyalu/singapore_weather_cam)
- **Live Demo**: [Singapore Weather Cam](https://djyalu.github.io/singapore_weather_cam/)
- **Issues**: [GitHub Issues](https://github.com/djyalu/singapore_weather_cam/issues)
- **Documentation**: [Docs Folder](/docs)

---

**🤖 Generated with [Claude Code](https://claude.ai/code)**

**Co-Authored-By: Claude <noreply@anthropic.com>**