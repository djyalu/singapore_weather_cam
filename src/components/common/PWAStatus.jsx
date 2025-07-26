import React from 'react';
import PropTypes from 'prop-types';
import {
  Wifi,
  WifiOff,
  Download,
  RefreshCw,
  Smartphone,
  Bell,
  HardDrive,
} from 'lucide-react';

/**
 * PWA Status Component
 * Shows online/offline status, update availability, and install options
 */
const PWAStatus = React.memo(({
  isOnline,
  isUpdateAvailable,
  canInstall,
  onInstall,
  onUpdate,
  onRequestNotifications,
  storageInfo,
}) => {
  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2">
      {/* Online/Offline Status */}
      <div className={`
        px-3 py-2 rounded-lg shadow-lg text-sm font-medium flex items-center space-x-2
        ${isOnline
      ? 'bg-green-100 text-green-800 border border-green-200'
      : 'bg-red-100 text-red-800 border border-red-200'
    }
      `}>
        {isOnline ? (
          <>
            <Wifi className="w-4 h-4" aria-hidden="true" />
            <span>Online</span>
          </>
        ) : (
          <>
            <WifiOff className="w-4 h-4" aria-hidden="true" />
            <span>Offline</span>
          </>
        )}
      </div>

      {/* Update Available */}
      {isUpdateAvailable && (
        <div className="bg-blue-100 text-blue-800 border border-blue-200 px-3 py-2 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2 mb-2">
            <RefreshCw className="w-4 h-4" aria-hidden="true" />
            <span className="text-sm font-medium">Update Available</span>
          </div>
          <button
            onClick={onUpdate}
            className="bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-colors"
            aria-label="Update application"
          >
            Update Now
          </button>
        </div>
      )}

      {/* Install PWA */}
      {canInstall && (
        <div className="bg-purple-100 text-purple-800 border border-purple-200 px-3 py-2 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Smartphone className="w-4 h-4" aria-hidden="true" />
            <span className="text-sm font-medium">Install App</span>
          </div>
          <p className="text-xs mb-2 text-purple-700">
            Add to home screen for better experience
          </p>
          <button
            onClick={onInstall}
            className="bg-purple-600 text-white px-3 py-1 rounded text-xs hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-1 transition-colors"
            aria-label="Install Progressive Web App"
          >
            <Download className="w-3 h-3 inline mr-1" aria-hidden="true" />
            Install
          </button>
        </div>
      )}

      {/* Storage Information */}
      {storageInfo && storageInfo.usagePercentage > 80 && (
        <div className="bg-orange-100 text-orange-800 border border-orange-200 px-3 py-2 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2 mb-1">
            <HardDrive className="w-4 h-4" aria-hidden="true" />
            <span className="text-sm font-medium">Storage</span>
          </div>
          <p className="text-xs text-orange-700">
            {storageInfo.usagePercentage}% used
          </p>
        </div>
      )}

      {/* Notification Permission */}
      {onRequestNotifications && 'Notification' in window && Notification.permission === 'default' && (
        <div className="bg-indigo-100 text-indigo-800 border border-indigo-200 px-3 py-2 rounded-lg shadow-lg">
          <div className="flex items-center space-x-2 mb-2">
            <Bell className="w-4 h-4" aria-hidden="true" />
            <span className="text-sm font-medium">Notifications</span>
          </div>
          <p className="text-xs mb-2 text-indigo-700">
            Get weather alerts
          </p>
          <button
            onClick={onRequestNotifications}
            className="bg-indigo-600 text-white px-3 py-1 rounded text-xs hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1 transition-colors"
            aria-label="Enable notifications"
          >
            Enable
          </button>
        </div>
      )}
    </div>
  );
});

PWAStatus.propTypes = {
  isOnline: PropTypes.bool.isRequired,
  isUpdateAvailable: PropTypes.bool,
  canInstall: PropTypes.bool,
  onInstall: PropTypes.func,
  onUpdate: PropTypes.func,
  onRequestNotifications: PropTypes.func,
  storageInfo: PropTypes.shape({
    quota: PropTypes.number,
    usage: PropTypes.number,
    usagePercentage: PropTypes.number,
  }),
};

PWAStatus.displayName = 'PWAStatus';

export default PWAStatus;