import React from 'react';
import PropTypes from 'prop-types';

/**
 * Status badges component for weather analysis cards
 * Shows priority location indicator and live status
 */
const WeatherCardBadges = React.memo(({ location, showPriority = true, showLive = true }) => {
  return (
    <div className="flex flex-wrap gap-2 mb-3">
      {/* Priority location indicator */}
      {showPriority && location.priority === 'primary' && (
        <div
          className="bg-blue-500 text-white text-xs px-3 py-1 rounded-full inline-block animate-pulse"
          role="status"
          aria-label="Primary location near Bukit Timah Nature Reserve"
        >
          🏫 Bukit Timah Center
        </div>
      )}

      {/* Live status indicator */}
      {showLive && (
        <div
          className="bg-red-500 text-white text-xs px-2 py-1 rounded-full inline-block animate-pulse"
          role="status"
          aria-label="Live data feed"
        >
          🔴 LIVE
        </div>
      )}

      {/* Error status if present */}
      {location.error && (
        <div
          className="bg-orange-500 text-white text-xs px-2 py-1 rounded-full inline-block"
          role="alert"
          aria-label="Data collection error"
        >
          ⚠️ LIMITED DATA
        </div>
      )}
    </div>
  );
});

WeatherCardBadges.propTypes = {
  location: PropTypes.shape({
    priority: PropTypes.string,
    error: PropTypes.string,
  }).isRequired,
  showPriority: PropTypes.bool,
  showLive: PropTypes.bool,
};

WeatherCardBadges.displayName = 'WeatherCardBadges';

export default WeatherCardBadges;