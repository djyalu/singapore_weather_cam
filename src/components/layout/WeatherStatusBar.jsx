import React from 'react';
import PropTypes from 'prop-types';
import { Thermometer, Droplets, Cloud, MapPin, Clock } from 'lucide-react';
import WeatherInfoCard from '../weather/WeatherInfoCard';

const WeatherStatusBar = React.memo(({ weatherData, className = '' }) => {
  // Hwa Chong International School 우선 표시를 위한 데이터 정렬
  const priorityStations = ['S116', 'S121', 'S118']; // Bukit Timah 지역 스테이션들
  
  // 우선순위에 따라 스테이션 정렬
  const sortedLocations = weatherData?.locations?.slice().sort((a, b) => {
    const aIndex = priorityStations.indexOf(a.station_id);
    const bIndex = priorityStations.indexOf(b.station_id);
    
    // 우선순위 스테이션이면 앞으로
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    
    // 나머지는 알파벳 순
    return (a.name || '').localeCompare(b.name || '');
  }) || [];

  // 전체 평균 데이터 (첫 번째가 'all' ID)
  const averageData = weatherData?.current || weatherData?.locations?.find(loc => loc.id === 'all');

  const formatTemperature = (temp) => {
    if (temp === null || temp === undefined) return '--';
    return `${Math.round(temp * 10) / 10}°C`;
  };

  const formatHumidity = (humidity) => {
    if (humidity === null || humidity === undefined) return '--';
    return `${Math.round(humidity)}%`;
  };

  const formatRainfall = (rainfall) => {
    if (rainfall === null || rainfall === undefined) return '0';
    return `${Math.round(rainfall * 10) / 10}mm`;
  };

  const getTemperatureColor = (temp) => {
    if (temp === null || temp === undefined) return 'text-gray-500';
    if (temp > 32) return 'text-red-500';
    if (temp > 28) return 'text-orange-500';
    if (temp > 24) return 'text-yellow-500';
    return 'text-blue-500';
  };

  const getHumidityColor = (humidity) => {
    if (humidity === null || humidity === undefined) return 'text-gray-500';
    if (humidity > 80) return 'text-blue-600';
    if (humidity > 60) return 'text-blue-400';
    return 'text-green-500';
  };

  if (!weatherData || !weatherData.locations || weatherData.locations.length === 0) {
    return (
      <div className={`bg-gradient-to-r from-blue-50 to-green-50 border-b-2 border-blue-200 py-3 ${className}`}>
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center text-gray-500">
            <Clock className="w-4 h-4 inline mr-2" />
            날씨 데이터 로딩 중...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gradient-to-r from-blue-50 to-green-50 border-b-2 border-blue-200 py-4 ${className}`}>
      <div className="max-w-7xl mx-auto px-4">
        {/* 간단한 요약 바 */}
        <div className="mb-4 text-center">
          <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center justify-center">
            <MapPin className="w-5 h-5 mr-2 text-blue-600" />
            🏫 Hwa Chong International School 중심 - 싱가포르 실시간 날씨
          </h3>
          {averageData && (
            <div className="flex items-center justify-center space-x-8 text-lg">
              <div className="flex items-center space-x-2">
                <Thermometer className={`w-5 h-5 ${getTemperatureColor(averageData.temperature)}`} />
                <span className={`font-bold ${getTemperatureColor(averageData.temperature)}`}>
                  {formatTemperature(averageData.temperature)}
                </span>
                <span className="text-gray-600 text-sm">온도</span>
              </div>
              <div className="flex items-center space-x-2">
                <Droplets className={`w-5 h-5 ${getHumidityColor(averageData.humidity)}`} />
                <span className={`font-bold ${getHumidityColor(averageData.humidity)}`}>
                  {formatHumidity(averageData.humidity)}
                </span>
                <span className="text-gray-600 text-sm">습도</span>
              </div>
              <div className="flex items-center space-x-2">
                <Cloud className="w-5 h-5 text-purple-500" />
                <span className="font-bold text-purple-600">
                  {formatRainfall(averageData.rainfall)}
                </span>
                <span className="text-gray-600 text-sm">강수량</span>
              </div>
            </div>
          )}
        </div>

        {/* 상세 날씨 정보 카드 */}
        <WeatherInfoCard weatherData={weatherData} className="mb-4" />

        {/* 타임스탬프 */}
        {weatherData.timestamp && (
          <div className="text-center text-xs text-gray-500">
            <Clock className="w-3 h-3 inline mr-1" />
            마지막 업데이트: {new Date(weatherData.timestamp).toLocaleString('ko-KR')}
          </div>
        )}
      </div>
    </div>
  );
});

WeatherStatusBar.propTypes = {
  weatherData: PropTypes.shape({
    timestamp: PropTypes.string,
    current: PropTypes.shape({
      temperature: PropTypes.number,
      humidity: PropTypes.number,
      rainfall: PropTypes.number,
    }),
    locations: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      displayName: PropTypes.string,
      station_id: PropTypes.string,
      temperature: PropTypes.number,
      humidity: PropTypes.number,
      rainfall: PropTypes.number,
      priority: PropTypes.string,
    })),
  }),
  className: PropTypes.string,
};

WeatherStatusBar.displayName = 'WeatherStatusBar';

export default WeatherStatusBar;