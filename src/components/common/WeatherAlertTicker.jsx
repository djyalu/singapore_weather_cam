import React, { useState, useEffect, useRef, useMemo } from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle, Info, X, RefreshCw } from 'lucide-react';
import neaAlertService from '../../services/neaAlertService';

/**
 * 실시간 기상 경보 티커 컴포넌트
 * NEA API를 통해 폭염, 호우, 대기질 등의 긴급 정보를 스크롤 형태로 표시
 */
const WeatherAlertTicker = React.memo(({ className = '', refreshInterval = 300000 }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isVisible, setIsVisible] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [isBackgroundTab, setIsBackgroundTab] = useState(false);
  const intervalRef = useRef(null);
  const tickerRef = useRef(null);

  // 배터리 절약을 위한 백그라운드 탭 감지
  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsBackgroundTab(document.hidden);
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // 경보 데이터 로드
  const loadAlerts = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const alertData = await neaAlertService.getWeatherAlerts();
      setAlerts(alertData);
      
      console.log('📡 Weather alerts loaded:', alertData.length);
    } catch (err) {
      console.error('🚨 Failed to load weather alerts:', err);
      setError(err.message);
      
      // 에러 시 기본 메시지 표시
      setAlerts([{
        type: 'error',
        priority: 'low',
        icon: '⚠️',
        message: '기상 경보 정보를 불러올 수 없습니다. 잠시 후 다시 시도해주세요.',
        timestamp: new Date().toISOString(),
        source: 'System'
      }]);
    } finally {
      setLoading(false);
    }
  };

  // 컴포넌트 마운트 시 데이터 로드 및 주기적 업데이트
  useEffect(() => {
    loadAlerts();

    // 주기적 업데이트 설정
    intervalRef.current = setInterval(loadAlerts, refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [refreshInterval]);

  // 경보 우선순위에 따른 스타일 결정 - 모바일 최적화 포함
  const getAlertStyle = (alert) => {
    const baseClasses = "flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-3 whitespace-nowrap text-sm sm:text-base min-h-[48px] touch-manipulation";
    
    switch (alert.priority) {
      case 'critical':
        return `${baseClasses} text-red-800 font-semibold`;
      case 'high':
        return `${baseClasses} text-orange-800 font-semibold`;
      case 'medium':
        return `${baseClasses} text-amber-800 font-medium`;
      case 'low':
        return `${baseClasses} text-gray-800 font-normal`;
      case 'error':
        return `${baseClasses} text-red-700 font-medium`;
      default:
        return `${baseClasses} text-gray-800 font-normal`;
    }
  };

  // 경보 아이콘 결정 - 모바일 최적화 (깜박거림 제거)
  const getAlertIcon = (alert) => {
    if (alert.type === 'critical' || alert.type === 'warning') {
      return <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0" />;
    }
    return <Info className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />;
  };

  // 티커 숨기기/보이기
  const toggleVisibility = () => {
    setIsVisible(!isVisible);
  };

  // 티커 일시정지/재생
  const togglePause = () => {
    setIsPaused(!isPaused);
  };

  // 수동 새로고침
  const handleRefresh = () => {
    loadAlerts();
  };

  // 티커 숨김 처리 (경보가 없어도 로딩 상태 표시)
  if (!isVisible) {
    return null;
  }

  // 높은 우선순위 경보만 표시 (최대 5개)
  const displayAlerts = useMemo(() => 
    alerts
      .filter(alert => alert.priority !== 'low' || alerts.length === 1)
      .slice(0, 5), 
    [alerts]
  );

  // 애니메이션 활성화 조건 (배터리 절약)
  const shouldAnimate = useMemo(() => 
    !isPaused && !isBackgroundTab && displayAlerts.length > 0,
    [isPaused, isBackgroundTab, displayAlerts.length]
  );

  // 동적 애니메이션 지속 시간 계산
  const animationDuration = useMemo(() => 
    Math.max(12, displayAlerts.length * 3), 
    [displayAlerts.length]
  );

  return (
    <div className={`bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-b border-gray-200/50 ${className}`}>
      <div className="relative overflow-hidden">
        {/* 배경 패턴 제거 - 깔끔한 배경 */}
        
        {/* 티커 헤더 */}
        <div className="flex items-center justify-between px-4 py-2 bg-white/10 border-b border-gray-300/20">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-1 sm:gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full"></div>
              <span className="text-gray-800 font-semibold text-xs sm:text-sm">🚨 기상 경보</span>
            </div>
            <span className="text-gray-600 text-xs hidden sm:block">
              {loading ? 'Loading...' : `${displayAlerts.length}건 • NEA Singapore`}
            </span>
            <span className="text-gray-600 text-xs sm:hidden">
              {loading ? '...' : `${displayAlerts.length}건`}
            </span>
          </div>
          
          <div className="flex items-center gap-1">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="text-gray-600 hover:text-gray-800 transition-colors touch-manipulation flex items-center justify-center min-w-[48px] min-h-[48px] p-3 rounded-md hover:bg-white/20 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              title="새로고침"
              aria-label="날씨 경보 새로고침"
            >
              <RefreshCw className={`w-5 h-5 sm:w-6 sm:h-6 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={togglePause}
              className="text-gray-600 hover:text-gray-800 transition-colors touch-manipulation flex items-center justify-center min-w-[48px] min-h-[48px] px-3 py-2 text-sm sm:text-base rounded-md bg-white/20 hover:bg-white/30 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              title={isPaused ? "재생" : "일시정지"}
              aria-label={isPaused ? "티커 재생" : "티커 일시정지"}
            >
              <span className="text-base">{isPaused ? '▶️' : '⏸️'}</span>
            </button>
            <button
              onClick={toggleVisibility}
              className="text-gray-600 hover:text-gray-800 transition-colors touch-manipulation flex items-center justify-center min-w-[48px] min-h-[48px] p-3 rounded-md hover:bg-white/20 active:scale-95 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
              title="닫기"
              aria-label="기상 경보 티커 닫기"
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>
        </div>

        {/* 스크롤 티커 영역 - 모바일 최적화 */}
        <div className="relative h-12 sm:h-14 overflow-hidden touch-manipulation">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex items-center gap-2 text-gray-700">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="text-sm sm:text-base">기상 정보 업데이트 중...</span>
              </div>
            </div>
          ) : displayAlerts.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex items-center gap-2 text-gray-600">
                <Info className="w-4 h-4" />
                <span className="text-sm sm:text-base">기상 정보를 불러오는 중입니다...</span>
              </div>
            </div>
          ) : (
            <div 
              ref={tickerRef}
              className={`flex items-center h-full will-change-transform ${shouldAnimate ? 'animate-scroll-left' : ''}`}
              style={{
                animationDuration: `${animationDuration}s`,
                animationPlayState: shouldAnimate ? 'running' : 'paused',
                transform: shouldAnimate ? 'translateZ(0)' : 'none', // GPU 레이어 활성화
                backfaceVisibility: 'hidden', // iOS Safari 최적화
                perspective: '1000px' // 3D 렌더링 성능 향상
              }}
            >
              {/* 원본 메시지들 */}
              {displayAlerts.map((alert, index) => (
                <div key={`${alert.timestamp}-${index}`} className={`${getAlertStyle(alert)} mr-6 sm:mr-8`}>
                  <span className="text-sm sm:text-lg flex-shrink-0">{alert.icon}</span>
                  {getAlertIcon(alert)}
                  <span className="font-medium min-w-0 flex-1">{alert.message}</span>
                  <span className="text-xs opacity-70 ml-1 sm:ml-2 flex-shrink-0 hidden sm:inline">
                    {new Date(alert.timestamp).toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              ))}
              
              {/* 무한 스크롤을 위한 복제 - 간격 추가 */}
              {displayAlerts.map((alert, index) => (
                <div key={`duplicate-${alert.timestamp}-${index}`} className={`${getAlertStyle(alert)} mr-6 sm:mr-8`}>
                  <span className="text-sm sm:text-lg flex-shrink-0">{alert.icon}</span>
                  {getAlertIcon(alert)}
                  <span className="font-medium min-w-0 flex-1">{alert.message}</span>
                  <span className="text-xs opacity-70 ml-1 sm:ml-2 flex-shrink-0 hidden sm:inline">
                    {new Date(alert.timestamp).toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              ))}
              
              {/* 추가 패딩으로 부드러운 전환 */}
              <div className="w-32 flex-shrink-0"></div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

WeatherAlertTicker.propTypes = {
  className: PropTypes.string,
  refreshInterval: PropTypes.number, // 새로고침 간격 (ms)
};

WeatherAlertTicker.displayName = 'WeatherAlertTicker';

export default WeatherAlertTicker;