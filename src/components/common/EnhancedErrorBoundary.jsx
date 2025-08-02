/**
 * Enhanced Error Boundary with comprehensive error handling
 * Prevents application crashes and provides graceful error recovery
 */

import React from 'react';
import PropTypes from 'prop-types';

class EnhancedErrorBoundary extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state to trigger fallback UI
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error, errorInfo) {
    // Capture error details
    this.setState({
      error,
      errorInfo,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    });

    // Log error in development only
    if (import.meta.env.MODE === 'development') {
      console.group('🚨 Error Boundary Caught Error');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.error('Component Stack:', errorInfo.componentStack);
      console.groupEnd();
    }

    // Report to error tracking service (if available)
    this.reportError(error, errorInfo);
  }

  reportError = (error, errorInfo) => {
    // In production, you would report to an error tracking service
    // For now, we'll use a structured approach
    const errorReport = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      errorId: this.state.errorId,
    };

    // Only report in production mode to avoid spam in development
    if (import.meta.env.MODE === 'production') {
      // Here you would send to your error tracking service
      // e.g., Sentry, LogRocket, Bugsnag, etc.
      this.logErrorToService(errorReport);
    }
  };

  logErrorToService = (errorReport) => {
    // Placeholder for error service integration
    // In a real application, you would send this to your monitoring service
    try {
      // Example: Send to error tracking API
      // fetch('/api/errors', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(errorReport)
      // });
    } catch (reportingError) {
      // Fail silently if error reporting fails
    }
  };

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: prevState.retryCount + 1,
    }));
  };

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const { fallback: FallbackComponent, maxRetries = 3 } = this.props;
      const { error, retryCount, errorId } = this.state;

      // Use custom fallback if provided
      if (FallbackComponent) {
        return (
          <FallbackComponent
            error={error}
            errorId={errorId}
            retryCount={retryCount}
            onRetry={this.handleRetry}
            onRefresh={this.handleRefresh}
          />
        );
      }

      // Default error UI
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>

            <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
              앱에서 오류가 발생했습니다
            </h2>

            <p className="text-gray-600 text-center mb-6">
              죄송합니다. 예상치 못한 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.
            </p>

            {import.meta.env.MODE === 'development' && error && (
              <details className="mb-4 p-3 bg-gray-100 rounded text-sm">
                <summary className="cursor-pointer font-medium text-gray-700 mb-2">
                  개발자 정보 (클릭하여 펼치기)
                </summary>
                <div className="space-y-2 text-xs">
                  <div>
                    <strong>오류:</strong> {error.message}
                  </div>
                  <div>
                    <strong>ID:</strong> {errorId}
                  </div>
                  <div>
                    <strong>재시도 횟수:</strong> {retryCount}
                  </div>
                </div>
              </details>
            )}

            <div className="flex flex-col sm:flex-row gap-3">
              {retryCount < maxRetries ? (
                <button
                  onClick={this.handleRetry}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  다시 시도 ({maxRetries - retryCount}회 남음)
                </button>
              ) : (
                <button
                  onClick={this.handleRefresh}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  페이지 새로고침
                </button>
              )}

              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                홈으로 이동
              </button>
            </div>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500">
                Error ID: {errorId}
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

EnhancedErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.elementType,
  maxRetries: PropTypes.number,
  onError: PropTypes.func,
};

/**
 * Hook for handling errors in functional components
 */
export const useErrorHandler = () => {
  const [error, setError] = React.useState(null);

  const handleError = React.useCallback((error) => {
    if (import.meta.env.MODE === 'development') {
      console.error('Error handled by useErrorHandler:', error);
    }
    setError(error);
  }, []);

  const resetError = React.useCallback(() => {
    setError(null);
  }, []);

  React.useEffect(() => {
    if (error) {
      throw error;
    }
  }, [error]);

  return { handleError, resetError, error };
};

/**
 * Higher-order component for error boundary protection
 */
export const withErrorBoundary = (Component, errorBoundaryProps = {}) => {
  const WrappedComponent = React.forwardRef((props, ref) => (
    <EnhancedErrorBoundary {...errorBoundaryProps}>
      <Component {...props} ref={ref} />
    </EnhancedErrorBoundary>
  ));

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
};

export default EnhancedErrorBoundary;