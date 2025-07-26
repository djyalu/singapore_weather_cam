import React from 'react';
import PropTypes from 'prop-types';
import { Thermometer, Droplets, Eye } from 'lucide-react';

/**
 * Weather information section component
 * Displays temperature, humidity, visibility with confidence indicator
 */
const WeatherInfoSection = React.memo(({ location, getConfidenceColor }) => {
  const formatValue = (value, unit = '') => {
    if (value === null || value === undefined) {return '--';}
    return `${value}${unit}`;
  };

  return (
    <div className="bg-white bg-opacity-80 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex justify-between items-center mb-3">
        <span className="font-bold text-lg text-gray-900">
          {location.weather?.description || 'Weather data unavailable'}
        </span>
        {location.analysis?.confidence && (
          <span
            className={`text-xs px-3 py-1 rounded-full font-medium ${getConfidenceColor(location.analysis.confidence)}`}
            role="status"
            aria-label={`Analysis confidence: ${location.analysis.confidence}%`}
          >
            {location.analysis.confidence}% confidence
          </span>
        )}
      </div>

      <div className="grid grid-cols-3 gap-3 text-sm">
        <div className="flex items-center space-x-2" role="group" aria-label="Temperature">
          <Thermometer className="w-4 h-4 text-red-500" aria-hidden="true" />
          <span className="font-medium">
            {formatValue(location.weather?.temperature, '°C')}
          </span>
        </div>

        <div className="flex items-center space-x-2" role="group" aria-label="Humidity">
          <Droplets className="w-4 h-4 text-blue-500" aria-hidden="true" />
          <span className="font-medium">
            {formatValue(location.weather?.humidity, '%')}
          </span>
        </div>

        <div className="flex items-center space-x-2" role="group" aria-label="Visibility">
          <Eye className="w-4 h-4 text-purple-500" aria-hidden="true" />
          <span className="font-medium">
            {formatValue(location.weather?.visibility)}
          </span>
        </div>
      </div>
    </div>
  );
});

WeatherInfoSection.propTypes = {
  location: PropTypes.shape({
    weather: PropTypes.shape({
      description: PropTypes.string,
      temperature: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      humidity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      visibility: PropTypes.string,
    }),
    analysis: PropTypes.shape({
      confidence: PropTypes.number,
    }),
  }).isRequired,
  getConfidenceColor: PropTypes.func.isRequired,
};

WeatherInfoSection.displayName = 'WeatherInfoSection';

export default WeatherInfoSection;