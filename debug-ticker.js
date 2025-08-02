// 브라우저 콘솔에서 실행할 디버깅 코드
console.log('=== WeatherAlertTicker 디버깅 ===');

// 1. 전역 weather data 확인
console.log('1. Global weatherData:', window.weatherData);

// 2. 티커 컴포넌트 상태 확인
const tickerElement = document.querySelector('[class*="AlertTicker"]');
console.log('2. Ticker element:', tickerElement);

// 3. NEA Alert Service 확인
try {
  // 수동으로 weather data 로드 테스트
  fetch('/singapore_weather_cam/data/weather/latest.json')
    .then(response => {
      console.log('3. API Response status:', response.status);
      return response.json();
    })
    .then(data => {
      console.log('4. Weather data loaded:', data);
      console.log('5. Temperature readings:', data.data?.temperature?.readings?.length);
      console.log('6. Humidity readings:', data.data?.humidity?.readings?.length);
      console.log('7. Rainfall readings:', data.data?.rainfall?.readings?.length);
      
      // 수동으로 alerts 생성 테스트
      if (data.data?.temperature?.readings) {
        const tempReadings = data.data.temperature.readings;
        const avgTemp = tempReadings.reduce((sum, r) => sum + r.value, 0) / tempReadings.length;
        console.log('8. Expected ticker message:', `현재 기온 ${avgTemp.toFixed(1)}°C • ${tempReadings.length}개 관측소 평균`);
      }
    })
    .catch(error => {
      console.error('❌ Data loading failed:', error);
    });
} catch (error) {
  console.error('❌ Fetch error:', error);
}

// 4. React 에러 확인
console.log('9. React errors in console:', console.error);