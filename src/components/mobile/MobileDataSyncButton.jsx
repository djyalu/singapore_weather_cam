/**
 * 모바일 전용 데이터 동기화 버튼 컴포넌트
 * Mobile-optimized data sync button with real-time status feedback
 * 
 * 특징:
 * - 44px WCAG 2.1 AA 준수 터치 타겟
 * - 네트워크 상태별 시각적 피드백
 * - 배터리 효율적인 새로고침 제어
 * - iOS Safari 및 Android Chrome 최적화
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { RefreshCw, Wifi, WifiOff, Battery, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useMobileDataRefresh } from '../../hooks/useMobileDataRefresh';

const MobileDataSyncButton = ({ className = '', onRefreshComplete = null, showStatus = true }) => {
  const {
    isRefreshing,
    lastRefreshTime,
    refreshCount,
    networkType,
    error,
    forceRefreshMobile,
    getRefreshStatus,
    canRefresh,
    timeSinceLastRefresh
  } = useMobileDataRefresh();

  const [showDetailedStatus, setShowDetailedStatus] = useState(false);
  const [batteryLevel, setBatteryLevel] = useState(null);

  // 배터리 상태 감지 (지원되는 경우)
  useEffect(() => {
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        setBatteryLevel(Math.round(battery.level * 100));
        
        const updateBattery = () => {
          setBatteryLevel(Math.round(battery.level * 100));
        };
        
        battery.addEventListener('levelchange', updateBattery);
        return () => battery.removeEventListener('levelchange', updateBattery);
      }).catch(() => {
        console.log('Battery API not supported');
      });
    }
  }, []);

  // 새로고침 실행 핸들러
  const handleRefresh = async () => {
    if (!canRefresh) return;

    console.log('📱 Mobile sync button clicked');
    const success = await forceRefreshMobile();
    
    if (success && onRefreshComplete) {
      onRefreshComplete();
    }
  };

  // 상태별 아이콘 결정
  const getStatusIcon = () => {
    if (isRefreshing) {
      return <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />;
    }
    
    if (error) {
      return <AlertCircle className="w-5 h-5 text-red-600" />;
    }
    
    if (refreshCount > 0) {
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    }
    
    return <RefreshCw className="w-5 h-5 text-gray-600" />;
  };

  // 상태별 색상 클래스
  const getButtonColor = () => {
    if (isRefreshing) {
      return 'bg-blue-100 border-blue-300 text-blue-800';
    }
    
    if (error) {
      return 'bg-red-100 border-red-300 text-red-800';
    }
    
    if (refreshCount > 0) {
      return 'bg-green-100 border-green-300 text-green-800';
    }
    
    return 'bg-gray-100 border-gray-300 text-gray-800 hover:bg-gray-200';
  };

  // 네트워크 상태 아이콘
  const getNetworkIcon = () => {
    if (networkType === 'slow-2g' || networkType === '2g') {
      return <WifiOff className="w-3 h-3 text-orange-600" />;
    }
    return <Wifi className="w-3 h-3 text-green-600" />;
  };

  // 마지막 새로고침 시간 표시
  const getTimeDisplay = () => {
    if (!lastRefreshTime) return '업데이트 필요';
    
    if (timeSinceLastRefresh < 60) {
      return '방금 업데이트';
    } else if (timeSinceLastRefresh < 3600) {
      return `${Math.floor(timeSinceLastRefresh / 60)}분 전`;
    } else {
      return `${Math.floor(timeSinceLastRefresh / 3600)}시간 전`;
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {/* 메인 새로고침 버튼 */}
      <button
        onClick={handleRefresh}
        disabled={!canRefresh}
        className={`
          flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 
          min-h-[44px] min-w-[44px] touch-manipulation active:scale-95 
          transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
          ${getButtonColor()}
          ${!canRefresh ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        `}
        aria-label={isRefreshing ? '데이터 새로고침 중' : '실시간 데이터 새로고침'}
        title={`실시간 데이터 새로고침 (${networkType})`}
      >
        {getStatusIcon()}
        <span className="font-medium text-sm">
          {isRefreshing ? '새로고침 중...' : '데이터 새로고침'}
        </span>
      </button>

      {/* 상태 정보 표시 */}
      {showStatus && (
        <div className="flex items-center justify-between text-xs text-gray-600 px-2">
          <div className="flex items-center gap-1">
            {getNetworkIcon()}
            <span>{networkType.toUpperCase()}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{getTimeDisplay()}</span>
          </div>
          
          {batteryLevel !== null && (
            <div className="flex items-center gap-1">
              <Battery className="w-3 h-3" />
              <span>{batteryLevel}%</span>
            </div>
          )}
        </div>
      )}

      {/* 에러 메시지 */}
      {error && (
        <div className="text-xs text-red-600 bg-red-50 p-2 rounded border border-red-200">
          <div className="font-medium">새로고침 실패</div>
          <div className="opacity-75">{error}</div>
          <div className="mt-1 opacity-75">
            네트워크 상태를 확인하고 다시 시도해주세요.
          </div>
        </div>
      )}

      {/* 상세 상태 토글 버튼 */}
      <button
        onClick={() => setShowDetailedStatus(!showDetailedStatus)}
        className="text-xs text-gray-500 underline text-center py-1 touch-manipulation"
        aria-label="상세 상태 정보 토글"
      >
        {showDetailedStatus ? '상태 숨기기' : '상세 상태 보기'}
      </button>

      {/* 상세 상태 정보 */}
      {showDetailedStatus && (
        <div className="text-xs bg-gray-50 p-3 rounded border space-y-2">
          <div><strong>새로고침 횟수:</strong> {refreshCount}회</div>
          <div><strong>네트워크:</strong> {networkType}</div>
          {lastRefreshTime && (
            <div><strong>마지막 업데이트:</strong> {lastRefreshTime.toLocaleTimeString('ko-KR')}</div>
          )}
          <div><strong>상태:</strong> {getRefreshStatus().recommendedAction}</div>
          {batteryLevel && (
            <div><strong>배터리:</strong> {batteryLevel}%</div>
          )}
          
          <div className="mt-2 pt-2 border-t border-gray-200">
            <div className="text-gray-600">
              💡 <strong>팁:</strong> 배터리 절약을 위해 30분마다 자동 업데이트됩니다.
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

MobileDataSyncButton.propTypes = {
  className: PropTypes.string,
  onRefreshComplete: PropTypes.func,
  showStatus: PropTypes.bool,
};

export default MobileDataSyncButton;