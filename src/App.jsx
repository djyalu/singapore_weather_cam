import { useState, useEffect, lazy, Suspense } from 'react';
import EnhancedErrorBoundary from './components/common/EnhancedErrorBoundary';
import AppLayout from './components/layout/AppLayout';
import WeatherStatusBar from './components/layout/WeatherStatusBar';
import LoadingScreen from './components/common/LoadingScreen';
import { useWeatherData, useWebcamData, useAppData } from './contexts/AppDataContextSimple';
import { INTERVALS, UI_CONFIG } from './config/constants';
import { getLocalizedString, UI_STRINGS } from './config/localization';
import { formatDateSafely } from './components/common/SafeDateFormatter';

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
  const [activeTab, setActiveTab] = useState(UI_CONFIG.DEFAULT_TAB);
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

  const tabs = [
    {
      id: 'dashboard',
      name: getLocalizedString('DASHBOARD'),
      icon: UI_STRINGS.ICONS.WEATHER,
      badge: weatherData?.locations?.length,
    },
    {
      id: 'webcam',
      name: getLocalizedString('WEBCAM'),
      icon: UI_STRINGS.ICONS.WEBCAM,
      badge: webcamData?.captures?.length,
    },
    {
      id: 'map',
      name: getLocalizedString('MAP'),
      icon: UI_STRINGS.ICONS.MAP,
    },
    {
      id: 'analysis',
      name: getLocalizedString('ANALYSIS'),
      icon: UI_STRINGS.ICONS.ANALYSIS,
    },
  ];

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

    switch (activeTab) {
      case 'dashboard':
        return (
          <Suspense fallback={<LoadingFallback message="Loading weather dashboard..." />}>
            <WeatherDashboard
              data={{
                current: weatherData?.locations?.[0],
                locations: weatherData?.locations,
                forecast: weatherData?.forecast || [],
              }}
            />
          </Suspense>
        );

      case 'webcam':
        return (
          <Suspense fallback={<LoadingFallback message="Loading webcam gallery..." />}>
            <WebcamGallery
              data={webcamData}
              isLoading={webcamLoading}
              error={webcamError}
              lastUpdate={lastUpdate}
            />
          </Suspense>
        );

      case 'map':
        return (
          <Suspense fallback={<LoadingFallback message="Loading map..." />}>
            <MapView
              weatherData={weatherData}
              webcamData={webcamData}
              selectedRegion="all"
              regionConfig={null}
            />
          </Suspense>
        );

      case 'analysis':
        return (
          <div className="space-y-6">
            {/* CCTV 기반 실시간 날씨 분석 - Hwa Chong 중심 */}
            <Suspense fallback={<LoadingFallback message="Loading CCTV analysis..." />}>
              <HwaChongWeatherAnalysis className="mb-6" />
            </Suspense>

            {/* 기존 센서 기반 분석 */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                {UI_STRINGS.ICONS.ANALYSIS} 센서 기반 {getLocalizedString('ANALYSIS')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800">{getLocalizedString('TEMPERATURE_TREND')}</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    {weatherData?.locations?.[0]?.temperature || '--'}°C
                  </p>
                  <p className="text-sm text-blue-600">현재 온도</p>
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <h3 className="font-semibold text-green-800">{getLocalizedString('HUMIDITY_ANALYSIS')}</h3>
                  <p className="text-2xl font-bold text-green-600">
                    {weatherData?.locations?.[0]?.humidity || '--'}%
                  </p>
                  <p className="text-sm text-green-600">
                    {(weatherData?.locations?.[0]?.humidity || 0) > 70 ? getLocalizedString('HIGH') : getLocalizedString('NORMAL')}
                  </p>
                </div>

                <div className="bg-purple-50 rounded-lg p-4">
                  <h3 className="font-semibold text-purple-800">{getLocalizedString('RAINFALL_PREDICTION')}</h3>
                  <p className="text-2xl font-bold text-purple-600">
                    {weatherData?.locations?.[0]?.rainfall || 0}{getLocalizedString('RAINFALL_UNIT')}
                  </p>
                  <p className="text-sm text-purple-600">
                    {(weatherData?.locations?.[0]?.rainfall || 0) > 0 ? getLocalizedString('RAIN_DETECTED') : getLocalizedString('CLEAR')}
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
    <EnhancedErrorBoundary maxRetries={3}>
      {/* 상단 날씨 정보 바 - Hwa Chong 중심 */}
      <WeatherStatusBar weatherData={weatherData} />
      
      <AppLayout
        title={`${UI_STRINGS.ICONS.WEATHER} Singapore Weather Cam`}
        subtitle="실시간 날씨 모니터링"
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        lastUpdate={formatDateSafely(lastUpdate)}
        isLoading={isInitialLoading}
        hasError={hasError}
        errorMessage={weatherError || webcamError}
        onRefresh={handleRefresh}
        onAdminToggle={() => setShowAdmin(!showAdmin)}
        showAdmin={showAdmin}
      >
        {renderContent()}
      </AppLayout>
    </EnhancedErrorBoundary>
  );
};

export default App;