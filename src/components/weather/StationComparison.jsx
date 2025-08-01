import React, { useMemo } from 'react';
import PropTypes from 'prop-types';
import { BarChart3, TrendingUp, MapPin, Clock, Thermometer, Droplets, Cloud, Wind, X } from 'lucide-react';

/**
 * 🔍 ANALYZER + 🎨 FRONTEND: Station Comparison Component
 * 
 * Side-by-side comparison of multiple weather stations:
 * - Real-time data comparison
 * - Visual data charts
 * - Geographic context
 * - Performance metrics
 * - Trend analysis
 */
const StationComparison = React.memo(({ 
  stations = [], 
  stationData = [],
  onRemoveStation,
  className = '' 
}) => {
  // Calculate comparison metrics
  const comparisonMetrics = useMemo(() => {
    if (stationData.length === 0) return null;

    const metrics = {};
    const dataTypes = ['temperature', 'humidity', 'rainfall', 'wind_speed'];
    
    dataTypes.forEach(type => {
      const values = stationData
        .map(station => station.readings?.[type]?.value)
        .filter(val => val !== null && val !== undefined);
        
      if (values.length > 0) {
        metrics[type] = {
          min: Math.min(...values),
          max: Math.max(...values),
          avg: values.reduce((sum, val) => sum + val, 0) / values.length,
          range: Math.max(...values) - Math.min(...values),
          values: values
        };
      }
    });

    return metrics;
  }, [stationData]);

  // Get data type icon
  const getDataTypeIcon = (type) => {
    const icons = {
      temperature: Thermometer,
      humidity: Droplets,
      rainfall: Cloud,
      wind_speed: Wind,
      wind_direction: Wind
    };
    return icons[type] || BarChart3;
  };

  // Get data type unit
  const getDataTypeUnit = (type) => {
    const units = {
      temperature: '°C',
      humidity: '%',
      rainfall: 'mm',
      wind_speed: 'm/s',
      wind_direction: '°'
    };
    return units[type] || '';
  };

  // Format value with appropriate precision
  const formatValue = (value, type) => {
    if (value === null || value === undefined) return '--';
    
    if (type === 'temperature' || type === 'rainfall' || type === 'wind_speed') {
      return value.toFixed(1);
    }
    if (type === 'humidity' || type === 'wind_direction') {
      return Math.round(value);
    }
    return value.toString();
  };

  // Get value color based on comparison
  const getValueColor = (value, type, metrics) => {
    if (!metrics || !metrics[type] || value === null || value === undefined) {
      return 'text-gray-600';
    }

    const { min, max } = metrics[type];
    if (value === min && value === max) return 'text-gray-600';
    
    if (type === 'temperature') {
      if (value === max) return 'text-red-600';
      if (value === min) return 'text-blue-600';
    } else if (type === 'humidity') {
      if (value === max) return 'text-blue-600';
      if (value === min) return 'text-orange-600';
    } else if (type === 'rainfall') {
      if (value === max) return 'text-blue-600';
      if (value === min) return 'text-green-600';
    } else if (type === 'wind_speed') {
      if (value === max) return 'text-purple-600';
      if (value === min) return 'text-green-600';
    }
    
    return 'text-gray-700';
  };

  // Render comparison table
  const ComparisonTable = () => {
    if (stationData.length === 0) return null;

    const dataTypes = ['temperature', 'humidity', 'rainfall', 'wind_speed'];
    const availableTypes = dataTypes.filter(type => 
      stationData.some(station => station.readings?.[type])
    );

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left p-3 font-medium text-gray-900 min-w-32">
                Data Type
              </th>
              {stationData.map(station => (
                <th key={station.station_id} className="text-center p-3 min-w-24">
                  <div className="space-y-1">
                    <div className="text-sm font-medium text-gray-900">
                      {station.station_id}
                    </div>
                    <div className="text-xs text-gray-500 truncate max-w-20">
                      {station.name}
                    </div>
                  </div>
                </th>
              ))}
              <th className="text-center p-3 font-medium text-gray-600 min-w-20">
                Range
              </th>
            </tr>
          </thead>
          <tbody>
            {availableTypes.map(type => {
              const Icon = getDataTypeIcon(type);
              const unit = getDataTypeUnit(type);
              const typeMetrics = comparisonMetrics?.[type];
              
              return (
                <tr key={type} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-gray-600" />
                      <span className="font-medium text-gray-900 capitalize">
                        {type.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  {stationData.map(station => {
                    const reading = station.readings?.[type];
                    const value = reading?.value;
                    const colorClass = getValueColor(value, type, comparisonMetrics);
                    
                    return (
                      <td key={station.station_id} className="p-3 text-center">
                        <div className={`font-medium ${colorClass}`}>
                          {formatValue(value, type)}
                          {value !== null && value !== undefined && (
                            <span className="text-xs text-gray-500 ml-1">
                              {unit}
                            </span>
                          )}
                        </div>
                      </td>
                    );
                  })}
                  <td className="p-3 text-center">
                    {typeMetrics && (
                      <div className="text-sm text-gray-600">
                        {formatValue(typeMetrics.range, type)}
                        <span className="text-xs text-gray-500 ml-1">
                          {unit}
                        </span>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  // Render station cards for mobile view
  const StationCards = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {stationData.map(station => (
        <div key={station.station_id} className="border border-gray-200 rounded-lg p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div>
              <h4 className="font-medium text-gray-900">
                {station.station_id}
              </h4>
              <p className="text-sm text-gray-600 truncate">
                {station.name}
              </p>
            </div>
            <button
              onClick={() => onRemoveStation?.(station.station_id)}
              className="p-1 text-gray-400 hover:text-gray-600 rounded"
              aria-label={`Remove ${station.name} from comparison`}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Location */}
          {station.coordinates && (
            <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
              <MapPin className="w-3 h-3" />
              <span>
                {station.coordinates.lat?.toFixed(3)}, {station.coordinates.lng?.toFixed(3)}
              </span>
              {station.distance && (
                <span className="ml-2">({station.distance.toFixed(1)}km)</span>
              )}
            </div>
          )}

          {/* Readings */}
          <div className="space-y-2">
            {Object.entries(station.readings || {}).map(([type, reading]) => {
              const Icon = getDataTypeIcon(type);
              const unit = getDataTypeUnit(type);
              const colorClass = getValueColor(reading.value, type, comparisonMetrics);
              
              return (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4 text-gray-500" />
                    <span className="text-sm capitalize">
                      {type.replace('_', ' ')}
                    </span>
                  </div>
                  <span className={`font-medium ${colorClass}`}>
                    {formatValue(reading.value, type)}
                    <span className="text-xs text-gray-500 ml-1">
                      {unit}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>

          {/* Quality indicator */}
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-600">Quality</span>
              <div className="flex items-center gap-1">
                <div className={`w-2 h-2 rounded-full ${
                  (station.reliability_score || 0) >= 0.8 ? 'bg-green-500' :
                  (station.reliability_score || 0) >= 0.6 ? 'bg-yellow-500' : 'bg-red-500'
                }`} />
                <span className="text-gray-700">
                  {Math.round((station.reliability_score || 0) * 100)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  if (stations.length === 0) {
    return (
      <div className={`bg-white rounded-lg border border-gray-200 p-8 text-center ${className}`}>
        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No Stations Selected
        </h3>
        <p className="text-gray-600">
          Select weather stations from the selector above to compare their data.
        </p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border border-gray-200 ${className}`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">
              Station Comparison
            </h3>
          </div>
          <div className="flex items-center gap-4 text-sm text-gray-600">
            <span>{stations.length} stations</span>
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>Real-time</span>
            </div>
          </div>
        </div>

        {/* Summary metrics */}
        {comparisonMetrics && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
            {Object.entries(comparisonMetrics).map(([type, metrics]) => {
              const Icon = getDataTypeIcon(type);
              const unit = getDataTypeUnit(type);
              
              return (
                <div key={type} className="text-center">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Icon className="w-4 h-4 text-gray-500" />
                    <span className="text-xs text-gray-600 capitalize">
                      {type.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium text-gray-900">
                      {formatValue(metrics.avg, type)}
                    </span>
                    <span className="text-xs text-gray-500 ml-1">
                      {unit} avg
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    Range: {formatValue(metrics.range, type)}{unit}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Desktop table view */}
        <div className="hidden lg:block">
          <ComparisonTable />
        </div>

        {/* Mobile card view */}
        <div className="lg:hidden">
          <StationCards />
        </div>
      </div>

      {/* Footer with insights */}
      {comparisonMetrics && (
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-start gap-2">
            <TrendingUp className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-gray-700">
              <span className="font-medium">Quick Insights:</span>
              {' '}
              {comparisonMetrics.temperature && (
                <span>
                  Temperature varies by {formatValue(comparisonMetrics.temperature.range, 'temperature')}°C. {' '}
                </span>
              )}
              {comparisonMetrics.humidity && (
                <span>
                  Humidity differs by {formatValue(comparisonMetrics.humidity.range, 'humidity')}%. {' '}
                </span>
              )}
              {comparisonMetrics.rainfall && comparisonMetrics.rainfall.max > 0 && (
                <span>
                  Rainfall detected across {comparisonMetrics.rainfall.values.filter(v => v > 0).length} station(s).
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

StationComparison.propTypes = {
  stations: PropTypes.arrayOf(PropTypes.shape({
    station_id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired
  })).isRequired,
  stationData: PropTypes.arrayOf(PropTypes.shape({
    station_id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    coordinates: PropTypes.shape({
      lat: PropTypes.number,
      lng: PropTypes.number
    }),
    readings: PropTypes.object,
    reliability_score: PropTypes.number,
    distance: PropTypes.number
  })).isRequired,
  onRemoveStation: PropTypes.func,
  className: PropTypes.string
};

StationComparison.displayName = 'StationComparison';

export default StationComparison;