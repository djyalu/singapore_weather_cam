import React, { useState, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { RefreshCw, Zap, Wifi, WifiOff, Clock } from 'lucide-react';
import { announceToScreenReader } from '../../utils/accessibility.js';
import { Button } from '@/components/ui/button';

/**
 * 독립적인 새로고침 버튼 컴포넌트
 * 실시간 데이터 새로고침 기능과 상태 표시를 포함
 */
const RefreshButton = React.memo(({
  onRefresh, // 이제 실시간 새로고침으로 사용
  onForceRefresh, // 호환성을 위해 유지하지만 사용 안 함
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

  // 실시간 새로고침 핸들러 - 모바일 최적화 및 강화된 피드백
  const handleRefresh = useCallback(async () => {
    if (!onRefresh || isRefreshing || disabled || !isOnline) {
      console.warn('🚫 새로고침 취소:', { isRefreshing, disabled, isOnline });
      return;
    }

    try {
      console.log('🔄 [RefreshButton] 실시간 NEA API 새로고침 시작');
      setRefreshCount(prev => prev + 1);
      announceToScreenReader('실시간 NEA 데이터 새로고침 시작', 'polite');
      
      // 햅틱 피드백 (모바일)
      if (navigator.vibrate) {
        navigator.vibrate(50); // 50ms 진동
      }
      
      const startTime = Date.now();
      await onRefresh();
      const duration = Date.now() - startTime;
      
      console.log(`✅ [RefreshButton] 실시간 새로고침 완료 (${duration}ms)`);
      announceToScreenReader('실시간 NEA 데이터 새로고침 완료', 'polite');
      
      // 성공 햅틱 피드백 (모바일)
      if (navigator.vibrate) {
        navigator.vibrate([30, 100, 30]); // 성공 패턴
      }
    } catch (error) {
      console.error('❌ [RefreshButton] 새로고침 실패:', error);
      announceToScreenReader('새로고침 실패 - 네트워크를 확인해주세요', 'assertive');
      
      // 실패 햅틱 피드백 (모바일)
      if (navigator.vibrate) {
        navigator.vibrate([100, 50, 100, 50, 100]); // 실패 패턴
      }
    }
  }, [onRefresh, isRefreshing, disabled, isOnline]);

  // 마지막 업데이트 시간 포맷팅
  const formatLastUpdate = useCallback((date) => {
    if (!date) {return null;}

    try {
      const now = new Date();
      const updateTime = new Date(date);
      const diffMinutes = Math.floor((now - updateTime) / (1000 * 60));

      if (diffMinutes < 1) {return '방금 전';}
      if (diffMinutes < 60) {return `${diffMinutes}분 전`;}

      const diffHours = Math.floor(diffMinutes / 60);
      if (diffHours < 24) {return `${diffHours}시간 전`;}

      return updateTime.toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return null;
    }
  }, []);

  // 키보드 내비게이션
  const handleKeyDown = useCallback((event) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
        event.preventDefault();
        handleRefresh();
        break;
      default:
        break;
    }
  }, [handleRefresh]);

  // variant별 스타일 정의
  const getVariantStyles = () => {
    switch (variant) {
      case 'compact':
        return {
          container: 'flex items-center gap-1',
          button: 'px-2 py-1 text-xs min-h-[32px] min-w-[32px]',
          icon: 'w-3 h-3',
          text: 'hidden',
        };
      case 'hero':
        return {
          container: 'flex items-center gap-3',
          button: 'px-6 py-3 text-sm font-medium min-h-[48px] min-w-[120px]',
          icon: 'w-5 h-5 mr-2',
          text: 'inline',
        };
      default:
        return {
          container: 'flex items-center gap-2',
          button: 'px-4 py-3 text-sm font-semibold min-h-[48px] min-w-[48px] rounded-2xl backdrop-blur-md border shadow-lg hover:shadow-xl transition-all duration-300',
          icon: 'w-5 h-5 sm:w-4 sm:h-4',
          text: 'hidden sm:inline',
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

      {/* 실시간 새로고침 버튼 (shadcn/ui Button 사용) */}
      {onRefresh && (
        <Button
          ref={refreshButtonRef}
          onClick={handleRefresh}
          onKeyDown={handleKeyDown}
          disabled={!canRefresh}
          variant={variant === 'glass' ? 'ghost' : 'secondary'}
          size={variant === 'compact' ? 'sm' : 'default'}
          className={`
            ${styles.button}
            ${variant === 'glass'
          ? 'bg-gradient-to-r from-blue-500/30 to-indigo-600/30 backdrop-blur-lg border-2 border-blue-400/40 text-white hover:from-blue-400/40 hover:to-indigo-500/40 hover:border-indigo-400/60 shadow-xl'
          : 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-400 hover:to-indigo-500 border-2 border-blue-400/50 shadow-xl hover:shadow-blue-500/25'
        }
            transition-all duration-500 transform font-bold
            hover:scale-110 active:scale-95 touch-manipulation
            disabled:hover:scale-100 disabled:opacity-50
            group relative overflow-hidden
          `}
          title={
            !isOnline
              ? '오프라인 상태에서는 새로고침할 수 없습니다'
              : isRefreshing
                ? '실시간 데이터 새로고침 중...'
                : '실시간 데이터 새로고침 (NEA API 직접 호출)'
          }
          aria-label={
            isRefreshing
              ? '실시간 데이터 새로고침 중'
              : '실시간 데이터 새로고침'
          }
          aria-describedby="refresh-help"
        >
          {/* 버튼 내부 글로우 효과 */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

          <Zap
            className={`
              ${styles.icon} transition-all duration-500 relative z-10
              ${isRefreshing ? 'animate-spin text-yellow-300' : 'group-hover:text-yellow-200'}
              filter group-hover:drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]
            `}
            aria-hidden="true"
          />
          <span className={`${styles.text} relative z-10`}>새로고침</span>

          {/* 스크린 리더용 설명 */}
          <span id="refresh-help" className="sr-only">
            {!isOnline
              ? '오프라인 상태에서는 새로고침할 수 없습니다'
              : isRefreshing
                ? '현재 실시간 데이터를 새로고침하고 있습니다'
                : 'NEA Singapore API에서 실시간 최신 데이터를 가져옵니다'
            }
          </span>
        </Button>
      )}

      {/* 새로고침 피드백 (variant에 따라) */}
      {isRefreshing && variant === 'hero' && (
        <div className="flex items-center gap-2 text-sm text-green-600 animate-fade-in">
          <Zap className="w-4 h-4 animate-pulse" aria-hidden="true" />
          <span>실시간 데이터 업데이트 중...</span>
        </div>
      )}

      {/* 실시간 상태 알림 (스크린 리더용) */}
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {isRefreshing && '실시간 데이터를 새로고침하고 있습니다'}
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
    PropTypes.instanceOf(Date),
  ]),
  variant: PropTypes.oneOf(['default', 'compact', 'hero']),
  showStatus: PropTypes.bool,
  showTimer: PropTypes.bool,
  className: PropTypes.string,
  disabled: PropTypes.bool,
};

RefreshButton.displayName = 'RefreshButton';

export default RefreshButton;