import React from 'react';
import PropTypes from 'prop-types';

const WebcamCard = ({ webcam, onClick }) => {
  const { name, location, file_info, ai_analysis, capture_time, type } = webcam;
  const [imageKey, setImageKey] = React.useState(Date.now());
  const [imageLoading, setImageLoading] = React.useState(true);
  const [imageError, setImageError] = React.useState(false);
  const [retryCount, setRetryCount] = React.useState(0);

  // 이미지 URL 생성 - 로컬 경로 우선, fallback 체인 구현
  const basePath = import.meta.env.BASE_URL || '/';
  const imageUrl = file_info?.url || file_info?.source_url || file_info?.path ?
    (file_info.url || file_info.source_url || `${basePath}${file_info.path}`) :
    `${basePath}images/placeholder.jpg`;

  // 이미지 로딩 상태 관리
  const handleImageLoad = () => {
    setImageLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoading(false);
    setImageError(true);
    // 3회까지 재시도
    if (retryCount < 3) {
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setImageKey(Date.now());
      }, 1000 + retryCount * 1000); // 점진적 지연
    }
  };

  // 재시도 시 로딩 상태 초기화
  React.useEffect(() => {
    if (retryCount > 0) {
      setImageLoading(true);
      setImageError(false);
    }
  }, [retryCount]);

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
        {/* 로딩 상태 표시 */}
        {imageLoading && (
          <div className="w-full h-48 bg-gray-200 rounded-md mb-4 flex items-center justify-center">
            <div className="text-gray-500 text-sm">로딩 중...</div>
          </div>
        )}

        {/* 에러 상태 표시 */}
        {imageError && retryCount >= 3 && (
          <div className="w-full h-48 bg-gray-100 border-2 border-dashed border-gray-300 rounded-md mb-4 flex flex-col items-center justify-center">
            <div className="text-gray-400 text-2xl mb-2">📷</div>
            <div className="text-gray-500 text-sm text-center">
              이미지를 불러올 수 없습니다
              <br />
              <span className="text-xs">네트워크를 확인해주세요</span>
            </div>
          </div>
        )}

        {/* 실제 이미지 */}
        <img
          key={imageKey}
          src={`${imageUrl}${imageUrl.includes('?') ? '&' : '?'}t=${imageKey}`}
          alt={`${name} webcam view`}
          className={`w-full h-48 object-cover rounded-md mb-4 transition-opacity duration-300 ${
            imageLoading || imageError ? 'hidden' : 'block'
          }`}
          loading="lazy"
          onLoad={handleImageLoad}
          onError={handleImageError}
        />

        {/* 오버레이 정보 - 이미지가 로드된 경우에만 표시 */}
        {!imageLoading && !imageError && (
          <>
            <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
              {new Date(capture_time).toLocaleTimeString('en-SG')}
            </div>
            <div className="absolute top-2 left-2 bg-blue-600 text-white px-2 py-1 rounded text-xs capitalize">
              {type}
            </div>
            <div className="absolute bottom-2 right-2 bg-green-600/80 text-white px-2 py-1 rounded text-xs">
              🔴 LIVE (30초 새로고침)
            </div>
          </>
        )}

        {/* 재시도 중 표시 */}
        {imageError && retryCount < 3 && (
          <div className="absolute top-2 left-2 bg-yellow-600 text-white px-2 py-1 rounded text-xs">
            재시도 중... ({retryCount + 1}/3)
          </div>
        )}
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

WebcamCard.propTypes = {
  webcam: PropTypes.shape({
    name: PropTypes.string.isRequired,
    location: PropTypes.string.isRequired,
    file_info: PropTypes.shape({
      source_url: PropTypes.string,
      url: PropTypes.string,
      path: PropTypes.string,
      size: PropTypes.number,
    }),
    ai_analysis: PropTypes.shape({
      analysis_available: PropTypes.bool,
      analysis: PropTypes.string,
      reason: PropTypes.string,
    }),
    capture_time: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
  }).isRequired,
  onClick: PropTypes.func.isRequired,
};

export default WebcamCard;