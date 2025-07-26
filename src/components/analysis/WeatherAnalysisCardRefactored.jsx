import React from 'react';
import PropTypes from 'prop-types';
import { Clock, Activity, Eye } from 'lucide-react';
import WeatherCardHeader from './WeatherCardHeader';
import WeatherCardBadges from './WeatherCardBadges';
import WeatherInfoSection from './WeatherInfoSection';
import AIAnalysisSection from './AIAnalysisSection';
import {
  getWeatherIcon,
  getWeatherColor,
  getConfidenceColor,
  getActivityColor,
  formatSingaporeTime,
  getWeatherA11yDescription,
} from '../../utils/weatherUtils.jsx';

/**
 * Refactored Weather Analysis Card Component
 * Displays comprehensive weather analysis with AI insights for a specific location
 * Now using smaller, focused sub-components for better maintainability
 */
const WeatherAnalysisCardRefactored = React.memo(({
  location,
  animationDelay = 0,
  showActivities = true,
  showImage = true,
}) => {
  if (!location) {
    return null;
  }

  const weatherCondition = location.weather?.condition || 'sunny';
  const a11yDescription = getWeatherA11yDescription(location);

  return (
    <article
      className={`rounded-2xl border-2 shadow-xl p-6 transition-all duration-500 
                  hover:scale-105 hover:shadow-2xl ${getWeatherColor(weatherCondition)} 
                  animate-fadeInUp`}
      style={{ animationDelay: `${animationDelay}ms` }}
      role="region"
      aria-label={a11yDescription}
    >
      {/* Card Header */}
      <WeatherCardHeader
        location={location}
        getWeatherIcon={getWeatherIcon}
      />

      {/* Status Badges */}
      <WeatherCardBadges location={location} />

      {/* Main Content */}
      <div className="space-y-4">
        {/* Weather Information */}
        <WeatherInfoSection
          location={location}
          getConfidenceColor={getConfidenceColor}
        />

        {/* AI Analysis Results */}
        <AIAnalysisSection location={location} />

        {/* Real-time Observations */}
        {location.analysis?.observations && !location.ai_analysis && (
          <div className="bg-white bg-opacity-90 rounded-xl p-4 backdrop-blur-sm border-l-4 border-green-500">
            <h4 className="font-semibold text-sm text-gray-700 mb-2 flex items-center">
              <Eye className="w-4 h-4 mr-2 text-green-500" aria-hidden="true" />
              📋 Real-time Observations
            </h4>
            <p className="text-xs text-gray-700 leading-relaxed">
              {location.analysis.observations}
            </p>
          </div>
        )}

        {/* Activity Suitability */}
        {showActivities && location.activities && (
          <div className="bg-white bg-opacity-90 rounded-xl p-3 backdrop-blur-sm">
            <h4 className="font-semibold text-sm text-gray-700 mb-2 flex items-center">
              <Activity className="w-4 h-4 mr-2 text-orange-500" aria-hidden="true" />
              🎯 Activity Suitability
            </h4>
            <div className="grid grid-cols-3 gap-2 text-xs">
              {location.activities.outdoor_activities && (
                <div className="text-center">
                  <div
                    className={`px-2 py-1 rounded ${getActivityColor(location.activities.outdoor_activities)}`}
                    role="status"
                    aria-label={`Outdoor activities: ${location.activities.outdoor_activities}`}
                  >
                    Outdoor
                  </div>
                </div>
              )}
              {location.activities.photography && (
                <div className="text-center">
                  <div
                    className={`px-2 py-1 rounded ${getActivityColor(location.activities.photography)}`}
                    role="status"
                    aria-label={`Photography conditions: ${location.activities.photography}`}
                  >
                    Photo
                  </div>
                </div>
              )}
              {location.activities.tourism && (
                <div className="text-center">
                  <div
                    className={`px-2 py-1 rounded ${getActivityColor(location.activities.tourism)}`}
                    role="status"
                    aria-label={`Tourism conditions: ${location.activities.tourism}`}
                  >
                    Tourism
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Webcam Image */}
        {showImage && location.file_info?.url && (
          <div className="bg-white bg-opacity-90 rounded-xl p-3 backdrop-blur-sm">
            <h4 className="font-semibold text-sm text-gray-700 mb-2">
              📷 Live View
            </h4>
            <img
              src={location.file_info.url}
              alt={`Live view of ${location.displayName || location.name}`}
              className="w-full h-32 object-cover rounded-lg transition-opacity duration-300 hover:opacity-90"
              loading="lazy"
              onError={(e) => {
                e.target.style.display = 'none';
              }}
            />
          </div>
        )}

        {/* Footer with Timestamp */}
        <footer className="flex justify-between items-center text-xs text-gray-600 pt-2 border-t border-gray-200">
          <span className="flex items-center space-x-1">
            <Clock className="w-3 h-3" aria-hidden="true" />
            <time dateTime={location.capture_time}>
              {location.capture_time
                ? `Analysis: ${formatSingaporeTime(location.capture_time)}`
                : 'Analysis time unavailable'
              }
            </time>
          </span>
          <span
            className="bg-blue-500 text-white px-2 py-1 rounded-full animate-pulse"
            role="status"
            aria-label="Real-time data"
          >
            Real-time
          </span>
        </footer>
      </div>
    </article>
  );
});

WeatherAnalysisCardRefactored.propTypes = {
  location: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    displayName: PropTypes.string,
    description: PropTypes.string,
    coordinates: PropTypes.shape({
      lat: PropTypes.number.isRequired,
      lng: PropTypes.number.isRequired,
    }),
    capture_time: PropTypes.string,
    status: PropTypes.string,
    priority: PropTypes.string,
    error: PropTypes.string,
    file_info: PropTypes.shape({
      url: PropTypes.string,
      size: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    }),
    ai_analysis: PropTypes.shape({
      weather_condition: PropTypes.string,
      nature_condition: PropTypes.string,
      traffic_level: PropTypes.string,
      urban_activity: PropTypes.string,
      residential_area: PropTypes.string,
      visibility: PropTypes.string,
      air_quality: PropTypes.string,
    }),
    activities: PropTypes.shape({
      outdoor_activities: PropTypes.string,
      photography: PropTypes.string,
      tourism: PropTypes.string,
    }),
    analysis: PropTypes.shape({
      confidence: PropTypes.number,
      observations: PropTypes.string,
    }),
    weather: PropTypes.shape({
      condition: PropTypes.string,
      description: PropTypes.string,
      temperature: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      humidity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      visibility: PropTypes.string,
    }),
  }).isRequired,
  animationDelay: PropTypes.number,
  showActivities: PropTypes.bool,
  showImage: PropTypes.bool,
};

WeatherAnalysisCardRefactored.displayName = 'WeatherAnalysisCardRefactored';

export default WeatherAnalysisCardRefactored;