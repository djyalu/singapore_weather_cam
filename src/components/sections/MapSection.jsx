import React, { Suspense } from 'react';
import { useAppData } from '../../contexts/AppDataContextSimple';

// Lazy load the map component for better performance
const RegionalMapView = React.lazy(() => import('../map/RegionalMapView'));

/**
 * Interactive Map Section Component
 * Displays regional weather and traffic map with loading states
 */
const MapSection = React.memo(() => {
  const { weatherData, webcamData, isRefreshing } = useAppData(context => ({
    weatherData: context.data.weather,
    webcamData: context.data.webcam,
    isRefreshing: context.loading.isRefreshing,
  }));

  return (
    <section id="map" className="mb-8 sm:mb-12" aria-labelledby="map-heading" tabIndex="-1">
      <div className="mb-6 sm:mb-8">
        <h2 id="map-heading" className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">
          🗺️ Regional Weather & Traffic Map
        </h2>
        <p className="text-base sm:text-lg text-gray-600">
          Interactive map with regional selection and real-time data visualization
          {isRefreshing && (
            <span className="block sm:inline sm:ml-3 text-blue-600 animate-pulse font-medium">
              • Updating...
            </span>
          )}
        </p>
      </div>

      <Suspense
        fallback={
          <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-8 sm:p-12 text-center" aria-live="polite">
            <div
              className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-4 border-blue-600 mx-auto"
              aria-hidden="true"
            />
            <p className="mt-4 sm:mt-6 text-gray-600 text-base sm:text-lg">
              Loading interactive map...
            </p>
          </div>
        }
      >
        <RegionalMapView
          weatherData={weatherData}
          webcamData={webcamData}
        />
      </Suspense>
    </section>
  );
});

MapSection.displayName = 'MapSection';

export default MapSection;