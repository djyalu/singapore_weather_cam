import { useState } from 'react';
import WebcamCard from './WebcamCard';
import WebcamModal from './WebcamModal';

const WebcamGallery = ({ data }) => {
  const [selectedWebcam, setSelectedWebcam] = useState(null);

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
          <button className="btn-secondary text-sm">
            Refresh All
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {successfulCaptures.map((capture) => (
            <WebcamCard
              key={capture.id}
              webcam={capture}
              onClick={() => setSelectedWebcam(capture)}
            />
          ))}
        </div>
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