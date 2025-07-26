import { useState } from 'react';
import WebcamCard from './WebcamCard';
import WebcamModal from './WebcamModal';

const WebcamGallery = ({ data }) => {
  const [selectedWebcam, setSelectedWebcam] = useState(null);

  if (!data || !data.webcams || data.webcams.length === 0) {
    return (
      <div className="card">
        <p className="text-gray-500 text-center">No webcam data available</p>
      </div>
    );
  }

  const { webcams, lastUpdated } = data;

  return (
    <>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Last captured: {new Date(lastUpdated).toLocaleString('en-SG')}
          </p>
          <button className="btn-secondary text-sm">
            Refresh All
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {webcams.map((webcam) => (
            <WebcamCard
              key={webcam.id}
              webcam={webcam}
              onClick={() => setSelectedWebcam(webcam)}
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