import { useState } from 'react';
import WebcamCard from './WebcamCard';
import WebcamModal from './WebcamModal';
import LiveWebcamFeed from './LiveWebcamFeed';

const WebcamGallery = ({ data }) => {
  const [selectedWebcam, setSelectedWebcam] = useState(null);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'live'

  if (!data || !data.captures || data.captures.length === 0) {
    return (
      <div className="card">
        <p className="text-gray-500 text-center">No webcam data available</p>
      </div>
    );
  }

  // 성공한 캡처만 필터링
  const successfulCaptures = data.captures.filter(capture => capture.status === 'success');

  if (successfulCaptures.length === 0) {
    return (
      <div className="card">
        <p className="text-gray-500 text-center">No webcam images captured successfully</p>
        <p className="text-sm text-gray-400 text-center mt-2">
          {data.failed_captures} cameras failed to capture
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600">
              Last captured: {new Date(data.timestamp).toLocaleString('en-SG')}
            </p>
            <p className="text-xs text-gray-500">
              {data.successful_captures}/{data.total_cameras} cameras active
            </p>
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                viewMode === 'grid'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              📷 그리드 보기
            </button>
            <button
              onClick={() => setViewMode('live')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                viewMode === 'live'
                  ? 'bg-red-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              🔴 라이브 모드
            </button>
          </div>
        </div>

        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {successfulCaptures.map((capture) => (
              <WebcamCard
                key={capture.id}
                webcam={capture}
                onClick={() => setSelectedWebcam(capture)}
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {successfulCaptures.map((capture) => (
              <LiveWebcamFeed
                key={capture.id}
                webcam={capture}
              />
            ))}
          </div>
        )}
      </div>

      {selectedWebcam && (
        <WebcamModal
          webcam={selectedWebcam}
          onClose={() => setSelectedWebcam(null)}
        />
      )}
    </>
  );
};

export default WebcamGallery;