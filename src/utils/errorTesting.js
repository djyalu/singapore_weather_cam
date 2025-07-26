/**
 * Error Testing Utilities
 * Provides tools for testing error scenarios and validating error recovery mechanisms
 */

import { ErrorUtils } from '../components/common/ErrorComponents.jsx';

/**
 * Error simulation utilities for testing
 */
export class ErrorSimulator {
  constructor() {
    this.simulatedErrors = new Map();
    this.originalFetch = window.fetch;
    this.originalConsoleError = console.error;
    this.isActive = false;
  }

  /**
   * Activate error simulation mode
   */
  activate() {
    if (this.isActive) {return;}

    this.isActive = true;

    // Override fetch to simulate network errors
    window.fetch = this.mockFetch.bind(this);

    // Track console errors for testing
    console.error = (...args) => {
      this.logError('console', args);
      this.originalConsoleError(...args);
    };

    console.log('🧪 Error simulation mode activated');
  }

  /**
   * Deactivate error simulation mode
   */
  deactivate() {
    if (!this.isActive) {return;}

    this.isActive = false;
    window.fetch = this.originalFetch;
    console.error = this.originalConsoleError;
    this.simulatedErrors.clear();

    console.log('🧪 Error simulation mode deactivated');
  }

  /**
   * Mock fetch function with error simulation
   */
  async mockFetch(url, options = {}) {
    const scenario = this.getScenarioForUrl(url);

    if (scenario) {
      console.log(`🧪 Simulating ${scenario.type} for ${url}`);

      switch (scenario.type) {
        case 'network_error':
          throw new Error('NetworkError: Failed to fetch');

        case 'timeout':
          await new Promise(resolve => setTimeout(resolve, scenario.delay || 10000));
          throw new Error('AbortError: Request timeout');

        case 'server_error':
          return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            { status: scenario.status || 500, statusText: 'Internal Server Error' },
          );

        case 'invalid_json':
          return new Response('Invalid JSON response{', {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          });

        case 'slow_response':
          await new Promise(resolve => setTimeout(resolve, scenario.delay || 5000));
          break;

        default:
          break;
      }
    }

    // Call original fetch if no scenario matches
    return this.originalFetch(url, options);
  }

  /**
   * Add error scenario for specific URL pattern
   */
  addScenario(urlPattern, scenario) {
    this.simulatedErrors.set(urlPattern, scenario);
  }

  /**
   * Remove error scenario
   */
  removeScenario(urlPattern) {
    this.simulatedErrors.delete(urlPattern);
  }

  /**
   * Get scenario for URL
   */
  getScenarioForUrl(url) {
    for (const [pattern, scenario] of this.simulatedErrors) {
      if (url.includes(pattern) || new RegExp(pattern).test(url)) {
        return scenario;
      }
    }
    return null;
  }

  /**
   * Log simulated error
   */
  logError(type, data) {
    console.log(`🧪 Error logged (${type}):`, data);
  }

  /**
   * Simulate component crash
   */
  crashComponent(componentRef, errorType = 'generic') {
    if (!componentRef) {return;}

    const errors = {
      generic: new Error('Simulated component crash'),
      memory: new Error('Memory allocation failed'),
      rendering: new Error('Cannot read property of undefined'),
      network: new Error('NetworkError: Failed to fetch'),
      timeout: new Error('AbortError: Request timeout'),
    };

    const error = errors[errorType] || errors.generic;
    console.log('🧪 Simulating component crash:', error);

    // Trigger error in component
    if (componentRef.current && componentRef.current.setState) {
      componentRef.current.setState(() => {
        throw error;
      });
    }
  }
}

/**
 * Error testing scenarios
 */
export const ErrorScenarios = {
  // Network-related errors
  NETWORK_OFFLINE: {
    type: 'network_error',
    description: 'Simulate offline network condition',
  },

  SLOW_NETWORK: {
    type: 'slow_response',
    delay: 5000,
    description: 'Simulate slow network response',
  },

  REQUEST_TIMEOUT: {
    type: 'timeout',
    delay: 10000,
    description: 'Simulate request timeout',
  },

  // Server errors
  SERVER_ERROR_500: {
    type: 'server_error',
    status: 500,
    description: 'Simulate internal server error',
  },

  SERVER_ERROR_502: {
    type: 'server_error',
    status: 502,
    description: 'Simulate bad gateway error',
  },

  SERVER_ERROR_503: {
    type: 'server_error',
    status: 503,
    description: 'Simulate service unavailable',
  },

  // Data errors
  INVALID_JSON: {
    type: 'invalid_json',
    description: 'Simulate invalid JSON response',
  },

  // Authentication errors
  UNAUTHORIZED: {
    type: 'server_error',
    status: 401,
    description: 'Simulate unauthorized access',
  },

  FORBIDDEN: {
    type: 'server_error',
    status: 403,
    description: 'Simulate forbidden access',
  },
};

/**
 * Error recovery testing utilities
 */
export class ErrorRecoveryTester {
  constructor() {
    this.testResults = [];
  }

  /**
   * Test error boundary functionality
   */
  async testErrorBoundary(errorBoundaryRef, testError) {
    const testId = `boundary_test_${Date.now()}`;
    console.log(`🧪 Testing error boundary with: ${testError.message}`);

    try {
      // Simulate error in boundary
      if (errorBoundaryRef.current) {
        errorBoundaryRef.current.componentDidCatch(testError, {
          componentStack: 'Test component stack',
        });
      }

      // Wait for boundary to process error
      await new Promise(resolve => setTimeout(resolve, 100));

      this.recordTestResult(testId, 'error_boundary', true, 'Error boundary handled error correctly');
      return true;
    } catch (error) {
      this.recordTestResult(testId, 'error_boundary', false, `Error boundary failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Test retry mechanism
   */
  async testRetryMechanism(retryFunction, maxRetries = 3) {
    const testId = `retry_test_${Date.now()}`;
    console.log('🧪 Testing retry mechanism');

    let attempts = 0;
    const testRetryFunction = async () => {
      attempts++;
      if (attempts < maxRetries) {
        throw new Error(`Simulated failure attempt ${attempts}`);
      }
      return { success: true, attempts };
    };

    try {
      const result = await ErrorUtils.createRetryFunction(testRetryFunction, maxRetries)();

      if (result.success && result.attempts === maxRetries) {
        this.recordTestResult(testId, 'retry_mechanism', true, `Retry succeeded after ${attempts} attempts`);
        return true;
      } else {
        this.recordTestResult(testId, 'retry_mechanism', false, 'Retry did not behave as expected');
        return false;
      }
    } catch (error) {
      this.recordTestResult(testId, 'retry_mechanism', false, `Retry failed: ${error.message}`);
      return false;
    }
  }

  /**
   * Test error categorization
   */
  testErrorCategorization() {
    const testId = `categorization_test_${Date.now()}`;
    console.log('🧪 Testing error categorization');

    const testCases = [
      { error: new Error('NetworkError: Failed to fetch'), expected: 'network' },
      { error: new Error('AbortError: Request timeout'), expected: 'timeout' },
      { error: new Error('SyntaxError: Unexpected token'), expected: 'data' },
      { error: new Error('401 Unauthorized'), expected: 'auth' },
      { error: new Error('404 Not Found'), expected: 'notfound' },
      { error: new Error('500 Internal Server Error'), expected: 'server' },
    ];

    let passed = 0;
    const results = [];

    testCases.forEach(({ error, expected }) => {
      const category = ErrorUtils.categorizeError(error);
      const success = category === expected;

      if (success) {passed++;}

      results.push({
        error: error.message,
        expected,
        actual: category,
        success,
      });
    });

    const success = passed === testCases.length;
    this.recordTestResult(
      testId,
      'error_categorization',
      success,
      `${passed}/${testCases.length} categorization tests passed`,
    );

    return { success, results };
  }

  /**
   * Test error recovery patterns
   */
  async testRecoveryPatterns() {
    console.log('🧪 Testing error recovery patterns');

    const patterns = [
      this.testErrorBoundary.bind(this),
      this.testRetryMechanism.bind(this),
      this.testErrorCategorization.bind(this),
    ];

    const results = [];

    for (const pattern of patterns) {
      try {
        const result = await pattern();
        results.push(result);
      } catch (error) {
        console.error('Pattern test failed:', error);
        results.push(false);
      }
    }

    return results;
  }

  /**
   * Record test result
   */
  recordTestResult(testId, testType, success, message) {
    const result = {
      testId,
      testType,
      success,
      message,
      timestamp: new Date().toISOString(),
    };

    this.testResults.push(result);
    console.log(`🧪 Test result: ${testType} - ${success ? '✅ PASS' : '❌ FAIL'} - ${message}`);
  }

  /**
   * Get test summary
   */
  getTestSummary() {
    const total = this.testResults.length;
    const passed = this.testResults.filter(r => r.success).length;
    const failed = total - passed;

    return {
      total,
      passed,
      failed,
      passRate: total > 0 ? Math.round((passed / total) * 100) : 0,
      results: this.testResults,
    };
  }

  /**
   * Clear test results
   */
  clearResults() {
    this.testResults = [];
  }
}

/**
 * Global error testing instance
 */
export const errorSimulator = new ErrorSimulator();
export const errorRecoveryTester = new ErrorRecoveryTester();

/**
 * Quick test functions for development
 */
export const DevErrorTests = {
  /**
   * Simulate network error for weather API
   */
  simulateWeatherApiError() {
    errorSimulator.addScenario('/api/weather', ErrorScenarios.SERVER_ERROR_500);
    console.log('🧪 Weather API errors simulated');
  },

  /**
   * Simulate webcam API timeout
   */
  simulateWebcamTimeout() {
    errorSimulator.addScenario('/api/webcam', ErrorScenarios.REQUEST_TIMEOUT);
    console.log('🧪 Webcam API timeout simulated');
  },

  /**
   * Simulate network offline
   */
  simulateOffline() {
    Object.defineProperty(navigator, 'onLine', { value: false, writable: true });
    window.dispatchEvent(new Event('offline'));
    console.log('🧪 Network offline simulated');
  },

  /**
   * Simulate network back online
   */
  simulateOnline() {
    Object.defineProperty(navigator, 'onLine', { value: true, writable: true });
    window.dispatchEvent(new Event('online'));
    console.log('🧪 Network online simulated');
  },

  /**
   * Run comprehensive error tests
   */
  async runAllTests() {
    console.log('🧪 Starting comprehensive error tests...');

    errorSimulator.activate();

    // Test error categorization
    const categorizationResults = errorRecoveryTester.testErrorCategorization();

    // Test retry mechanisms
    const retryResults = await errorRecoveryTester.testRetryMechanism();

    // Get summary
    const summary = errorRecoveryTester.getTestSummary();

    errorSimulator.deactivate();

    console.log('🧪 Error testing complete:', summary);
    return summary;
  },

  /**
   * Clear all simulated errors
   */
  clearAllErrors() {
    errorSimulator.deactivate();
    errorRecoveryTester.clearResults();
    console.log('🧪 All error simulations cleared');
  },
};

// Development-only exports
if (process.env.NODE_ENV === 'development') {
  window.ErrorTesting = {
    simulator: errorSimulator,
    tester: errorRecoveryTester,
    scenarios: ErrorScenarios,
    dev: DevErrorTests,
  };

  console.log('🧪 Error testing utilities available as window.ErrorTesting');
}