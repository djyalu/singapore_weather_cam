import React, { useState, useEffect } from 'react';
import { useWeatherData } from './hooks/useWeatherData';
import { useWebcamData } from './hooks/useWebcamData';

/**
 * Main Singapore Weather Cam Application
 * Real-time weather and traffic camera monitoring for Singapore
 */
const App = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Data hooks
  const { weatherData, isLoading: weatherLoading, error: weatherError, refetch: refetchWeather } = useWeatherData();
  const { webcamData, isLoading: webcamLoading, error: webcamError, refetch: refetchWebcam } = useWebcamData();

  // Auto-refresh data every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      refetchWeather();
      refetchWebcam();
      setLastUpdate(new Date());
    }, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [refetchWeather, refetchWebcam]);

  const isLoading = weatherLoading || webcamLoading;
  const hasError = weatherError || webcamError;

  const tabs = [
    { id: 'dashboard', name: '대시보드', icon: '🌤️' },
    { id: 'webcam', name: '웹캠', icon: '📹' },
    { id: 'map', name: '지도', icon: '🗺️' },
  ];

  // Simple Weather Dashboard Component
  const WeatherDashboard = () => {
    const stations = weatherData?.stations || [];

    return (
      <div className="space-y-6">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl mb-2">🌡️</div>
            <div className="text-2xl font-bold text-blue-600">
              {stations[0]?.temperature || 28.5}°C
            </div>
            <div className="text-sm text-gray-600">평균 기온</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl mb-2">💧</div>
            <div className="text-2xl font-bold text-blue-600">
              {stations[0]?.humidity || 75}%
            </div>
            <div className="text-sm text-gray-600">습도</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl mb-2">🌧️</div>
            <div className="text-2xl font-bold text-blue-600">
              {stations[0]?.rainfall || 0.2}mm
            </div>
            <div className="text-sm text-gray-600">강수량</div>
          </div>

          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl mb-2">💨</div>
            <div className="text-2xl font-bold text-blue-600">
              {stations[0]?.windSpeed || 8.3}km/h
            </div>
            <div className="text-sm text-gray-600">풍속</div>
          </div>
        </div>

        {/* Station Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stations.map((station) => (
            <div
              key={station.id}
              className={`bg-white rounded-lg shadow-md p-6 ${
                station.isPrimary ? 'ring-2 ring-blue-500' : ''
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-lg text-gray-800">
                    {station.name}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {station.area} • {station.id}
                    {station.isPrimary && (
                      <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                        PRIMARY
                      </span>
                    )}
                  </p>
                </div>
                <div className="text-2xl font-bold text-blue-600">
                  {station.temperature}°C
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-gray-500">습도</div>
                  <div className="font-semibold">{station.humidity}%</div>
                </div>
                <div>
                  <div className="text-gray-500">강수량</div>
                  <div className="font-semibold">{station.rainfall}mm</div>
                </div>
                <div>
                  <div className="text-gray-500">풍속</div>
                  <div className="font-semibold">{station.windSpeed}km/h</div>
                </div>
                <div>
                  <div className="text-gray-500">상태</div>
                  <div className="font-semibold text-green-600">정상</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // Simple Webcam Gallery Component
  const WebcamGallery = () => {
    const cameras = webcamData?.cameras || [];

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">교통 카메라</h2>
          <p className="text-gray-600">싱가포르 실시간 교통 상황</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cameras.map((camera) => (
            <div key={camera.id} className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="relative">
                <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                  <span className="text-gray-500">📹 카메라 {camera.id}</span>
                </div>
                <div className="absolute top-2 right-2">
                  <span className="px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800">
                    정상
                  </span>
                </div>
              </div>

              <div className="p-4">
                <h3 className="font-bold text-lg text-gray-800 mb-1">
                  {camera.name}
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  📍 {camera.location}
                </p>
                <p className="text-xs text-gray-500">
                  마지막 업데이트: {new Date(camera.lastUpdate).toLocaleString('ko-KR')}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderContent = () => {
    if (isLoading && (!weatherData && !webcamData)) {
      return (
        <div className="flex items-center justify-center min-h-96">
          <div className="text-center">
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <p className="text-gray-600">데이터를 불러오는 중...</p>
          </div>
        </div>
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return <WeatherDashboard />;
      case 'webcam':
        return <WebcamGallery />;
      case 'map':
        return (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className="text-6xl mb-4">🗺️</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">지도 뷰</h2>
            <p className="text-gray-600">지도 기능을 준비 중입니다.</p>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-blue-600">
                🌤️ Singapore Weather Cam
              </h1>
              <p className="text-sm text-gray-600">
                실시간 날씨 정보 시스템 • Real-time Weather Information System
              </p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-sm text-gray-500">
                마지막 업데이트: {lastUpdate.toLocaleString('ko-KR')}
              </div>
              <button
                onClick={() => {
                  refetchWeather();
                  refetchWebcam();
                  setLastUpdate(new Date());
                }}
                className="px-3 py-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors"
                disabled={isLoading}
              >
                {isLoading ? '⏳' : '🔄'} 새로고침
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 mt-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {tab.icon} {tab.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Error Display */}
        {hasError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="text-red-500 text-xl mr-3">⚠️</div>
              <div>
                <h3 className="text-red-800 font-semibold">데이터 로드 오류</h3>
                <p className="text-red-600 text-sm mt-1">
                  {weatherError || webcamError || '일부 데이터를 불러올 수 없습니다.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Content */}
        {renderContent()}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="container mx-auto px-4 py-6 text-center">
          <p className="text-gray-600 text-sm">
            © 2024 Singapore Weather Cam •
            데이터 출처: NEA Singapore, LTA Singapore
          </p>
        </div>
      </footer>
    </div>
  );
};

export default App;