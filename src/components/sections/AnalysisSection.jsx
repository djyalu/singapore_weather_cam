import React, { Suspense } from 'react';
import { useAppData } from '../../contexts/AppDataContext';

// Lazy load analysis components
const WeatherAnalysisCardRefactored = React.lazy(() => import('../analysis/WeatherAnalysisCardRefactored'));

/**
 * Weather Analysis Section Component
 * Displays AI-analyzed weather conditions for key locations
 */
const AnalysisSection = React.memo(() => {
  const { webcamData, isInitialLoading, dataFreshness } = useAppData(context => ({
    webcamData: context.data.webcam,
    isInitialLoading: context.loading.isInitialLoading,
    dataFreshness: context.freshness.dataFreshness,
  }));

  const LoadingSkeleton = React.memo(() => (
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
  ));

  const AnalysisCardSkeleton = React.memo(() => (
    <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6 animate-pulse" aria-hidden="true">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="h-24 sm:h-32 bg-gray-200 rounded mb-4"></div>
      <div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
    </div>
  ));

  return (
    <section id="analysis" className="mb-8 sm:mb-12" aria-labelledby="analysis-heading" tabIndex="-1">
      <div className="mb-6 sm:mb-8">
        <h2 id="analysis-heading" className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">
          🌍 Real-time Regional Weather Analysis
        </h2>
        <p className="text-base sm:text-lg text-gray-600">
          AI-analyzed current weather conditions for key locations
          {dataFreshness && (
            <span className="block sm:inline sm:ml-3 text-sm text-gray-500 font-medium">
              • {dataFreshness}
            </span>
          )}
        </p>
      </div>

      {isInitialLoading ? (
        <LoadingSkeleton />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          <Suspense fallback={<AnalysisCardSkeleton />}>
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
  );
});

AnalysisSection.displayName = 'AnalysisSection';

export default AnalysisSection;