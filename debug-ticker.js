// 브라우저 콘솔에서 실행할 티커 디버깅 스크립트
async function debugTicker() {
  console.log('🔍 Ticker 디버깅 시작...');
  
  try {
    // 1. 데이터 fetch 테스트
    console.log('1️⃣ 데이터 로딩 시도...');
    const response = await fetch('/singapore_weather_cam/data/weather/latest.json?t=' + Date.now());
    console.log('Response status:', response.status, response.ok);
    
    if (response.ok) {
      const data = await response.json();
      console.log('✅ 데이터 로딩 성공');
      console.log('📊 온도 데이터:', data.data?.temperature?.readings?.length, '개');
      console.log('📊 습도 데이터:', data.data?.humidity?.readings?.length, '개');  
      console.log('📊 강수 데이터:', data.data?.rainfall?.readings?.length, '개');
      
      // 2. 실제 계산 테스트
      if (data.data?.temperature?.readings?.length > 0) {
        const tempReadings = data.data.temperature.readings;
        const avgTemp = tempReadings.reduce((sum, r) => sum + r.value, 0) / tempReadings.length;
        console.log('🌡️ 계산된 평균 온도:', avgTemp.toFixed(1) + '°C');
        console.log('🌡️ 온도 범위:', Math.min(...tempReadings.map(r => r.value)).toFixed(1) + '°C ~ ' + Math.max(...tempReadings.map(r => r.value)).toFixed(1) + '°C');
      }
      
      // 3. 티커 컴포넌트 확인
      console.log('3️⃣ 티커 컴포넌트 상태 확인...');
      const tickerElements = document.querySelectorAll('[class*="WeatherAlertTicker"], [class*="ticker"]');
      console.log('티커 엘리먼트 수:', tickerElements.length);
      
      // 4. React 상태 확인 (개발 도구에서만 가능)
      if (window.React) {
        console.log('⚛️ React 감지됨');
      }
      
      return data;
    } else {
      console.error('❌ 데이터 로딩 실패:', response.status);
    }
  } catch (error) {
    console.error('🚨 오류 발생:', error);
  }
}

// 실행
debugTicker();
