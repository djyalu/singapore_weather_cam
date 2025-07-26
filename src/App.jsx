import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import Header from './components/layout/Header';
import SystemStatus from './components/common/SystemStatus';
import TemperatureHero from './components/weather/TemperatureHero';
import SystemFooter from './components/layout/SystemFooter';
import LoadingScreen from './components/common/LoadingScreen';
import ErrorBoundary from './components/common/ErrorBoundary';

// Lazy load components for better performance
const WeatherAnalysisCardRefactored = React.lazy(() => import('./components/analysis/WeatherAnalysisCardRefactored'));
const RegionalMapView = React.lazy(() => import('./components/map/RegionalMapView'));
const WebcamGallery = React.lazy(() => import('./components/webcam/WebcamGallery'));
const TrafficCameraGallery = React.lazy(() => import('./components/webcam/TrafficCameraGallery'));
import { useDataLoader } from './hooks/useDataLoader';
import { useSystemStats } from './hooks/useSystemStats';
import { useServiceWorker } from './hooks/useServiceWorker';
import PWAStatus from './components/common/PWAStatus';
import HealthMonitor from './components/system/HealthMonitor';
import MonitoringDashboard from './components/admin/MonitoringDashboard';
import PerformanceDashboard from './components/admin/PerformanceDashboard';
import ScrollProgress from './components/navigation/ScrollProgress';
import { initializeAccessibility } from './utils/accessibility';
import { initializeSecurity } from './utils/security';
import { useMetrics } from './services/metricsService';
import { useComponentPerformance } from './hooks/useComponentPerformance';
import '../src/styles/performance-animations.css';
import '../src/styles/accessibility.css';

const App = React.memo(() => {
  // Health monitor and dashboard visibility state
  const [showHealthMonitor, setShowHealthMonitor] = React.useState(false);
  const [showMonitoringDashboard, setShowMonitoringDashboard] = React.useState(false);
  const [showPerformanceDashboard, setShowPerformanceDashboard] = React.useState(false);

  // Metrics tracking
  const { trackPageView, trackUserInteraction } = useMetrics();

  // Performance monitoring for the main App component
  const appPerformance = useComponentPerformance('App', {
    weatherDataAvailable: !!weatherData,
    webcamDataAvailable: !!webcamData,
    isLoading: isInitialLoading,
  }, {
    trackRenders: true,
    trackProps: true,
    trackMemory: true,
    threshold: 20, // Allow slightly longer render time for main app
  });

  // Use custom hooks for cleaner component logic
  const {
    weatherData,
    webcamData,
    isInitialLoading,
    isRefreshing,
    error,
    retryCount,
    refresh,
    forceRefresh,
    dataFreshness,
    reliabilityMetrics,
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

    // Initialize axe-core for development accessibility testing
    if (process.env.NODE_ENV === 'development') {
      import('@axe-core/react').then((axe) => {
        axe.default(React, ReactDOM, 1000);
      }).catch((error) => {
        console.warn('Failed to load axe-core for accessibility testing:', error);
      });
    }

    // Track initial page view
    trackPageView(window.location.pathname, {
      type: 'app_load',
      weatherDataAvailable: !!weatherData,
      webcamDataAvailable: !!webcamData,
    });
  }, [trackPageView, weatherData, webcamData]);

  // Add keyboard shortcuts for dashboards
  React.useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.shiftKey) {
        if (event.key === 'M') {
          event.preventDefault();
          setShowMonitoringDashboard(!showMonitoringDashboard);
          trackUserInteraction('keyboard_shortcut', 'monitoring_dashboard');
        } else if (event.key === 'P') {
          event.preventDefault();
          setShowPerformanceDashboard(!showPerformanceDashboard);
          trackUserInteraction('keyboard_shortcut', 'performance_dashboard');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showMonitoringDashboard, showPerformanceDashboard, trackUserInteraction]);

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
        {/* Scroll progress indicator */}
        <ScrollProgress />

        {/* Skip to main content link for keyboard users */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded z-50 transition-all duration-200"
        >
          Skip to main content
        </a>
        <Header systemStats={systemStats} />

        {/* System Status - Compact at top with refresh controls */}
        <SystemStatus
          lastFetch={dataFreshness ? new Date(Date.now() - (dataFreshness.includes('m') ? parseInt(dataFreshness) * 60000 : parseInt(dataFreshness) * 3600000)) : null}
          weatherData={weatherData}
          webcamData={webcamData}
          reliabilityMetrics={reliabilityMetrics}
          error={error}
          isRefreshing={isRefreshing}
          onRefresh={refresh}
          onForceRefresh={forceRefresh}
        />

        <main id="main" className="max-w-7xl mx-auto px-2 sm:px-4 pb-6 sm:pb-8" role="main" tabIndex="-1">
          {/* Temperature Hero - Prominent hero section */}
          <section className="mb-8 sm:mb-12">
            {isInitialLoading ? (
              <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl sm:rounded-3xl shadow-2xl p-8 sm:p-12 text-center">
                <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-4 border-white mx-auto"></div>
                <p className="mt-4 sm:mt-6 text-white text-base sm:text-lg">Loading weather data...</p>
              </div>
            ) : (
              <TemperatureHero weatherData={weatherData} />
            )}
          </section>
          {/* Regional Map - Main interactive section */}
          <section id="map" className="mb-8 sm:mb-12" aria-labelledby="map-heading" tabIndex="-1">
            <div className="mb-6 sm:mb-8">
              <h2 id="map-heading" className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">
                🗺️ Regional Weather & Traffic Map
              </h2>
              <p className="text-base sm:text-lg text-gray-600">
                Interactive map with regional selection and real-time data visualization
                {isRefreshing && <span className="block sm:inline sm:ml-3 text-blue-600 animate-pulse font-medium">• Updating...</span>}
              </p>
            </div>

            <Suspense fallback={
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-8 sm:p-12 text-center" aria-live="polite">
                <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-4 border-blue-600 mx-auto" aria-hidden="true"></div>
                <p className="mt-4 sm:mt-6 text-gray-600 text-base sm:text-lg">Loading interactive map...</p>
              </div>
            }>
              <RegionalMapView weatherData={weatherData} webcamData={webcamData} />
            </Suspense>
          </section>

          {/* Analysis Results Section */}
          <section id="analysis" className="mb-8 sm:mb-12" aria-labelledby="analysis-heading" tabIndex="-1">
            <div className="mb-6 sm:mb-8">
              <h2 id="analysis-heading" className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">
                🌍 Real-time Regional Weather Analysis
              </h2>
              <p className="text-base sm:text-lg text-gray-600">
                AI-analyzed current weather conditions for key locations
                {dataFreshness && <span className="block sm:inline sm:ml-3 text-sm text-gray-500 font-medium">• {dataFreshness}</span>}
              </p>
            </div>

            {isInitialLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6" aria-live="polite">
                {Array.from({ length: 6 }, (_, index) => (
                  <div key={index} className="bg-white rounded-xl shadow-lg p-4 sm:p-6 animate-pulse" aria-hidden="true">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-24 sm:h-32 bg-gray-200 rounded mb-4"></div>
                    <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                <Suspense fallback={
                  <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 animate-pulse" aria-hidden="true">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
                    <div className="h-24 sm:h-32 bg-gray-200 rounded mb-4"></div>
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
          <section id="webcams" className="mb-8 sm:mb-12" aria-labelledby="webcams-heading" tabIndex="-1">
            <div className="mb-6 sm:mb-8">
              <h2 id="webcams-heading" className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">
                📸 Live Webcams
              </h2>
              <p className="text-base sm:text-lg text-gray-600">
                Real-time video feeds from key Singapore locations
              </p>
            </div>
            <Suspense fallback={
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-8 sm:p-12 text-center">
                <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-4 border-blue-600 mx-auto"></div>
                <p className="mt-4 sm:mt-6 text-gray-600 text-base sm:text-lg">Loading webcams...</p>
              </div>
            }>
              <WebcamGallery data={webcamData} />
            </Suspense>
          </section>

          {/* Traffic Cameras Section */}
          <section id="traffic" className="mb-8 sm:mb-12" aria-labelledby="traffic-heading" tabIndex="-1">
            <div className="mb-6 sm:mb-8">
              <h2 id="traffic-heading" className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">
                🚗 Live Traffic Cameras
              </h2>
              <p className="text-base sm:text-lg text-gray-600">
                Real-time traffic conditions across Singapore (data.gov.sg)
              </p>
            </div>
            <Suspense fallback={
              <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-8 sm:p-12 text-center">
                <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-4 border-blue-600 mx-auto"></div>
                <p className="mt-4 sm:mt-6 text-gray-600 text-base sm:text-lg">Loading traffic cameras...</p>
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

        {/* Performance Dashboard */}
        <PerformanceDashboard
          isVisible={showPerformanceDashboard}
          onClose={() => setShowPerformanceDashboard(false)}
        />
      </div>
    </ErrorBoundary>
  );
});

App.displayName = 'App';

export default App;