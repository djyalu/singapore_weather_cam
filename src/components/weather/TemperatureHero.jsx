import React from 'react';
import { getStationInfo } from '../../config/weatherStations.js';

/**
 * Hero-style temperature showcase component
 * Displays prominently at the top of the main content area
 */
const TemperatureHero = ({ weatherData, className = '' }) => {
  // Get primary weather data (Newton station - S117)
  const getPrimaryWeatherData = () => {
    if (!weatherData || !weatherData.current) {
      return null;
    }

    // Try to get Newton station data specifically
    const newtonStation = weatherData.locations?.find(
      location => location.station_id === 'S117',
    );

    // Fall back to current average data
    const current = weatherData.current;
    const primaryStation = getStationInfo('S117');

    return {
      temperature: newtonStation?.temperature || current.temperature,
      feelsLike: current.feelsLike,
      description: current.description,
      icon: current.icon,
      location: newtonStation ? primaryStation.name : current.location,
      displayName: newtonStation ? primaryStation.displayName : 'Singapore Average',
      humidity: newtonStation?.humidity || current.humidity,
      windSpeed: current.windSpeed,
      windDirection: current.windDirection,
      timestamp: weatherData.timestamp,
    };
  };

  const primaryData = getPrimaryWeatherData();

  // Loading state
  if (!primaryData) {
    return (
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary-500 to-secondary-500 shadow-2xl ${className}`}>
        <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-black/40" />
        <div className="relative p-8 md:p-12 text-center">
          <div className="animate-pulse">
            <div className="h-8 w-48 bg-white/20 rounded-lg mx-auto mb-4" />
            <div className="h-20 w-40 bg-white/20 rounded-lg mx-auto mb-4" />
            <div className="h-6 w-32 bg-white/20 rounded-lg mx-auto" />
          </div>
        </div>
      </div>
    );
  }

  const formatTemperature = (temp) => {
    if (temp === null || temp === undefined) {return '--';}
    return Math.round(temp);
  };

  const getTemperatureColor = (temp) => {
    if (temp === null || temp === undefined) {return 'text-white';}
    if (temp >= 35) {return 'text-red-100';}
    if (temp >= 32) {return 'text-orange-100';}
    if (temp >= 28) {return 'text-yellow-100';}
    if (temp >= 24) {return 'text-green-100';}
    return 'text-blue-100';
  };

  const getBackgroundGradient = (temp) => {
    if (temp === null || temp === undefined) {return 'from-neutral-500 to-neutral-600';}
    if (temp >= 35) {return 'from-red-500 to-orange-600';}
    if (temp >= 32) {return 'from-orange-500 to-red-500';}
    if (temp >= 28) {return 'from-primary-500 to-secondary-500';}
    if (temp >= 24) {return 'from-secondary-500 to-accent-500';}
    return 'from-secondary-600 to-secondary-700';
  };

  return (
    <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${getBackgroundGradient(primaryData.temperature)} shadow-2xl ${className}`}>
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-black/40" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)]" />

      {/* Content */}
      <div className="relative p-4 sm:p-6 md:p-8 lg:p-12">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 sm:gap-6">

          {/* Main Temperature Display */}
          <div className="text-center lg:text-left flex-1 w-full">
            <div className="flex items-center justify-center lg:justify-start gap-2 sm:gap-3 mb-3 sm:mb-2">
              <span className="text-3xl sm:text-4xl md:text-5xl animate-pulse-slow flex-shrink-0">
                {primaryData.icon}
              </span>
              <div className="text-white/90 text-sm sm:text-sm md:text-base font-medium min-w-0">
                <div className="truncate text-base sm:text-base md:text-lg font-semibold">{primaryData.displayName}</div>
                <div className="text-white/70 text-xs sm:text-xs md:text-sm truncate">
                  {primaryData.description}
                </div>
              </div>
            </div>

            <div className="flex items-baseline justify-center lg:justify-start gap-1 sm:gap-2 mb-3 sm:mb-3">
              <span className={`text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight ${getTemperatureColor(primaryData.temperature)} drop-shadow-lg animate-fade-in`}>
                {formatTemperature(primaryData.temperature)}
              </span>
              <span className="text-xl sm:text-2xl md:text-3xl text-white/80 font-light">
                °C
              </span>
            </div>

            {primaryData.feelsLike && (
              <div className="text-white/80 text-sm sm:text-sm md:text-base mb-4">
                Feels like{' '}
                <span className="font-semibold text-white">
                  {formatTemperature(primaryData.feelsLike)}°C
                </span>
              </div>
            )}
          </div>

          {/* Additional Weather Info */}
          <div className="flex-shrink-0 w-full lg:w-auto">
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4 lg:gap-6">

              {/* Humidity */}
              {primaryData.humidity && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 text-center lg:text-left hover:bg-white/15 transition-all duration-300 group min-h-[80px] sm:min-h-auto flex flex-col justify-center touch-manipulation">
                  <div className="flex items-center justify-center lg:justify-start gap-2 mb-1">
                    <span className="text-base sm:text-lg group-hover:scale-110 transition-transform duration-300">💧</span>
                    <span className="text-white/70 text-xs sm:text-xs uppercase tracking-wide font-medium">
                      Humidity
                    </span>
                  </div>
                  <div className="text-white text-lg sm:text-xl lg:text-2xl font-bold">
                    {Math.round(primaryData.humidity)}%
                  </div>
                </div>
              )}

              {/* Wind */}
              {primaryData.windSpeed && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 text-center lg:text-left hover:bg-white/15 transition-all duration-300 group min-h-[80px] sm:min-h-auto flex flex-col justify-center touch-manipulation">
                  <div className="flex items-center justify-center lg:justify-start gap-2 mb-1">
                    <span className="text-base sm:text-lg group-hover:scale-110 transition-transform duration-300">💨</span>
                    <span className="text-white/70 text-xs sm:text-xs uppercase tracking-wide font-medium">
                      Wind
                    </span>
                  </div>
                  <div className="text-white text-sm sm:text-base lg:text-lg font-semibold">
                    {Math.round(primaryData.windSpeed * 10) / 10} km/h
                  </div>
                  <div className="text-white/60 text-xs truncate">
                    {primaryData.windDirection}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Status Indicator */}
        <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-white/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 text-white/60 text-xs sm:text-xs md:text-sm">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <span className="font-medium">Live Data</span>
            </div>
            <div className="text-center sm:text-right">
              {primaryData.timestamp && (
                <span className="font-mono text-xs sm:text-xs">
                  Updated {new Date(primaryData.timestamp).toLocaleTimeString('en-SG', {
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'Asia/Singapore',
                  })}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </div>
  );
};

export default TemperatureHero;