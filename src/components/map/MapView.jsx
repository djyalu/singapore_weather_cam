import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { COORDINATES } from '../../config/constants';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

const weatherIcon = L.divIcon({
  html: '<div class="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg">🌡️</div>',
  className: 'custom-div-icon',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const webcamIcon = L.divIcon({
  html: '<div class="bg-red-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg">📷</div>',
  className: 'custom-div-icon',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const trafficCameraIcon = L.divIcon({
  html: '<div class="bg-orange-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-md border border-white">🚗</div>',
  className: 'custom-div-icon',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});

const featuredTrafficIcon = L.divIcon({
  html: '<div class="bg-red-600 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold shadow-lg border-2 border-white">🚗</div>',
  className: 'custom-div-icon',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

const schoolIcon = L.divIcon({
  html: '<div class="bg-purple-600 text-white rounded-lg w-10 h-10 flex items-center justify-center text-lg font-bold shadow-lg border-2 border-white">🏫</div>',
  className: 'custom-div-icon',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const MapView = React.memo(({ weatherData, webcamData, selectedRegion = 'all', regionConfig = null, className = '' }) => {
  const [trafficCameras, setTrafficCameras] = useState([]);
  const [isLoadingTraffic, setIsLoadingTraffic] = useState(true);
  const [trafficError, setTrafficError] = useState(null);

  const featuredCameraIds = ['6710', '2703', '2704', '1701', '4712', '2701', '1709', '4710'];
  const featuredCameraIds = ['6710', '2703', '2704', '1701', '4712', '2701', '1709', '4710'];

  const getAreaFromCameraId = (cameraId) => {
    const id = cameraId.toString();
    if (id.startsWith('17')) return 'North';
    if (id.startsWith('27')) return 'Central';
    if (id.startsWith('37')) return 'East';
    if (id.startsWith('47')) return 'West';
    if (id.startsWith('67')) return 'PIE';
    return 'Singapore';
  };

  useEffect(() => {
    const loadTrafficCameras = async () => {
      try {
        setIsLoadingTraffic(true);
        setTrafficError(null);
        
        const response = await fetch('https://api.data.gov.sg/v1/transport/traffic-images', {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
          throw new Error('No traffic camera data available');
        }
        
        const latestItem = data.items[0];
        if (!latestItem.cameras || !Array.isArray(latestItem.cameras)) {
          throw new Error('Invalid camera data structure');
        }
        
        const cameraNames = {
          '1701': 'Woodlands Causeway',
          '1702': 'Woodlands Checkpoint', 
          '1703': 'BKE Woodlands Flyover',
          '1704': 'BKE Dairy Farm',
          '1705': 'BKE Sungei Kadut',
          '1706': 'BKE Mandai',
          '1707': 'KJE BC Exit',
          '1709': 'Changi Airport',
          '2701': 'Sentosa Gateway',
          '2702': 'West Coast Highway',
          '2703': 'ECP Marina Bay',
          '2704': 'Orchard Boulevard',
          '2705': 'Marina Coastal Drive',
          '2706': 'ECP Fort Road',
          '2707': 'Fullerton Road',
          '2708': 'Marina Boulevard',
          '3701': 'Central Boulevard',
          '3702': 'PIE Tuas',
          '3704': 'PIE Kim Keat',
          '3705': 'PIE Eunos',
          '4701': 'AYE After Tuas',
          '4702': 'AYE Keppel',
          '4703': 'TPE Punggol',
          '4704': 'TPE Seletar',
          '4705': 'TPE Sengkang',
          '4706': 'TPE Tampines',
          '4707': 'CTE Braddell',
          '4708': 'CTE Ang Mo Kio',
          '4709': 'CTE Yishun',
          '4710': 'Tuas Second Link',
          '4712': 'MCE Marina Bay',
          '4713': 'MCE Maxwell',
          '4714': 'MCE MBFC',
          '4716': 'MCE Bayfront',
          '6710': 'PIE Bukit Timah',
          '6711': 'PIE Clementi',
          '6712': 'PIE Jurong',
        };

        const processedCameras = latestItem.cameras
          .filter(camera => 
            camera.camera_id &&
            camera.location &&
            camera.image &&
            typeof camera.location.latitude === 'number' &&
            typeof camera.location.longitude === 'number'
          )
          .map(camera => ({
            id: camera.camera_id,
            name: cameraNames[camera.camera_id] || `Traffic Camera ${camera.camera_id}`,
            area: getAreaFromCameraId(camera.camera_id),
            location: {
              latitude: parseFloat(camera.location.latitude),
              longitude: parseFloat(camera.location.longitude),
            },
            image: {
              url: camera.image,
              width: camera.image_metadata?.width || 0,
              height: camera.image_metadata?.height || 0,
            },
            timestamp: camera.timestamp,
            quality: (camera.image_metadata?.width >= 1920) ? 'HD' : 'Standard',
            status: 'active',
          }));
        
        setTrafficCameras(processedCameras);
      } catch (error) {
        setTrafficError(error.message);
        
        const mockCameras = [
          {
            id: '2703',
            name: 'ECP Marina Bay',
            area: 'Marina Bay',
            location: { latitude: 1.2740, longitude: 103.8518 },
            image: { url: '', width: 1920, height: 1080 },
            timestamp: new Date().toISOString(),
            quality: 'HD',
            status: 'active',
          },
          {
            id: '2704',
            name: 'Orchard Boulevard',
            area: 'Orchard',
            location: { latitude: 1.3048, longitude: 103.8318 },
            image: { url: '', width: 1920, height: 1080 },
            timestamp: new Date().toISOString(),
            quality: 'HD',
            status: 'active',
          },
        ];
        
        setTrafficCameras(mockCameras);
      } finally {
        setIsLoadingTraffic(false);
      }
    };

    loadTrafficCameras();

    const interval = setInterval(loadTrafficCameras, 3 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);


  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      <div className="h-96 w-full">
        <MapContainer
          center={COORDINATES.DEFAULT_CENTER}
          zoom={COORDINATES.DEFAULT_ZOOM}
          style={{ height: '100%', width: '100%' }}
          className="rounded-lg"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {weatherData?.locations?.map((location) => (
            location.coordinates && (
              <Marker
                key={location.id}
                position={[location.coordinates.lat, location.coordinates.lng]}
                icon={weatherIcon}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-bold">{location.name}</h3>
                    <p>Temperature: {location.temperature || '--'}°C</p>
                    <p>Humidity: {location.humidity || '--'}%</p>
                    <p>Rainfall: {location.rainfall || '0'} mm</p>
                    <p className="text-xs text-gray-600 mt-1">{location.description}</p>
                  </div>
                </Popup>
              </Marker>
            )
          ))}

          {trafficCameras.map((camera) => {
            const isFeatured = featuredCameraIds.includes(camera.id);
            return (
              <Marker
                key={`traffic-${camera.id}`}
                position={[camera.location.latitude, camera.location.longitude]}
                icon={isFeatured ? featuredTrafficIcon : trafficCameraIcon}
              >
                <Popup>
                  <div className="p-3 min-w-64">
                    <h3 className="font-bold text-lg text-gray-800 mb-2">
                      🚗 {camera.name}
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="font-medium">Camera ID:</span>
                        <span className="text-blue-600">{camera.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Area:</span>
                        <span className="text-green-600">{camera.area}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Quality:</span>
                        <span className={`font-bold ${camera.quality === 'HD' ? 'text-green-600' : 'text-orange-600'}`}>
                          {camera.quality}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Coordinates:</span>
                        <span className="text-gray-600 text-xs">
                          {camera.location.latitude.toFixed(4)}, {camera.location.longitude.toFixed(4)}
                        </span>
                      </div>
                    </div>
                    
                    {camera.image?.url && (
                      <div className="mt-3">
                        <div className="relative">
                          <img 
                            src={camera.image.url} 
                            alt={`${camera.name} 실시간 교통 상황`}
                            className="w-full h-32 object-cover rounded border border-gray-200"
                            loading="lazy"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextElementSibling.style.display = 'flex';
                            }}
                            onLoad={(e) => {
                              e.target.nextElementSibling.style.display = 'none';
                            }}
                          />
                          <div className="hidden bg-gray-100 w-full h-32 items-center justify-center rounded border border-gray-200">
                            <div className="text-center">
                              <span className="text-gray-500 text-sm">📷 이미지 로딩 중...</span>
                              <div className="mt-1 text-xs text-gray-400">
                                Camera ID: {camera.id}
                              </div>
                            </div>
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          🔴 LIVE • 업데이트: {new Date(camera.timestamp).toLocaleTimeString('ko-KR')}
                        </p>
                      </div>
                    )}
                    
                    {isFeatured && (
                      <div className="mt-2 bg-red-50 px-2 py-1 rounded text-xs text-red-700 font-medium">
                        ⭐ 주요 교통 지점
                      </div>
                    )}
                  </div>
                </Popup>
              </Marker>
            );
          })}


          <Marker
            position={[COORDINATES.HWA_CHONG_SCHOOL.lat, COORDINATES.HWA_CHONG_SCHOOL.lng]}
            icon={schoolIcon}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-bold text-purple-800">🏫 Hwa Chong School</h3>
                <p className="text-sm text-gray-600">모니터링 중심점</p>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      <div className="p-4 border-t bg-gray-50">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 text-sm flex-wrap">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-purple-600 rounded-sm border border-white shadow-sm"></div>
                <span className="font-medium">🏫 Hwa Chong School</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                <span>Weather Stations ({weatherData?.locations?.length || 0})</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-600 rounded-full"></div>
                <span>⭐ 주요 교통 카메라</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
                <span>일반 교통 카메라</span>
              </div>
            </div>
            <div className="text-xs text-gray-500 hidden md:block">
              📍 중심지: Hwa Chong School
            </div>
          </div>

          <div className="flex items-center justify-between text-sm bg-white rounded px-3 py-2 border border-gray-200">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="font-medium text-gray-700">🚗 실시간 교통 카메라:</span>
                <span className="font-bold text-green-600">
                  {isLoadingTraffic ? '로딩중...' : `${trafficCameras.length}개`}
                </span>
              </div>
              {!isLoadingTraffic && trafficCameras.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-green-600 text-xs">🔴 LIVE</span>
                  <span className="text-gray-500 text-xs">
                    마지막 업데이트: {new Date().toLocaleTimeString('ko-KR')}
                  </span>
                </div>
              )}
            </div>
            {trafficError && (
              <div className="text-red-500 text-xs">
                ⚠️ 교통 카메라 로딩 실패
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

MapView.propTypes = {
  selectedRegion: PropTypes.string,
  regionConfig: PropTypes.object,
  className: PropTypes.string,
  weatherData: PropTypes.shape({
    timestamp: PropTypes.string,
    locations: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      coordinates: PropTypes.shape({
        lat: PropTypes.number,
        lng: PropTypes.number,
      }),
      temperature: PropTypes.number,
      humidity: PropTypes.number,
      rainfall: PropTypes.number,
      description: PropTypes.string,
      priority: PropTypes.string,
    })),
  }),
  webcamData: PropTypes.shape({
    timestamp: PropTypes.string,
    total_cameras: PropTypes.number,
    successful_captures: PropTypes.number,
    failed_captures: PropTypes.number,
    captures: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      coordinates: PropTypes.shape({
        lat: PropTypes.number,
        lng: PropTypes.number,
      }),
      type: PropTypes.string,
      status: PropTypes.string,
      file_info: PropTypes.shape({
        url: PropTypes.string,
      }),
      ai_analysis: PropTypes.object,
      priority: PropTypes.string,
    })),
  }),
};

MapView.displayName = 'MapView';

export default MapView;