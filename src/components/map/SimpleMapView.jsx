import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { MapPin, Navigation, Zap, AlertTriangle, Camera } from 'lucide-react';

/**
 * 간단하고 안정적인 지도 대체 컴포넌트
 * Leaflet 라이브러리 없이 순수 HTML/CSS로 구현
 */
const SimpleMapView = ({ weatherData, selectedRegion = 'all', className = '', onCameraSelect }) => {
  console.log('🗺️ SimpleMapView 렌더링 시작');

  return (
    <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
      {/* 테스트 헤더 */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 text-white p-4">
        <h2 className="text-xl font-bold">🗺️ SimpleMapView 렌더링 테스트</h2>
        <p className="text-sm">
          SimpleMapView가 정상적으로 표시되고 있습니다.
        </p>
        <p className="text-xs mt-2">
          weatherData: {weatherData ? '있음' : '없음'} | selectedRegion: {selectedRegion}
        </p>
      </div>
      
      {/* 지도 영역 */}
      <div className="h-96 relative bg-gradient-to-br from-blue-50 to-green-50 overflow-hidden flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">🗺️</div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            SimpleMapView 작동 중
          </h3>
          <p className="text-gray-600">
            지도 컴포넌트가 성공적으로 렌더링되었습니다.
          </p>
        </div>
      </div>
    </div>
  );
};

SimpleMapView.propTypes = {
  weatherData: PropTypes.object,
  selectedRegion: PropTypes.string,
  className: PropTypes.string,
  onCameraSelect: PropTypes.func,
};

SimpleMapView.displayName = 'SimpleMapView';

export default SimpleMapView;