import React, { Suspense } from 'react';

const TrafficCameraGallery = React.lazy(() => import('../webcam/TrafficCameraGallery'));

const WebcamSection = React.memo(() => {
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
          🚗 Traffic Cameras
        </h2>
        <p className="text-base sm:text-lg text-gray-600">
          90개 실시간 교통 카메라 모니터링
        </p>
      </div>

      <Suspense fallback={<LoadingFallback />}>
        <TrafficCameraGallery />
      </Suspense>
    </section>
  );
});

WebcamSection.displayName = 'TrafficCameraSection';

export default WebcamSection;