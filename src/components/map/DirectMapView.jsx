import React, { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

/**
 * 직접 Leaflet API를 사용하는 지도 컴포넌트
 * CDN Leaflet과 완벽 호환 - 깜빡임 문제 해결
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

  // 날씨 데이터 변경 시 레이어만 업데이트
  useEffect(() => {
    console.log('🔍 날씨 히트맵 업데이트 시도:', {
      hasMap: !!leafletMapRef.current,
      hasWeatherData: !!weatherData,
      hasTemperatureData: !!weatherData?.data?.temperature,
      hasReadings: !!weatherData?.data?.temperature?.readings,
      readingsLength: weatherData?.data?.temperature?.readings?.length,
      weatherDataStructure: weatherData ? Object.keys(weatherData) : 'no weatherData'
    });

    if (!leafletMapRef.current) {
      console.log('❌ 지도가 아직 준비되지 않음');
      return;
    }

    if (!weatherData || !weatherData.data || !weatherData.data.temperature || !weatherData.data.temperature.readings) {
      console.log('❌ 날씨 데이터 구조 문제:', {
        weatherData: !!weatherData,
        hasData: !!weatherData?.data,
        hasTemperature: !!weatherData?.data?.temperature,
        hasReadings: !!weatherData?.data?.temperature?.readings
      });
      return;
    }

    console.log('✅ 조건 통과! 날씨 히트맵 레이어 업데이트 시작...', {
      tempReadings: weatherData.data.temperature.readings.length,
      stations: weatherData.data.temperature.readings.map(r => r.station)
    });
    
    // 기존 날씨 레이어 제거
    leafletMapRef.current.eachLayer(layer => {
      if (layer.options && (layer.options.className === 'weather-layer' || layer.options.className === 'weather-icon')) {
        leafletMapRef.current.removeLayer(layer);
      }
    });

    // 새로운 날씨 레이어 추가 (실제 데이터 기반으로 수정)
    const weatherRegions = [
      { id: 'north', name: 'Northern Singapore', lat: 1.4200, lng: 103.7900, stationIds: ['S104'], emoji: '🌳' },
      { id: 'northwest', name: 'Northwest (Hwa Chong)', lat: 1.3500, lng: 103.7600, stationIds: ['S60'], emoji: '🏫' },
      { id: 'central', name: 'Central Singapore', lat: 1.3100, lng: 103.8300, stationIds: ['S107'], emoji: '🏙️' },
      { id: 'east', name: 'Eastern Singapore', lat: 1.3600, lng: 103.9600, stationIds: ['S24'], emoji: '✈️' },
      { id: 'combined', name: 'All Stations Average', lat: 1.3400, lng: 103.8200, stationIds: ['S107', 'S60', 'S24', 'S104'], emoji: '🌡️' }
    ];

    const tempReadings = weatherData.data.temperature.readings || [];
    const humidityReadings = weatherData.data.humidity.readings || [];
    const rainfallReadings = weatherData.data.rainfall.readings || [];

    weatherRegions.forEach(region => {
      console.log(`🔍 지역 ${region.name} 처리 중:`, {
        stationIds: region.stationIds,
        position: [region.lat, region.lng]
      });

      const stationTemps = region.stationIds
        .map(id => tempReadings.find(reading => reading.station === id))
        .filter(Boolean);
        
      const stationHumidity = region.stationIds
        .map(id => humidityReadings.find(reading => reading.station === id))
        .filter(Boolean);
        
      const stationRainfall = region.stationIds
        .map(id => rainfallReadings.find(reading => reading.station === id))
        .filter(Boolean);

      console.log(`📊 ${region.name} 데이터 매칭 결과:`, {
        stationTemps: stationTemps.map(s => ({ station: s.station, value: s.value })),
        stationHumidity: stationHumidity.length,
        stationRainfall: stationRainfall.length
      });

      if (stationTemps.length > 0) {
        const avgTemp = stationTemps.reduce((sum, s) => sum + (s.value || 0), 0) / stationTemps.length;
        const avgHumidity = stationHumidity.length > 0 
          ? stationHumidity.reduce((sum, s) => sum + (s.value || 0), 0) / stationHumidity.length 
          : 0;
        const totalRainfall = stationRainfall.length > 0 
          ? stationRainfall.reduce((sum, s) => sum + (s.value || 0), 0) 
          : 0;
        
        const tempColor = avgTemp >= 32 ? '#EF4444' : avgTemp >= 30 ? '#F97316' : avgTemp >= 28 ? '#EAB308' : avgTemp >= 26 ? '#22C55E' : '#3B82F6';
        const intensity = 0.7; // 고정된 불투명도로 더 잘 보이게
        
        console.log(`🎯 히트맵 원형 생성 시도: ${region.name}`, {
          temperature: avgTemp.toFixed(1),
          color: tempColor,
          position: [region.lat, region.lng],
          leafletAvailable: !!window.L,
          mapAvailable: !!leafletMapRef.current
        });

        try {
          // 권역별 원형 히트맵 - 더 큰 반지름으로 잘 보이게
          const circle = window.L.circle([region.lat, region.lng], {
            color: tempColor,
            fillColor: tempColor,
            fillOpacity: intensity,
            radius: 12000, // 더 큰 반지름
            weight: 3,     // 더 두꺼운 테두리
            interactive: true,
            pane: 'overlayPane',
            className: 'weather-layer'
          }).addTo(leafletMapRef.current);
          
          console.log(`✅ 히트맵 원형 생성 성공: ${region.name}`);
          
          // 간단한 팝업
          circle.bindPopup(`
            <div style="text-align: center; padding: 12px;">
              <strong>${region.emoji} ${region.name}</strong><br>
              <div style="color: ${tempColor}; font-size: 16px; font-weight: bold;">🌡️ ${avgTemp.toFixed(1)}°C</div>
            </div>
          `);

        } catch (error) {
          console.error(`❌ 히트맵 원형 생성 실패: ${region.name}`, error);
        }
      } else {
        console.log(`⚠️ ${region.name}: 매칭되는 온도 데이터 없음`);
      }
    });

    console.log('✅ 날씨 레이어 업데이트 완료');
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