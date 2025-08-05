/**
 * Mobile Update Guide Component
 * Provides users with clear instructions for getting latest weather data on mobile devices
 */

import React, { useState, useEffect } from 'react';
import { RefreshCw, Smartphone, Wifi, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { useMobileWeatherRefresh } from '../../hooks/useMobileWeatherRefresh';

const MobileUpdateGuide = ({ weatherData, onRefreshSuccess }) => {
  const [isGuideVisible, setIsGuideVisible] = useState(false);
  const [userAgent, setUserAgent] = useState('');
  
  const {
    forceDataRefresh,
    handlePullToRefresh,
    isUpdating,
    updateError,
    lastSuccessfulUpdate,
    isDataStale,
    updateAttempts,
    maxUpdateAttempts
  } = useMobileWeatherRefresh(weatherData);

  useEffect(() => {
    setUserAgent(navigator.userAgent);
    
    // Show guide if data is stale or on mobile devices
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile && isDataStale) {
      setIsGuideVisible(true);
    }
  }, [isDataStale]);

  // Check if data is from August 2nd (the reported problem date)
  const isFromAugust2nd = weatherData?.timestamp && 
    new Date(weatherData.timestamp).toDateString() === new Date('2025-08-02').toDateString();

  const getDataAge = () => {
    if (!weatherData?.timestamp) return '알 수 없음';
    
    const dataTime = new Date(weatherData.timestamp);
    const now = new Date();
    const diffHours = Math.floor((now - dataTime) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((now - dataTime) / (1000 * 60));
    
    if (diffMinutes < 60) return `${diffMinutes}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    
    return dataTime.toLocaleDateString('ko-KR', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleManualRefresh = async () => {
    await forceDataRefresh();
    if (onRefreshSuccess) {
      onRefreshSuccess();
    }
  };

  if (!isGuideVisible && !isFromAugust2nd) {
    return null;
  }

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-start gap-3">
        <Smartphone className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            📱 모바일 최신 정보 업데이트 가이드
          </h3>
          
          {/* Data Status */}
          <div className="mb-3 p-3 bg-white rounded-md border">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-700">
                현재 데이터: <strong>{getDataAge()}</strong>
              </span>
              {isDataStale && (
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                  업데이트 필요
                </span>
              )}
            </div>
            
            {isFromAugust2nd && (
              <div className="flex items-center gap-2 text-amber-700 text-sm">
                <AlertCircle className="w-4 h-4" />
                8월 2일 데이터가 표시되고 있습니다. 아래 방법으로 최신 데이터를 받아보세요.
              </div>
            )}
          </div>

          {/* Manual Refresh Button */}
          <div className="mb-4">
            <button
              onClick={handleManualRefresh}
              disabled={isUpdating}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
              {isUpdating ? '업데이트 중...' : '지금 바로 새로고침'}
            </button>
            
            {updateError && updateAttempts >= maxUpdateAttempts && (
              <p className="text-red-600 text-sm mt-2">
                ❌ {updateError}
              </p>
            )}
            
            {lastSuccessfulUpdate && (
              <p className="text-green-600 text-sm mt-2 flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                마지막 성공: {lastSuccessfulUpdate.toLocaleTimeString('ko-KR')}
              </p>
            )}
          </div>

          {/* Mobile-specific instructions */}
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">1</span>
              <div>
                <strong>스와이프해서 새로고침:</strong> 화면을 아래로 당기면 자동으로 최신 데이터를 가져옵니다.
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">2</span>
              <div>
                <strong>브라우저 새로고침:</strong> 브라우저의 새로고침 버튼을 누르면 캐시가 지워지면서 최신 데이터를 받습니다.
              </div>
            </div>
            
            <div className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">3</span>
              <div>
                <strong>네트워크 확인:</strong> Wi-Fi나 모바일 데이터 연결을 확인해주세요.
                <div className="flex items-center gap-1 mt-1">
                  <Wifi className={`w-4 h-4 ${navigator.onLine ? 'text-green-600' : 'text-red-600'}`} />
                  <span className={navigator.onLine ? 'text-green-600' : 'text-red-600'}>
                    {navigator.onLine ? '온라인' : '오프라인'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-bold">4</span>
              <div>
                <strong>자동 업데이트:</strong> 앱을 다시 열거나 탭을 전환하면 자동으로 최신 데이터를 확인합니다.
              </div>
            </div>
          </div>

          {/* Technical info for debugging */}
          <details className="mt-4">
            <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-800">
              기술 정보 (개발자용)
            </summary>
            <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600 font-mono">
              <div>User Agent: {userAgent.substring(0, 80)}...</div>
              <div>Data Timestamp: {weatherData?.timestamp || 'None'}</div>
              <div>Update Attempts: {updateAttempts}/{maxUpdateAttempts}</div>
              <div>Is Stale: {isDataStale ? 'Yes' : 'No'}</div>
              <div>Last Success: {lastSuccessfulUpdate?.toISOString() || 'None'}</div>
            </div>
          </details>

          {/* Close guide button */}
          <button
            onClick={() => setIsGuideVisible(false)}
            className="mt-3 text-sm text-gray-600 hover:text-gray-800 underline"
          >
            이 가이드 숨기기
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileUpdateGuide;