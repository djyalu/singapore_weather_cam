import React, { useState, useEffect, useMemo, useCallback } from 'react';
import LiveHeader from './components/layout/LiveHeader';
import SystemStats from './components/dashboard/SystemStats';
import WeatherAnalysisCard from './components/analysis/WeatherAnalysisCard';
import SystemFooter from './components/layout/SystemFooter';
import MapView from './components/map/MapView';
import LoadingScreen from './components/common/LoadingScreen';
import ErrorBoundary from './components/common/ErrorBoundary';

const App = React.memo(() => {
  const [weatherData, setWeatherData] = useState(null);
  const [webcamData, setWebcamData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);

  // System stats calculation with memoization
  const systemStats = useMemo(() => {
    if (!webcamData?.captures) {return {};}

    const totalWebcams = webcamData.total_cameras || webcamData.captures.length;
    const successfulAnalyses = webcamData.successful_captures ||
      webcamData.captures.filter(c => c.status === 'success').length;
    const failedAnalyses = webcamData.failed_captures ||
      webcamData.captures.filter(c => c.status === 'failed').length;

    // Calculate average confidence from actual analysis data
    const analysisConfidences = webcamData.captures
      .filter(c => c.analysis?.confidence && c.status === 'success')
      .map(c => c.analysis.confidence);

    const averageConfidence = analysisConfidences.length > 0
      ? Math.floor(analysisConfidences.reduce((a, b) => a + b, 0) / analysisConfidences.length)
      : 0;

    // Determine dominant weather condition
    const weatherConditions = webcamData.captures
      .filter(c => c.ai_analysis?.weather_condition)
      .map(c => {
        const condition = c.ai_analysis.weather_condition.toLowerCase();
        if (condition.includes('sunny') || condition.includes('clear')) {return 'sunny';}
        if (condition.includes('cloudy') || condition.includes('overcast')) {return 'cloudy';}
        if (condition.includes('partly')) {return 'partly_cloudy';}
        if (condition.includes('rain')) {return 'light_rain';}
        return 'sunny';
      });

    const dominantWeather = weatherConditions.length > 0
      ? weatherConditions.reduce((a, b, i, arr) =>
        arr.filter(v => v === a).length >= arr.filter(v => v === b).length ? a : b,
      )
      : 'sunny';

    return {
      totalWebcams,
      successfulAnalyses,
      failedAnalyses,
      averageConfidence,
      lastUpdate: webcamData.timestamp ? new Date(webcamData.timestamp).toLocaleString('ko-KR') : null,
      totalProcessingTime: '15-30초',
      dominantWeather,
    };
  }, [webcamData]);

  // Data loading function with improved error handling
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const basePath = import.meta.env.BASE_URL || '/';

      // Parallel data fetching for better performance
      const [weatherResponse, webcamResponse] = await Promise.all([
        fetch(`${basePath}data/weather/latest.json`, {
          headers: { 'Cache-Control': 'no-cache' },
        }),
        fetch(`${basePath}data/webcam/latest.json`, {
          headers: { 'Cache-Control': 'no-cache' },
        }),
      ]);

      if (!weatherResponse.ok) {
        throw new Error(`Weather data fetch failed: ${weatherResponse.status}`);
      }
      if (!webcamResponse.ok) {
        throw new Error(`Webcam data fetch failed: ${webcamResponse.status}`);
      }

      const [weatherJson, webcamJson] = await Promise.all([
        weatherResponse.json(),
        webcamResponse.json(),
      ]);

      setWeatherData(weatherJson);
      setWebcamData(webcamJson);
      setRetryCount(0); // Reset retry count on success

    } catch (err) {
      console.error('Data loading error:', err);
      setError(err.message);
      setRetryCount(prev => prev + 1);
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-retry with exponential backoff
  const handleRetry = useCallback(() => {
    const delay = Math.min(1000 * Math.pow(2, retryCount), 30000); // Max 30s delay
    setTimeout(loadData, delay);
  }, [loadData, retryCount]);

  // Initial load and periodic refresh
  useEffect(() => {
    loadData();

    // Refresh every 5 minutes
    const interval = setInterval(loadData, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [loadData]);

  // Auto-retry failed requests
  useEffect(() => {
    if (error && retryCount < 3) {
      const retryTimer = setTimeout(handleRetry, 2000 * retryCount);
      return () => clearTimeout(retryTimer);
    }
  }, [error, retryCount, handleRetry]);

  if (loading && !weatherData && !webcamData) {
    return <LoadingScreen />;
  }

  if (error && !weatherData && !webcamData) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center" role="alert">
        <div className="text-center p-8 max-w-md">
          <div className="text-6xl mb-4" role="img" aria-label="Error">⚠️</div>
          <h1 className="text-2xl font-bold text-red-800 mb-4">데이터 로딩 오류</h1>
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-sm text-gray-600 mb-4">
            {retryCount > 0 && `재시도 ${retryCount}/3`}
          </p>
          <button
            onClick={loadData}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
            aria-label="데이터 다시 로드"
          >
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <LiveHeader systemStats={systemStats} />

        <SystemStats {...systemStats} />

        <main className="max-w-7xl mx-auto px-4 pb-8" role="main">
          {/* Map Section */}
          <section className="mb-8" aria-labelledby="map-heading">
            <div className="mb-6">
              <h2 id="map-heading" className="text-2xl font-bold text-gray-900 mb-2">
                🗺️ 실시간 지도
              </h2>
              <p className="text-gray-600">
                Hwa Chong International School을 중심으로 한 날씨 및 웹캠 위치
              </p>
            </div>

            {loading ? (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center" aria-live="polite">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" aria-hidden="true"></div>
                <p className="mt-4 text-gray-600">지도 로딩 중...</p>
              </div>
            ) : (
              <MapView weatherData={weatherData} webcamData={webcamData} />
            )}
          </section>

          {/* Analysis Results Section */}
          <section aria-labelledby="analysis-heading">
            <div className="mb-6">
              <h2 id="analysis-heading" className="text-2xl font-bold text-gray-900 mb-2">
                🌍 실시간 지역별 날씨 분석
              </h2>
              <p className="text-gray-600">
                Claude AI가 분석한 주요 지역의 현재 날씨 상황
              </p>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" aria-live="polite">
                {Array.from({ length: 6 }, (_, index) => (
                  <div key={index} className="bg-white rounded-xl shadow-lg p-6 animate-pulse" aria-hidden="true">
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
    </ErrorBoundary>
  );
});

App.displayName = 'App';

export default App;