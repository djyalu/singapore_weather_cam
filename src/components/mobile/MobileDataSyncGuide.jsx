/**
 * Mobile Data Sync Guide Component
 * Helps mobile users understand data refresh and provides manual sync options
 * Addresses mobile caching and real-time data display issues
 */

import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { 
  RefreshCw, 
  Smartphone, 
  Wifi, 
  WifiOff, 
  Clock, 
  Database,
  AlertCircle,
  CheckCircle,
  Info,
  Zap,
  Settings
} from 'lucide-react';
import { useMobileDataLoader } from '../../hooks/useMobileDataLoader';

const MobileDataSyncGuide = ({ className = '' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState('checking');
  const [lastActionTime, setLastActionTime] = useState(null);
  const [actionHistory, setActionHistory] = useState([]);

  const {
    weatherData,
    loading,
    error,
    isRefreshing,
    lastFetch,
    dataFreshness,
    mobileMetrics,
    actions: { refresh, forceRefresh, clearCaches },
    mobile: { networkInfo, isSlowConnection, dataSaverMode }
  } = useMobileDataLoader();

  // Mobile device detection
  const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isAndroid = /Android/.test(navigator.userAgent);

  // Data freshness assessment
  const assessDataFreshness = useCallback(() => {
    if (!lastFetch) return 'unknown';
    
    const now = new Date();
    const diffMinutes = Math.floor((now - lastFetch) / (1000 * 60));
    
    if (diffMinutes < 5) return 'fresh';
    if (diffMinutes < 30) return 'good';
    if (diffMinutes < 60) return 'stale';
    return 'very_stale';
  }, [lastFetch]);

  // Update sync status
  useEffect(() => {
    const freshness = assessDataFreshness();
    
    if (loading || isRefreshing) {
      setSyncStatus('syncing');
    } else if (error) {
      setSyncStatus('error');
    } else if (freshness === 'fresh' || freshness === 'good') {
      setSyncStatus('good');
    } else {
      setSyncStatus('needs_sync');
    }
  }, [loading, isRefreshing, error, assessDataFreshness]);

  // Action handlers with history tracking
  const trackAction = useCallback((action, result) => {
    const actionEntry = {
      action,
      result,
      timestamp: new Date().toISOString(),
      networkType: networkInfo?.effectiveType || 'unknown'
    };
    
    setActionHistory(prev => [actionEntry, ...prev.slice(0, 4)]); // Keep last 5 actions
    setLastActionTime(new Date());
  }, [networkInfo]);

  const handleRefresh = useCallback(async () => {
    try {
      await refresh();
      trackAction('refresh', 'success');
    } catch (error) {
      trackAction('refresh', 'failed');
    }
  }, [refresh, trackAction]);

  const handleForceRefresh = useCallback(async () => {
    try {
      await forceRefresh();
      trackAction('force_refresh', 'success');
    } catch (error) {
      trackAction('force_refresh', 'failed');
    }
  }, [forceRefresh, trackAction]);

  const handleClearCaches = useCallback(async () => {
    try {
      await clearCaches();
      trackAction('clear_cache', 'success');
      // Auto refresh after cache clear
      setTimeout(() => refresh(), 1000);
    } catch (error) {
      trackAction('clear_cache', 'failed');
    }
  }, [clearCaches, refresh, trackAction]);

  // Status icon and color
  const getStatusDisplay = () => {
    switch (syncStatus) {
      case 'syncing':
        return { icon: RefreshCw, color: 'text-blue-600', bg: 'bg-blue-50', label: '동기화 중' };
      case 'good':
        return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', label: '최신 데이터' };
      case 'needs_sync':
        return { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', label: '업데이트 필요' };
      case 'error':
        return { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', label: '동기화 오류' };
      default:
        return { icon: Info, color: 'text-gray-600', bg: 'bg-gray-50', label: '확인 중' };
    }
  };

  const statusDisplay = getStatusDisplay();
  const StatusIcon = statusDisplay.icon;

  if (!isMobileDevice) {
    return null; // Only show on mobile devices
  }

  return (
    <div className={`mobile-data-sync-guide ${className}`}>
      {/* Mobile Status Indicator */}
      <div className="bg-white border border-gray-200 rounded-lg shadow-sm mb-4">
        <div className="p-3 sm:p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className={`p-1.5 sm:p-2 rounded-full ${statusDisplay.bg}`}>
                <StatusIcon className={`w-4 h-4 sm:w-5 sm:h-5 ${statusDisplay.color} ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-sm sm:text-base font-medium text-gray-900">{statusDisplay.label}</h3>
                <p className="text-xs sm:text-sm text-gray-600 truncate">
                  {dataFreshness ? `마지막 업데이트: ${dataFreshness}` : '데이터 확인 중...'}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center justify-center w-8 h-8 sm:w-9 sm:h-9 rounded-md bg-gray-100 hover:bg-gray-200 transition-colors touch-manipulation active:scale-95"
              aria-label="모바일 동기화 옵션"
            >
              <Settings className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Quick Actions Row */}
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 text-blue-700 rounded-md text-xs sm:text-sm font-medium hover:bg-blue-200 transition-colors touch-manipulation active:scale-95 disabled:opacity-50"
            >
              <RefreshCw className={`w-3 h-3 sm:w-4 sm:h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              새로고침
            </button>

            {syncStatus === 'error' || syncStatus === 'needs_sync' ? (
              <button
                onClick={handleForceRefresh}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-100 text-orange-700 rounded-md text-xs sm:text-sm font-medium hover:bg-orange-200 transition-colors touch-manipulation active:scale-95"
              >
                <Zap className="w-3 h-3 sm:w-4 sm:h-4" />
                강제 새로고침
              </button>
            ) : null}
          </div>
        </div>

        {/* Expanded Options */}
        {isOpen && (
          <div className="border-t border-gray-200 p-3 sm:p-4 bg-gray-50">
            <div className="space-y-4">
              {/* Mobile Device Info */}
              <div className="bg-white rounded-lg p-3 border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <Smartphone className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">모바일 환경</span>
                </div>
                <div className="space-y-1 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>기기:</span>
                    <span>{isIOS ? 'iOS' : isAndroid ? 'Android' : 'Mobile'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>네트워크:</span>
                    <span>{networkInfo?.effectiveType || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>데이터 절약:</span>
                    <span>{dataSaverMode ? '활성화' : '비활성화'}</span>
                  </div>
                </div>
              </div>

              {/* Data Status */}
              <div className="bg-white rounded-lg p-3 border border-gray-100">
                <div className="flex items-center gap-2 mb-2">
                  <Database className="w-4 h-4 text-gray-600" />
                  <span className="text-sm font-medium text-gray-900">데이터 상태</span>
                </div>
                <div className="space-y-1 text-xs text-gray-600">
                  <div className="flex justify-between">
                    <span>온도 데이터:</span>
                    <span>{weatherData?.current?.temperature || 'N/A'}°C</span>
                  </div>
                  <div className="flex justify-between">
                    <span>캐시 클리어:</span>
                    <span>{mobileMetrics.cacheClears}회</span>
                  </div>
                  <div className="flex justify-between">
                    <span>강제 새로고침:</span>
                    <span>{mobileMetrics.forcedRefreshes}회</span>
                  </div>
                </div>
              </div>

              {/* Advanced Actions */}
              <div className="space-y-2">
                <button
                  onClick={handleClearCaches}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-100 text-red-700 rounded-md text-sm font-medium hover:bg-red-200 transition-colors touch-manipulation active:scale-95"
                >
                  <Database className="w-4 h-4" />
                  캐시 완전 삭제 후 새로고침
                </button>

                <button
                  onClick={() => window.location.reload()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-md text-sm font-medium hover:bg-gray-200 transition-colors touch-manipulation active:scale-95"
                >
                  <RefreshCw className="w-4 h-4" />
                  페이지 완전 새로고침
                </button>
              </div>

              {/* Action History */}
              {actionHistory.length > 0 && (
                <div className="bg-white rounded-lg p-3 border border-gray-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-gray-600" />
                    <span className="text-sm font-medium text-gray-900">최근 액션</span>
                  </div>
                  <div className="space-y-1">
                    {actionHistory.slice(0, 3).map((action, index) => (
                      <div key={index} className="flex justify-between text-xs text-gray-600">
                        <span>{action.action}</span>
                        <span className={action.result === 'success' ? 'text-green-600' : 'text-red-600'}>
                          {action.result === 'success' ? '성공' : '실패'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Network Status */}
              <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                {navigator.onLine ? (
                  <>
                    <Wifi className="w-3 h-3 text-green-500" />
                    <span>온라인</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3 text-red-500" />
                    <span>오프라인</span>
                  </>
                )}
                {isSlowConnection && (
                  <span className="text-orange-500">• 느린 연결</span>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

MobileDataSyncGuide.propTypes = {
  className: PropTypes.string,
};

export default MobileDataSyncGuide;