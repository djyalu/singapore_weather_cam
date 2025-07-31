import React from 'react';
import PropTypes from 'prop-types';
import { MapPin, Thermometer, Droplet, Wind, Clock } from 'lucide-react';

/**
 * 지역별 날씨 정보 카드 컴포넌트
 * 카드보드 스타일로 각 지역의 핵심 날씨 정보를 표시
 */
const RegionalWeatherCard = React.memo(({
  region,
  temperature,
  feelsLike,
  humidity,
  rainfall = 0,
  windDirection,
  weatherDescription,
  weatherIcon,
  stationName,
  isActive = false,
  onClick,
  lastUpdate,
  className = ''
}) => {
  // 디버깅: 받은 props 확인
  console.log(`🔧 RegionalWeatherCard props for ${region}:`, {
    temperature,
    feelsLike,
    weatherDescription,
    weatherIcon,
    humidity,
    rainfall,
    windDirection
  });

  const formatTemperature = (temp) => {
    if (temp === null || temp === undefined) return '--';
    return Math.round(temp * 10) / 10;
  };

  const formatHumidity = (hum) => {
    if (hum === null || hum === undefined) return '--';
    return Math.round(hum);
  };

  const getTemperatureColor = (temp) => {
    if (temp === null || temp === undefined) return 'text-gray-500';
    if (temp > 32) return 'text-red-500';
    if (temp > 28) return 'text-orange-500';
    if (temp > 24) return 'text-blue-500';
    return 'text-blue-600';
  };

  const getTemperatureBackground = (temp) => {
    if (temp === null || temp === undefined) return 'from-gray-100 to-gray-200';
    if (temp > 32) return 'from-red-50 to-red-100';
    if (temp > 28) return 'from-orange-50 to-orange-100';
    if (temp > 24) return 'from-blue-50 to-blue-100';
    return 'from-blue-50 to-indigo-100';
  };

  const getRegionEmoji = (region) => {
    switch (region?.toLowerCase()) {
      case 'hwa chong':
      case 'bukit timah':
        return '🏫';
      case 'newton':
      case 'orchard':
        return '🏙️';
      case 'changi':
      case 'east':
        return '✈️';
      case 'jurong':
      case 'west':
        return '🏭';
      case 'woodlands':
      case 'north':
        return '🌳';
      default:
        return '📍';
    }
  };

  const cardBg = getTemperatureBackground(temperature);
  const tempColor = getTemperatureColor(temperature);

  return (
    <div
      className={`
        relative overflow-hidden rounded-xl shadow-lg border border-gray-100
        transition-all duration-300 cursor-pointer transform hover:scale-[1.02] hover:shadow-xl
        ${isActive ? 'ring-2 ring-blue-500 shadow-xl scale-[1.02]' : ''}
        bg-white
        ${className}
      `}
      onClick={onClick}
      role="button"
      tabIndex="0"
      aria-label={`${region} 지역 날씨 정보. 온도 ${formatTemperature(temperature)}도, 습도 ${formatHumidity(humidity)}퍼센트`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      {/* Active 상태 표시 */}
      {isActive && (
        <div className="absolute top-3 right-3">
          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
        </div>
      )}

      <div className="relative p-4">
        {/* 헤더: 지역명과 날씨 아이콘 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl" role="img" aria-label={region}>
              {getRegionEmoji(region)}
            </span>
            <div>
              <h3 className="font-semibold text-gray-800 text-sm leading-tight">
                {region}
              </h3>
            </div>
          </div>
          {weatherIcon && (
            <span className="text-lg">{weatherIcon}</span>
          )}
        </div>

        {/* 온도 정보 - 컴팩트하게 */}
        <div className="text-center mb-3">
          <div className={`text-2xl font-bold ${tempColor} mb-1`}>
            {formatTemperature(temperature)}°C
          </div>
          {feelsLike !== null && feelsLike !== undefined && (
            <div className="text-sm text-gray-500">
              체감 {formatTemperature(feelsLike)}°C
            </div>
          )}
          {weatherDescription && (
            <div className="text-xs text-gray-600 mt-1">
              {weatherDescription}
            </div>
          )}
        </div>

        {/* 핵심 정보만 간결하게 */}
        <div className="flex justify-between items-center text-xs">
          {/* 습도 */}
          <div className="flex items-center gap-1">
            <Droplet className="w-3 h-3 text-blue-500" />
            <span className="text-gray-700 font-medium">
              {formatHumidity(humidity)}%
            </span>
          </div>

          {/* 바람 정보 (간결하게) */}
          <div className="flex items-center gap-1">
            <Wind className="w-3 h-3 text-green-500" />
            <span className="text-gray-700 font-medium">
              {windDirection || '--'}
            </span>
          </div>

          {/* 강우량 (있을 때만) */}
          {rainfall > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-blue-600">💧</span>
              <span className="text-blue-700 font-medium">
                {Math.round(rainfall * 10) / 10}mm
              </span>
            </div>
          )}
        </div>

        {/* 업데이트 시간 */}
        {lastUpdate && (
          <div className="mt-3 pt-2 border-t border-gray-100">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>{lastUpdate}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

RegionalWeatherCard.propTypes = {
  region: PropTypes.string.isRequired,
  temperature: PropTypes.number,
  feelsLike: PropTypes.number,
  humidity: PropTypes.number,
  rainfall: PropTypes.number,
  windDirection: PropTypes.string,
  weatherDescription: PropTypes.string,
  weatherIcon: PropTypes.string,
  stationName: PropTypes.string,
  isActive: PropTypes.bool,
  onClick: PropTypes.func,
  lastUpdate: PropTypes.string,
  className: PropTypes.string,
};

RegionalWeatherCard.displayName = 'RegionalWeatherCard';

export default RegionalWeatherCard;