/**
 * 모바일 전용 실시간 데이터 새로고침 Hook
 * Mobile-specific real-time data refresh with aggressive cache clearing
 * 
 * 기능:
 * - 모바일 브라우저 캐시 강제 무효화
 * - iOS Safari 및 Android Chrome 최적화  
 * - 네트워크 상태 감지 및 적응형 타임아웃
 * - Service Worker 캐시 완전 삭제
 * - Battery-conscious refresh intervals
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import neaRealTimeService from '../services/neaRealTimeService';

export const useMobileDataRefresh = () => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(null);
  const [networkType, setNetworkType] = useState('4g');
  const [refreshCount, setRefreshCount] = useState(0);
  const [error, setError] = useState(null);
  
  const refreshInProgress = useRef(false);
  const abortController = useRef(null);

  // 네트워크 상태 감지 (모바일 최적화)
  useEffect(() => {
    if ('connection' in navigator) {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      const updateNetworkInfo = () => {
        const effectiveType = connection.effectiveType || '4g';
        setNetworkType(effectiveType);
        console.log('📱 Network type detected:', effectiveType);
      };
      
      updateNetworkInfo();
      connection.addEventListener('change', updateNetworkInfo);
      
      return () => connection.removeEventListener('change', updateNetworkInfo);
    }
  }, []);

  // 모바일 캐시 완전 삭제 함수
  const clearMobileCaches = async () => {
    console.log('🧹 Clearing mobile caches...');
    
    try {
      // 1. Service Worker 캐시 완전 삭제
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => {
            console.log(`🗑️ Deleting cache: ${cacheName}`);
            return caches.delete(cacheName);
          })
        );
      }

      // 2. IndexedDB 관련 데이터 정리 (가능한 경우)
      if ('indexedDB' in window) {
        try {
          // 앱별 IndexedDB 정리는 필요에 따라 구현
          console.log('📦 IndexedDB cleanup skipped (manual implementation needed)');
        } catch (e) {
          console.warn('IndexedDB cleanup failed:', e);
        }
      }

      // 3. localStorage/sessionStorage 앱 관련 키 정리
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.includes('weather') || key.includes('singapore') || key.includes('nea'))) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => {
        localStorage.removeItem(key);
        console.log(`🔑 Removed localStorage key: ${key}`);
      });

      // 4. NEA 서비스 캐시 정리
      neaRealTimeService.clearCache();

      console.log('✅ Mobile cache clearing completed');
    } catch (error) {
      console.error('❌ Mobile cache clearing failed:', error);
    }
  };

  // 네트워크 상태별 타임아웃 설정
  const getNetworkTimeout = useCallback(() => {
    switch (networkType) {
      case 'slow-2g':
      case '2g':
        return 15000; // 15초
      case '3g':
        return 10000; // 10초
      case '4g':
      default:
        return 8000;  // 8초
    }
  }, [networkType]);

  // 모바일 최적화된 강제 새로고침
  const forceRefreshMobile = useCallback(async () => {
    // 중복 실행 방지
    if (refreshInProgress.current) {
      console.log('⏳ Refresh already in progress, skipping...');
      return false;
    }

    refreshInProgress.current = true;
    setIsRefreshing(true);
    setError(null);

    try {
      console.log('🚀 Starting mobile force refresh...');
      
      // 이전 요청 취소
      if (abortController.current) {
        abortController.current.abort();
      }
      abortController.current = new AbortController();

      const timeout = getNetworkTimeout();
      console.log(`⏱️ Using ${timeout}ms timeout for ${networkType} network`);

      // 1. 캐시 완전 삭제
      await clearMobileCaches();

      // 2. 타임아웃이 있는 강제 새로고침
      const refreshPromise = neaRealTimeService.getRealTimeWeatherData();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Mobile refresh timeout (${timeout}ms)`)), timeout);
      });

      const freshData = await Promise.race([refreshPromise, timeoutPromise]);

      if (freshData) {
        // 3. 글로벌 window 객체에 새 데이터 설정
        window.weatherData = freshData;
        console.log('📊 Fresh data set to window.weatherData:', {
          temperature: freshData.data?.temperature?.average?.toFixed(2) + '°C',
          humidity: freshData.data?.humidity?.average?.toFixed(1) + '%',
          stations: freshData.stations_used?.length || 0
        });

        // 4. 강제 DOM 업데이트 이벤트 발생
        const refreshEvent = new CustomEvent('mobileDataRefreshed', {
          detail: { data: freshData, timestamp: Date.now() }
        });
        window.dispatchEvent(refreshEvent);

        setLastRefreshTime(new Date());
        setRefreshCount(prev => prev + 1);
        
        console.log('✅ Mobile force refresh completed successfully');
        return true;
      }

    } catch (error) {
      console.error('❌ Mobile force refresh failed:', error);
      setError(error.message);
      return false;
    } finally {
      refreshInProgress.current = false;
      setIsRefreshing(false);
      abortController.current = null;
    }
  }, [networkType, getNetworkTimeout]);

  // 배터리 고려 자동 새로고침 (30분 간격)
  useEffect(() => {
    const interval = setInterval(() => {
      // 백그라운드 탭에서는 실행하지 않음
      if (document.hidden) return;
      
      // 마지막 새로고침으로부터 30분 경과시에만 실행
      if (!lastRefreshTime || (Date.now() - lastRefreshTime.getTime()) > 30 * 60 * 1000) {
        console.log('🔄 Auto refresh triggered (30min interval)');
        forceRefreshMobile();
      }
    }, 30 * 60 * 1000); // 30분 간격

    return () => clearInterval(interval);
  }, [lastRefreshTime, forceRefreshMobile]);

  // 컴포넌트 언마운트시 정리
  useEffect(() => {
    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
      refreshInProgress.current = false;
    };
  }, []);

  // 새로고침 상태 정보
  const getRefreshStatus = useCallback(() => {
    return {
      isRefreshing,
      lastRefreshTime,
      refreshCount,
      networkType,
      error,
      timeSinceLastRefresh: lastRefreshTime 
        ? Math.floor((Date.now() - lastRefreshTime.getTime()) / 1000) 
        : null,
      canRefresh: !refreshInProgress.current,
      recommendedAction: error ? 'retry' : refreshCount === 0 ? 'initial_refresh' : 'ok'
    };
  }, [isRefreshing, lastRefreshTime, refreshCount, networkType, error]);

  return {
    // 상태
    isRefreshing,
    lastRefreshTime,
    refreshCount,
    networkType,
    error,
    
    // 함수
    forceRefreshMobile,
    clearMobileCaches,
    getRefreshStatus,
    
    // 유틸리티
    canRefresh: !refreshInProgress.current,
    timeSinceLastRefresh: lastRefreshTime 
      ? Math.floor((Date.now() - lastRefreshTime.getTime()) / 1000)
      : null
  };
};

export default useMobileDataRefresh;