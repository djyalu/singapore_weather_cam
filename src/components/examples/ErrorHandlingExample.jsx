/**
 * Error Handling Integration Example
 * Demonstrates how to integrate the enhanced error handling system
 */

import React, { Suspense } from 'react';
import ErrorBoundary from '../common/ErrorBoundary.jsx';
import ComponentErrorBoundary from '../common/ComponentErrorBoundary.jsx';
import { ErrorProvider, useErrorContext, useComponentError } from '../../contexts/ErrorContext.jsx';
import { withErrorHandling, useErrorHandler } from '../common/withErrorHandling.jsx';
import { ErrorDisplay, NetworkError, DataError } from '../common/ErrorComponents.jsx';
import SystemStatus from '../common/SystemStatus.jsx';
import TemperatureHero from '../weather/TemperatureHero.jsx';
import RegionalMapView from '../map/RegionalMapView.jsx';

/**
 * Example of enhanced App component with comprehensive error handling
 */
const AppWithErrorHandling = () => {
  return (
    <ErrorProvider maxRetries={3} retryDelay={1000}>
      {/* Global error boundary for critical errors */}
      <ErrorBoundary
        autoRecover={true}
        fallbackComponent="App"
        onError={(error, errorInfo, context) => {
          // Send to error tracking service
          console.error('Global app error:', { error, errorInfo, context });
        }}
      >
        <div className="min-h-screen bg-gray-50">
          {/* Enhanced SystemStatus with error handling */}
          <SystemStatusWithErrors />

          <main className="max-w-7xl mx-auto px-4 py-6">
            {/* Temperature Hero with error boundaries */}
            <section className="mb-8">
              <ComponentErrorBoundary
                componentName="Temperature Hero"
                fallback={(error, retry) => (
                  <div className="p-6 bg-red-50 rounded-lg">
                    <ErrorDisplay
                      error={error}
                      severity="error"
                      onRetry={retry}
                      retryText="Reload Temperature Display"
                    />
                  </div>
                )}
              >
                <Suspense fallback={<TemperatureHeroSkeleton />}>
                  <TemperatureHeroWithErrors />
                </Suspense>
              </ComponentErrorBoundary>
            </section>

            {/* Regional Map with error resilience */}
            <section>
              <ComponentErrorBoundary
                componentName="Regional Map"
                fallback={(error, retry) => (
                  <div className="p-6 bg-amber-50 rounded-lg">
                    <ErrorDisplay
                      error={error}
                      severity="warning"
                      onRetry={retry}
                      retryText="Reload Map"
                    />
                  </div>
                )}
              >
                <Suspense fallback={<RegionalMapSkeleton />}>
                  <RegionalMapWithErrors />
                </Suspense>
              </ComponentErrorBoundary>
            </section>
          </main>

          {/* Global error status display */}
          <GlobalErrorStatus />
        </div>
      </ErrorBoundary>
    </ErrorProvider>
  );
};

/**
 * Enhanced SystemStatus with error context integration
 */
const SystemStatusWithErrors = () => {
  const { networkStatus, getErrorStats } = useErrorContext();
  const { error, handleError, retry } = useComponentError('system-status', 'System Status');

  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const [lastFetch, setLastFetch] = React.useState(new Date());

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Simulate data refresh
      await new Promise(resolve => setTimeout(resolve, 1000));
      setLastFetch(new Date());
    } catch (error) {
      handleError(error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleForceRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Simulate force refresh with potential errors
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          // Randomly fail for demonstration
          if (Math.random() > 0.7) {
            reject(new Error('Force refresh failed'));
          } else {
            resolve();
          }
        }, 1500);
      });
      setLastFetch(new Date());
    } catch (error) {
      handleError(error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const errorStats = getErrorStats();

  return (
    <SystemStatus
      lastFetch={lastFetch}
      weatherData={{ current: { temperature: 28 } }}
      webcamData={{ captures: [] }}
      reliabilityMetrics={{
        weatherQuality: 0.9,
        webcamQuality: 0.8,
        fallbackMode: networkStatus !== 'online',
      }}
      error={error}
      isRefreshing={isRefreshing}
      onRefresh={handleRefresh}
      onForceRefresh={handleForceRefresh}
      networkStatus={networkStatus}
      retryAttempts={errorStats.recentErrors}
    />
  );
};

/**
 * Enhanced TemperatureHero with error handling
 */
const TemperatureHeroWithErrors = () => {
  const { error, handleError, retry, retryCount } = useComponentError('temperature-hero', 'Temperature Hero');
  const [weatherData, setWeatherData] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchWeatherData = async () => {
    try {
      setIsLoading(true);
      // Simulate API call with potential failure
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          if (Math.random() > 0.8) {
            reject(new Error('Weather API temporarily unavailable'));
          } else {
            resolve();
          }
        }, 1000);
      });

      setWeatherData({
        current: {
          temperature: 28 + Math.random() * 8,
          humidity: 70 + Math.random() * 20,
          description: 'Partly cloudy',
          icon: '⛅',
          windSpeed: 10 + Math.random() * 10,
          windDirection: 'NE',
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchWeatherData();
  }, []);

  const handleRetry = async () => {
    await retry(fetchWeatherData);
  };

  return (
    <TemperatureHero
      weatherData={weatherData}
      error={error}
      isLoading={isLoading}
      onRetry={handleRetry}
      hasPartialData={!!weatherData && !!error}
      dataQuality={error ? 0.5 : 0.9}
    />
  );
};

/**
 * Enhanced RegionalMapView with error handling
 */
const RegionalMapWithErrors = () => {
  const { networkStatus } = useErrorContext();
  const { error, handleError, retry } = useComponentError('regional-map', 'Regional Map');
  const [mapData, setMapData] = React.useState(null);
  const [isLoading, setIsLoading] = React.useState(true);

  const fetchMapData = async () => {
    try {
      setIsLoading(true);
      // Simulate data fetching
      await new Promise((resolve, reject) => {
        setTimeout(() => {
          if (networkStatus === 'offline') {
            reject(new Error('Cannot load map data while offline'));
          } else if (Math.random() > 0.9) {
            reject(new Error('Map service temporarily unavailable'));
          } else {
            resolve();
          }
        }, 1500);
      });

      setMapData({
        weatherData: {
          locations: [
            { id: '1', name: 'Newton', temperature: 28, humidity: 75, coordinates: { lat: 1.3138, lng: 103.8420 } },
            { id: '2', name: 'Clementi', temperature: 27, humidity: 78, coordinates: { lat: 1.3162, lng: 103.7649 } },
          ],
        },
        webcamData: {
          captures: [
            { id: '1', name: 'Newton Circus', status: 'success', location: 'Newton', coordinates: { lat: 1.3138, lng: 103.8420 } },
          ],
        },
      });
    } catch (error) {
      handleError(error);
    } finally {
      setIsLoading(false);
    }
  };

  React.useEffect(() => {
    fetchMapData();
  }, [networkStatus]);

  const handleRetry = async () => {
    await retry(fetchMapData);
  };

  return (
    <RegionalMapView
      weatherData={mapData?.weatherData}
      webcamData={mapData?.webcamData}
      isLoading={isLoading}
      error={error}
      onRetry={handleRetry}
      networkStatus={networkStatus}
      dataQuality={{
        weather: error ? 0.3 : 0.9,
        webcam: error ? 0.2 : 0.8,
      }}
    />
  );
};

/**
 * Global error status display
 */
const GlobalErrorStatus = () => {
  const { errors, getErrorStats, clearErrors } = useErrorContext();
  const errorStats = getErrorStats();

  if (errorStats.currentErrors === 0) {return null;}

  return (
    <div className="fixed bottom-4 right-4 max-w-md">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-semibold text-red-800">
            System Errors ({errorStats.currentErrors})
          </h4>
          <button
            onClick={clearErrors}
            className="text-xs text-red-600 hover:text-red-800 underline"
          >
            Clear All
          </button>
        </div>

        <div className="space-y-2">
          {Array.from(errors.entries()).slice(0, 3).map(([id, errorInfo]) => (
            <div key={id} className="text-xs text-red-700">
              <span className="font-medium">{errorInfo.componentName}:</span>{' '}
              {errorInfo.error.message}
            </div>
          ))}

          {errorStats.currentErrors > 3 && (
            <div className="text-xs text-red-600">
              And {errorStats.currentErrors - 3} more errors...
            </div>
          )}
        </div>

        <div className="mt-2 text-xs text-red-600">
          Network: {errorStats.networkStatus} | Recent: {errorStats.recentErrors}
        </div>
      </div>
    </div>
  );
};

/**
 * Skeleton components for loading states
 */
const TemperatureHeroSkeleton = () => (
  <div className="h-48 bg-gray-200 rounded-lg animate-pulse" />
);

const RegionalMapSkeleton = () => (
  <div className="h-96 bg-gray-200 rounded-lg animate-pulse" />
);

/**
 * Enhanced components using HOC pattern
 */
const EnhancedTemperatureHero = withErrorHandling(TemperatureHero, {
  componentName: 'Temperature Hero',
  autoRetry: true,
  maxRetries: 3,
});

const EnhancedRegionalMapView = withErrorHandling(RegionalMapView, {
  componentName: 'Regional Map View',
  autoRetry: false, // Manual retry only for maps
  maxRetries: 2,
});

export default AppWithErrorHandling;