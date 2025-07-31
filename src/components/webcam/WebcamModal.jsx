import { useEffect, useState, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';

const WebcamModal = ({
  item,
  items = [],
  currentIndex = 0,
  onClose,
  onNavigate,
  type = 'auto', // 'webcam', 'traffic', 'auto'
}) => {
  const [isZoomed, setIsZoomed] = useState(false);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [touchDevice, setTouchDevice] = useState(false);
  const modalRef = useRef(null);
  const imageRef = useRef(null);

  // Detect touch device
  useEffect(() => {
    const checkTouchDevice = () => {
      setTouchDevice(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        navigator.msMaxTouchPoints > 0,
      );
    };
    checkTouchDevice();
  }, []);

  // Auto-detect data type based on item structure
  const getItemType = (item) => {
    if (type !== 'auto') {return type;}
    if (item?.image?.url) {return 'traffic';}
    if (item?.file_info || item?.imageUrl) {return 'webcam';}
    return 'webcam';
  };

  const itemType = getItemType(item);

  // Normalize data structure for different types
  const normalizeItem = (item, type) => {
    if (type === 'traffic') {
      return {
        id: item.id,
        name: item.name,
        location: item.area,
        imageUrl: `${item.image.url}?t=${Date.now()}`,
        metadata: {
          id: item.id,
          resolution: `${item.image.width}×${item.image.height}`,
          area: item.area,
          type: 'Traffic Camera',
        },
        lastUpdated: new Date().toISOString(),
      };
    } else {
      // Webcam format
      const basePath = import.meta.env.BASE_URL || '/';
      const imageUrl = item.imageUrl ||
                      item.file_info?.url ||
                      item.file_info?.source_url ||
                      (item.file_info?.path ? `${basePath}${item.file_info.path}` : null) ||
                      `${basePath}images/placeholder.jpg`;

      return {
        id: item.id,
        name: item.name,
        location: item.location,
        imageUrl,
        coordinates: item.coordinates,
        analysis: item.ai_analysis || item.analysis,
        metadata: {
          type: item.type || 'Webcam',
          captureTime: item.capture_time,
          ...(item.file_info && { fileInfo: item.file_info }),
        },
        lastUpdated: item.capture_time || item.lastUpdated,
      };
    }
  };

  const normalizedItem = normalizeItem(item, itemType);
  const hasNavigation = items.length > 1;

  // Focus management
  useEffect(() => {
    if (modalRef.current) {
      modalRef.current.focus();
    }
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (hasNavigation && currentIndex > 0) {
            onNavigate?.(currentIndex - 1);
          }
          break;
        case 'ArrowRight':
          if (hasNavigation && currentIndex < items.length - 1) {
            onNavigate?.(currentIndex + 1);
          }
          break;
        case 'z':
        case 'Z':
          if (!touchDevice) {
            setIsZoomed(prev => !prev);
          }
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onNavigate, hasNavigation, currentIndex, items.length, touchDevice]);

  const handleBackdropClick = useCallback((e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  }, [onClose]);

  const handleImageLoad = useCallback(() => {
    setImageLoading(false);
    setImageError(false);
  }, []);

  const handleImageError = useCallback(() => {
    setImageLoading(false);
    setImageError(true);
  }, []);

  const handleImageClick = useCallback(() => {
    if (!touchDevice) {
      setIsZoomed(prev => !prev);
    }
  }, [touchDevice]);

  // Touch gestures for zoom
  const handleTouchStart = useCallback((e) => {
    if (e.touches.length === 2) {
      setIsZoomed(true);
    }
  }, []);

  return (
    <div
      ref={modalRef}
      className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-2 sm:p-4"
      onClick={handleBackdropClick}
      tabIndex={-1}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[95vh] overflow-hidden animate-fade-in shadow-2xl">
        {/* Header */}
        <div className="p-3 sm:p-4 border-b flex items-center justify-between bg-gray-50">
          <div className="flex-1 min-w-0">
            <h2 id="modal-title" className="text-lg sm:text-xl font-semibold truncate">
              {normalizedItem.name}
            </h2>
            <p className="text-sm text-gray-600 truncate">
              📍 {normalizedItem.location}
            </p>
          </div>

          {/* Navigation controls */}
          {hasNavigation && (
            <div className="flex items-center gap-2 mx-4">
              <button
                onClick={() => onNavigate?.(currentIndex - 1)}
                disabled={currentIndex === 0}
                className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Previous image"
              >
                ←
              </button>
              <span className="text-sm text-gray-600 min-w-fit">
                {currentIndex + 1} / {items.length}
              </span>
              <button
                onClick={() => onNavigate?.(currentIndex + 1)}
                disabled={currentIndex === items.length - 1}
                className="p-2 rounded-full bg-gray-200 hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Next image"
              >
                →
              </button>
            </div>
          )}

          <button
            onClick={onClose}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded-full transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
            aria-label="Close modal"
          >
            ✕
          </button>
        </div>

        {/* Image container */}
        <div className="relative bg-gray-100">
          {/* Loading state */}
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}

          {/* Main image */}
          <div
            className={`
              overflow-auto max-h-[60vh] sm:max-h-[70vh]
              ${isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}
              ${!touchDevice ? 'hover:opacity-90' : ''}
            `}
            onTouchStart={touchDevice ? handleTouchStart : undefined}
          >
            <img
              ref={imageRef}
              src={normalizedItem.imageUrl}
              alt={`${normalizedItem.name} view`}
              className={`
                w-full transition-all duration-300
                ${isZoomed ? 'scale-150 sm:scale-200' : 'scale-100'}
                ${!touchDevice ? 'hover:scale-105' : ''}
              `}
              style={{
                transformOrigin: 'center center',
                touchAction: touchDevice ? 'pinch-zoom' : 'none',
              }}
              loading="lazy"
              onLoad={handleImageLoad}
              onError={handleImageError}
              onClick={handleImageClick}
              draggable={false}
            />
          </div>

          {/* Error state */}
          {imageError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 text-gray-500">
              <div className="text-4xl mb-2">📷</div>
              <div className="text-center">
                <p>이미지를 불러올 수 없습니다</p>
                <p className="text-sm mt-1">Image failed to load</p>
              </div>
            </div>
          )}

          {/* Zoom hint */}
          {!touchDevice && !isZoomed && (
            <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
              Click to zoom (Z)
            </div>
          )}

          {/* Touch hint */}
          {touchDevice && (
            <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
              Pinch to zoom
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4 overflow-y-auto max-h-[25vh] space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Location & Metadata */}
            <div>
              <h3 className="font-semibold mb-2">위치 정보 / Location Details</h3>
              <p className="text-gray-600 mb-2">{normalizedItem.location}</p>

              {normalizedItem.coordinates && (
                <p className="text-sm text-gray-500">
                  좌표: {normalizedItem.coordinates.lat}, {normalizedItem.coordinates.lng}
                </p>
              )}

              <div className="mt-3 space-y-1">
                <div className="flex items-center gap-2 text-sm">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                    {normalizedItem.metadata.type}
                  </span>
                  {normalizedItem.metadata.resolution && (
                    <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs">
                      {normalizedItem.metadata.resolution}
                    </span>
                  )}
                </div>
                {normalizedItem.metadata.id && (
                  <p className="text-xs text-gray-500">ID: {normalizedItem.metadata.id}</p>
                )}
              </div>
            </div>

            {/* AI Analysis (if available) */}
            {normalizedItem.analysis && (
              <div>
                <h3 className="font-semibold mb-2">📊 이미지 분석 / Data Analysis</h3>
                <p className="text-gray-700 mb-2 text-sm">{normalizedItem.analysis.description}</p>
                {normalizedItem.analysis.tags && (
                  <div className="flex flex-wrap gap-2 mb-2">
                    {normalizedItem.analysis.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="text-xs bg-blue-600 text-white px-2 py-1 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                {normalizedItem.analysis.weatherCondition && (
                  <p className="text-sm text-gray-600">
                    날씨: {normalizedItem.analysis.weatherCondition}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Footer info */}
          <div className="pt-3 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm text-gray-500">
              <span>
                마지막 업데이트: {normalizedItem.lastUpdated ? new Date(normalizedItem.lastUpdated).toLocaleString('ko-KR') : 'Unknown'}
              </span>
              {hasNavigation && (
                <span className="text-xs">
                  키보드: ← → (탐색), ESC (닫기), Z (확대)
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

WebcamModal.propTypes = {
  item: PropTypes.object.isRequired,
  items: PropTypes.array,
  currentIndex: PropTypes.number,
  onClose: PropTypes.func.isRequired,
  onNavigate: PropTypes.func,
  type: PropTypes.oneOf(['webcam', 'traffic', 'auto']),
};

WebcamModal.defaultProps = {
  items: [],
  currentIndex: 0,
  onNavigate: null,
  type: 'auto',
};

export default WebcamModal;