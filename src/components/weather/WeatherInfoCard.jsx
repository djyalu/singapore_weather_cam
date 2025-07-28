import React from 'react';
import PropTypes from 'prop-types';
import { Thermometer, Droplets, Cloud, Wind, Eye, Sun, MapPin, Clock, TrendingUp } from 'lucide-react';

const WeatherInfoCard = React.memo(({ weatherData, className = '' }) => {
  if (!weatherData || !weatherData.current) {
    return (
      <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <Cloud className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p>날씨 정보 로딩 중...</p>
        </div>
      </div>
    );
  }

  const { current, locations } = weatherData;
  
  // Hwa Chong 주변 스테이션 우선 표시
  const priorityStations = ['S116', 'S121', 'S118'];
  const hwaChongStations = locations?.filter(loc => 
    priorityStations.includes(loc.station_id)
  ) || [];

  const getTemperatureColor = (temp) => {
    if (temp === null || temp === undefined) return 'text-gray-500';
    if (temp > 32) return 'text-red-500';
    if (temp > 28) return 'text-orange-500';
    if (temp > 24) return 'text-yellow-600';
    return 'text-blue-500';
  };

  const getHumidityColor = (humidity) => {
    if (humidity === null || humidity === undefined) return 'text-gray-500';
    if (humidity > 80) return 'text-blue-600';
    if (humidity > 60) return 'text-blue-400';
    return 'text-green-500';
  };

  const getWeatherStatus = (temp, humidity, rainfall) => {
    if (rainfall > 5) return { text: '비 많이 옴', icon: '🌧️', color: 'text-blue-600' };
    if (rainfall > 0.5) return { text: '가벼운 비', icon: '🌦️', color: 'text-blue-500' };
    if (temp > 32) return { text: '매우 더움', icon: '🔥', color: 'text-red-500' };
    if (temp > 28) return { text: '덥고 습함', icon: '☀️', color: 'text-orange-500' };
    if (temp > 24) return { text: '따뜻함', icon: '⛅', color: 'text-yellow-600' };
    return { text: '쾌적함', icon: '😊', color: 'text-green-500' };
  };

  const status = getWeatherStatus(current.temperature, current.humidity, current.rainfall);

  return (
    <div className={`bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl shadow-lg border border-blue-200 ${className}`}>
      {/* 헤더 */}
      <div className="p-6 border-b border-blue-200 bg-white bg-opacity-50 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-purple-600" />
              🏫 Hwa Chong 날씨 정보
            </h2>
            <p className="text-sm text-gray-600 mt-1">663 Bukit Timah Road 중심</p>
          </div>
          <div className="text-right">
            <div className={`text-2xl ${status.color} font-bold flex items-center gap-2`}>
              <span>{status.icon}</span>
              <span>{status.text}</span>
            </div>
            {weatherData.timestamp && (
              <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(weatherData.timestamp).toLocaleString('ko-KR', {
                  timeZone: 'Asia/Singapore',
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* 메인 날씨 정보 */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* 온도 */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Thermometer className={`w-5 h-5 ${getTemperatureColor(current.temperature)}`} />
                <span className="font-medium text-gray-700">온도</span>
              </div>
              <TrendingUp className="w-4 h-4 text-gray-400" />
            </div>
            <div className={`text-3xl font-bold ${getTemperatureColor(current.temperature)}`}>
              {current.temperature ? `${Math.round(current.temperature * 10) / 10}°C` : '--°C'}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              체감: {current.feelsLike ? `${Math.round(current.feelsLike * 10) / 10}°C` : '--°C'}
            </p>
          </div>

          {/* 습도 */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Droplets className={`w-5 h-5 ${getHumidityColor(current.humidity)}`} />
                <span className="font-medium text-gray-700">습도</span>
              </div>
              <Eye className="w-4 h-4 text-gray-400" />
            </div>
            <div className={`text-3xl font-bold ${getHumidityColor(current.humidity)}`}>
              {current.humidity ? `${Math.round(current.humidity)}%` : '--%'}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {(current.humidity || 0) > 80 ? '매우 습함' : 
               (current.humidity || 0) > 60 ? '습함' : '건조함'}
            </p>
          </div>

          {/* 강수량 */}
          <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Cloud className="w-5 h-5 text-purple-500" />
                <span className="font-medium text-gray-700">강수량</span>
              </div>
              <Sun className="w-4 h-4 text-gray-400" />
            </div>
            <div className="text-3xl font-bold text-purple-600">
              {current.rainfall !== null ? `${Math.round(current.rainfall * 10) / 10}mm` : '0mm'}
            </div>
            <p className="text-sm text-gray-500 mt-1">
              {(current.rainfall || 0) > 0 ? '비 감지됨' : '맑음'}
            </p>
          </div>
        </div>

        {/* 추가 정보 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <Wind className="w-4 h-4 text-gray-500" />
              <span className="font-medium text-gray-700">바람</span>
            </div>
            <p className="text-lg font-semibold text-gray-800">
              {current.windDirection || 'Variable'} 
              {current.windSpeed && ` ${current.windSpeed}km/h`}
            </p>
          </div>
          
          <div className="bg-white rounded-lg p-4 shadow-sm border border-blue-100">
            <div className="flex items-center gap-2 mb-2">
              <Eye className="w-4 h-4 text-gray-500" />
              <span className="font-medium text-gray-700">가시성</span>
            </div>
            <p className="text-lg font-semibold text-gray-800">
              {current.visibility || '양호'}
            </p>
          </div>
        </div>

        {/* Hwa Chong 주변 스테이션 정보 */}
        {hwaChongStations.length > 0 && (
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <h3 className="font-medium text-purple-800 mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              🏫 Hwa Chong 주변 스테이션
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {hwaChongStations.map((station) => (
                <div key={station.id} className="bg-white rounded-lg p-3 shadow-sm">
                  <div className="text-sm font-medium text-gray-800 mb-1">
                    {station.displayName || station.name}
                  </div>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span>온도:</span>
                      <span className={`font-medium ${getTemperatureColor(station.temperature)}`}>
                        {station.temperature ? `${Math.round(station.temperature * 10) / 10}°C` : '--°C'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>습도:</span>
                      <span className={`font-medium ${getHumidityColor(station.humidity)}`}>
                        {station.humidity ? `${Math.round(station.humidity)}%` : '--%'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>강수:</span>
                      <span className="font-medium text-purple-600">
                        {station.rainfall !== null ? `${Math.round(station.rainfall * 10) / 10}mm` : '0mm'}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

WeatherInfoCard.propTypes = {
  weatherData: PropTypes.shape({
    timestamp: PropTypes.string,
    current: PropTypes.shape({
      temperature: PropTypes.number,
      humidity: PropTypes.number,
      rainfall: PropTypes.number,
      windSpeed: PropTypes.number,
      windDirection: PropTypes.string,
      feelsLike: PropTypes.number,
      visibility: PropTypes.string,
    }),
    locations: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string,
      name: PropTypes.string,
      displayName: PropTypes.string,
      station_id: PropTypes.string,
      temperature: PropTypes.number,
      humidity: PropTypes.number,
      rainfall: PropTypes.number,
    })),
  }),
  className: PropTypes.string,
};

WeatherInfoCard.displayName = 'WeatherInfoCard';

export default WeatherInfoCard;