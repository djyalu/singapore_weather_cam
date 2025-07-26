/**
 * Component-level Error Boundary
 * For wrapping individual components with graceful error handling
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';
import { ErrorDisplay, ErrorUtils } from './ErrorComponents.jsx';

class ComponentErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      retryCount: 0,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, errorInfo) {
    console.warn(`Component error in ${this.props.componentName}:`, error, errorInfo);

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      retryCount: prevState.retryCount + 1,
    }));
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        if (typeof this.props.fallback === 'function') {
          return this.props.fallback(this.state.error, this.handleRetry);
        }
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className={`component-error-boundary ${this.props.className || ''}`} role="alert">
          <ErrorDisplay
            error={this.state.error}
            severity={this.props.severity || 'error'}
            showDetails={this.props.showDetails}
            onRetry={ErrorUtils.isRecoverable(this.state.error) ? this.handleRetry : null}
            retryText={`Reload ${this.props.componentName || 'Component'}`}
          />

          {this.state.retryCount > 2 && (
            <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
              Component has failed {this.state.retryCount} times. Consider refreshing the page.
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

ComponentErrorBoundary.propTypes = {
  children: PropTypes.node.isRequired,
  componentName: PropTypes.string,
  fallback: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
  severity: PropTypes.oneOf(['error', 'warning', 'info']),
  showDetails: PropTypes.bool,
  onError: PropTypes.func,
  className: PropTypes.string,
};

ComponentErrorBoundary.defaultProps = {
  componentName: 'Component',
  showDetails: process.env.NODE_ENV !== 'production',
};

export default ComponentErrorBoundary;