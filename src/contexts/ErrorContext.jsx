/**
 * Error Context for Global Error State Management
 * Provides centralized error handling and recovery mechanisms
 */

import React, { createContext, useContext, useReducer, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { ErrorUtils } from '../components/common/ErrorComponents.jsx';

// Error action types
const ERROR_ACTIONS = {
  ADD_ERROR: 'ADD_ERROR',
  REMOVE_ERROR: 'REMOVE_ERROR',
  CLEAR_ERRORS: 'CLEAR_ERRORS',
  SET_NETWORK_STATUS: 'SET_NETWORK_STATUS',
  INCREMENT_RETRY: 'INCREMENT_RETRY',
  RESET_RETRIES: 'RESET_RETRIES',
  SET_GLOBAL_ERROR: 'SET_GLOBAL_ERROR',
  CLEAR_GLOBAL_ERROR: 'CLEAR_GLOBAL_ERROR',
};

// Initial state
const initialState = {
  errors: new Map(), // Map of component errors by ID
  globalError: null, // Critical app-wide error
  networkStatus: 'online',
  retryAttempts: new Map(), // Track retry attempts per component
  errorHistory: [], // Keep track of error patterns
  maxErrors: 10, // Maximum number of errors to keep
  isRecovering: false,
};

// Error reducer
function errorReducer(state, action) {
  switch (action.type) {
    case ERROR_ACTIONS.ADD_ERROR: {
      const { id, error, componentName, timestamp = Date.now() } = action.payload;
      const newErrors = new Map(state.errors);

      newErrors.set(id, {
        error,
        componentName,
        timestamp,
        category: ErrorUtils.categorizeError(error),
        isRecoverable: ErrorUtils.isRecoverable(error),
      });

      // Update error history
      const newHistory = [...state.errorHistory, { id, error, componentName, timestamp }];
      if (newHistory.length > state.maxErrors) {
        newHistory.shift(); // Remove oldest error
      }

      return {
        ...state,
        errors: newErrors,
        errorHistory: newHistory,
      };
    }

    case ERROR_ACTIONS.REMOVE_ERROR: {
      const { id } = action.payload;
      const newErrors = new Map(state.errors);
      newErrors.delete(id);

      return {
        ...state,
        errors: newErrors,
      };
    }

    case ERROR_ACTIONS.CLEAR_ERRORS:
      return {
        ...state,
        errors: new Map(),
        retryAttempts: new Map(),
      };

    case ERROR_ACTIONS.SET_NETWORK_STATUS:
      return {
        ...state,
        networkStatus: action.payload.status,
      };

    case ERROR_ACTIONS.INCREMENT_RETRY: {
      const { id } = action.payload;
      const newRetryAttempts = new Map(state.retryAttempts);
      newRetryAttempts.set(id, (newRetryAttempts.get(id) || 0) + 1);

      return {
        ...state,
        retryAttempts: newRetryAttempts,
      };
    }

    case ERROR_ACTIONS.RESET_RETRIES: {
      const { id } = action.payload;
      const newRetryAttempts = new Map(state.retryAttempts);
      newRetryAttempts.delete(id);

      return {
        ...state,
        retryAttempts: newRetryAttempts,
      };
    }

    case ERROR_ACTIONS.SET_GLOBAL_ERROR:
      return {
        ...state,
        globalError: action.payload.error,
      };

    case ERROR_ACTIONS.CLEAR_GLOBAL_ERROR:
      return {
        ...state,
        globalError: null,
      };

    default:
      return state;
  }
}

// Create context
const ErrorContext = createContext();

// Error provider component
export const ErrorProvider = ({ children, maxRetries = 3, retryDelay = 1000 }) => {
  const [state, dispatch] = useReducer(errorReducer, initialState);

  // Network status monitoring
  useEffect(() => {
    const handleOnline = () => {
      dispatch({
        type: ERROR_ACTIONS.SET_NETWORK_STATUS,
        payload: { status: 'online' },
      });
    };

    const handleOffline = () => {
      dispatch({
        type: ERROR_ACTIONS.SET_NETWORK_STATUS,
        payload: { status: 'offline' },
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Set initial status
    dispatch({
      type: ERROR_ACTIONS.SET_NETWORK_STATUS,
      payload: { status: navigator.onLine ? 'online' : 'offline' },
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Error handling functions
  const addError = useCallback((id, error, componentName) => {
    dispatch({
      type: ERROR_ACTIONS.ADD_ERROR,
      payload: { id, error, componentName },
    });

    // Auto-remove non-critical errors after a delay
    if (ErrorUtils.categorizeError(error) !== 'critical') {
      setTimeout(() => {
        dispatch({
          type: ERROR_ACTIONS.REMOVE_ERROR,
          payload: { id },
        });
      }, 30000); // 30 seconds
    }
  }, []);

  const removeError = useCallback((id) => {
    dispatch({
      type: ERROR_ACTIONS.REMOVE_ERROR,
      payload: { id },
    });
  }, []);

  const clearErrors = useCallback(() => {
    dispatch({ type: ERROR_ACTIONS.CLEAR_ERRORS });
  }, []);

  const setGlobalError = useCallback((error) => {
    dispatch({
      type: ERROR_ACTIONS.SET_GLOBAL_ERROR,
      payload: { error },
    });
  }, []);

  const clearGlobalError = useCallback(() => {
    dispatch({ type: ERROR_ACTIONS.CLEAR_GLOBAL_ERROR });
  }, []);

  const retryComponent = useCallback(async (id, retryFunction) => {
    const retryCount = state.retryAttempts.get(id) || 0;

    if (retryCount >= maxRetries) {
      console.warn(`Max retries (${maxRetries}) exceeded for component ${id}`);
      return false;
    }

    dispatch({
      type: ERROR_ACTIONS.INCREMENT_RETRY,
      payload: { id },
    });

    try {
      // Add exponential backoff delay
      if (retryCount > 0) {
        await new Promise(resolve =>
          setTimeout(resolve, retryDelay * Math.pow(2, retryCount)),
        );
      }

      await retryFunction();

      // Success - remove error and reset retries
      removeError(id);
      dispatch({
        type: ERROR_ACTIONS.RESET_RETRIES,
        payload: { id },
      });

      return true;
    } catch (error) {
      // Retry failed - add new error
      addError(id, error, `Retry attempt ${retryCount + 1}`);
      return false;
    }
  }, [state.retryAttempts, maxRetries, retryDelay, addError, removeError]);

  // Error statistics and analysis
  const getErrorStats = useCallback(() => {
    const totalErrors = state.errorHistory.length;
    const recentErrors = state.errorHistory.filter(
      error => Date.now() - error.timestamp < 300000, // Last 5 minutes
    ).length;

    const errorsByCategory = state.errorHistory.reduce((acc, { error }) => {
      const category = ErrorUtils.categorizeError(error);
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});

    const currentErrors = Array.from(state.errors.values());
    const criticalErrors = currentErrors.filter(
      ({ category }) => category === 'critical',
    ).length;

    return {
      totalErrors,
      recentErrors,
      currentErrors: state.errors.size,
      criticalErrors,
      errorsByCategory,
      networkStatus: state.networkStatus,
    };
  }, [state.errors, state.errorHistory, state.networkStatus]);

  // Pattern detection for error prevention
  const detectErrorPatterns = useCallback(() => {
    const patterns = [];

    // Check for recurring errors
    const errorCounts = state.errorHistory.reduce((acc, { componentName }) => {
      acc[componentName] = (acc[componentName] || 0) + 1;
      return acc;
    }, {});

    Object.entries(errorCounts).forEach(([component, count]) => {
      if (count >= 3) {
        patterns.push({
          type: 'recurring_component_error',
          component,
          count,
          severity: count >= 5 ? 'high' : 'medium',
        });
      }
    });

    // Check for error bursts (many errors in short time)
    const recentErrors = state.errorHistory.filter(
      error => Date.now() - error.timestamp < 60000, // Last minute
    );

    if (recentErrors.length >= 5) {
      patterns.push({
        type: 'error_burst',
        count: recentErrors.length,
        severity: 'high',
      });
    }

    return patterns;
  }, [state.errorHistory]);

  const contextValue = {
    // State
    errors: state.errors,
    globalError: state.globalError,
    networkStatus: state.networkStatus,
    retryAttempts: state.retryAttempts,
    errorHistory: state.errorHistory,
    isRecovering: state.isRecovering,

    // Actions
    addError,
    removeError,
    clearErrors,
    setGlobalError,
    clearGlobalError,
    retryComponent,

    // Analysis
    getErrorStats,
    detectErrorPatterns,

    // Configuration
    maxRetries,
    retryDelay,
  };

  return (
    <ErrorContext.Provider value={contextValue}>
      {children}
    </ErrorContext.Provider>
  );
};

// Hook to use error context
export const useErrorContext = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useErrorContext must be used within an ErrorProvider');
  }
  return context;
};

// Hook for component-specific error handling
export const useComponentError = (componentId, componentName) => {
  const {
    errors,
    retryAttempts,
    addError,
    removeError,
    retryComponent,
  } = useErrorContext();

  const componentError = errors.get(componentId);
  const retryCount = retryAttempts.get(componentId) || 0;

  const handleError = useCallback((error) => {
    addError(componentId, error, componentName);
  }, [addError, componentId, componentName]);

  const clearError = useCallback(() => {
    removeError(componentId);
  }, [removeError, componentId]);

  const retry = useCallback(async (retryFunction) => {
    return await retryComponent(componentId, retryFunction);
  }, [retryComponent, componentId]);

  return {
    error: componentError?.error || null,
    hasError: !!componentError,
    isRecoverable: componentError?.isRecoverable || false,
    retryCount,
    handleError,
    clearError,
    retry,
  };
};

ErrorProvider.propTypes = {
  children: PropTypes.node.isRequired,
  maxRetries: PropTypes.number,
  retryDelay: PropTypes.number,
};

export default ErrorContext;