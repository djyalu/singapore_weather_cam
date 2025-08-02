import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { TrendingUp, TrendingDown, Minus, MapPin, Thermometer, Droplets, Cloud, Wind, Navigation } from 'lucide-react';

/**
 * Station Comparison Component - Multi-Station Analysis Tool
 *
 * Features:
 * - Side-by-side comparison of multiple weather stations
 * - Visual data charts and trend indicators
 * - Performance metrics and data quality scores
 * - Responsive design with mobile optimization
 * - Accessibility compliant interface
 */
const StationComparison = React.memo(({
  stations = [],
  onRemoveStation,
  className = '',
  showDetailedMetrics = true,
}) => {
  // Prepare comparison data
  const comparisonData = useMemo(() => {
    if (stations.length === 0) {return null;}

    const metrics = {
      temperature: stations.map(s => s.currentData?.temperature).filter(Boolean),
      humidity: stations.map(s => s.currentData?.humidity).filter(Boolean),
      rainfall: stations.map(s => s.currentData?.rainfall).filter(Boolean),
      wind_speed: stations.map(s => s.currentData?.wind_speed).filter(Boolean),
    };

    const stats = {};
    Object.keys(metrics).forEach(key => {
      const values = metrics[key];
      if (values.length > 0) {
        stats[key] = {
          min: Math.min(...values),
          max: Math.max(...values),
          avg: values.reduce((sum, val) => sum + val, 0) / values.length,
          range: Math.max(...values) - Math.min(...values),
        };
      }
    });

    return { metrics, stats };
  }, [stations]);

  // Helper functions
  const getDataTypeIcon = (type) => {
    switch (type) {
      case 'temperature': return <Thermometer className="w-4 h-4" />;
      case 'humidity': return <Droplets className="w-4 h-4" />;
      case 'rainfall': return <Cloud className="w-4 h-4" />;
      case 'wind_speed': return <Wind className="w-4 h-4" />;
      case 'wind_direction': return <Navigation className="w-4 h-4" />;
      default: return <MapPin className="w-4 h-4" />;
    }
  };

  const getComparisonIndicator = (value, stats, type) => {
    if (!stats[type] || stats[type].range === 0) {return <Minus className="w-4 h-4 text-gray-400" />;}

    const { min, max, avg } = stats[type];
    const threshold = (max - min) * 0.1; // 10% threshold

    if (value > avg + threshold) {return <TrendingUp className="w-4 h-4 text-red-500" />;}
    if (value < avg - threshold) {return <TrendingDown className="w-4 h-4 text-blue-500" />;}
    return <Minus className="w-4 h-4 text-gray-400" />;
  };

  const formatValue = (value, type) => {
    if (value === null || value === undefined) {return 'N/A';}

    switch (type) {
      case 'temperature':
        return `${value.toFixed(1)}°C`;
      case 'humidity':
        return `${Math.round(value)}%`;
      case 'rainfall':
        return `${value.toFixed(1)}mm`;
      case 'wind_speed':
        return `${value.toFixed(1)} km/h`;
      case 'wind_direction':
        return `${Math.round(value)}°`;
      default:
        return value.toString();
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRegionFromCoordinates = (lat, lng) => {
    if (!lat || !lng) {return 'unknown';}
    if (lat > 1.38) {return 'north';}
    if (lat < 1.28) {return 'south';}
    if (lng > 103.87) {return 'east';}
    if (lng < 103.75) {return 'west';}
    return 'central';
  };

  if (stations.length === 0) {
    return (
      <div className={`bg-white rounded-lg shadow-lg border border-gray-200 p-8 text-center ${className}`}>
        <div className="text-gray-400 mb-4">
          <MapPin className="w-12 h-12 mx-auto" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Stations Selected</h3>
        <p className="text-gray-500">
          Select weather stations from the station selector to compare their data side-by-side.
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900">
            Station Comparison ({stations.length})
          </h3>
          {showDetailedMetrics && comparisonData && (
            <div className="text-sm text-gray-500">
              {comparisonData.stats.temperature && (
                <span>
                  Temp range: {comparisonData.stats.temperature.range.toFixed(1)}°C
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Station
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center justify-center gap-1">
                  <Thermometer className="w-3 h-3" />
                  Temp
                </div>
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center justify-center gap-1">
                  <Droplets className="w-3 h-3" />
                  Humidity
                </div>
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center justify-center gap-1">
                  <Cloud className="w-3 h-3" />
                  Rainfall
                </div>
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                <div className="flex items-center justify-center gap-1">
                  <Wind className="w-3 h-3" />
                  Wind
                </div>
              </th>
              <th className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {stations.map((station, index) => {
              const region = getRegionFromCoordinates(
                station.coordinates?.lat,
                station.coordinates?.lng,
              );
              const distance = station.proximities?.hwa_chong?.distance_km;

              return (
                <tr key={station.station_id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {/* Station Info */}
                  <td className="px-6 py-4">
                    <div className="flex items-start">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {station.name}
                          </p>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(station.priority_level)}`}>
                            {station.priority_level}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {station.station_id}
                          </span>
                          <span className="capitalize">{region}</span>
                          {distance && (
                            <span>{distance.toFixed(1)}km</span>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {station.data_types?.slice(0, 3).map(type => (
                            <span
                              key={type}
                              className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full"
                            >
                              {getDataTypeIcon(type)}
                              {type === 'wind_speed' ? 'wind' :
                                type === 'wind_direction' ? 'dir' : type}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </td>

                  {/* Temperature */}
                  <td className="px-3 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {comparisonData && getComparisonIndicator(
                        station.currentData?.temperature,
                        comparisonData.stats,
                        'temperature',
                      )}
                      <span className={`text-sm font-medium ${
                        station.currentData?.temperature ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        {formatValue(station.currentData?.temperature, 'temperature')}
                      </span>
                    </div>
                  </td>

                  {/* Humidity */}
                  <td className="px-3 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {comparisonData && getComparisonIndicator(
                        station.currentData?.humidity,
                        comparisonData.stats,
                        'humidity',
                      )}
                      <span className={`text-sm font-medium ${
                        station.currentData?.humidity ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        {formatValue(station.currentData?.humidity, 'humidity')}
                      </span>
                    </div>
                  </td>

                  {/* Rainfall */}
                  <td className="px-3 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {comparisonData && getComparisonIndicator(
                        station.currentData?.rainfall,
                        comparisonData.stats,
                        'rainfall',
                      )}
                      <span className={`text-sm font-medium ${
                        station.currentData?.rainfall !== null && station.currentData?.rainfall !== undefined
                          ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        {formatValue(station.currentData?.rainfall, 'rainfall')}
                      </span>
                    </div>
                  </td>

                  {/* Wind Speed */}
                  <td className="px-3 py-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      {comparisonData && getComparisonIndicator(
                        station.currentData?.wind_speed,
                        comparisonData.stats,
                        'wind_speed',
                      )}
                      <span className={`text-sm font-medium ${
                        station.currentData?.wind_speed ? 'text-gray-900' : 'text-gray-400'
                      }`}>
                        {formatValue(station.currentData?.wind_speed, 'wind_speed')}
                      </span>
                    </div>
                    {station.currentData?.wind_direction && (
                      <div className="text-xs text-gray-500 mt-1">
                        {formatValue(station.currentData.wind_direction, 'wind_direction')}
                      </div>
                    )}
                  </td>

                  {/* Actions */}
                  <td className="px-3 py-4 text-center">
                    <button
                      onClick={() => onRemoveStation?.(station)}
                      className="text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 rounded p-1"
                      aria-label={`Remove ${station.name} from comparison`}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Summary Statistics */}
      {showDetailedMetrics && comparisonData && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <h4 className="text-sm font-medium text-gray-900 mb-3">Comparison Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(comparisonData.stats).map(([type, stats]) => (
              <div key={type} className="text-center">
                <div className="flex items-center justify-center gap-1 mb-1">
                  {getDataTypeIcon(type)}
                  <span className="text-xs font-medium text-gray-700 capitalize">
                    {type === 'wind_speed' ? 'Wind' : type}
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-gray-500">
                    Min: <span className="font-medium">{formatValue(stats.min, type)}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Max: <span className="font-medium">{formatValue(stats.max, type)}</span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Avg: <span className="font-medium">{formatValue(stats.avg, type)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-center gap-6 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-red-500" />
            Above average
          </div>
          <div className="flex items-center gap-1">
            <Minus className="w-3 h-3 text-gray-400" />
            Near average
          </div>
          <div className="flex items-center gap-1">
            <TrendingDown className="w-3 h-3 text-blue-500" />
            Below average
          </div>
        </div>
      </div>
    </div>
  );
});

StationComparison.propTypes = {
  stations: PropTypes.arrayOf(
    PropTypes.shape({
      station_id: PropTypes.string.isRequired,
      name: PropTypes.string.isRequired,
      coordinates: PropTypes.shape({
        lat: PropTypes.number,
        lng: PropTypes.number,
      }),
      data_types: PropTypes.array,
      priority_level: PropTypes.string,
      proximities: PropTypes.object,
      currentData: PropTypes.shape({
        temperature: PropTypes.number,
        humidity: PropTypes.number,
        rainfall: PropTypes.number,
        wind_speed: PropTypes.number,
        wind_direction: PropTypes.number,
      }),
    }),
  ),
  onRemoveStation: PropTypes.func,
  className: PropTypes.string,
  showDetailedMetrics: PropTypes.bool,
};

StationComparison.displayName = 'StationComparison';

export default StationComparison;