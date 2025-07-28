import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { INTERVALS, LIMITS, UI_CONFIG, DESIGN_TOKENS } from '../../config/constants';
import { getLocalizedString, UI_STRINGS } from '../../config/localization';
import { getStationInfo } from '../../config/weatherStations.js';
import SkeletonLoader from '../common/SkeletonLoader.jsx';
import { ErrorDisplay, DataError, PartialError, ErrorUtils } from '../common/ErrorComponents.jsx';
import { RefreshCw, AlertTriangle, Thermometer } from 'lucide-react';
import { announceToScreenReader, ariaUtils } from '../../utils/accessibility.js';

/**
 * Hero-style temperature showcase component
 * Displays prominently at the top of the main content area
 * Enhanced with WCAG 2.1 AA accessibility features
 */
const TemperatureHero = React.memo(({
  weatherData,
  className = '',
  error = null,
  isLoading = false,
  onRetry = null,
  hasPartialData = false,
  dataQuality = null,
}) => {
  const [showFallbackData, setShowFallbackData] = useState(false);
  const [temperatureAnnouncement, setTemperatureAnnouncement] = useState('');

  // Refs for accessibility
  const heroRef = useRef(null);
  const retryButtonRef = useRef(null);
  // Get primary weather data (Newton station - S117) - memoized
  const getPrimaryWeatherData = useMemo(() => {
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
  }, [weatherData]);

  // Announce temperature changes to screen readers
  useEffect(() => {
    const primaryData = getPrimaryWeatherData;
    if (primaryData?.temperature && !isLoading && !error) {
      const tempText = `Current temperature: ${Math.round(primaryData.temperature)} degrees Celsius in ${primaryData.displayName}`;
      setTemperatureAnnouncement(tempText);
      announceToScreenReader(tempText, 'polite');
    }
  }, [getPrimaryWeatherData, isLoading, error]);

  const primaryData = getPrimaryWeatherData;

  // Error state handling
  if (error && !hasPartialData) {
    return (
      <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br from-red-500 via-rose-500 to-pink-600 shadow-2xl border border-red-300/20 ${className} animate-scale-in`}>
        {/* Enhanced glassmorphism background */}
        <div className="absolute inset-0 bg-gradient-to-br from-black/10 to-black/30" />
        <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-red-300/10" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.15),transparent_50%)]" />

        <div className="relative p-6 sm:p-8 md:p-10 lg:p-12">
          <div className="text-center">
            <div className="flex items-center justify-center gap-4 mb-8">
              <div className="relative">
                <AlertTriangle className="w-14 h-14 text-white animate-pulse-slow drop-shadow-lg" />
                <div className="absolute inset-0 w-14 h-14 bg-white/20 rounded-full animate-ping" />
              </div>
              <div className="text-white">
                <h2 className="text-2xl font-bold mb-2 drop-shadow-md">온도 데이터 불가</h2>
                <p className="text-white/90 text-base backdrop-blur-sm bg-white/10 px-4 py-2 rounded-lg">
                  {ErrorUtils.getFriendlyMessage(error)}
                </p>
              </div>
            </div>

            <div className="text-7xl sm:text-8xl md:text-9xl font-bold text-white/70 mb-6 drop-shadow-2xl tracking-tight">
              --°C
            </div>

            {onRetry && ErrorUtils.isRecoverable(error) && (
              <button
                onClick={onRetry}
                className="group inline-flex items-center gap-3 px-8 py-4 bg-white/20 hover:bg-white/30
                           text-white rounded-2xl transition-all duration-300 backdrop-blur-md
                           focus:outline-none focus:ring-4 focus:ring-white/40 focus:ring-offset-2 focus:ring-offset-transparent
                           hover:scale-105 active:scale-95 transform shadow-lg hover:shadow-xl border border-white/20"
              >
                <RefreshCw className="w-5 h-5 group-hover:rotate-180 transition-transform duration-500" />
                <span className="font-semibold text-lg">다시 시도</span>
              </button>
            )}
          </div>
        </div>

        <div
          className="sr-only"
          role="alert"
          aria-live="assertive"
          aria-atomic="true"
        >
          Weather data could not be loaded: {error?.message || 'Unknown error'}
        </div>
      </div>
    );
  }

  // Enhanced loading state with skeleton
  if (isLoading || !primaryData) {
    return (
      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-400 to-neutral-500 shadow-2xl ${className} animate-scale-in`}>
        <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-black/40" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)]" />

        <div className="relative p-4 sm:p-6 md:p-8 lg:p-12">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-4 sm:gap-6">

            {/* Main Temperature Display Skeleton */}
            <div className="text-center lg:text-left flex-1 w-full">
              <div className="flex items-center justify-center lg:justify-start gap-2 sm:gap-3 mb-3 sm:mb-2">
                <SkeletonLoader.Element
                  width="3rem"
                  height="3rem"
                  variant="circular"
                  className="bg-white/20 animate-pulse-slow"
                  delay={0}
                />
                <div>
                  <SkeletonLoader.Element
                    height="1.5rem"
                    width="8rem"
                    className="bg-white/20 mb-1"
                    delay={50}
                  />
                  <SkeletonLoader.Element
                    height="1rem"
                    width="6rem"
                    className="bg-white/20"
                    delay={100}
                  />
                </div>
              </div>

              <SkeletonLoader.Element
                height="5rem"
                width="8rem"
                className="bg-white/20 mx-auto lg:mx-0 mb-4 animate-pulse-gentle"
                delay={150}
              />

              <SkeletonLoader.Element
                height="1rem"
                width="6rem"
                className="bg-white/20 mx-auto lg:mx-0"
                delay={200}
              />
            </div>

            {/* Additional Weather Info Skeleton */}
            <div className="flex-shrink-0 w-full lg:w-auto">
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-1 gap-3 sm:gap-4 lg:gap-6">
                {/* Humidity skeleton */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 text-center lg:text-left min-h-[80px] sm:min-h-auto flex flex-col justify-center animate-fade-in delay-250">
                  <div className="flex items-center justify-center lg:justify-start gap-2 mb-1">
                    <SkeletonLoader.Element
                      width="1rem"
                      height="1rem"
                      variant="circular"
                      className="bg-white/20"
                      delay={250}
                    />
                    <SkeletonLoader.Element
                      height="0.75rem"
                      width="4rem"
                      className="bg-white/20"
                      delay={300}
                    />
                  </div>
                  <SkeletonLoader.Element
                    height="1.5rem"
                    width="3rem"
                    className="bg-white/20 mx-auto lg:mx-0"
                    delay={350}
                  />
                </div>

                {/* Wind skeleton */}
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 text-center lg:text-left min-h-[80px] sm:min-h-auto flex flex-col justify-center animate-fade-in delay-400">
                  <div className="flex items-center justify-center lg:justify-start gap-2 mb-1">
                    <SkeletonLoader.Element
                      width="1rem"
                      height="1rem"
                      variant="circular"
                      className="bg-white/20"
                      delay={400}
                    />
                    <SkeletonLoader.Element
                      height="0.75rem"
                      width="3rem"
                      className="bg-white/20"
                      delay={450}
                    />
                  </div>
                  <SkeletonLoader.Element
                    height="1rem"
                    width="4rem"
                    className="bg-white/20 mx-auto lg:mx-0"
                    delay={500}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Status Indicator Skeleton */}
          <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-white/20 animate-fade-in delay-600">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
              <div className="flex items-center gap-2 justify-center sm:justify-start">
                <SkeletonLoader.Element
                  width="0.5rem"
                  height="0.5rem"
                  variant="circular"
                  className="bg-green-400/50 animate-pulse-slow"
                  delay={600}
                />
                <SkeletonLoader.Element
                  height="0.875rem"
                  width="4rem"
                  className="bg-white/20"
                  delay={650}
                />
              </div>
              <SkeletonLoader.Element
                height="0.875rem"
                width="6rem"
                className="bg-white/20 mx-auto sm:mx-0"
                delay={700}
              />
            </div>
          </div>
        </div>

        {/* Loading announcement for accessibility */}
        <div
          className="sr-only"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          {isLoading ? 'Loading temperature and weather information...' : 'Temperature data unavailable, showing fallback display'}
        </div>
      </div>
    );
  }

  const formatTemperature = useCallback((temp) => {
    if (temp === null || temp === undefined) {return '--';}
    return Math.round(temp);
  }, []);

  // Validate temperature data - memoized
  const validateTemperature = useCallback((temp) => {
    if (temp === null || temp === undefined) {return false;}
    if (typeof temp !== 'number') {return false;}
    if (temp < LIMITS.TEMP_MIN_SINGAPORE || temp > LIMITS.TEMP_MAX_SINGAPORE) {return false;} // Reasonable range for Singapore
    return true;
  }, []);

  const isValidTemperature = useMemo(() => validateTemperature(primaryData?.temperature), [validateTemperature, primaryData?.temperature]);
  const displayTemperature = useMemo(() => isValidTemperature ? primaryData?.temperature : null, [isValidTemperature, primaryData?.temperature]);

  // Data quality indicators - memoized
  const getDataQualityInfo = useMemo(() => {
    if (!dataQuality) {return null;}

    if (dataQuality < LIMITS.MIN_DATA_QUALITY / 1.6) {
      return { level: 'poor', message: 'Data quality is poor', color: 'text-red-300' };
    } else if (dataQuality < LIMITS.MIN_DATA_QUALITY) {
      return { level: 'fair', message: 'Data quality is fair', color: 'text-yellow-300' };
    }
    return { level: 'good', message: 'Data quality is good', color: 'text-green-300' };
  }, [dataQuality]);

  const qualityInfo = getDataQualityInfo;

  const getTemperatureColor = useCallback((temp) => {
    if (temp === null || temp === undefined) {return 'text-white';}
    if (temp >= LIMITS.TEMP_HOT) {return 'text-red-100';}
    if (temp >= LIMITS.TEMP_WARM) {return 'text-orange-100';}
    if (temp >= LIMITS.TEMP_PLEASANT) {return 'text-yellow-100';}
    if (temp >= LIMITS.TEMP_COOL) {return 'text-green-100';}
    return 'text-blue-100';
  }, []);

  const getBackgroundGradient = useCallback((temp) => {
    if (temp === null || temp === undefined) {return 'from-neutral-500 to-neutral-600';}
    if (temp >= LIMITS.TEMP_HOT) {return 'from-red-500 to-orange-600';}
    if (temp >= LIMITS.TEMP_WARM) {return 'from-orange-500 to-red-500';}
    if (temp >= LIMITS.TEMP_PLEASANT) {return 'from-primary-500 to-secondary-500';}
    if (temp >= LIMITS.TEMP_COOL) {return 'from-secondary-500 to-accent-500';}
    return 'from-secondary-600 to-secondary-700';
  }, []);

  return (
    <section
      ref={heroRef}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${getBackgroundGradient(displayTemperature)} shadow-2xl ${className} animate-scale-in loading-to-loaded loaded`}
      role="region"
      aria-label="Current weather information"
      aria-describedby="temperature-details"
    >
      {/* Live region for temperature announcements */}
      {temperatureAnnouncement && (
        <div
          role="status"
          aria-live="polite"
          aria-atomic="true"
          className="sr-only"
        >
          {temperatureAnnouncement}
        </div>
      )}

      {/* Error overlay for partial data */}
      {(error || !isValidTemperature) && hasPartialData && (
        <div className="absolute top-4 right-4 z-10">
          <PartialError
            successCount={isValidTemperature ? 1 : 0}
            failureCount={isValidTemperature ? 0 : 1}
            totalCount={1}
            dataType="temperature readings"
            onRetryFailed={onRetry}
            className="max-w-xs"
          />
        </div>
      )}
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-black/20 to-black/40" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.1),transparent_50%)]" />

      {/* Content */}
      <div className="relative p-4 sm:p-6 md:p-8 lg:p-12">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-4 sm:gap-6">

          {/* Main Temperature Display with semantic markup */}
          <div className="text-center lg:text-left flex-1 w-full animate-slide-in-left">
            <header className="flex items-center justify-center lg:justify-start gap-2 sm:gap-3 mb-3 sm:mb-2 animate-fade-in">
              <span
                className="text-3xl sm:text-4xl md:text-5xl animate-pulse-slow flex-shrink-0 hover-scale"
                role="img"
                aria-label={`Weather condition: ${primaryData.description}`}
              >
                {primaryData.icon}
              </span>
              <div className="text-white/90 text-sm sm:text-sm md:text-base font-medium min-w-0">
                <h1 className="truncate text-base sm:text-base md:text-lg font-semibold animate-fade-in delay-100">
                  {primaryData.displayName}
                </h1>
                <div className="text-white/70 text-xs sm:text-xs md:text-sm truncate animate-fade-in delay-150">
                  {primaryData.description}
                </div>
              </div>
            </header>

            <div
              id="temperature-details"
              className="flex items-baseline justify-center lg:justify-start gap-1 sm:gap-2 mb-3 sm:mb-3 animate-fade-in delay-200"
            >
              <span
                className={`text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight ${getTemperatureColor(displayTemperature)} drop-shadow-lg animate-scale-in delay-300`}
                role="text"
                aria-label={`Temperature: ${formatTemperature(displayTemperature)} degrees Celsius${!isValidTemperature ? ' (data may be inaccurate)' : ''}`}
              >
                {formatTemperature(displayTemperature)}
                {!isValidTemperature && (
                  <span
                    className="text-lg sm:text-xl md:text-2xl align-top ml-2 text-white/60"
                    role="img"
                    aria-label="Warning: temperature data may be inaccurate"
                  >
                    <AlertTriangle className="inline-block w-6 h-6" aria-hidden="true" />
                  </span>
                )}
              </span>
              <span
                className="text-xl sm:text-2xl md:text-3xl text-white/80 font-light animate-fade-in delay-400"
                aria-hidden="true"
              >
                °C
              </span>
            </div>

            {/* Data quality indicator */}
            {qualityInfo && (
              <div className={`text-xs ${qualityInfo.color} mb-2 flex items-center justify-center lg:justify-start gap-1 animate-fade-in delay-450`}>
                <div className={`w-2 h-2 rounded-full ${
                  qualityInfo.level === 'good' ? 'bg-green-400' :
                    qualityInfo.level === 'fair' ? 'bg-yellow-400' : 'bg-red-400'
                } animate-pulse-slow`} />
                {qualityInfo.message}
              </div>
            )}

            {primaryData.feelsLike && (
              <div className="text-white/70 text-xs mb-2 animate-fade-in delay-500">
                체감: {formatTemperature(primaryData.feelsLike)}°C
              </div>
            )}
          </div>

          {/* Compact Weather Summary */}
          <div className="flex-shrink-0 w-full lg:w-auto animate-slide-in-right">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center lg:text-left">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-white/70 text-xs mb-1">💧 습도</div>
                  <div className="text-white font-bold">{Math.round(primaryData.humidity || 0)}%</div>
                </div>
                <div>
                  <div className="text-white/70 text-xs mb-1">💨 바람</div>
                  <div className="text-white font-bold text-xs">{primaryData.windDirection || '--'}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Status Indicator */}
        <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-white/20 animate-fade-in delay-1000">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 text-white/60 text-xs sm:text-xs md:text-sm">
            <div className="flex items-center gap-2 justify-center sm:justify-start animate-slide-in-left delay-1100">
              <div className={`w-2 h-2 rounded-full animate-pulse-slow ${
                error ? 'bg-red-400' :
                  !isValidTemperature ? 'bg-yellow-400' :
                    'bg-green-400'
              }`} />
              <span className="font-medium">
                {error ? 'Data Error' :
                  !isValidTemperature ? 'Partial Data' :
                    'Live Data'}
              </span>

              {/* Retry button for inline errors with enhanced accessibility */}
              {error && onRetry && ErrorUtils.isRecoverable(error) && (
                <button
                  ref={retryButtonRef}
                  onClick={() => {
                    onRetry();
                    announceToScreenReader('Retrying weather data load', 'polite');
                  }}
                  className="ml-2 p-1 hover:bg-white/20 rounded transition-colors focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent"
                  title="Retry loading weather data"
                  aria-label="Retry loading weather data"
                  aria-describedby="retry-help"
                >
                  <RefreshCw className="w-3 h-3" aria-hidden="true" />
                  <span id="retry-help" className="sr-only">
                    Attempt to reload weather data due to previous error
                  </span>
                </button>
              )}
            </div>

            <div className="text-center sm:text-right animate-slide-in-right delay-1200">
              {primaryData.timestamp && (
                <span className="font-mono text-xs sm:text-xs">
                  Updated {new Date(primaryData.timestamp).toLocaleTimeString('en-SG', {
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'Asia/Singapore',
                  })}
                </span>
              )}

              {/* Show fallback data indicator */}
              {(!isValidTemperature || error) && (
                <div className="text-xs text-white/50 mt-1">
                  {showFallbackData ? 'Using cached data' : 'Data may be inaccurate'}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Hover Effect Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
    </section>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for React.memo to prevent unnecessary re-renders
  return (
    prevProps.weatherData === nextProps.weatherData &&
    prevProps.error === nextProps.error &&
    prevProps.isLoading === nextProps.isLoading &&
    prevProps.hasPartialData === nextProps.hasPartialData &&
    prevProps.dataQuality === nextProps.dataQuality &&
    prevProps.className === nextProps.className
  );
});

// PropTypes
TemperatureHero.propTypes = {
  weatherData: PropTypes.object,
  className: PropTypes.string,
  error: PropTypes.object,
  isLoading: PropTypes.bool,
  onRetry: PropTypes.func,
  hasPartialData: PropTypes.bool,
  dataQuality: PropTypes.number,
};

export default TemperatureHero;