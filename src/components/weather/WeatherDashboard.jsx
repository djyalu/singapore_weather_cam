import { useState } from 'react';
import WeatherCard from './WeatherCard';
import WeatherChart from './WeatherChart';

const WeatherDashboard = ({ data }) => {
  const [selectedLocation, setSelectedLocation] = useState('all');

  if (!data) {
    return (
      <div className="card">
        <p className="text-gray-500 text-center">No weather data available</p>
      </div>
    );
  }

  const { current, forecast, locations } = data;

  // Filter data based on selected location
  const getFilteredData = () => {
    if (selectedLocation === 'all') {
      return {
        current,
        forecast,
        locationData: null
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
        visibility: current?.visibility
      } : current,
      forecast,
      locationData: selectedLocationData
    };
  };

  const filteredData = getFilteredData();

  return (
    <div className="space-y-6">
      {/* Location Selector */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedLocation('all')}
          className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
            selectedLocation === 'all'
              ? 'bg-singapore-red text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          All Singapore
        </button>
        {locations?.map((location) => (
          <button
            key={location.id}
            onClick={() => setSelectedLocation(location.id)}
            className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
              selectedLocation === location.id
                ? 'bg-singapore-red text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            {location.displayName || location.name}
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

      {/* Current Weather */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <WeatherCard
          title="Temperature"
          value={`${filteredData.current?.temperature || '--'}°C`}
          icon="🌡️"
          description={`Feels like ${filteredData.current?.feelsLike || '--'}°C`}
        />
        <WeatherCard
          title="Humidity"
          value={`${filteredData.current?.humidity || '--'}%`}
          icon="💧"
          description={filteredData.current?.humidity > 70 ? 'High humidity' : 'Comfortable'}
        />
        <WeatherCard
          title="Rainfall"
          value={`${filteredData.current?.rainfall || '0'} mm`}
          icon="🌧️"
          description={filteredData.current?.rainfall > 0 ? 'Rain detected' : 'No rain'}
        />
        <WeatherCard
          title="Wind"
          value={`${filteredData.current?.windSpeed || '--'} km/h`}
          icon="💨"
          description={`Direction: ${filteredData.current?.windDirection || '--'}`}
        />
      </div>

      {/* Weather Forecast Chart */}
      {forecast && (
        <div className="card">
          <h3 className="text-lg font-semibold mb-4">24-Hour Forecast</h3>
          <WeatherChart data={forecast} />
        </div>
      )}

      {/* Additional Info */}
      <div className="card bg-weather-blue text-white">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm opacity-90">UV Index</p>
            <p className="text-2xl font-bold">{filteredData.current?.uvIndex || '--'}</p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-90">Visibility</p>
            <p className="text-2xl font-bold">{filteredData.current?.visibility || '--'} km</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherDashboard;