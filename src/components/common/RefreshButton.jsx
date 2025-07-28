import React, { useState, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { RefreshCw, Zap, Wifi, WifiOff, Clock } from 'lucide-react';
import { announceToScreenReader } from '../../utils/accessibility.js';

/**
 * 독립적인 새로고침 버튼 컴포넌트
 * 일반/강제 새로고침 기능과 상태 표시를 포함
 */
const RefreshButton = React.memo(({
  onRefresh,
  onForceRefresh,
  isRefreshing = false,
  isOnline = true,
  lastUpdate = null,
  variant = 'default', // 'default', 'compact', 'hero'
  showStatus = true,
  showTimer = false,
  className = '',
  disabled = false,
}) => {
  const [lastRefreshTime, setLastRefreshTime] = useState(null);
  const [refreshCount, setRefreshCount] = useState(0);
  const refreshButtonRef = useRef(null);
  const forceRefreshButtonRef = useRef(null);

  // 새로고침 완료 시 시간 업데이트
  useEffect(() => {
    if (!isRefreshing && refreshCount > 0) {
      setLastRefreshTime(new Date());
    }
  }, [isRefreshing, refreshCount]);

  // 일반 새로고침 핸들러
  const handleRefresh = useCallback(async () => {
    if (!onRefresh || isRefreshing || disabled || !isOnline) return;

    try {
      setRefreshCount(prev => prev + 1);
      announceToScreenReader('데이터 새로고침 시작', 'polite');
      await onRefresh();
      announceToScreenReader('데이터 새로고침 완료', 'polite');
    } catch (error) {
      announceToScreenReader('새로고침 실패', 'assertive');
      console.error('Refresh failed:', error);
    }
  }, [onRefresh, isRefreshing, disabled, isOnline]);

  // 강제 새로고침 핸들러
  const handleForceRefresh = useCallback(async () => {
    if (!onForceRefresh || isRefreshing || disabled || !isOnline) return;

    try {
      setRefreshCount(prev => prev + 1);
      announceToScreenReader('강제 새로고침 시작', 'polite');
      await onForceRefresh();
      announceToScreenReader('강제 새로고침 완료', 'polite');
    } catch (error) {
      announceToScreenReader('강제 새로고침 실패', 'assertive');
      console.error('Force refresh failed:', error);
    }
  }, [onForceRefresh, isRefreshing, disabled, isOnline]);

  // 마지막 업데이트 시간 포맷팅
  const formatLastUpdate = useCallback((date) => {
    if (!date) return null;
    
    try {
      const now = new Date();
      const updateTime = new Date(date);
      const diffMinutes = Math.floor((now - updateTime) / (1000 * 60));
      
      if (diffMinutes < 1) return '방금 전';
      if (diffMinutes < 60) return `${diffMinutes}분 전`;
      
      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) return `${diffHours}시간 전`;
      
      return updateTime.toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return null;
    }
  }, []);

  // 키보드 내비게이션
  const handleKeyDown = useCallback((event, isForceButton = false) => {
    switch (event.key) {
      case 'ArrowRight':
      case 'Tab':
        if (!isForceButton && forceRefreshButtonRef.current) {
          event.preventDefault();
          forceRefreshButtonRef.current.focus();
        }
        break;
      case 'ArrowLeft':
        if (isForceButton && refreshButtonRef.current) {
          event.preventDefault();
          refreshButtonRef.current.focus();
        }
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (isForceButton) {
          handleForceRefresh();
        } else {
          handleRefresh();
        }
        break;
      default:
        break;
    }
  }, [handleRefresh, handleForceRefresh]);

  // variant별 스타일 정의
  const getVariantStyles = () => {
    switch (variant) {
      case 'compact':
        return {
          container: 'flex items-center gap-1',
          button: 'px-2 py-1 text-xs min-h-[32px] min-w-[32px]',
          icon: 'w-3 h-3',
          text: 'hidden'
        };
      case 'hero':
        return {
          container: 'flex items-center gap-3',
          button: 'px-6 py-3 text-sm font-medium min-h-[48px] min-w-[120px]',
          icon: 'w-5 h-5 mr-2',
          text: 'inline'
        };
      default:
        return {
          container: 'flex items-center gap-2',
          button: 'px-3 py-2 text-xs font-medium min-h-[44px] min-w-[44px] sm:min-h-auto sm:min-w-auto',
          icon: 'w-4 h-4 sm:w-3 sm:h-3',
          text: 'hidden sm:inline'
        };
    }
  };

  const styles = getVariantStyles();
  const lastUpdateFormatted = formatLastUpdate(lastUpdate || lastRefreshTime);
  const canRefresh = !isRefreshing && !disabled && isOnline;

  return (
    <div className={`${styles.container} ${className}`}>
      {/* 상태 표시 (variant에 따라) */}
      {showStatus && variant !== 'compact' && (
        <div className="flex items-center gap-2 text-xs text-gray-500">
          {isOnline ? (
            <Wifi className="w-3 h-3 text-green-500" aria-hidden="true" />
          ) : (
            <WifiOff className="w-3 h-3 text-red-500" aria-hidden="true" />
          )}
          {showTimer && lastUpdateFormatted && (
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" aria-hidden="true" />
              <span>{lastUpdateFormatted}</span>
            </div>
          )}
        </div>
      )}

      {/* 일반 새로고침 버튼 */}
      {onRefresh && (
        <button
          ref={refreshButtonRef}
          onClick={handleRefresh}
          onKeyDown={(e) => handleKeyDown(e, false)}
          disabled={!canRefresh}
          className={`
            flex items-center justify-center ${styles.button}
            text-blue-600 bg-blue-50 hover:bg-blue-100
            disabled:opacity-50 disabled:cursor-not-allowed
            rounded-lg transition-all duration-200
            hover:scale-105 active:scale-95 touch-manipulation
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
            disabled:focus:ring-0 disabled:hover:scale-100
          `}
          title={
            !isOnline 
              ? '오프라인 상태에서는 새로고침할 수 없습니다'
              : isRefreshing 
                ? '새로고침 중...' 
                : '데이터 새로고침 (캐시 활용)'
          }
          aria-label={
            isRefreshing 
              ? '데이터 새로고침 중' 
              : '데이터 새로고침'
          }
          aria-describedby="refresh-help"
        >
          <RefreshCw
            className={`
              ${styles.icon} transition-transform duration-200
              ${isRefreshing ? 'animate-spin' : ''}
            `}
            aria-hidden="true"
          />
          <span className={styles.text}>새로고침</span>
          
          {/* 스크린 리더용 설명 */}
          <span id="refresh-help" className="sr-only">
            {!isOnline 
              ? '오프라인 상태에서는 새로고침할 수 없습니다'
              : isRefreshing 
                ? '현재 데이터를 새로고침하고 있습니다' 
                : '캐시된 데이터를 활용하여 빠르게 새로고침합니다'
            }
          </span>
        </button>
      )}

      {/* 강제 새로고침 버튼 */}
      {onForceRefresh && (
        <button
          ref={forceRefreshButtonRef}
          onClick={handleForceRefresh}
          onKeyDown={(e) => handleKeyDown(e, true)}
          disabled={!canRefresh}
          className={`
            flex items-center justify-center ${styles.button}
            text-orange-600 bg-orange-50 hover:bg-orange-100
            disabled:opacity-50 disabled:cursor-not-allowed
            rounded-lg transition-all duration-200
            hover:scale-105 active:scale-95 touch-manipulation
            focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
            disabled:focus:ring-0 disabled:hover:scale-100
          `}
          title={
            !isOnline 
              ? '오프라인 상태에서는 강제 새로고침할 수 없습니다'
              : isRefreshing 
                ? '강제 새로고침 중...' 
                : '강제 새로고침 (서버에서 최신 데이터)'
          }
          aria-label={
            isRefreshing 
              ? '강제 새로고침 중' 
              : '강제 새로고침'
          }
          aria-describedby="force-refresh-help"
        >
          <Zap
            className={`
              ${styles.icon} transition-transform duration-200
              ${isRefreshing ? 'animate-pulse' : ''}
            `}
            aria-hidden="true"
          />
          <span className={styles.text}>강제</span>
          
          {/* 스크린 리더용 설명 */}
          <span id="force-refresh-help" className="sr-only">
            {!isOnline 
              ? '오프라인 상태에서는 강제 새로고침할 수 없습니다'
              : isRefreshing 
                ? '현재 서버에서 최신 데이터를 가져오고 있습니다' 
                : '캐시를 무시하고 서버에서 최신 데이터를 가져옵니다'
            }
          </span>
        </button>
      )}

      {/* 새로고침 피드백 (variant에 따라) */}
      {isRefreshing && variant === 'hero' && (
        <div className="flex items-center gap-2 text-sm text-blue-600 animate-fade-in">
          <RefreshCw className="w-4 h-4 animate-spin" aria-hidden="true" />
          <span>데이터 업데이트 중...</span>
        </div>
      )}

      {/* 실시간 상태 알림 (스크린 리더용) */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
      >
        {isRefreshing && '데이터를 새로고침하고 있습니다'}
      </div>
    </div>
  );
});

RefreshButton.propTypes = {
  onRefresh: PropTypes.func,
  onForceRefresh: PropTypes.func,
  isRefreshing: PropTypes.bool,
  isOnline: PropTypes.bool,
  lastUpdate: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.instanceOf(Date)
  ]),
  variant: PropTypes.oneOf(['default', 'compact', 'hero']),
  showStatus: PropTypes.bool,
  showTimer: PropTypes.bool,
  className: PropTypes.string,
  disabled: PropTypes.bool,
};

RefreshButton.displayName = 'RefreshButton';

export default RefreshButton;