/**
 * Reusable Error Components and Utilities
 * Provides consistent error handling patterns across the application
 */

import React from 'react';
import PropTypes from 'prop-types';
import { AlertTriangle, RefreshCw, Wifi, WifiOff, Clock, ChevronDown } from 'lucide-react';

/**
 * Generic Error Display Component
 * Displays errors with appropriate severity styling and actions
 */
export const ErrorDisplay = ({
  error,
  severity = 'error',
  showDetails = false,
  onRetry = null,
  onDismiss = null,
  retryText = 'Try Again',
  className = '',
}) => {
  const [showDetailedError, setShowDetailedError] = React.useState(false);

  const getSeverityStyles = (severity) => {
    switch (severity) {
      case 'warning':
        return {
          container: 'bg-yellow-50 border-yellow-200 text-yellow-800',
          icon: 'text-yellow-600',
          button: 'bg-yellow-100 hover:bg-yellow-200 text-yellow-800',
        };
      case 'info':
        return {
          container: 'bg-blue-50 border-blue-200 text-blue-800',
          icon: 'text-blue-600',
          button: 'bg-blue-100 hover:bg-blue-200 text-blue-800',
        };
      default: // error
        return {
          container: 'bg-red-50 border-red-200 text-red-800',
          icon: 'text-red-600',
          button: 'bg-red-100 hover:bg-red-200 text-red-800',
        };
    }
  };

  const styles = getSeverityStyles(severity);
  const errorMessage = error?.message || error || 'An unexpected error occurred';

  return (
    <div className={`border rounded-lg p-4 ${styles.container} ${className}`} role="alert">
      <div className="flex items-start gap-3">
        <AlertTriangle className={`w-5 h-5 flex-shrink-0 mt-0.5 ${styles.icon}`} />

        <div className="flex-1 min-w-0">
          <div className="font-medium text-sm mb-1">
            {severity === 'warning' ? 'Warning' :
              severity === 'info' ? 'Information' : 'Error'}
          </div>
          <div className="text-sm mb-3">
            {errorMessage}
          </div>

          {/* Error Details Toggle */}
          {showDetails && error && (error.stack || error.details) && (
            <div className="mb-3">
              <button
                onClick={() => setShowDetailedError(!showDetailedError)}
                className="flex items-center gap-1 text-xs font-medium hover:underline focus:outline-none focus:underline"
              >
                <ChevronDown className={`w-3 h-3 transition-transform ${showDetailedError ? 'rotate-180' : ''}`} />
                {showDetailedError ? 'Hide' : 'Show'} Details
              </button>

              {showDetailedError && (
                <pre className="mt-2 p-3 bg-black/10 rounded text-xs font-mono overflow-auto max-h-40 text-left">
                  {error.stack || error.details || JSON.stringify(error, null, 2)}
                </pre>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            {onRetry && (
              <button
                onClick={onRetry}
                className={`inline-flex items-center gap-1 px-3 py-1 rounded text-xs font-medium 
                           transition-colors focus:outline-none focus:ring-2 focus:ring-offset-1 
                           ${styles.button}`}
              >
                <RefreshCw className="w-3 h-3" />
                {retryText}
              </button>
            )}

            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-xs font-medium hover:underline focus:outline-none focus:underline"
              >
                Dismiss
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Network Error Component
 * Specialized error component for network-related issues
 */
export const NetworkError = ({
  isOnline = true,
  lastSuccessTime = null,
  onRetry = null,
  className = '',
}) => {
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) {return 'unknown';}

    const now = new Date();
    const time = new Date(timestamp);
    const diffMinutes = Math.floor((now - time) / (1000 * 60));

    if (diffMinutes < 1) {return 'just now';}
    if (diffMinutes < 60) {return `${diffMinutes}m ago`;}

    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours}h ago`;
  };

  return (
    <div className={`bg-orange-50 border border-orange-200 rounded-lg p-4 ${className}`} role="alert">
      <div className="flex items-start gap-3">
        {isOnline ? (
          <Wifi className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
        ) : (
          <WifiOff className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
        )}

        <div className="flex-1">
          <div className="font-medium text-sm text-orange-800 mb-1">
            {isOnline ? 'Service Connection Issue' : 'Network Offline'}
          </div>

          <div className="text-sm text-orange-700 mb-2">
            {isOnline
              ? 'Unable to connect to data services. Using cached data when available.'
              : 'Your device appears to be offline. Please check your internet connection.'
            }
          </div>

          {lastSuccessTime && (
            <div className="flex items-center gap-1 text-xs text-orange-600 mb-3">
              <Clock className="w-3 h-3" />
              Last successful update: {formatTimeAgo(lastSuccessTime)}
            </div>
          )}

          {onRetry && isOnline && (
            <button
              onClick={onRetry}
              className="inline-flex items-center gap-1 px-3 py-1 bg-orange-100 hover:bg-orange-200
                         text-orange-800 rounded text-xs font-medium transition-colors
                         focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-1"
            >
              <RefreshCw className="w-3 h-3" />
              Retry Connection
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Data Error Component
 * For errors related to data parsing, validation, or API responses
 */
export const DataError = ({
  message = 'Unable to load data',
  dataType = 'information',
  onRetry = null,
  onUseCache = null,
  hasCachedData = false,
  className = '',
}) => {
  return (
    <div className={`bg-amber-50 border border-amber-200 rounded-lg p-4 ${className}`} role="alert">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />

        <div className="flex-1">
          <div className="font-medium text-sm text-amber-800 mb-1">
            Data Loading Error
          </div>

          <div className="text-sm text-amber-700 mb-3">
            {message}. {hasCachedData ? 'Cached data may be available.' : 'No cached data available.'}
          </div>

          <div className="flex gap-2">
            {onRetry && (
              <button
                onClick={onRetry}
                className="inline-flex items-center gap-1 px-3 py-1 bg-amber-100 hover:bg-amber-200
                           text-amber-800 rounded text-xs font-medium transition-colors
                           focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1"
              >
                <RefreshCw className="w-3 h-3" />
                Reload {dataType}
              </button>
            )}

            {onUseCache && hasCachedData && (
              <button
                onClick={onUseCache}
                className="text-xs font-medium text-amber-700 hover:underline
                           focus:outline-none focus:underline"
              >
                Use Cached Data
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/**
 * Partial Error Component
 * For when some data loads successfully but other parts fail
 */
export const PartialError = ({
  successCount = 0,
  failureCount = 0,
  totalCount = 0,
  dataType = 'items',
  onRetryFailed = null,
  className = '',
}) => {
  const successRate = totalCount > 0 ? Math.round((successCount / totalCount) * 100) : 0;

  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-3 ${className}`} role="alert">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />

        <div className="flex-1">
          <div className="text-sm text-yellow-800">
            <span className="font-medium">Partial data loaded</span> - {successCount} of {totalCount} {dataType} loaded successfully ({successRate}%)
          </div>

          {onRetryFailed && failureCount > 0 && (
            <button
              onClick={onRetryFailed}
              className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 hover:bg-yellow-200
                         text-yellow-800 rounded text-xs font-medium transition-colors
                         focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-1"
            >
              <RefreshCw className="w-3 h-3" />
              Retry Failed ({failureCount})
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Error Utils - Helper functions for error handling
 */
export const ErrorUtils = {
  /**
   * Categorize errors by type for appropriate handling
   */
  categorizeError: (error) => {
    if (!error) {return 'unknown';}

    const message = error.message || error.toString();

    if (message.includes('fetch') || message.includes('network') || message.includes('NetworkError')) {
      return 'network';
    }
    if (message.includes('timeout') || message.includes('AbortError')) {
      return 'timeout';
    }
    if (message.includes('JSON') || message.includes('parse') || message.includes('SyntaxError')) {
      return 'data';
    }
    if (message.includes('401') || message.includes('403') || message.includes('Unauthorized')) {
      return 'auth';
    }
    if (message.includes('404') || message.includes('Not Found')) {
      return 'notfound';
    }
    if (message.includes('500') || message.includes('502') || message.includes('503')) {
      return 'server';
    }

    return 'unknown';
  },

  /**
   * Get user-friendly error message based on error type
   */
  getFriendlyMessage: (error) => {
    const category = ErrorUtils.categorizeError(error);

    const messages = {
      network: 'Unable to connect to the service. Please check your internet connection.',
      timeout: 'The request took too long to complete. Please try again.',
      data: 'The data received was invalid or corrupted. Please refresh the page.',
      auth: 'Authentication required. Please check your credentials.',
      notfound: 'The requested information could not be found.',
      server: 'The service is temporarily unavailable. Please try again later.',
      unknown: 'An unexpected error occurred. Please try refreshing the page.',
    };

    return messages[category] || messages.unknown;
  },

  /**
   * Determine if an error is recoverable (user can retry)
   */
  isRecoverable: (error) => {
    const category = ErrorUtils.categorizeError(error);
    return ['network', 'timeout', 'server'].includes(category);
  },

  /**
   * Create retry function with exponential backoff
   */
  createRetryFunction: (originalFunction, maxRetries = 3, initialDelay = 1000) => {
    let retryCount = 0;

    const retry = async (...args) => {
      try {
        return await originalFunction(...args);
      } catch (error) {
        retryCount++;

        if (retryCount >= maxRetries || !ErrorUtils.isRecoverable(error)) {
          throw error;
        }

        const delay = initialDelay * Math.pow(2, retryCount - 1);
        await new Promise(resolve => setTimeout(resolve, delay));

        return retry(...args);
      }
    };

    return retry;
  },
};

// PropTypes for components
ErrorDisplay.propTypes = {
  error: PropTypes.oneOfType([PropTypes.string, PropTypes.object]),
  severity: PropTypes.oneOf(['error', 'warning', 'info']),
  showDetails: PropTypes.bool,
  onRetry: PropTypes.func,
  onDismiss: PropTypes.func,
  retryText: PropTypes.string,
  className: PropTypes.string,
};

NetworkError.propTypes = {
  isOnline: PropTypes.bool,
  lastSuccessTime: PropTypes.oneOfType([PropTypes.string, PropTypes.instanceOf(Date)]),
  onRetry: PropTypes.func,
  className: PropTypes.string,
};

DataError.propTypes = {
  message: PropTypes.string,
  dataType: PropTypes.string,
  onRetry: PropTypes.func,
  onUseCache: PropTypes.func,
  hasCachedData: PropTypes.bool,
  className: PropTypes.string,
};

PartialError.propTypes = {
  successCount: PropTypes.number,
  failureCount: PropTypes.number,
  totalCount: PropTypes.number,
  dataType: PropTypes.string,
  onRetryFailed: PropTypes.func,
  className: PropTypes.string,
};