import { useState, lazy, Suspense } from 'react';
import EnhancedErrorBoundary from './components/common/EnhancedErrorBoundary';
import MapErrorBoundary from './components/map/MapErrorBoundary';
import AppLayout from './components/layout/AppLayout';
import LoadingScreen from './components/common/LoadingScreen';
import RegionalWeatherDashboard from './components/weather/RegionalWeatherDashboard';
import RegionalTrafficCameras from './components/webcam/RegionalTrafficCameras';
import SingaporeOverallWeather from './components/weather/SingaporeOverallWeather';
import SimpleMapView from './components/map/SimpleMapView'; // Direct import instead of lazy
import { useWeatherData } from './contexts/AppDataContextSimple';
import { getLocalizedString } from './config/localization';
import './utils/notifications'; // 알림 시스템 초기화

// Only AdminPanels remains lazy loaded
const AdminPanels = lazy(() => import('./components/admin/AdminPanels'));

/**
 * Singapore Weather Cam Application
 */
const App = () => {
  const [activeRegion, setActiveRegion] = useState('hwa-chong');
  const [showAdmin, setShowAdmin] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [selectedCamera, setSelectedCamera] = useState(null); // Camera selected from map (AI 분석 제거 후 사용안함)
  const [selectedRegions, setSelectedRegions] = useState(['hwa-chong', 'newton', 'changi']); // 선택된 지역들

  // Data hooks from context
  const { weatherData, isLoading: weatherLoading, error: weatherError, refresh: refetchWeather, forceRefresh: forceRefetchWeather } = useWeatherData();

  // Manual refresh only - Context handles auto-refresh
  const handleManualRefresh = () => {
    refetchWeather();
    setLastUpdate(new Date());
  };

  // Force refresh - 실시간 NEA API 호출
  const handleForceRefresh = () => {
    forceRefetchWeather();
    setLastUpdate(new Date());
  };

  // 더 스마트한 로딩 상태 관리
  const isInitialLoading = weatherLoading && !weatherData;
  const hasError = weatherError;

  // 지역 선택 핸들러
  const handleRegionSelect = (regionId) => {
    setActiveRegion(regionId);
  };

  // 선택된 지역들 업데이트 핸들러 (RegionalWeatherDashboard에서 전달받음)
  const handleSelectedRegionsChange = (newSelectedRegions) => {
    setSelectedRegions(newSelectedRegions);
  };

  // 카메라 선택 핸들러 (지도에서 클릭 시) - AI 분석 제거로 단순화
  const handleCameraSelect = (camera) => {
    setSelectedCamera(camera);
    // AI 분석 제거로 스크롤 기능 비활성화
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
        {/* 싱가포르 전체 평균 날씨 정보 */}
        <SingaporeOverallWeather 
          weatherData={weatherData}
          className="mb-8"
        />

        {/* 지역별 날씨 카드 대시보드 */}
        <RegionalWeatherDashboard
          weatherData={weatherData}
          onRegionSelect={handleRegionSelect}
          activeRegion={activeRegion}
          onSelectedRegionsChange={handleSelectedRegionsChange}
          className="mb-8"
        />

        {/* 선택된 지역의 상세 정보는 상단 카드에서 표시 */}
        <div className="space-y-8">

          {/* 지역별 교통 카메라 - 선택된 날씨 지역과 연동 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <RegionalTrafficCameras
              selectedRegions={selectedRegions}
              onCameraClick={handleCameraSelect}
            />
          </div>


          {/* 지도 뷰 - 크기 확대 */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                🗺️ 실시간 날씨 및 교통 지도
              </h2>
              <p className="text-sm text-gray-600">
                날씨 스테이션과 교통 카메라 위치 통합 보기
              </p>
            </div>
            <div className="min-h-[500px]">
              {/* MapErrorBoundary 임시 제거 */}
              <SimpleMapView
                weatherData={weatherData}
                selectedRegion={activeRegion}
                className="w-full"
                onCameraSelect={handleCameraSelect}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <EnhancedErrorBoundary maxRetries={3}>
      
      <AppLayout>
        {renderContent()}
      </AppLayout>
    </EnhancedErrorBoundary>
  );
};

export default App;