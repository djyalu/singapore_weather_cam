/**
 * Higher-Order Component for Error Handling
 * Wraps existing components with robust error handling capabilities
 */

import React, { Component } from 'react';
import { ErrorDisplay, ErrorUtils } from './ErrorComponents.jsx';
import ComponentErrorBoundary from './ComponentErrorBoundary.jsx';

/**
 * HOC for adding error handling to existing components
 * @param {React.Component} WrappedComponent - Component to wrap
 * @param {Object} options - Configuration options
 */
export const withErrorHandling = (WrappedComponent, options = {}) => {
  const {
    componentName = WrappedComponent.displayName || WrappedComponent.name || 'Component',
    fallbackComponent = null,
    showDetails = process.env.NODE_ENV !== 'production',
    autoRetry = true,
    maxRetries = 3,
    retryDelay = 1000,
  } = options;

  class WithErrorHandling extends Component {
    constructor(props) {
      super(props);
      this.state = {
        hasError: false,
        error: null,
        retryCount: 0,
        isRetrying: false,
      };
    }

    static getDerivedStateFromError(error) {
      return {
        hasError: true,
        error,
      };
    }

    componentDidCatch(error, errorInfo) {
      console.error(`Error in ${componentName}:`, error, errorInfo);

      // Auto-retry for recoverable errors
      if (autoRetry && ErrorUtils.isRecoverable(error) && this.state.retryCount < maxRetries) {
        this.scheduleRetry();
      }
    }

    scheduleRetry = () => {
      this.setState({ isRetrying: true });

      setTimeout(() => {
        this.setState(prevState => ({
          hasError: false,
          error: null,
          retryCount: prevState.retryCount + 1,
          isRetrying: false,
        }));
      }, retryDelay * Math.pow(2, this.state.retryCount)); // Exponential backoff
    };

    handleManualRetry = () => {
      this.setState({
        hasError: false,
        error: null,
        isRetrying: false,
      });
    };

    render() {
      if (this.state.hasError) {
        // Use custom fallback if provided
        if (fallbackComponent) {
          if (typeof fallbackComponent === 'function') {
            return fallbackComponent(this.state.error, this.handleManualRetry);
          }
          return fallbackComponent;
        }

        // Show retry indicator
        if (this.state.isRetrying) {
          return (
            <div className="p-4 text-center">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-lg text-blue-700">
                <div className="w-4 h-4 border-2 border-blue-700 border-t-transparent rounded-full animate-spin"></div>
                <span className="text-sm font-medium">
                  Retrying {componentName}... ({this.state.retryCount}/{maxRetries})
                </span>
              </div>
            </div>
          );
        }

        // Default error display
        return (
          <div className="p-4" role="alert">
            <ErrorDisplay
              error={this.state.error}
              severity="error"
              showDetails={showDetails}
              onRetry={ErrorUtils.isRecoverable(this.state.error) ? this.handleManualRetry : null}
              retryText={`Reload ${componentName}`}
            />

            {this.state.retryCount >= maxRetries && (
              <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">
                  {componentName} has failed {this.state.retryCount} times. Consider refreshing the page.
                </p>
              </div>
            )}
          </div>
        );
      }

      return <WrappedComponent {...this.props} />;
    }
  }

  WithErrorHandling.displayName = `withErrorHandling(${componentName})`;
  WithErrorHandling.WrappedComponent = WrappedComponent;

  return WithErrorHandling;
};

/**
 * Hook for error handling in functional components
 */
export const useErrorHandler = (componentName = 'Component') => {
  const [error, setError] = React.useState(null);
  const [retryCount, setRetryCount] = React.useState(0);

  const handleError = React.useCallback((error) => {
    console.error(`Error in ${componentName}:`, error);
    setError(error);
  }, [componentName]);

  const retry = React.useCallback(() => {
    setError(null);
    setRetryCount(prev => prev + 1);
  }, []);

  const reset = React.useCallback(() => {
    setError(null);
    setRetryCount(0);
  }, []);

  // Auto-retry for network errors
  React.useEffect(() => {
    if (error && ErrorUtils.isRecoverable(error) && retryCount < 3) {
      const timeoutId = setTimeout(() => {
        retry();
      }, 1000 * Math.pow(2, retryCount));

      return () => clearTimeout(timeoutId);
    }
  }, [error, retryCount, retry]);

  return {
    error,
    retryCount,
    handleError,
    retry,
    reset,
    hasError: !!error,
    isRecoverable: error ? ErrorUtils.isRecoverable(error) : false,
  };
};

/**
 * Enhanced error boundary wrapper with additional features
 */
export const ErrorBoundaryWrapper = ({
  children,
  componentName,
  fallback,
  onError,
  className = '',
  inline = true,
}) => {
  return (
    <ComponentErrorBoundary
      componentName={componentName}
      fallback={fallback}
      onError={onError}
      className={className}
      showDetails={process.env.NODE_ENV !== 'production'}
    >
      {children}
    </ComponentErrorBoundary>
  );
};

export default withErrorHandling;