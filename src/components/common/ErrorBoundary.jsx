import React, { Component } from 'react';
import PropTypes from 'prop-types';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorCount: (prevState) => prevState.errorCount + 1,
    };
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('Error caught by boundary:', error, errorInfo);

    // Store error info in state for display
    this.setState({ errorInfo });

    // Report to error tracking service in production
    if (process.env.NODE_ENV === 'production') {
      // TODO: Send error to monitoring service
      console.log('Error would be reported to monitoring service');
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4" role="alert">
          <div className="bg-white rounded-lg shadow-lg p-8 max-w-lg text-center">
            <div className="text-6xl mb-4" role="img" aria-label="Warning">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              문제가 발생했습니다
            </h1>
            <p className="text-gray-600 mb-4">
              예상치 못한 오류가 발생했습니다. 페이지를 새로고침해 주세요.
            </p>
            {process.env.NODE_ENV !== 'production' && this.state.error && (
              <details className="text-left mb-4">
                <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                  기술적 세부사항 보기
                </summary>
                <pre className="mt-2 p-4 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                  {this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="btn-primary focus:outline-none focus:ring-2 focus:ring-singapore-red focus:ring-offset-2"
                aria-label="페이지 새로고침"
              >
                페이지 새로고침
              </button>
              <button
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-colors"
                aria-label="다시 시도"
              >
                다시 시도
              </button>
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
};

export default ErrorBoundary;