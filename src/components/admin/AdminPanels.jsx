import React, { useState, useEffect } from 'react';
import HealthMonitor from '../system/HealthMonitor';
import MonitoringDashboard from './MonitoringDashboard';
import PerformanceDashboard from './PerformanceDashboard';
import PWAStatus from '../common/PWAStatus';
import { usePWAStatus, useAppMetrics } from '../../contexts/AppDataContext';

/**
 * Admin Panels Component
 * Manages all administrative UI panels and their visibility states
 */
const AdminPanels = React.memo(() => {
  // Panel visibility states
  const [showHealthMonitor, setShowHealthMonitor] = useState(false);
  const [showMonitoringDashboard, setShowMonitoringDashboard] = useState(false);
  const [showPerformanceDashboard, setShowPerformanceDashboard] = useState(false);

  // PWA and metrics hooks
  const pwStatus = usePWAStatus();
  const { trackUserInteraction } = useAppMetrics();

  // Keyboard shortcuts for dashboards
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.shiftKey) {
        if (event.key === 'M') {
          event.preventDefault();
          setShowMonitoringDashboard(!showMonitoringDashboard);
          trackUserInteraction('keyboard_shortcut', 'monitoring_dashboard');
        } else if (event.key === 'P') {
          event.preventDefault();
          setShowPerformanceDashboard(!showPerformanceDashboard);
          trackUserInteraction('keyboard_shortcut', 'performance_dashboard');
        } else if (event.key === 'H') {
          event.preventDefault();
          setShowHealthMonitor(!showHealthMonitor);
          trackUserInteraction('keyboard_shortcut', 'health_monitor');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showMonitoringDashboard, showPerformanceDashboard, showHealthMonitor, trackUserInteraction]);

  return (
    <>
      {/* PWA Status Components */}
      <PWAStatus
        isOnline={pwStatus.isOnline}
        isUpdateAvailable={pwStatus.isUpdateAvailable}
        canInstall={pwStatus.canInstall}
        onInstall={pwStatus.installPWA}
        onUpdate={pwStatus.updateServiceWorker}
        onRequestNotifications={pwStatus.requestNotificationPermission}
      />

      {/* Health Monitor */}
      <HealthMonitor
        isVisible={showHealthMonitor}
        onToggle={() => setShowHealthMonitor(!showHealthMonitor)}
      />

      {/* Monitoring Dashboard */}
      <MonitoringDashboard
        isVisible={showMonitoringDashboard}
        onClose={() => setShowMonitoringDashboard(false)}
      />

      {/* Performance Dashboard */}
      <PerformanceDashboard
        isVisible={showPerformanceDashboard}
        onClose={() => setShowPerformanceDashboard(false)}
      />

      {/* Keyboard shortcuts help (hidden by default, shown on focus) */}
      <div className="sr-only focus-within:not-sr-only fixed bottom-4 right-4 bg-gray-800 text-white p-3 rounded-lg text-sm z-50">
        <p className="font-medium mb-1">Keyboard Shortcuts:</p>
        <ul className="space-y-1 text-xs">
          <li>Ctrl+Shift+M: Monitoring Dashboard</li>
          <li>Ctrl+Shift+P: Performance Dashboard</li>
          <li>Ctrl+Shift+H: Health Monitor</li>
        </ul>
      </div>
    </>
  );
});

AdminPanels.displayName = 'AdminPanels';

export default AdminPanels;