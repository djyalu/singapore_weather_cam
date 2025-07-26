import { memo } from 'react';
import PropTypes from 'prop-types';
import { MapPin } from 'lucide-react';

/**
 * Header component for weather analysis cards
 * Displays location name, description, and weather icon
 */
const WeatherCardHeader = memo(({ location, getWeatherIcon }) => {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center space-x-3">
        <MapPin className="w-5 h-5 text-gray-600" aria-hidden="true" />
        <div>
          <h3 className="font-bold text-xl text-gray-900">
            {location.displayName || location.name}
          </h3>
          {location.description && (
            <p className="text-sm text-gray-600">{location.description}</p>
          )}
        </div>
      </div>
      <div className="text-right" aria-label="Weather condition">
        {getWeatherIcon(location.weather?.condition)}
      </div>
    </div>
  );
});

WeatherCardHeader.propTypes = {
  location: PropTypes.shape({
    name: PropTypes.string.isRequired,
    displayName: PropTypes.string,
    description: PropTypes.string,
    weather: PropTypes.shape({
      condition: PropTypes.string,
    }),
  }).isRequired,
  getWeatherIcon: PropTypes.func.isRequired,
};

WeatherCardHeader.displayName = 'WeatherCardHeader';

export default WeatherCardHeader;