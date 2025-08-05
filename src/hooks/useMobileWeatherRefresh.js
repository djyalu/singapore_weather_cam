/**
 * Enhanced Mobile Weather Refresh Hook
 * Addresses mobile-specific data update issues with aggressive cache busting
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import neaRealTimeService from '../services/neaRealTimeService';

export const useMobileWeatherRefresh = (baseWeatherData) => {
  const [lastSuccessfulUpdate, setLastSuccessfulUpdate] = useState(null);
  const [updateError, setUpdateError] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const updateAttempts = useRef(0);
  const maxUpdateAttempts = 3;

  /**
   * Aggressive mobile cache busting function
   */
  const forceDataRefresh = useCallback(async () => {
    setIsUpdating(true);
    setUpdateError(null);
    updateAttempts.current += 1;

    try {
      console.log(`🔄 [모바일 새로고침] 시도 ${updateAttempts.current}/${maxUpdateAttempts}`);
      
      // Strategy 1: Clear all service worker caches (if available)
      if ('serviceWorker' in navigator && 'caches' in window) {
        try {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
          );
          console.log('🗑️ Service Worker 캐시 삭제 완료');
        } catch (cacheError) {
          console.warn('⚠️ Service Worker 캐시 삭제 실패:', cacheError.message);
        }
      }

      // Strategy 2: Force NEA API call with maximum cache busting
      const freshData = await neaRealTimeService.getRealTimeWeatherData();
      
      if (freshData && freshData.timestamp) {
        const dataTimestamp = new Date(freshData.timestamp);
        const now = new Date();
        const minutesSinceUpdate = Math.floor((now - dataTimestamp) / (1000 * 60));
        
        console.log('✅ [모바일 새로고침] 실시간 데이터 획득:', {
          timestamp: freshData.timestamp,
          minutesOld: minutesSinceUpdate,
          avgTemp: freshData.data?.temperature?.average?.toFixed(2),
          stations: freshData.stations_used?.length
        });
        
        // Update global reference for all components
        window.weatherData = freshData;
        
        // Broadcast update to all components using custom event
        window.dispatchEvent(new CustomEvent('weatherDataUpdated', {
          detail: {
            data: freshData,
            timestamp: now.toISOString(),
            source: 'mobile-refresh'
          }
        }));
        
        setLastSuccessfulUpdate(now);
        updateAttempts.current = 0; // Reset attempts on success
        
        // Store success timestamp in localStorage for persistence
        localStorage.setItem('lastMobileWeatherUpdate', now.toISOString());
        localStorage.setItem('lastMobileWeatherData', JSON.stringify({
          timestamp: freshData.timestamp,
          avgTemp: freshData.data?.temperature?.average,
          source: 'mobile-refresh'
        }));
        
        console.log('🎯 [모바일 새로고침] 성공 - 모든 컴포넌트에 업데이트 알림 전송');
        
      } else {
        throw new Error('유효한 날씨 데이터를 받지 못했습니다');
      }
      
    } catch (error) {
      console.error(`❌ [모바일 새로고침] 실패 (${updateAttempts.current}/${maxUpdateAttempts}):`, error.message);
      setUpdateError(error.message);
      
      // If max attempts reached, show user-friendly error
      if (updateAttempts.current >= maxUpdateAttempts) {
        setUpdateError('모바일 데이터 새로고침이 실패했습니다. 네트워크 연결을 확인해주세요.');
      }
    } finally {
      setIsUpdating(false);
    }
  }, []);

  /**
   * Mobile-specific pull-to-refresh handler
   */
  const handlePullToRefresh = useCallback(async (event) => {
    // Prevent default browser refresh
    if (event) {
      event.preventDefault();
    }
    
    console.log('📱 [Pull-to-Refresh] 모바일 스와이프 새로고침 감지');
    await forceDataRefresh();
  }, [forceDataRefresh]);

  /**
   * Check if data is stale (older than 6 hours)
   */
  const isDataStale = useCallback(() => {
    if (!baseWeatherData?.timestamp) return true;
    
    const dataTime = new Date(baseWeatherData.timestamp);
    const now = new Date();
    const hoursOld = (now - dataTime) / (1000 * 60 * 60);
    
    return hoursOld > 6;
  }, [baseWeatherData]);

  /**
   * Auto-refresh when app becomes visible (tab switch, app resume)
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && isDataStale()) {
        console.log('👁️ [가시성 변경] 앱 복귀 + 오래된 데이터 감지 - 자동 새로고침');
        forceDataRefresh();
      }
    };

    const handlePageShow = (event) => {
      // Handle page show from back/forward cache
      if (event.persisted && isDataStale()) {
        console.log('🔄 [페이지 복원] BFCache에서 복원 + 오래된 데이터 - 자동 새로고침');
        forceDataRefresh();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pageshow', handlePageShow);
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pageshow', handlePageShow);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [forceDataRefresh, isDataStale]);

  /**
   * Initialize mobile refresh on mount if data is stale
   */
  useEffect(() => {
    if (isDataStale()) {
      console.log('🚀 [초기화] 오래된 데이터 감지 - 즉시 새로고침');
      forceDataRefresh();
    }
  }, []); // Only run on mount

  return {
    forceDataRefresh,
    handlePullToRefresh,
    isUpdating,
    updateError,
    lastSuccessfulUpdate,
    isDataStale: isDataStale(),
    updateAttempts: updateAttempts.current,
    maxUpdateAttempts
  };
};

export default useMobileWeatherRefresh;