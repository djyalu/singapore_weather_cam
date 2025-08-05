/**
 * Real-Time Weather Stream Hook
 * Provides truly real-time weather updates using WebSocket-like polling
 * Updates every 1-2 minutes with aggressive caching bypass
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import neaRealTimeService from '../services/neaRealTimeService';

export const useRealTimeWeatherStream = (initialData) => {
  const [weatherData, setWeatherData] = useState(initialData);
  const [lastUpdateTime, setLastUpdateTime] = useState(new Date());
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamError, setStreamError] = useState(null);
  const [updateCount, setUpdateCount] = useState(0);
  
  const intervalRef = useRef(null);
  const retryTimeoutRef = useRef(null);
  const isActiveRef = useRef(true);
  
  // Real-time streaming configuration
  const STREAM_INTERVAL = 60000; // 1 minute - truly real-time
  const MAX_RETRY_ATTEMPTS = 5;
  const RETRY_DELAY = 5000; // 5 seconds
  
  /**
   * Force immediate data fetch with maximum cache busting
   */
  const fetchRealTimeData = useCallback(async (retryAttempt = 0) => {
    if (!isActiveRef.current) return null;
    
    try {
      console.log(`🔴 [실시간 스트림] 데이터 페치 시도 ${retryAttempt + 1}/${MAX_RETRY_ATTEMPTS}`);
      
      // Ultra-aggressive cache busting
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(2);
      
      // Clear any existing caches
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      
      // Force fresh data from NEA service
      const freshData = await neaRealTimeService.getRealTimeWeatherData();
      
      if (freshData && freshData.timestamp) {
        const dataTimestamp = new Date(freshData.timestamp);
        const now = new Date();
        
        console.log('🟢 [실시간 스트림] 새 데이터 수신:', {
          timestamp: freshData.timestamp,
          avgTemp: freshData.data?.temperature?.average?.toFixed(2),
          stations: freshData.stations_used?.length,
          dataAge: Math.round((now - dataTimestamp) / (1000 * 60)) + '분 전',
          updateNumber: updateCount + 1
        });
        
        // Update global state immediately
        window.weatherData = freshData;
        setWeatherData(freshData);
        setLastUpdateTime(now);
        setUpdateCount(prev => prev + 1);
        setStreamError(null);
        
        // Broadcast real-time update event
        window.dispatchEvent(new CustomEvent('realTimeWeatherUpdate', {
          detail: {
            data: freshData,
            timestamp: now.toISOString(),
            updateNumber: updateCount + 1,
            source: 'real-time-stream'
          }
        }));
        
        // Store real-time update in localStorage
        localStorage.setItem('realTimeWeatherUpdate', JSON.stringify({
          timestamp: freshData.timestamp,
          avgTemp: freshData.data?.temperature?.average,
          updateTime: now.toISOString(),
          updateNumber: updateCount + 1
        }));
        
        return freshData;
      } else {
        throw new Error('실시간 데이터 수신 실패');
      }
      
    } catch (error) {
      console.error(`🔴 [실시간 스트림] 페치 실패 (${retryAttempt + 1}/${MAX_RETRY_ATTEMPTS}):`, error.message);
      
      if (retryAttempt < MAX_RETRY_ATTEMPTS - 1) {
        // Retry with exponential backoff
        const retryDelay = RETRY_DELAY * Math.pow(2, retryAttempt);
        console.log(`⏳ [실시간 스트림] ${retryDelay/1000}초 후 재시도...`);
        
        retryTimeoutRef.current = setTimeout(() => {
          if (isActiveRef.current) {
            fetchRealTimeData(retryAttempt + 1);
          }
        }, retryDelay);
      } else {
        setStreamError(`실시간 업데이트 실패: ${error.message}`);
      }
      
      return null;
    }
  }, [updateCount]);
  
  /**
   * Start real-time streaming
   */
  const startStream = useCallback(() => {
    if (intervalRef.current) return; // Already streaming
    
    console.log('🚀 [실시간 스트림] 1분 간격 실시간 업데이트 시작');
    setIsStreaming(true);
    setStreamError(null);
    
    // Immediate first fetch
    fetchRealTimeData();
    
    // Set up real-time interval
    intervalRef.current = setInterval(() => {
      if (isActiveRef.current) {
        fetchRealTimeData();
      }
    }, STREAM_INTERVAL);
    
  }, [fetchRealTimeData]);
  
  /**
   * Stop real-time streaming
   */
  const stopStream = useCallback(() => {
    console.log('⏹️ [실시간 스트림] 실시간 업데이트 중지');
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }
    
    setIsStreaming(false);
  }, []);
  
  /**
   * Force immediate update
   */
  const forceUpdate = useCallback(async () => {
    console.log('⚡ [실시간 스트림] 즉시 강제 업데이트');
    return await fetchRealTimeData();
  }, [fetchRealTimeData]);
  
  // Auto-start streaming on mount
  useEffect(() => {
    isActiveRef.current = true;
    startStream();
    
    // Handle visibility changes - pause when hidden, resume when visible
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('👁️ [실시간 스트림] 백그라운드로 이동 - 스트림 일시정지');
        stopStream();
      } else {
        console.log('👁️ [실시간 스트림] 포그라운드로 복귀 - 스트림 재시작');
        startStream();
      }
    };
    
    // Handle page focus - always fetch fresh data when user returns
    const handleFocus = () => {
      console.log('🎯 [실시간 스트림] 페이지 포커스 - 즉시 업데이트');
      fetchRealTimeData();
    };
    
    // Handle network changes - restart stream when online
    const handleOnline = () => {
      console.log('🌐 [실시간 스트림] 네트워크 복구 - 스트림 재시작');
      startStream();
    };
    
    const handleOffline = () => {
      console.log('📵 [실시간 스트림] 네트워크 연결 끊김 - 스트림 일시정지');
      stopStream();
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      isActiveRef.current = false;
      stopStream();
      
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []); // Only run on mount/unmount
  
  // Calculate stream health metrics
  const streamHealth = {
    isHealthy: isStreaming && !streamError,
    uptime: isStreaming ? Date.now() - lastUpdateTime.getTime() : 0,
    updateFrequency: STREAM_INTERVAL / 1000, // in seconds
    totalUpdates: updateCount,
    lastError: streamError
  };
  
  return {
    // Real-time data
    weatherData,
    lastUpdateTime,
    updateCount,
    
    // Stream control
    isStreaming,
    startStream,
    stopStream,
    forceUpdate,
    
    // Error handling
    streamError,
    streamHealth,
    
    // Status indicators
    isRealTime: true,
    nextUpdateIn: isStreaming ? Math.max(0, STREAM_INTERVAL - (Date.now() - lastUpdateTime.getTime())) : null
  };
};

export default useRealTimeWeatherStream;