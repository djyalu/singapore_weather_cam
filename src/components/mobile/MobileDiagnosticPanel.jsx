/**
 * 모바일 진단 패널 컴포넌트
 * Mobile diagnostic panel for troubleshooting data refresh issues
 * 
 * 기능:
 * - 실시간 데이터 상태 모니터링
 * - 캐시 상태 및 네트워크 정보
 * - 수동 문제 해결 도구
 * - 개발자 디버깅 정보
 */

import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { 
  Monitor, Wifi, Database, Clock, Battery, Smartphone, 
  RefreshCw, Trash2, Info, AlertTriangle, CheckCircle,
  Eye, EyeOff, Zap, Settings
} from 'lucide-react';
import { useMobileDataRefresh } from '../../hooks/useMobileDataRefresh';

const MobileDiagnosticPanel = ({ className = '', expanded = false }) => {
  const [isExpanded, setIsExpanded] = useState(expanded);
  const [diagnostics, setDiagnostics] = useState({});
  const [realTimeStatus, setRealTimeStatus] = useState({});
  
  const {
    isRefreshing,
    lastRefreshTime,
    refreshCount,
    networkType,
    error,
    forceRefreshMobile,
    clearMobileCaches,
    getRefreshStatus
  } = useMobileDataRefresh();

  // 시스템 진단 실행
  const runDiagnostics = useCallback(async () => {
    const results = {
      timestamp: new Date().toISOString(),
      browser: {
        userAgent: navigator.userAgent,
        cookieEnabled: navigator.cookieEnabled,
        onLine: navigator.onLine,
        language: navigator.language,
        platform: navigator.platform
      },
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight,
        devicePixelRatio: window.devicePixelRatio,
        orientation: screen.orientation?.type || 'unknown'
      },
      storage: {
        localStorage: (() => {
          try {
            const test = 'test';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return 'available';
          } catch (e) {
            return 'unavailable';
          }
        })(),
        sessionStorage: (() => {
          try {
            const test = 'test';
            sessionStorage.setItem(test, test);
            sessionStorage.removeItem(test);
            return 'available';
          } catch (e) {
            return 'unavailable';
          }
        })(),
        indexedDB: 'indexedDB' in window ? 'available' : 'unavailable'
      },
      apis: {
        fetch: 'fetch' in window ? 'available' : 'unavailable',
        serviceWorker: 'serviceWorker' in navigator ? 'available' : 'unavailable',
        caches: 'caches' in window ? 'available' : 'unavailable',
        battery: 'getBattery' in navigator ? 'available' : 'unavailable',
        connection: 'connection' in navigator ? 'available' : 'unavailable'
      },
      performance: {
        memory: performance.memory ? {
          used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
          limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
        } : null,
        timing: performance.timing ? {
          loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
          domReady: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart
        } : null
      },
      data: {
        weatherDataExists: !!window.weatherData,
        weatherDataTimestamp: window.weatherData?.timestamp || null,
        temperatureReadings: window.weatherData?.data?.temperature?.readings?.length || 0,
        humidityReadings: window.weatherData?.data?.humidity?.readings?.length || 0,
        dataAge: window.weatherData?.timestamp ? 
          Math.round((Date.now() - new Date(window.weatherData.timestamp).getTime()) / 1000) : null
      },
      ticker: {
        element: (() => {
          const ticker = document.querySelector('[class*="WeatherAlertTicker"]');
          return ticker ? {
            exists: true,
            visible: ticker.offsetHeight > 0 && ticker.offsetWidth > 0,
            height: ticker.offsetHeight,
            width: ticker.offsetWidth,
            hidden: ticker.hidden
          } : { exists: false };
        })(),
        alerts: document.querySelectorAll('[class*="alert"]').length
      }
    };

    setDiagnostics(results);
    console.log('🔍 [MobileDiagnostic] Full diagnostic results:', results);
    return results;
  }, []);

  // 실시간 상태 업데이트
  const updateRealTimeStatus = useCallback(() => {
    const status = {
      timestamp: new Date().toISOString(),
      refreshStatus: getRefreshStatus(),
      networkInfo: {
        type: networkType,
        online: navigator.onLine,
        effectiveType: navigator.connection?.effectiveType || 'unknown',
        downlink: navigator.connection?.downlink || 'unknown',
        rtt: navigator.connection?.rtt || 'unknown'
      },
      batteryInfo: null, // Will be updated asynchronously
      cacheInfo: {
        serviceWorkerControlled: !!navigator.serviceWorker.controller,
        cacheNames: null // Will be updated asynchronously
      }
    };

    // 배터리 정보 비동기 업데이트
    if ('getBattery' in navigator) {
      navigator.getBattery().then(battery => {
        setRealTimeStatus(prev => ({
          ...prev,
          batteryInfo: {
            level: Math.round(battery.level * 100),
            charging: battery.charging,
            chargingTime: battery.chargingTime,
            dischargingTime: battery.dischargingTime
          }
        }));
      }).catch(() => {
        console.log('Battery API not available');
      });
    }

    // 캐시 정보 비동기 업데이트
    if ('caches' in window) {
      caches.keys().then(cacheNames => {
        setRealTimeStatus(prev => ({
          ...prev,
          cacheInfo: {
            ...prev.cacheInfo,
            cacheNames: cacheNames
          }
        }));
      }).catch(() => {
        console.log('Cache API not available');
      });
    }

    setRealTimeStatus(status);
  }, [getRefreshStatus, networkType]);

  // 초기 진단 및 주기적 업데이트
  useEffect(() => {
    runDiagnostics();
    updateRealTimeStatus();

    const interval = setInterval(() => {
      updateRealTimeStatus();
    }, 10000); // 10초마다 업데이트

    return () => clearInterval(interval);
  }, [runDiagnostics, updateRealTimeStatus]);

  // 전체 시스템 재설정
  const resetSystem = async () => {
    console.log('🔄 [MobileDiagnostic] Full system reset initiated');
    
    try {
      // 1. 캐시 정리
      await clearMobileCaches();
      
      // 2. 데이터 새로고침
      await forceRefreshMobile();
      
      // 3. 진단 재실행
      setTimeout(() => {
        runDiagnostics();
        updateRealTimeStatus();
      }, 1000);
      
      console.log('✅ [MobileDiagnostic] System reset completed');
    } catch (error) {
      console.error('❌ [MobileDiagnostic] System reset failed:', error);
    }
  };

  // 상태 아이콘 결정
  const getStatusIcon = (status) => {
    switch (status) {
      case 'available':
      case 'visible':
      case true:
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'unavailable':
      case 'hidden':
      case false:
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Info className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div className={`bg-white rounded-lg border shadow-sm ${className}`}>
      {/* 헤더 */}
      <div 
        className="flex items-center justify-between p-4 cursor-pointer touch-manipulation border-b"
        onClick={() => setIsExpanded(!isExpanded)}
        role="button"
        aria-expanded={isExpanded}
        aria-label="모바일 진단 패널 토글"
      >
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-gray-600" />
          <span className="font-medium text-gray-900">모바일 진단</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">
            {realTimeStatus.refreshStatus?.refreshCount || 0}회 새로고침
          </span>
          {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </div>
      </div>

      {/* 확장된 내용 */}
      {isExpanded && (
        <div className="p-4 space-y-4">
          {/* 빠른 상태 개요 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Wifi className="w-4 h-4" />
              <span>네트워크: {networkType}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4" />
              <span>
                {lastRefreshTime ? 
                  `${Math.floor((Date.now() - lastRefreshTime.getTime()) / 1000)}초 전` : 
                  '업데이트 필요'
                }
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Database className="w-4 h-4" />
              <span>
                데이터: {diagnostics.data?.temperatureReadings || 0}개 측정소
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Monitor className="w-4 h-4" />
              <span>
                티커: {diagnostics.ticker?.element?.visible ? '표시' : '숨김'}
              </span>
            </div>
          </div>

          {/* 액션 버튼들 */}
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={forceRefreshMobile}
              disabled={isRefreshing}
              className="flex items-center justify-center gap-2 bg-blue-600 text-white p-3 rounded-lg 
                       touch-manipulation active:scale-95 transition-transform disabled:opacity-50"
              aria-label="강제 데이터 새로고침"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>{isRefreshing ? '새로고침 중...' : '데이터 새로고침'}</span>
            </button>
            
            <button
              onClick={resetSystem}
              className="flex items-center justify-center gap-2 bg-orange-600 text-white p-3 rounded-lg 
                       touch-manipulation active:scale-95 transition-transform"
              aria-label="전체 시스템 재설정"
            >
              <Zap className="w-4 h-4" />
              <span>시스템 재설정</span>
            </button>
          </div>

          {/* 상세 진단 정보 */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">상세 진단</h4>
            
            {/* API 지원 상태 */}
            <div className="bg-gray-50 p-3 rounded border">
              <h5 className="text-sm font-medium mb-2">API 지원</h5>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(diagnostics.apis || {}).map(([api, status]) => (
                  <div key={api} className="flex items-center gap-2">
                    {getStatusIcon(status)}
                    <span>{api}: {status}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* 데이터 상태 */}
            <div className="bg-gray-50 p-3 rounded border">
              <h5 className="text-sm font-medium mb-2">데이터 상태</h5>
              <div className="space-y-1 text-xs">
                <div>온도 측정소: {diagnostics.data?.temperatureReadings || 0}개</div>
                <div>습도 측정소: {diagnostics.data?.humidityReadings || 0}개</div>
                <div>데이터 나이: {diagnostics.data?.dataAge || 0}초</div>
                <div>마지막 업데이트: {diagnostics.data?.weatherDataTimestamp || 'N/A'}</div>
              </div>
            </div>

            {/* 성능 정보 */}
            {diagnostics.performance?.memory && (
              <div className="bg-gray-50 p-3 rounded border">
                <h5 className="text-sm font-medium mb-2">메모리 사용량</h5>
                <div className="space-y-1 text-xs">
                  <div>사용: {diagnostics.performance.memory.used}MB</div>
                  <div>총량: {diagnostics.performance.memory.total}MB</div>
                  <div>한계: {diagnostics.performance.memory.limit}MB</div>
                </div>
              </div>
            )}

            {/* 에러 정보 */}
            {error && (
              <div className="bg-red-50 p-3 rounded border border-red-200">
                <h5 className="text-sm font-medium text-red-800 mb-2">오류</h5>
                <div className="text-xs text-red-700">{error}</div>
              </div>
            )}
          </div>

          {/* 새로고침 버튼 */}
          <button
            onClick={() => {
              runDiagnostics();
              updateRealTimeStatus();
            }}
            className="w-full text-xs text-gray-500 underline py-2 touch-manipulation"
            aria-label="진단 정보 새로고침"
          >
            진단 정보 새로고침
          </button>
        </div>
      )}
    </div>
  );
};

MobileDiagnosticPanel.propTypes = {
  className: PropTypes.string,
  expanded: PropTypes.bool,
};

export default MobileDiagnosticPanel;