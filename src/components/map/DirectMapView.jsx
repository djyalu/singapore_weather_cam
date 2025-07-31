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

        // 날씨 데이터 마커 추가
        if (weatherData?.locations?.length) {
          weatherData.locations.slice(0, 8).forEach((station, index) => {
            if (station.temperature && parseFloat(station.temperature) > 0) {
              try {
                // Singapore 범위 내 랜덤 좌표
                const lat = SINGAPORE_CENTER[0] + (Math.random() - 0.5) * 0.15;
                const lng = SINGAPORE_CENTER[1] + (Math.random() - 0.5) * 0.15;
                
                const marker = window.L.marker([lat, lng]).addTo(map);
                marker.bindPopup(`
                  <div style="padding: 8px; min-width: 200px;">
                    <strong>🌡️ ${station.station_id || `Station ${index + 1}`}</strong><br>
                    <div style="margin: 4px 0;">
                      <span style="color: #2563eb;">🌡️ 온도: ${station.temperature}°C</span><br>
                      <span style="color: #16a34a;">💧 습도: ${station.humidity || '--'}%</span><br>
                      ${station.rainfall ? `<span style="color: #0891b2;">🌧️ 강수: ${station.rainfall}mm</span>` : ''}
                    </div>
                  </div>
                `);
              } catch (stationError) {
                console.warn(`스테이션 ${index} 마커 생성 오류:`, stationError);
              }
            }
          });
        }

        leafletMapRef.current = map;
        setMapError(null);
        
        console.log('🎉 Leaflet 지도 초기화 완료!');
        
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