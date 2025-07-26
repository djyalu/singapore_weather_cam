# Singapore Weather Cam - 구현 가이드

## 빠른 시작

GitHub Pages와 Actions만으로 날씨 캠 애플리케이션을 구축하는 단계별 가이드입니다.

## 1단계: 저장소 설정

### GitHub Pages 활성화
```bash
# Settings > Pages
# Source: Deploy from a branch
# Branch: main
# Folder: / (root)
```

### 필요한 Secrets 설정
```bash
# Settings > Secrets and variables > Actions
WEATHER_API_KEY     # OpenWeatherMap API 키 (선택사항)
CLOUDINARY_URL      # Cloudinary URL (선택사항)
```

## 2단계: 프로젝트 구조 생성

```bash
# 프로젝트 초기화
npm init -y
npm install --save-dev vite @vitejs/plugin-react

# 디렉토리 생성
mkdir -p .github/workflows
mkdir -p scripts
mkdir -p src/components
mkdir -p data/weather
mkdir -p data/webcam/metadata
mkdir -p public/images
```

## 3단계: GitHub Actions 워크플로우

### 날씨 데이터 수집
```yaml
# .github/workflows/collect-weather.yml
name: Collect Weather Data
on:
  schedule:
    - cron: '*/5 * * * *'  # 5분마다
  workflow_dispatch:

jobs:
  collect-weather:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          token: ${{ secrets.GITHUB_TOKEN }}
      
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: |
          cd scripts
          npm install node-fetch
      
      - name: Collect Weather Data
        run: node scripts/collect-weather.js
        env:
          WEATHER_API_KEY: ${{ secrets.WEATHER_API_KEY }}
      
      - name: Commit and Push
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add data/weather/
          git diff --staged --quiet || (git commit -m "Update weather data [skip ci]" && git push)
```

### 웹캠 이미지 캡처
```yaml
# .github/workflows/capture-webcam.yml
name: Capture Webcam Images
on:
  schedule:
    - cron: '*/30 * * * *'  # 30분마다
  workflow_dispatch:

jobs:
  capture:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Chrome
        uses: browser-actions/setup-chrome@latest
      
      - name: Capture and Process Images
        run: |
          # Puppeteer를 사용한 스크린샷
          node scripts/capture-webcam.js
        env:
          CLOUDINARY_URL: ${{ secrets.CLOUDINARY_URL }}
      
      - name: Optimize Images
        run: |
          # GitHub Actions 내에서 이미지 최적화
          npx @squoosh/cli --webp auto \
            --resize '{width:1920,height:1080}' \
            public/images/temp/*.jpg \
            -d public/images/webcam/
      
      - name: Update Metadata
        run: node scripts/update-webcam-metadata.js
      
      - name: Commit Changes
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add data/webcam/ public/images/
          git diff --staged --quiet || (git commit -m "Update webcam images [skip ci]" && git push)
```

## 4단계: 데이터 수집 스크립트

### 날씨 데이터 수집기
```javascript
// scripts/collect-weather.js
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';

const WEATHER_APIS = {
  singapore: 'https://api.data.gov.sg/v1/environment/air-temperature',
  openweather: `https://api.openweathermap.org/data/2.5/weather?q=Singapore&appid=${process.env.WEATHER_API_KEY}`
};

async function collectWeatherData() {
  try {
    // NEA Singapore API 호출
    const response = await fetch(WEATHER_APIS.singapore);
    const data = await response.json();
    
    // 데이터 정규화
    const weatherData = {
      timestamp: new Date().toISOString(),
      temperature: data.items[0].readings[0].value,
      station: data.items[0].readings[0].station_id,
      metadata: data.metadata
    };
    
    // 파일 저장 경로 생성
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    
    const dirPath = path.join('data', 'weather', year.toString(), month, day);
    await fs.mkdir(dirPath, { recursive: true });
    
    // 시간별 데이터 저장
    const filePath = path.join(dirPath, `${hour}.json`);
    await fs.writeFile(filePath, JSON.stringify(weatherData, null, 2));
    
    // 최신 데이터 업데이트
    const latestPath = path.join('data', 'weather', 'latest.json');
    await fs.writeFile(latestPath, JSON.stringify(weatherData, null, 2));
    
    console.log('Weather data collected successfully');
  } catch (error) {
    console.error('Error collecting weather data:', error);
    process.exit(1);
  }
}

collectWeatherData();
```

### 웹캠 캡처 스크립트
```javascript
// scripts/capture-webcam.js
import puppeteer from 'puppeteer';
import fs from 'fs/promises';
import path from 'path';

const WEBCAM_SOURCES = [
  {
    name: 'marina-bay',
    url: 'https://www.earthcam.com/world/singapore/marinabay/',
    selector: '#cam-player'
  },
  {
    name: 'sentosa',
    url: 'https://www.sentosa.com.sg/webcam',
    selector: '.webcam-feed'
  }
];

async function captureWebcams() {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  for (const source of WEBCAM_SOURCES) {
    try {
      const page = await browser.newPage();
      await page.goto(source.url, { waitUntil: 'networkidle2' });
      
      // 웹캠 요소 대기
      await page.waitForSelector(source.selector, { timeout: 30000 });
      
      // 스크린샷 캡처
      const element = await page.$(source.selector);
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      const filename = `${source.name}-${timestamp}.jpg`;
      const filepath = path.join('public', 'images', 'temp', filename);
      
      await element.screenshot({ path: filepath });
      
      console.log(`Captured ${source.name} webcam`);
      await page.close();
    } catch (error) {
      console.error(`Error capturing ${source.name}:`, error);
    }
  }
  
  await browser.close();
}

captureWebcams();
```

## 5단계: 프론트엔드 구현

### 메인 애플리케이션
```jsx
// src/App.jsx
import React, { useState, useEffect } from 'react';
import WeatherDisplay from './components/WeatherDisplay';
import WebcamGallery from './components/WebcamGallery';
import RefreshIndicator from './components/RefreshIndicator';

function App() {
  const [weatherData, setWeatherData] = useState(null);
  const [webcamData, setWebcamData] = useState([]);
  const [lastUpdate, setLastUpdate] = useState(null);

  useEffect(() => {
    // 초기 데이터 로드
    loadData();
    
    // 5분마다 업데이트 확인
    const interval = setInterval(loadData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  async function loadData() {
    try {
      // 날씨 데이터 로드
      const weatherResponse = await fetch('/data/weather/latest.json');
      const weather = await weatherResponse.json();
      setWeatherData(weather);
      
      // 웹캠 메타데이터 로드
      const webcamResponse = await fetch('/data/webcam/metadata/latest.json');
      const webcam = await webcamResponse.json();
      setWebcamData(webcam.captures);
      
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Error loading data:', error);
    }
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-blue-600 text-white p-4">
        <h1 className="text-2xl font-bold">Singapore Weather Cam</h1>
        <RefreshIndicator lastUpdate={lastUpdate} onRefresh={loadData} />
      </header>
      
      <main className="container mx-auto p-4">
        <div className="grid md:grid-cols-2 gap-6">
          <WeatherDisplay data={weatherData} />
          <WebcamGallery images={webcamData} />
        </div>
      </main>
    </div>
  );
}

export default App;
```

### Progressive Web App 설정
```javascript
// src/serviceWorker.js
const CACHE_NAME = 'singapore-weather-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/static/css/main.css',
  '/static/js/main.js',
  '/data/weather/latest.json'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  // 네트워크 우선, 캐시 폴백 전략
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // 성공적인 응답을 캐시에 저장
        if (response && response.status === 200) {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              cache.put(event.request, responseToCache);
            });
        }
        return response;
      })
      .catch(() => {
        // 네트워크 실패 시 캐시에서 반환
        return caches.match(event.request);
      })
  );
});
```

## 6단계: 무료 외부 서비스 통합

### Cloudinary 이미지 최적화
```javascript
// src/utils/cloudinary.js
const CLOUDINARY_CLOUD_NAME = 'your-cloud-name';

export function getOptimizedImageUrl(publicId, options = {}) {
  const {
    width = 'auto',
    quality = 'auto',
    format = 'auto',
    dpr = 'auto'
  } = options;
  
  const transformations = [
    `w_${width}`,
    `q_${quality}`,
    `f_${format}`,
    `dpr_${dpr}`
  ].join(',');
  
  return `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/upload/${transformations}/${publicId}`;
}
```

### Web Push 알림
```javascript
// src/utils/notifications.js
export async function setupPushNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push notifications not supported');
    return;
  }
  
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(PUBLIC_VAPID_KEY)
    });
    
    // 구독 정보를 저장 (GitHub Gist 또는 외부 서비스)
    await saveSubscription(subscription);
  } catch (error) {
    console.error('Failed to subscribe:', error);
  }
}
```

## 7단계: 배포 및 모니터링

### GitHub Pages 자동 배포
```yaml
# .github/workflows/deploy.yml
name: Deploy to GitHub Pages
on:
  push:
    branches: [main]
  workflow_run:
    workflows: ["Collect Weather Data", "Capture Webcam Images"]
    types: [completed]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'
      
      - name: Install and Build
        run: |
          npm ci
          npm run build
      
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### 간단한 분석 추가
```javascript
// public/analytics.js
// 자체 구현 분석 (GitHub Gist에 저장)
(function() {
  const analytics = {
    pageView: () => {
      const data = {
        timestamp: new Date().toISOString(),
        page: window.location.pathname,
        referrer: document.referrer,
        userAgent: navigator.userAgent
      };
      
      // GitHub Gist API를 통해 저장
      fetch('https://api.github.com/gists/YOUR_GIST_ID', {
        method: 'PATCH',
        headers: {
          'Authorization': 'token YOUR_GITHUB_TOKEN',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          files: {
            'analytics.json': {
              content: JSON.stringify(data)
            }
          }
        })
      });
    }
  };
  
  window.analytics = analytics;
  analytics.pageView();
})();
```

## 8단계: 성능 최적화

### 이미지 지연 로딩
```jsx
// src/components/LazyImage.jsx
import { useState, useEffect, useRef } from 'react';

export default function LazyImage({ src, alt, placeholder }) {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [imageRef, setImageRef] = useState();

  useEffect(() => {
    let observer;
    
    if (imageRef && imageSrc === placeholder) {
      observer = new IntersectionObserver(
        entries => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              setImageSrc(src);
              observer.unobserve(imageRef);
            }
          });
        },
        { threshold: 0.1 }
      );
      observer.observe(imageRef);
    }
    
    return () => {
      if (observer && observer.unobserve) {
        observer.unobserve(imageRef);
      }
    };
  }, [imageRef, imageSrc, placeholder, src]);

  return (
    <img
      ref={setImageRef}
      src={imageSrc}
      alt={alt}
      loading="lazy"
    />
  );
}
```

## 다음 단계

1. **향상된 기능**
   - 날씨 예측 (기계학습 모델)
   - 다중 위치 지원
   - 사용자 설정 저장

2. **성능 개선**
   - CDN 최적화
   - 더 나은 캐싱 전략
   - 번들 크기 최소화

3. **사용자 경험**
   - 오프라인 모드 개선
   - 실시간 업데이트 표시
   - 인터랙티브 차트

이 가이드를 따라 구현하면 AWS 없이도 완전한 기능의 날씨 캠 애플리케이션을 만들 수 있습니다.