import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Camera, Clock, CheckCircle } from 'lucide-react';
import RefreshButton from '../common/RefreshButton';

const Header = React.memo(({ 
  systemStats = {}, 
  onRefresh, 
  onForceRefresh, 
  isRefreshing = false,
  lastUpdate 
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
  }, []);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
  }, []);

  useEffect(() => {
    let animationFrameId;
    let lastUpdate = 0;

    const updateTime = (timestamp) => {
      if (timestamp - lastUpdate >= 1000) {
        setCurrentTime(new Date());
        lastUpdate = timestamp;
      }
      animationFrameId = requestAnimationFrame(updateTime);
    };

    animationFrameId = requestAnimationFrame(updateTime);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  const formatTime = useCallback((date) => {
    try {
      return date.toLocaleTimeString('ko-KR');
    } catch (error) {
      return '--:--:--';
    }
  }, []);

  return (
    <>
      <header className="bg-white shadow-xl border-b-4 border-blue-500">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 p-3 rounded-xl">
                <Camera className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Singapore Weather Cam
                </h1>
                <div className="flex items-center mt-2">
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                    <CheckCircle className="w-4 h-4" />
                    <span>정상 운영</span>
                  </span>
                </div>
              </div>
            </div>


            <div className="flex items-center gap-4">
              {/* 새로고침 버튼 */}
              {onRefresh && (
                <RefreshButton
                  onRefresh={onRefresh}
                  onForceRefresh={onForceRefresh}
                  isRefreshing={isRefreshing}
                  isOnline={isOnline}
                  lastUpdate={lastUpdate}
                  variant="default"
                  showStatus={false}
                  showTimer={true}
                  className="animate-fade-in"
                />
              )}
              
              {/* 시스템 정보 */}
              <div className="hidden xl:block text-right">
                <div className="bg-gray-50 p-4 rounded-xl border">
                  <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                    <Clock className="w-4 h-4" />
                    <span>마지막 업데이트: {systemStats.lastUpdate || '정보 없음'}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    <div>📹 {systemStats.totalWebcams || 0}개 웹캠</div>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      </header>
    </>
  );
});

Header.propTypes = {
  systemStats: PropTypes.shape({
    totalWebcams: PropTypes.number,
    lastUpdate: PropTypes.string,
    totalProcessingTime: PropTypes.string,
    averageConfidence: PropTypes.number,
  }),
  onRefresh: PropTypes.func,
  onForceRefresh: PropTypes.func,
  isRefreshing: PropTypes.bool,
  lastUpdate: PropTypes.instanceOf(Date),
};

Header.displayName = 'Header';

export default Header;