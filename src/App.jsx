import React, { useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import AppDataProvider from './contexts/AppDataContext';
import AppLayout from './components/layout/AppLayout';
import HeroSection from './components/sections/HeroSection';
import MapSection from './components/sections/MapSection';
import AnalysisSection from './components/sections/AnalysisSection';
import WebcamSection from './components/sections/WebcamSection';
import TrafficSection from './components/sections/TrafficSection';
import AdminPanels from './components/admin/AdminPanels';
import PerformanceOptimizer from './components/performance/PerformanceOptimizer';
import LoadingScreen from './components/common/LoadingScreen';
import { initializeAccessibility } from './utils/accessibility';
import { initializeSecurity } from './utils/security';
import { useAppMetrics, useAppData } from './contexts/AppDataContext';
import '../src/styles/performance-animations.css';
import '../src/styles/accessibility.css';
import '../src/styles/performance.css';

/**
 * Main App Content Component
 * Renders the core application sections with data context integration
 */
const AppContent = React.memo(() => {
  const { isInitialLoading, error } = useAppData(context => ({
    isInitialLoading: context.loading.isInitialLoading,
    error: context.error.error,
  }));
  const { trackPageView } = useAppMetrics();

  // Initialize accessibility and security features
  useEffect(() => {
    initializeAccessibility();
    initializeSecurity();

    // Initialize axe-core for development accessibility testing
    if (process.env.NODE_ENV === 'development') {
      import('@axe-core/react').then((axe) => {
        axe.default(React, ReactDOM, 1000);
      }).catch((error) => {
        console.warn('Failed to load axe-core for accessibility testing:', error);
      });
    }

    // Track initial page view
    trackPageView(window.location.pathname, {
      type: 'app_load',
    });
  }, [trackPageView]);

  if (isInitialLoading) {
    return <LoadingScreen />;
  }

  if (error && !error.retryable) {
    return (
      <AppLayout>
        <div className="min-h-screen bg-red-50 flex items-center justify-center" role="alert">
          <div className="text-center p-8 max-w-md">
            <div className="text-6xl mb-4" role="img" aria-label="Error">⚠️</div>
            <h1 className="text-2xl font-bold text-red-800 mb-4">Data Loading Error</h1>
            <p className="text-red-600 mb-4">{error.message || 'Unable to load data'}</p>
            <p className="text-sm text-gray-600 mb-4">
              Please check your internet connection and try again.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      {/* Core application sections */}
      <HeroSection />
      <MapSection />
      <AnalysisSection />
      <WebcamSection />
      <TrafficSection />
      
      {/* Admin panels and monitoring */}
      <AdminPanels />
      
      {/* Performance optimization component */}
      <PerformanceOptimizer />
    </AppLayout>
  );
});

AppContent.displayName = 'AppContent';

/**
 * Main App Component with Context Provider
 * Provides centralized data management and performance optimization
 */
const App = React.memo(() => {
  return (
    <AppDataProvider refreshInterval={5 * 60 * 1000}>
      <AppContent />
    </AppDataProvider>
  );
});

App.displayName = 'App';

export default App;