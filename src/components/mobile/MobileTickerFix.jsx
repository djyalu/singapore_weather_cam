/**
 * 모바일 티커 표시 문제 해결 컴포넌트
 * Mobile ticker display issue resolution component
 * 
 * 기능:
 * - 모바일에서 티커가 보이지 않는 문제 해결
 * - 강제 데이터 로딩 및 DOM 업데이트
 * - iOS Safari 및 Android Chrome 호환성
 * - 실시간 데이터 동기화 보장
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { RefreshCw, Eye, EyeOff, AlertTriangle, CheckCircle, Zap } from 'lucide-react';
import neaRealTimeService from '../../services/neaRealTimeService';

const MobileTickerFix = ({ className = '', onDataUpdated = null }) => {
  const [isFixing, setIsFixing] = useState(false);
  const [tickerVisible, setTickerVisible] = useState(false);
  const [dataStatus, setDataStatus] = useState('checking');
  const [lastFixTime, setLastFixTime] = useState(null);
  const [debugInfo, setDebugInfo] = useState({});
  const [showDebug, setShowDebug] = useState(false);
  
  const fixInProgress = useRef(false);
  const checkInterval = useRef(null);

  // 티커 표시 상태 확인
  const checkTickerVisibility = useCallback(() => {
    try {
      const tickerElement = document.querySelector('[class*="WeatherAlertTicker"]') || 
                          document.querySelector('[aria-label*="기상 경보"]') ||
                          document.querySelector('[class*="ticker"]');
      
      const hasData = !!(window.weatherData?.data?.temperature?.readings?.length > 0);
      const hasAlerts = document.querySelectorAll('[class*="alert"]').length > 0;
      
      const isVisible = !!(tickerElement && 
                          !tickerElement.hidden && 
                          tickerElement.offsetHeight > 0 &&
                          tickerElement.offsetWidth > 0);
      
      setTickerVisible(isVisible);
      
      const status = isVisible && hasData ? 'visible' : 
                    hasData ? 'hidden' : 
                    'no_data';
      setDataStatus(status);
      
      setDebugInfo({
        hasTickerElement: !!tickerElement,
        elementHidden: tickerElement?.hidden,
        elementHeight: tickerElement?.offsetHeight || 0,
        elementWidth: tickerElement?.offsetWidth || 0,
        hasData,
        hasAlerts,
        isVisible,
        weatherDataExists: !!window.weatherData,
        temperatureReadings: window.weatherData?.data?.temperature?.readings?.length || 0,
        timestamp: new Date().toISOString()
      });
      
      console.log('🔍 [MobileTickerFix] Visibility check:', {
        isVisible,
        hasData,
        status,
        elementInfo: {
          found: !!tickerElement,
          height: tickerElement?.offsetHeight || 0,
          width: tickerElement?.offsetWidth || 0
        }
      });
      
      return { isVisible, hasData, status };
    } catch (error) {
      console.error('❌ [MobileTickerFix] Visibility check failed:', error);
      return { isVisible: false, hasData: false, status: 'error' };
    }
  }, []);

  // 티커 표시 강제 수정
  const fixTickerDisplay = useCallback(async () => {
    if (fixInProgress.current) {
      console.log('⏳ [MobileTickerFix] Fix already in progress');
      return false;
    }

    fixInProgress.current = true;
    setIsFixing(true);

    try {
      console.log('🔧 [MobileTickerFix] Starting ticker display fix...');

      // 1. 기존 데이터 상태 확인
      const initialCheck = checkTickerVisibility();
      console.log('📊 Initial state:', initialCheck);

      // 2. 새로운 데이터 강제 로드
      console.log('📡 Forcing fresh data load...');
      const freshData = await neaRealTimeService.getRealTimeWeatherData();
      
      if (freshData) {
        // 3. window.weatherData 강제 업데이트
        window.weatherData = freshData;
        
        // 4. DOM 강제 업데이트 이벤트 발생
        const events = [
          new CustomEvent('weatherDataUpdated', { detail: freshData }),
          new CustomEvent('mobileTickerRefresh', { detail: { force: true } }),
          new CustomEvent('dataRefreshed', { detail: { source: 'mobile_fix' } })
        ];
        
        events.forEach(event => {
          window.dispatchEvent(event);
          document.dispatchEvent(event);
        });

        // 5. React 컴포넌트 강제 리렌더링 트리거
        setTimeout(() => {
          const refreshEvent = new CustomEvent('forceComponentRefresh');
          window.dispatchEvent(refreshEvent);
        }, 100);

        // 6. 결과 확인
        setTimeout(() => {
          const finalCheck = checkTickerVisibility();
          console.log('✅ Final state:', finalCheck);
          
          setLastFixTime(new Date());
          
          if (onDataUpdated) {
            onDataUpdated(freshData);
          }
        }, 500);

        console.log('🚀 [MobileTickerFix] Ticker fix completed successfully');
        return true;
      } else {
        throw new Error('Failed to load fresh data');
      }

    } catch (error) {
      console.error('❌ [MobileTickerFix] Fix failed:', error);
      setDataStatus('error');
      return false;
    } finally {
      fixInProgress.current = false;
      setIsFixing(false);
    }
  }, [checkTickerVisibility, onDataUpdated]);

  // 주기적 상태 확인 (30초마다)
  useEffect(() => {
    checkTickerVisibility();
    
    checkInterval.current = setInterval(() => {
      if (!fixInProgress.current) {
        checkTickerVisibility();
      }
    }, 30000);

    return () => {
      if (checkInterval.current) {
        clearInterval(checkInterval.current);
      }
    };
  }, [checkTickerVisibility]);

  // 상태별 아이콘
  const getStatusIcon = () => {
    if (isFixing) {
      return <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />;
    }
    
    switch (dataStatus) {
      case 'visible':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'hidden':
        return <EyeOff className="w-4 h-4 text-orange-600" />;
      case 'no_data':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'error':
        return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default:
        return <Eye className="w-4 h-4 text-gray-600" />;
    }
  };

  // 상태별 메시지
  const getStatusMessage = () => {
    switch (dataStatus) {
      case 'visible':
        return '티커 정상 표시';
      case 'hidden':
        return '티커 숨김 상태';
      case 'no_data':
        return '데이터 없음';
      case 'error':
        return '오류 발생';
      default:
        return '상태 확인 중';
    }
  };

  // 상태별 색상
  const getStatusColor = () => {
    switch (dataStatus) {
      case 'visible':
        return 'text-green-700 bg-green-50 border-green-200';
      case 'hidden':
        return 'text-orange-700 bg-orange-50 border-orange-200';
      case 'no_data':
      case 'error':
        return 'text-red-700 bg-red-50 border-red-200';
      default:
        return 'text-gray-700 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {/* 상태 표시 */}
      <div className={`flex items-center gap-2 p-3 rounded-lg border ${getStatusColor()}`}>
        {getStatusIcon()}
        <div className="flex-1">
          <div className="font-medium text-sm">{getStatusMessage()}</div>
          {lastFixTime && (
            <div className="text-xs opacity-75">
              마지막 수정: {lastFixTime.toLocaleTimeString('ko-KR')}
            </div>
          )}
        </div>
      </div>

      {/* 수정 버튼 */}
      {(dataStatus === 'hidden' || dataStatus === 'no_data' || dataStatus === 'error') && (
        <button
          onClick={fixTickerDisplay}
          disabled={isFixing}
          className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white p-3 rounded-lg 
                   min-h-[44px] touch-manipulation active:scale-95 transition-transform
                   disabled:opacity-50 disabled:cursor-not-allowed
                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          aria-label="티커 표시 문제 수정"
        >
          <Zap className="w-4 h-4" />
          <span className="font-medium">
            {isFixing ? '수정 중...' : '티커 표시 수정'}
          </span>
        </button>
      )}

      {/* 디버그 정보 토글 */}
      <button
        onClick={() => setShowDebug(!showDebug)}
        className="w-full text-xs text-gray-500 underline py-2 touch-manipulation"
        aria-label="디버그 정보 토글"
      >
        {showDebug ? '디버그 정보 숨기기' : '디버그 정보 보기'}
      </button>

      {/* 디버그 정보 */}
      {showDebug && (
        <div className="text-xs bg-gray-100 p-3 rounded border space-y-2 font-mono">
          <div><strong>티커 요소 발견:</strong> {debugInfo.hasTickerElement ? 'Yes' : 'No'}</div>
          <div><strong>요소 숨김:</strong> {debugInfo.elementHidden ? 'Yes' : 'No'}</div>
          <div><strong>요소 크기:</strong> {debugInfo.elementWidth}×{debugInfo.elementHeight}px</div>
          <div><strong>데이터 존재:</strong> {debugInfo.hasData ? 'Yes' : 'No'}</div>
          <div><strong>온도 측정값:</strong> {debugInfo.temperatureReadings}개</div>
          <div><strong>window.weatherData:</strong> {debugInfo.weatherDataExists ? 'Exists' : 'Missing'}</div>
          <div><strong>마지막 확인:</strong> {debugInfo.timestamp ? new Date(debugInfo.timestamp).toLocaleTimeString('ko-KR') : 'N/A'}</div>
          
          <div className="mt-2 pt-2 border-t border-gray-300">
            <div className="text-gray-600">
              🛠️ <strong>문제 해결 순서:</strong><br/>
              1. 데이터 새로고침<br/>
              2. DOM 이벤트 발생<br/>
              3. 컴포넌트 리렌더링<br/>
              4. 표시 상태 확인
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

MobileTickerFix.propTypes = {
  className: PropTypes.string,
  onDataUpdated: PropTypes.func,
};

export default MobileTickerFix;