import { useState, lazy, Suspense } from 'react';
import EnhancedErrorBoundary from './components/common/EnhancedErrorBoundary';
import AppLayout from './components/layout/AppLayout';
import LoadingScreen from './components/common/LoadingScreen';
import RegionalWeatherDashboard from './components/weather/RegionalWeatherDashboard';
import RegionalTrafficCameras from './components/webcam/RegionalTrafficCameras';
import SingaporeOverallWeather from './components/weather/SingaporeOverallWeather';
import DirectMapView from './components/map/DirectMapView'; // 실제 OpenStreetMap 지도
import CameraModal from './components/webcam/CameraModal';
import { useWeatherData } from './contexts/AppDataContextSimple';
import { getLocalizedString } from './config/localization';
import './utils/notifications'; // 알림 시스템 초기화
import { useOnDemandWeatherData } from './hooks/useOnDemandWeatherData'; // On-Demand 업데이트

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
  const [refreshTrigger, setRefreshTrigger] = useState(0); // 지도 히트맵 새로고침 트리거

  // Data hooks from context (for initial load)
  const { weatherData: contextData, isLoading: weatherLoading, error: weatherError } = useWeatherData();

  // On-Demand data hook - 사용자 요청 시에만 업데이트
  const {
    weatherData: onDemandData,
    lastUpdateTime,
    manualUpdateCount,
    refreshData,
    isUpdating,
    updateError,
    dataFreshness
  } = useOnDemandWeatherData(contextData);

  // Use on-demand data if available, fallback to context data
  const weatherData = onDemandData || contextData;

  // Manual refresh - On-demand 데이터 새로고침 사용
  const handleManualRefresh = async () => {
    const success = await refreshData(); // On-demand hook 사용
    if (success) {
      setLastUpdate(new Date());
      setRefreshTrigger(prev => prev + 1); // 지도 히트맵 새로고침 트리거
    }
    return success;
  };

  // Force refresh - 동일한 로직 사용
  const handleForceRefresh = async () => {
    const success = await refreshData();
    if (success) {
      setLastUpdate(new Date());
      setRefreshTrigger(prev => prev + 1);
    }
    return success;
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

  // 카메라 선택 핸들러 (지도에서 클릭 시) - 모달로 확대 보기
  const handleCameraSelect = (camera) => {
    setSelectedCamera(camera);
  };

  // 카메라 모달 닫기
  const handleCameraModalClose = () => {
    setSelectedCamera(null);
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
      <div className="space-y-4 sm:space-y-6">
        {/* 싱가포르 전체 평균 날씨 정보 - 개선된 컴팩트한 디자인 */}
        <SingaporeOverallWeather
          weatherData={weatherData}
          refreshTrigger={refreshTrigger}
          className=""
        />

        {/* 지역별 날씨 카드 대시보드 */}
        <RegionalWeatherDashboard
          weatherData={weatherData}
          onRegionSelect={handleRegionSelect}
          activeRegion={activeRegion}
          onSelectedRegionsChange={handleSelectedRegionsChange}
          refreshTrigger={refreshTrigger}
          className=""
        />

        {/* 선택된 지역의 상세 정보는 상단 카드에서 표시 */}
        <div className="space-y-4 sm:space-y-6">

          {/* 지역별 교통 카메라 - 선택된 날씨 지역과 연동 */}
          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
            <RegionalTrafficCameras
              selectedRegions={selectedRegions}
              onCameraClick={handleCameraSelect}
            />
          </div>


          {/* 실제 OpenStreetMap 지도 */}
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-3 sm:p-4 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800 mb-2">
                🗺️ Singapore 인터랙티브 지도
              </h2>
              <p className="text-sm text-gray-600">
                OpenStreetMap 기반 실제 지도 + 권역별 날씨 히트맵 + 90개 실시간 교통 카메라
              </p>
            </div>
            <div className="min-h-[600px]">
              <DirectMapView
                weatherData={weatherData}
                selectedRegion={activeRegion}
                className="w-full h-full"
                onCameraSelect={handleCameraSelect}
                refreshTrigger={refreshTrigger}
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

      {/* 교통 카메라 모달 */}
      <CameraModal
        camera={selectedCamera}
        isOpen={!!selectedCamera}
        onClose={handleCameraModalClose}
      />
    </EnhancedErrorBoundary>
  );
};

export default App;