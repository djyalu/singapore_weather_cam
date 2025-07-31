import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import oneMapService from '../../services/oneMapService';

/**
 * Singapore OneMap 기반 지도 컴포넌트
 * 정부 공식 지도 서비스 사용
 */
const OneMapView = ({ weatherData, className = '', onCameraSelect }) => {
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const [mapError, setMapError] = useState(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [currentStyle, setCurrentStyle] = useState('Default');
  const [authToken, setAuthToken] = useState(null);
  const [trafficCameras, setTrafficCameras] = useState([]);

  // Singapore 중심 좌표 (Hwa Chong International School)
  const SGP_CENTER = [1.3437, 103.7640];
  const DEFAULT_ZOOM = 12;

  // OneMap 스타일 목록
  const mapStyles = [
    { id: 'Default', name: '기본 지도', icon: '🗺️' },
    { id: 'Satellite', name: '위성 지도', icon: '🛰️' },
    { id: 'Night', name: '야간 모드', icon: '🌙' },
    { id: 'Grey', name: '회색 지도', icon: '⚫' }
  ];

  // OneMap 인증 및 지도 초기화
  useEffect(() => {
    const initializeOneMap = async () => {
      try {
        // Leaflet 라이브러리 확인
        if (typeof window.L === 'undefined') {
          setMapError('Leaflet 라이브러리가 로드되지 않았습니다.');
          return;
        }

        // OneMap 인증 토큰 획득 (선택사항 - 일부 기능용)
        const token = await oneMapService.getAuthToken();
        setAuthToken(token);

        // 컨테이너 확인
        if (!mapRef.current) {
          setMapError('지도 컨테이너를 찾을 수 없습니다.');
          return;
        }

        // 기존 지도 제거
        if (leafletMapRef.current) {
          leafletMapRef.current.remove();
        }

        // Leaflet 지도 생성
        const map = window.L.map(mapRef.current, {
          center: SGP_CENTER,
          zoom: DEFAULT_ZOOM,
          zoomControl: true,
          attributionControl: true
        });

        // OneMap 타일 레이어 추가
        const tileLayer = window.L.tileLayer(
          'https://maps-{s}.onemap.sg/v3/Default/{z}/{x}/{y}.png',
          {
            attribution: '© <a href="https://www.onemap.sg/">OneMap</a> © Singapore Land Authority',
            subdomains: ['a', 'b', 'c', 'd'],
            maxZoom: 19,
            minZoom: 10
          }
        );
        
        tileLayer.addTo(map);

        // 지도 준비 완료
        map.whenReady(() => {
          console.log('✅ OneMap 지도 초기화 완료');
          setIsMapReady(true);
          setMapError(null);
        });

        // 중심점 마커 (Hwa Chong School)
        const schoolIcon = window.L.divIcon({
          html: `<div style="
            width: 32px; height: 32px; 
            background: #7c3aed; 
            border: 2px solid white; 
            border-radius: 6px; 
            display: flex; align-items: center; justify-content: center; 
            font-size: 16px; color: white; font-weight: bold;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
          ">🏫</div>`,
          className: 'school-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 32]
        });

        window.L.marker(SGP_CENTER, { icon: schoolIcon })
          .addTo(map)
          .bindPopup(`
            <div style="padding: 12px; text-align: center;">
              <strong>🏫 Hwa Chong International School</strong><br>
              <div style="color: #666; font-size: 12px; margin-top: 4px;">
                날씨 모니터링 중심점<br>
                📍 ${SGP_CENTER[0].toFixed(4)}, ${SGP_CENTER[1].toFixed(4)}
              </div>
            </div>
          `);

        leafletMapRef.current = map;

        // 날씨 데이터 추가
        addWeatherOverlay(map);
        
        // 교통 카메라 로딩
        loadTrafficCameras(map);

      } catch (error) {
        console.error('🚨 OneMap 초기화 실패:', error);
        setMapError(`OneMap 초기화 실패: ${error.message}`);
      }
    };

    initializeOneMap();

    return () => {
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
      }
    };
  }, []);

  // 지도 스타일 변경
  const changeMapStyle = (styleId) => {
    if (!leafletMapRef.current) return;

    try {
      // 기존 타일 레이어 제거
      leafletMapRef.current.eachLayer((layer) => {
        if (layer instanceof window.L.TileLayer) {
          leafletMapRef.current.removeLayer(layer);
        }
      });

      // 새 스타일 타일 레이어 추가
      const newTileLayer = window.L.tileLayer(
        `https://maps-{s}.onemap.sg/v3/${styleId}/{z}/{x}/{y}.png`,
        {
          attribution: '© <a href="https://www.onemap.sg/">OneMap</a> © Singapore Land Authority',
          subdomains: ['a', 'b', 'c', 'd'],
          maxZoom: 19,
          minZoom: 10
        }
      );

      newTileLayer.addTo(leafletMapRef.current);
      setCurrentStyle(styleId);
      
      console.log(`✅ 지도 스타일 변경: ${styleId}`);
    } catch (error) {
      console.error('지도 스타일 변경 실패:', error);
    }
  };

  // 날씨 오버레이 추가
  const addWeatherOverlay = (map) => {
    if (!weatherData?.locations?.length) return;

    const weatherRegions = [
      { id: 'north', name: 'Northern Singapore', lat: 1.4200, lng: 103.7900, stationIds: ['S121', 'S118'], emoji: '🌳' },
      { id: 'central', name: 'Central Singapore', lat: 1.3100, lng: 103.8300, stationIds: ['S106', 'S107'], emoji: '🏙️' },
      { id: 'west', name: 'Western Singapore', lat: 1.3300, lng: 103.7000, stationIds: ['S104', 'S50'], emoji: '🏭' },
      { id: 'east', name: 'Eastern Singapore', lat: 1.3600, lng: 103.9600, stationIds: ['S24', 'S43'], emoji: '✈️' },
      { id: 'south', name: 'Southern Singapore', lat: 1.2700, lng: 103.8500, stationIds: ['S109', 'S106'], emoji: '🌊' }
    ];

    weatherRegions.forEach(region => {
      const stationData = region.stationIds
        .map(id => weatherData.locations.find(loc => loc.station_id === id))
        .filter(Boolean);

      if (stationData.length > 0) {
        const avgTemp = stationData.reduce((sum, s) => sum + (s.temperature || 0), 0) / stationData.length;
        const tempColor = avgTemp >= 32 ? '#ef4444' : avgTemp >= 30 ? '#f97316' : avgTemp >= 28 ? '#eab308' : '#22c55e';

        // 온도 히트맵 원
        window.L.circle([region.lat, region.lng], {
          color: tempColor,
          fillColor: tempColor,
          fillOpacity: 0.2,
          radius: 3500,
          weight: 2
        }).addTo(map);

        // 날씨 아이콘
        const weatherIcon = window.L.divIcon({
          html: `<div style="
            width: 36px; height: 36px; 
            background: rgba(255,255,255,0.95); 
            border: 2px solid ${tempColor}; 
            border-radius: 50%; 
            display: flex; align-items: center; justify-content: center; 
            font-size: 16px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);
          ">${region.emoji}</div>`,
          iconSize: [36, 36],
          iconAnchor: [18, 18]
        });

        window.L.marker([region.lat, region.lng], { icon: weatherIcon })
          .addTo(map)
          .bindPopup(`
            <div style="padding: 10px; min-width: 180px;">
              <strong>${region.emoji} ${region.name}</strong><br>
              <div style="margin: 6px 0; color: ${tempColor}; font-size: 18px; font-weight: bold;">
                🌡️ ${avgTemp.toFixed(1)}°C
              </div>
              <div style="font-size: 11px; color: #666;">
                📡 OneMap 기반 실시간 데이터
              </div>
            </div>
          `);
      }
    });
  };

  // 교통 카메라 로딩
  const loadTrafficCameras = async (map) => {
    try {
      const response = await fetch('https://api.data.gov.sg/v1/transport/traffic-images');
      const data = await response.json();
      const cameras = data.items?.[0]?.cameras || [];

      // 주요 카메라만 표시 (성능 최적화)
      cameras.slice(0, 20).forEach((camera) => {
        if (camera.location && camera.image) {
          const { latitude, longitude } = camera.location;
          
          const cameraIcon = window.L.divIcon({
            html: `<div style="
              width: 20px; height: 20px; 
              background: #f97316; 
              border: 1px solid white; 
              border-radius: 50%; 
              display: flex; align-items: center; justify-content: center; 
              font-size: 10px; color: white; font-weight: bold;
              cursor: pointer;
            ">📷</div>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10]
          });

          const marker = window.L.marker([latitude, longitude], { 
            icon: cameraIcon,
            zIndexOffset: 1000 
          }).addTo(map);

          marker.bindPopup(`
            <div style="padding: 8px; min-width: 200px;">
              <strong>📷 Camera ${camera.camera_id}</strong><br>
              <img src="${camera.image}" 
                   style="width: 100%; height: 100px; object-fit: cover; margin: 4px 0; border-radius: 4px;" 
                   loading="lazy" />
              <div style="font-size: 11px; color: #666;">
                OneMap 위치: ${latitude.toFixed(4)}, ${longitude.toFixed(4)}
              </div>
            </div>
          `);

          marker.on('click', () => {
            if (onCameraSelect) {
              onCameraSelect({
                id: camera.camera_id,
                name: `Traffic Camera ${camera.camera_id}`,
                location: { latitude, longitude },
                image: { url: camera.image }
              });
            }
          });
        }
      });

      setTrafficCameras(cameras);
      console.log(`✅ OneMap에 ${Math.min(cameras.length, 20)}개 교통 카메라 표시`);
      
    } catch (error) {
      console.error('교통 카메라 로딩 실패:', error);
    }
  };

  // 에러 상태
  if (mapError) {
    return (
      <div className={`flex items-center justify-center min-h-[500px] bg-gray-100 rounded-lg ${className}`}>
        <div className="text-center p-8">
          <div className="text-red-500 text-xl mb-2">🚨</div>
          <div className="text-gray-700 font-medium mb-2">OneMap 로딩 실패</div>
          <div className="text-sm text-gray-500 mb-4">{mapError}</div>
          <button 
            onClick={() => window.location.reload()}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            새로고침
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      {/* 지도 컨테이너 */}
      <div 
        ref={mapRef} 
        className="w-full h-[600px] border border-gray-300 rounded-lg"
        style={{ background: '#f8fafc' }}
      />
      
      {/* 로딩 오버레이 */}
      {!isMapReady && (
        <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <div className="animate-spin text-blue-500 text-3xl mb-3">🗺️</div>
            <div className="text-gray-700 font-medium">Singapore OneMap 로딩 중...</div>
            <div className="text-sm text-gray-500 mt-1">정부 공식 지도 서비스</div>
          </div>
        </div>
      )}

      {/* 지도 스타일 선택기 */}
      {isMapReady && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-2">
          <div className="text-xs font-medium text-gray-600 mb-2 px-2">지도 스타일</div>
          <div className="space-y-1">
            {mapStyles.map((style) => (
              <button
                key={style.id}
                onClick={() => changeMapStyle(style.id)}
                className={`w-full text-left px-3 py-2 rounded text-sm transition-colors flex items-center gap-2 ${
                  currentStyle === style.id
                    ? 'bg-blue-100 text-blue-800 font-medium'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <span>{style.icon}</span>
                <span>{style.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 범례 */}
      {isMapReady && (
        <div className="absolute bottom-4 left-4 bg-white bg-opacity-95 rounded-lg p-3 shadow-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-800 mb-2">🇸🇬 Singapore OneMap</div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full"></div>
              <span>교통 카메라 ({Math.min(trafficCameras.length, 20)}개)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span>권역별 날씨</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-600 rounded-sm"></div>
              <span>🏫 Hwa Chong School</span>
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-2 pt-2 border-t">
            © Singapore Land Authority
          </div>
        </div>
      )}
    </div>
  );
};

OneMapView.propTypes = {
  weatherData: PropTypes.object,
  className: PropTypes.string,
  onCameraSelect: PropTypes.func,
};

export default OneMapView;