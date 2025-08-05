/**
 * Real-Time Indicator Component
 * Shows live streaming status and next update countdown
 */

import React, { useState, useEffect } from 'react';
import { Radio, RefreshCw, Wifi, WifiOff, Clock } from 'lucide-react';

const RealTimeIndicator = ({ 
  isStreaming, 
  lastUpdateTime, 
  nextUpdateIn, 
  updateCount, 
  onForceUpdate,
  streamHealth 
}) => {
  const [timeAgo, setTimeAgo] = useState('');
  const [countdownSeconds, setCountdownSeconds] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Update time ago every second
  useEffect(() => {
    const updateTimeAgo = () => {
      if (!lastUpdateTime) return;
      
      const now = new Date();
      const diffSeconds = Math.floor((now - lastUpdateTime) / 1000);
      
      if (diffSeconds < 60) {
        setTimeAgo(`${diffSeconds}초 전`);
      } else if (diffSeconds < 3600) {
        const minutes = Math.floor(diffSeconds / 60);
        setTimeAgo(`${minutes}분 전`);
      } else {
        setTimeAgo(lastUpdateTime.toLocaleTimeString('ko-KR', {
          hour: '2-digit',
          minute: '2-digit'
        }));
      }
    };

    updateTimeAgo();
    const interval = setInterval(updateTimeAgo, 1000);
    return () => clearInterval(interval);
  }, [lastUpdateTime]);

  // Update countdown every second
  useEffect(() => {
    if (!nextUpdateIn) return;
    
    const updateCountdown = () => {
      const seconds = Math.max(0, Math.floor(nextUpdateIn / 1000));
      setCountdownSeconds(seconds);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [nextUpdateIn]);

  // Monitor network status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const formatCountdown = (seconds) => {
    if (seconds <= 0) return '곧 업데이트';
    if (seconds < 60) return `${seconds}초 후`;
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusColor = () => {
    if (!isOnline) return 'text-red-600';
    if (!isStreaming) return 'text-gray-500';
    if (streamHealth?.isHealthy) return 'text-green-600';
    return 'text-yellow-600';
  };

  const getStatusText = () => {
    if (!isOnline) return '오프라인';
    if (!isStreaming) return '정지됨';
    if (streamHealth?.isHealthy) return '실시간';
    return '연결 중';
  };

  return (
    <div className="bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-lg px-3 py-2">
      <div className="flex items-center justify-between gap-3">
        
        {/* Live Status */}
        <div className="flex items-center gap-2 min-w-0">
          <div className="flex items-center gap-1.5">
            {isStreaming && streamHealth?.isHealthy ? (
              <Radio className="w-4 h-4 text-red-500 animate-pulse" />
            ) : (
              <RefreshCw className={`w-4 h-4 ${isStreaming ? 'animate-spin' : ''} ${getStatusColor()}`} />
            )}
            
            <span className={`text-sm font-medium ${getStatusColor()}`}>
              {getStatusText()}
            </span>
            
            {isStreaming && streamHealth?.isHealthy && (
              <span className="px-1.5 py-0.5 bg-red-100 text-red-700 text-xs rounded-full animate-pulse">
                LIVE
              </span>
            )}
          </div>

          {/* Network Status */}
          <div className="flex items-center gap-1">
            {isOnline ? (
              <Wifi className="w-3 h-3 text-green-600" />
            ) : (
              <WifiOff className="w-3 h-3 text-red-600" />
            )}
          </div>
        </div>

        {/* Update Info */}
        <div className="flex items-center gap-3 text-xs text-gray-600">
          {lastUpdateTime && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span className="whitespace-nowrap">{timeAgo}</span>
            </div>
          )}

          {isStreaming && countdownSeconds > 0 && (
            <div className="hidden sm:flex items-center gap-1">
              <span className="text-gray-500">다음:</span>
              <span className="font-mono text-blue-600">
                {formatCountdown(countdownSeconds)}
              </span>
            </div>
          )}

          {updateCount > 0 && (
            <div className="hidden md:flex items-center gap-1">
              <span className="text-gray-500">업데이트:</span>
              <span className="font-semibold text-green-600">#{updateCount}</span>
            </div>
          )}
        </div>

        {/* Force Update Button */}
        <button
          onClick={onForceUpdate}
          disabled={!isOnline}
          className="px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
          title="즉시 업데이트"
        >
          <RefreshCw className="w-3 h-3" />
          <span className="hidden sm:inline">새로고침</span>
        </button>
      </div>

      {/* Stream Health Info (when unhealthy) */}
      {streamHealth && !streamHealth.isHealthy && streamHealth.lastError && (
        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
          <div className="flex items-center gap-1">
            <span className="font-medium">연결 문제:</span>
            <span>{streamHealth.lastError}</span>
          </div>
          <div className="text-yellow-600 mt-1">
            자동으로 재연결을 시도하고 있습니다...
          </div>
        </div>
      )}

      {/* Detailed Stats (Development Mode) */}
      {process.env.NODE_ENV === 'development' && streamHealth && (
        <details className="mt-2">
          <summary className="text-xs text-gray-500 cursor-pointer">개발자 정보</summary>
          <div className="mt-1 p-2 bg-gray-50 rounded text-xs text-gray-600 font-mono">
            <div>스트림 상태: {isStreaming ? '활성' : '비활성'}</div>
            <div>업데이트 횟수: {updateCount}</div>
            <div>업데이트 간격: {streamHealth.updateFrequency}초</div>
            <div>마지막 업데이트: {lastUpdateTime?.toISOString()}</div>
            <div>다음 업데이트: {countdownSeconds}초 후</div>
            <div>네트워크: {isOnline ? '온라인' : '오프라인'}</div>
          </div>
        </details>
      )}
    </div>
  );
};

export default RealTimeIndicator;