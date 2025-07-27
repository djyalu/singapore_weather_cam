import React, { useState, useEffect } from 'react';
import ErrorBoundary from './components/common/ErrorBoundary';
import AppLayout from './components/layout/AppLayout';
import WeatherDashboard from './components/weather/WeatherDashboard';
import WebcamGallery from './components/webcam/WebcamGallery';
import MapView from './components/map/MapView';
import AdminPanels from './components/admin/AdminPanels';
import LoadingScreen from './components/common/LoadingScreen';
import { useWeatherData, useWebcamData, useAppData } from './contexts/AppDataContextSimple';
import { INTERVALS, UI_CONFIG, COORDINATES } from './config/constants';
import { getLocalizedString, UI_STRINGS } from './config/localization';

/**
 * Main Singapore Weather Cam Application
 * Enterprise-grade weather monitoring with advanced features
 */
const App = () => {
  const [activeTab, setActiveTab] = useState(UI_CONFIG.DEFAULT_TAB);
  const [showAdmin, setShowAdmin] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  
  // Data hooks from context
  const { weatherData, isLoading: weatherLoading, error: weatherError, refresh: refetchWeather } = useWeatherData();
  const { webcamData, isLoading: webcamLoading, error: webcamError, refresh: refetchWebcam } = useWebcamData();
  const appData = useAppData();

  // Auto-refresh data using configured interval
  useEffect(() => {
    const interval = setInterval(() => {
      refetchWeather();
      refetchWebcam();
      setLastUpdate(new Date());
    }, INTERVALS.APP_REFRESH);

    return () => clearInterval(interval);
  }, [refetchWeather, refetchWebcam]);

  const isLoading = weatherLoading || webcamLoading;
  const hasError = weatherError || webcamError;

  const tabs = [
    { 
      id: 'dashboard', 
      name: getLocalizedString('DASHBOARD'), 
      icon: UI_STRINGS.ICONS.WEATHER, 
      badge: weatherData?.locations?.length 
    },
    { 
      id: 'webcam', 
      name: getLocalizedString('WEBCAM'), 
      icon: UI_STRINGS.ICONS.WEBCAM, 
      badge: webcamData?.captures?.length 
    },
    { 
      id: 'map', 
      name: getLocalizedString('MAP'), 
      icon: UI_STRINGS.ICONS.MAP 
    },
    { 
      id: 'analysis', 
      name: getLocalizedString('ANALYSIS'), 
      icon: UI_STRINGS.ICONS.ANALYSIS 
    },
  ];

  const handleRefresh = () => {
    refetchWeather();
    refetchWebcam();
    setLastUpdate(new Date());
  };

  const renderContent = () => {
    if (isLoading && (!weatherData && !webcamData)) {
      return <LoadingScreen message={getLocalizedString('LOADING_WEATHER')} />;
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
              current: weatherData?.locations?.[0],
              locations: weatherData?.locations,
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
            center={COORDINATES.DEFAULT_CENTER}
            zoom={COORDINATES.DEFAULT_ZOOM}
          />
        );
        
      case 'analysis':
        return (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                {UI_STRINGS.ICONS.ANALYSIS} {getLocalizedString('ANALYSIS')}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-800">{getLocalizedString('TEMPERATURE_TREND')}</h3>
                  <p className="text-2xl font-bold text-blue-600">
                    {weatherData?.locations?.[0]?.temperature || '--'}°C
                  </p>
                  <p className="text-sm text-blue-600">{getLocalizedString('WEATHER_REFERENCE')}</p>
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
    <ErrorBoundary>
      <AppLayout
        title={`${UI_STRINGS.ICONS.WEATHER} Singapore Weather Cam`}
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