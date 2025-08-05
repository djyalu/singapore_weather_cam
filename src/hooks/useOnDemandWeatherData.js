/**
 * On-Demand Weather Data Hook
 * Fetches latest data only when user requests it (button click or page load)
 * No automatic background updates or streaming
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import neaRealTimeService from '../services/neaRealTimeService';

export const useOnDemandWeatherData = (initialData) => {
  const [weatherData, setWeatherData] = useState(initialData);
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastUpdateTime, setLastUpdateTime] = useState(null);
  const [updateError, setUpdateError] = useState(null);
  const [manualUpdateCount, setManualUpdateCount] = useState(0);
  
  const abortControllerRef = useRef(null);
  const isComponentMountedRef = useRef(true);
  
  /**
   * Fetch fresh data from NEA API (only when explicitly requested)
   */
  const fetchFreshData = useCallback(async (source = 'manual') => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new abort controller
    abortControllerRef.current = new AbortController();
    
    try {
      setIsUpdating(true);
      setUpdateError(null);
      
      console.log(`🔄 [On-Demand] 최신 데이터 요청 (${source})`);
      
      // Clear browser caches aggressively
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
        console.log('🗑️ [On-Demand] 브라우저 캐시 완전 삭제');
      }
      
      // Fetch fresh data with cache busting
      const freshData = await neaRealTimeService.getRealTimeWeatherData();
      
      // Check if component is still mounted and request wasn't aborted
      if (!isComponentMountedRef.current || abortControllerRef.current?.signal.aborted) {
        return null;
      }
      
      if (freshData && freshData.timestamp) {
        const now = new Date();
        const dataTimestamp = new Date(freshData.timestamp);
        const minutesOld = Math.floor((now - dataTimestamp) / (1000 * 60));
        
        console.log('✅ [On-Demand] 최신 데이터 획득:', {
          source,
          timestamp: freshData.timestamp,
          avgTemp: freshData.data?.temperature?.average?.toFixed(1) + '°C',
          stations: freshData.stations_used?.length,
          dataAge: minutesOld + '분 전',
          updateNumber: manualUpdateCount + 1
        });
        
        // Update state
        setWeatherData(freshData);
        setLastUpdateTime(now);
        setManualUpdateCount(prev => prev + 1);
        
        // Update global reference for other components
        window.weatherData = freshData;
        
        // Broadcast update event
        window.dispatchEvent(new CustomEvent('onDemandWeatherUpdate', {
          detail: {
            data: freshData,
            timestamp: now.toISOString(),
            source,
            updateNumber: manualUpdateCount + 1
          }
        }));
        
        // Store in localStorage for persistence across page reloads
        localStorage.setItem('lastOnDemandUpdate', JSON.stringify({
          timestamp: freshData.timestamp,
          avgTemp: freshData.data?.temperature?.average,
          updateTime: now.toISOString(),
          source,
          updateNumber: manualUpdateCount + 1
        }));
        
        return freshData;
      } else {
        throw new Error('유효한 날씨 데이터를 받지 못했습니다');
      }
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('🚫 [On-Demand] 요청이 취소되었습니다');
        return null;
      }
      
      console.error('❌ [On-Demand] 데이터 획득 실패:', error.message);
      setUpdateError(error.message);
      throw error;
      
    } finally {
      if (isComponentMountedRef.current) {
        setIsUpdating(false);
      }
    }
  }, [manualUpdateCount]);
  
  /**
   * Manual refresh triggered by user (button click)
   */
  const refreshData = useCallback(async () => {
    console.log('👆 [On-Demand] 사용자 수동 새로고침 버튼 클릭');
    try {
      await fetchFreshData('manual-button');
      return true;
    } catch (error) {
      console.error('❌ [On-Demand] 수동 새로고침 실패:', error.message);
      return false;
    }
  }, [fetchFreshData]);
  
  /**
   * Initial load on page visit/reload
   */
  const loadInitialData = useCallback(async () => {
    // Only fetch on initial load, not on every component mount
    const hasRecentData = localStorage.getItem('lastOnDemandUpdate');
    if (hasRecentData) {
      try {
        const recentData = JSON.parse(hasRecentData);
        const updateTime = new Date(recentData.updateTime);
        const minutesSinceUpdate = Math.floor((new Date() - updateTime) / (1000 * 60));
        
        if (minutesSinceUpdate < 30) { // If data is less than 30 minutes old
          console.log(`📋 [On-Demand] 최근 데이터 사용 (${minutesSinceUpdate}분 전)`);
          return; // Don't fetch new data, use existing
        }
      } catch (e) {
        console.warn('⚠️ [On-Demand] localStorage 데이터 파싱 실패');
      }
    }
    
    console.log('🚀 [On-Demand] 페이지 로드 시 초기 데이터 요청');
    try {
      await fetchFreshData('page-load');
    } catch (error) {
      console.error('❌ [On-Demand] 초기 데이터 로드 실패:', error.message);
    }
  }, [fetchFreshData]);
  
  /**
   * Handle page visibility changes (user returns to tab)
   */
  const handleVisibilityChange = useCallback(() => {
    if (!document.hidden) {
      // Check if data is stale when user returns
      if (lastUpdateTime) {
        const minutesSinceUpdate = Math.floor((new Date() - lastUpdateTime) / (1000 * 60));
        if (minutesSinceUpdate > 15) { // If data is older than 15 minutes
          console.log('👁️ [On-Demand] 탭 복귀 + 오래된 데이터 감지 - 새로고침 제안');
          // Don't auto-fetch, just indicate data might be stale
        }
      }
    }
  }, [lastUpdateTime]);
  
  // Setup event listeners
  useEffect(() => {
    isComponentMountedRef.current = true;
    
    // Initial load only
    loadInitialData();
    
    // Listen for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Listen for focus events (user switches back to tab)
    const handleFocus = () => {
      console.log('🎯 [On-Demand] 페이지 포커스 - 데이터 확인');
      // Don't auto-fetch, let user decide
    };
    
    window.addEventListener('focus', handleFocus);
    
    return () => {
      isComponentMountedRef.current = false;
      
      // Cancel any ongoing requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
    };
  }, []); // Only run on mount/unmount
  
  // Calculate data freshness
  const getDataFreshness = useCallback(() => {
    if (!weatherData?.timestamp) return null;
    
    const dataTime = new Date(weatherData.timestamp);
    const now = new Date();
    const minutesOld = Math.floor((now - dataTime) / (1000 * 60));
    
    return {
      minutesOld,
      isStale: minutesOld > 30,
      isVeryStale: minutesOld > 60,
      lastUpdate: lastUpdateTime,
      dataTimestamp: dataTime
    };
  }, [weatherData?.timestamp, lastUpdateTime]);
  
  return {
    // Data
    weatherData,
    lastUpdateTime,
    manualUpdateCount,
    
    // Actions (only manual, no automatic)
    refreshData,
    
    // Status
    isUpdating,
    updateError,
    
    // Freshness info
    dataFreshness: getDataFreshness(),
    
    // Config
    isOnDemandMode: true,
    hasAutoUpdates: false
  };
};

export default useOnDemandWeatherData;