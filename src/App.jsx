import React, { Suspense } from 'react';
import Header from './components/layout/Header';
import SystemStats from './components/dashboard/SystemStats';
import SystemFooter from './components/layout/SystemFooter';
import LoadingScreen from './components/common/LoadingScreen';
import ErrorBoundary from './components/common/ErrorBoundary';

// Lazy load components for better performance
const WeatherAnalysisCardRefactored = React.lazy(() => import('./components/analysis/WeatherAnalysisCardRefactored'));
const WeatherDashboard = React.lazy(() => import('./components/weather/WeatherDashboard'));
const MapView = React.lazy(() => import('./components/map/MapView'));
const WebcamGallery = React.lazy(() => import('./components/webcam/WebcamGallery'));
const TrafficCameraGallery = React.lazy(() => import('./components/webcam/TrafficCameraGallery'));
import { useDataLoader } from './hooks/useDataLoader';
import { useSystemStats } from './hooks/useSystemStats';
import { useServiceWorker } from './hooks/useServiceWorker';
import PWAStatus from './components/common/PWAStatus';
import HealthMonitor from './components/system/HealthMonitor';
import MonitoringDashboard from './components/admin/MonitoringDashboard';
import { initializeAccessibility } from './utils/accessibility';
import { initializeSecurity } from './utils/security';
import { useMetrics } from './services/metricsService';

const App = React.memo(() => {
  // Health monitor and dashboard visibility state
  const [showHealthMonitor, setShowHealthMonitor] = React.useState(false);
  const [showMonitoringDashboard, setShowMonitoringDashboard] = React.useState(false);

  // Metrics tracking
  const { trackPageView, trackUserInteraction } = useMetrics();

  // Use custom hooks for cleaner component logic
  const {
    weatherData,
    webcamData,
    isInitialLoading,
    isRefreshing,
    error,
    retryCount,
    refresh,
    dataFreshness,
  } = useDataLoader(5 * 60 * 1000); // 5 minute refresh interval

  // Use custom hook for system stats calculation
  const systemStats = useSystemStats(webcamData);

  // PWA functionality
  const {
    isOnline,
    isUpdateAvailable,
    canInstall,
    installPWA,
    updateServiceWorker,
    requestNotificationPermission,
  } = useServiceWorker();

  // Initialize accessibility and security features
  React.useEffect(() => {
    initializeAccessibility();
    initializeSecurity();

    // Track initial page view
    trackPageView(window.location.pathname, {
      type: 'app_load',
      weatherDataAvailable: !!weatherData,
      webcamDataAvailable: !!webcamData,
    });
  }, [trackPageView, weatherData, webcamData]);

  // Add keyboard shortcut for monitoring dashboard (Ctrl+Shift+M)
  React.useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'M') {
        event.preventDefault();
        setShowMonitoringDashboard(!showMonitoringDashboard);
        trackUserInteraction('keyboard_shortcut', 'monitoring_dashboard');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showMonitoringDashboard, trackUserInteraction]);

  // Data loading logic now handled by custom hook

  if (isInitialLoading) {
    return <LoadingScreen />;
  }

  if (error && !weatherData && !webcamData) {
    return (
      <div className="min-h-screen bg-red-50 flex items-center justify-center" role="alert">
        <div className="text-center p-8 max-w-md">
          <div className="text-6xl mb-4" role="img" aria-label="Error">⚠️</div>
          <h1 className="text-2xl font-bold text-red-800 mb-4">Data Loading Error</h1>
          <p className="text-red-600 mb-4">{error}</p>
          <p className="text-sm text-gray-600 mb-4">
            {retryCount > 0 && `Retry ${retryCount}/3`}
            {dataFreshness && ` • Last update: ${dataFreshness}`}
          </p>
          <button
            onClick={refresh}
            className="bg-red-600 text-white px-6 py-3 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
            aria-label="Reload data"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Skip to main content link for keyboard users */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded z-50 transition-all duration-200"
        >
          Skip to main content
        </a>
        <Header systemStats={systemStats} />

        <SystemStats {...systemStats} />

        <main id="main" className="max-w-7xl mx-auto px-4 pb-8" role="main" tabIndex="-1">
          {/* Map Section */}
          <section className="mb-8" aria-labelledby="map-heading">
            <div className="mb-6">
              <h2 id="map-heading" className="text-2xl font-bold text-gray-900 mb-2">
                🗺️ Real-time Map
              </h2>
              <p className="text-gray-600">
                Weather and webcam locations centered on Bukit Timah Nature Reserve
                {isRefreshing && <span className="ml-2 text-blue-600 animate-pulse">• Updating...</span>}
              </p>
            </div>

            <Suspense fallback={
              <div className="bg-white rounded-xl shadow-lg p-8 text-center" aria-live="polite">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" aria-hidden="true"></div>
                <p className="mt-4 text-gray-600">Loading map...</p>
              </div>
            }>
              <MapView weatherData={weatherData} webcamData={webcamData} />
            </Suspense>
          </section>

          {/* Weather Dashboard Section */}
          <section className="mb-8" aria-labelledby="weather-dashboard-heading">
            <div className="mb-6">
              <h2 id="weather-dashboard-heading" className="text-2xl font-bold text-gray-900 mb-2">
                🌤️ Interactive Weather Dashboard
              </h2>
              <p className="text-gray-600">
                Real-time weather data with interactive location filtering for Bukit Timah region
                {dataFreshness && <span className="ml-2 text-sm text-gray-500">• {dataFreshness}</span>}
              </p>
            </div>

            {isInitialLoading ? (
              <div className="bg-white rounded-xl shadow-lg p-8 animate-pulse" aria-live="polite">
                <div className="flex gap-2 mb-6">
                  {Array.from({ length: 4 }, (_, index) => (
                    <div key={index} className="h-8 bg-gray-200 rounded w-24"></div>
                  ))}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  {Array.from({ length: 4 }, (_, index) => (
                    <div key={index} className="h-24 bg-gray-200 rounded"></div>
                  ))}
                </div>
                <div className="h-64 bg-gray-200 rounded"></div>
              </div>
            ) : (
              <Suspense fallback={
                <div className="bg-white rounded-xl shadow-lg p-8 animate-pulse" aria-hidden="true">
                  <div className="h-8 bg-gray-200 rounded w-full mb-4"></div>
                  <div className="h-32 bg-gray-200 rounded mb-4"></div>
                  <div className="h-64 bg-gray-200 rounded"></div>
                </div>
              }>
                <WeatherDashboard data={weatherData} />
              </Suspense>
            )}
          </section>

          {/* Analysis Results Section */}
          <section className="mb-8" aria-labelledby="analysis-heading">
            <div className="mb-6">
              <h2 id="analysis-heading" className="text-2xl font-bold text-gray-900 mb-2">
                🌍 Real-time Regional Weather Analysis
              </h2>
              <p className="text-gray-600">
                AI-analyzed current weather conditions for key locations
                {dataFreshness && <span className="ml-2 text-sm text-gray-500">• {dataFreshness}</span>}
              </p>
            </div>

            {isInitialLoading ? (
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
                <Suspense fallback={
                  <div className="bg-white rounded-xl shadow-lg p-6 animate-pulse" aria-hidden="true">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-32 bg-gray-200 rounded mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                  </div>
                }>
                  {webcamData?.captures?.map((location, index) => (
                    <WeatherAnalysisCardRefactored
                      key={location.id}
                      location={location}
                      animationDelay={index * 100}
                    />
                  ))}
                </Suspense>
              </div>
            )}
          </section>

          {/* Live Webcams Section */}
          <section className="mb-8" aria-labelledby="webcams-heading">
            <div className="mb-6">
              <h2 id="webcams-heading" className="text-2xl font-bold text-gray-900 mb-2">
                📸 Live Webcams
              </h2>
              <p className="text-gray-600">
                Real-time video feeds from key Singapore locations
              </p>
            </div>
            <Suspense fallback={
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading webcams...</p>
              </div>
            }>
              <WebcamGallery data={webcamData} />
            </Suspense>
          </section>

          {/* Traffic Cameras Section */}
          <section className="mb-8" aria-labelledby="traffic-heading">
            <div className="mb-6">
              <h2 id="traffic-heading" className="text-2xl font-bold text-gray-900 mb-2">
                🚗 Live Traffic Cameras
              </h2>
              <p className="text-gray-600">
                Real-time traffic conditions across Singapore (data.gov.sg)
              </p>
            </div>
            <Suspense fallback={
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading traffic cameras...</p>
              </div>
            }>
              <TrafficCameraGallery />
            </Suspense>
          </section>
        </main>

        <SystemFooter systemStats={systemStats} />

        {/* PWA Status Components */}
        <PWAStatus
          isOnline={isOnline}
          isUpdateAvailable={isUpdateAvailable}
          canInstall={canInstall}
          onInstall={installPWA}
          onUpdate={updateServiceWorker}
          onRequestNotifications={requestNotificationPermission}
        />

        {/* Health Monitor */}
        <HealthMonitor
          isVisible={showHealthMonitor}
          onToggle={() => setShowHealthMonitor(!showHealthMonitor)}
        />

        {/* Monitoring Dashboard */}
        <MonitoringDashboard
          isVisible={showMonitoringDashboard}
          onClose={() => setShowMonitoringDashboard(false)}
        />
      </div>
    </ErrorBoundary>
  );
});

App.displayName = 'App';

export default App;