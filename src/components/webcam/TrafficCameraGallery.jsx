import { useState, useEffect, useRef, useCallback } from 'react';
import {
  fetchTrafficCameras,
  filterCamerasByArea,
  groupCamerasByArea,
  getFeaturedCameras,
} from '../../services/trafficCameraService';
import LoadingSkeleton from './LoadingSkeleton';
import ErrorState from './ErrorState';
import WebcamModal from './WebcamModal';

/**
 * Individual Camera Card Component with enhanced mobile touch interactions
 */
const CameraCard = ({ camera, index, onImageTap, onCardPress }) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [isPressed, setIsPressed] = useState(false);
  const touchStartRef = useRef(null);
  const pressTimeoutRef = useRef(null);

  const handleImageLoad = (e) => {
    setImageLoading(false);
    e.target.style.opacity = '1';
  };

  const handleImageError = (e) => {
    setImageLoading(false);
    setImageError(true);
    e.target.src = '/images/placeholder.jpg';
    e.target.style.opacity = '0.7';
  };

  // Enhanced touch interactions for mobile
  const handleTouchStart = useCallback((e) => {
    touchStartRef.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now(),
    };

    // Add visual feedback for touch
    setIsPressed(true);

    // Long press detection for camera details
    pressTimeoutRef.current = setTimeout(() => {
      if (onCardPress) {
        onCardPress(camera);
        // Haptic feedback on supported devices
        if (navigator.vibrate) {
          navigator.vibrate(50);
        }
      }
    }, 500);
  }, [camera, onCardPress]);

  const handleTouchEnd = useCallback((e) => {
    setIsPressed(false);

    if (pressTimeoutRef.current) {
      clearTimeout(pressTimeoutRef.current);
    }

    if (!touchStartRef.current) {return;}

    const touchEnd = {
      x: e.changedTouches[0].clientX,
      y: e.changedTouches[0].clientY,
      time: Date.now(),
    };

    const deltaX = touchEnd.x - touchStartRef.current.x;
    const deltaY = touchEnd.y - touchStartRef.current.y;
    const deltaTime = touchEnd.time - touchStartRef.current.time;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Quick tap detection (< 300ms, < 10px movement)
    if (deltaTime < 300 && distance < 10 && onImageTap) {
      onImageTap(camera);
    }

    touchStartRef.current = null;
  }, [camera, onImageTap]);

  const handleTouchCancel = useCallback(() => {
    setIsPressed(false);
    if (pressTimeoutRef.current) {
      clearTimeout(pressTimeoutRef.current);
    }
    touchStartRef.current = null;
  }, []);

  // Prevent context menu on long press
  const handleContextMenu = useCallback((e) => {
    e.preventDefault();
  }, []);

  return (
    <div
      className={`
        card transition-all duration-300 card-interactive touch-manipulation
        ${isPressed ? 'scale-95 shadow-md' : 'hover:shadow-lg active:scale-98'}
        cursor-pointer select-none
      `}
      style={{
        animationDelay: `${(index % 8) * 50}ms`,
        WebkitTapHighlightColor: 'transparent',
      }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      onContextMenu={handleContextMenu}
      role="button"
      tabIndex={0}
      aria-label={`${camera.name} 카메라 보기`}
    >
      <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden mb-3 relative group">
        {/* Image loading skeleton overlay */}
        {imageLoading && (
          <div className="absolute inset-0 skeleton flex items-center justify-center z-10">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}

        {/* Actual camera image */}
        <img
          src={`${camera.image.url}?t=${Date.now()}`}
          alt={`${camera.name} 실시간 카메라`}
          className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105 group-active:scale-95"
          loading="lazy"
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{
            opacity: imageLoading ? '0' : '1',
            touchAction: 'manipulation',
          }}
          draggable={false}
        />

        {/* Image error overlay */}
        {imageError && (
          <div className="absolute inset-0 bg-gray-100 flex flex-col items-center justify-center text-gray-500">
            <div className="text-xl sm:text-2xl mb-2">📷</div>
            <div className="text-xs text-center px-2">이미지를 불러올 수<br />없습니다</div>
          </div>
        )}

        {/* Live indicator - Enhanced for mobile */}
        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          <span className="hidden xs:inline">LIVE</span>
          <span className="xs:hidden">●</span>
        </div>

        {/* Touch interaction hint overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 group-active:bg-opacity-10 transition-all duration-200 pointer-events-none" />
      </div>

      {/* Camera info - Enhanced mobile typography */}
      <div className="space-y-2">
        <h4 className="font-medium text-sm sm:text-base mb-1 line-clamp-1 leading-tight" title={camera.name}>
          {camera.name}
        </h4>
        <p className="text-xs sm:text-sm text-gray-600 mb-2 line-clamp-1 leading-relaxed" title={camera.area}>
          📍 {camera.area}
        </p>

        {/* Metadata - Mobile optimized */}
        <div className="flex items-center justify-between text-xs text-gray-500 gap-2">
          <span className="bg-gray-100 px-2 py-1 rounded text-xs flex-shrink-0">
            ID: {camera.id}
          </span>
          <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded text-xs flex-shrink-0">
            {camera.image.width}×{camera.image.height}
          </span>
        </div>
      </div>

      {/* Mobile interaction indicators */}
      <div className="absolute bottom-2 left-2 opacity-0 group-active:opacity-100 transition-opacity duration-200">
        <div className="text-xs text-gray-400 bg-white bg-opacity-80 px-2 py-1 rounded">
          탭하여 모달 열기
        </div>
      </div>

      {/* Accessibility */}
      <div className="sr-only">
        실시간 교통 카메라: {camera.name}, 위치: {camera.area},
        해상도: {camera.image.width}×{camera.image.height}픽셀.
        탭하여 확대 모달 열기, 화살표 키로 탐색 가능
      </div>
    </div>
  );
};

const TrafficCameraGallery = () => {
  const [cameras, setCameras] = useState([]);
  const [filteredCameras, setFilteredCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedArea, setSelectedArea] = useState('all');
  const [viewMode, setViewMode] = useState('featured'); // 'featured', 'all', 'area'
  const [lastUpdate, setLastUpdate] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [retryAttempts, setRetryAttempts] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchDevice, setTouchDevice] = useState(false);

  // Detect touch device on mount
  useEffect(() => {
    const checkTouchDevice = () => {
      setTouchDevice(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        navigator.msMaxTouchPoints > 0,
      );
    };

    checkTouchDevice();
    window.addEventListener('touchstart', checkTouchDevice, { once: true });

    return () => {
      window.removeEventListener('touchstart', checkTouchDevice);
    };
  }, []);

  // Fetch cameras on mount and set up auto-refresh
  useEffect(() => {
    fetchCameras();

    if (autoRefresh) {
      const interval = setInterval(fetchCameras, 60000); // Update every minute
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Filter cameras when selection changes
  useEffect(() => {
    if (viewMode === 'featured') {
      setFilteredCameras(getFeaturedCameras(cameras));
    } else if (viewMode === 'area' && selectedArea !== 'all') {
      setFilteredCameras(filterCamerasByArea(cameras, selectedArea));
    } else {
      setFilteredCameras(cameras);
    }
  }, [cameras, viewMode, selectedArea]);

  const fetchCameras = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }

      const data = await fetchTrafficCameras();
      setCameras(data.cameras);
      setLastUpdate(new Date(data.timestamp));
      setError(null);
      setRetryAttempts(0); // Reset retry attempts on success
    } catch (err) {
      setError(err.message);
      setRetryAttempts(prev => prev + 1);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRetry = async () => {
    await fetchCameras(false);
  };

  const handleManualRefresh = async () => {
    await fetchCameras(true);
  };

  // Mobile interaction handlers
  const handleImageTap = useCallback((camera) => {
    const index = filteredCameras.findIndex(c => c.id === camera.id);
    setSelectedCamera(camera);
    setCurrentIndex(index >= 0 ? index : 0);
  }, [filteredCameras]);

  const handleCardPress = useCallback((camera) => {
    // For long press, also open the modal (same as tap for unified experience)
    handleImageTap(camera);
  }, [handleImageTap]);

  const handleCloseModal = useCallback(() => {
    setSelectedCamera(null);
    setCurrentIndex(0);
  }, []);

  // Swipe gesture for view mode switching on mobile
  const handleSwipeGesture = useCallback((direction) => {
    if (!touchDevice) {return;}

    const modes = ['featured', 'area', 'all'];
    const currentIndex = modes.indexOf(viewMode);

    if (direction === 'left' && currentIndex < modes.length - 1) {
      setViewMode(modes[currentIndex + 1]);
    } else if (direction === 'right' && currentIndex > 0) {
      setViewMode(modes[currentIndex - 1]);
    }
  }, [viewMode, touchDevice]);

  const groupedCameras = groupCamerasByArea(cameras);
  const areas = Object.keys(groupedCameras).sort();

  // Show skeleton loading state for initial load
  if (loading && cameras.length === 0) {
    return (
      <LoadingSkeleton
        count={8}
        showControls={true}
        showSummary={true}
        variant="default"
      />
    );
  }

  // Show enhanced error state
  if (error && cameras.length === 0) {
    return (
      <ErrorState
        error={error}
        onRetry={handleRetry}
        retryAttempts={retryAttempts}
        maxRetries={3}
        showDetails={false}
        variant="default"
      />
    );
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Controls - Enhanced for mobile */}
      <div className="card">
        {/* Mobile hint for touch interactions */}
        {touchDevice && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="text-sm text-blue-800">
              💡 <strong>터치 가이드:</strong> 카메라를 탭하여 확대 보기 (화살표 키로 탐색, ESC로 닫기)
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4">
          {/* View Mode Buttons - Mobile optimized */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="grid grid-cols-3 gap-2 sm:flex sm:gap-2">
              <button
                onClick={() => setViewMode('featured')}
                className={`
                  px-4 py-3 sm:px-3 sm:py-2 rounded-lg text-sm sm:text-sm 
                  font-medium transition-all duration-200 touch-manipulation
                  min-h-[44px] sm:min-h-[auto] flex items-center justify-center
                  ${viewMode === 'featured'
      ? 'bg-blue-600 text-white shadow-md transform scale-105'
      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 active:scale-95'
    }
                `}
                aria-pressed={viewMode === 'featured'}
              >
                <span className="flex items-center gap-1">
                  <span>⭐</span>
                  <span className="hidden xs:inline">주요 지점</span>
                  <span className="xs:hidden">주요</span>
                </span>
              </button>
              <button
                onClick={() => setViewMode('area')}
                className={`
                  px-4 py-3 sm:px-3 sm:py-2 rounded-lg text-sm sm:text-sm 
                  font-medium transition-all duration-200 touch-manipulation
                  min-h-[44px] sm:min-h-[auto] flex items-center justify-center
                  ${viewMode === 'area'
      ? 'bg-blue-600 text-white shadow-md transform scale-105'
      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 active:scale-95'
    }
                `}
                aria-pressed={viewMode === 'area'}
              >
                <span className="flex items-center gap-1">
                  <span>📍</span>
                  <span className="hidden xs:inline">지역별</span>
                  <span className="xs:hidden">지역</span>
                </span>
              </button>
              <button
                onClick={() => setViewMode('all')}
                className={`
                  px-4 py-3 sm:px-3 sm:py-2 rounded-lg text-sm sm:text-sm 
                  font-medium transition-all duration-200 touch-manipulation
                  min-h-[44px] sm:min-h-[auto] flex items-center justify-center
                  ${viewMode === 'all'
      ? 'bg-blue-600 text-white shadow-md transform scale-105'
      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 active:scale-95'
    }
                `}
                aria-pressed={viewMode === 'all'}
              >
                <span className="flex items-center gap-1">
                  <span>🗺️</span>
                  <span className="hidden xs:inline">전체</span>
                  <span className="xs:hidden">전체</span>
                </span>
              </button>
            </div>

            {/* Swipe hint for mobile */}
            {touchDevice && (
              <div className="text-xs text-gray-500 text-center sm:text-right">
                ← 스와이프하여 모드 변경 →
              </div>
            )}
          </div>

          {/* Area Selection - Mobile optimized */}
          {viewMode === 'area' && (
            <div className="w-full">
              <select
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="
                  w-full px-4 py-3 border-2 border-gray-200 rounded-lg text-sm
                  bg-white touch-manipulation min-h-[44px] focus:border-blue-500
                  focus:ring-2 focus:ring-blue-200 transition-all duration-200
                "
                aria-label="지역 선택"
              >
                <option value="all">모든 지역</option>
                {areas.map(area => (
                  <option key={area} value={area}>
                    {area} ({groupedCameras[area].length}개)
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Controls Row - Mobile optimized */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
            <label className="flex items-center gap-3 text-sm touch-manipulation min-h-[44px] cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="w-5 h-5 rounded border-2 border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-200"
              />
              <span className="select-none">자동 새로고침</span>
            </label>

            <button
              onClick={handleManualRefresh}
              disabled={loading || isRefreshing}
              className="
                btn-secondary text-sm font-medium px-4 py-3 sm:py-2
                rounded-lg transition-all duration-200 touch-manipulation
                min-h-[44px] sm:min-h-[auto] disabled:opacity-50
                disabled:cursor-not-allowed active:scale-95
                flex items-center justify-center gap-2
              "
              aria-label="수동 새로고침"
            >
              {isRefreshing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>업데이트 중...</span>
                </>
              ) : (
                <>
                  <span>🔄</span>
                  <span>새로고침</span>
                </>
              )}
            </button>
          </div>

          {/* Last Update Info */}
          {lastUpdate && (
            <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span>마지막 업데이트: {lastUpdate.toLocaleString('ko-KR')}</span>
                <span className="text-green-600 flex items-center gap-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  실시간
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Loading state for refresh */}
      {isRefreshing && cameras.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-center gap-2 text-blue-800">
            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-sm font-medium">카메라 데이터를 새로고침하는 중...</span>
          </div>
        </div>
      )}

      {/* Error state for refresh errors (non-blocking) */}
      {error && cameras.length > 0 && (
        <ErrorState
          error={error}
          onRetry={handleRetry}
          retryAttempts={retryAttempts}
          maxRetries={3}
          showDetails={false}
          variant="inline"
        />
      )}

      {/* Camera Grid - Enhanced mobile responsiveness */}
      <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4">
        {filteredCameras.map((camera, index) => (
          <CameraCard
            key={camera.id}
            camera={camera}
            index={index}
            onImageTap={handleImageTap}
            onCardPress={handleCardPress}
          />
        ))}
      </div>

      {/* Summary - Mobile optimized */}
      <div className="card">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
          <span className="text-gray-700">
            총 <strong>{cameras.length}</strong>개 카메라 중 <strong>{filteredCameras.length}</strong>개 표시
          </span>
          <span className="text-green-600 flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
            <span className="hidden sm:inline">실시간 (data.gov.sg API)</span>
            <span className="sm:hidden">실시간</span>
          </span>
        </div>
      </div>

      {/* Shared WebcamModal */}
      {selectedCamera && (
        <WebcamModal
          item={selectedCamera}
          items={filteredCameras}
          currentIndex={currentIndex}
          type="traffic"
          onClose={handleCloseModal}
          onNavigate={(newIndex) => {
            setCurrentIndex(newIndex);
            setSelectedCamera(filteredCameras[newIndex]);
          }}
        />
      )}
    </div>
  );
};

export default TrafficCameraGallery;