/**
 * Health Monitor Component
 * Displays real-time system health status and performance metrics
 */

import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { useHealthService } from '../../services/healthService.js';

const HealthMonitor = ({ isVisible = false, onToggle }) => {
  const { healthStatus } = useHealthService();
  const [showDetails, setShowDetails] = useState(false);

  if (!isVisible) {
    return (
      <button
        onClick={onToggle}
        className="fixed bottom-4 right-4 bg-gray-800 text-white p-2 rounded-full shadow-lg hover:bg-gray-700 transition-colors z-50"
        title="Show System Health"
      >
        <HealthIcon status={healthStatus.systemStatus} />
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-xl border border-gray-200 p-4 max-w-sm z-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-800 flex items-center">
          <HealthIcon status={healthStatus.systemStatus} />
          <span className="ml-2">System Health</span>
        </h3>
        <button
          onClick={onToggle}
          className="text-gray-500 hover:text-gray-700"
        >
          ✕
        </button>
      </div>

      {/* System Status */}
      <div className="mb-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600">Status:</span>
          <StatusBadge status={healthStatus.systemStatus} />
        </div>
        <div className="flex items-center justify-between mt-1">
          <span className="text-sm text-gray-600">Uptime:</span>
          <span className="text-sm font-mono">{healthStatus.uptime?.formatted || 'N/A'}</span>
        </div>
      </div>

      {/* API Health Summary */}
      {healthStatus.apis && Object.keys(healthStatus.apis).length > 0 && (
        <div className="mb-3">
          <h4 className="text-sm font-medium text-gray-700 mb-2">API Status</h4>
          {Object.entries(healthStatus.apis).map(([api, status]) => (
            <div key={api} className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-600">{api}:</span>
              <div className="flex items-center">
                <StatusDot status={status.status} />
                <span className="ml-1">{status.availability}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Performance Metrics */}
      {healthStatus.performance && (
        <div className="mb-3">
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="flex items-center justify-between w-full text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            <span>Performance</span>
            <span className={`transform transition-transform ${showDetails ? 'rotate-180' : ''}`}>
              ▼
            </span>
          </button>

          {showDetails && (
            <div className="mt-2 space-y-1">
              {healthStatus.performance.memory && (
                <MetricRow
                  label="Memory"
                  value={`${healthStatus.performance.memory.percentage}%`}
                  threshold={80}
                  current={parseFloat(healthStatus.performance.memory.percentage)}
                />
              )}
              {healthStatus.performance.cacheSize && (
                <MetricRow
                  label="Cache Hit Rate"
                  value={`${healthStatus.performance.cacheSize.hitRate}%`}
                  threshold={70}
                  current={healthStatus.performance.cacheSize.hitRate}
                  reverse={true}
                />
              )}
              <MetricRow
                label="DOM Nodes"
                value={healthStatus.performance.domNodes || 0}
                threshold={5000}
                current={healthStatus.performance.domNodes || 0}
              />
            </div>
          )}
        </div>
      )}

      {/* Error Summary */}
      {healthStatus.errors && healthStatus.errors.lastHour > 0 && (
        <div className="mb-3 p-2 bg-red-50 rounded border-l-4 border-red-400">
          <div className="text-sm text-red-700">
            <strong>{healthStatus.errors.lastHour}</strong> errors in last hour
          </div>
        </div>
      )}

      <div className="text-xs text-gray-500 text-center mt-2">
        Last updated: {new Date(healthStatus.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
};

// Helper Components
const HealthIcon = ({ status }) => {
  const icons = {
    healthy: '🟢',
    degraded: '🟡',
    unhealthy: '🔴',
  };

  return (
    <span className="text-lg" role="img" aria-label={`System ${status}`}>
      {icons[status] || '⚪'}
    </span>
  );
};

const StatusBadge = ({ status }) => {
  const styles = {
    healthy: 'bg-green-100 text-green-800',
    degraded: 'bg-yellow-100 text-yellow-800',
    unhealthy: 'bg-red-100 text-red-800',
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  );
};

const StatusDot = ({ status }) => {
  const colors = {
    healthy: 'bg-green-400',
    degraded: 'bg-yellow-400',
    unhealthy: 'bg-red-400',
  };

  return (
    <div className={`w-2 h-2 rounded-full ${colors[status] || 'bg-gray-400'}`} />
  );
};

const MetricRow = ({ label, value, threshold, current, reverse = false }) => {
  const isWarning = reverse ? current < threshold : current > threshold;

  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-gray-600">{label}:</span>
      <span className={`font-mono ${isWarning ? 'text-red-600' : 'text-gray-800'}`}>
        {value}
      </span>
    </div>
  );
};

HealthMonitor.propTypes = {
  isVisible: PropTypes.bool,
  onToggle: PropTypes.func,
};

HealthIcon.propTypes = {
  status: PropTypes.oneOf(['healthy', 'degraded', 'unhealthy']).isRequired,
};

StatusBadge.propTypes = {
  status: PropTypes.oneOf(['healthy', 'degraded', 'unhealthy']).isRequired,
};

StatusDot.propTypes = {
  status: PropTypes.oneOf(['healthy', 'degraded', 'unhealthy']).isRequired,
};

MetricRow.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  threshold: PropTypes.number.isRequired,
  current: PropTypes.number.isRequired,
  reverse: PropTypes.bool,
};

export default HealthMonitor;