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
      <header className="bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 text-white shadow-2xl border-b border-blue-400/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
          <div className="flex items-center justify-between">
            {/* 로고 및 타이틀 */}
            <div className="flex items-center space-x-4 sm:space-x-6">
              <div className="relative">
                <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-3 sm:p-4 rounded-2xl shadow-lg">
                  <Camera className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse"></div>
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-transparent bg-gradient-to-r from-white via-blue-100 to-purple-100 bg-clip-text">
                  Singapore Weather Cam
                </h1>
                <div className="flex items-center mt-2 space-x-3">
                  <span className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1 backdrop-blur-sm border border-green-400/30">
                    <CheckCircle className="w-4 h-4" />
                    <span>Live</span>
                  </span>
                  <span className="bg-blue-500/20 text-blue-300 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm border border-blue-400/30">
                    🌡️ Real-time
                  </span>
                </div>
              </div>
            </div>

            {/* 우측 컨트롤 */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* 현재 시간 표시 */}
              <div className="text-right">
                <div className="bg-white/10 backdrop-blur-sm p-2 sm:p-4 rounded-xl border border-white/20">
                  <div className="text-xs sm:text-sm text-blue-100 mb-1 hidden sm:block">Singapore Time</div>
                  <div className="text-sm sm:text-xl font-mono font-bold text-white">
                    {formatTime(currentTime)}
                  </div>
                </div>
              </div>

              {/* 실시간 새로고침 버튼 */}
              {onForceRefresh && (
                <RefreshButton
                  onRefresh={onForceRefresh}
                  isRefreshing={isRefreshing}
                  isOnline={isOnline}
                  lastUpdate={lastUpdate}
                  variant="glass"
                  showStatus={false}
                  showTimer={true}
                  className="animate-fade-in bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
                />
              )}
              
              {/* 시스템 정보 - 큰 화면에서만 표시 */}
              <div className="hidden xl:block text-right">
                <div className="bg-white/10 backdrop-blur-sm p-4 rounded-xl border border-white/20">
                  <div className="flex items-center space-x-2 text-sm text-blue-100 mb-2">
                    <Clock className="w-4 h-4" />
                    <span>{systemStats.lastUpdate || 'Loading...'}</span>
                  </div>
                  <div className="text-xs text-blue-200">
                    <div>📹 {systemStats.totalWebcams || 0} cameras</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 모바일용 간단한 상태 표시 */}
          <div className="mt-4 flex justify-between items-center lg:hidden">
            <div className="text-sm text-blue-200">
              📹 {systemStats.totalWebcams || 0} cameras • Updated {systemStats.lastUpdate || 'Loading...'}
            </div>
            <div className="text-sm text-blue-100 font-mono">
              {formatTime(currentTime)}
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