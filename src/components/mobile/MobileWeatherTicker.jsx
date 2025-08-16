/**
 * Mobile-Optimized Weather Ticker Component
 * Addresses mobile-specific ticker display and real-time update issues
 * Optimized for iOS Safari and Android Chrome
 */

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle, Info, RefreshCw, Smartphone, Wifi } from 'lucide-react';
import { useMobileDataLoader } from '../../hooks/useMobileDataLoader';

const MobileWeatherTicker = React.memo(({ className = '', refreshInterval = 30000 }) => {
  const [isVisible, setIsVisible] = useState(true);
  const [isPaused, setIsPaused] = useState(false);
  const [mobileAlerts, setMobileAlerts] = useState([]);
  const [tickerError, setTickerError] = useState(null);
  const tickerRef = useRef(null);
  const lastMobileUpdateRef = useRef(0);

  // Use mobile data loader
  const {
    weatherData,
    loading,
    error,
    isRefreshing,
    lastFetch,
    dataFreshness,
    mobileMetrics,
    actions: { refresh },
    mobile: { networkInfo, isSlowConnection, dataSaverMode }
  } = useMobileDataLoader(refreshInterval);

  // Mobile device detection
  const deviceInfo = useMemo(() => {
    const userAgent = navigator.userAgent;
    return {
      isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent),
      isIOS: /iPad|iPhone|iPod/.test(userAgent),
      isAndroid: /Android/.test(userAgent),
      isSafari: /Safari/.test(userAgent) && !/Chrome/.test(userAgent),
      isChrome: /Chrome/.test(userAgent),
    };
  }, []);

  // Generate mobile-optimized alerts from weather data
  const generateMobileAlerts = useCallback(() => {
    if (!weatherData || !window.weatherData) {
      return [{
        type: 'info',
        priority: 'low',
        icon: '📱',
        message: '모바일 실시간 날씨 데이터 로딩 중...',
        timestamp: new Date().toISOString(),
        source: 'Mobile System',
      }];
    }

    const originalData = window.weatherData;
    const alerts = [];
    const now = new Date();

    try {
      // Temperature alert with mobile context
      if (originalData.data?.temperature?.readings?.length > 0) {
        const tempReadings = originalData.data.temperature.readings;
        const avgTemp = originalData.data.temperature.average || 
          tempReadings.reduce((sum, r) => sum + r.value, 0) / tempReadings.length;
        
        const minTemp = Math.min(...tempReadings.map(r => r.value));
        const maxTemp = Math.max(...tempReadings.map(r => r.value));

        let tempIcon = '🌡️';
        let tempStatus = '정상';
        if (avgTemp >= 35) {
          tempIcon = '🔥';
          tempStatus = '매우 높음';
        } else if (avgTemp >= 33) {
          tempIcon = '🌡️';
          tempStatus = '높음';
        } else if (avgTemp <= 25) {
          tempIcon = '❄️';
          tempStatus = '낮음';
        }

        alerts.push({
          type: 'info',
          priority: avgTemp >= 35 ? 'medium' : 'low',
          icon: tempIcon,
          message: `📱 현재 ${avgTemp?.toFixed(1)}°C (${tempStatus}) • ${tempReadings.length}개소 평균 • 최저${minTemp?.toFixed(1)}° 최고${maxTemp?.toFixed(1)}°`,
          timestamp: now.toISOString(),
          source: 'NEA Singapore Mobile',
        });
      }

      // Humidity alert
      if (originalData.data?.humidity?.readings?.length > 0) {
        const humidityReadings = originalData.data.humidity.readings;
        const avgHumidity = originalData.data.humidity.average || 
          humidityReadings.reduce((sum, r) => sum + r.value, 0) / humidityReadings.length;

        let humidityIcon = '💧';
        let humidityStatus = '정상';
        if (avgHumidity >= 90) {
          humidityIcon = '💦';
          humidityStatus = '매우 높음';
        } else if (avgHumidity >= 80) {
          humidityStatus = '높음';
        } else if (avgHumidity <= 40) {
          humidityIcon = '🏜️';
          humidityStatus = '낮음';
        }

        alerts.push({
          type: 'info',
          priority: 'low',
          icon: humidityIcon,
          message: `💧 습도 ${avgHumidity?.toFixed(0)}% (${humidityStatus}) • ${humidityReadings.length}개소 평균`,
          timestamp: now.toISOString(),
          source: 'NEA Singapore Mobile',
        });
      }

      // Mobile-specific data status
      const dataAge = originalData.timestamp ? 
        Math.round((Date.now() - new Date(originalData.timestamp).getTime()) / (1000 * 60)) : 0;

      alerts.push({
        type: 'info',
        priority: 'low',
        icon: '📱',
        message: `모바일 실시간 데이터 • ${originalData.stations_used?.length || 0}개소 연동 • ${dataAge}분전 • ${networkInfo?.effectiveType || 'WiFi'} 연결`,
        timestamp: now.toISOString(),
        source: 'Mobile Status',
      });

      // Network-specific alert for mobile
      if (isSlowConnection) {
        alerts.push({
          type: 'warning',
          priority: 'medium',
          icon: '🐌',
          message: `느린 네트워크 감지 (${networkInfo?.effectiveType}) • 자동 새로고침 간격 조정됨`,
          timestamp: now.toISOString(),
          source: 'Mobile Network',
        });
      }

      if (dataSaverMode) {
        alerts.push({
          type: 'info',
          priority: 'low',
          icon: '💾',
          message: '데이터 절약 모드 활성화 • 업데이트 빈도 감소됨',
          timestamp: now.toISOString(),
          source: 'Mobile Settings',
        });
      }

      console.log('📱 [Mobile Ticker] Generated alerts:', alerts.length);
      return alerts;

    } catch (error) {
      console.error('❌ [Mobile Ticker] Alert generation failed:', error);
      return [{
        type: 'error',
        priority: 'medium',
        icon: '⚠️',
        message: '모바일 날씨 정보 처리 중 오류 발생 • 새로고침 해주세요',
        timestamp: now.toISOString(),
        source: 'Mobile Error',
      }];
    }
  }, [weatherData, networkInfo, isSlowConnection, dataSaverMode]);

  // Update mobile alerts when data changes
  useEffect(() => {
    const now = Date.now();
    
    // Rate limit updates for mobile performance
    if (now - lastMobileUpdateRef.current < 5000) {
      return; // Don't update more than once per 5 seconds
    }
    
    lastMobileUpdateRef.current = now;
    
    try {
      const newAlerts = generateMobileAlerts();
      setMobileAlerts(newAlerts);
      setTickerError(null);
    } catch (error) {
      console.error('❌ [Mobile Ticker] Failed to update alerts:', error);
      setTickerError('모바일 티커 업데이트 실패');
    }
  }, [weatherData, generateMobileAlerts]);

  // Mobile-optimized alert styling
  const getMobileAlertStyle = (alert) => {
    const baseClasses = 'flex items-center gap-2 px-3 py-2 whitespace-nowrap min-h-[44px] touch-manipulation'; // 44px minimum for iOS

    switch (alert.priority) {
      case 'critical':
        return `${baseClasses} text-red-800 font-bold`;
      case 'high':
        return `${baseClasses} text-orange-800 font-semibold`;
      case 'medium':
        return `${baseClasses} text-amber-800 font-medium`;
      case 'low':
        return `${baseClasses} text-gray-800 font-normal`;
      default:
        return `${baseClasses} text-gray-800 font-normal`;
    }
  };

  // Mobile-optimized animation duration
  const mobileAnimationDuration = useMemo(() => {
    if (mobileAlerts.length === 0) return 20;

    // Shorter duration for mobile to reduce battery usage
    const baseDuration = deviceInfo.isIOS ? 25 : 20; // iOS Safari needs slightly longer
    const alertCount = mobileAlerts.length;
    const totalLength = mobileAlerts.reduce((sum, alert) => sum + alert.message.length, 0);
    
    // Adjust based on content length and device type
    const calculatedDuration = Math.max(baseDuration, Math.min(45, Math.ceil(totalLength / 20)));
    
    // Reduce duration for slow connections to save battery
    const finalDuration = isSlowConnection ? calculatedDuration * 0.8 : calculatedDuration;
    
    console.log('📱 [Mobile Ticker] Animation duration:', {
      alerts: alertCount,
      totalLength,
      duration: finalDuration,
      device: deviceInfo.isIOS ? 'iOS' : deviceInfo.isAndroid ? 'Android' : 'Other',
      network: networkInfo?.effectiveType
    });
    
    return finalDuration;
  }, [mobileAlerts, deviceInfo, isSlowConnection, networkInfo]);

  // Mobile ticker controls
  const handleMobileRefresh = useCallback(async () => {
    try {
      await refresh();
      console.log('📱 [Mobile Ticker] Manual refresh completed');
    } catch (error) {
      console.error('❌ [Mobile Ticker] Manual refresh failed:', error);
      setTickerError('새로고침 실패');
    }
  }, [refresh]);

  if (!deviceInfo.isMobile || !isVisible) {
    return null;
  }

  // Animation control based on mobile performance
  const shouldAnimate = !isPaused && mobileAlerts.length > 0 && !loading;

  return (
    <div className={`mobile-weather-ticker bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100 ${className}`}>
      <div className="relative">
        {/* Mobile Ticker Header */}
        <div className="flex items-center justify-between px-3 py-2 bg-white/20 border-b border-blue-200/30">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <Smartphone className="w-4 h-4 text-blue-600" />
              <span className="text-blue-800 font-semibold text-sm">모바일 실시간</span>
            </div>
            <span className="text-blue-600 text-xs truncate">
              {loading ? 'Loading...' : `${mobileAlerts.length}건`}
            </span>
            {networkInfo && (
              <div className="flex items-center gap-1 text-xs text-blue-600">
                <Wifi className="w-3 h-3" />
                <span>{networkInfo.effectiveType}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={handleMobileRefresh}
              disabled={loading || isRefreshing}
              className="flex items-center justify-center w-9 h-9 rounded-md bg-white/30 hover:bg-white/50 transition-colors touch-manipulation active:scale-95 disabled:opacity-50"
              aria-label="모바일 새로고침"
            >
              <RefreshCw className={`w-4 h-4 text-blue-700 ${(loading || isRefreshing) ? 'animate-spin' : ''}`} />
            </button>
            
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="flex items-center justify-center w-9 h-9 rounded-md bg-white/30 hover:bg-white/50 transition-colors touch-manipulation active:scale-95"
              aria-label={isPaused ? '재생' : '일시정지'}
            >
              <span className="text-sm text-blue-700">{isPaused ? '▶️' : '⏸️'}</span>
            </button>
          </div>
        </div>

        {/* Mobile Ticker Content */}
        <div className="relative h-12 overflow-hidden" style={{ contain: 'layout style paint' }}>
          {loading ? (
            <div className="flex items-center justify-center h-full px-4">
              <div className="flex items-center gap-2 text-blue-700">
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span className="text-sm">모바일 데이터 로딩 중...</span>
              </div>
            </div>
          ) : tickerError ? (
            <div className="flex items-center justify-center h-full px-4">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">{tickerError}</span>
              </div>
            </div>
          ) : mobileAlerts.length === 0 ? (
            <div className="flex items-center justify-center h-full px-4">
              <div className="flex items-center gap-2 text-gray-600">
                <Info className="w-4 h-4" />
                <span className="text-sm">모바일 날씨 정보 준비 중...</span>
              </div>
            </div>
          ) : (
            <div
              ref={tickerRef}
              className={`flex items-center h-full will-change-transform ${shouldAnimate ? 'animate-scroll-left' : ''}`}
              style={{
                animationDuration: `${mobileAnimationDuration}s`,
                animationPlayState: shouldAnimate ? 'running' : 'paused',
                transform: 'translateZ(0)', // Hardware acceleration
                backfaceVisibility: 'hidden', // iOS Safari optimization
                WebkitBackfaceVisibility: 'hidden',
                perspective: '1000px',
                WebkitPerspective: '1000px',
              }}
            >
              {/* Original alerts */}
              {mobileAlerts.map((alert, index) => (
                <div key={`mobile-${alert.timestamp}-${index}`} className={`${getMobileAlertStyle(alert)} mr-6`}>
                  <span className="text-lg flex-shrink-0">{alert.icon}</span>
                  <span className="font-medium text-sm">{alert.message}</span>
                </div>
              ))}

              {/* Duplicate for infinite scroll */}
              {mobileAlerts.map((alert, index) => (
                <div key={`mobile-dup-${alert.timestamp}-${index}`} className={`${getMobileAlertStyle(alert)} mr-6`}>
                  <span className="text-lg flex-shrink-0">{alert.icon}</span>
                  <span className="font-medium text-sm">{alert.message}</span>
                </div>
              ))}

              {/* Padding for smooth transition */}
              <div className="w-24 flex-shrink-0"></div>
            </div>
          )}
        </div>

        {/* Mobile Performance Indicator */}
        {(isSlowConnection || dataSaverMode) && (
          <div className="px-3 py-1 bg-yellow-50 border-t border-yellow-200">
            <div className="flex items-center gap-2 text-xs text-yellow-800">
              {isSlowConnection && (
                <>
                  <span>🐌 느린 연결</span>
                  <span>•</span>
                </>
              )}
              {dataSaverMode && (
                <>
                  <span>💾 데이터 절약</span>
                  <span>•</span>
                </>
              )}
              <span>업데이트 간격 조정됨</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

MobileWeatherTicker.propTypes = {
  className: PropTypes.string,
  refreshInterval: PropTypes.number,
};

MobileWeatherTicker.displayName = 'MobileWeatherTicker';

export default MobileWeatherTicker;