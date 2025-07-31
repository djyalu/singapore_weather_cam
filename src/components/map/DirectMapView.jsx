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

  // Singapore 중심 좌표 (Hwa Chong International School)
  const SINGAPORE_CENTER = [1.3437, 103.7640];
  const DEFAULT_ZOOM = 12;

  useEffect(() => {
    let timeoutId;
    
    const initializeMap = () => {
      // Leaflet이 로드되었는지 확인
      if (typeof window.L === 'undefined') {
        console.log('⏳ Leaflet CDN 로딩 대기 중...');
        timeoutId = setTimeout(initializeMap, 500);
        return;
      }

      try {
        console.log('✅ Leaflet CDN 로드 완료, 지도 초기화 시작');
        
        // 기존 지도 인스턴스 제거
        if (leafletMapRef.current) {
          leafletMapRef.current.remove();
          leafletMapRef.current = null;
        }

        // 지도 컨테이너 확인
        if (!mapRef.current) {
          throw new Error('지도 컨테이너를 찾을 수 없습니다');
        }

        // Leaflet 지도 생성
        const map = window.L.map(mapRef.current, {
          center: SINGAPORE_CENTER,
          zoom: DEFAULT_ZOOM,
          zoomControl: true,
          attributionControl: true,
        });

        // OpenStreetMap 타일 레이어 추가
        window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 18,
          minZoom: 10,
        }).addTo(map);

        // 중심점 마커 (Hwa Chong)
        const centerMarker = window.L.marker(SINGAPORE_CENTER).addTo(map);
        centerMarker.bindPopup('<b>🏫 Hwa Chong International School</b><br>날씨 모니터링 중심점');

        // 날씨 데이터가 있으면 마커 추가
        if (weatherData && weatherData.locations) {
          weatherData.locations.slice(0, 10).forEach((station, index) => {
            if (station.temperature && station.temperature > 0) {
              // 임시 좌표 (실제로는 station.coordinates 사용)
              const lat = SINGAPORE_CENTER[0] + (Math.random() - 0.5) * 0.2;
              const lng = SINGAPORE_CENTER[1] + (Math.random() - 0.5) * 0.2;
              
              const marker = window.L.marker([lat, lng]).addTo(map);
              marker.bindPopup(`
                <div class="p-2">
                  <b>🌡️ ${station.station_id || `Station ${index}`}</b><br>
                  <span class="text-blue-600">온도: ${station.temperature}°C</span><br>
                  <span class="text-green-600">습도: ${station.humidity || '--'}%</span>
                </div>
              `);
            }
          });
        }

        leafletMapRef.current = map;
        setIsMapReady(true);
        setMapError(null);
        
        console.log('🎉 Leaflet 지도 초기화 완료!');
        
      } catch (error) {
        console.error('🚨 Leaflet 지도 초기화 실패:', error);
        setMapError(`지도 로딩 실패: ${error.message}`);
      }
    };

    // 컴포넌트 마운트 시 지도 초기화
    initializeMap();

    // 클린업
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (leafletMapRef.current) {
        leafletMapRef.current.remove();
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
        <div className="absolute top-4 left-4 bg-white bg-opacity-90 rounded-lg p-3 shadow-lg">
          <div className="text-sm font-medium text-gray-800">🗺️ OpenStreetMap</div>
          <div className="text-xs text-gray-600">실시간 Singapore 지도</div>
          <div className="text-xs text-blue-600">확대/축소 지원</div>
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