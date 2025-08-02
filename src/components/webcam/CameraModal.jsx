import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { X, Camera, MapPin, Clock, Maximize2, Minimize2, Download } from 'lucide-react';

/**
 * 교통 카메라 확대 보기 모달
 */
const CameraModal = ({ camera, isOpen, onClose }) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  // ESC 키로 모달 닫기
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {onClose();}
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // 카메라 변경 시 상태 초기화
  useEffect(() => {
    if (camera) {
      setImageLoaded(false);
      setImageError(false);
    }
  }, [camera]);

  if (!isOpen || !camera) {return null;}

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageLoaded(false);
    setImageError(true);
  };

  const handleDownload = () => {
    if (camera.image_url) {
      const link = document.createElement('a');
      link.href = camera.image_url;
      link.download = `${camera.name}-${new Date().toISOString().slice(0, 19)}.jpg`;
      link.click();
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 배경 오버레이 */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* 모달 컨테이너 */}
      <div className={`
        relative bg-white rounded-2xl shadow-2xl max-w-6xl mx-4 max-h-[90vh] overflow-hidden
        ${isFullscreen ? 'w-full h-full max-w-none max-h-none rounded-none' : 'w-full'}
      `}>
        {/* 헤더 */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="flex items-center gap-3">
            <Camera className="w-6 h-6" />
            <div>
              <h2 className="text-lg font-bold">{camera.name}</h2>
              <div className="flex items-center gap-2 text-sm text-blue-100">
                <MapPin className="w-4 h-4" />
                <span>Singapore Traffic Camera</span>
                <Clock className="w-4 h-4 ml-2" />
                <span>{new Date().toLocaleTimeString('ko-KR')}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* 다운로드 버튼 */}
            <button
              onClick={handleDownload}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="이미지 다운로드"
            >
              <Download className="w-5 h-5" />
            </button>

            {/* 전체화면 토글 */}
            <button
              onClick={toggleFullscreen}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title={isFullscreen ? '창 모드' : '전체화면'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5" />
              ) : (
                <Maximize2 className="w-5 h-5" />
              )}
            </button>

            {/* 닫기 버튼 */}
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              title="닫기 (ESC)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 이미지 영역 */}
        <div className={`
          relative bg-gray-100 flex items-center justify-center
          ${isFullscreen ? 'h-[calc(100vh-80px)]' : 'h-[60vh] min-h-[400px]'}
        `}>
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto mb-4"></div>
                <p className="text-gray-600">이미지 로딩 중...</p>
              </div>
            </div>
          )}

          {imageError && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <Camera className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">이미지를 불러올 수 없습니다</p>
                <p className="text-sm mt-2">카메라가 일시적으로 사용할 수 없거나<br />네트워크 연결을 확인해주세요</p>
              </div>
            </div>
          )}

          {camera.image_url && (
            <img
              src={camera.image_url}
              alt={`${camera.name} 교통 카메라 영상`}
              className={`
                max-w-full max-h-full object-contain transition-opacity duration-300
                ${imageLoaded ? 'opacity-100' : 'opacity-0'}
              `}
              onLoad={handleImageLoad}
              onError={handleImageError}
            />
          )}
        </div>

        {/* 하단 정보 */}
        <div className="p-4 bg-gray-50 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>실시간 영상</span>
              </div>
              {camera.location && (
                <div>
                  위치: {camera.location.latitude?.toFixed(4)}, {camera.location.longitude?.toFixed(4)}
                </div>
              )}
            </div>
            <div className="text-xs text-gray-500">
              출처: Singapore LTA Traffic Images API
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

CameraModal.propTypes = {
  camera: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    image_url: PropTypes.string,
    location: PropTypes.shape({
      latitude: PropTypes.number,
      longitude: PropTypes.number,
    }),
  }),
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default CameraModal;