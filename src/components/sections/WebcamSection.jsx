import React, { Suspense } from 'react';
import { useWebcamData } from "../../contexts/AppDataContextSimple";

// Lazy load webcam components
const WebcamGallery = React.lazy(() => import('../webcam/WebcamGallery'));

/**
 * Live Webcams Section Component
 * Displays real-time video feeds from key Singapore locations
 */
const WebcamSection = React.memo(() => {
  const { webcamData } = useWebcamData();

  const LoadingFallback = React.memo(() => (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-8 sm:p-12 text-center">
      <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-4 border-blue-600 mx-auto" />
      <p className="mt-4 sm:mt-6 text-gray-600 text-base sm:text-lg">Loading webcams...</p>
    </div>
  ));

  return (
    <section id="webcams" className="mb-8 sm:mb-12" aria-labelledby="webcams-heading" tabIndex="-1">
      <div className="mb-6 sm:mb-8">
        <h2 id="webcams-heading" className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 sm:mb-3">
          📸 Live Webcams
        </h2>
        <p className="text-base sm:text-lg text-gray-600">
          Real-time video feeds from key Singapore locations
        </p>
      </div>

      <Suspense fallback={<LoadingFallback />}>
        <WebcamGallery data={webcamData} />
      </Suspense>
    </section>
  );
});

WebcamSection.displayName = 'WebcamSection';

export default WebcamSection;