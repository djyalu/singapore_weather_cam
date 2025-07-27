import React, { useState, useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import { Camera, Clock, Wifi, CheckCircle, RefreshCw, Menu, X } from 'lucide-react';

const Header = React.memo(({ systemStats = {} }) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');

  // Memoized event handlers
  const handleOnline = useCallback(() => {
    setIsOnline(true);
    console.log('Network connection restored');
  }, []);

  const handleOffline = useCallback(() => {
    setIsOnline(false);
    console.warn('Network connection lost');
  }, []);

  const toggleMenu = useCallback(() => {
    setIsMenuOpen(prev => !prev);
  }, []);

  const closeMenu = useCallback(() => {
    setIsMenuOpen(false);
  }, []);

  const handleNavClick = useCallback((e, target) => {
    e.preventDefault();
    const element = document.querySelector(target);
    if (element) {
      // Get header height for offset calculation
      const header = document.querySelector('header');
      const headerHeight = header ? header.offsetHeight : 0;
      const statusBarHeight = 44; // Status bar height
      const offset = headerHeight + statusBarHeight + 20; // Extra padding

      // Calculate scroll position with offset
      const elementPosition = element.offsetTop - offset;

      // Smooth scroll with offset
      window.scrollTo({
        top: elementPosition,
        behavior: 'smooth',
      });

      // Update active section
      setActiveSection(target.replace('#', ''));

      // Focus management for accessibility
      setTimeout(() => {
        element.focus({ preventScroll: true });
        element.setAttribute('tabindex', '-1');
      }, 500); // Wait for scroll to complete

      closeMenu();
    }
  }, [closeMenu]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback((e, target) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleNavClick(e, target);
    }
  }, [handleNavClick]);

  // Intersection Observer to track active section
  useEffect(() => {
    const sections = ['map', 'weather', 'analysis', 'webcams', 'traffic'];
    const observers = new Map();

    const observerCallback = (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observerOptions = {
      root: null,
      rootMargin: '-20% 0px -70% 0px', // Trigger when section is 20% from top
      threshold: 0.1,
    };

    sections.forEach((sectionId) => {
      const element = document.getElementById(sectionId);
      if (element) {
        const observer = new IntersectionObserver(observerCallback, observerOptions);
        observer.observe(element);
        observers.set(sectionId, observer);
      }
    });

    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, []);

  useEffect(() => {
    // Use requestAnimationFrame for smooth time updates
    let animationFrameId;
    let lastUpdate = 0;

    const updateTime = (timestamp) => {
      // Update only once per second
      if (timestamp - lastUpdate >= 1000) {
        setCurrentTime(new Date());
        lastUpdate = timestamp;
      }
      animationFrameId = requestAnimationFrame(updateTime);
    };

    animationFrameId = requestAnimationFrame(updateTime);

    // Network status monitoring
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [handleOnline, handleOffline]);

  // Format time with error handling
  const formatTime = useCallback((date) => {
    try {
      return date.toLocaleTimeString('ko-KR');
    } catch (error) {
      console.error('Time formatting error:', error);
      return '--:--:--';
    }
  }, []);

  return (
    <>
      {/* 실시간 상태 표시줄 */}
      <div className="bg-green-500 text-white text-center py-2 text-sm font-medium">
        <div className="flex items-center justify-center space-x-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-400 rounded-full animate-pulse"></div>
            <span>🔴 LIVE • 실시간 분석 중</span>
          </div>
          <span>• 마지막 업데이트: {formatTime(currentTime)}</span>
          <div className="flex items-center space-x-1" role="status" aria-live="polite">
            <Wifi className={`w-4 h-4 ${isOnline ? 'text-white' : 'text-red-300'}`} aria-hidden="true" />
            <span className="text-xs" aria-label={`Network status: ${isOnline ? 'Online' : 'Offline'}`}>
              {isOnline ? 'ONLINE' : 'OFFLINE'}
            </span>
          </div>
        </div>
      </div>

      {/* 메인 헤더 */}
      <header className="bg-white shadow-xl border-b-4 border-blue-500">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="bg-blue-600 p-3 rounded-xl">
                <Camera className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  Singapore Weather Cams
                </h1>
                <p className="text-xl text-gray-600 mt-1">실시간 날씨 모니터링</p>
                <div className="flex items-center mt-2">
                  <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium flex items-center space-x-1">
                    <CheckCircle className="w-4 h-4" />
                    <span>정상 운영</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8" role="navigation" aria-label="Main navigation">
              <a
                href="#map"
                onClick={(e) => handleNavClick(e, '#map')}
                onKeyDown={(e) => handleKeyDown(e, '#map')}
                className={`transition-colors font-medium flex items-center space-x-1 px-3 py-2 rounded-lg ${
                  activeSection === 'map'
                    ? 'text-blue-600 bg-blue-50 border-2 border-blue-200'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
                role="button"
                tabIndex="0"
                aria-current={activeSection === 'map' ? 'page' : undefined}
              >
                <span>🗺️</span>
                <span>Map</span>
              </a>
              <a
                href="#weather"
                onClick={(e) => handleNavClick(e, '#weather')}
                onKeyDown={(e) => handleKeyDown(e, '#weather')}
                className={`transition-colors font-medium flex items-center space-x-1 px-3 py-2 rounded-lg ${
                  activeSection === 'weather'
                    ? 'text-blue-600 bg-blue-50 border-2 border-blue-200'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
                role="button"
                tabIndex="0"
                aria-current={activeSection === 'weather' ? 'page' : undefined}
              >
                <span>🌤️</span>
                <span>Weather</span>
              </a>
              <a
                href="#analysis"
                onClick={(e) => handleNavClick(e, '#analysis')}
                onKeyDown={(e) => handleKeyDown(e, '#analysis')}
                className={`transition-colors font-medium flex items-center space-x-1 px-3 py-2 rounded-lg ${
                  activeSection === 'analysis'
                    ? 'text-blue-600 bg-blue-50 border-2 border-blue-200'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
                role="button"
                tabIndex="0"
                aria-current={activeSection === 'analysis' ? 'page' : undefined}
              >
                <span>🌍</span>
                <span>Analysis</span>
              </a>
              <a
                href="#webcams"
                onClick={(e) => handleNavClick(e, '#webcams')}
                onKeyDown={(e) => handleKeyDown(e, '#webcams')}
                className={`transition-colors font-medium flex items-center space-x-1 px-3 py-2 rounded-lg ${
                  activeSection === 'webcams'
                    ? 'text-blue-600 bg-blue-50 border-2 border-blue-200'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
                role="button"
                tabIndex="0"
                aria-current={activeSection === 'webcams' ? 'page' : undefined}
              >
                <span>📸</span>
                <span>Webcams</span>
              </a>
              <a
                href="#traffic"
                onClick={(e) => handleNavClick(e, '#traffic')}
                onKeyDown={(e) => handleKeyDown(e, '#traffic')}
                className={`transition-colors font-medium flex items-center space-x-1 px-3 py-2 rounded-lg ${
                  activeSection === 'traffic'
                    ? 'text-blue-600 bg-blue-50 border-2 border-blue-200'
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
                role="button"
                tabIndex="0"
                aria-current={activeSection === 'traffic' ? 'page' : undefined}
              >
                <span>🚗</span>
                <span>Traffic</span>
              </a>
            </nav>

            {/* System Stats */}
            <div className="hidden xl:block text-right">
              <div className="bg-gray-50 p-4 rounded-xl border">
                <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                  <Clock className="w-4 h-4" />
                  <span>마지막 업데이트: {systemStats.lastUpdate || '정보 없음'}</span>
                </div>
                <div className="text-xs text-gray-500">
                  <div>📹 {systemStats.totalWebcams || 0}개 웹캠</div>
                </div>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={toggleMenu}
              className="lg:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Toggle navigation menu"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <nav className="lg:hidden mt-6 pt-6 border-t border-gray-200" role="navigation" aria-label="Mobile navigation">
              <div className="space-y-2">
                <a
                  href="#map"
                  onClick={(e) => handleNavClick(e, '#map')}
                  onKeyDown={(e) => handleKeyDown(e, '#map')}
                  className={`block py-3 px-4 rounded-lg transition-colors font-medium flex items-center space-x-2 ${
                    activeSection === 'map'
                      ? 'text-blue-600 bg-blue-50 border-2 border-blue-200'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                  role="button"
                  tabIndex="0"
                  aria-current={activeSection === 'map' ? 'page' : undefined}
                >
                  <span>🗺️</span>
                  <span>Map</span>
                </a>
                <a
                  href="#weather"
                  onClick={(e) => handleNavClick(e, '#weather')}
                  onKeyDown={(e) => handleKeyDown(e, '#weather')}
                  className={`block py-3 px-4 rounded-lg transition-colors font-medium flex items-center space-x-2 ${
                    activeSection === 'weather'
                      ? 'text-blue-600 bg-blue-50 border-2 border-blue-200'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                  role="button"
                  tabIndex="0"
                  aria-current={activeSection === 'weather' ? 'page' : undefined}
                >
                  <span>🌤️</span>
                  <span>Weather</span>
                </a>
                <a
                  href="#analysis"
                  onClick={(e) => handleNavClick(e, '#analysis')}
                  onKeyDown={(e) => handleKeyDown(e, '#analysis')}
                  className={`block py-3 px-4 rounded-lg transition-colors font-medium flex items-center space-x-2 ${
                    activeSection === 'analysis'
                      ? 'text-blue-600 bg-blue-50 border-2 border-blue-200'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                  role="button"
                  tabIndex="0"
                  aria-current={activeSection === 'analysis' ? 'page' : undefined}
                >
                  <span>🌍</span>
                  <span>Analysis</span>
                </a>
                <a
                  href="#webcams"
                  onClick={(e) => handleNavClick(e, '#webcams')}
                  onKeyDown={(e) => handleKeyDown(e, '#webcams')}
                  className={`block py-3 px-4 rounded-lg transition-colors font-medium flex items-center space-x-2 ${
                    activeSection === 'webcams'
                      ? 'text-blue-600 bg-blue-50 border-2 border-blue-200'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                  role="button"
                  tabIndex="0"
                  aria-current={activeSection === 'webcams' ? 'page' : undefined}
                >
                  <span>📸</span>
                  <span>Webcams</span>
                </a>
                <a
                  href="#traffic"
                  onClick={(e) => handleNavClick(e, '#traffic')}
                  onKeyDown={(e) => handleKeyDown(e, '#traffic')}
                  className={`block py-3 px-4 rounded-lg transition-colors font-medium flex items-center space-x-2 ${
                    activeSection === 'traffic'
                      ? 'text-blue-600 bg-blue-50 border-2 border-blue-200'
                      : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                  }`}
                  role="button"
                  tabIndex="0"
                  aria-current={activeSection === 'traffic' ? 'page' : undefined}
                >
                  <span>🚗</span>
                  <span>Traffic</span>
                </a>

                {/* Mobile System Stats */}
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="bg-gray-50 p-4 rounded-xl border">
                    <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                      <Clock className="w-4 h-4" />
                      <span>마지막 업데이트: {systemStats.lastUpdate || '정보 없음'}</span>
                    </div>
                    <div className="text-xs text-gray-500">
                      <div>📹 {systemStats.totalWebcams || 0}개 웹캠</div>
                    </div>
                  </div>
                </div>
              </div>
            </nav>
          )}
        </div>
      </header>
    </>
  );
});

Header.propTypes = {
  systemStats: PropTypes.shape({
    totalWebcams: PropTypes.number,
    lastUpdate: PropTypes.string,
    totalProcessingTime: PropTypes.string,
    averageConfidence: PropTypes.number,
  }),
};

Header.displayName = 'Header';

export default Header;