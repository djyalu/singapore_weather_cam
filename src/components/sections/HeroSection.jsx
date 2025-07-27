import React from 'react';
import TemperatureHero from '../weather/TemperatureHero';
import { useWeatherData } from "../../contexts/AppDataContextSimple";

/**
 * Hero Section Component
 * Displays the main temperature and weather information prominently
 */
const HeroSection = React.memo(() => {
  const { weatherData, isLoading } = useWeatherData();

  if (isLoading) {
    return (
      <section className="mb-8 sm:mb-12" aria-label="Weather hero section loading">
        <div className="bg-gradient-to-br from-blue-600 to-purple-700 rounded-2xl sm:rounded-3xl shadow-2xl p-8 sm:p-12 text-center">
          <div className="animate-spin rounded-full h-12 w-12 sm:h-16 sm:w-16 border-b-4 border-white mx-auto"></div>
          <p className="mt-4 sm:mt-6 text-white text-base sm:text-lg">Loading weather data...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-8 sm:mb-12" aria-label="Current weather conditions">
      <TemperatureHero weatherData={weatherData} />
    </section>
  );
});

HeroSection.displayName = 'HeroSection';

export default HeroSection;