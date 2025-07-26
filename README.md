# Singapore Weather Cam 🌤️📹

실시간 싱가포르 날씨 정보와 웹캠 영상을 제공하는 웹 애플리케이션입니다.

## 주요 기능

- 🌡️ 실시간 날씨 정보 (온도, 습도, 강수량)
- 📸 정기적인 웹캠 캡처 및 분석
- 🗺️ 인터랙티브 지도
- 📊 날씨 트렌드 차트
- 🤖 AI 기반 날씨 상황 분석

## 기술 스택

- **Frontend**: React + Vite + Tailwind CSS
- **Maps**: Leaflet.js
- **Charts**: Chart.js
- **Backend**: GitHub Actions (서버리스)
- **AI**: Claude API
- **Hosting**: GitHub Pages

## 시작하기

### 필수 요구사항
- Node.js 18+
- GitHub 계정
- Claude API 키 (선택사항)

### 설치
```bash
npm install
```

### 개발 서버 실행
```bash
npm run dev
```

### 빌드
```bash
npm run build
```

## 환경 설정

GitHub Secrets에 다음 값들을 설정하세요:
- `CLAUDE_API_KEY`: Claude API 키 (선택사항)
- `OPENWEATHER_API_KEY`: OpenWeatherMap API 키 (백업용)

## 프로젝트 구조
```
singapore-weather-cam/
├── .github/workflows/    # GitHub Actions 워크플로우
├── scripts/             # 데이터 수집 스크립트
├── src/                 # React 소스 코드
│   ├── components/      # React 컴포넌트
│   └── utils/          # 유틸리티 함수
├── data/               # 수집된 데이터 (JSON)
│   ├── weather/        # 날씨 데이터
│   └── webcam/         # 웹캠 데이터
└── public/             # 정적 파일
    └── images/         # 웹캠 이미지
```

## 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 라이선스

MIT License