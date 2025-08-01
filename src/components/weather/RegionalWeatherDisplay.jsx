import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { MapPin, Thermometer, Droplets, Wind, Cloud } from 'lucide-react';

/**
 * Regional Weather Display - Shows accurate data for major Singapore regions
 * 
 * Features:
 * - Hwa Chong, Newton, Changi region-specific data
 * - Real station data mapping (not averages)
 * - Proper fallback logic for missing data
 * - Responsive design for all screen sizes
 */
const RegionalWeatherDisplay = React.memo(({ weatherData, className = '' }) => {
  // Define major regions with their priority stations
  const regionalMapping = useMemo(() => {
    return {
      'hwa_chong': {
        name: 'Hwa Chong',
        displayName: 'Hwa Chong International School',
        priorityStations: ['S50', 'S104', 'S109'], // Clementi, Jurong West, Ang Mo Kio
        coordinates: { lat: 1.3437, lng: 103.7640 },
        icon: '🏫'
      },
      'newton': {
        name: 'Newton',
        displayName: 'Newton Area',
        priorityStations: ['S115', 'S109', 'S106'], // Toa Payoh, Ang Mo Kio, Tai Seng
        coordinates: { lat: 1.3138, lng: 103.8420 },
        icon: '🏙️'
      },
      'changi': {
        name: 'Changi',
        displayName: 'Changi Airport Area',
        priorityStations: ['S107', 'S106', 'S115'], // East Coast, Tai Seng, Toa Payoh
        coordinates: { lat: 1.3644, lng: 103.9915 },
        icon: '✈️'
      }
    };
  }, []);

  // Get regional weather data with accurate station mapping
  const getRegionalData = useMemo(() => {
    if (!weatherData?.data) return {};

    const regions = {};
    
    Object.entries(regionalMapping).forEach(([regionId, regionInfo]) => {
      let bestStation = null;
      let stationData = null;

      // Find the best available station for this region
      for (const stationId of regionInfo.priorityStations) {
        // Check temperature data
        const tempReading = weatherData.data.temperature?.readings?.find(r => r.station === stationId);
        if (tempReading) {
          bestStation = stationId;
          stationData = {
            temperature: tempReading.value,
            stationName: tempReading.station_name,
            coordinates: tempReading.coordinates
          };
          break;
        }
      }

      // Add humidity data if available
      if (bestStation) {
        const humidityReading = weatherData.data.humidity?.readings?.find(r => r.station === bestStation);
        if (humidityReading) {
          stationData.humidity = humidityReading.value;
        }

        // Add rainfall data if available  
        const rainfallReading = weatherData.data.rainfall?.readings?.find(r => r.station === bestStation);
        if (rainfallReading) {
          stationData.rainfall = rainfallReading.value;
        }

        // Add wind data if available
        const windSpeedReading = weatherData.data.wind_speed?.readings?.find(r => r.station === bestStation);
        if (windSpeedReading) {
          stationData.windSpeed = windSpeedReading.value;
        }

        const windDirReading = weatherData.data.wind_direction?.readings?.find(r => r.station === bestStation);
        if (windDirReading) {
          stationData.windDirection = windDirReading.value;
        }
      }

      // Fallback to average data if no specific station found
      if (!stationData && weatherData.data.temperature?.average) {
        stationData = {
          temperature: weatherData.data.temperature.average,
          humidity: weatherData.data.humidity?.average,
          rainfall: weatherData.data.rainfall?.average || 0,
          windSpeed: weatherData.data.wind_speed?.average,
          stationName: 'Singapore Average',
          isAverage: true
        };
      }

      if (stationData) {
        regions[regionId] = {
          ...regionInfo,
          data: stationData,
          stationId: bestStation
        };
      }
    });

    return regions;
  }, [weatherData, regionalMapping]);

  const regionData = getRegionalData;

  if (!weatherData || Object.keys(regionData).length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-lg border border-gray-200 p-6 ${className}`}>
        <div className="text-center text-gray-500">
          <MapPin className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p>Regional weather data unavailable</p>
        </div>
      </div>
    );
  }

  const formatTemperature = (temp) => {
    if (temp === null || temp === undefined) return '--';
    return `${Math.round(temp)}°C`;
  };

  const formatHumidity = (humidity) => {
    if (humidity === null || humidity === undefined) return '--';
    return `${Math.round(humidity)}%`;
  };

  const formatRainfall = (rainfall) => {
    if (rainfall === null || rainfall === undefined) return '0';
    return `${rainfall.toFixed(1)}mm`;
  };

  const formatWindSpeed = (windSpeed) => {
    if (windSpeed === null || windSpeed === undefined) return '--';
    return `${windSpeed.toFixed(1)} km/h`;
  };

  const getTemperatureColor = (temp) => {
    if (temp === null || temp === undefined) return 'text-gray-600';
    if (temp >= 32) return 'text-red-600';
    if (temp >= 28) return 'text-orange-600';
    if (temp >= 24) return 'text-yellow-600';
    return 'text-blue-600';
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <MapPin className="w-5 h-5 text-blue-600" />
          주요 지역 날씨
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          실시간 관측소 데이터 기반 ({Object.keys(regionData).length}개 지역)
        </p>
      </div>

      {/* Regional Weather Cards */}
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(regionData).map(([regionId, region]) => (
            <div
              key={regionId}
              className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg p-4 border border-blue-200 hover:shadow-md transition-shadow"
            >
              {/* Region Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{region.icon}</span>
                  <div>
                    <h4 className="font-semibold text-gray-900">{region.name}</h4>
                    <p className="text-xs text-gray-600">{region.displayName}</p>
                  </div>
                </div>
                {!region.data.isAverage && region.stationId && (
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-medium">
                    {region.stationId}
                  </span>
                )}
              </div>

              {/* Temperature - Primary Display */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <Thermometer className="w-4 h-4 text-orange-500" />
                  <span className="text-sm font-medium text-gray-700">온도</span>
                </div>
                <div className={`text-3xl font-bold ${getTemperatureColor(region.data.temperature)}`}>
                  {formatTemperature(region.data.temperature)}
                </div>
                {region.data.stationName && !region.data.isAverage && (
                  <p className="text-xs text-gray-500 mt-1">
                    {region.data.stationName}
                  </p>
                )}
              </div>

              {/* Additional Weather Data */}
              <div className="space-y-2">
                {/* Humidity */}
                {region.data.humidity !== undefined && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Droplets className="w-3 h-3 text-blue-500" />
                      <span className="text-sm text-gray-600">습도</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {formatHumidity(region.data.humidity)}
                    </span>
                  </div>
                )}

                {/* Rainfall */}
                {region.data.rainfall !== undefined && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cloud className="w-3 h-3 text-gray-500" />
                      <span className="text-sm text-gray-600">강수량</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {formatRainfall(region.data.rainfall)}
                    </span>
                  </div>
                )}

                {/* Wind Speed */}
                {region.data.windSpeed !== undefined && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wind className="w-3 h-3 text-green-500" />
                      <span className="text-sm text-gray-600">풍속</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">
                      {formatWindSpeed(region.data.windSpeed)}
                    </span>
                  </div>
                )}
              </div>

              {/* Data Source Indicator */}
              <div className="mt-4 pt-3 border-t border-blue-200">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>
                    {region.data.isAverage ? '평균 데이터' : '실시간 관측소'}
                  </span>
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full ${
                      region.data.isAverage ? 'bg-yellow-400' : 'bg-green-400'
                    }`} />
                    <span>실시간</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Statistics */}
        <div className="mt-6 bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-3">지역별 비교</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div className="text-center">
              <div className="text-lg font-bold text-red-600">
                {Math.max(...Object.values(regionData).map(r => r.data.temperature || 0)).toFixed(1)}°C
              </div>
              <div className="text-gray-600">최고 기온</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">
                {Math.min(...Object.values(regionData).map(r => r.data.temperature || 100)).toFixed(1)}°C
              </div>
              <div className="text-gray-600">최저 기온</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-600">
                {(Object.values(regionData).reduce((sum, r) => sum + (r.data.temperature || 0), 0) / Object.keys(regionData).length).toFixed(1)}°C
              </div>
              <div className="text-gray-600">평균 기온</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

RegionalWeatherDisplay.propTypes = {
  weatherData: PropTypes.shape({
    data: PropTypes.shape({
      temperature: PropTypes.shape({
        readings: PropTypes.array,
        average: PropTypes.number
      }),
      humidity: PropTypes.shape({
        readings: PropTypes.array,
        average: PropTypes.number
      }),
      rainfall: PropTypes.shape({
        readings: PropTypes.array,
        average: PropTypes.number
      }),
      wind_speed: PropTypes.shape({
        readings: PropTypes.array,
        average: PropTypes.number
      }),
      wind_direction: PropTypes.shape({
        readings: PropTypes.array,
        average: PropTypes.number
      })
    })
  }),
  className: PropTypes.string
};

RegionalWeatherDisplay.displayName = 'RegionalWeatherDisplay';

export default RegionalWeatherDisplay;