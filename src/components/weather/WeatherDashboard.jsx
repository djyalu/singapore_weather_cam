import { useState } from 'react';
import PropTypes from 'prop-types';
import WeatherCard from './WeatherCard';
import WeatherChart from './WeatherChart';

const WeatherDashboard = ({ data }) => {
  const [selectedLocation, setSelectedLocation] = useState('all');

  console.log('🌤️ WeatherDashboard: Received data:', {
    data: data ? 'present' : 'missing',
    current: data?.current ? 'present' : 'missing',
    locations: data?.locations?.length || 0,
    forecast: data?.forecast?.length || 0,
  });

  if (!data) {
    return (
      <div className="card">
        <p className="text-gray-500 text-center">No weather data available</p>
      </div>
    );
  }

  // Data is already transformed from useDataLoader
  const { current, forecast, locations } = data;

  // Filter data based on selected location
  const getFilteredData = () => {
    if (selectedLocation === 'all') {
      return {
        current,
        forecast,
        locationData: null,
      };
    }

    const selectedLocationData = locations?.find(loc => loc.id === selectedLocation);
    return {
      current: selectedLocationData ? {
        temperature: selectedLocationData.temperature,
        humidity: selectedLocationData.humidity,
        rainfall: selectedLocationData.rainfall,
        feelsLike: current?.feelsLike,
        windSpeed: current?.windSpeed,
        windDirection: current?.windDirection,
        uvIndex: current?.uvIndex,
        visibility: current?.visibility,
      } : current,
      forecast,
      locationData: selectedLocationData,
    };
  };

  const filteredData = getFilteredData();

  return (
    <div className="space-y-6">
      {/* Location Selector - Enhanced for Mobile */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3">
        <button
          onClick={() => setSelectedLocation('all')}
          className={`px-3 sm:px-4 py-3 sm:py-2 rounded-lg text-sm sm:text-base font-medium transition-all duration-200 
                     touch-manipulation min-h-[44px] sm:min-h-auto active:scale-95 ${
            selectedLocation === 'all'
              ? 'bg-singapore-red text-white shadow-md'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300 active:bg-gray-400'
          }`}
          aria-pressed={selectedLocation === 'all'}
        >
          <span className="flex items-center justify-center">
            <span className="hidden xs:inline">All Singapore</span>
            <span className="xs:hidden">전체</span>
          </span>
        </button>
        {locations?.map((location) => (
          <button
            key={location.id}
            onClick={() => setSelectedLocation(location.id)}
            className={`px-3 sm:px-4 py-3 sm:py-2 rounded-lg text-sm sm:text-base font-medium transition-all duration-200 
                       touch-manipulation min-h-[44px] sm:min-h-auto active:scale-95 ${
              selectedLocation === location.id
                ? 'bg-singapore-red text-white shadow-md'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300 active:bg-gray-400'
            }`}
            aria-pressed={selectedLocation === location.id}
            title={location.displayName || location.name}
          >
            <span className="truncate">
              {location.displayName || location.name}
            </span>
          </button>
        ))}
      </div>

      {/* Selected Location Info */}
      {filteredData.locationData && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-2xl mr-3">📍</div>
            <div>
              <h3 className="font-semibold text-blue-900">{filteredData.locationData.displayName}</h3>
              <p className="text-sm text-blue-700">{filteredData.locationData.description}</p>
              <p className="text-xs text-blue-600">
                Station: {filteredData.locationData.station_id} • Priority: {filteredData.locationData.priority}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Current Weather - Mobile Optimized Grid */}
      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <WeatherCard
          title="Temperature"
          value={`${filteredData.current?.temperature || '--'}°C`}
          icon="🌡️"
          description={`Feels like ${filteredData.current?.feelsLike || '--'}°C`}
          className="min-h-[100px] sm:min-h-auto"
        />
        <WeatherCard
          title="Humidity"
          value={`${filteredData.current?.humidity || '--'}%`}
          icon="💧"
          description={filteredData.current?.humidity > 70 ? 'High humidity' : 'Comfortable'}
          className="min-h-[100px] sm:min-h-auto"
        />
        <WeatherCard
          title="Rainfall"
          value={`${filteredData.current?.rainfall || '0'} mm`}
          icon="🌧️"
          description={filteredData.current?.rainfall > 0 ? 'Rain detected' : 'No rain'}
          className="min-h-[100px] sm:min-h-auto"
        />
        <WeatherCard
          title="Wind"
          value={`${filteredData.current?.windSpeed || '--'} km/h`}
          icon="💨"
          description={`Direction: ${filteredData.current?.windDirection || '--'}`}
          className="min-h-[100px] sm:min-h-auto"
        />
      </div>

      {/* Weather Forecast Chart */}
      {forecast && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">24-Hour Forecast</h3>
          <WeatherChart data={forecast} />
        </div>
      )}

      {/* Additional Info - Mobile Enhanced */}
      <div className="card bg-weather-blue text-white">
        <div className="grid grid-cols-2 gap-4 sm:flex sm:items-center sm:justify-between">
          <div className="text-center sm:text-left">
            <p className="text-xs sm:text-sm opacity-90 mb-1">UV Index</p>
            <p className="text-xl sm:text-2xl font-bold">{filteredData.current?.uvIndex || '--'}</p>
          </div>
          <div className="text-center sm:text-right">
            <p className="text-xs sm:text-sm opacity-90 mb-1">Visibility</p>
            <p className="text-xl sm:text-2xl font-bold">{filteredData.current?.visibility || '--'} km</p>
          </div>
        </div>
      </div>
    </div>
  );
};

WeatherDashboard.propTypes = {
  data: PropTypes.shape({
    current: PropTypes.shape({
      temperature: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      humidity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      rainfall: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      feelsLike: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      windSpeed: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      windDirection: PropTypes.string,
      uvIndex: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      visibility: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }),
    forecast: PropTypes.array,
    locations: PropTypes.arrayOf(PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string,
      displayName: PropTypes.string,
      description: PropTypes.string,
      station_id: PropTypes.string,
      priority: PropTypes.string,
      temperature: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      humidity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      rainfall: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    })),
  }),
};

export default WeatherDashboard;