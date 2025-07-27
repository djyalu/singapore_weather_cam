import React, { useState, useEffect } from 'react';
import ErrorBoundary from './components/common/ErrorBoundary';
import AppLayout from './components/layout/AppLayout';
import WeatherDashboard from './components/weather/WeatherDashboard';
import WebcamGallery from './components/webcam/WebcamGallery';
import MapView from './components/map/MapView';
import AdminPanels from './components/admin/AdminPanels';
import LoadingScreen from './components/common/LoadingScreen';
import { useWeatherData, useWebcamData, useAppData } from './contexts/AppDataContextSimple';

/**
 * Main Singapore Weather Cam Application
 * Enterprise-grade weather monitoring with advanced features
 */
const App = () => {
  const [activeTab, setActiveTab] = useState('map');
  const [showAdmin, setShowAdmin] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  // Data hooks from context
  const { weatherData, isLoading: weatherLoading, error: weatherError, refresh: refetchWeather } = useWeatherData();
  const { webcamData, isLoading: webcamLoading, error: webcamError, refresh: refetchWebcam } = useWebcamData();
  const appData = useAppData();

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
    { id: 'dashboard', name: '대시보드', icon: '🌤️', badge: weatherData?.stations?.length },
    { id: 'webcam', name: '웹캠', icon: '📹', badge: webcamData?.cameras?.length },
    { id: 'map', name: '지도', icon: '🗺️' },
    { id: 'analysis', name: '분석', icon: '📊' },
  ];

  const handleRefresh = () => {
    refetchWeather();
    refetchWebcam();
    setLastUpdate(new Date());
  };

  const renderContent = () => {
    if (isLoading && (!weatherData && !webcamData)) {
      return <LoadingScreen message="날씨 데이터를 불러오는 중..." />;
    }

    // Admin panel
    if (showAdmin) {
      return (
        <AdminPanels 
          weatherData={weatherData}
          webcamData={webcamData}
          onClose={() => setShowAdmin(false)}
        />
      );
    }

    switch (activeTab) {
      case 'dashboard':
        return (
          <WeatherDashboard 
            data={{
              current: weatherData?.stations?.[0],
              locations: weatherData?.stations,
              forecast: weatherData?.forecast || []
            }}
          />
        );
        
      case 'webcam':
        return (
          <WebcamGallery 
            data={webcamData}
            isLoading={webcamLoading}
            error={webcamError}
            lastUpdate={lastUpdate}
          />
        );
        
      case 'map':
        return (
          <MapView 
            weatherData={weatherData}
            webcamData={webcamData}
            center={[1.3437, 103.7640]} // Hwa Chong International School
            zoom={13}
          />
        );
        
      case 'analysis':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">📊 데이터 분석</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800">기온 트렌드</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    {weatherData?.stations?.[0]?.temperature || '--'}°C
                  </p>
                  <p className="text-sm text-blue-600">Bukit Timah 기준</p>
                </div>
                
                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800">습도 분석</h3>
                  <p className="text-2xl font-bold text-green-600">
                    {weatherData?.stations?.[0]?.humidity || '--'}%
                  </p>
                  <p className="text-sm text-green-600">
                    {(weatherData?.stations?.[0]?.humidity || 0) > 70 ? '높음' : '보통'}
                  </p>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-800">강수량 예측</h3>
                  <p className="text-2xl font-bold text-purple-600">
                    {weatherData?.stations?.[0]?.rainfall || 0}mm
                  </p>
                  <p className="text-sm text-purple-600">
                    {(weatherData?.stations?.[0]?.rainfall || 0) > 0 ? '비 감지' : '맑음'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <ErrorBoundary>
      <AppLayout
        title="🌤️ Singapore Weather Cam"
        subtitle="Enterprise Weather Monitoring System"
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        lastUpdate={lastUpdate}
        isLoading={isLoading}
        hasError={hasError}
        errorMessage={weatherError || webcamError}
        onRefresh={handleRefresh}
        onAdminToggle={() => setShowAdmin(!showAdmin)}
        showAdmin={showAdmin}
      >
        {renderContent()}
      </AppLayout>
    </ErrorBoundary>
  );
};

export default App;