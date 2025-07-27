import React from 'react';
import PropTypes from 'prop-types';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { COORDINATES } from '../../config/constants';

// Fix default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom icons
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

// Hwa Chong International School icon
const schoolIcon = L.divIcon({
  html: '<div class="bg-purple-600 text-white rounded-lg w-10 h-10 flex items-center justify-center text-lg font-bold shadow-lg border-2 border-white">🏫</div>',
  className: 'custom-div-icon',
  iconSize: [40, 40],
  iconAnchor: [20, 40],
});

const MapView = React.memo(({ weatherData, webcamData, selectedRegion = 'all', regionConfig = null, className = '' }) => {
  console.log('🗺️ MapView: Rendering with data:', {
    weatherData: weatherData ? 'present' : 'missing',
    weatherLocations: weatherData?.locations?.length || 0,
    webcamData: webcamData ? 'present' : 'missing',
    webcamCaptures: webcamData?.captures?.length || 0,
  });

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
          
          {/* Weather station markers */}
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

          {/* Webcam markers */}
          {webcamData?.captures?.map((webcam) => (
            webcam.coordinates && (
              <Marker
                key={webcam.id}
                position={[webcam.coordinates.lat, webcam.coordinates.lng]}
                icon={webcamIcon}
              >
                <Popup>
                  <div className="p-2">
                    <h3 className="font-bold">{webcam.name}</h3>
                    <p>{webcam.location}</p>
                    <p className="text-sm text-gray-600">{webcam.type || 'webcam'}</p>
                    {webcam.file_info?.url && (
                      <img 
                        src={webcam.file_info.url} 
                        alt={webcam.name}
                        className="w-32 h-24 object-cover rounded mt-2"
                      />
                    )}
                    {webcam.ai_analysis?.weather_condition && (
                      <p className="text-xs mt-2">
                        Weather: {webcam.ai_analysis.weather_condition}
                      </p>
                    )}
                  </div>
                </Popup>
              </Marker>
            )
          ))}

          {/* Hwa Chong International School marker */}
          <Marker
            position={[COORDINATES.HWA_CHONG_SCHOOL.lat, COORDINATES.HWA_CHONG_SCHOOL.lng]}
            icon={schoolIcon}
          >
            <Popup>
              <div className="p-3">
                <h3 className="font-bold text-purple-800 text-lg mb-2">🏫 Hwa Chong International School</h3>
                <div className="space-y-1 text-sm">
                  <p><strong>주소:</strong> 663 Bukit Timah Road, Singapore</p>
                  <p><strong>중심 좌표:</strong> {COORDINATES.HWA_CHONG_SCHOOL.lat}°N, {COORDINATES.HWA_CHONG_SCHOOL.lng}°E</p>
                  <p><strong>역할:</strong> 날씨 모니터링 중심점</p>
                  <div className="mt-3 p-2 bg-purple-50 rounded-lg">
                    <p className="text-xs text-purple-700">
                      🎯 이 위치를 중심으로 싱가포르 날씨와 웹캠 정보를 제공합니다.
                    </p>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        </MapContainer>
      </div>

      {/* Map legend */}
      <div className="p-4 border-t bg-gray-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-purple-600 rounded-sm border border-white shadow-sm"></div>
              <span className="font-medium">🏫 Hwa Chong School</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
              <span>Weather Stations</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <span>Webcam Locations</span>
            </div>
          </div>
          <div className="text-xs text-gray-500 hidden md:block">
            📍 Monitoring Center: 663 Bukit Timah Road
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