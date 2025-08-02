import React from 'react';
import { formatDateSafely } from '../common/SafeDateFormatter';
import { getLocalizedString } from '../../config/localization';

/**
 * 실시간 데이터 상태 표시 컴포넌트
 * 사용자에게 자동 업데이트 상태를 명확하게 알려줍니다
 */
const LiveDataIndicator = React.memo(({ lastUpdate, isConnected = true, dataAge = null }) => {
  const now = new Date();
  const updateTime = typeof lastUpdate === 'string' ? new Date(lastUpdate) : lastUpdate;
  const timeDiff = updateTime ? Math.floor((now - updateTime) / 1000) : null;

  // 데이터 신선도 판단
  const getDataStatus = () => {
    if (!timeDiff) {return 'unknown';}
    if (timeDiff < 60) {return 'live';} // 1분 이내
    if (timeDiff < 300) {return 'recent';} // 5분 이내
    if (timeDiff < 900) {return 'stale';} // 15분 이내
    return 'old'; // 15분 초과
  };

  const dataStatus = getDataStatus();

  const getStatusColor = () => {
    if (!isConnected) {return 'text-red-500';}

    switch (dataStatus) {
      case 'live':
        return 'text-green-500';
      case 'recent':
        return 'text-blue-500';
      case 'stale':
        return 'text-yellow-500';
      case 'old':
        return 'text-orange-500';
      default:
        return 'text-gray-500';
    }
  };

  const getStatusIcon = () => {
    if (!isConnected) {return '⚠️';}

    switch (dataStatus) {
      case 'live':
        return '🟢';
      case 'recent':
        return '🔵';
      case 'stale':
        return '🟡';
      case 'old':
        return '🟠';
      default:
        return '⚪';
    }
  };

  const getStatusText = () => {
    if (!isConnected) {return '연결 끊김';}

    switch (dataStatus) {
      case 'live':
        return '실시간';
      case 'recent':
        return '최신';
      case 'stale':
        return '지연됨';
      case 'old':
        return '오래됨';
      default:
        return '알 수 없음';
    }
  };

  const formatTimeAgo = () => {
    if (!timeDiff) {return '';}

    if (timeDiff < 60) {return `${timeDiff}초 전`;}
    if (timeDiff < 3600) {return `${Math.floor(timeDiff / 60)}분 전`;}
    return `${Math.floor(timeDiff / 3600)}시간 전`;
  };

  return (
    <div className="flex items-center gap-2 text-xs">
      {/* 상태 인디케이터 */}
      <div className="flex items-center gap-1">
        <span className={`${dataStatus === 'live' ? 'animate-pulse' : ''}`}>
          {getStatusIcon()}
        </span>
        <span className={`font-medium ${getStatusColor()}`}>
          {getStatusText()}
        </span>
      </div>

      {/* 시간 정보 */}
      {timeDiff !== null && (
        <div className="text-gray-500 border-l border-gray-300 pl-2">
          {formatTimeAgo()}
        </div>
      )}

      {/* 마지막 업데이트 시간 */}
      {lastUpdate && (
        <div className="text-gray-400 border-l border-gray-300 pl-2">
          {formatDateSafely(lastUpdate, { format: 'time' })}
        </div>
      )}
    </div>
  );
});

LiveDataIndicator.displayName = 'LiveDataIndicator';

export default LiveDataIndicator;