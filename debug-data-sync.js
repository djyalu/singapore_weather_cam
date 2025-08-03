/**
 * --ultrathink 모드 데이터 동기화 문제 분석
 * 티커와 Singapore Weather의 온도 불일치 원인 파악
 */

import neaRealTimeService from './src/services/neaRealTimeService.js';

console.log('🧠 --ultrathink 모드: 데이터 동기화 문제 심층 분석 시작...');

async function analyzeDataSyncIssue() {
  try {
    console.log('📊 현재 실시간 NEA 데이터 수집...');
    
    // 1. NEA Real-Time Service에서 직접 데이터 가져오기
    const freshNeaData = await neaRealTimeService.getRealTimeWeatherData();
    
    if (!freshNeaData) {
      console.error('❌ NEA 실시간 데이터를 가져올 수 없습니다');
      return;
    }

    console.log('🔍 데이터 소스 분석:');
    console.log('- 타임스탬프:', freshNeaData.timestamp);
    console.log('- 데이터 소스:', freshNeaData.source);
    console.log('- 관측소 수:', freshNeaData.stations_used?.length);
    
    // 2. 온도 계산 방법별 결과 비교
    if (freshNeaData.data?.temperature?.readings?.length > 0) {
      const tempReadings = freshNeaData.data.temperature.readings;
      
      console.log('\n🌡️ 온도 계산 방법별 결과:');
      
      // 방법 1: NEA API에서 미리 계산된 값
      const preCalculatedTemp = freshNeaData.data.temperature.average;
      console.log('1️⃣ NEA API 미리 계산된 값:', preCalculatedTemp?.toFixed(3) || 'null');
      
      // 방법 2: 개별 readings를 직접 평균 계산
      const manualCalculatedTemp = tempReadings.reduce((sum, r) => sum + r.value, 0) / tempReadings.length;
      console.log('2️⃣ 개별 readings 평균 계산:', manualCalculatedTemp.toFixed(3));
      
      // 방법 3: WeatherAlertTicker 방식 (우선순위 로직)
      const tickerTemp = (preCalculatedTemp !== undefined && preCalculatedTemp !== null)
        ? preCalculatedTemp
        : manualCalculatedTemp;
      console.log('3️⃣ WeatherAlertTicker 방식:', tickerTemp.toFixed(3));
      
      // 방법 4: SingaporeOverallWeather 방식 시뮬레이션
      // (independentWeatherData가 있다면 그것을 사용, 없으면 같은 로직)
      const singaporeTemp = (preCalculatedTemp !== undefined && preCalculatedTemp !== null)
        ? preCalculatedTemp
        : manualCalculatedTemp;
      console.log('4️⃣ SingaporeOverallWeather 방식:', singaporeTemp.toFixed(3));
      
      // 차이점 분석
      console.log('\n🔍 차이점 분석:');
      const diff1 = Math.abs(preCalculatedTemp - manualCalculatedTemp);
      console.log('- API 계산값 vs 수동 계산값 차이:', diff1.toFixed(4), '°C');
      
      if (diff1 > 0.001) {
        console.log('⚠️ 계산 방식에 따른 차이 발견!');
        
        console.log('\n📋 개별 관측소 온도 데이터:');
        tempReadings.forEach((reading, index) => {
          console.log(`  ${index + 1}. 스테이션 ${reading.station}: ${reading.value}°C`);
        });
        
        // 통계 분석
        const temps = tempReadings.map(r => r.value);
        const minTemp = Math.min(...temps);
        const maxTemp = Math.max(...temps);
        const range = maxTemp - minTemp;
        
        console.log('\n📈 온도 분포 통계:');
        console.log('- 최저:', minTemp.toFixed(1), '°C');
        console.log('- 최고:', maxTemp.toFixed(1), '°C');
        console.log('- 범위:', range.toFixed(1), '°C');
        console.log('- 표준편차:', calculateStandardDeviation(temps).toFixed(3), '°C');
      }
      
      // UI 표시값 예측
      console.log('\n🖥️ UI 표시값 예측:');
      console.log('- WeatherAlertTicker 표시:', `${tickerTemp.toFixed(1)}°C`);
      console.log('- Singapore Weather 표시:', `${singaporeTemp.toFixed(1)}°C`);
      
      if (Math.abs(tickerTemp - singaporeTemp) > 0.05) {
        console.log('🚨 불일치 감지! 두 컴포넌트가 다른 온도를 표시할 것입니다');
        
        // 문제 원인 추정
        console.log('\n🔧 문제 원인 분석:');
        console.log('1. 서로 다른 시점의 데이터 사용 가능성');
        console.log('2. 캐시된 데이터와 실시간 데이터 혼용');
        console.log('3. independentWeatherData vs window.weatherData 차이');
        console.log('4. 반올림/계산 정밀도 차이');
        
        // 해결책 제안
        console.log('\n💡 해결책 제안:');
        console.log('1. 두 컴포넌트가 동일한 데이터 소스 사용하도록 통일');
        console.log('2. 데이터 업데이트 시점 동기화');
        console.log('3. 단일 온도 계산 유틸리티 함수 사용');
        console.log('4. 실시간 데이터 변경 시 강제 리렌더링');
        
      } else {
        console.log('✅ 온도 일치: 두 컴포넌트가 동일한 값을 표시할 것입니다');
      }
      
    } else {
      console.warn('⚠️ 온도 데이터가 없습니다');
    }
    
    // 3. 타이밍 분석
    console.log('\n⏰ 데이터 업데이트 타이밍 분석:');
    const dataAge = Date.now() - new Date(freshNeaData.timestamp).getTime();
    console.log('- 데이터 나이:', Math.round(dataAge / 1000), '초');
    console.log('- 수집 시간:', freshNeaData.collection_time_ms, 'ms');
    
    if (dataAge > 5 * 60 * 1000) { // 5분 이상
      console.log('⚠️ 데이터가 5분 이상 오래되었습니다. 캐시 문제일 가능성');
    }
    
  } catch (error) {
    console.error('❌ 분석 중 오류 발생:', error.message);
  }
}

function calculateStandardDeviation(values) {
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / values.length;
  return Math.sqrt(avgSquaredDiff);
}

// 분석 실행
analyzeDataSyncIssue().then(() => {
  console.log('\n🎯 --ultrathink 모드 분석 완료');
});

export default analyzeDataSyncIssue;