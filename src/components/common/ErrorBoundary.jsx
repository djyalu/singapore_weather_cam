import { Component } from 'react';
import PropTypes from 'prop-types';
import { ErrorDisplay, ErrorUtils } from './ErrorComponents.jsx';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
      retryCount: 0,
      isRecovering: false,
    };

    this.retryTimeout = null;
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return (prevState) => ({
      hasError: true,
      error,
      errorCount: prevState.errorCount + 1,
      isRecovering: false,
    });
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('Error caught by boundary:', error, errorInfo);

    // Store error info in state for display
    this.setState({ errorInfo });

    // Report to error tracking service in production
    this.reportError(error, errorInfo);

    // Auto-recovery for certain error types
    if (this.props.autoRecover && ErrorUtils.isRecoverable(error) && this.state.retryCount < 2) {
      this.scheduleAutoRecovery();
    }
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  reportError = (error, errorInfo) => {
    const errorCategory = ErrorUtils.categorizeError(error);
    const context = {
      component: this.props.fallbackComponent || 'Unknown',
      errorCategory,
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      url: window.location.href,
    };

    if (process.env.NODE_ENV === 'production') {
      // TODO: Send to error tracking service (Sentry, LogRocket, etc.)
      console.log('Error would be reported to monitoring service:', {
        error: error.toString(),
        stack: error.stack,
        errorInfo,
        context,
      });
    } else {
      console.group('🚨 Error Boundary Report');
      console.error('Error:', error);
      console.error('Error Info:', errorInfo);
      console.log('Context:', context);
      console.groupEnd();
    }

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo, context);
    }
  };

  scheduleAutoRecovery = () => {
    this.setState({ isRecovering: true });

    this.retryTimeout = setTimeout(() => {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1,
        isRecovering: false,
      }));
    }, 3000); // 3 second delay
  };

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      isRecovering: false,
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Use inline fallback for component-level boundaries
      if (this.props.inline) {
        return (
          <div className="p-4" role="alert">
            <ErrorDisplay
              error={this.state.error}
              severity="error"
              showDetails={process.env.NODE_ENV !== 'production'}
              onRetry={this.handleRetry}
              className={this.props.className}
            />
          </div>
        );
      }

      // Default full-page error boundary
      const isRecoverable = ErrorUtils.isRecoverable(this.state.error);
      const friendlyMessage = ErrorUtils.getFriendlyMessage(this.state.error);

      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" role="alert">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg text-center animate-scale-in">
            <div className="text-6xl mb-4" role="img" aria-label="Warning">⚠️</div>

            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Something went wrong
            </h1>

            <p className="text-gray-600 mb-4">
              {friendlyMessage}
            </p>

            {/* Recovery indicator */}
            {this.state.isRecovering && (
              <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-center gap-2 text-blue-700">
                  <div className="w-4 h-4 border-2 border-blue-700 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-sm font-medium">Attempting to recover...</span>
                </div>
              </div>
            )}

            {/* Error count warning */}
            {this.state.errorCount > 2 && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">
                  This error has occurred {this.state.errorCount} times. Consider refreshing the page.
                </p>
              </div>
            )}

            {process.env.NODE_ENV !== 'production' && this.state.error && (
              <details className="text-left mb-4">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  Show technical details
                </summary>
                <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}

            <div className="flex gap-4 justify-center">
              <button
                onClick={this.handleReload}
                className="btn-primary focus:outline-none focus:ring-2 focus:ring-singapore-red focus:ring-offset-2"
                aria-label="Reload page"
              >
                Reload Page
              </button>

              {isRecoverable && (
                <button
                  onClick={this.handleRetry}
                  disabled={this.state.isRecovering}
                  className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300
                           disabled:opacity-50 disabled:cursor-not-allowed
                           focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors"
                  aria-label="Try again"
                >
                  {this.state.isRecovering ? 'Recovering...' : 'Try Again'}
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

ErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  fallback: PropTypes.element,
  inline: PropTypes.bool,
  autoRecover: PropTypes.bool,
  fallbackComponent: PropTypes.string,
  onError: PropTypes.func,
  className: PropTypes.string,
};

ErrorBoundary.defaultProps = {
  autoRecover: false,
  inline: false,
};

export default ErrorBoundary;