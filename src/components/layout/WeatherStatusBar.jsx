import React from 'react';
import PropTypes from 'prop-types';
import { Thermometer, Droplets, Cloud, MapPin, Clock } from 'lucide-react';

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
        {/* 전체 평균 - 메인 표시 */}
        {averageData && (
          <div className="mb-4 text-center">
            <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center justify-center">
              <MapPin className="w-5 h-5 mr-2 text-blue-600" />
              🏫 Hwa Chong International School 중심 - 싱가포르 실시간 날씨
            </h3>
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
          </div>
        )}

        {/* 지역별 상세 날씨 스테이션 리스트 */}
        <div className="border-t border-blue-200 pt-3">
          <h4 className="text-sm font-semibold text-gray-700 mb-2 text-center">🌡️ 주요 지역별 날씨 스테이션</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {sortedLocations.slice(0, 8).map((location) => {
              const isPriority = priorityStations.includes(location.station_id);
              return (
                <div
                  key={location.id}
                  className={`rounded-lg p-3 transition-all ${
                    isPriority
                      ? 'bg-blue-100 border-2 border-blue-300 ring-1 ring-blue-400'
                      : 'bg-white border border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <h5 className={`text-sm font-semibold truncate ${
                      isPriority ? 'text-blue-800' : 'text-gray-800'
                    }`}>
                      {isPriority && '⭐ '}
                      {location.displayName || location.name}
                    </h5>
                    <span className="text-xs text-gray-500">{location.station_id}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs space-x-2">
                    <div className="flex items-center space-x-1">
                      <Thermometer className={`w-3 h-3 ${getTemperatureColor(location.temperature)}`} />
                      <span className={`font-medium ${getTemperatureColor(location.temperature)}`}>
                        {formatTemperature(location.temperature)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Droplets className={`w-3 h-3 ${getHumidityColor(location.humidity)}`} />
                      <span className={`font-medium ${getHumidityColor(location.humidity)}`}>
                        {formatHumidity(location.humidity)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Cloud className="w-3 h-3 text-purple-500" />
                      <span className="font-medium text-purple-600">
                        {formatRainfall(location.rainfall)}
                      </span>
                    </div>
                  </div>
                  {isPriority && (
                    <div className="mt-1 text-xs text-blue-600 font-medium">
                      📍 Hwa Chong 주변
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* 타임스탬프 */}
        {weatherData.timestamp && (
          <div className="mt-3 text-center text-xs text-gray-500">
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