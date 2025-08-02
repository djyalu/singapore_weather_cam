/**
 * SystemStatus Component
 * Ultra-minimal system status indicator - shows only essential information
 * Simplified to reduce UI complexity and improve user experience
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Clock, AlertTriangle } from 'lucide-react';

const SystemStatus = React.memo(({
  lastFetch = null,
  error = null,
  isRefreshing = false,
  isLoading = false,
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

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

  // Calculate time since last update
  const getTimeSinceUpdate = () => {
    if (!lastFetch) return null;

    const now = new Date();
    const diffMinutes = Math.floor((now - lastFetch) / (1000 * 60));

    if (diffMinutes < 1) return '방금 전';
    if (diffMinutes < 60) return `${diffMinutes}분 전`;

    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}시간 전`;
    
    return lastFetch.toLocaleDateString('ko-KR', {
      timeZone: 'Asia/Singapore',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const timeSinceUpdate = getTimeSinceUpdate();

  // 로딩 중이면 아무것도 표시하지 않음
  if (isLoading) {
    return null;
  }

  // 치명적인 오류만 표시 (네트워크 오프라인, 심각한 에러)
  const shouldShowError = error && (!isOnline || error.severity === 'critical');

  return (
    <div className="bg-gray-50 border-b border-gray-200 px-2 sm:px-4 py-1 sm:py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* 업데이트 시간 - 모바일 최적화 */}
        <div className="flex items-center text-xs sm:text-sm text-gray-600 min-w-0 flex-1">
          <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2 flex-shrink-0" />
          <span className="truncate">
            {timeSinceUpdate ? (
              <>
                <span className="hidden sm:inline">업데이트: </span>
                <span className="sm:hidden">업데이트 </span>
                {timeSinceUpdate}
              </>
            ) : (
              '데이터 로딩 중'
            )}
          </span>
        </div>

        {/* 상태 표시 영역 - 모바일 최적화 */}
        <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0">
          {/* 중요한 에러만 표시 */}
          {shouldShowError && (
            <div className="flex items-center text-xs sm:text-sm text-red-600 bg-red-50 px-2 sm:px-3 py-1 rounded-full">
              <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 mr-1 flex-shrink-0" />
              <span className="hidden sm:inline">
                {!isOnline ? '오프라인' : '시스템 오류'}
              </span>
              <span className="sm:hidden">⚠️</span>
            </div>
          )}

          {/* 새로고침 중일 때만 표시 */}
          {isRefreshing && (
            <div className="flex items-center text-xs sm:text-sm text-blue-600 bg-blue-50 px-2 sm:px-3 py-1 rounded-full">
              <div className="animate-spin rounded-full h-3 w-3 sm:h-4 sm:w-4 border border-blue-300 border-t-blue-600 mr-1 flex-shrink-0"></div>
              <span className="hidden xs:inline">업데이트 중</span>
              <span className="xs:hidden">🔄</span>
            </div>
          )}

          {/* 온라인 상태 표시 */}
          {!shouldShowError && !isRefreshing && (
            <div className="flex items-center text-xs sm:text-sm text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-2"></div>
              <span className="hidden sm:inline">실시간</span>
              <span className="sm:hidden">●</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

SystemStatus.propTypes = {
  lastFetch: PropTypes.instanceOf(Date),
  error: PropTypes.object,
  isRefreshing: PropTypes.bool,
  isLoading: PropTypes.bool,
};

export default SystemStatus;