import React, { useState, useEffect, useRef } from 'react';
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
  const intervalRef = useRef(null);
  const tickerRef = useRef(null);

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

  // 경보 우선순위에 따른 스타일 결정 - 배경과 조화되도록 수정
  const getAlertStyle = (alert) => {
    const baseClasses = "flex items-center gap-3 px-4 py-2 whitespace-nowrap";
    
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

  // 경보 아이콘 결정
  const getAlertIcon = (alert) => {
    if (alert.type === 'critical' || alert.type === 'warning') {
      return <AlertTriangle className="w-4 h-4 animate-pulse text-red-600" />;
    }
    return <Info className="w-4 h-4 text-blue-600" />;
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

  // 경보가 없으면 렌더링하지 않음
  if (!isVisible || alerts.length === 0) {
    return null;
  }

  // 높은 우선순위 경보만 표시 (최대 5개)
  const displayAlerts = alerts
    .filter(alert => alert.priority !== 'low' || alerts.length === 1)
    .slice(0, 5);

  return (
    <div className={`bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 border-b border-gray-200/50 ${className}`}>
      <div className="relative overflow-hidden">
        {/* 배경 패턴 제거 - 깔끔한 배경 */}
        
        {/* 티커 헤더 */}
        <div className="flex items-center justify-between px-4 py-2 bg-white/10 border-b border-gray-300/20">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-gray-800 font-semibold text-sm">🚨 기상 경보</span>
            </div>
            <span className="text-gray-600 text-xs">
              {loading ? 'Loading...' : `${displayAlerts.length}건 • NEA Singapore`}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="text-gray-600 hover:text-gray-800 transition-colors p-1 rounded"
              title="새로고침"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={togglePause}
              className="text-gray-600 hover:text-gray-800 transition-colors px-2 py-1 text-xs rounded bg-white/20"
              title={isPaused ? "재생" : "일시정지"}
            >
              {isPaused ? '▶️' : '⏸️'}
            </button>
            <button
              onClick={toggleVisibility}
              className="text-gray-600 hover:text-gray-800 transition-colors p-1 rounded"
              title="닫기"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 스크롤 티커 영역 */}
        <div className="relative h-12 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="flex items-center gap-2 text-gray-700">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="text-sm">기상 정보 업데이트 중...</span>
              </div>
            </div>
          ) : (
            <div 
              ref={tickerRef}
              className={`flex items-center h-full ${isPaused ? '' : 'animate-scroll-left'}`}
              style={{
                animationDuration: `${Math.max(15, displayAlerts.length * 4)}s`, // 2배 속도로 변경
                animationPlayState: isPaused ? 'paused' : 'running'
              }}
            >
              {/* 원본 메시지들 */}
              {displayAlerts.map((alert, index) => (
                <div key={`${alert.timestamp}-${index}`} className={`${getAlertStyle(alert)} mr-8`}>
                  <span className="text-lg">{alert.icon}</span>
                  {getAlertIcon(alert)}
                  <span className="font-medium">{alert.message}</span>
                  <span className="text-xs opacity-70 ml-2">
                    {new Date(alert.timestamp).toLocaleTimeString('ko-KR', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                </div>
              ))}
              
              {/* 무한 스크롤을 위한 복제 - 간격 추가 */}
              {displayAlerts.map((alert, index) => (
                <div key={`duplicate-${alert.timestamp}-${index}`} className={`${getAlertStyle(alert)} mr-8`}>
                  <span className="text-lg">{alert.icon}</span>
                  {getAlertIcon(alert)}
                  <span className="font-medium">{alert.message}</span>
                  <span className="text-xs opacity-70 ml-2">
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