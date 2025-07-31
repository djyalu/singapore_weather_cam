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
    <div className="bg-gray-50 border-b border-gray-200 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* 업데이트 시간만 간단히 표시 */}
        <div className="flex items-center text-xs text-gray-600">
          <Clock className="w-3 h-3 mr-1" />
          <span>
            {timeSinceUpdate ? `업데이트: ${timeSinceUpdate}` : '데이터 로딩 중'}
          </span>
        </div>

        {/* 중요한 에러만 표시 */}
        {shouldShowError && (
          <div className="flex items-center text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
            <AlertTriangle className="w-3 h-3 mr-1" />
            <span>
              {!isOnline ? '오프라인' : '시스템 오류'}
            </span>
          </div>
        )}

        {/* 새로고침 중일 때만 표시 */}
        {isRefreshing && (
          <div className="flex items-center text-xs text-blue-600">
            <div className="animate-spin rounded-full h-3 w-3 border border-blue-300 border-t-blue-600 mr-1"></div>
            <span>업데이트 중</span>
          </div>
        )}
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