import { useState, useEffect, lazy, Suspense } from 'react';
import EnhancedErrorBoundary from './components/common/EnhancedErrorBoundary';
import AppLayout from './components/layout/AppLayout';
import LoadingScreen from './components/common/LoadingScreen';
import RefreshButton from './components/common/RefreshButton';
import RegionalWeatherDashboard from './components/weather/RegionalWeatherDashboard';
import { useWeatherData, useWebcamData, useAppData } from './contexts/AppDataContextSimple';
import { INTERVALS, UI_CONFIG } from './config/constants';
import { getLocalizedString, UI_STRINGS } from './config/localization';

// Lazy load heavy components for better performance
const WeatherDashboard = lazy(() => import('./components/weather/WeatherDashboard'));
const WebcamGallery = lazy(() => import('./components/webcam/WebcamGallery'));
const MapView = lazy(() => import('./components/map/MapView'));
const AdminPanels = lazy(() => import('./components/admin/AdminPanels'));
const HwaChongWeatherAnalysis = lazy(() => import('./components/weather/HwaChongWeatherAnalysis'));

/**
 * Singapore Weather Cam Application
 */
const App = () => {
  const [activeRegion, setActiveRegion] = useState('hwa-chong');
  const [activeView, setActiveView] = useState('weather');
  const [showAdmin, setShowAdmin] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Data hooks from context
  const { weatherData, isLoading: weatherLoading, error: weatherError, refresh: refetchWeather } = useWeatherData();
  const { webcamData, isLoading: webcamLoading, error: webcamError, refresh: refetchWebcam } = useWebcamData();
  // const appData = useAppData(); // Reserved for future use

  // Manual refresh only - Context handles auto-refresh
  const handleManualRefresh = () => {
    refetchWeather();
    refetchWebcam();
    setLastUpdate(new Date());
  };

  // 더 스마트한 로딩 상태 관리
  const isInitialLoading = (weatherLoading || webcamLoading) && (!weatherData && !webcamData);
  const hasError = weatherError || webcamError;

  // 지역 선택 핸들러
  const handleRegionSelect = (regionId) => {
    setActiveRegion(regionId);
  };

  // Use the consolidated manual refresh function
  const handleRefresh = handleManualRefresh;

  const renderContent = () => {
    // 초기 로딩만 LoadingScreen 표시
    if (isInitialLoading) {
      return <LoadingScreen message={getLocalizedString('LOADING_WEATHER')} />;
    }

    // Admin panel
    if (showAdmin) {
      return (
        <Suspense fallback={<LoadingScreen message="Loading admin panel..." />}>
          <AdminPanels
            weatherData={weatherData}
            webcamData={webcamData}
            onClose={() => setShowAdmin(false)}
          />
        </Suspense>
      );
    }

    const LoadingFallback = ({ message = 'Loading component...' }) => (
      <LoadingScreen message={message} />
    );

    return (
      <div className="space-y-6">
        {/* 지역별 날씨 카드 대시보드 */}
        <RegionalWeatherDashboard
          weatherData={weatherData}
          onRegionSelect={handleRegionSelect}
          activeRegion={activeRegion}
          className="mb-8"
        />

        {/* 선택된 지역의 상세 정보는 상단 카드에서 표시 */}
        <div className="space-y-6">

          {/* 웹캠 갤러리 */}
          <Suspense fallback={<LoadingFallback message="Loading webcam gallery..." />}>
            <WebcamGallery
              data={webcamData}
              isLoading={webcamLoading}
              error={webcamError}
              lastUpdate={lastUpdate}
            />
          </Suspense>

          {/* 지도 뷰 */}
          <Suspense fallback={<LoadingFallback message="Loading map..." />}>
            <MapView
              weatherData={weatherData}
              webcamData={webcamData}
              selectedRegion={activeRegion}
              regionConfig={null}
            />
          </Suspense>

          {/* CCTV 기반 실시간 날씨 분석 */}
          <Suspense fallback={<LoadingFallback message="Loading CCTV analysis..." />}>
            <HwaChongWeatherAnalysis className="mb-6" />
          </Suspense>
        </div>
      </div>
    );
  };

  return (
    <EnhancedErrorBoundary maxRetries={3}>
      {/* 통합된 헤더 - 날씨 정보와 새로고침 버튼 */}
      <div className="sticky top-0 z-40 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 backdrop-blur-sm border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-2 sm:px-4 py-3">
          <div className="flex items-center justify-between">
            {/* 왼쪽: 제목과 간단 날씨 정보 */}
            <div className="flex items-center gap-4">
              <h1 className="text-lg font-bold text-gray-800">
                {`${UI_STRINGS.ICONS.WEATHER} Singapore Weather Cam`}
              </h1>
              {weatherData?.current && (
                <div className="hidden md:flex items-center gap-3 text-sm">
                  <span className="text-blue-600 font-semibold">
                    {Math.round(weatherData.current.temperature)}°C
                  </span>
                  <span className="text-gray-400">|</span>
                  <span className="text-green-600">
                    {Math.round(weatherData.current.humidity)}%
                  </span>
                  <span className="text-xs text-gray-500">Hwa Chong 지역</span>
                </div>
              )}
            </div>
            
            {/* 오른쪽: 새로고침 버튼 */}
            <RefreshButton
              onRefresh={refetchWeather}
              onForceRefresh={refetchWebcam}
              isRefreshing={weatherLoading || webcamLoading}
              isOnline={navigator.onLine}
              lastUpdate={lastUpdate}
              variant="default"
              showStatus={false}
              showTimer={true}
              className="animate-fade-in"
            />
          </div>
        </div>
      </div>
      
      <AppLayout>
        {renderContent()}
      </AppLayout>
    </EnhancedErrorBoundary>
  );
};

export default App;