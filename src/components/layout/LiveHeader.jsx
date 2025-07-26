import React, { useState, useEffect } from 'react';
import { Camera, Clock, Wifi, CheckCircle, RefreshCw } from 'lucide-react';

const LiveHeader = ({ systemStats = {} }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      clearInterval(timer);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <>
      {/* 실시간 상태 표시줄 */}
      <div className="bg-green-500 text-white text-center py-2 text-sm font-medium">
        <div className="flex items-center justify-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
            <span>🔴 LIVE • 실시간 분석 중</span>
          </div>
          <span>• 마지막 업데이트: {currentTime.toLocaleTimeString('ko-KR')}</span>
          <div className="flex items-center space-x-1">
            <Wifi className={`w-4 h-4 ${isOnline ? 'text-white' : 'text-red-300'}`} />
            <span className="text-xs">{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
          </div>
        </div>
      </div>

      {/* 메인 헤더 */}
      <div className="bg-white shadow-xl border-b-4 border-blue-500">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 p-3 rounded-xl">
                <Camera className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Singapore Weather Cams
                </h1>
                <p className="text-xl text-gray-600 mt-1">🤖 AI-powered Real-time Weather Analysis</p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                    <CheckCircle className="w-4 h-4" />
                    <span>시스템 정상 운영</span>
                  </span>
                  <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>자동 업데이트 활성화</span>
                  </span>
                  <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-medium">
                    🏫 Hwa Chong 중심
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="bg-gray-50 p-4 rounded-xl border">
                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                  <Clock className="w-4 h-4" />
                  <span>마지막 업데이트: {systemStats.lastUpdate || '정보 없음'}</span>
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <div>📹 {systemStats.totalWebcams || 0}개 웹캠 • 🤖 Claude AI 분석</div>
                  <div>⚡ 처리시간: {systemStats.totalProcessingTime || '0초'} • 🔄 5분마다 업데이트</div>
                  {systemStats.averageConfidence && (
                    <div>🎯 평균 신뢰도: {systemStats.averageConfidence}%</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default LiveHeader;