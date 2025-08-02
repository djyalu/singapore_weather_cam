import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Camera, Clock, CheckCircle } from 'lucide-react';
import RefreshButton from '../common/RefreshButton';
import RealtimeClock from '../common/RealtimeClock';

const Header = React.memo(({
  systemStats = {},
  onRefresh,
  onForceRefresh,
  isRefreshing = false,
  lastUpdate,
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const handleOnline = useCallback(() => {
    setIsOnline(true);
  }, []);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
  }, []);

  useEffect(() => {
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  return (
    <>
      <header className="bg-gradient-to-br from-slate-800 via-blue-900 to-indigo-900 text-white shadow-2xl border-b border-blue-400/30 relative overflow-hidden">
        {/* 정적 배경 효과 - 애니메이션 제거 */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-indigo-600/5 to-purple-600/5"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 via-indigo-400 to-purple-400 opacity-60"></div>

        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-4 sm:py-6 lg:py-8 relative z-10">
          <div className="flex items-center justify-between min-h-[60px] sm:min-h-[80px]">
            {/* 로고 및 타이틀 - 모바일 최적화 */}
            <div className="flex items-center space-x-2 sm:space-x-4 lg:space-x-6 flex-1 min-w-0">
              <div className="relative flex-shrink-0">
                <div className="bg-gradient-to-br from-blue-500 via-indigo-600 to-purple-600 p-2 sm:p-3 lg:p-4 rounded-xl sm:rounded-2xl shadow-xl">
                  <Camera className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-white drop-shadow-md" />
                </div>
                <div className="absolute -top-0.5 -right-0.5 sm:-top-1 sm:-right-1 w-3 h-3 sm:w-4 sm:h-4 bg-green-400 rounded-full border-2 border-white shadow-md">
                </div>
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-base sm:text-xl lg:text-2xl xl:text-3xl font-bold text-transparent bg-gradient-to-r from-blue-200 via-indigo-200 to-purple-200 bg-clip-text font-display tracking-tight leading-tight">
                  <span className="hidden sm:inline">Singapore Weather Cam</span>
                  <span className="sm:hidden">SG Weather</span>
                </h1>
                <div className="flex items-center mt-1 sm:mt-2 space-x-2 sm:space-x-3">
                  <span className="bg-white/10 backdrop-blur-sm text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded text-xs font-medium flex items-center space-x-1 sm:space-x-1.5 border border-white/20">
                    <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-400 rounded-full flex-shrink-0"></div>
                    <span>LIVE</span>
                  </span>
                  <span className="text-xs text-white/80 font-medium hidden sm:inline">실시간 날씨 · HD 카메라</span>
                  <span className="text-xs text-white/80 font-medium sm:hidden">실시간</span>
                </div>
              </div>
            </div>

            {/* 우측 컨트롤 - 극도로 간결한 모바일 버전 */}
            <div className="flex items-center gap-1 sm:gap-2 lg:gap-3 flex-shrink-0">
              {/* 시스템 정보 - 큰 화면에서만 */}
              <div className="hidden lg:block text-right">
                <div className="text-xs text-white/70 mb-1">최근 업데이트</div>
                <div className="text-sm text-white font-semibold">{systemStats.lastUpdate || '로딩 중...'}</div>
              </div>

              {/* 시간 + 새로고침 통합 박스 */}
              <div className="bg-white/10 backdrop-blur-sm rounded-lg border border-white/20 flex items-center overflow-hidden">
                {/* 시간 영역 - 모바일에서 극도로 압축 */}
                <div className="px-2 sm:px-3 py-1 sm:py-1.5 text-center">
                  <div className="text-xs text-white/70 mb-0.5 hidden sm:block">Singapore</div>
                  <div className="text-xs sm:text-sm lg:text-base font-bold text-white tabular-nums leading-tight">
                    <RealtimeClock className="text-white text-xs sm:text-sm lg:text-base font-bold" />
                  </div>
                </div>

                {/* 구분선 */}
                <div className="w-px h-6 sm:h-8 bg-white/20"></div>

                {/* 새로고침 버튼 - 통합 */}
                {onForceRefresh && (
                  <RefreshButton
                    onRefresh={onForceRefresh}
                    isRefreshing={isRefreshing}
                    isOnline={isOnline}
                    lastUpdate={lastUpdate}
                    variant="minimal"
                    showStatus={false}
                    showTimer={false}
                    className="bg-transparent hover:bg-white/10 text-white border-0 px-2 sm:px-3 py-1 sm:py-1.5 rounded-none h-auto min-h-0"
                  />
                )}
              </div>
            </div>
          </div>

          {/* 모바일용 최소한의 상태 표시 - 더욱 간결하게 */}
          <div className="mt-2 sm:mt-3 lg:hidden">
            <div className="text-xs text-white/60 text-center">
              {systemStats.totalWebcams || systemStats.totalCameras || 0}개 카메라 • {systemStats.lastUpdate || '로딩 중...'}
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