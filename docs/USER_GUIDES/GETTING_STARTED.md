# 🚀 Singapore Weather Cam 시작 가이드

## 개요

Singapore Weather Cam은 싱가포르의 실시간 날씨와 교통 상황을 모니터링하는 웹 애플리케이션입니다.

## 📋 전제 조건

- Node.js 18+ 
- npm 9+
- Git

## 🎯 5분 빠른 시작

### 1단계: 프로젝트 설정
```bash
# 저장소 클론
git clone https://github.com/djyalu/singapore_weather_cam.git
cd singapore_weather_cam

# 의존성 설치  
npm install

# 개발 서버 실행
npm run dev
```

### 2단계: 브라우저에서 확인
- 개발 서버: http://localhost:5173
- 실시간 날씨 데이터 확인
- 8개 지역 선택 및 90개 교통 카메라 보기

### 3단계: 프로덕션 빌드 (선택사항)
```bash
# 프로덕션 빌드
npm run build

# 빌드 미리보기
npm run preview
```

## 🌟 주요 기능

### 실시간 날씨 모니터링
- **59개 NEA 관측소** 실시간 데이터
- **8개 주요 지역** 선택 시스템
- **자동 새로고침** 매 5분

### 교통 상황 모니터링  
- **90개 교통 카메라** 실시간 이미지
- **HD 품질** (1920x1080) 79개 카메라
- **지역별 필터링** 시스템

### 인터랙티브 지도
- **OpenStreetMap** 기반
- **온도 히트맵** 오버레이
- **실시간 카메라 위치** 표시

## 🔧 개발 명령어

```bash
# 개발 서버 (HMR 지원)
npm run dev

# 프로덕션 빌드
npm run build  

# 빌드 미리보기
npm run preview

# 코드 린팅
npm run lint

# 코드 포맷팅
npm run format

# 데이터 수집 (수동)
npm run collect-weather
npm run capture-webcam
```

## 📱 모바일 지원

- **반응형 디자인**: 320px ~ 1920px 완전 지원
- **터치 최적화**: 48px 최소 터치 타겟
- **접근성**: WCAG 2.1 AA 준수
- **성능**: PWA 지원, 오프라인 캐싱

## 🆘 문제 해결

### 개발 서버가 시작되지 않는 경우
```bash
# Node.js 버전 확인
node --version  # 18+ 필요

# 캐시 정리 후 재설치
rm -rf node_modules package-lock.json
npm install
```

### 데이터가 로딩되지 않는 경우
```bash
# 수동 데이터 새로고침
npm run collect-weather

# 또는 브라우저에서 새로고침 버튼 클릭
```

### 빌드 오류가 발생하는 경우
```bash
# 린트 오류 확인 및 수정
npm run lint
npm run format

# 타입 오류 확인
npm run build
```

## 📚 다음 단계

- [전체 기능 가이드](FEATURES.md)
- [개발 환경 설정](../DEVELOPMENT/SETUP.md)  
- [API 문서](../API/)
- [기여하기](../DEVELOPMENT/CONTRIBUTING.md)

## 🔗 유용한 링크

- **라이브 사이트**: https://djyalu.github.io/singapore_weather_cam
- **GitHub 저장소**: https://github.com/djyalu/singapore_weather_cam
- **이슈 신고**: https://github.com/djyalu/singapore_weather_cam/issues

---

**💡 팁**: 이 가이드로 5분 안에 싱가포르의 실시간 날씨를 확인할 수 있습니다!