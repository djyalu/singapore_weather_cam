import { useState, useEffect } from 'react';
import {
  fetchTrafficCameras,
  filterCamerasByArea,
  groupCamerasByArea,
  getFeaturedCameras,
} from '../../services/trafficCameraService';
import LoadingSkeleton from './LoadingSkeleton';
import ErrorState from './ErrorState';

/**
 * Individual Camera Card Component with enhanced loading states
 */
const CameraCard = ({ camera, index }) => {
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

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

  return (
    <div
      className="card hover:shadow-lg transition-all duration-300 card-interactive"
      style={{ 
        animationDelay: `${(index % 8) * 50}ms`,
      }}
    >
      <div className="aspect-video bg-gray-100 rounded overflow-hidden mb-3 relative group">
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
          className="w-full h-full object-cover transition-all duration-500 group-hover:scale-105"
          loading="lazy"
          onLoad={handleImageLoad}
          onError={handleImageError}
          style={{ opacity: imageLoading ? '0' : '1' }}
        />

        {/* Image error overlay */}
        {imageError && (
          <div className="absolute inset-0 bg-gray-100 flex flex-col items-center justify-center text-gray-500">
            <div className="text-2xl mb-2">📷</div>
            <div className="text-xs text-center">이미지를 불러올 수<br />없습니다</div>
          </div>
        )}

        {/* Live indicator */}
        <div className="absolute top-2 right-2 bg-red-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
          LIVE
        </div>
      </div>

      {/* Camera info */}
      <h4 className="font-medium text-sm mb-1 line-clamp-1" title={camera.name}>
        {camera.name}
      </h4>
      <p className="text-xs text-gray-600 mb-2 line-clamp-1" title={camera.area}>
        📍 {camera.area}
      </p>

      {/* Metadata */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        <span className="bg-gray-100 px-2 py-1 rounded">ID: {camera.id}</span>
        <span className="bg-blue-50 text-blue-600 px-2 py-1 rounded">
          {camera.image.width}×{camera.image.height}
        </span>
      </div>

      {/* Accessibility */}
      <div className="sr-only">
        실시간 교통 카메라: {camera.name}, 위치: {camera.area}, 
        해상도: {camera.image.width}×{camera.image.height}픽셀
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
    <div className="space-y-6">
      {/* Controls */}
      <div className="card">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setViewMode('featured')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                viewMode === 'featured'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              ⭐ 주요 지점
            </button>
            <button
              onClick={() => setViewMode('area')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                viewMode === 'area'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              📍 지역별
            </button>
            <button
              onClick={() => setViewMode('all')}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                viewMode === 'all'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              🗺️ 전체
            </button>
          </div>

          {viewMode === 'area' && (
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="px-3 py-1 border rounded text-sm"
            >
              <option value="all">모든 지역</option>
              {areas.map(area => (
                <option key={area} value={area}>
                  {area} ({groupedCameras[area].length})
                </option>
              ))}
            </select>
          )}

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded"
              />
              자동 새로고침
            </label>

            <button
              onClick={handleManualRefresh}
              disabled={loading || isRefreshing}
              className="btn-secondary text-sm"
            >
              {isRefreshing ? (
                <span className="flex items-center gap-2">
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  업데이트 중...
                </span>
              ) : (
                '🔄 새로고침'
              )}
            </button>
          </div>
        </div>

        {lastUpdate && (
          <div className="mt-3 text-xs text-gray-500">
            마지막 업데이트: {lastUpdate.toLocaleString('ko-KR')}
          </div>
        )}
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

      {/* Camera Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredCameras.map((camera, index) => (
          <CameraCard 
            key={camera.id}
            camera={camera}
            index={index}
          />
        ))}
      </div>

      {/* Summary */}
      <div className="card">
        <div className="flex items-center justify-between text-sm">
          <span>
            총 {cameras.length}개 카메라 중 {filteredCameras.length}개 표시
          </span>
          <span className="text-green-600">
            🟢 실시간 (data.gov.sg API)
          </span>
        </div>
      </div>
    </div>
  );
};

export default TrafficCameraGallery;