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
      <header className="bg-gradient-to-br from-slate-800 via-blue-900 to-indigo-900 text-white shadow-2xl border-b border-blue-400/30 relative overflow-hidden">
        {/* 차분한 애니메이션 배경 효과 */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-indigo-600/10 to-purple-600/10 animate-pulse"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 opacity-60"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 relative z-10">
          <div className="flex items-center justify-between">
            {/* 로고 및 타이틀 - 완전히 새로운 디자인 */}
            <div className="flex items-center space-x-4 sm:space-x-6">
              <div className="relative">
                <div className="bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 p-3 sm:p-4 rounded-2xl shadow-xl">
                  <Camera className="w-8 h-8 sm:w-10 sm:h-10 text-white drop-shadow-md" />
                </div>
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-pulse shadow-md">
                </div>
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-transparent bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200 bg-clip-text font-display tracking-tight">
                  Singapore Weather Cam
                </h1>
                <div className="flex items-center mt-2 space-x-3">
                  <span className="bg-white/10 backdrop-blur-sm text-white px-3 py-1 rounded-md text-xs font-medium flex items-center space-x-1.5 border border-white/20">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span>LIVE</span>
                  </span>
                  <span className="text-xs text-white/80 font-medium">실시간 날씨 · HD 카메라</span>
                </div>
              </div>
            </div>

            {/* 우측 컨트롤 - 간결한 디자인 */}
            <div className="flex items-center gap-3 sm:gap-4">
              {/* 시스템 정보 - 큰 화면에서만 간단하게 */}
              <div className="hidden lg:block text-right">
                <div className="text-xs text-white/70 mb-1">최근 업데이트</div>
                <div className="text-sm text-white font-semibold">{systemStats.lastUpdate || '로딩 중...'}</div>
              </div>

              {/* 현재 시간 - 심플하고 깔끔하게 */}
              <div className="text-right">
                <div className="bg-white/10 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/20">
                  <div className="text-xs text-white/70 mb-1 hidden sm:block">Singapore</div>
                  <div className="text-lg font-bold text-white">
                    {formatTime(currentTime)}
                  </div>
                </div>
              </div>

              {/* 새로고침 버튼 - 가장 우측 */}
              {onForceRefresh && (
                <RefreshButton
                  onRefresh={onForceRefresh}
                  isRefreshing={isRefreshing}
                  isOnline={isOnline}
                  lastUpdate={lastUpdate}
                  variant="glass"
                  showStatus={false}
                  showTimer={false}
                  className="bg-white/10 backdrop-blur-sm border-white/20 text-white hover:bg-white/20"
                />
              )}
            </div>
          </div>

          {/* 모바일용 간결한 상태 표시 */}
          <div className="mt-4 flex justify-between items-center lg:hidden">
            <div className="text-xs text-white/70">
              카메라 {systemStats.totalWebcams || systemStats.totalCameras || 0}개 • {systemStats.lastUpdate || '로딩 중...'}
            </div>
            <div className="text-sm text-white font-semibold">
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