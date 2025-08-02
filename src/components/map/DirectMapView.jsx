import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

/**
 * 직접 Leaflet API를 사용하는 지도 컴포넌트
 * CDN Leaflet과 완벽 호환 - 깜빡임 문제 해결
 */
const DirectMapView = ({ weatherData, selectedRegion = 'all', className = '', onCameraSelect, refreshTrigger = 0 }) => {
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
            <div style="padding: 16px; min-width: 320px; max-width: 400px;">
              <div style="text-align: center; margin-bottom: 12px;">
                <strong style="font-size: 16px; color: #1f2937;">🚗 Traffic Camera ${camera.camera_id}</strong>
              </div>
              
              <div style="margin-bottom: 12px;">
                <img src="${camera.image}" 
                     alt="Traffic Camera ${camera.camera_id}" 
                     style="width: 100%; height: 180px; object-fit: cover; border-radius: 8px; border: 2px solid #e5e7eb;" 
                     loading="lazy" />
              </div>
              
              <div style="background: #f9fafb; padding: 8px; border-radius: 6px; margin-bottom: 8px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                  <span style="font-size: 12px; color: #6b7280; font-weight: 500;">카메라 ID:</span>
                  <span style="font-size: 12px; color: #1f2937; font-weight: 600;">${camera.camera_id}</span>
                </div>
                <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                  <span style="font-size: 12px; color: #6b7280; font-weight: 500;">위치:</span>
                  <span style="font-size: 11px; color: #4b5563;">${latitude.toFixed(4)}, ${longitude.toFixed(4)}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                  <span style="font-size: 12px; color: #6b7280; font-weight: 500;">상태:</span>
                  <span style="font-size: 12px; color: #059669; font-weight: 600;">🔴 LIVE</span>
                </div>
              </div>
              
              <div style="text-align: center; font-size: 11px; color: #9ca3af; margin-top: 8px;">
                🕒 실시간 업데이트 • Singapore LTA
              </div>
            </div>
          `, {
            maxWidth: 400,
            className: 'custom-popup'
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

  // 지도 초기화 (한 번만 실행)
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

        // Leaflet 지도 생성
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

        // 타일 레이어
        const tileLayer = window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 18,
          minZoom: 10,
          crossOrigin: true,
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

        // Hwa Chong International School 별표 마커 추가
        try {
          const schoolIcon = window.L.divIcon({
            html: `<div style="
              width: 32px; height: 32px; 
              background: #FFD700; 
              border: 2px solid #FFA500; 
              border-radius: 50%; 
              display: flex; align-items: center; justify-content: center; 
              font-size: 18px; color: #B8860B; font-weight: bold;
              box-shadow: 0 3px 6px rgba(0,0,0,0.3);
              cursor: pointer;
            ">⭐</div>`,
            className: 'school-marker',
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          });

          const centerMarker = window.L.marker(SINGAPORE_CENTER, { 
            icon: schoolIcon,
            zIndexOffset: 2000 // 다른 마커들보다 위에 표시
          }).addTo(map);
          
          centerMarker.bindPopup(`
            <div style="text-align: center; padding: 12px; min-width: 200px;">
              <strong style="color: #B8860B; font-size: 16px;">⭐ Hwa Chong International School</strong><br>
              <div style="margin: 8px 0; padding: 6px; background: #FFF8DC; border-radius: 4px;">
                <div style="color: #8B4513; font-size: 12px; font-weight: 500;">📍 날씨 모니터링 중심점</div>
                <div style="color: #666; font-size: 11px; margin-top: 2px;">663 Bukit Timah Road</div>
              </div>
              <div style="font-size: 10px; color: #999;">
                위도: ${SINGAPORE_CENTER[0]}, 경도: ${SINGAPORE_CENTER[1]}
              </div>
            </div>
          `, {
            maxWidth: 250,
            className: 'school-popup'
          });
        } catch (markerError) {
          console.warn('학교 마커 생성 오류:', markerError);
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
  }, []); // 빈 의존성 배열로 한 번만 실행

  // 히트맵 생성 - 지도 준비 완료 후 실행
  useEffect(() => {    
    // 지도가 준비되지 않았으면 대기
    if (!isMapReady || !leafletMapRef.current) {
      return;
    }

    // 지도 준비 완료 후 히트맵 생성
    const timer = setTimeout(() => {
      createHeatmapLayers();
    }, 500);
    
    return () => clearTimeout(timer);

    function createHeatmapLayers() {
      if (!leafletMapRef.current || !window.L) {
        return;
      }
      
      // 기존 날씨 레이어 제거 - 부드럽게 처리
      try {
        const layersToRemove = [];
        leafletMapRef.current.eachLayer(layer => {
          if (layer.options && (layer.options.className === 'weather-layer' || layer.options.className === 'weather-icon')) {
            layersToRemove.push(layer);
          }
        });
        
        // 한 번에 제거하여 깜빡임 최소화
        layersToRemove.forEach(layer => {
          leafletMapRef.current.removeLayer(layer);
        });
      } catch (error) {
        console.error('기존 레이어 제거 실패:', error);
      }

      // 실제 날씨 데이터 기반 온도 계산
      const getRegionalTemp = (stationIds) => {
        if (!weatherData?.locations) {
          return null;
        }
        
        const matchedStations = stationIds
          .map(id => weatherData.locations.find(loc => loc.id === id))
          .filter(Boolean);
          
        const temps = matchedStations
          .map(loc => loc.temperature)
          .filter(temp => typeof temp === 'number');
        
        if (temps.length > 0) {
          return temps.reduce((sum, temp) => sum + temp, 0) / temps.length;
        }
        
        return null;
      };

      const getColorForTemp = (temp) => {
        if (temp >= 32) return '#EF4444'; // 빨간색
        if (temp >= 30) return '#F97316'; // 주황색
        if (temp >= 28) return '#EAB308'; // 노란색
        if (temp >= 26) return '#22C55E'; // 초록색
        return '#3B82F6'; // 파란색
      };

      // 실제 날씨 데이터 지역
      const realRegions = [
        { 
          name: 'Hwa Chong Area', 
          lat: 1.3437, 
          lng: 103.7640, 
          stationIds: ['S109', 'S104'], // Ang Mo Kio & Woodlands
          emoji: '🏫'
        },
        { 
          name: 'Central Singapore', 
          lat: 1.3100, 
          lng: 103.8300, 
          stationIds: ['S109', 'S107'], // Newton & East Coast
          emoji: '🏙️'
        },
        { 
          name: 'Eastern Singapore', 
          lat: 1.3600, 
          lng: 103.9600, 
          stationIds: ['S24', 'S107'], // Changi & East Coast
          emoji: '✈️'
        },
        { 
          name: 'Northern Singapore', 
          lat: 1.4200, 
          lng: 103.7900, 
          stationIds: ['S24', 'S115'], // 북부 지역
          emoji: '🌳'
        }
      ];

      // 날씨 데이터 확인
      if (!weatherData?.locations) {
        console.log('날씨 데이터 없음 - fallback 온도 사용');
      }

      realRegions.forEach((region, index) => {        
        let avgTemp = getRegionalTemp(region.stationIds);
        
        // Fallback 온도 (실제 데이터 없을 때)
        if (avgTemp === null) {
          const fallbackTemps = {
            'Hwa Chong Area': 29.5,
            'Central Singapore': 30.2,
            'Eastern Singapore': 28.8,
            'Northern Singapore': 30.1
          };
          avgTemp = fallbackTemps[region.name] || 29.0;
        }
        
        const tempColor = getColorForTemp(avgTemp);
        
        try {
          // 온도 기반 히트맵 원형 생성
          const circle = window.L.circle([region.lat, region.lng], {
            color: tempColor,
            fillColor: tempColor,
            fillOpacity: 0.3,
            opacity: 0.8,
            radius: 10000,
            weight: 3,
            interactive: true,
            className: 'weather-layer'
          });

          circle.addTo(leafletMapRef.current);
          
          // 온도 정보 팝업
          circle.bindPopup(`
            <div style="text-align: center; padding: 12px;">
              <strong>${region.emoji} ${region.name}</strong><br>
              <div style="color: ${tempColor}; font-size: 16px; font-weight: bold;">🌡️ ${avgTemp.toFixed(1)}°C</div>
              <div style="font-size: 12px; color: #666; margin-top: 4px;">
                Stations: ${region.stationIds.join(', ')}
              </div>
            </div>
          `);

        } catch (error) {
          console.error(`히트맵 생성 실패: ${region.name}`, error);
        }
      });

      // 히트맵 생성 완료
    }
  }, [isMapReady, weatherData]); // refreshTrigger 제거로 무한루프 방지

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
      
      {/* 온도 범례 - 항상 표시, 최상단 레이어 */}
      {isMapReady && (
        <div 
          className="absolute bottom-4 left-4 bg-white rounded-lg shadow-xl p-4 border-2 border-gray-300"
          style={{ 
            zIndex: 10000,
            backgroundColor: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(8px)',
            pointerEvents: 'none' // 지도 조작에 방해되지 않도록
          }}
        >
        <div className="text-sm font-bold text-gray-800 mb-3 flex items-center">
          🌡️ 온도 범례
        </div>
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <div 
              className="w-5 h-5 rounded-full border-2 border-white shadow-sm" 
              style={{ backgroundColor: '#3B82F6' }}
            ></div>
            <span className="text-xs font-medium text-gray-700">25°C 이하</span>
          </div>
          <div className="flex items-center space-x-3">
            <div 
              className="w-5 h-5 rounded-full border-2 border-white shadow-sm" 
              style={{ backgroundColor: '#22C55E' }}
            ></div>
            <span className="text-xs font-medium text-gray-700">26-27°C</span>
          </div>
          <div className="flex items-center space-x-3">
            <div 
              className="w-5 h-5 rounded-full border-2 border-white shadow-sm" 
              style={{ backgroundColor: '#EAB308' }}
            ></div>
            <span className="text-xs font-medium text-gray-700">28-29°C</span>
          </div>
          <div className="flex items-center space-x-3">
            <div 
              className="w-5 h-5 rounded-full border-2 border-white shadow-sm" 
              style={{ backgroundColor: '#F97316' }}
            ></div>
            <span className="text-xs font-medium text-gray-700">30-31°C</span>
          </div>
          <div className="flex items-center space-x-3">
            <div 
              className="w-5 h-5 rounded-full border-2 border-white shadow-sm" 
              style={{ backgroundColor: '#EF4444' }}
            ></div>
            <span className="text-xs font-medium text-gray-700">32°C 이상</span>
          </div>
        </div>
        </div>
      )}
      
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
      
    </div>
  );
};

DirectMapView.propTypes = {
  weatherData: PropTypes.object,
  selectedRegion: PropTypes.string,
  className: PropTypes.string,
  onCameraSelect: PropTypes.func,
  refreshTrigger: PropTypes.number,
};

export default DirectMapView;