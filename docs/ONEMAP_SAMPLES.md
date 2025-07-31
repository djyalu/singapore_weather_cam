# 🗺️ Singapore OneMap API 샘플 가이드

Singapore 정부 공식 지도 서비스인 OneMap을 활용한 실제 구현 예제입니다.

## 📋 목차
1. [API 키 발급](#api-키-발급)
2. [기본 사용법](#기본-사용법)
3. [지도 스타일](#지도-스타일)
4. [고급 기능](#고급-기능)
5. [실제 구현 예제](#실제-구현-예제)

## 🔑 API 키 발급

### 1. OneMap 계정 생성
```
https://www.onemap.sg/apidocs/apikeyApi
```

### 2. 환경 변수 설정
```bash
# .env.local 파일에 추가
REACT_APP_ONEMAP_EMAIL=your-email@example.com
REACT_APP_ONEMAP_PASSWORD=your-password
```

### 3. 인증 토큰 획득
```javascript
const getOneMapToken = async () => {
  const response = await fetch('https://www.onemap.gov.sg/api/auth/post/getToken', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: process.env.REACT_APP_ONEMAP_EMAIL,
      password: process.env.REACT_APP_ONEMAP_PASSWORD
    })
  });
  
  const data = await response.json();
  return data.access_token;
};
```

## 🗺️ 기본 사용법

### 1. 기본 지도 타일
```javascript
// Leaflet 기본 설정
const map = L.map('map').setView([1.3521, 103.8198], 13);

// OneMap 타일 레이어
L.tileLayer('https://maps-{s}.onemap.sg/v3/Default/{z}/{x}/{y}.png', {
  attribution: '© OneMap © Singapore Land Authority',
  subdomains: ['a', 'b', 'c', 'd']
}).addTo(map);
```

### 2. React 컴포넌트 예제
```jsx
import { useEffect, useRef } from 'react';

const OneMapComponent = () => {
  const mapRef = useRef(null);

  useEffect(() => {
    const map = L.map(mapRef.current).setView([1.3521, 103.8198], 13);
    
    L.tileLayer('https://maps-{s}.onemap.sg/v3/Default/{z}/{x}/{y}.png', {
      attribution: '© OneMap © Singapore Land Authority'
    }).addTo(map);
    
    return () => map.remove();
  }, []);

  return <div ref={mapRef} style={{ height: '400px', width: '100%' }} />;
};
```

## 🎨 지도 스타일

### 사용 가능한 스타일
```javascript
const mapStyles = {
  Default: 'https://maps-{s}.onemap.sg/v3/Default/{z}/{x}/{y}.png',
  Night: 'https://maps-{s}.onemap.sg/v3/Night/{z}/{x}/{y}.png',
  Original: 'https://maps-{s}.onemap.sg/v3/Original/{z}/{x}/{y}.png',
  Grey: 'https://maps-{s}.onemap.sg/v3/Grey/{z}/{x}/{y}.png',
  Satellite: 'https://maps-{s}.onemap.sg/v3/Satellite/{z}/{x}/{y}.png'
};
```

### 스타일 전환 기능
```javascript
const switchMapStyle = (map, styleName) => {
  // 기존 타일 레이어 제거
  map.eachLayer(layer => {
    if (layer instanceof L.TileLayer) {
      map.removeLayer(layer);
    }
  });
  
  // 새 스타일 적용
  L.tileLayer(mapStyles[styleName], {
    attribution: '© OneMap © Singapore Land Authority'
  }).addTo(map);
};
```

## 🚀 고급 기능

### 1. 주소 검색 (Geocoding)
```javascript
const searchAddress = async (query) => {
  const response = await fetch(
    `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${encodeURIComponent(query)}&returnGeom=Y&getAddrDetails=Y`
  );
  
  const data = await response.json();
  return data.results;
};

// 사용 예제
const results = await searchAddress('Marina Bay Sands');
console.log(results[0]); // 첫 번째 검색 결과
```

### 2. 역 지오코딩 (좌표 → 주소)
```javascript
const reverseGeocode = async (lat, lng, token) => {
  const response = await fetch(
    `https://www.onemap.gov.sg/api/public/revgeocode?location=${lat},${lng}&token=${token}&buffer=10&addressType=All`
  );
  
  const data = await response.json();
  return data.GeocodeInfo;
};
```

### 3. 경로 찾기
```javascript
const getRoute = async (startLat, startLng, endLat, endLng, token) => {
  const response = await fetch(
    `https://www.onemap.gov.sg/api/public/routingsvc/route?start=${startLat},${startLng}&end=${endLat},${endLng}&routeType=drive&token=${token}`
  );
  
  const data = await response.json();
  return data;
};
```

### 4. 인근 시설 검색
```javascript
const searchNearby = async (lat, lng, category, token) => {
  // category: hdb, school, park, hospital 등
  const response = await fetch(
    `https://www.onemap.gov.sg/api/public/popapi/getAllPlanningarea?token=${token}`
  );
  
  const data = await response.json();
  return data;
};
```

## 🎯 실제 구현 예제

### 1. 완전한 OneMap 컴포넌트
```jsx
import React, { useEffect, useRef, useState } from 'react';

const AdvancedOneMap = () => {
  const mapRef = useRef(null);
  const [map, setMap] = useState(null);
  const [currentStyle, setCurrentStyle] = useState('Default');
  const [searchResults, setSearchResults] = useState([]);

  // 지도 초기화
  useEffect(() => {
    const leafletMap = L.map(mapRef.current, {
      center: [1.3521, 103.8198], // Singapore CBD
      zoom: 13
    });

    L.tileLayer('https://maps-{s}.onemap.sg/v3/Default/{z}/{x}/{y}.png', {
      attribution: '© OneMap © Singapore Land Authority',
      subdomains: ['a', 'b', 'c', 'd']
    }).addTo(leafletMap);

    setMap(leafletMap);

    return () => leafletMap.remove();
  }, []);

  // 주소 검색
  const handleSearch = async (query) => {
    try {
      const response = await fetch(
        `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${encodeURIComponent(query)}`
      );
      const data = await response.json();
      setSearchResults(data.results || []);
      
      // 첫 번째 결과로 지도 이동
      if (data.results?.[0]) {
        const { LATITUDE, LONGITUDE } = data.results[0];
        map?.setView([parseFloat(LATITUDE), parseFloat(LONGITUDE)], 16);
        
        // 마커 추가
        L.marker([parseFloat(LATITUDE), parseFloat(LONGITUDE)])
          .addTo(map)
          .bindPopup(data.results[0].SEARCHVAL)
          .openPopup();
      }
    } catch (error) {
      console.error('검색 실패:', error);
    }
  };

  // 스타일 변경
  const changeStyle = (styleName) => {
    if (!map) return;
    
    map.eachLayer(layer => {
      if (layer instanceof L.TileLayer) {
        map.removeLayer(layer);
      }
    });
    
    L.tileLayer(`https://maps-{s}.onemap.sg/v3/${styleName}/{z}/{x}/{y}.png`, {
      attribution: '© OneMap © Singapore Land Authority',
      subdomains: ['a', 'b', 'c', 'd']
    }).addTo(map);
    
    setCurrentStyle(styleName);
  };

  return (
    <div className="relative">
      {/* 검색 바 */}
      <div className="absolute top-4 left-4 z-10 bg-white rounded-lg shadow-lg p-3">
        <input
          type="text"
          placeholder="주소나 장소명 검색..."
          className="w-64 px-3 py-2 border border-gray-300 rounded"
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              handleSearch(e.target.value);
            }
          }}
        />
      </div>

      {/* 스타일 선택기 */}
      <div className="absolute top-4 right-4 z-10 bg-white rounded-lg shadow-lg p-2">
        {['Default', 'Satellite', 'Night', 'Grey'].map(style => (
          <button
            key={style}
            onClick={() => changeStyle(style)}
            className={`block w-full text-left px-3 py-1 rounded text-sm ${
              currentStyle === style ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'
            }`}
          >
            {style}
          </button>
        ))}
      </div>

      {/* 지도 */}
      <div ref={mapRef} className="w-full h-96" />

      {/* 검색 결과 */}
      {searchResults.length > 0 && (
        <div className="mt-4 bg-white rounded-lg shadow p-4">
          <h3 className="font-bold mb-2">검색 결과</h3>
          {searchResults.slice(0, 5).map((result, index) => (
            <div key={index} className="py-1 border-b">
              <div className="font-medium">{result.SEARCHVAL}</div>
              <div className="text-sm text-gray-600">{result.ADDRESS}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdvancedOneMap;
```

### 2. 날씨 데이터와 연동
```jsx
const WeatherOneMap = ({ weatherData }) => {
  const addWeatherOverlay = (map) => {
    weatherData?.locations?.forEach(station => {
      if (station.coordinates) {
        const { lat, lng } = station.coordinates;
        const temp = station.temperature;
        
        // 온도별 색상
        const color = temp >= 32 ? '#ef4444' : 
                     temp >= 30 ? '#f97316' : 
                     temp >= 28 ? '#eab308' : '#22c55e';
        
        // 온도 히트맵 원
        L.circle([lat, lng], {
          color: color,
          fillColor: color,
          fillOpacity: 0.3,
          radius: 2000
        }).addTo(map);
        
        // 온도 마커
        L.marker([lat, lng])
          .addTo(map)
          .bindPopup(`
            <b>${station.name}</b><br>
            온도: ${temp}°C<br>
            습도: ${station.humidity}%
          `);
      }
    });
  };
  
  // 지도 초기화 시 날씨 오버레이 추가
  useEffect(() => {
    if (map && weatherData) {
      addWeatherOverlay(map);
    }
  }, [map, weatherData]);
};
```

## 📊 장점과 특징

### ✅ OneMap 장점
- **정확성**: Singapore 정부 공식 데이터
- **최신성**: 정기적인 업데이트
- **완전성**: 모든 Singapore 지역 커버
- **무료**: 기본 기능 무료 사용
- **다양성**: 5가지 지도 스타일

### 📋 API 제한사항
- **인증 필요**: 고급 기능에 토큰 필요
- **요청 제한**: 분당 요청 수 제한
- **지역 제한**: Singapore 지역만 상세 데이터

### 🔧 최적화 팁
- 토큰 캐싱으로 API 호출 최소화
- 타일 요청 최적화
- 에러 처리 및 폴백 구현

이제 OneMap을 활용하여 정확하고 상세한 Singapore 지도 서비스를 구축할 수 있습니다!