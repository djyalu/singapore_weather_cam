import React from 'react';
import PropTypes from 'prop-types';

/**
 * WebcamGallery Component (Deprecated)
 * This component has been replaced with TrafficCameraGallery
 * Shows a friendly migration message instead of webcam functionality
 */
const WebcamGallery = ({ data }) => {
  // WebcamGallery has been deprecated and replaced with TrafficCameraGallery
  return (
    <div className="card">
      <div className="text-center py-8">
        <div className="text-6xl mb-4">🚗</div>
        <h3 className="text-lg font-bold text-gray-800 mb-2">
          실시간 교통 카메라로 업그레이드됨
        </h3>
        <p className="text-gray-600 mb-4">
          웹캠 기능이 90개 실시간 교통 카메라 시스템으로 교체되었습니다.
        </p>
        <p className="text-sm text-blue-600">
          더 나은 실시간 모니터링을 위해 상단의 교통 카메라 섹션을 확인해주세요.
        </p>
      </div>
    </div>
  );
};

WebcamGallery.propTypes = {
  data: PropTypes.object,
};

WebcamGallery.displayName = 'WebcamGallery';

export default WebcamGallery;