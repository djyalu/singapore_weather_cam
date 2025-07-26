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
            {location.name}
          </button>
        ))}
      </div>

      {/* Current Weather */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <WeatherCard
          title="Temperature"
          value={`${current?.temperature || '--'}°C`}
          icon="🌡️"
          description={`Feels like ${current?.feelsLike || '--'}°C`}
        />
        <WeatherCard
          title="Humidity"
          value={`${current?.humidity || '--'}%`}
          icon="💧"
          description={current?.humidity > 70 ? 'High humidity' : 'Comfortable'}
        />
        <WeatherCard
          title="Rainfall"
          value={`${current?.rainfall || '0'} mm`}
          icon="🌧️"
          description={current?.rainfall > 0 ? 'Rain detected' : 'No rain'}
        />
        <WeatherCard
          title="Wind"
          value={`${current?.windSpeed || '--'} km/h`}
          icon="💨"
          description={`Direction: ${current?.windDirection || '--'}`}
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
            <p className="text-2xl font-bold">{current?.uvIndex || '--'}</p>
          </div>
          <div className="text-right">
            <p className="text-sm opacity-90">Visibility</p>
            <p className="text-2xl font-bold">{current?.visibility || '--'} km</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherDashboard;