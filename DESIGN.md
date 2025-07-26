# Singapore Weather Cam System Design

## 프로젝트 개요
싱가포르의 실시간 날씨 정보와 웹캠 영상을 제공하는 웹 애플리케이션

## 시스템 아키텍처

### 선택된 아키텍처: JAMstack + GitHub Actions
- **Frontend**: 정적 사이트 (React/Vanilla JS)
- **Backend**: GitHub Actions (자동화된 데이터 수집)
- **Storage**: JSON 파일 (GitHub 저장소)
- **Hosting**: GitHub Pages
- **CDN**: GitHub 인프라 활용

### 아키텍처 선택 이유
1. **비용 효율성**: 모든 서비스가 무료 티어로 운영 가능
2. **유지보수 용이성**: 서버 관리 불필요
3. **자동화**: GitHub Actions로 정기적 데이터 업데이트
4. **확장성**: CDN을 통한 글로벌 배포
5. **버전 관리**: Git을 통한 모든 변경사항 추적

## 기술 스택

### Frontend
- **Framework**: React (정적 빌드) 또는 Vanilla JS
- **스타일링**: Tailwind CSS
- **지도**: Leaflet.js
- **빌드 도구**: Vite
- **차트**: Chart.js (날씨 트렌드 시각화)

### Backend (GitHub Actions)
- **런타임**: Node.js
- **웹 스크래핑**: Puppeteer
- **날씨 API**: OpenWeatherMap / Weather.gov.sg
- **이미지 분석**: Claude API
- **스케줄링**: Cron (GitHub Actions)

### 데이터 저장
- **형식**: JSON 파일
- **구조**: 
  ```json
  {
    "timestamp": "2024-01-01T12:00:00Z",
    "weather": {
      "temperature": 28,
      "humidity": 85,
      "conditions": "partly cloudy"
    },
    "webcam": {
      "imageUrl": "/images/2024-01-01-12-00.jpg",
      "analysis": "Clear visibility, moderate traffic"
    }
  }
  ```

## 주요 컴포넌트

### 1. Weather Collector (GitHub Action)
- 매 시간 실행
- Weather.gov.sg API에서 데이터 수집
- JSON 파일로 저장

### 2. Webcam Capture (GitHub Action)
- 매 30분 실행
- 공개 웹캠 또는 YouTube 라이브 스트림에서 캡처
- 이미지 최적화 후 저장

### 3. Frontend Application
- 실시간 날씨 정보 표시
- 웹캠 이미지 갤러리
- 인터랙티브 지도
- 날씨 트렌드 차트

### 4. Claude Integration
- 웹캠 이미지 분석
- 날씨 상황 설명 생성
- 트렌드 예측

## 보안 고려사항
1. **API 키 보호**: GitHub Secrets 사용
2. **CORS 설정**: 적절한 도메인 제한
3. **Rate Limiting**: API 호출 제한 준수
4. **데이터 검증**: 입력 데이터 유효성 검사

## 성능 최적화
1. **이미지 최적화**: WebP 형식, 적절한 압축
2. **캐싱**: 브라우저 캐시 활용
3. **Lazy Loading**: 이미지 지연 로딩
4. **정적 생성**: 빌드 시 페이지 사전 생성

## 배포 전략
1. **개발**: feature 브랜치에서 작업
2. **테스트**: PR을 통한 코드 리뷰
3. **배포**: main 브랜치 머지 시 자동 배포
4. **롤백**: Git 리버트를 통한 즉시 롤백 가능

## 모니터링
1. **GitHub Actions 로그**: 자동화 작업 모니터링
2. **에러 추적**: Sentry 무료 티어 활용
3. **분석**: Google Analytics

## 향후 확장 가능성
1. **다중 위치 지원**: 여러 도시 추가
2. **예측 기능**: ML 모델 통합
3. **알림 기능**: 날씨 변화 알림
4. **API 제공**: 외부 개발자를 위한 API