import { useState, useEffect } from 'react';
import {
  fetchTrafficCameras,
  filterCamerasByArea,
  groupCamerasByArea,
  getFeaturedCameras,
} from '../../services/trafficCameraService';

const TrafficCameraGallery = () => {
  const [cameras, setCameras] = useState([]);
  const [filteredCameras, setFilteredCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedArea, setSelectedArea] = useState('all');
  const [viewMode, setViewMode] = useState('featured'); // 'featured', 'all', 'area'
  const [lastUpdate, setLastUpdate] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

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

  const fetchCameras = async () => {
    try {
      setLoading(true);
      const data = await fetchTrafficCameras();
      setCameras(data.cameras);
      setLastUpdate(new Date(data.timestamp));
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const groupedCameras = groupCamerasByArea(cameras);
  const areas = Object.keys(groupedCameras).sort();

  if (loading && cameras.length === 0) {
    return (
      <div className="card">
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="card">
        <div className="text-center py-8">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button
            onClick={fetchCameras}
            className="btn-primary"
          >
            Retry
          </button>
        </div>
      </div>
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
              onClick={fetchCameras}
              disabled={loading}
              className="btn-secondary text-sm"
            >
              {loading ? '업데이트 중...' : '🔄 새로고침'}
            </button>
          </div>
        </div>

        {lastUpdate && (
          <div className="mt-3 text-xs text-gray-500">
            마지막 업데이트: {lastUpdate.toLocaleString('ko-KR')}
          </div>
        )}
      </div>

      {/* Camera Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredCameras.map((camera) => (
          <div
            key={camera.id}
            className="card hover:shadow-lg transition-shadow"
          >
            <div className="aspect-video bg-gray-100 rounded overflow-hidden mb-3">
              <img
                src={`${camera.image.url}?t=${Date.now()}`}
                alt={camera.name}
                className="w-full h-full object-cover"
                loading="lazy"
                onError={(e) => {
                  e.target.src = '/images/placeholder.jpg';
                }}
              />
            </div>

            <h4 className="font-medium text-sm mb-1">{camera.name}</h4>
            <p className="text-xs text-gray-600 mb-2">{camera.area}</p>

            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>📍 {camera.id}</span>
              <span>{camera.image.width}×{camera.image.height}</span>
            </div>
          </div>
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