# Singapore Weather Cam - GitHub-Centric Architecture

## 개요

AWS 없이 GitHub 생태계와 무료 외부 서비스를 활용한 완전한 서버리스 아키텍처입니다.

## 핵심 원칙

1. **Zero Infrastructure Cost**: 서버 관리 비용 0원
2. **GitHub Native**: GitHub 기능 최대 활용
3. **External API Integration**: 무료 티어 외부 서비스 활용
4. **Progressive Enhancement**: 점진적 기능 향상
5. **Data Persistence**: Git을 통한 데이터 버전 관리

## 시스템 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                        사용자 접근                            │
├─────────────────────────────────────────────────────────────┤
│                    GitHub Pages (CDN)                        │
│                 singapore-weather-cam.github.io              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     정적 웹 애플리케이션                      │
├─────────────────┬─────────────────┬────────────────────────┤
│   React SPA     │   Vanilla JS    │    Progressive Web App  │
│   (Modern)      │   (Lightweight) │    (Offline Support)    │
└─────────────────┴─────────────────┴────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      데이터 소스 (JSON)                       │
├─────────────────┬─────────────────┬────────────────────────┤
│  Weather Data   │  Webcam Images  │   Analytics Data       │
│  /data/weather/ │  /data/webcam/  │   /data/analytics/     │
└─────────────────┴─────────────────┴────────────────────────┘
                              ▲
                              │
┌─────────────────────────────────────────────────────────────┐
│                    GitHub Actions Workflows                   │
├─────────────────┬─────────────────┬────────────────────────┤
│ Weather Collect │ Webcam Capture  │   Data Processing      │
│ (1분 간격)      │ (30분 간격)     │   (이벤트 기반)        │
└─────────────────┴─────────────────┴────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      외부 서비스 통합                         │
├──────────────┬──────────────┬──────────────┬───────────────┤
│ Weather APIs │ Image CDN    │ Analytics    │ Notification  │
│ NEA/OpenWea. │ Cloudinary   │ Plausible.io │ Web Push API  │
└──────────────┴──────────────┴──────────────┴───────────────┘
```

## 데이터 플로우

### 1. 날씨 데이터 수집
```yaml
Trigger: GitHub Actions Schedule (매 5분)
Flow:
  1. Weather API 호출 (NEA Singapore)
  2. 데이터 정규화 및 검증
  3. JSON 파일 생성/업데이트
  4. Git commit & push
  5. GitHub Pages 자동 배포
```

### 2. 웹캠 이미지 처리
```yaml
Trigger: GitHub Actions Schedule (매 30분)
Flow:
  1. 공개 웹캠/YouTube 스트림 캡처
  2. 이미지 최적화 (GitHub Actions 내)
  3. Cloudinary 업로드 (무료 25GB)
  4. 메타데이터 JSON 업데이트
  5. Git commit & push
```

### 3. 실시간성 구현
```yaml
Strategy: Polling + Service Worker
Implementation:
  1. Service Worker 백그라운드 동기화
  2. 클라이언트 사이드 폴링 (1-5분)
  3. GitHub API Rate Limit 고려
  4. 로컬 스토리지 캐싱
```

## 기술 스택 상세

### Frontend
```javascript
// 옵션 1: React (모던 접근)
{
  "framework": "React 18",
  "bundler": "Vite",
  "styling": "Tailwind CSS",
  "state": "Zustand",
  "data-fetching": "SWR",
  "pwa": "Workbox"
}

// 옵션 2: Vanilla JS (경량화)
{
  "framework": "None",
  "bundler": "esbuild",
  "styling": "CSS Modules",
  "state": "LocalStorage",
  "data-fetching": "Fetch API",
  "pwa": "Service Worker"
}
```

### GitHub Actions
```yaml
# .github/workflows/weather-collector.yml
name: Collect Weather Data
on:
  schedule:
    - cron: '*/5 * * * *'  # 5분마다
  workflow_dispatch:       # 수동 트리거

jobs:
  collect:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Collect Weather Data
        run: |
          node scripts/collect-weather.js
        env:
          WEATHER_API_KEY: ${{ secrets.WEATHER_API_KEY }}
      
      - name: Commit Changes
        run: |
          git config user.name "Weather Bot"
          git config user.email "bot@noreply.github.com"
          git add data/
          git diff --staged --quiet || git commit -m "Update weather data [skip ci]"
          git push
```

### 데이터 저장 구조
```
repository/
├── data/
│   ├── weather/
│   │   ├── 2024/
│   │   │   ├── 01/
│   │   │   │   ├── 01.json    # 일별 집계
│   │   │   │   └── 01/        # 시간별 데이터
│   │   │   │       ├── 00.json
│   │   │   │       └── 23.json
│   │   └── latest.json         # 최신 데이터
│   ├── webcam/
│   │   └── metadata/
│   │       └── 2024/
│   └── index.json              # 전체 인덱스
```

## 외부 서비스 통합

### 1. 날씨 데이터
- **Primary**: [NEA Singapore API](https://data.gov.sg) (무료, 무제한)
- **Backup**: [OpenWeatherMap](https://openweathermap.org) (무료 1000 calls/day)
- **Enhancement**: [WeatherAPI](https://weatherapi.com) (무료 1M calls/month)

### 2. 이미지 저장/처리
- **Cloudinary**: 무료 25GB 저장, 25GB 대역폭/월
- **ImageKit.io**: 무료 20GB 저장, 20GB 대역폭/월
- **Statically**: GitHub 이미지 CDN (무제한)

### 3. 실시간 알림
- **Web Push API**: 브라우저 네이티브 (무료)
- **OneSignal**: 무료 10,000 구독자
- **Pusher Beams**: 무료 1000 구독자/월

### 4. 분석
- **Plausible.io**: 가벼운 분석 (무료 체험)
- **Umami**: 자체 호스팅 가능 (Vercel 무료)
- **Google Analytics**: 무료

### 5. 검색
- **Algolia**: 무료 10,000 검색/월
- **MeiliSearch**: 자체 호스팅 (Railway 무료)
- **Client-side search**: Fuse.js

## 성능 최적화

### 1. 정적 사이트 최적화
```javascript
// 빌드 시 데이터 프리페칭
export async function getStaticProps() {
  const weatherData = await fetch('/data/weather/latest.json');
  const webcamData = await fetch('/data/webcam/latest.json');
  
  return {
    props: {
      weather: await weatherData.json(),
      webcam: await webcamData.json(),
      buildTime: new Date().toISOString()
    }
  };
}
```

### 2. 이미지 최적화
```yaml
Cloudinary 변환:
  - Format: Auto (WebP/AVIF)
  - Quality: Auto
  - Resize: Responsive
  - Loading: Lazy
  
URL 예시:
  https://res.cloudinary.com/demo/image/upload/
  f_auto,q_auto,w_auto,dpr_auto/weather-cam.jpg
```

### 3. 캐싱 전략
```javascript
// Service Worker 캐싱
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/data/weather/latest.json')) {
    event.respondWith(
      caches.open('weather-v1').then(cache =>
        cache.match(event.request).then(response =>
          response || fetch(event.request).then(fetchResponse => {
            cache.put(event.request, fetchResponse.clone());
            return fetchResponse;
          })
        )
      )
    );
  }
});
```

## 실시간성 해결 방안

### 1. Hybrid Polling
```javascript
// 적응형 폴링 간격
class AdaptivePoller {
  constructor() {
    this.interval = 60000; // 1분 시작
    this.maxInterval = 300000; // 최대 5분
    this.minInterval = 30000; // 최소 30초
  }
  
  async poll() {
    const lastUpdate = await this.checkLastUpdate();
    const timeSinceUpdate = Date.now() - lastUpdate;
    
    // 최근 업데이트가 있으면 간격 줄임
    if (timeSinceUpdate < 300000) { // 5분 이내
      this.interval = Math.max(this.minInterval, this.interval / 2);
    } else {
      this.interval = Math.min(this.maxInterval, this.interval * 1.5);
    }
    
    setTimeout(() => this.poll(), this.interval);
  }
}
```

### 2. GitHub API 활용
```javascript
// 저장소 업데이트 감지
async function checkForUpdates() {
  const response = await fetch(
    'https://api.github.com/repos/user/singapore-weather-cam/commits/main',
    {
      headers: {
        'If-None-Match': localStorage.getItem('github-etag')
      }
    }
  );
  
  if (response.status === 200) {
    localStorage.setItem('github-etag', response.headers.get('ETag'));
    return true; // 새 업데이트 있음
  }
  
  return false;
}
```

### 3. Progressive Web App
```javascript
// 백그라운드 동기화
self.addEventListener('sync', async (event) => {
  if (event.tag === 'weather-sync') {
    event.waitUntil(
      updateWeatherData()
    );
  }
});

// 주기적 백그라운드 동기화 (실험적 기능)
async function registerPeriodicSync() {
  const registration = await navigator.serviceWorker.ready;
  try {
    await registration.periodicSync.register('weather-update', {
      minInterval: 5 * 60 * 1000 // 5분
    });
  } catch (err) {
    console.log('Periodic sync not supported');
  }
}
```

## 비용 분석

### 완전 무료 구성
```yaml
호스팅: GitHub Pages (무료)
CI/CD: GitHub Actions (2000분/월 무료)
날씨 API: NEA Singapore (무료)
이미지 CDN: Statically + GitHub (무료)
분석: 자체 구현 (무료)
도메인: github.io 서브도메인 (무료)

월 비용: $0
```

### 향상된 구성 ($0-10/월)
```yaml
호스팅: GitHub Pages (무료)
CI/CD: GitHub Actions (추가 시간 구매)
날씨 API: NEA + OpenWeatherMap Pro ($0)
이미지 CDN: Cloudinary (무료 티어)
분석: Plausible ($9/월)
도메인: 커스텀 도메인 ($1/월)
알림: OneSignal (무료)

월 비용: ~$10
```

## 제한사항 및 해결방안

### 1. GitHub Actions 제한
- **무료 한도**: 2000분/월
- **해결방안**: 
  - 효율적인 워크플로우 (평균 1분/실행)
  - 조건부 실행 (변경사항 있을 때만)
  - 로컬 개발로 테스트 최소화

### 2. API Rate Limits
- **GitHub API**: 60 requests/hour (미인증)
- **해결방안**:
  - 정적 파일 직접 접근
  - 클라이언트 사이드 캐싱
  - ETag 활용

### 3. 실시간성
- **한계**: 진정한 실시간 불가
- **해결방안**:
  - 5분 간격 업데이트
  - 예측 프리페칭
  - 사용자 경험 최적화

## 구현 로드맵

### Phase 1: MVP (1-2주)
- [ ] 기본 GitHub Actions 설정
- [ ] 날씨 데이터 수집 스크립트
- [ ] 정적 HTML 페이지
- [ ] GitHub Pages 배포

### Phase 2: 향상 (3-4주)
- [ ] React SPA 전환
- [ ] PWA 기능 추가
- [ ] 이미지 CDN 통합
- [ ] 기본 분석 추가

### Phase 3: 최적화 (5-6주)
- [ ] 성능 최적화
- [ ] 오프라인 지원
- [ ] 알림 시스템
- [ ] 다국어 지원

## 결론

이 아키텍처는 AWS 없이도 완전한 기능의 날씨 캠 애플리케이션을 구현할 수 있습니다. GitHub의 무료 기능과 외부 서비스의 무료 티어를 최대한 활용하여 비용을 0원에 가깝게 유지하면서도 확장 가능한 시스템을 구축합니다.