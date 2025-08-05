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
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between gap-4">
        
        {/* Status Info */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {isOnline ? (
              <Wifi className="w-4 h-4 text-green-600" />
            ) : (
              <WifiOff className="w-4 h-4 text-red-600" />
            )}
            
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-700">
                {formatLastUpdate()}
              </span>
            </div>
          </div>

          {/* Data Freshness */}
          {dataFreshness && (
            <div className="flex items-center gap-1">
              <span className={`text-sm font-medium ${getDataStatusColor()}`}>
                {getDataStatusText()}
              </span>
              {dataFreshness.minutesOld > 0 && (
                <span className="text-xs text-gray-500">
                  ({dataFreshness.minutesOld}분 전 데이터)
                </span>
              )}
            </div>
          )}

          {/* Update Count */}
          {updateCount > 0 && (
            <span className="text-xs text-gray-500 hidden sm:inline">
              업데이트 #{updateCount}
            </span>
          )}
        </div>

        {/* Refresh Button */}
        <div className="flex items-center gap-2">
          {/* Success Indicator */}
          {showSuccess && (
            <div className="flex items-center gap-1 text-green-600 text-sm animate-fade-in">
              <CheckCircle className="w-4 h-4" />
              <span className="hidden sm:inline">업데이트 완료</span>
            </div>
          )}

          {/* Error Indicator */}
          {updateError && (
            <div className="flex items-center gap-1 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span className="hidden sm:inline">오류 발생</span>
            </div>
          )}

          {/* Main Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={!isOnline || isUpdating}
            className={`
              px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center gap-2
              ${!isOnline || isUpdating 
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
              }
              ${showSuccess ? 'bg-green-600 hover:bg-green-700' : ''}
            `}
            title={!isOnline ? '네트워크 연결 필요' : isUpdating ? '업데이트 중...' : '최신 날씨 정보 가져오기'}
          >
            <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
            <span>
              {isUpdating ? '업데이트 중...' : '최신 정보'}
            </span>
          </button>
        </div>
      </div>

      {/* Error Message */}
      {updateError && (
        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium">업데이트 실패</div>
              <div className="text-red-600">{updateError}</div>
              <div className="text-red-500 mt-1">
                네트워크 연결을 확인하고 다시 시도해주세요.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stale Data Warning */}
      {dataFreshness?.isVeryStale && (
        <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-800">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium">데이터가 오래되었습니다</div>
              <div>
                {dataFreshness.minutesOld}분 전 데이터를 표시하고 있습니다. 
                최신 정보를 보려면 새로고침 버튼을 클릭하세요.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Usage Instructions */}
      <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm text-blue-800">
        <div className="font-medium mb-1">📱 사용법:</div>
        <ul className="text-blue-700 space-y-1">
          <li>• <strong>새로고침 버튼</strong>을 클릭하면 최신 날씨 정보를 가져옵니다</li>
          <li>• <strong>브라우저 새로고침</strong>을 하면 페이지 로드 시 자동으로 최신 정보를 확인합니다</li>
          <li>• 자동 업데이트는 없으며, 필요할 때만 수동으로 새로고침하세요</li>
        </ul>
      </div>
    </div>
  );
};

export default OnDemandRefreshButton;