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

          // 마커 클릭 시 팝업만 표시 (추가 모달 비활성화)
          // marker.on('click', () => {
          //   if (onCameraSelect) {
          //     onCameraSelect({
          //       id: camera.camera_id,
          //       name: `Traffic Camera ${camera.camera_id}`,
          //       location: { latitude, longitude },
          //       image: { url: camera.image }
          //     });
          //   }
          // });
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

        // 권역별 날씨 히트맵 추가
        console.log('🔍 날씨 데이터 확인:', {
          hasWeatherData: !!weatherData,
          hasData: !!weatherData?.data,
          hasTemp: !!weatherData?.data?.temperature,
          hasReadings: !!weatherData?.data?.temperature?.readings,
          readingsLength: weatherData?.data?.temperature?.readings?.length,
          fullWeatherData: weatherData
        });
        
        if (weatherData?.data?.temperature?.readings?.length) {
          console.log('✅ 날씨 히트맵 렌더링 시작');
          
          // 실제 사용 가능한 스테이션: S107, S60, S24, S104
          const weatherRegions = [
            { id: 'north', name: 'Northern Singapore', lat: 1.4200, lng: 103.7900, stationIds: ['S104'], emoji: '🌳' },
            { id: 'northwest', name: 'Northwest (Hwa Chong)', lat: 1.3500, lng: 103.7600, stationIds: ['S104', 'S60'], emoji: '🏫' },
            { id: 'central', name: 'Central Singapore', lat: 1.3100, lng: 103.8300, stationIds: ['S107'], emoji: '🏙️' },
            { id: 'west', name: 'Western Singapore', lat: 1.3300, lng: 103.7000, stationIds: ['S60'], emoji: '🏭' },
            { id: 'east', name: 'Eastern Singapore', lat: 1.3600, lng: 103.9600, stationIds: ['S24', 'S107'], emoji: '✈️' },
            { id: 'southeast', name: 'Southeast', lat: 1.3200, lng: 103.9200, stationIds: ['S24'], emoji: '🏘️' },
            { id: 'south', name: 'Southern Singapore', lat: 1.2700, lng: 103.8500, stationIds: ['S24'], emoji: '🌊' }
          ];

          const tempReadings = weatherData.data.temperature.readings || [];
          const humidityReadings = weatherData.data.humidity.readings || [];
          const rainfallReadings = weatherData.data.rainfall.readings || [];

          weatherRegions.forEach(region => {
            // 온도 데이터 매칭
            const stationTemps = region.stationIds
              .map(id => tempReadings.find(reading => reading.station === id))
              .filter(Boolean);
              
            // 습도 데이터 매칭  
            const stationHumidity = region.stationIds
              .map(id => humidityReadings.find(reading => reading.station === id))
              .filter(Boolean);
              
            // 강수량 데이터 매칭
            const stationRainfall = region.stationIds
              .map(id => rainfallReadings.find(reading => reading.station === id))
              .filter(Boolean);

            console.log(`📍 ${region.name}: 온도 ${stationTemps.length}개, 습도 ${stationHumidity.length}개, 강수 ${stationRainfall.length}개 스테이션`);

            if (stationTemps.length > 0) {
              const avgTemp = stationTemps.reduce((sum, s) => sum + (s.value || 0), 0) / stationTemps.length;
              const avgHumidity = stationHumidity.length > 0 
                ? stationHumidity.reduce((sum, s) => sum + (s.value || 0), 0) / stationHumidity.length 
                : 0;
              const totalRainfall = stationRainfall.length > 0 
                ? stationRainfall.reduce((sum, s) => sum + (s.value || 0), 0) 
                : 0;
              
              const tempColor = avgTemp >= 32 ? '#EF4444' : avgTemp >= 30 ? '#F97316' : avgTemp >= 28 ? '#EAB308' : avgTemp >= 26 ? '#22C55E' : '#3B82F6';
              const intensity = 0.4 + Math.abs(avgTemp - 28) / 6 * 0.3; // 더 진하게
              
              console.log(`🎨 ${region.name}: ${avgTemp.toFixed(1)}°C → 색상: ${tempColor}, 투명도: ${intensity.toFixed(2)}`);
              
              // 권역별 원형 히트맵 (더 크고 진하게)
              const circle = window.L.circle([region.lat, region.lng], {
                color: tempColor,
                fillColor: tempColor,
                fillOpacity: Math.min(intensity, 0.8), // 최대 80% 투명도
                radius: 8000, // 반지름 2배로 증가
                weight: 3, // 테두리 굵게
                interactive: false,
                pane: 'overlayPane' // 교통 카메라보다 아래 레이어
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
              <div className="w-3 h-3 bg-yellow-400 rounded-full border border-orange-400" style="display: flex; align-items: center; justify-content: center; font-size: 8px;">⭐</div>
              <span>⭐ Hwa Chong School</span>
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