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

  // 경보 우선순위에 따른 스타일 결정
  const getAlertStyle = (alert) => {
    const baseClasses = "flex items-center gap-3 px-4 py-2 whitespace-nowrap";
    
    switch (alert.priority) {
      case 'critical':
        return `${baseClasses} bg-red-600 text-white border border-red-500`;
      case 'high':
        return `${baseClasses} bg-orange-500 text-white border border-orange-400`;
      case 'medium':
        return `${baseClasses} bg-yellow-500 text-black border border-yellow-400`;
      case 'low':
        return `${baseClasses} bg-blue-500 text-white border border-blue-400`;
      case 'error':
        return `${baseClasses} bg-gray-500 text-white border border-gray-400`;
      default:
        return `${baseClasses} bg-blue-500 text-white border border-blue-400`;
    }
  };

  // 경보 아이콘 결정
  const getAlertIcon = (alert) => {
    if (alert.type === 'critical' || alert.type === 'warning') {
      return <AlertTriangle className="w-4 h-4 animate-pulse" />;
    }
    return <Info className="w-4 h-4" />;
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
    <div className={`bg-gradient-to-r from-slate-800 via-blue-800 to-indigo-800 border-b border-blue-400/30 shadow-lg ${className}`}>
      <div className="relative overflow-hidden">
        {/* 배경 패턴 */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
        
        {/* 티커 헤더 */}
        <div className="flex items-center justify-between px-4 py-2 bg-black/20 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-white font-semibold text-sm">🚨 기상 경보</span>
            </div>
            <span className="text-blue-200 text-xs">
              {loading ? 'Loading...' : `${displayAlerts.length}건 • NEA Singapore`}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="text-white/70 hover:text-white transition-colors p-1 rounded"
              title="새로고침"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={togglePause}
              className="text-white/70 hover:text-white transition-colors px-2 py-1 text-xs rounded bg-white/10"
              title={isPaused ? "재생" : "일시정지"}
            >
              {isPaused ? '▶️' : '⏸️'}
            </button>
            <button
              onClick={toggleVisibility}
              className="text-white/70 hover:text-white transition-colors p-1 rounded"
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
              <div className="flex items-center gap-2 text-white">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="text-sm">기상 정보 업데이트 중...</span>
              </div>
            </div>
          ) : (
            <div 
              ref={tickerRef}
              className={`flex items-center h-full ${isPaused ? '' : 'animate-scroll-left'}`}
              style={{
                animationDuration: `${Math.max(30, displayAlerts.length * 8)}s`,
                animationPlayState: isPaused ? 'paused' : 'running'
              }}
            >
              {displayAlerts.map((alert, index) => (
                <div key={`${alert.timestamp}-${index}`} className={getAlertStyle(alert)}>
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
              
              {/* 무한 스크롤을 위한 복제 */}
              {displayAlerts.map((alert, index) => (
                <div key={`duplicate-${alert.timestamp}-${index}`} className={getAlertStyle(alert)}>
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