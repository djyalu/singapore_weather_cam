import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

/**
 * 직접 Leaflet API를 사용하는 지도 컴포넌트
 * CDN Leaflet과 완벽 호환
 */
const DirectMapView = ({ weatherData, selectedRegion = 'all', className = '', onCameraSelect }) => {
  const mapRef = useRef(null);
  const leafletMapRef = useRef(null);
  const [mapError, setMapError] = useState(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [trafficCameras, setTrafficCameras] = useState([]);
  const [isLoadingTraffic, setIsLoadingTraffic] = useState(true);

  // Singapore 중심 좌표 (Hwa Chong International School)
  const SINGAPORE_CENTER = [1.3437, 103.7640];
  const DEFAULT_ZOOM = 12;

  // 교통 카메라 로딩 함수
  const loadTrafficCameras = async (map) => {
    try {
      setIsLoadingTraffic(true);
      const response = await fetch('https://api.data.gov.sg/v1/transport/traffic-images');
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      const cameras = data.items?.[0]?.cameras || [];
      
      cameras.forEach((camera) => {
        if (camera.location && camera.image) {
          const { latitude, longitude } = camera.location;
          
          // 교통 카메라 아이콘
          const cameraIcon = window.L.divIcon({
            html: `<div style="
              width: 24px; height: 24px; 
              background: #f97316; 
              border: 2px solid white; 
              border-radius: 50%; 
              display: flex; align-items: center; justify-content: center; 
              font-size: 12px; color: white; font-weight: bold;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              cursor: pointer;
            ">🚗</div>`,
            className: 'traffic-camera-icon',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          });

          const marker = window.L.marker([latitude, longitude], { 
            icon: cameraIcon,
            zIndexOffset: 1000 
          }).addTo(map);

          marker.bindPopup(`
            <div style="padding: 12px; min-width: 250px;">
              <strong>🚗 Traffic Camera ${camera.camera_id}</strong><br>
              <div style="margin: 8px 0;">
                <img src="${camera.image}" 
                     alt="Traffic Camera" 
                     style="width: 100%; height: 120px; object-fit: cover; border-radius: 4px;" 
                     loading="lazy" />
              </div>
              <div style="font-size: 12px; color: #666;">
                📍 ${latitude.toFixed(4)}, ${longitude.toFixed(4)}
              </div>
              <button onclick="if(window.cameraSelectHandler) window.cameraSelectHandler({
                id: '${camera.camera_id}',
                name: 'Traffic Camera ${camera.camera_id}',
                location: { latitude: ${latitude}, longitude: ${longitude} },
                image: { url: '${camera.image}' }
              })" style="
                margin-top: 8px; 
                width: 100%; 
                background: #2563eb; 
                color: white; 
                border: none; 
                padding: 6px 12px; 
                border-radius: 4px; 
                cursor: pointer;
              ">📹 상세 보기</button>
            </div>
          `);

          // 마커 클릭 시 카메라 선택
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
      console.log(`✅ ${cameras.length}개 교통 카메라 로드 완료`);
      
    } catch (error) {
      console.error('교통 카메라 로딩 실패:', error);
    } finally {
      setIsLoadingTraffic(false);
    }
  };

  useEffect(() => {
    let timeoutId;
    let attemptCount = 0;
    const maxAttempts = 30; // 15초 최대 대기
    
    const initializeMap = () => {
      attemptCount++;
      
      // DOM 준비 확인
      if (!mapRef.current) {
        console.log('⏳ DOM 컨테이너 대기 중...');
        if (attemptCount < maxAttempts) {
          timeoutId = setTimeout(initializeMap, 100);
        }
        return;
      }

      // Leaflet 라이브러리 확인
      if (typeof window.L === 'undefined') {
        console.log(`⏳ Leaflet CDN 로딩 대기 중... (${attemptCount}/${maxAttempts})`);
        if (attemptCount < maxAttempts) {
          timeoutId = setTimeout(initializeMap, 500);
        } else {
          setMapError('Leaflet 라이브러리 로드 시간 초과. 페이지를 새로고침해주세요.');
        }
        return;
      }

      try {
        console.log('✅ Leaflet CDN 로드 완료, 지도 초기화 시작');
        
        // 기존 지도 인스턴스 정리
        if (leafletMapRef.current) {
          try {
            leafletMapRef.current.remove();
          } catch (e) {
            console.warn('기존 지도 제거 중 오류:', e);
          }
          leafletMapRef.current = null;
        }

        // 컨테이너 초기화
        mapRef.current.innerHTML = '';

        // Leaflet 지도 생성 (더 관대한 설정)
        const map = window.L.map(mapRef.current, {
          center: SINGAPORE_CENTER,
          zoom: DEFAULT_ZOOM,
          zoomControl: true,
          attributionControl: true,
          preferCanvas: false,
          zoomAnimation: true,
          fadeAnimation: true,
          markerZoomAnimation: true
        });

        // 지도 로드 이벤트 리스너
        map.whenReady(() => {
          console.log('🗺️ 지도 준비 완료');
          setIsMapReady(true);
        });

        // 타일 레이어 로드 이벤트
        const tileLayer = window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 18,
          minZoom: 10,
          crossOrigin: true,
          // 타일 로딩 개선
          keepBuffer: 2,
          updateWhenZooming: false,
          updateWhenIdle: true
        });

        tileLayer.on('loading', () => {
          console.log('🔄 지도 타일 로딩 중...');
        });

        tileLayer.on('load', () => {
          console.log('✅ 지도 타일 로드 완료');
          setMapError(null);
        });

        tileLayer.on('tileerror', (e) => {
          console.warn('⚠️ 타일 로딩 오류:', e);
        });

        tileLayer.addTo(map);

        // 중심점 마커 추가
        try {
          const centerMarker = window.L.marker(SINGAPORE_CENTER).addTo(map);
          centerMarker.bindPopup(`
            <div style="text-align: center; padding: 8px;">
              <strong>🏫 Hwa Chong International School</strong><br>
              <small>날씨 모니터링 중심점</small><br>
              <small>위도: ${SINGAPORE_CENTER[0]}, 경도: ${SINGAPORE_CENTER[1]}</small>
            </div>
          `);
        } catch (markerError) {
          console.warn('마커 생성 오류:', markerError);
        }

        // 권역별 날씨 히트맵 추가
        if (weatherData?.locations?.length) {
          const weatherRegions = [
            { id: 'north', name: 'Northern Singapore', lat: 1.4200, lng: 103.7900, stationIds: ['S121', 'S118', 'S104'], emoji: '🌳' },
            { id: 'northwest', name: 'Northwest (Hwa Chong)', lat: 1.3500, lng: 103.7600, stationIds: ['S104', 'S116', 'S109'], emoji: '🏫' },
            { id: 'central', name: 'Central Singapore', lat: 1.3100, lng: 103.8300, stationIds: ['S109', 'S106', 'S107'], emoji: '🏙️' },
            { id: 'west', name: 'Western Singapore', lat: 1.3300, lng: 103.7000, stationIds: ['S104', 'S60', 'S50'], emoji: '🏭' },
            { id: 'east', name: 'Eastern Singapore', lat: 1.3600, lng: 103.9600, stationIds: ['S24', 'S107', 'S43'], emoji: '✈️' },
            { id: 'southeast', name: 'Southeast', lat: 1.3200, lng: 103.9200, stationIds: ['S24', 'S43', 'S107'], emoji: '🏘️' },
            { id: 'south', name: 'Southern Singapore', lat: 1.2700, lng: 103.8500, stationIds: ['S109', 'S106', 'S24'], emoji: '🌊' }
          ];

          weatherRegions.forEach(region => {
            const stationData = region.stationIds
              .map(id => weatherData.locations.find(loc => loc.station_id === id))
              .filter(Boolean);

            if (stationData.length > 0) {
              const avgTemp = stationData.reduce((sum, s) => sum + (s.temperature || 0), 0) / stationData.length;
              const avgHumidity = stationData.reduce((sum, s) => sum + (s.humidity || 0), 0) / stationData.length;
              const totalRainfall = stationData.reduce((sum, s) => sum + (s.rainfall || 0), 0);
              
              const tempColor = avgTemp >= 32 ? '#EF4444' : avgTemp >= 30 ? '#F97316' : avgTemp >= 28 ? '#EAB308' : avgTemp >= 26 ? '#22C55E' : '#3B82F6';
              const intensity = 0.2 + Math.abs(avgTemp - 28) / 6 * 0.2;
              
              // 권역별 원형 히트맵
              const circle = window.L.circle([region.lat, region.lng], {
                color: tempColor,
                fillColor: tempColor,
                fillOpacity: intensity,
                radius: 4000,
                weight: 2,
                interactive: false
              }).addTo(map);

              // 날씨 아이콘 마커
              const weatherIcon = window.L.divIcon({
                html: `<div style="
                  width: 40px; height: 40px; 
                  background: rgba(255,255,255,0.9); 
                  border: 2px solid ${tempColor}; 
                  border-radius: 50%; 
                  display: flex; align-items: center; justify-content: center; 
                  font-size: 18px; box-shadow: 0 2px 4px rgba(0,0,0,0.2);
                ">${region.emoji}</div>`,
                className: 'weather-icon',
                iconSize: [40, 40],
                iconAnchor: [20, 20]
              });

              const marker = window.L.marker([region.lat, region.lng], { icon: weatherIcon }).addTo(map);
              marker.bindPopup(`
                <div style="padding: 12px; min-width: 200px;">
                  <strong>${region.emoji} ${region.name}</strong><br>
                  <div style="margin: 8px 0;">
                    <div style="color: ${tempColor}; font-size: 18px; font-weight: bold;">🌡️ ${avgTemp.toFixed(1)}°C</div>
                    <div style="color: #0891b2;">💧 습도: ${Math.round(avgHumidity)}%</div>
                    ${totalRainfall > 0 ? `<div style="color: #059669;">🌧️ 강수: ${totalRainfall.toFixed(1)}mm</div>` : ''}
                  </div>
                  <div style="font-size: 11px; color: #666; margin-top: 8px;">
                    📡 ${stationData.length}개 기상관측소 평균
                  </div>
                </div>
              `);
            }
          });
        }

        leafletMapRef.current = map;
        setMapError(null);
        
        console.log('🎉 Leaflet 지도 초기화 완료!');
        
        // 교통 카메라 로딩
        loadTrafficCameras(map);
        
      } catch (error) {
        console.error('🚨 Leaflet 지도 초기화 실패:', error);
        setMapError(`지도 초기화 실패: ${error.message}`);
      }
    };

    // 짧은 지연 후 초기화 시작
    timeoutId = setTimeout(initializeMap, 100);

    // 클린업
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
      if (leafletMapRef.current) {
        try {
          leafletMapRef.current.remove();
        } catch (e) {
          console.warn('지도 정리 중 오류:', e);
        }
        leafletMapRef.current = null;
      }
    };
  }, [weatherData]);

  if (mapError) {
    return (
      <div className={`flex items-center justify-center min-h-[500px] bg-gray-100 ${className}`}>
        <div className="text-center p-8">
          <div className="text-red-500 text-xl mb-2">🚨</div>
          <div className="text-gray-700 font-medium mb-2">지도 로딩 실패</div>
          <div className="text-sm text-gray-500">{mapError}</div>
          <div className="text-xs text-gray-400 mt-2">
            Leaflet CDN 연결을 확인해주세요
          </div>
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
        style={{ background: '#f0f0f0' }}
      />
      
      {/* 로딩 오버레이 */}
      {!isMapReady && (
        <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin text-blue-500 text-2xl mb-2">🗺️</div>
            <div className="text-gray-600">OpenStreetMap 로딩 중...</div>
            <div className="text-sm text-gray-400">Leaflet CDN 연결 중</div>
          </div>
        </div>
      )}
      
      {/* 지도 정보 */}
      {isMapReady && (
        <div className="absolute bottom-4 left-4 bg-white bg-opacity-95 rounded-lg p-3 shadow-lg border border-gray-200">
          <div className="text-sm font-medium text-gray-800 mb-2">🗺️ 실시간 지도 정보</div>
          <div className="space-y-1 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-orange-500 rounded-full border border-white"></div>
              <span>교통 카메라 ({trafficCameras.length}개)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full border border-white"></div>
              <span>권역별 날씨</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-purple-600 rounded-full border border-white"></div>
              <span>🏫 Hwa Chong School</span>
            </div>
          </div>
          <div className="text-xs text-gray-500 mt-2 pt-2 border-t">
            OpenStreetMap • 확대/축소/드래그 가능
          </div>
        </div>
      )}
    </div>
  );
};

DirectMapView.propTypes = {
  weatherData: PropTypes.object,
  selectedRegion: PropTypes.string,
  className: PropTypes.string,
  onCameraSelect: PropTypes.func,
};

export default DirectMapView;