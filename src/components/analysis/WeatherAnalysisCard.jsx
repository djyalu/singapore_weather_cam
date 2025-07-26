import React from 'react';
import PropTypes from 'prop-types';
import {
  MapPin,
  Thermometer,
  Droplets,
  Eye,
  Brain,
  Clock,
  Sun,
  Cloud,
  CloudRain,
  Activity,
} from 'lucide-react';

const WeatherAnalysisCard = React.memo(({
  location,
  animationDelay = 0,
}) => {
  const getWeatherIcon = (condition) => {
    switch (condition) {
      case 'sunny': return <Sun className="w-8 h-8 text-yellow-500" />;
      case 'partly_cloudy': return <Cloud className="w-8 h-8 text-blue-400" />;
      case 'cloudy': return <Cloud className="w-8 h-8 text-gray-500" />;
      case 'light_rain': return <CloudRain className="w-8 h-8 text-blue-600" />;
      default: return <Sun className="w-8 h-8 text-yellow-500" />;
    }
  };

  const getWeatherColor = (condition) => {
    switch (condition) {
      case 'sunny': return 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 shadow-yellow-100';
      case 'partly_cloudy': return 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-blue-100';
      case 'cloudy': return 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200 shadow-gray-100';
      case 'light_rain': return 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-300 shadow-blue-100';
      default: return 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 shadow-yellow-100';
    }
  };

  const getConfidenceColor = (confidence) => {
    if (confidence >= 95) {return 'bg-green-100 text-green-800';}
    if (confidence >= 90) {return 'bg-blue-100 text-blue-800';}
    if (confidence >= 85) {return 'bg-yellow-100 text-yellow-800';}
    return 'bg-red-100 text-red-800';
  };

  const getActivityColor = (level) => {
    switch (level) {
      case 'excellent': return 'bg-green-100 text-green-800';
      case 'good': return 'bg-blue-100 text-blue-800';
      case 'moderate': return 'bg-yellow-100 text-yellow-800';
      case 'poor': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!location) {return null;}

  return (
    <div
      className={`rounded-2xl border-2 shadow-xl p-6 transition-all duration-500 hover:scale-105 hover:shadow-2xl ${getWeatherColor(location.weather?.condition)} animate-fadeInUp`}
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      {/* 카드 헤더 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <MapPin className="w-5 h-5 text-gray-600" />
          <div>
            <h3 className="font-bold text-xl text-gray-900">
              {location.displayName || location.name}
            </h3>
            <p className="text-sm text-gray-600">{location.description}</p>
          </div>
        </div>
        <div className="text-right">
          {getWeatherIcon(location.weather?.condition)}
        </div>
      </div>

      {/* Hwa Chong 우선 표시 */}
      {location.priority === 'primary' && (
        <div className="bg-blue-500 text-white text-xs px-3 py-1 rounded-full inline-block mb-3 animate-pulse">
          🏫 Hwa Chong 중심
        </div>
      )}

      {/* 실시간 상태 표시 */}
      <div className="bg-red-500 text-white text-xs px-2 py-1 rounded-full inline-block mb-3 animate-pulse">
        🔴 LIVE
      </div>

      {/* 날씨 정보 */}
      <div className="space-y-4">
        <div className="bg-white bg-opacity-80 rounded-xl p-4 backdrop-blur-sm">
          <div className="flex justify-between items-center mb-3">
            <span className="font-bold text-lg text-gray-900">
              {location.weather?.description || '날씨 정보 없음'}
            </span>
            {location.analysis?.confidence && (
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${getConfidenceColor(location.analysis.confidence)}`}>
                신뢰도 {location.analysis.confidence}%
              </span>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3 text-sm">
            <div className="flex items-center space-x-2">
              <Thermometer className="w-4 h-4 text-red-500" />
              <span className="font-medium">{location.weather?.temperature || '--'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Droplets className="w-4 h-4 text-blue-500" />
              <span className="font-medium">{location.weather?.humidity || '--'}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4 text-purple-500" />
              <span className="font-medium">{location.weather?.visibility || '--'}</span>
            </div>
          </div>
        </div>

        {/* AI 분석 결과 */}
        {location.ai_analysis && (
          <div className="bg-white bg-opacity-90 rounded-xl p-4 backdrop-blur-sm border-l-4 border-blue-500">
            <h4 className="font-semibold text-sm text-gray-700 mb-2 flex items-center">
              <Brain className="w-4 h-4 mr-2 text-blue-500" />
              🤖 AI 분석
            </h4>
            <div className="space-y-2 text-xs text-gray-700">
              {location.ai_analysis.weather_condition && (
                <p><strong>날씨:</strong> {location.ai_analysis.weather_condition}</p>
              )}
              {location.ai_analysis.nature_condition && (
                <p><strong>자연 상태:</strong> {location.ai_analysis.nature_condition}</p>
              )}
              {location.ai_analysis.traffic_level && (
                <p><strong>교통 상황:</strong> {location.ai_analysis.traffic_level}</p>
              )}
              {location.ai_analysis.urban_activity && (
                <p><strong>도시 활동:</strong> {location.ai_analysis.urban_activity}</p>
              )}
              {location.ai_analysis.residential_area && (
                <p><strong>주거 지역:</strong> {location.ai_analysis.residential_area}</p>
              )}
              {location.ai_analysis.visibility && (
                <p><strong>가시성:</strong> {location.ai_analysis.visibility}</p>
              )}
            </div>
          </div>
        )}

        {/* 상세 관찰 */}
        {location.analysis?.observations && (
          <div className="bg-white bg-opacity-90 rounded-xl p-4 backdrop-blur-sm border-l-4 border-green-500">
            <h4 className="font-semibold text-sm text-gray-700 mb-2 flex items-center">
              <Eye className="w-4 h-4 mr-2 text-green-500" />
              📋 실시간 관찰
            </h4>
            <p className="text-xs text-gray-700 leading-relaxed">{location.analysis.observations}</p>
          </div>
        )}

        {/* 활동 적합성 */}
        {location.activities && (
          <div className="bg-white bg-opacity-90 rounded-xl p-3 backdrop-blur-sm">
            <h4 className="font-semibold text-sm text-gray-700 mb-2 flex items-center">
              <Activity className="w-4 h-4 mr-2 text-orange-500" />
              🎯 활동 적합성
            </h4>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {location.activities.outdoor_activities && (
                <div className="text-center">
                  <div className={`px-2 py-1 rounded ${getActivityColor(location.activities.outdoor_activities)}`}>
                    야외활동
                  </div>
                </div>
              )}
              {location.activities.photography && (
                <div className="text-center">
                  <div className={`px-2 py-1 rounded ${getActivityColor(location.activities.photography)}`}>
                    사진촬영
                  </div>
                </div>
              )}
              {location.activities.tourism && (
                <div className="text-center">
                  <div className={`px-2 py-1 rounded ${getActivityColor(location.activities.tourism)}`}>
                    관광
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 웹캠 이미지 */}
        {location.file_info?.url && (
          <div className="bg-white bg-opacity-90 rounded-xl p-3 backdrop-blur-sm">
            <h4 className="font-semibold text-sm text-gray-700 mb-2">📷 실시간 영상</h4>
            <img
              src={location.file_info.url}
              alt={location.name}
              className="w-full h-32 object-cover rounded-lg"
              loading="lazy"
            />
          </div>
        )}

        {/* 마지막 분석 시간 */}
        <div className="flex justify-between items-center text-xs text-gray-600 pt-2 border-t border-gray-200">
          <span className="flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>
              {location.capture_time
                ? `분석: ${new Date(location.capture_time).toLocaleTimeString('ko-KR')}`
                : '분석 시간 없음'
              }
            </span>
          </span>
          <span className="bg-blue-500 text-white px-2 py-1 rounded-full animate-pulse">실시간</span>
        </div>
      </div>
    </div>
  );
});

WeatherAnalysisCard.propTypes = {
  location: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    displayName: PropTypes.string,
    description: PropTypes.string,
    location: PropTypes.string,
    coordinates: PropTypes.shape({
      lat: PropTypes.number.isRequired,
      lng: PropTypes.number.isRequired,
    }),
    type: PropTypes.string,
    timestamp: PropTypes.string,
    capture_time: PropTypes.string,
    status: PropTypes.string,
    file_info: PropTypes.shape({
      url: PropTypes.string,
      size: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      dimensions: PropTypes.string,
    }),
    ai_analysis: PropTypes.shape({
      weather_condition: PropTypes.string,
      nature_condition: PropTypes.string,
      traffic_level: PropTypes.string,
      urban_activity: PropTypes.string,
      residential_area: PropTypes.string,
      educational_area: PropTypes.string,
      visibility: PropTypes.string,
      air_quality: PropTypes.string,
    }),
    priority: PropTypes.string,
    error: PropTypes.string,
    activities: PropTypes.shape({
      outdoor_activities: PropTypes.string,
      photography: PropTypes.string,
      tourism: PropTypes.string,
    }),
    analysis: PropTypes.shape({
      confidence: PropTypes.number,
      observations: PropTypes.string,
      aiAnalysis: PropTypes.string,
      lastAnalyzed: PropTypes.string,
    }),
    weather: PropTypes.shape({
      condition: PropTypes.string,
      description: PropTypes.string,
      temperature: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      humidity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      visibility: PropTypes.string,
    }),
  }).isRequired,
  animationDelay: PropTypes.number,
};

WeatherAnalysisCard.displayName = 'WeatherAnalysisCard';

export default WeatherAnalysisCard;