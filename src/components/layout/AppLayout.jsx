import React, { Suspense } from 'react';
import ErrorBoundary from '../common/ErrorBoundary';
import Header from './Header';
import SystemFooter from './SystemFooter';
import SystemStatus from '../common/SystemStatus';
import LoadingScreen from '../common/LoadingScreen';
import ScrollProgress from '../navigation/ScrollProgress';
import { useSystemStatus } from '../../contexts/AppDataContext';

/**
 * Main Application Layout Component
 * Handles overall page structure and accessibility features
 */
const AppLayout = React.memo(({ children }) => {
  const {
    systemStats,
    lastFetch,
    reliabilityMetrics,
    isRefreshing,
    error,
    refresh,
    forceRefresh,
  } = useSystemStatus();

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        {/* Scroll progress indicator */}
        <ScrollProgress />

        {/* Skip to main content link for keyboard users */}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-blue-600 text-white px-4 py-2 rounded z-50 transition-all duration-200"
        >
          Skip to main content
        </a>

        {/* Header with system stats */}
        <Header systemStats={systemStats} />

        {/* System Status - Compact at top with refresh controls */}
        <SystemStatus
          lastFetch={lastFetch}
          reliabilityMetrics={reliabilityMetrics}
          error={error}
          isRefreshing={isRefreshing}
          onRefresh={refresh}
          onForceRefresh={forceRefresh}
        />

        {/* Main content area */}
        <main 
          id="main" 
          className="max-w-7xl mx-auto px-2 sm:px-4 pb-6 sm:pb-8" 
          role="main" 
          tabIndex="-1"
        >
          <Suspense fallback={<LoadingScreen />}>
            {children}
          </Suspense>
        </main>

        {/* Footer with system stats */}
        <SystemFooter systemStats={systemStats} />
      </div>
    </ErrorBoundary>
  );
});

AppLayout.displayName = 'AppLayout';

export default AppLayout;