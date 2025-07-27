import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { Line, Doughnut, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
} from 'chart.js';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
);

/**
 * Quality Monitoring Dashboard
 * QA Persona: Real-time quality metrics visualization
 * DevOps Persona: CI/CD pipeline monitoring
 * Performance Persona: Performance metrics tracking
 */

const QualityDashboard = ({ className = '' }) => {
  const [qualityData, setQualityData] = useState(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mock quality data - in production, this would come from actual metrics API
  const mockQualityData = useMemo(() => ({
    current: {
      overallScore: 87,
      codeQuality: 92,
      testCoverage: 85,
      performance: 89,
      security: 94,
      accessibility: 88,
      lastUpdated: new Date().toISOString(),
    },
    trends: {
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      datasets: [
        {
          label: 'Overall Quality',
          data: [85, 87, 86, 89, 88, 87, 87],
          borderColor: 'rgb(34, 197, 94)',
          backgroundColor: 'rgba(34, 197, 94, 0.1)',
          tension: 0.4,
        },
        {
          label: 'Performance',
          data: [88, 89, 87, 91, 90, 89, 89],
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.4,
        },
        {
          label: 'Security',
          data: [94, 95, 94, 96, 95, 94, 94],
          borderColor: 'rgb(239, 68, 68)',
          backgroundColor: 'rgba(239, 68, 68, 0.1)',
          tension: 0.4,
        },
      ],
    },
    distribution: {
      labels: ['Code Quality', 'Test Coverage', 'Performance', 'Security', 'Accessibility'],
      datasets: [{
        data: [92, 85, 89, 94, 88],
        backgroundColor: [
          'rgba(34, 197, 94, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(168, 85, 247, 0.8)',
          'rgba(239, 68, 68, 0.8)',
          'rgba(245, 158, 11, 0.8)',
        ],
        borderColor: [
          'rgb(34, 197, 94)',
          'rgb(59, 130, 246)',
          'rgb(168, 85, 247)',
          'rgb(239, 68, 68)',
          'rgb(245, 158, 11)',
        ],
        borderWidth: 2,
      }],
    },
    violations: {
      labels: ['Critical', 'High', 'Medium', 'Low'],
      datasets: [{
        label: 'Quality Violations',
        data: [0, 2, 5, 8],
        backgroundColor: [
          'rgba(239, 68, 68, 0.8)',
          'rgba(245, 158, 11, 0.8)',
          'rgba(59, 130, 246, 0.8)',
          'rgba(34, 197, 94, 0.8)',
        ],
      }],
    },
    buildStatus: {
      total: 156,
      passed: 148,
      failed: 8,
      passRate: 94.9,
    },
    recentBuilds: [
      { id: 'b1', branch: 'main', status: 'passed', score: 89, timestamp: '2025-01-27T08:00:00Z' },
      { id: 'b2', branch: 'feature/qa-tests', status: 'passed', score: 85, timestamp: '2025-01-27T07:30:00Z' },
      { id: 'b3', branch: 'main', status: 'failed', score: 72, timestamp: '2025-01-27T07:00:00Z' },
      { id: 'b4', branch: 'develop', status: 'passed', score: 91, timestamp: '2025-01-27T06:30:00Z' },
      { id: 'b5', branch: 'main', status: 'passed', score: 88, timestamp: '2025-01-27T06:00:00Z' },
    ],
  }), []);

  useEffect(() => {
    const fetchQualityData = async () => {
      setLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setQualityData(mockQualityData);
        setError(null);
      } catch (err) {
        setError('Failed to load quality metrics');
        console.error('Quality data fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchQualityData();

    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchQualityData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [mockQualityData, timeRange]);

  const getScoreColor = (score) => {
    if (score >= 90) {return 'text-green-600 bg-green-50 border-green-200';}
    if (score >= 80) {return 'text-blue-600 bg-blue-50 border-blue-200';}
    if (score >= 70) {return 'text-yellow-600 bg-yellow-50 border-yellow-200';}
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'passed': return '✅';
      case 'failed': return '❌';
      case 'running': return '🔄';
      default: return '⏳';
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('en-SG', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
        <div className="text-center text-red-600">
          <p className="text-lg font-medium">⚠️ Error Loading Quality Dashboard</p>
          <p className="text-sm mt-2">{error}</p>
          <button
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            onClick={() => window.location.reload()}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!qualityData) {return null;}

  const { current, trends, distribution, violations, buildStatus, recentBuilds } = qualityData;

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`} data-testid="quality-dashboard">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">🛡️ Quality Dashboard</h2>
          <p className="text-sm text-gray-600">
            Last updated: {formatTimestamp(current.lastUpdated)}
          </p>
        </div>

        <div className="flex items-center gap-4 mt-4 md:mt-0">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>

          <button
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm"
            onClick={() => window.location.reload()}
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Overall Score */}
      <div className="mb-8">
        <div className={`p-6 rounded-lg border-2 ${getScoreColor(current.overallScore)}`}>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Overall Quality Score</h3>
              <p className="text-sm opacity-75">Weighted average of all quality metrics</p>
            </div>
            <div className="text-right">
              <div className="text-4xl font-bold">{current.overallScore}</div>
              <div className="text-sm">/100</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quality Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[
          { name: 'Code Quality', value: current.codeQuality, icon: '📊' },
          { name: 'Test Coverage', value: current.testCoverage, icon: '🧪' },
          { name: 'Performance', value: current.performance, icon: '⚡' },
          { name: 'Security', value: current.security, icon: '🔒' },
          { name: 'Accessibility', value: current.accessibility, icon: '♿' },
        ].map((metric) => (
          <div
            key={metric.name}
            className={`p-4 rounded-lg border ${getScoreColor(metric.value)}`}
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{metric.icon}</span>
              <span className="text-2xl font-bold">{metric.value}</span>
            </div>
            <h4 className="text-sm font-medium">{metric.name}</h4>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-current h-2 rounded-full transition-all duration-300"
                style={{ width: `${metric.value}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Trends Chart */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">📈 Quality Trends</h3>
          <div className="h-64">
            <Line
              data={trends}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  tooltip: {
                    mode: 'index',
                    intersect: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: false,
                    min: 70,
                    max: 100,
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Distribution Chart */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">🎯 Score Distribution</h3>
          <div className="h-64">
            <Doughnut
              data={distribution}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Build Status and Violations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Build Status */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">🏗️ Build Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>Total Builds</span>
              <span className="font-bold">{buildStatus.total}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Passed</span>
              <span className="font-bold text-green-600">{buildStatus.passed}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Failed</span>
              <span className="font-bold text-red-600">{buildStatus.failed}</span>
            </div>
            <div className="flex justify-between items-center border-t pt-3">
              <span>Pass Rate</span>
              <span className="font-bold text-lg">{buildStatus.passRate}%</span>
            </div>
          </div>
        </div>

        {/* Quality Violations */}
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold mb-4">⚠️ Quality Violations</h3>
          <div className="h-48">
            <Bar
              data={violations}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      stepSize: 1,
                    },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Recent Builds */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">🕒 Recent Builds</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2">Status</th>
                <th className="text-left py-2">Branch</th>
                <th className="text-left py-2">Score</th>
                <th className="text-left py-2">Time</th>
              </tr>
            </thead>
            <tbody>
              {recentBuilds.map((build) => (
                <tr key={build.id} className="border-b border-gray-100">
                  <td className="py-3">
                    <span className="flex items-center gap-2">
                      {getStatusIcon(build.status)}
                      <span className={`capitalize ${
                        build.status === 'passed' ? 'text-green-600' :
                          build.status === 'failed' ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {build.status}
                      </span>
                    </span>
                  </td>
                  <td className="py-3">
                    <code className="bg-gray-200 px-2 py-1 rounded text-xs">
                      {build.branch}
                    </code>
                  </td>
                  <td className="py-3">
                    <span className={`font-medium ${getScoreColor(build.score).split(' ')[0]}`}>
                      {build.score}/100
                    </span>
                  </td>
                  <td className="py-3 text-gray-600">
                    {formatTimestamp(build.timestamp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-6 pt-6 border-t border-gray-200 text-center text-sm text-gray-600">
        <p>
          Quality metrics are updated automatically with each build.
          <a href="#" className="text-blue-600 hover:underline ml-1">
            View detailed reports →
          </a>
        </p>
      </div>
    </div>
  );
};

QualityDashboard.propTypes = {
  className: PropTypes.string,
};

export default QualityDashboard;