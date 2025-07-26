import { useEffect } from 'react';

const WebcamModal = ({ webcam, onClose }) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [onClose]);

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden animate-fade-in">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">{webcam.name}</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>
        
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          <img
            src={webcam.imageUrl || '/images/placeholder.jpg'}
            alt={`${webcam.name} webcam view`}
            className="w-full rounded-md mb-4"
          />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold mb-2">Location Details</h3>
              <p className="text-gray-600">{webcam.location}</p>
              {webcam.coordinates && (
                <p className="text-sm text-gray-500 mt-1">
                  Coordinates: {webcam.coordinates.lat}, {webcam.coordinates.lng}
                </p>
              )}
            </div>
            
            {webcam.analysis && (
              <div>
                <h3 className="font-semibold mb-2">AI Analysis</h3>
                <p className="text-gray-700 mb-2">{webcam.analysis.description}</p>
                <div className="flex flex-wrap gap-2">
                  {webcam.analysis.tags?.map((tag, index) => (
                    <span 
                      key={index}
                      className="text-xs bg-weather-blue text-white px-2 py-1 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
                {webcam.analysis.weatherCondition && (
                  <p className="text-sm text-gray-600 mt-2">
                    Weather: {webcam.analysis.weatherCondition}
                  </p>
                )}
              </div>
            )}
          </div>
          
          <div className="mt-4 text-sm text-gray-500">
            Last updated: {new Date(webcam.lastUpdated).toLocaleString('en-SG')}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebcamModal;