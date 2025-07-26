import React from 'react';

const WebcamCard = ({ webcam, onClick }) => {
  const { id, name, location, file_info, ai_analysis, capture_time, type } = webcam;
  const [imageKey, setImageKey] = React.useState(Date.now());

  // 이미지 URL 생성 - API 소스 URL을 직접 사용
  const basePath = import.meta.env.BASE_URL || '/';
  const imageUrl = file_info?.source_url || file_info?.url || file_info?.path ?
    (file_info.source_url || file_info.url || `${basePath}${file_info.path}`) :
    `${basePath}images/placeholder.jpg`;

  // 30초마다 이미지 새로고침 (실시간 효과)
  React.useEffect(() => {
    const interval = setInterval(() => {
      setImageKey(Date.now());
    }, 30000); // 30초

    return () => clearInterval(interval);
  }, []);

  return (
    <div
      className="card cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
      onClick={onClick}
    >
      <div className="relative">
        <img
          key={imageKey}
          src={`${imageUrl}${imageUrl.includes('?') ? '&' : '?'}t=${imageKey}`}
          alt={`${name} webcam view`}
          className="w-full h-48 object-cover rounded-md mb-4"
          loading="lazy"
        />
        <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
          {new Date(capture_time).toLocaleTimeString('en-SG')}
        </div>
        <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs capitalize">
          {type}
        </div>
        <div className="absolute bottom-2 right-2 bg-green-600/80 text-white px-2 py-1 rounded text-xs">
          🔴 LIVE (30초 새로고침)
        </div>
      </div>

      <h3 className="text-lg font-semibold mb-2">{name}</h3>
      <p className="text-sm text-gray-600 mb-2">{location}</p>

      {file_info && (
        <p className="text-xs text-gray-500 mb-3">
          Size: {Math.round(file_info.size / 1024)}KB
        </p>
      )}

      {ai_analysis && ai_analysis.analysis_available && (
        <div className="border-t pt-3">
          <p className="text-sm text-gray-700">
            <span className="font-medium">AI Analysis:</span> {ai_analysis.analysis}
          </p>
        </div>
      )}

      {ai_analysis && !ai_analysis.analysis_available && (
        <div className="border-t pt-3">
          <p className="text-xs text-gray-500">
            AI Analysis: {ai_analysis.reason}
          </p>
        </div>
      )}
    </div>
  );
};

export default WebcamCard;