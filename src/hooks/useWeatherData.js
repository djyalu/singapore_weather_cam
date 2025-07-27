import { useState, useEffect } from 'react';

export const useWeatherData = () => {
  const [weatherData, setWeatherData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWeatherData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Try to fetch from data files
      try {
        const response = await fetch('/data/weather/latest.json');
        if (response.ok) {
          const data = await response.json();
          setWeatherData(data);
          return;
        }
      } catch (err) {
        console.log('Local data not available, using mock data');
      }

      // Fallback to mock data
      const mockData = {
        stations: [
          {
            id: 'S121',
            name: 'Bukit Timah Nature Reserve',
            temperature: 28.5,
            humidity: 75,
            rainfall: 0.2,
            windSpeed: 8.3,
            area: 'Central',
            isPrimary: true,
            lat: 1.3520,
            lng: 103.7767,
          },
          {
            id: 'S116',
            name: 'Bukit Timah Road',
            temperature: 29.1,
            humidity: 72,
            rainfall: 0.0,
            windSpeed: 7.8,
            area: 'Central',
            isPrimary: true,
            lat: 1.3138,
            lng: 103.8420,
          },
          {
            id: 'S118',
            name: 'Bukit Timah West',
            temperature: 28.8,
            humidity: 74,
            rainfall: 0.1,
            windSpeed: 8.1,
            area: 'West',
            isPrimary: true,
            lat: 1.3162,
            lng: 103.7649,
          },
        ],
        lastUpdate: new Date().toISOString(),
      };

      setWeatherData(mockData);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchWeatherData();
  }, []);

  return {
    weatherData,
    isLoading,
    error,
    refetch: fetchWeatherData,
  };
};