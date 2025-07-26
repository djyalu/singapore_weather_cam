import { Sun, Cloud, CloudRain } from 'lucide-react';

/**
 * Utility functions for weather-related operations
 * Extracted from WeatherAnalysisCard for better reusability and testing
 */

/**
 * Get weather icon component based on condition
 */
export const getWeatherIcon = (condition) => {
  switch (condition) {
    case 'sunny':
      return <Sun className="w-8 h-8 text-yellow-500" aria-label="Sunny" />;
    case 'partly_cloudy':
      return <Cloud className="w-8 h-8 text-blue-400" aria-label="Partly cloudy" />;
    case 'cloudy':
      return <Cloud className="w-8 h-8 text-gray-500" aria-label="Cloudy" />;
    case 'light_rain':
      return <CloudRain className="w-8 h-8 text-blue-600" aria-label="Light rain" />;
    default:
      return <Sun className="w-8 h-8 text-yellow-500" aria-label="Clear" />;
  }
};

/**
 * Get weather-based background gradient classes
 */
export const getWeatherColor = (condition) => {
  switch (condition) {
    case 'sunny':
      return 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 shadow-yellow-100';
    case 'partly_cloudy':
      return 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-blue-100';
    case 'cloudy':
      return 'bg-gradient-to-br from-gray-50 to-slate-50 border-gray-200 shadow-gray-100';
    case 'light_rain':
      return 'bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-300 shadow-blue-100';
    default:
      return 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200 shadow-yellow-100';
  }
};

/**
 * Get confidence level color classes based on percentage
 */
export const getConfidenceColor = (confidence) => {
  if (confidence >= 95) {
    return 'bg-green-100 text-green-800';
  }
  if (confidence >= 90) {
    return 'bg-blue-100 text-blue-800';
  }
  if (confidence >= 85) {
    return 'bg-yellow-100 text-yellow-800';
  }
  return 'bg-red-100 text-red-800';
};

/**
 * Get activity suitability color classes
 */
export const getActivityColor = (level) => {
  switch (level) {
    case 'excellent':
      return 'bg-green-100 text-green-800';
    case 'good':
      return 'bg-blue-100 text-blue-800';
    case 'moderate':
      return 'bg-yellow-100 text-yellow-800';
    case 'poor':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

/**
 * Format temperature value with unit
 */
export const formatTemperature = (temp) => {
  if (temp === null || temp === undefined) {return '--';}
  return `${temp}°C`;
};

/**
 * Format humidity value with unit
 */
export const formatHumidity = (humidity) => {
  if (humidity === null || humidity === undefined) {return '--';}
  return `${humidity}%`;
};

/**
 * Format timestamp to Singapore time
 */
export const formatSingaporeTime = (timestamp) => {
  if (!timestamp) {return null;}

  try {
    return new Date(timestamp).toLocaleString('en-SG', {
      timeZone: 'Asia/Singapore',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch (error) {
    console.warn('Invalid timestamp format:', timestamp);
    return 'Invalid time';
  }
};

/**
 * Determine weather condition from AI analysis text
 */
export const parseWeatherCondition = (aiAnalysis) => {
  if (!aiAnalysis) {return 'sunny';}

  const condition = aiAnalysis.toLowerCase();
  if (condition.includes('sunny') || condition.includes('clear')) {
    return 'sunny';
  }
  if (condition.includes('cloudy') || condition.includes('overcast')) {
    return 'cloudy';
  }
  if (condition.includes('partly')) {
    return 'partly_cloudy';
  }
  if (condition.includes('rain')) {
    return 'light_rain';
  }
  return 'sunny';
};

/**
 * Validate weather data structure
 */
export const isValidWeatherData = (data) => {
  return data &&
         typeof data === 'object' &&
         (data.weather || data.ai_analysis || data.analysis);
};

/**
 * Get accessibility-friendly weather description
 */
export const getWeatherA11yDescription = (location) => {
  const parts = [];

  if (location.displayName || location.name) {
    parts.push(`Location: ${location.displayName || location.name}`);
  }

  if (location.weather?.description) {
    parts.push(`Weather: ${location.weather.description}`);
  }

  if (location.weather?.temperature) {
    parts.push(`Temperature: ${formatTemperature(location.weather.temperature)}`);
  }

  if (location.analysis?.confidence) {
    parts.push(`Analysis confidence: ${location.analysis.confidence}%`);
  }

  return parts.join(', ');
};