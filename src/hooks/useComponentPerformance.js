/**
 * React Hook for Component Performance Monitoring
 *
 * Provides easy integration of performance monitoring into React components.
 * Automatically tracks render times, re-render counts, and prop changes.
 */

import { useEffect, useRef, useCallback, useMemo } from 'react';

// Create a safe fallback for performance monitor
const createFallbackMonitor = () => ({
  startComponentMeasure: () => null,
  endComponentMeasure: () => 0,
  getMemoryUsage: () => ({ supported: false }),
  monitorAnimation: () => () => {},
  monitorElement: () => () => {},
});

// Dynamically import performance monitor with safety
let performanceMonitor = createFallbackMonitor();

// Try to load the real performance monitor
try {
  import('../services/performanceMonitor.js').then(module => {
    if (module.default) {
      performanceMonitor = module.default;
    }
  }).catch(error => {
    console.warn('Performance monitor dynamic import failed:', error);
  });
} catch (error) {
  console.warn('Performance monitor not available:', error);
}

/**
 * Hook for monitoring component performance
 * @param {string} componentName - Name of the component
 * @param {Object} props - Component props to monitor
 * @param {Object} options - Monitoring options
 */
export const useComponentPerformance = (componentName, props = {}, options = {}) => {
  const {
    trackRenders = true,
    trackProps = true,
    trackMemory = false,
    threshold = 16, // ms
    enabled = process.env.NODE_ENV === 'development',
  } = options;

  const renderCountRef = useRef(0);
  const lastPropsRef = useRef(props);
  const measureIdRef = useRef(null);
  const mountTimeRef = useRef(performance.now());

  // Track render count and timing
  useEffect(() => {
    if (!enabled || !trackRenders) {return;}

    renderCountRef.current++;

    // Start measurement for this render
    measureIdRef.current = performanceMonitor.startComponentMeasure(componentName, {
      renderCount: renderCountRef.current,
      propsCount: Object.keys(props).length,
    });

    // End measurement after render
    const timeoutId = setTimeout(() => {
      if (measureIdRef.current) {
        const renderTime = performanceMonitor.endComponentMeasure(measureIdRef.current, {
          renderCount: renderCountRef.current,
          lifecycle: 'effect',
        });

        if (renderTime > threshold) {
          console.warn(`🐌 ${componentName} render exceeded threshold: ${renderTime.toFixed(2)}ms`);
        }
      }
    }, 0);

    return () => clearTimeout(timeoutId);
  });

  // Track prop changes
  const propChanges = useMemo(() => {
    if (!enabled || !trackProps) {return null;}

    const changes = [];
    const currentProps = props;
    const previousProps = lastPropsRef.current;

    // Compare props
    const allKeys = new Set([...Object.keys(currentProps), ...Object.keys(previousProps)]);

    allKeys.forEach(key => {
      const current = currentProps[key];
      const previous = previousProps[key];

      if (current !== previous) {
        changes.push({
          prop: key,
          from: previous,
          to: current,
          type: typeof current,
        });
      }
    });

    lastPropsRef.current = currentProps;

    if (changes.length > 0) {
      console.log(`🔄 ${componentName} prop changes:`, changes);
    }

    return changes;
  }, [props, componentName, enabled, trackProps]);

  // Memory monitoring
  const memoryUsage = useMemo(() => {
    if (!enabled || !trackMemory) {return null;}

    const memory = performanceMonitor.getMemoryUsage();
    if (memory.supported && memory.usagePercentage > 70) {
      console.warn(`🧠 High memory usage in ${componentName}: ${memory.usagePercentage.toFixed(1)}%`);
    }

    return memory;
  }, [componentName, enabled, trackMemory, renderCountRef.current]);

  // Performance report for this component
  const getComponentReport = useCallback(() => {
    if (!enabled) {return null;}

    const totalRenderTime = performance.now() - mountTimeRef.current;

    return {
      componentName,
      renderCount: renderCountRef.current,
      totalMountTime: totalRenderTime,
      averageRenderTime: totalRenderTime / renderCountRef.current,
      propChanges: propChanges?.length || 0,
      memoryUsage,
      timestamp: Date.now(),
    };
  }, [componentName, propChanges, memoryUsage, enabled]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (enabled && measureIdRef.current) {
        performanceMonitor.endComponentMeasure(measureIdRef.current, {
          lifecycle: 'unmount',
          totalRenders: renderCountRef.current,
        });
      }
    };
  }, [enabled]);

  return {
    renderCount: renderCountRef.current,
    propChanges,
    memoryUsage,
    getReport: getComponentReport,
    isEnabled: enabled,
  };
};

/**
 * Hook for monitoring animation performance
 * @param {string} animationName - Name of the animation
 * @param {Object} options - Animation monitoring options
 */
export const useAnimationPerformance = (animationName, options = {}) => {
  const {
    enabled = process.env.NODE_ENV === 'development',
    duration = 1000,
    autoStart = false,
  } = options;

  const cleanupRef = useRef(null);
  const isRunningRef = useRef(false);

  const startMonitoring = useCallback(() => {
    if (!enabled || isRunningRef.current) {return;}

    isRunningRef.current = true;
    cleanupRef.current = performanceMonitor.monitorAnimation(animationName, duration);

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
        isRunningRef.current = false;
      }
    };
  }, [animationName, duration, enabled]);

  const stopMonitoring = useCallback(() => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
      isRunningRef.current = false;
    }
  }, []);

  // Auto-start if requested
  useEffect(() => {
    if (autoStart) {
      return startMonitoring();
    }
  }, [autoStart, startMonitoring]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopMonitoring();
    };
  }, [stopMonitoring]);

  return {
    startMonitoring,
    stopMonitoring,
    isRunning: isRunningRef.current,
    isEnabled: enabled,
  };
};

/**
 * Hook for monitoring element visibility and performance
 * @param {Object} options - Element monitoring options
 */
export const useElementPerformance = (options = {}) => {
  const {
    enabled = process.env.NODE_ENV === 'development',
    threshold = 0.1,
  } = options;

  const elementRef = useRef(null);
  const cleanupRef = useRef(null);

  const monitorElement = useCallback((element, name) => {
    if (!enabled || !element) {return;}

    cleanupRef.current = performanceMonitor.monitorElement(element, name);
    return cleanupRef.current;
  }, [enabled]);

  // Setup monitoring when ref is set
  useEffect(() => {
    if (elementRef.current && options.name) {
      return monitorElement(elementRef.current, options.name);
    }
  }, [monitorElement, options.name]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (cleanupRef.current) {
        cleanupRef.current();
      }
    };
  }, []);

  return {
    elementRef,
    monitorElement,
    isEnabled: enabled,
  };
};

/**
 * Hook for performance debugging and optimization insights
 * @param {string} componentName - Component name
 */
export const usePerformanceDebug = (componentName) => {
  const renderCountRef = useRef(0);
  const renderTimesRef = useRef([]);
  const propsHistoryRef = useRef([]);

  useEffect(() => {
    renderCountRef.current++;
    const renderTime = performance.now();
    renderTimesRef.current.push(renderTime);

    // Keep only last 10 render times
    if (renderTimesRef.current.length > 10) {
      renderTimesRef.current = renderTimesRef.current.slice(-10);
    }
  });

  const getDebugInfo = useCallback(() => {
    const renderTimes = renderTimesRef.current;
    const avgRenderTime = renderTimes.length > 1
      ? renderTimes.slice(1).reduce((acc, time, i) => acc + (time - renderTimes[i]), 0) / (renderTimes.length - 1)
      : 0;

    return {
      componentName,
      totalRenders: renderCountRef.current,
      averageRenderInterval: avgRenderTime,
      lastRenderTime: renderTimes[renderTimes.length - 1],
      renderHistory: renderTimes,
      suggestions: generateOptimizationSuggestions(renderCountRef.current, avgRenderTime),
    };
  }, [componentName]);

  const logDebugInfo = useCallback(() => {
    const info = getDebugInfo();
    console.group(`🔍 ${componentName} Performance Debug`);
    console.log('Render Count:', info.totalRenders);
    console.log('Average Render Interval:', `${info.averageRenderInterval.toFixed(2)}ms`);
    console.log('Suggestions:', info.suggestions);
    console.groupEnd();
  }, [getDebugInfo, componentName]);

  return {
    renderCount: renderCountRef.current,
    getDebugInfo,
    logDebugInfo,
  };
};

/**
 * Generate optimization suggestions based on performance data
 * @param {number} renderCount - Number of renders
 * @param {number} avgRenderTime - Average time between renders
 */
function generateOptimizationSuggestions(renderCount, avgRenderTime) {
  const suggestions = [];

  if (renderCount > 10) {
    suggestions.push('Consider using React.memo() to prevent unnecessary re-renders');
  }

  if (avgRenderTime < 50) {
    suggestions.push('Frequent re-renders detected. Check if useCallback/useMemo are needed');
  }

  if (avgRenderTime > 1000) {
    suggestions.push('Slow re-render interval. Consider optimizing component logic');
  }

  return suggestions;
}

export default {
  useComponentPerformance,
  useAnimationPerformance,
  useElementPerformance,
  usePerformanceDebug,
};