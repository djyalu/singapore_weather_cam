import React, { Suspense, useRef, useEffect, useState } from 'react';
import ErrorBoundary from '../common/ErrorBoundary';
import Header from './Header';
import SystemFooter from './SystemFooter';
import SystemStatus from '../common/SystemStatus';
import LoadingScreen from '../common/LoadingScreen';
import ScrollProgress from '../navigation/ScrollProgress';
import DataSyncGuide from '../common/DataSyncGuide';
import WeatherAlertTicker from '../common/WeatherAlertTicker';
import { useSystemStatus } from '../../contexts/AppDataContextSimple';
import { usePullToRefresh } from '../../hooks/useTouchGestures';

/**
 * Main Application Layout Component
 * Handles overall page structure and accessibility features with mobile-first UX
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

  const containerRef = useRef(null);
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);
  const [showRefreshFeedback, setShowRefreshFeedback] = useState(false);

  // Pull-to-refresh functionality
  const { pullToRefreshProps, setContainerRef } = usePullToRefresh(
    async () => {
      setIsPullRefreshing(true);
      setShowRefreshFeedback(true);

      try {
        await forceRefresh();
        // Show success feedback
        setTimeout(() => {
          setShowRefreshFeedback(false);
        }, 2000);
      } catch (error) {
        console.error('Refresh failed:', error);
        setShowRefreshFeedback(false);
      } finally {
        setIsPullRefreshing(false);
      }
    },
    {
      threshold: 80,
      resistance: 2.5,
      enabled: !isRefreshing && !isPullRefreshing,
    },
  );

  // Set container reference for pull-to-refresh
  useEffect(() => {
    if (containerRef.current) {
      setContainerRef(containerRef.current);
    }
  }, [setContainerRef]);

  return (
    <ErrorBoundary>
      <div
        ref={containerRef}
        className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 transition-transform duration-300 ease-out"
        {...pullToRefreshProps}
      >
        {/* Pull-to-refresh feedback */}
        {showRefreshFeedback && (
          <div className="fixed top-0 left-0 right-0 z-50 bg-green-500 text-white text-center py-2 text-sm font-medium">
            <div className="flex items-center justify-center space-x-2">
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <span>Refreshing data...</span>
            </div>
          </div>
        )}

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
        <Header
          systemStats={systemStats}
          onRefresh={refresh}
          onForceRefresh={forceRefresh}
          isRefreshing={isRefreshing}
          lastUpdate={lastFetch}
        />

        {/* 실시간 기상 경보 티커 */}
        <WeatherAlertTicker
          refreshInterval={300000} // 5분마다 업데이트
          className="animate-ticker-fade"
        />

        {/* 초간소화된 시스템 상태 */}
        <SystemStatus
          lastFetch={lastFetch}
          error={error}
          isRefreshing={isRefreshing || isPullRefreshing}
        />


        {/* Main content area with mobile-optimized spacing for maximum information density */}
        <main
          id="main"
          className="max-w-7xl mx-auto px-2 xs:px-3 sm:px-4 lg:px-6 pb-6 sm:pb-8 lg:pb-10 safe-bottom"
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