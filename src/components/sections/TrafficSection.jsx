import React, { Suspense } from 'react';

// Lazy load traffic camera component
const TrafficCameraGallery = React.lazy(() => import('../webcam/TrafficCameraGallery'));

/**
 * Traffic Cameras Section Component
 * Displays real-time traffic conditions across Singapore
 */
const TrafficSection = React.memo(() => {
  const LoadingFallback = React.memo(() => (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-8 sm:p-12 text-center">
      <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-4 border-blue-600 mx-auto" />
      <p className="mt-4 sm:mt-6 text-gray-600 text-base sm:text-lg">Loading traffic cameras...</p>
    </div>
  ));

  return (
    <section id="traffic" className="mb-8 sm:mb-12" aria-labelledby="traffic-heading" tabIndex="-1">
      <div className="mb-6 sm:mb-8">
        <h2 id="traffic-heading" className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">
          🚗 Live Traffic Cameras
        </h2>
        <p className="text-base sm:text-lg text-gray-600">
          Real-time traffic conditions across Singapore (data.gov.sg)
        </p>
      </div>

      <Suspense fallback={<LoadingFallback />}>
        <TrafficCameraGallery />
      </Suspense>
    </section>
  );
});

TrafficSection.displayName = 'TrafficSection';

export default TrafficSection;