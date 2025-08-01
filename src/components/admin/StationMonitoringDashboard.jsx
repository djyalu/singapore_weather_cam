import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { stationMonitoringService } from '../../services/stationMonitoringService.js';

const StationMonitoringDashboard = ({ 
  autoRefresh = true, 
  refreshInterval = 30000, // 30 seconds
  compact = false 
}) => {
  const [monitoringStatus, setMonitoringStatus] = useState(null);
  const [reliabilityReport, setReliabilityReport] = useState(null);
  const [recentAlerts, setRecentAlerts] = useState([]);
  const [serviceHealth, setServiceHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Load monitoring data
  const refreshData = useCallback(async () => {
    try {
      setError(null);
      
      // Get all monitoring information
      const [status, report, alerts, health] = await Promise.all([
        Promise.resolve(stationMonitoringService.getMonitoringStatus()),
        Promise.resolve(stationMonitoringService.getStationReliabilityReport()),
        Promise.resolve(stationMonitoringService.getRecentAlerts(24)),
        Promise.resolve(stationMonitoringService.getServiceHealth())
      ]);
      
      setMonitoringStatus(status);
      setReliabilityReport(report);
      setRecentAlerts(alerts);
      setServiceHealth(health);
      
    } catch (err) {
      console.error('Error loading monitoring data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(refreshData, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refreshData]);

  // Handle start/stop monitoring
  const handleToggleMonitoring = useCallback(async () => {
    try {
      if (monitoringStatus?.monitoring_active) {
        stationMonitoringService.stopMonitoring();
      } else {
        await stationMonitoringService.startMonitoring();
      }
      
      // Refresh data after toggle
      setTimeout(refreshData, 1000);
    } catch (error) {
      console.error('Error toggling monitoring:', error);
    }
  }, [monitoringStatus, refreshData]);

  // Get reliability color
  const getReliabilityColor = (score) => {
    if (score >= 0.95) return 'text-green-600 bg-green-100';
    if (score >= 0.8) return 'text-blue-600 bg-blue-100';
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  // Get alert severity color
  const getAlertColor = (severity) => {
    const colors = {
      error: 'text-red-600 bg-red-100 border-red-200',
      warning: 'text-yellow-600 bg-yellow-100 border-yellow-200',
      info: 'text-blue-600 bg-blue-100 border-blue-200'
    };
    return colors[severity] || colors.info;
  };

  // Format time ago
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Never';
    
    const now = new Date();
    const time = new Date(timestamp);
    const diffMs = now - time;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
          <p className="text-gray-600">Loading monitoring data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <div className="text-red-600 mb-4">
          <p className="text-lg mb-2">⚠️ Error loading monitoring data</p>
          <p className="text-sm">{error}</p>
        </div>
        <button 
          onClick={refreshData}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={`station-monitoring-dashboard ${compact ? 'compact' : ''}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Station Monitoring Dashboard
            </h2>
            <p className="text-gray-600">
              Real-time monitoring and reliability tracking for NEA weather stations
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Monitoring Status */}
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${
                monitoringStatus?.monitoring_active ? 'bg-green-500' : 'bg-red-500'
              }`}></div>
              <span className="text-sm font-medium">
                {monitoringStatus?.monitoring_active ? 'Monitoring Active' : 'Monitoring Stopped'}
              </span>
            </div>
            
            {/* Toggle Button */}
            <button
              onClick={handleToggleMonitoring}
              className={`px-4 py-2 text-sm font-medium rounded transition-colors ${
                monitoringStatus?.monitoring_active
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : 'bg-green-500 text-white hover:bg-green-600'
              }`}
            >
              {monitoringStatus?.monitoring_active ? 'Stop Monitoring' : 'Start Monitoring'}
            </button>
            
            {/* Refresh Button */}
            <button
              onClick={refreshData}
              className="px-4 py-2 text-sm font-medium bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors"
            >
              🔄 Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Stations</p>
              <p className="text-2xl font-bold text-gray-900">{monitoringStatus?.total_stations || 0}</p>
            </div>
            <div className="text-3xl text-blue-500">🏢</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Stations</p>
              <p className="text-2xl font-bold text-green-600">{monitoringStatus?.active_stations || 0}</p>
            </div>
            <div className="text-3xl text-green-500">✅</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Average Reliability</p>
              <p className="text-2xl font-bold text-blue-600">
                {monitoringStatus?.average_reliability ? `${(monitoringStatus.average_reliability * 100).toFixed(1)}%` : '--'}
              </p>
            </div>
            <div className="text-3xl text-blue-500">📊</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Recent Alerts</p>
              <p className="text-2xl font-bold text-red-600">{recentAlerts.filter(a => a.severity === 'error').length}</p>
            </div>
            <div className="text-3xl text-red-500">🚨</div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mb-6">
        {[
          { id: 'overview', label: '📊 Overview', description: 'System status and key metrics' },
          { id: 'stations', label: '🏢 Stations', description: 'Individual station reliability' },
          { id: 'alerts', label: '🚨 Alerts', description: 'Recent alerts and issues' },
          { id: 'coverage', label: '🗺️ Coverage', description: 'Data type coverage analysis' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              activeTab === tab.id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
            title={tab.description}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Service Health */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-lg font-semibold mb-4">Service Health</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Service Status:</span>
                  <span className={`font-medium ${
                    serviceHealth?.service_active ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {serviceHealth?.service_active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Monitoring Cycle:</span>
                  <span className="font-medium">
                    {formatTimeAgo(serviceHealth?.last_cycle)}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Stations Monitored:</span>
                  <span className="font-medium">{serviceHealth?.stations_monitored || 0}</span>
                </div>
              </div>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Average Reliability:</span>
                  <span className="font-medium">
                    {serviceHealth?.average_reliability ? `${(serviceHealth.average_reliability * 100).toFixed(1)}%` : '--'}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Recent Alerts (1h):</span>
                  <span className={`font-medium ${
                    (serviceHealth?.recent_alerts || 0) > 0 ? 'text-red-600' : 'text-green-600'
                  }`}>
                    {serviceHealth?.recent_alerts || 0}
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Storage Usage:</span>
                  <span className="font-medium">
                    {serviceHealth?.storage_usage?.total_kb || 0} KB
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Reliability Summary */}
          {reliabilityReport?.summary && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h3 className="text-lg font-semibold mb-4">Reliability Summary</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {reliabilityReport.summary.excellent}
                  </div>
                  <div className="text-sm text-green-700">Excellent (≥95%)</div>
                </div>
                
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {reliabilityReport.summary.good}
                  </div>
                  <div className="text-sm text-blue-700">Good (80-95%)</div>
                </div>
                
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {reliabilityReport.summary.fair}
                  </div>
                  <div className="text-sm text-yellow-700">Fair (60-80%)</div>
                </div>
                
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {reliabilityReport.summary.poor}
                  </div>
                  <div className="text-sm text-red-700">Poor (<60%)</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Stations Tab */}
      {activeTab === 'stations' && reliabilityReport?.stations && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Station Reliability Report</h3>
            <span className="text-sm text-gray-500">
              {reliabilityReport.stations.length} stations • Updated {formatTimeAgo(reliabilityReport.timestamp)}
            </span>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-2 px-3">Station ID</th>
                  <th className="text-left py-2 px-3">Status</th>
                  <th className="text-left py-2 px-3">Reliability</th>
                  <th className="text-left py-2 px-3">Data Types</th>
                  <th className="text-left py-2 px-3">Last Seen</th>
                  <th className="text-left py-2 px-3">Readings</th>
                  <th className="text-left py-2 px-3">Issues</th>
                </tr>
              </thead>
              <tbody>
                {reliabilityReport.stations.slice(0, compact ? 10 : 50).map(station => (
                  <tr key={station.station_id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-2 px-3 font-mono font-medium">
                      {station.station_id}
                    </td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        station.status === 'active' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {station.status}
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        getReliabilityColor(station.reliability_score)
                      }`}>
                        {(station.reliability_score * 100).toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-2 px-3">
                      <div className="flex flex-wrap gap-1">
                        {station.data_types.slice(0, 3).map(type => (
                          <span key={type} className="px-1 py-0.5 bg-gray-100 text-gray-700 rounded text-xs">
                            {type}
                          </span>
                        ))}
                        {station.data_types.length > 3 && (
                          <span className="px-1 py-0.5 bg-gray-100 text-gray-500 rounded text-xs">
                            +{station.data_types.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-gray-600">
                      {formatTimeAgo(station.last_seen)}
                    </td>
                    <td className="py-2 px-3 text-gray-600">
                      {station.reading_count}
                    </td>
                    <td className="py-2 px-3">
                      {station.consecutive_failures > 0 && (
                        <span className="px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
                          {station.consecutive_failures} failures
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Alerts Tab */}
      {activeTab === 'alerts' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Recent Alerts (24 hours)</h3>
            <span className="text-sm text-gray-500">
              {recentAlerts.length} alerts
            </span>
          </div>
          
          {recentAlerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <div className="text-4xl mb-2">✅</div>
              <p>No recent alerts</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentAlerts.slice(0, compact ? 5 : 20).map((alert, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border ${getAlertColor(alert.severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">
                          {alert.type.replace('_', ' ').toUpperCase()}
                        </span>
                        <span className="text-xs px-2 py-1 rounded bg-white bg-opacity-50">
                          {alert.station_id}
                        </span>
                      </div>
                      <p className="text-sm">{alert.message}</p>
                    </div>
                    <div className="text-xs text-right whitespace-nowrap ml-4">
                      {formatTimeAgo(alert.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Coverage Tab */}
      {activeTab === 'coverage' && monitoringStatus?.data_type_coverage && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">Data Type Coverage Analysis</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(monitoringStatus.data_type_coverage).map(([dataType, count]) => (
              <div key={dataType} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium capitalize">{dataType.replace('_', ' ')}</h4>
                  <span className="text-2xl">
                    {dataType === 'temperature' ? '🌡️' :
                     dataType === 'humidity' ? '💧' :
                     dataType === 'rainfall' ? '🌧️' :
                     dataType === 'wind_speed' ? '💨' :
                     dataType === 'wind_direction' ? '🧭' : '📊'}
                  </span>
                </div>
                
                <div className="text-3xl font-bold text-blue-600 mb-1">
                  {count}
                </div>
                
                <div className="text-sm text-gray-600">
                  stations monitoring
                </div>
                
                <div className="mt-2">
                  <div className={`text-xs px-2 py-1 rounded ${
                    count >= 10 ? 'bg-green-100 text-green-700' :
                    count >= 5 ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }`}>
                    {count >= 10 ? 'Excellent Coverage' :
                     count >= 5 ? 'Good Coverage' :
                     'Limited Coverage'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

StationMonitoringDashboard.propTypes = {
  autoRefresh: PropTypes.bool,
  refreshInterval: PropTypes.number,
  compact: PropTypes.bool
};

export default StationMonitoringDashboard;