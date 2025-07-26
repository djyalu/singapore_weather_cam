/**
 * Monitoring Dashboard Component
 * Comprehensive real-time monitoring and observability dashboard
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useMetrics } from '../../services/metricsService.js';
import { useHealthService } from '../../services/healthService.js';

const MonitoringDashboard = ({ isVisible = false, onClose }) => {
  const [dashboardData, setDashboardData] = useState(null);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const { getDashboardData, getMetricsReport } = useMetrics();
  const { healthStatus } = useHealthService();

  // Auto-refresh dashboard data
  useEffect(() => {
    if (!isVisible || !autoRefresh) {return;}

    const refreshData = () => {
      try {
        const data = getDashboardData();
        setDashboardData(data);
      } catch (error) {
        console.error('Failed to refresh dashboard data:', error);
      }
    };

    refreshData(); // Initial load
    const interval = setInterval(refreshData, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [isVisible, autoRefresh, getDashboardData]);

  if (!isVisible || !dashboardData) {
    return null;
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: '📊' },
    { id: 'performance', label: 'Performance', icon: '⚡' },
    { id: 'health', label: 'Health', icon: '🏥' },
    { id: 'apis', label: 'APIs', icon: '🔌' },
    { id: 'errors', label: 'Errors', icon: '🚨' },
    { id: 'users', label: 'Users', icon: '👥' },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-6xl h-5/6 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-bold text-gray-900">📈 Monitoring Dashboard</h2>
            <StatusIndicator status={healthStatus.systemStatus} />
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1 rounded text-sm ${
                autoRefresh
                  ? 'bg-green-100 text-green-800'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              {autoRefresh ? '🔄 Auto' : '⏸️ Manual'}
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 bg-gray-50">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id)}
              className={`px-4 py-2 text-sm font-medium flex items-center space-x-1 border-b-2 transition-colors ${
                selectedTab === tab.id
                  ? 'border-blue-500 text-blue-600 bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-4">
          {selectedTab === 'overview' && <OverviewTab data={dashboardData} />}
          {selectedTab === 'performance' && <PerformanceTab data={dashboardData} />}
          {selectedTab === 'health' && <HealthTab health={healthStatus} />}
          {selectedTab === 'apis' && <APIsTab data={dashboardData} />}
          {selectedTab === 'errors' && <ErrorsTab health={healthStatus} />}
          {selectedTab === 'users' && <UsersTab data={dashboardData} />}
        </div>
      </div>
    </div>
  );
};

// Overview Tab
const OverviewTab = ({ data }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <MetricCard
      title="API Calls"
      value={data.realTime.apiCalls}
      subtitle="Last 5 minutes"
      icon="🔌"
      trend={data.realTime.apiCalls > 0 ? 'up' : 'neutral'}
    />
    <MetricCard
      title="Response Time"
      value={`${data.realTime.avgResponseTime}ms`}
      subtitle="Average"
      icon="⚡"
      trend={data.realTime.avgResponseTime < 500 ? 'up' : 'down'}
    />
    <MetricCard
      title="Error Rate"
      value={data.realTime.errors}
      subtitle="Errors/5min"
      icon="🚨"
      trend={data.realTime.errors === 0 ? 'up' : 'down'}
    />
    <MetricCard
      title="User Activity"
      value={data.realTime.interactions}
      subtitle="Interactions/5min"
      icon="👥"
      trend="neutral"
    />

    <div className="col-span-full">
      <SystemHealthOverview health={data.health} />
    </div>
  </div>
);

// Performance Tab
const PerformanceTab = ({ data }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <MetricCard
        title="Memory Usage"
        value={data.health.performance?.memory?.percentage || 'N/A'}
        subtitle="Current"
        icon="💾"
        trend={parseFloat(data.health.performance?.memory?.percentage || 0) < 80 ? 'up' : 'down'}
      />
      <MetricCard
        title="Cache Hit Rate"
        value={data.health.performance?.cacheSize?.hitRate || 'N/A'}
        subtitle="Current"
        icon="🎯"
        trend={parseFloat(data.health.performance?.cacheSize?.hitRate || 0) > 70 ? 'up' : 'down'}
      />
      <MetricCard
        title="DOM Nodes"
        value={data.health.performance?.domNodes || 'N/A'}
        subtitle="Current"
        icon="🌳"
        trend={data.health.performance?.domNodes < 5000 ? 'up' : 'down'}
      />
    </div>

    <PerformanceChart data={data} />
  </div>
);

// Health Tab
const HealthTab = ({ health }) => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-800 mb-3">System Status</h3>
        <div className="space-y-2">
          <StatusRow label="Overall" status={health.systemStatus} />
          <div className="text-sm text-gray-600">
            Uptime: {health.uptime?.formatted || 'N/A'}
          </div>
          <div className="text-sm text-gray-600">
            Last Check: {health.lastCheck ? new Date(health.lastCheck).toLocaleTimeString() : 'N/A'}
          </div>
        </div>
      </div>

      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-800 mb-3">API Health</h3>
        <div className="space-y-2">
          {health.apis && Object.entries(health.apis).map(([api, status]) => (
            <div key={api} className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{api}</span>
              <div className="flex items-center space-x-2">
                <StatusIndicator status={status.status} size="sm" />
                <span className="text-xs text-gray-500">{status.availability}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>

    {health.performance && (
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-800 mb-3">Performance Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          {health.performance.memory && (
            <div>
              <div className="text-gray-600">Memory</div>
              <div className="font-mono">{health.performance.memory.percentage}%</div>
            </div>
          )}
          <div>
            <div className="text-gray-600">DOM Nodes</div>
            <div className="font-mono">{health.performance.domNodes}</div>
          </div>
          <div>
            <div className="text-gray-600">Event Listeners</div>
            <div className="font-mono">{health.performance.eventListeners}</div>
          </div>
          <div>
            <div className="text-gray-600">Cache Entries</div>
            <div className="font-mono">{health.performance.cacheSize?.entries || 0}</div>
          </div>
        </div>
      </div>
    )}
  </div>
);

// APIs Tab
const APIsTab = ({ data }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Total Calls"
        value={data.realTime.apiCalls}
        subtitle="Last 5 minutes"
        icon="📡"
      />
      <MetricCard
        title="Average Response"
        value={`${data.realTime.avgResponseTime}ms`}
        subtitle="Last 5 minutes"
        icon="⏱️"
      />
      <MetricCard
        title="Error Count"
        value={data.realTime.errors}
        subtitle="Last 5 minutes"
        icon="❌"
      />
      <MetricCard
        title="Success Rate"
        value={data.realTime.apiCalls > 0
          ? `${((data.realTime.apiCalls - data.realTime.errors) / data.realTime.apiCalls * 100).toFixed(1)}%`
          : 'N/A'
        }
        subtitle="Last 5 minutes"
        icon="✅"
      />
    </div>

    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="font-semibold text-gray-800 mb-3">API Endpoints</h3>
      {data.health.apis && Object.entries(data.health.apis).map(([endpoint, stats]) => (
        <div key={endpoint} className="flex items-center justify-between py-2 border-b border-gray-200 last:border-b-0">
          <div>
            <div className="font-medium text-gray-800">{endpoint}</div>
            <div className="text-sm text-gray-600">
              Avg: {stats.averageResponseTime}ms • Availability: {stats.availability}
            </div>
          </div>
          <StatusIndicator status={stats.status} />
        </div>
      ))}
    </div>
  </div>
);

// Errors Tab
const ErrorsTab = ({ health }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <MetricCard
        title="Total Errors"
        value={health.errors?.total || 0}
        subtitle="All time"
        icon="📊"
      />
      <MetricCard
        title="Last Hour"
        value={health.errors?.lastHour || 0}
        subtitle="Recent errors"
        icon="⏰"
      />
      <MetricCard
        title="Error Types"
        value={health.errors?.types ? Object.keys(health.errors.types).length : 0}
        subtitle="Unique types"
        icon="🏷️"
      />
    </div>

    {health.errors?.types && Object.keys(health.errors.types).length > 0 && (
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-800 mb-3">Error Types</h3>
        <div className="space-y-2">
          {Object.entries(health.errors.types).map(([type, count]) => (
            <div key={type} className="flex items-center justify-between">
              <span className="text-gray-700">{type}</span>
              <span className="bg-red-100 text-red-800 px-2 py-1 rounded text-sm">{count}</span>
            </div>
          ))}
        </div>
      </div>
    )}

    {health.errors?.latest && (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <h3 className="font-semibold text-red-800 mb-2">Latest Error</h3>
        <div className="text-sm text-red-700">
          <div><strong>Message:</strong> {health.errors.latest.message}</div>
          <div><strong>Time:</strong> {new Date(health.errors.latest.timestamp).toLocaleString()}</div>
          {health.errors.latest.context && (
            <div><strong>Context:</strong> {JSON.stringify(health.errors.latest.context)}</div>
          )}
        </div>
      </div>
    )}
  </div>
);

// Users Tab
const UsersTab = ({ data }) => (
  <div className="space-y-4">
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <MetricCard
        title="Session Duration"
        value={formatDuration(data.session.duration)}
        subtitle="Current session"
        icon="⏱️"
      />
      <MetricCard
        title="User Interactions"
        value={data.realTime.interactions}
        subtitle="Last 5 minutes"
        icon="👆"
      />
      <MetricCard
        title="Session ID"
        value={data.session.id.slice(-8)}
        subtitle="Last 8 chars"
        icon="🆔"
      />
    </div>

    <div className="bg-gray-50 rounded-lg p-4">
      <h3 className="font-semibold text-gray-800 mb-3">Session Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <div className="text-gray-600">User ID</div>
          <div className="font-mono break-all">{data.session.userId}</div>
        </div>
        <div>
          <div className="text-gray-600">Session ID</div>
          <div className="font-mono break-all">{data.session.id}</div>
        </div>
      </div>
    </div>
  </div>
);

// Helper Components
const MetricCard = ({ title, value, subtitle, icon, trend = 'neutral' }) => {
  const trendColors = {
    up: 'text-green-600',
    down: 'text-red-600',
    neutral: 'text-gray-600',
  };

  const trendIcons = {
    up: '📈',
    down: '📉',
    neutral: '➡️',
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <div className="text-2xl">{icon}</div>
        <div className={`text-sm ${trendColors[trend]}`}>
          {trendIcons[trend]}
        </div>
      </div>
      <div className="mt-2">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="text-sm text-gray-600">{title}</div>
        {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
      </div>
    </div>
  );
};

const StatusIndicator = ({ status, size = 'md' }) => {
  const colors = {
    healthy: 'bg-green-400',
    degraded: 'bg-yellow-400',
    unhealthy: 'bg-red-400',
  };

  const sizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
  };

  return (
    <div className={`${sizes[size]} ${colors[status] || 'bg-gray-400'} rounded-full`} />
  );
};

const StatusRow = ({ label, status }) => (
  <div className="flex items-center justify-between">
    <span className="text-sm text-gray-600">{label}</span>
    <div className="flex items-center space-x-2">
      <StatusIndicator status={status} />
      <span className="text-sm capitalize">{status}</span>
    </div>
  </div>
);

const SystemHealthOverview = ({ health }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-4">
    <h3 className="font-semibold text-gray-800 mb-4">System Health Overview</h3>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      <div className="text-center">
        <div className="text-3xl mb-2">
          {health.systemStatus === 'healthy' ? '✅' :
            health.systemStatus === 'degraded' ? '⚠️' : '❌'}
        </div>
        <div className="text-sm font-medium text-gray-700">System Status</div>
        <div className="text-xs text-gray-500 capitalize">{health.systemStatus}</div>
      </div>

      <div className="text-center">
        <div className="text-2xl font-bold text-gray-900 mb-1">
          {health.uptime?.formatted || 'N/A'}
        </div>
        <div className="text-sm font-medium text-gray-700">Uptime</div>
        <div className="text-xs text-gray-500">Since startup</div>
      </div>

      <div className="text-center">
        <div className="text-2xl font-bold text-gray-900 mb-1">
          {health.apis ? Object.keys(health.apis).length : 0}
        </div>
        <div className="text-sm font-medium text-gray-700">APIs Monitored</div>
        <div className="text-xs text-gray-500">Active endpoints</div>
      </div>
    </div>
  </div>
);

const PerformanceChart = ({ data }) => (
  <div className="bg-white rounded-lg border border-gray-200 p-4">
    <h3 className="font-semibold text-gray-800 mb-4">Performance Trends</h3>
    <div className="h-48 flex items-center justify-center text-gray-500">
      <div className="text-center">
        <div className="text-4xl mb-2">📊</div>
        <div>Performance charts coming soon</div>
        <div className="text-sm">Real-time performance visualization</div>
      </div>
    </div>
  </div>
);

// Utility Functions
const formatDuration = (ms) => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {return `${hours}h ${minutes % 60}m`;}
  if (minutes > 0) {return `${minutes}m ${seconds % 60}s`;}
  return `${seconds}s`;
};

MonitoringDashboard.propTypes = {
  isVisible: PropTypes.bool,
  onClose: PropTypes.func,
};

// PropTypes for sub-components
OverviewTab.propTypes = {
  data: PropTypes.shape({
    realTime: PropTypes.shape({
      apiCalls: PropTypes.number,
      avgResponseTime: PropTypes.number,
      errors: PropTypes.number,
      interactions: PropTypes.number,
    }),
    health: PropTypes.object,
  }).isRequired,
};

PerformanceTab.propTypes = {
  data: PropTypes.shape({
    health: PropTypes.shape({
      performance: PropTypes.shape({
        memory: PropTypes.shape({
          percentage: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        }),
        cacheSize: PropTypes.shape({
          hitRate: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        }),
        domNodes: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      }),
    }),
  }).isRequired,
};

HealthTab.propTypes = {
  health: PropTypes.shape({
    systemStatus: PropTypes.string,
    uptime: PropTypes.shape({
      formatted: PropTypes.string,
    }),
    lastCheck: PropTypes.string,
    apis: PropTypes.object,
    performance: PropTypes.shape({
      memory: PropTypes.shape({
        percentage: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      }),
      domNodes: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      eventListeners: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      cacheSize: PropTypes.shape({
        entries: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      }),
    }),
  }).isRequired,
};

APIsTab.propTypes = {
  data: PropTypes.shape({
    realTime: PropTypes.shape({
      apiCalls: PropTypes.number,
      avgResponseTime: PropTypes.number,
      errors: PropTypes.number,
    }),
    health: PropTypes.shape({
      apis: PropTypes.object,
    }),
  }).isRequired,
};

ErrorsTab.propTypes = {
  health: PropTypes.shape({
    errors: PropTypes.shape({
      total: PropTypes.number,
      lastHour: PropTypes.number,
      types: PropTypes.object,
      latest: PropTypes.shape({
        message: PropTypes.string,
        timestamp: PropTypes.string,
        context: PropTypes.object,
      }),
    }),
  }).isRequired,
};

UsersTab.propTypes = {
  data: PropTypes.shape({
    session: PropTypes.shape({
      duration: PropTypes.number,
      id: PropTypes.string,
      userId: PropTypes.string,
    }),
    realTime: PropTypes.shape({
      interactions: PropTypes.number,
    }),
  }).isRequired,
};

MetricCard.propTypes = {
  title: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  subtitle: PropTypes.string,
  icon: PropTypes.string.isRequired,
  trend: PropTypes.oneOf(['up', 'down', 'neutral']),
};

StatusIndicator.propTypes = {
  status: PropTypes.oneOf(['healthy', 'degraded', 'unhealthy']).isRequired,
  size: PropTypes.oneOf(['sm', 'md']),
};

StatusRow.propTypes = {
  label: PropTypes.string.isRequired,
  status: PropTypes.string.isRequired,
};

SystemHealthOverview.propTypes = {
  health: PropTypes.shape({
    systemStatus: PropTypes.string,
    uptime: PropTypes.shape({
      formatted: PropTypes.string,
    }),
    apis: PropTypes.object,
  }).isRequired,
};

PerformanceChart.propTypes = {
  data: PropTypes.object.isRequired,
};

export default MonitoringDashboard;