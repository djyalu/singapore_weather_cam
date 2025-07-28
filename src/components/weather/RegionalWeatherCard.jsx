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
  humidity,
  rainfall = 0,
  windDirection,
  stationName,
  isActive = false,
  onClick,
  lastUpdate,
  className = ''
}) => {
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
        relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl 
        transition-all duration-300 cursor-pointer transform hover:scale-105
        border border-white/20 backdrop-blur-sm
        ${isActive ? 'ring-2 ring-blue-500 ring-offset-2 shadow-2xl scale-105' : ''}
        bg-gradient-to-br ${cardBg}
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
      {/* 카드보드 텍스처 효과 */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/30 via-transparent to-black/5" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.2),transparent_50%)]" />
      
      {/* Active 상태 표시 */}
      {isActive && (
        <div className="absolute top-2 right-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse shadow-md" />
        </div>
      )}

      <div className="relative p-4">
        {/* 헤더: 지역명과 아이콘 */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl" role="img" aria-label={region}>
              {getRegionEmoji(region)}
            </span>
            <div>
              <h3 className="font-bold text-gray-800 text-sm leading-tight">
                {region}
              </h3>
              {stationName && (
                <p className="text-xs text-gray-600 truncate">
                  {stationName}
                </p>
              )}
            </div>
          </div>
          <MapPin className="w-4 h-4 text-gray-500" />
        </div>

        {/* 메인 온도 표시 */}
        <div className="flex items-center justify-center mb-3">
          <div className="text-center">
            <div className={`text-3xl font-bold ${tempColor} drop-shadow-sm`}>
              {formatTemperature(temperature)}°
            </div>
            <div className="text-xs text-gray-600 mt-1">
              체감온도
            </div>
          </div>
        </div>

        {/* 추가 정보 그리드 */}
        <div className="grid grid-cols-2 gap-2 text-xs">
          {/* 습도 */}
          <div className="flex items-center gap-1 bg-white/40 rounded-lg p-2">
            <Droplet className="w-3 h-3 text-blue-500" />
            <div>
              <div className="font-medium text-gray-700">
                {formatHumidity(humidity)}%
              </div>
              <div className="text-gray-500 text-xs">습도</div>
            </div>
          </div>

          {/* 바람 정보 */}
          <div className="flex items-center gap-1 bg-white/40 rounded-lg p-2">
            <Wind className="w-3 h-3 text-green-500" />
            <div>
              <div className="font-medium text-gray-700">
                {windDirection || '--'}
              </div>
              <div className="text-gray-500 text-xs">바람</div>
            </div>
          </div>
        </div>

        {/* 강우량 표시 (0이 아닐 때만) */}
        {rainfall > 0 && (
          <div className="mt-2 p-2 bg-blue-100/60 rounded-lg border border-blue-200/50">
            <div className="flex items-center gap-1 text-xs">
              <span className="text-blue-600">💧</span>
              <span className="font-medium text-blue-800">
                강우: {Math.round(rainfall * 10) / 10}mm
              </span>
            </div>
          </div>
        )}

        {/* 업데이트 시간 */}
        {lastUpdate && (
          <div className="mt-3 pt-2 border-t border-white/30">
            <div className="flex items-center gap-1 text-xs text-gray-500">
              <Clock className="w-3 h-3" />
              <span>{lastUpdate}</span>
            </div>
          </div>
        )}
      </div>

      {/* 호버 효과 */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300" />
    </div>
  );
});

RegionalWeatherCard.propTypes = {
  region: PropTypes.string.isRequired,
  temperature: PropTypes.number,
  humidity: PropTypes.number,
  rainfall: PropTypes.number,
  windDirection: PropTypes.string,
  stationName: PropTypes.string,
  isActive: PropTypes.bool,
  onClick: PropTypes.func,
  lastUpdate: PropTypes.string,
  className: PropTypes.string,
};

RegionalWeatherCard.displayName = 'RegionalWeatherCard';

export default RegionalWeatherCard;