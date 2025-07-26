import React from 'react';
import { Camera, Brain, Zap, Globe, Clock, AlertCircle } from 'lucide-react';

const SystemStats = ({ 
  totalWebcams = 0, 
  successfulAnalyses = 0, 
  failedAnalyses = 0, 
  averageConfidence = 0,
  lastUpdate = null,
  totalProcessingTime = '0초',
  dominantWeather = 'unknown'
}) => {
  const getWeatherEmoji = (weather) => {
    switch (weather) {
      case 'sunny': return '☀️';
      case 'partly_cloudy': return '⛅';
      case 'cloudy': return '☁️';
      case 'light_rain': return '🌦️';
      case 'rain': return '🌧️';
      default: return '🌤️';
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 95) return 'text-green-600 bg-green-50 border-green-200';
    if (confidence >= 90) return 'text-blue-600 bg-blue-50 border-blue-200';
    if (confidence >= 85) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const stats = [
    {
      label: '총 웹캠',
      value: totalWebcams,
      icon: Camera,
      color: 'blue',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-500',
      textColor: 'text-blue-600'
    },
    {
      label: '분석 성공',
      value: successfulAnalyses,
      icon: Brain,
      color: 'green',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-500',
      textColor: 'text-green-600'
    },
    {
      label: '평균 신뢰도',
      value: `${averageConfidence}%`,
      icon: Zap,
      color: 'purple',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-500',
      textColor: 'text-purple-600'
    },
    {
      label: '주요 날씨',
      value: getWeatherEmoji(dominantWeather),
      icon: Globe,
      color: 'yellow',
      bgColor: 'bg-yellow-50',
      borderColor: 'border-yellow-500',
      textColor: 'text-yellow-600'
    },
    {
      label: '처리 시간',
      value: totalProcessingTime,
      icon: Clock,
      color: 'indigo',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-500',
      textColor: 'text-indigo-600'
    },
    {
      label: '실패',
      value: failedAnalyses,
      icon: AlertCircle,
      color: 'red',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-500',
      textColor: 'text-red-600'
    }
  ];

  return (
    <section className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">📊 시스템 현황</h2>
        <p className="text-gray-600">실시간 웹캠 분석 시스템의 현재 상태</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {stats.map((stat, index) => {
          const IconComponent = stat.icon;
          return (
            <div
              key={index}
              className={`${stat.bgColor} rounded-xl shadow-lg p-6 border-l-4 ${stat.borderColor} hover:shadow-xl transition-shadow duration-300`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className={`text-3xl font-bold ${stat.textColor}`}>
                    {stat.value}
                  </p>
                </div>
                <IconComponent className={`w-8 h-8 ${stat.textColor}`} />
              </div>
            </div>
          );
        })}
      </div>

      {/* 실시간 상태 표시줄 */}
      <div className="bg-gradient-to-r from-green-500 to-blue-600 text-white text-center py-3 rounded-lg shadow-lg">
        <div className="flex items-center justify-center space-x-4 text-sm font-medium">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
            <span>LIVE • 실시간 분석 중</span>
          </div>
          {lastUpdate && (
            <span>• 마지막 업데이트: {new Date(lastUpdate).toLocaleTimeString('ko-KR')}</span>
          )}
        </div>
      </div>

      {/* 신뢰도 표시 */}
      {averageConfidence > 0 && (
        <div className={`mt-4 p-4 rounded-lg border-2 ${getConfidenceColor(averageConfidence)}`}>
          <div className="flex items-center justify-between">
            <span className="font-semibold">시스템 신뢰도</span>
            <span className="text-2xl font-bold">{averageConfidence}%</span>
          </div>
          <div className="mt-2 bg-gray-200 rounded-full h-2">
            <div 
              className="bg-current h-2 rounded-full transition-all duration-500"
              style={{ width: `${averageConfidence}%` }}
            ></div>
          </div>
        </div>
      )}
    </section>
  );
};

export default SystemStats;