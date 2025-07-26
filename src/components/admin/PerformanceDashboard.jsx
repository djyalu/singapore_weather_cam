/**
 * Performance Dashboard Component
 *
 * Provides a comprehensive view of application performance metrics,
 * including component render times, animation performance, memory usage,
 * and optimization recommendations.
 */

import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import {
  Activity,
  Clock,
  Cpu,
  BarChart3,
  AlertTriangle,
  CheckCircle,
  X,
  RefreshCw,
  Download,
  Settings,
  Zap,
} from 'lucide-react';
import performanceMonitor from '../../services/performanceMonitor.js';

const PerformanceDashboard = ({ isVisible, onClose }) => {
  const [performanceData, setPerformanceData] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedMetricType, setSelectedMetricType] = useState('all');
  const [timeRange, setTimeRange] = useState('1h'); // 1h, 6h, 24h
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch performance data
  const fetchPerformanceData = async () => {
    setIsRefreshing(true);
    try {
      const since = getTimeRangeSince(timeRange);
      const report = performanceMonitor.getPerformanceReport(
        selectedMetricType === 'all' ? null : selectedMetricType,
        since,
      );
      setPerformanceData(report);
    } catch (error) {
      console.error('Failed to fetch performance data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    if (isVisible && autoRefresh) {
      fetchPerformanceData();
      const interval = setInterval(fetchPerformanceData, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [isVisible, autoRefresh, selectedMetricType, timeRange]);

  // Initial load
  useEffect(() => {
    if (isVisible) {
      fetchPerformanceData();
    }
  }, [isVisible]);

  // Calculate performance scores
  const performanceScores = useMemo(() => {
    if (!performanceData) {return null;}

    const { metrics, summary, memory } = performanceData;

    // Component performance score (based on render times)
    const componentScore = summary.averages.componentRender
      ? Math.max(0, 100 - (summary.averages.componentRender / 16) * 50)
      : 100;

    // Animation performance score (based on FPS)
    const animationScore = summary.averages.animationFPS
      ? Math.min(100, (summary.averages.animationFPS / 60) * 100)
      : 100;

    // Memory performance score
    const memoryScore = memory.supported
      ? Math.max(0, 100 - memory.usagePercentage)
      : 100;

    // Overall score
    const overallScore = (componentScore + animationScore + memoryScore) / 3;

    return {
      overall: overallScore,
      component: componentScore,
      animation: animationScore,
      memory: memoryScore,
    };
  }, [performanceData]);

  // Get performance status
  const getPerformanceStatus = (score) => {
    if (score >= 80) {return { status: 'excellent', color: 'text-green-600', bg: 'bg-green-100' };}
    if (score >= 60) {return { status: 'good', color: 'text-blue-600', bg: 'bg-blue-100' };}
    if (score >= 40) {return { status: 'fair', color: 'text-yellow-600', bg: 'bg-yellow-100' };}
    return { status: 'poor', color: 'text-red-600', bg: 'bg-red-100' };
  };

  // Export performance data
  const exportData = () => {
    if (!performanceData) {return;}

    const dataStr = JSON.stringify(performanceData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);

    const link = document.createElement('a');
    link.href = url;
    link.download = `performance-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!isVisible) {return null;}

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Activity className="w-8 h-8" />
              <div>
                <h2 className="text-2xl font-bold">Performance Dashboard</h2>
                <p className="text-blue-100">Real-time application performance monitoring</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setAutoRefresh(!autoRefresh)}
                className={`p-2 rounded-lg transition-colors ${
                  autoRefresh ? 'bg-white bg-opacity-20' : 'bg-white bg-opacity-10'
                }`}
                title={autoRefresh ? 'Disable auto-refresh' : 'Enable auto-refresh'}
              >
                <RefreshCw className={`w-5 h-5 ${autoRefresh ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={exportData}
                disabled={!performanceData}
                className="p-2 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors disabled:opacity-50"
                title="Export performance data"
              >
                <Download className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                className="p-2 rounded-lg bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {isRefreshing && !performanceData ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-gray-600">Loading performance data...</p>
              </div>
            </div>
          ) : performanceData ? (
            <div className="space-y-6">
              {/* Controls */}
              <div className="flex flex-wrap items-center justify-between gap-4 bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center gap-4">
                  <div>
                    <label htmlFor="metric-type-select" className="block text-sm font-medium text-gray-700 mb-1">
                      Metric Type
                    </label>
                    <select
                      id="metric-type-select"
                      value={selectedMetricType}
                      onChange={(e) => setSelectedMetricType(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="all">All Metrics</option>
                      <option value="component">Component Renders</option>
                      <option value="animation">Animations</option>
                      <option value="memory">Memory Usage</option>
                      <option value="bundle">Bundle Performance</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="time-range-select" className="block text-sm font-medium text-gray-700 mb-1">
                      Time Range
                    </label>
                    <select
                      id="time-range-select"
                      value={timeRange}
                      onChange={(e) => setTimeRange(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="1h">Last Hour</option>
                      <option value="6h">Last 6 Hours</option>
                      <option value="24h">Last 24 Hours</option>
                    </select>
                  </div>
                </div>
                <button
                  onClick={fetchPerformanceData}
                  disabled={isRefreshing}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {/* Performance Scores */}
              {performanceScores && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(performanceScores).map(([key, score]) => {
                    const status = getPerformanceStatus(score);
                    return (
                      <div key={key} className={`p-4 rounded-lg border-2 ${status.bg} border-opacity-50`}>
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold text-gray-700 capitalize">
                            {key === 'overall' ? 'Overall Score' : `${key} Performance`}
                          </h3>
                          {score >= 80 ? (
                            <CheckCircle className="w-5 h-5 text-green-600" />
                          ) : score < 60 ? (
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                          ) : (
                            <Clock className="w-5 h-5 text-yellow-600" />
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-2xl font-bold text-gray-900">
                            {score.toFixed(0)}
                          </div>
                          <div className="flex-1">
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full transition-all duration-500 ${
                                  score >= 80 ? 'bg-green-500' :
                                    score >= 60 ? 'bg-blue-500' :
                                      score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                                }`}
                                style={{ width: `${score}%` }}
                              />
                            </div>
                            <p className={`text-sm mt-1 ${status.color} capitalize`}>
                              {status.status}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Metrics Summary */}
              <div className="bg-white border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Metrics Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3">Total Metrics</h4>
                    <div className="text-3xl font-bold text-blue-600">
                      {performanceData.summary.totalMetrics}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3">Metric Types</h4>
                    <div className="space-y-2">
                      {Object.entries(performanceData.summary.types).map(([type, count]) => (
                        <div key={type} className="flex justify-between text-sm">
                          <span className="capitalize">{type.replace('-', ' ')}</span>
                          <span className="font-semibold">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-700 mb-3">Averages</h4>
                    <div className="space-y-2 text-sm">
                      {performanceData.summary.averages.componentRender && (
                        <div className="flex justify-between">
                          <span>Component Render</span>
                          <span className="font-semibold">
                            {performanceData.summary.averages.componentRender.toFixed(2)}ms
                          </span>
                        </div>
                      )}
                      {performanceData.summary.averages.animationFPS && (
                        <div className="flex justify-between">
                          <span>Animation FPS</span>
                          <span className="font-semibold">
                            {performanceData.summary.averages.animationFPS.toFixed(1)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Memory Usage */}
              {performanceData.memory.supported && (
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Cpu className="w-5 h-5" />
                    Memory Usage
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Used Heap Size</h4>
                      <div className="text-2xl font-bold text-purple-600">
                        {(performanceData.memory.usedJSHeapSize / (1024 * 1024)).toFixed(1)} MB
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Total Heap Size</h4>
                      <div className="text-2xl font-bold text-blue-600">
                        {(performanceData.memory.totalJSHeapSize / (1024 * 1024)).toFixed(1)} MB
                      </div>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-700 mb-2">Usage Percentage</h4>
                      <div className={`text-2xl font-bold ${
                        performanceData.memory.usagePercentage > 80 ? 'text-red-600' :
                          performanceData.memory.usagePercentage > 60 ? 'text-yellow-600' : 'text-green-600'
                      }`}>
                        {performanceData.memory.usagePercentage.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Optimization Recommendations */}
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-yellow-600" />
                  Optimization Recommendations
                </h3>
                <div className="space-y-3">
                  {getOptimizationRecommendations(performanceData, performanceScores).map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-yellow-200">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-gray-900">{recommendation.title}</h4>
                        <p className="text-sm text-gray-600 mt-1">{recommendation.description}</p>
                        {recommendation.action && (
                          <p className="text-sm text-blue-600 mt-2 font-medium">{recommendation.action}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-12">
              <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Performance Data</h3>
              <p className="text-gray-600">Start interacting with the application to collect performance metrics.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Helper functions
function getTimeRangeSince(timeRange) {
  const now = Date.now();
  switch (timeRange) {
    case '1h': return now - (60 * 60 * 1000);
    case '6h': return now - (6 * 60 * 60 * 1000);
    case '24h': return now - (24 * 60 * 60 * 1000);
    default: return now - (60 * 60 * 1000);
  }
}

function getOptimizationRecommendations(performanceData, performanceScores) {
  const recommendations = [];

  if (!performanceData || !performanceScores) {return recommendations;}

  // Component performance recommendations
  if (performanceScores.component < 60) {
    recommendations.push({
      title: 'Optimize Component Rendering',
      description: 'Some components are taking longer than 16ms to render, which may cause frame drops.',
      action: 'Consider using React.memo(), useMemo(), and useCallback() to prevent unnecessary re-renders.',
    });
  }

  // Animation performance recommendations
  if (performanceScores.animation < 60) {
    recommendations.push({
      title: 'Improve Animation Performance',
      description: 'Animations are not maintaining 60 FPS consistently.',
      action: 'Use transform and opacity properties for animations, and consider reducing animation complexity.',
    });
  }

  // Memory usage recommendations
  if (performanceScores.memory < 60) {
    recommendations.push({
      title: 'Reduce Memory Usage',
      description: 'Memory usage is above recommended levels.',
      action: 'Check for memory leaks, optimize images, and consider lazy loading for large components.',
    });
  }

  // Bundle size recommendations
  const bundleMetrics = performanceData.metrics.filter(m => m.type === 'bundle');
  if (bundleMetrics.length > 0 && bundleMetrics[0].loadTime > 3000) {
    recommendations.push({
      title: 'Optimize Bundle Size',
      description: 'Initial page load is taking longer than 3 seconds.',
      action: 'Implement code splitting and lazy loading for non-critical components.',
    });
  }

  // Default recommendation if everything is good
  if (recommendations.length === 0) {
    recommendations.push({
      title: 'Performance is Excellent!',
      description: 'Your application is performing well across all metrics.',
      action: 'Continue monitoring to maintain good performance as you add new features.',
    });
  }

  return recommendations;
}

PerformanceDashboard.propTypes = {
  isVisible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default PerformanceDashboard;