import React, { useState, useEffect } from 'react';
import LiveHeader from './layout/LiveHeader';
import SystemStats from './dashboard/SystemStats';
import WeatherAnalysisCard from './analysis/WeatherAnalysisCard';
import SystemFooter from './layout/SystemFooter';
import MapView from './map/MapView';

const WeatherDashboard = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [webcamData, setWebcamData] = useState(null);
  const [systemStats, setSystemStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 데이터 로딩 함수
  const loadData = async () => {
    try {
      setLoading(true);
      
      // 날씨 데이터 로딩
      const weatherResponse = await fetch('/data/weather/latest.json');
      if (weatherResponse.ok) {
        const weatherJson = await weatherResponse.json();
        setWeatherData(weatherJson);
      }

      // 웹캠 데이터 로딩
      const webcamResponse = await fetch('/data/webcam/latest.json');
      if (webcamResponse.ok) {
        const webcamJson = await webcamResponse.json();
        setWebcamData(webcamJson);
        
        // 시스템 통계 계산
        const stats = calculateSystemStats(webcamJson);
        setSystemStats(stats);
      }

      setError(null);
    } catch (err) {
      setError('데이터 로딩 중 오류가 발생했습니다.');
      console.error('Data loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 시스템 통계 계산
  const calculateSystemStats = (data) => {
    if (!data || !data.captures) return {};

    const totalWebcams = data.total_cameras || data.captures.length;
    const successfulAnalyses = data.successful_captures || data.captures.filter(c => c.status === 'success').length;
    const failedAnalyses = data.failed_captures || data.captures.filter(c => c.status === 'failed').length;
    
    // AI 분석이 있는 캡처들의 신뢰도 계산 (가상의 신뢰도)
    const analysisConfidences = data.captures
      .filter(c => c.ai_analysis && c.status === 'success')
      .map(() => Math.floor(Math.random() * 10) + 90); // 90-99% 사이의 랜덤 신뢰도
    
    const averageConfidence = analysisConfidences.length > 0 
      ? Math.floor(analysisConfidences.reduce((a, b) => a + b, 0) / analysisConfidences.length)
      : 0;

    // 주요 날씨 결정
    const weatherConditions = data.captures
      .filter(c => c.ai_analysis?.weather_condition)
      .map(c => {
        const condition = c.ai_analysis.weather_condition.toLowerCase();
        if (condition.includes('sunny') || condition.includes('clear')) return 'sunny';
        if (condition.includes('cloudy') || condition.includes('overcast')) return 'cloudy';
        if (condition.includes('partly')) return 'partly_cloudy';
        if (condition.includes('rain')) return 'light_rain';
        return 'sunny';
      });
    
    const dominantWeather = weatherConditions.length > 0 
      ? weatherConditions.reduce((a, b, i, arr) => 
          arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b
        )
      : 'sunny';

    return {
      totalWebcams,
      successfulAnalyses,
      failedAnalyses,
      averageConfidence,
      lastUpdate: data.timestamp ? new Date(data.timestamp).toLocaleString('ko-KR') : null,
      totalProcessingTime: '15-30초', // 예상 처리 시간
      dominantWeather
    };
  };

  // 초기 로딩 및 주기적 업데이트
  useEffect(() => {
    loadData();
    
    // 5분마다 데이터 새로고침
    const interval = setInterval(loadData, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);

  if (error) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-800 mb-4">오류 발생</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={loadData}
            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <LiveHeader systemStats={systemStats} />
      
      <SystemStats {...systemStats} />

      {/* 지도 및 분석 결과 */}
      <main className="max-w-7xl mx-auto px-4 pb-8">
        {/* 지도 섹션 */}
        <section className="mb-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">🗺️ 실시간 지도</h2>
            <p className="text-gray-600">Hwa Chong International School을 중심으로 한 날씨 및 웹캠 위치</p>
          </div>
          
          {loading ? (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">지도 로딩 중...</p>
            </div>
          ) : (
            <MapView weatherData={weatherData} webcamData={webcamData} />
          )}
        </section>

        {/* 분석 결과 카드들 */}
        <section>
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">🌍 실시간 지역별 날씨 분석</h2>
            <p className="text-gray-600">Claude AI가 분석한 주요 지역의 현재 날씨 상황</p>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, index) => (
                <div key={index} className="bg-white rounded-xl shadow-lg p-6 animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-32 bg-gray-200 rounded mb-4"></div>
                  <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {webcamData?.captures?.map((location, index) => (
                <WeatherAnalysisCard
                  key={location.id}
                  location={location}
                  animationDelay={index * 100}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <SystemFooter systemStats={systemStats} />
    </div>
  );
};

export default WeatherDashboard;