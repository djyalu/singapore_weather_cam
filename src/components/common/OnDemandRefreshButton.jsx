/**
 * On-Demand Refresh Button Component
 * Simple button that fetches latest data only when clicked
 * No automatic updates or streaming
 */

import React, { useState, useEffect } from 'react';
import { RefreshCw, Clock, Wifi, WifiOff, AlertCircle, CheckCircle } from 'lucide-react';

const OnDemandRefreshButton = ({ 
  onRefresh, 
  isUpdating, 
  updateError, 
  lastUpdateTime,
  dataFreshness,
  updateCount = 0
}) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showSuccess, setShowSuccess] = useState(false);

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

  // Show success indicator briefly after successful update
  useEffect(() => {
    if (lastUpdateTime && !isUpdating && !updateError) {
      setShowSuccess(true);
      const timer = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [lastUpdateTime, isUpdating, updateError]);

  const handleRefresh = async () => {
    if (!isOnline || isUpdating) return;
    
    console.log('👆 사용자가 새로고침 버튼 클릭');
    await onRefresh();
  };

  const formatLastUpdate = () => {
    if (!lastUpdateTime) return '업데이트한 적 없음';
    
    const now = new Date();
    const diffMinutes = Math.floor((now - lastUpdateTime) / (1000 * 60));
    
    if (diffMinutes < 1) return '방금 전';
    if (diffMinutes < 60) return `${diffMinutes}분 전`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}시간 전`;
    
    return lastUpdateTime.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getDataStatusColor = () => {
    if (!dataFreshness) return 'text-gray-500';
    if (dataFreshness.isVeryStale) return 'text-red-600';
    if (dataFreshness.isStale) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getDataStatusText = () => {
    if (!dataFreshness) return '상태 확인 중';
    if (dataFreshness.isVeryStale) return '매우 오래됨';
    if (dataFreshness.isStale) return '다소 오래됨';
    return '최신';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        
        {/* Compact Status Info */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          {isOnline ? (
            <Wifi className="w-4 h-4 text-green-600" />
          ) : (
            <WifiOff className="w-4 h-4 text-red-600" />
          )}
          
          <span>{formatLastUpdate()}</span>
          
          {dataFreshness && (
            <span className={`font-medium ${getDataStatusColor()}`}>
              ({getDataStatusText()})
            </span>
          )}
        </div>

        {/* Compact Refresh Button */}
        <button
          onClick={handleRefresh}
          disabled={!isOnline || isUpdating}
          className={`
            px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-1.5
            ${!isOnline || isUpdating 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
            }
            ${showSuccess ? 'bg-green-600 hover:bg-green-700' : ''}
          `}
          title={!isOnline ? '네트워크 연결 필요' : isUpdating ? '업데이트 중...' : '최신 날씨 정보 가져오기'}
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
          <span>
            {isUpdating ? '업데이트 중' : '새로고침'}
          </span>
        </button>
      </div>

      {/* Compact Error Message */}
      {updateError && (
        <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
          <div className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            <span>업데이트 실패: 네트워크를 확인하고 다시 시도하세요</span>
          </div>
        </div>
      )}

      {/* Very Stale Data Warning Only */}
      {dataFreshness?.isVeryStale && (
        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
          <div className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            <span>데이터가 {dataFreshness.minutesOld}분 전 것입니다. 새로고침을 권장합니다.</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default OnDemandRefreshButton;