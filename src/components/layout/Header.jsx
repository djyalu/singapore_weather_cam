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
      <header className="bg-gradient-to-br from-purple-900 via-pink-800 to-red-800 text-white shadow-2xl border-b-4 border-pink-400/50 relative overflow-hidden">
        {/* 애니메이션 배경 효과 */}
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-pink-600/20 to-red-600/20 animate-pulse"></div>
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-cyan-400 via-purple-400 to-pink-400 animate-pulse"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 relative z-10">
          <div className="flex items-center justify-between">
            {/* 로고 및 타이틀 - 완전히 새로운 디자인 */}
            <div className="flex items-center space-x-6 sm:space-x-8">
              <div className="relative">
                <div className="bg-gradient-to-br from-cyan-400 via-purple-500 to-pink-500 p-4 sm:p-6 rounded-3xl shadow-2xl transform rotate-3 hover:rotate-0 transition-transform duration-300">
                  <Camera className="w-10 h-10 sm:w-12 sm:h-12 text-white drop-shadow-lg" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full border-3 border-white animate-bounce shadow-lg">
                  <div className="absolute inset-1 bg-white rounded-full animate-ping"></div>
                </div>
              </div>
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-transparent bg-gradient-to-r from-cyan-200 via-purple-200 to-pink-200 bg-clip-text font-display tracking-tight drop-shadow-2xl">
                  Singapore Weather Cam
                </h1>
                <div className="flex items-center mt-3 space-x-4">
                  <span className="bg-gradient-to-r from-green-400 to-emerald-500 text-white px-4 py-2 rounded-full text-sm font-bold flex items-center space-x-2 shadow-xl transform hover:scale-105 transition-transform duration-200">
                    <CheckCircle className="w-4 h-4" />
                    <span>🔴 LIVE</span>
                  </span>
                  <span className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-xl transform hover:scale-105 transition-transform duration-200">
                    <span>🌡️ 실시간 날씨</span>
                  </span>
                  <span className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-4 py-2 rounded-full text-sm font-bold shadow-xl transform hover:scale-105 transition-transform duration-200">
                    <span>📹 HD 카메라</span>
                  </span>
                </div>
              </div>
            </div>

            {/* 우측 컨트롤 - 새로운 디자인 */}
            <div className="flex items-center gap-4 sm:gap-6">
              {/* 시스템 정보 - 큰 화면에서만 표시 */}
              <div className="hidden xl:block text-right">
                <div className="bg-gradient-to-r from-indigo-500/20 to-purple-600/20 backdrop-blur-lg p-4 rounded-2xl border-2 border-purple-400/30 shadow-xl">
                  <div className="flex items-center space-x-2 text-sm text-purple-100 mb-2 font-display font-bold">
                    <Clock className="w-5 h-5 text-cyan-300" />
                    <span>데이터 업데이트</span>
                  </div>
                  <div className="text-sm text-white font-display font-bold">
                    <div className="text-cyan-200">{systemStats.lastUpdate || '로딩 중...'}</div>
                    <div className="text-pink-200">📹 카메라 {systemStats.totalWebcams || systemStats.totalCameras || 0}개 LIVE</div>
                  </div>
                </div>
              </div>

              {/* 현재 시간 표시 - 눈에 띄는 디자인 */}
              <div className="text-right">
                <div className="bg-gradient-to-r from-cyan-500/30 to-blue-600/30 backdrop-blur-lg p-5 rounded-2xl border-2 border-cyan-400/40 shadow-2xl transform hover:scale-105 transition-transform duration-300">
                  <div className="text-sm text-cyan-100 mb-2 hidden sm:block font-display font-bold">🇸🇬 싱가포르 시간</div>
                  <div className="text-xl sm:text-2xl font-display font-black text-white drop-shadow-lg">
                    {formatTime(currentTime)}
                  </div>
                  <div className="text-xs text-cyan-200 mt-1 font-bold">LIVE TIME</div>
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

          {/* 모바일용 현대적 상태 표시 */}
          <div className="mt-6 flex justify-between items-center lg:hidden">
            <div className="bg-gradient-to-r from-purple-600/30 to-pink-600/30 backdrop-blur-sm px-4 py-2 rounded-full border border-purple-400/30">
              <div className="text-sm text-white font-display font-bold">
                📹 카메라 {systemStats.totalWebcams || systemStats.totalCameras || 0}개 • {systemStats.lastUpdate || '로딩 중...'}
              </div>
            </div>
            <div className="bg-gradient-to-r from-cyan-600/30 to-blue-600/30 backdrop-blur-sm px-4 py-2 rounded-full border border-cyan-400/30">
              <div className="text-sm text-white font-display font-bold tracking-wide">
                🕒 {formatTime(currentTime)}
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